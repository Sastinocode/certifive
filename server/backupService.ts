// @ts-nocheck
import { db } from "./db";
import { certifications, folders } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import archiver from "archiver";
import { createWriteStream } from "fs";

export interface BackupConfig {
  enabled: boolean;
  retentionDays: number;
  backupPath: string;
  schedule: string; // Cron expression
}

export class BackupService {
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = config;
  }

  // Create a backup of all user data
  async createBackup(userId: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.config.backupPath, userId, timestamp);
    const backupFile = path.join(this.config.backupPath, userId, `backup-${timestamp}.zip`);

    try {
      // Ensure backup directory exists
      await fs.mkdir(backupDir, { recursive: true });
      await fs.mkdir(path.dirname(backupFile), { recursive: true });

      // Get user's certifications
      const userCertifications = await db
        .select()
        .from(certifications)
        .where(eq(certifications.userId, userId));

      // Get user's folders
      const userFolders = await db
        .select()
        .from(folders)
        .where(eq(folders.userId, userId));

      // Create data export
      const exportData = {
        timestamp: new Date().toISOString(),
        userId,
        certifications: userCertifications,
        folders: userFolders,
        totalCertifications: userCertifications.length,
        totalFolders: userFolders.length
      };

      // Write JSON data file
      const dataFile = path.join(backupDir, 'data.json');
      await fs.writeFile(dataFile, JSON.stringify(exportData, null, 2));

      // Copy associated files
      const filesDir = path.join(backupDir, 'files');
      await fs.mkdir(filesDir, { recursive: true });

      for (const cert of userCertifications) {
        if (cert.photos && Array.isArray(cert.photos)) {
          for (const photo of cert.photos) {
            if (typeof photo === 'string' && photo.startsWith('/uploads/')) {
              const sourcePath = path.join(process.cwd(), photo);
              const fileName = path.basename(photo);
              const destPath = path.join(filesDir, `cert-${cert.id}-${fileName}`);
              
              try {
                await fs.copyFile(sourcePath, destPath);
              } catch (error) {
                console.warn(`Could not backup file ${sourcePath}:`, error);
              }
            }
          }
        }
      }

      // Create ZIP archive
      await this.createZipArchive(backupDir, backupFile);

      // Clean up temporary directory
      await fs.rm(backupDir, { recursive: true });

      // Clean old backups
      await this.cleanOldBackups(userId);

      console.log(`Backup created successfully: ${backupFile}`);
      return backupFile;

    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  // Create ZIP archive from directory
  private async createZipArchive(sourceDir: string, outputFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(outputFile);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`Archive created: ${archive.pointer()} total bytes`);
        resolve();
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  // Clean up old backup files
  private async cleanOldBackups(userId: string): Promise<void> {
    const userBackupDir = path.join(this.config.backupPath, userId);
    
    try {
      const files = await fs.readdir(userBackupDir);
      const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.zip'));
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      for (const file of backupFiles) {
        const filePath = path.join(userBackupDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.log(`Removed old backup: ${file}`);
        }
      }
    } catch (error) {
      console.warn('Error cleaning old backups:', error);
    }
  }

  // Get backup status for user
  async getBackupStatus(userId: string): Promise<{
    enabled: boolean;
    lastBackup: Date | null;
    backupCount: number;
    totalSize: number;
  }> {
    const userBackupDir = path.join(this.config.backupPath, userId);
    
    try {
      const files = await fs.readdir(userBackupDir);
      const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.zip'));
      
      let lastBackup: Date | null = null;
      let totalSize = 0;

      for (const file of backupFiles) {
        const filePath = path.join(userBackupDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        
        if (!lastBackup || stats.mtime > lastBackup) {
          lastBackup = stats.mtime;
        }
      }

      return {
        enabled: this.config.enabled,
        lastBackup,
        backupCount: backupFiles.length,
        totalSize
      };
    } catch (error) {
      return {
        enabled: this.config.enabled,
        lastBackup: null,
        backupCount: 0,
        totalSize: 0
      };
    }
  }

  // List available backups for user
  async listBackups(userId: string): Promise<Array<{
    filename: string;
    date: Date;
    size: number;
  }>> {
    const userBackupDir = path.join(this.config.backupPath, userId);
    
    try {
      const files = await fs.readdir(userBackupDir);
      const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.zip'));
      
      const backups = [];
      for (const file of backupFiles) {
        const filePath = path.join(userBackupDir, file);
        const stats = await fs.stat(filePath);
        
        backups.push({
          filename: file,
          date: stats.mtime,
          size: stats.size
        });
      }

      return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      return [];
    }
  }

  // Restore backup
  async restoreBackup(userId: string, backupFilename: string): Promise<void> {
    // Implementation for restore functionality
    // This would involve extracting the backup and restoring data
    throw new Error('Restore functionality not implemented yet');
  }
}

// Default backup configuration
const defaultBackupConfig: BackupConfig = {
  enabled: true,
  retentionDays: 30,
  backupPath: path.join(process.cwd(), 'backups'),
  schedule: '0 2 * * *' // Daily at 2 AM
};

export const backupService = new BackupService(defaultBackupConfig);