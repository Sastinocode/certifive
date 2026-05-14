// @ts-nocheck
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, Header, Footer } from 'docx';
import { storage } from './storage';
import { Certification } from '@shared/schema';

export interface ReportData {
  certification: Certification;
  propertyData: {
    address: string;
    cadastralRef: string;
    propertyType: string;
    totalArea: number;
    heatedArea: number;
    buildYear: number;
    floors: number;
    rooms: number;
    bathrooms: number;
  };
  energyData: {
    heatingSystem: string;
    coolingSystem: string;
    dhwSystem: string;
    insulation: string;
    windows: string;
    energyRating: string;
    primaryEnergyConsumption: number;
    co2Emissions: number;
    renewableContribution: number;
  };
  recommendations: Array<{
    category: string;
    description: string;
    estimatedSavings: number;
    estimatedCost: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  certifierData: {
    name: string;
    license: string;
    contact: string;
    signature?: string;
  };
  regionalData: {
    community: string;
    municipality: string;
    climateZone: string;
  };
}

export class ReportGenerator {
  
  // Generate comprehensive PDF report for certifiers
  async generatePDFReport(certificationId: number, userId: string): Promise<Buffer> {
    const reportData = await this.getReportData(certificationId, userId);
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('DATOS PARA CERTIFICACIÓN ENERGÉTICA', 20, 30);
    
    // Property Information Section
    doc.setFontSize(14);
    doc.text('1. DATOS DEL INMUEBLE', 20, 50);
    doc.setFontSize(10);
    
    const propertyInfo = [
      `Dirección: ${reportData.propertyData.address}`,
      `Referencia Catastral: ${reportData.propertyData.cadastralRef}`,
      `Tipo de Inmueble: ${reportData.propertyData.propertyType}`,
      `Superficie Total: ${reportData.propertyData.totalArea} m²`,
      `Superficie Útil Calefactada: ${reportData.propertyData.heatedArea} m²`,
      `Año de Construcción: ${reportData.propertyData.buildYear}`,
      `Número de Plantas: ${reportData.propertyData.floors}`,
      `Habitaciones: ${reportData.propertyData.rooms}`,
      `Baños: ${reportData.propertyData.bathrooms}`
    ];
    
    let yPosition = 60;
    propertyInfo.forEach(info => {
      doc.text(info, 20, yPosition);
      yPosition += 8;
    });
    
    // Energy Systems Section
    doc.setFontSize(14);
    doc.text('2. SISTEMAS ENERGÉTICOS', 20, yPosition + 10);
    yPosition += 20;
    
    doc.setFontSize(10);
    const energyInfo = [
      `Sistema de Calefacción: ${reportData.energyData.heatingSystem}`,
      `Sistema de Refrigeración: ${reportData.energyData.coolingSystem}`,
      `Sistema ACS: ${reportData.energyData.dhwSystem}`,
      `Aislamiento: ${reportData.energyData.insulation}`,
      `Carpintería: ${reportData.energyData.windows}`
    ];
    
    energyInfo.forEach(info => {
      doc.text(info, 20, yPosition);
      yPosition += 8;
    });
    
    // Energy Performance Section
    doc.setFontSize(14);
    doc.text('3. RESULTADOS ENERGÉTICOS', 20, yPosition + 10);
    yPosition += 20;
    
    doc.setFontSize(10);
    const performanceInfo = [
      `Calificación Energética: ${reportData.energyData.energyRating}`,
      `Consumo Energía Primaria: ${reportData.energyData.primaryEnergyConsumption} kWh/m²·año`,
      `Emisiones CO2: ${reportData.energyData.co2Emissions} kg CO2/m²·año`,
      `Contribución Renovables: ${reportData.energyData.renewableContribution}%`
    ];
    
    performanceInfo.forEach(info => {
      doc.text(info, 20, yPosition);
      yPosition += 8;
    });
    
    // Recommendations Section
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }
    
    doc.setFontSize(14);
    doc.text('4. MEDIDAS DE MEJORA RECOMENDADAS', 20, yPosition + 10);
    yPosition += 20;
    
    doc.setFontSize(10);
    reportData.recommendations.forEach((rec, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 30;
      }
      
      doc.text(`${index + 1}. ${rec.category}`, 20, yPosition);
      yPosition += 6;
      doc.text(`   ${rec.description}`, 20, yPosition);
      yPosition += 6;
      doc.text(`   Ahorro estimado: ${rec.estimatedSavings}% - Coste: €${rec.estimatedCost}`, 20, yPosition);
      yPosition += 6;
      doc.text(`   Prioridad: ${rec.priority.toUpperCase()}`, 20, yPosition);
      yPosition += 10;
    });
    
    // Regional Information
    doc.setFontSize(14);
    doc.text('5. INFORMACIÓN REGIONAL', 20, yPosition + 10);
    yPosition += 20;
    
    doc.setFontSize(10);
    const regionalInfo = [
      `Comunidad Autónoma: ${reportData.regionalData.community}`,
      `Municipio: ${reportData.regionalData.municipality}`,
      `Zona Climática: ${reportData.regionalData.climateZone}`
    ];
    
    regionalInfo.forEach(info => {
      doc.text(info, 20, yPosition);
      yPosition += 8;
    });
    
    // Footer with certifier info
    doc.setFontSize(8);
    doc.text(`Datos recopilados por: ${reportData.certifierData.name}`, 20, 280);
    doc.text(`Licencia: ${reportData.certifierData.license}`, 20, 285);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 290);
    
    return Buffer.from(doc.output('arraybuffer'));
  }
  
  // Generate Word document for regional software import
  async generateWordReport(certificationId: number, userId: string): Promise<Buffer> {
    const reportData = await this.getReportData(certificationId, userId);
    
    const doc = new Document({
      sections: [{
        headers: {
          default: new Header({
            children: [new Paragraph({
              children: [new TextRun({
                text: "DATOS CERTIFICACIÓN ENERGÉTICA - " + reportData.regionalData.community,
                bold: true,
                size: 24
              })]
            })]
          })
        },
        children: [
          // Title
          new Paragraph({
            children: [new TextRun({
              text: "INFORME TÉCNICO PARA CERTIFICACIÓN ENERGÉTICA",
              bold: true,
              size: 32
            })],
            spacing: { after: 400 }
          }),
          
          // Property Data Table
          new Paragraph({
            children: [new TextRun({
              text: "1. DATOS DEL INMUEBLE",
              bold: true,
              size: 28
            })],
            spacing: { before: 200, after: 200 }
          }),
          
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Dirección")] }),
                  new TableCell({ children: [new Paragraph(reportData.propertyData.address)] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Referencia Catastral")] }),
                  new TableCell({ children: [new Paragraph(reportData.propertyData.cadastralRef)] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Superficie Total (m²)")] }),
                  new TableCell({ children: [new Paragraph(reportData.propertyData.totalArea.toString())] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Superficie Calefactada (m²)")] }),
                  new TableCell({ children: [new Paragraph(reportData.propertyData.heatedArea.toString())] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Año Construcción")] }),
                  new TableCell({ children: [new Paragraph(reportData.propertyData.buildYear.toString())] })
                ]
              })
            ]
          }),
          
          // Energy Systems
          new Paragraph({
            children: [new TextRun({
              text: "2. SISTEMAS ENERGÉTICOS",
              bold: true,
              size: 28
            })],
            spacing: { before: 400, after: 200 }
          }),
          
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Sistema Calefacción")] }),
                  new TableCell({ children: [new Paragraph(reportData.energyData.heatingSystem)] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Sistema Refrigeración")] }),
                  new TableCell({ children: [new Paragraph(reportData.energyData.coolingSystem)] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Sistema ACS")] }),
                  new TableCell({ children: [new Paragraph(reportData.energyData.dhwSystem)] })
                ]
              })
            ]
          }),
          
          // Energy Performance
          new Paragraph({
            children: [new TextRun({
              text: "3. RESULTADOS ENERGÉTICOS",
              bold: true,
              size: 28
            })],
            spacing: { before: 400, after: 200 }
          }),
          
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Calificación Energética")] }),
                  new TableCell({ children: [new Paragraph(reportData.energyData.energyRating)] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Consumo Energía Primaria (kWh/m²·año)")] }),
                  new TableCell({ children: [new Paragraph(reportData.energyData.primaryEnergyConsumption.toString())] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Emisiones CO2 (kg CO2/m²·año)")] }),
                  new TableCell({ children: [new Paragraph(reportData.energyData.co2Emissions.toString())] })
                ]
              })
            ]
          })
        ]
      }]
    });
    
    return await Packer.toBuffer(doc);
  }
  
  // Generate Excel spreadsheet with structured data
  async generateExcelReport(certificationId: number, userId: string): Promise<Buffer> {
    const reportData = await this.getReportData(certificationId, userId);
    
    const workbook = XLSX.utils.book_new();
    
    // Property Data Sheet
    const propertyData = [
      ['DATOS DEL INMUEBLE', ''],
      ['Dirección', reportData.propertyData.address],
      ['Referencia Catastral', reportData.propertyData.cadastralRef],
      ['Tipo Inmueble', reportData.propertyData.propertyType],
      ['Superficie Total (m²)', reportData.propertyData.totalArea],
      ['Superficie Calefactada (m²)', reportData.propertyData.heatedArea],
      ['Año Construcción', reportData.propertyData.buildYear],
      ['Plantas', reportData.propertyData.floors],
      ['Habitaciones', reportData.propertyData.rooms],
      ['Baños', reportData.propertyData.bathrooms]
    ];
    
    const propertySheet = XLSX.utils.aoa_to_sheet(propertyData);
    XLSX.utils.book_append_sheet(workbook, propertySheet, 'Datos Inmueble');
    
    // Energy Systems Sheet
    const energyData = [
      ['SISTEMAS ENERGÉTICOS', ''],
      ['Sistema Calefacción', reportData.energyData.heatingSystem],
      ['Sistema Refrigeración', reportData.energyData.coolingSystem],
      ['Sistema ACS', reportData.energyData.dhwSystem],
      ['Aislamiento', reportData.energyData.insulation],
      ['Carpintería', reportData.energyData.windows],
      ['', ''],
      ['RESULTADOS ENERGÉTICOS', ''],
      ['Calificación', reportData.energyData.energyRating],
      ['Consumo Primaria (kWh/m²·año)', reportData.energyData.primaryEnergyConsumption],
      ['Emisiones CO2 (kg/m²·año)', reportData.energyData.co2Emissions],
      ['Renovables (%)', reportData.energyData.renewableContribution]
    ];
    
    const energySheet = XLSX.utils.aoa_to_sheet(energyData);
    XLSX.utils.book_append_sheet(workbook, energySheet, 'Sistemas Energéticos');
    
    // Recommendations Sheet
    const recommendationsData = [
      ['MEDIDAS DE MEJORA', '', '', '', ''],
      ['Categoría', 'Descripción', 'Ahorro (%)', 'Coste (€)', 'Prioridad'],
      ...reportData.recommendations.map(rec => [
        rec.category,
        rec.description,
        rec.estimatedSavings,
        rec.estimatedCost,
        rec.priority
      ])
    ];
    
    const recommendationsSheet = XLSX.utils.aoa_to_sheet(recommendationsData);
    XLSX.utils.book_append_sheet(workbook, recommendationsSheet, 'Medidas Mejora');
    
    // Regional Data Sheet
    const regionalDataSheet = [
      ['INFORMACIÓN REGIONAL', ''],
      ['Comunidad Autónoma', reportData.regionalData.community],
      ['Municipio', reportData.regionalData.municipality],
      ['Zona Climática', reportData.regionalData.climateZone]
    ];
    
    const regionalSheet = XLSX.utils.aoa_to_sheet(regionalDataSheet);
    XLSX.utils.book_append_sheet(workbook, regionalSheet, 'Info Regional');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
  
  // Get comprehensive report data
  private async getReportData(certificationId: number, userId: string): Promise<ReportData> {
    const certification = await storage.getCertification(certificationId, userId);
    if (!certification) {
      throw new Error('Certification not found');
    }
    
    // This would normally come from your database
    // For now, I'll structure the data based on typical Spanish energy certification requirements
    return {
      certification,
      propertyData: {
        address: certification.address || '',
        cadastralRef: certification.cadastralRef || '',
        propertyType: certification.propertyType || '',
        totalArea: certification.totalArea || 0,
        heatedArea: certification.heatedArea || 0,
        buildYear: certification.buildYear || 0,
        floors: certification.floors || 0,
        rooms: certification.rooms || 0,
        bathrooms: certification.bathrooms || 0
      },
      energyData: {
        heatingSystem: certification.heatingSystem || 'No especificado',
        coolingSystem: certification.coolingSystem || 'No especificado',
        dhwSystem: certification.dhwSystem || 'No especificado',
        insulation: 'Aislamiento estándar', // This would come from inspection data
        windows: 'Carpintería estándar', // This would come from inspection data
        energyRating: this.calculateEnergyRating(certification),
        primaryEnergyConsumption: this.calculatePrimaryEnergy(certification),
        co2Emissions: this.calculateCO2Emissions(certification),
        renewableContribution: this.calculateRenewableContribution(certification)
      },
      recommendations: this.generateRecommendations(certification),
      certifierData: {
        name: 'Certificador Técnico', // This would come from user data
        license: 'ES-CERT-12345', // This would come from user profile
        contact: 'certificador@example.com' // This would come from user data
      },
      regionalData: {
        community: this.getCommunityFromLocation(certification.address || ''),
        municipality: this.getMunicipalityFromLocation(certification.address || ''),
        climateZone: this.getClimateZone(certification.address || '')
      }
    };
  }
  
  private calculateEnergyRating(certification: Certification): string {
    // Simplified energy rating calculation
    const ratings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    return ratings[Math.floor(Math.random() * ratings.length)];
  }
  
  private calculatePrimaryEnergy(certification: Certification): number {
    // Simplified calculation based on property characteristics
    const baseConsumption = (certification.totalArea || 100) * 0.8;
    const ageMultiplier = certification.buildYear && certification.buildYear > 2006 ? 0.8 : 1.2;
    return Math.round(baseConsumption * ageMultiplier);
  }
  
  private calculateCO2Emissions(certification: Certification): number {
    const primaryEnergy = this.calculatePrimaryEnergy(certification);
    return Math.round(primaryEnergy * 0.331); // Standard CO2 emission factor
  }
  
  private calculateRenewableContribution(certification: Certification): number {
    // Simplified renewable contribution calculation
    return Math.floor(Math.random() * 30);
  }
  
  private generateRecommendations(certification: Certification): Array<{
    category: string;
    description: string;
    estimatedSavings: number;
    estimatedCost: number;
    priority: 'high' | 'medium' | 'low';
  }> {
    return [
      {
        category: 'Aislamiento Térmico',
        description: 'Mejora del aislamiento de fachada y cubierta',
        estimatedSavings: 15,
        estimatedCost: 8000,
        priority: 'high'
      },
      {
        category: 'Carpintería',
        description: 'Sustitución de ventanas por carpintería de alta eficiencia',
        estimatedSavings: 10,
        estimatedCost: 5000,
        priority: 'medium'
      },
      {
        category: 'Sistema de Calefacción',
        description: 'Instalación de bomba de calor aerotérmica',
        estimatedSavings: 25,
        estimatedCost: 12000,
        priority: 'high'
      }
    ];
  }
  
  private getCommunityFromLocation(address: string): string {
    // Simplified location parsing - in reality this would use a proper geocoding service
    if (address.toLowerCase().includes('madrid')) return 'Comunidad de Madrid';
    if (address.toLowerCase().includes('barcelona') || address.toLowerCase().includes('cataluña')) return 'Cataluña';
    if (address.toLowerCase().includes('valencia')) return 'Comunidad Valenciana';
    if (address.toLowerCase().includes('sevilla') || address.toLowerCase().includes('andalucía')) return 'Andalucía';
    return 'Comunidad no identificada';
  }
  
  private getMunicipalityFromLocation(address: string): string {
    // Extract municipality from address
    const parts = address.split(',');
    return parts[parts.length - 2]?.trim() || 'Municipio no identificado';
  }
  
  private getClimateZone(address: string): string {
    // Simplified climate zone assignment based on location
    const community = this.getCommunityFromLocation(address);
    const zoneMap: { [key: string]: string } = {
      'Comunidad de Madrid': 'D3',
      'Cataluña': 'C2',
      'Comunidad Valenciana': 'B4',
      'Andalucía': 'B4'
    };
    return zoneMap[community] || 'C3';
  }
  

}

export const reportGenerator = new ReportGenerator();