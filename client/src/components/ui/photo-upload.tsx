import { useRef, useState } from "react";
import { Camera, Upload, X, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PhotoItem {
  id: string;
  dataUrl: string;
  name: string;
}

interface PhotoUploadProps {
  label?: string;
  hint?: string;
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
  maxPhotos?: number;
}

export type { PhotoItem };

export default function PhotoUpload({ label, hint, photos, onChange, maxPhotos = 10 }: PhotoUploadProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = maxPhotos - photos.length;
    const toProcess = Array.from(files).slice(0, remaining);

    toProcess.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newPhoto: PhotoItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          dataUrl,
          name: file.name,
        };
        onChange([...photos, newPhoto]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
  };

  const canAdd = photos.length < maxPhotos;

  return (
    <div className="space-y-3">
      {label && (
        <div>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
        </div>
      )}

      {/* Hidden inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
      />

      {/* Dual action buttons */}
      {canAdd && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50 hover:bg-teal-100 hover:border-teal-500 transition-all duration-150 group"
          >
            <div className="w-10 h-10 rounded-full bg-teal-100 group-hover:bg-teal-200 flex items-center justify-center transition-colors">
              <Camera className="w-5 h-5 text-teal-700" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-teal-800">Hacer foto</p>
              <p className="text-xs text-teal-600">Usar cámara</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-all duration-150 group"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
              <Upload className="w-5 h-5 text-slate-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Cargar foto</p>
              <p className="text-xs text-slate-500">Desde galería</p>
            </div>
          </button>
        </div>
      )}

      {/* Thumbnails */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
          <AnimatePresence>
            {photos.map((photo) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm"
              >
                <img
                  src={photo.dataUrl}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-150" />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {photos.length === 0 && !canAdd && (
        <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-400">
          <ImageIcon className="w-4 h-4" />
          <span className="text-sm">Límite de fotos alcanzado ({maxPhotos})</span>
        </div>
      )}

      {photos.length > 0 && (
        <p className="text-xs text-slate-500 text-right">
          {photos.length} / {maxPhotos} fotos
          {!canAdd && " — límite alcanzado"}
        </p>
      )}
    </div>
  );
}
