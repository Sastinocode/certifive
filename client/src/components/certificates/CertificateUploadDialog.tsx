import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface CertificateUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: number;
  folderName: string;
}

export default function CertificateUploadDialog({
  open,
  onOpenChange,
  folderId,
  folderName
}: CertificateUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('certificate', file);
      
      const response = await fetch(`/api/folders/${folderId}/upload-certificate`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Error al subir el certificado');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      toast({
        title: "Certificado subido",
        description: "El certificado final se ha subido correctamente",
      });
      setSelectedFile(null);
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al subir el certificado",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (PDF, DOC, DOCX)
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de archivo no válido",
          description: "Solo se permiten archivos PDF, DOC y DOCX",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Archivo demasiado grande",
          description: "El archivo no puede superar los 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subir Certificado Final</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Carpeta de destino:
            </Label>
            <p className="text-sm font-medium">{folderName}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="certificate-file">Certificado Final</Label>
            <Input
              id="certificate-file"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Formatos permitidos: PDF, DOC, DOCX. Tamaño máximo: 10MB
            </p>
          </div>
          
          {selectedFile && (
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
              <FileText className="w-4 h-4 text-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={uploadMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <>Subiendo...</>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Certificado
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}