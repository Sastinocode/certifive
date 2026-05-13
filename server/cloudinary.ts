import { v2 as cloudinary } from "cloudinary";

// ─────────────────────────────────────────────────────────────────────────────
// Cloudinary — configuración y helpers centralizados
//
// Variables de entorno necesarias (Railway → Variables):
//   CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
//   — O por separado:
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
// ─────────────────────────────────────────────────────────────────────────────

// Si se usa CLOUDINARY_URL, el SDK la lee automáticamente.
// Si se usan las tres vars separadas, hay que configurar manualmente.
if (!process.env.CLOUDINARY_URL && process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// uploadToCloudinary — sube un Buffer a Cloudinary y devuelve la URL y el publicId
// ─────────────────────────────────────────────────────────────────────────────
export interface CloudinaryUploadResult {
  secure_url: string;  // URL pública HTTPS — guardar en campo `path`
  public_id:  string;  // ID para borrar — guardar en campo `nombreArchivo`
}

export function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    resource_type?: "image" | "raw" | "video" | "auto";
    allowed_formats?: string[];
    transformation?: object;
  } = {}
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:        options.folder ?? "certifive",
        resource_type: options.resource_type ?? "auto",
        allowed_formats: options.allowed_formats,
        transformation: options.transformation,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Cloudinary upload failed without error object"));
        }
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// deleteFromCloudinary — borra un archivo de Cloudinary por su public_id
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteFromCloudinary(
  publicId: string,
  resource_type: "image" | "raw" | "video" | "auto" = "auto"
): Promise<void> {
  // "auto" no es un resource_type válido en destroy — intentamos image primero, luego raw
  try {
    if (resource_type === "auto") {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      } catch {
        await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
      }
    } else {
      await cloudinary.uploader.destroy(publicId, { resource_type });
    }
  } catch (err) {
    // No lanzar error — un fallo de borrado no debe romper el flujo del usuario
    console.error(`[Cloudinary] Error borrando ${publicId}:`, err);
  }
}

export { cloudinary };
