import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CloudUpload, Image, Trash2 } from "lucide-react";

interface FileUploadProps {
  certificationId?: string;
  onUploadComplete: (photos: string[]) => void;
  existingPhotos: string[];
}

export default function FileUpload({ certificationId, onUploadComplete, existingPhotos }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      if (!certificationId) {
        throw new Error("ID de certificación requerido");
      }

      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('photos', file);
      });

      const response = await fetch(`/api/certifications/${certificationId}/photos`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Error al subir archivos');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Fotos subidas",
        description: "Las fotografías han sido subidas correctamente.",
      });
      onUploadComplete(data.photos);
      queryClient.invalidateQueries({ queryKey: ["/api/certifications", certificationId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al subir fotos",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Tipo de archivo no válido",
          description: `${file.name} no es un formato válido. Solo se permiten JPG, JPEG y PNG.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "Archivo demasiado grande",
          description: `${file.name} es demasiado grande. Máximo 10MB por archivo.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    const fileList = new DataTransfer();
    validFiles.forEach(file => fileList.items.add(file));

    try {
      await uploadMutation.mutateAsync(fileList.files);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'Archivo';
  };

  return (
    <div className="space-y-4">
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          dragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-primary'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileSelect}
      >
        <CardContent className="p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="space-y-2">
            <CloudUpload className="w-12 h-12 text-gray-400 mx-auto" />
            <div className="text-sm text-gray-600">
              <p>Arrastra y suelta las fotos aquí o</p>
              <Button type="button" variant="link" className="p-0 h-auto text-primary">
                selecciona archivos
              </Button>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG hasta 10MB cada una</p>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {existingPhotos.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-900">Archivos subidos</h5>
          {existingPhotos.map((photo, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center space-x-3">
                <Image className="w-5 h-5 text-primary" />
                <span className="text-sm text-gray-900">{getFileName(photo)}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-800"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement photo removal
                  toast({
                    title: "Función no disponible",
                    description: "La eliminación de fotos estará disponible próximamente.",
                  });
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {uploadMutation.isPending && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Subiendo fotografías...</p>
        </div>
      )}
    </div>
  );
}
