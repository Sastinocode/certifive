import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Download, 
  Upload, 
  Image, 
  Eye, 
  Trash2, 
  Plus,
  Calendar,
  User,
  MapPin,
  FileCheck,
  Camera,
  File,
  Send,
  Mail,
  MessageCircle,
  CreditCard,
  Banknote,
  Link2,
  CheckCircle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ClientFolderManagerProps {
  folderId: number;
  folderName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Document {
  id: number;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  category: 'certificate' | 'photo' | 'document' | 'other';
}

interface CertificationData {
  id: number;
  ownerName: string;
  ownerDni: string;
  propertyAddress: string;
  cadastralRef: string;
  email: string;
  phone: string;
  energyRating: string;
  status: string;
  createdAt: string;
  rooms: number;
  buildingFloors: number;
  propertyFloors: number;
  facadeOrientation: string;
  windowDetails: string;
  roofType: string;
  heatingSystem: string;
  airConditioningSystem: string;
  waterHeatingType: string;
}

export default function ClientFolderManager({ folderId, folderName, isOpen, onClose }: ClientFolderManagerProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadCategory, setUploadCategory] = useState<'certificate' | 'photo' | 'document' | 'other'>('document');
  const [uploadDescription, setUploadDescription] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'whatsapp' | 'email' | 'direct'>('email');
  const [paymentRequired, setPaymentRequired] = useState<'yes' | 'no'>('no');
  const [shippingMessage, setShippingMessage] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener documentos de la carpeta
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/folders", folderId, "documents"],
    queryFn: async () => {
      const response = await fetch(`/api/folders/${folderId}/documents`);
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
    enabled: isOpen && !!folderId
  });

  // Obtener datos de certificación asociados
  const { data: certificationData, isLoading: certificationLoading } = useQuery({
    queryKey: ["/api/folders", folderId, "certification"],
    queryFn: async () => {
      const response = await fetch(`/api/folders/${folderId}/certification`);
      if (!response.ok) throw new Error("Failed to fetch certification data");
      return response.json();
    },
    enabled: isOpen && !!folderId
  });

  // Subir archivos
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/folders/${folderId}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload files");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders", folderId, "documents"] });
      setShowUploadDialog(false);
      setSelectedFiles(null);
      setUploadDescription('');
      toast({
        title: "Archivos subidos",
        description: "Los archivos se han subido correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al subir los archivos",
        variant: "destructive",
      });
    }
  });

  // Eliminar documento
  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      return await apiRequest("DELETE", `/api/folders/${folderId}/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders", folderId, "documents"] });
      toast({
        title: "Documento eliminado",
        description: "El documento se ha eliminado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al eliminar el documento",
        variant: "destructive",
      });
    }
  });

  const shippingMutation = useMutation({
    mutationFn: async (shippingData: {
      method: string;
      paymentRequired: boolean;
      message: string;
    }) => {
      return await apiRequest("POST", `/api/folders/${folderId}/ship-certificate`, shippingData);
    },
    onSuccess: () => {
      toast({
        title: "Certificado enviado",
        description: "El certificado se ha enviado correctamente al cliente",
      });
      setShippingMessage('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al enviar el certificado",
        variant: "destructive",
      });
    }
  });

  const handleUpload = () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const formData = new FormData();
    Array.from(selectedFiles).forEach(file => {
      formData.append('files', file);
    });
    formData.append('category', uploadCategory);
    formData.append('description', uploadDescription);

    uploadMutation.mutate(formData);
  };

  const handleDownload = (document: Document) => {
    window.open(`/api/folders/${folderId}/documents/${document.id}/download`, '_blank');
  };

  const handleShipping = () => {
    if (!shippingMethod) {
      toast({
        title: "Error",
        description: "Por favor selecciona un método de envío",
        variant: "destructive",
      });
      return;
    }

    shippingMutation.mutate({
      method: shippingMethod,
      paymentRequired: paymentRequired === 'yes',
      message: shippingMessage,
    });
  };

  const getFileIcon = (fileType: string, category: string) => {
    if (category === 'photo' || fileType.startsWith('image/')) {
      return <Image className="w-5 h-5" />;
    }
    if (fileType.includes('pdf')) {
      return <FileText className="w-5 h-5" />;
    }
    if (category === 'certificate') {
      return <FileCheck className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      certificate: "bg-green-100 text-green-800",
      photo: "bg-blue-100 text-blue-800",
      document: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800"
    };
    
    const labels = {
      certificate: "Certificado",
      photo: "Foto",
      document: "Documento",
      other: "Otro"
    };

    return (
      <Badge className={colors[category as keyof typeof colors]}>
        {labels[category as keyof typeof labels]}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const groupedDocuments = documents.reduce((acc: Record<string, Document[]>, doc: Document) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {});

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {folderName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="certification">Certificación</TabsTrigger>
            <TabsTrigger value="photos">Fotos</TabsTrigger>
            <TabsTrigger value="shipping">Envío</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{documents.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Certificados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {groupedDocuments.certificate?.length || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Fotos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {groupedDocuments.photo?.length || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {certificationData && (
              <Card>
                <CardHeader>
                  <CardTitle>Información del Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Propietario</p>
                      <p className="text-sm text-gray-600">{certificationData.ownerName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">DNI</p>
                      <p className="text-sm text-gray-600">{certificationData.ownerDni}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Dirección</p>
                      <p className="text-sm text-gray-600">{certificationData.propertyAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Referencia Catastral</p>
                      <p className="text-sm text-gray-600 font-mono">{certificationData.cadastralRef}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-gray-600">{certificationData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Teléfono</p>
                      <p className="text-sm text-gray-600">{certificationData.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Documentos ({documents.length})</h3>
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Subir Documentos
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Subir Documentos</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="files">Seleccionar Archivos</Label>
                      <Input
                        id="files"
                        type="file"
                        multiple
                        onChange={(e) => setSelectedFiles(e.target.files)}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Categoría</Label>
                      <select
                        id="category"
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value as any)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="document">Documento</option>
                        <option value="certificate">Certificado</option>
                        <option value="photo">Foto</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="description">Descripción (opcional)</Label>
                      <Textarea
                        id="description"
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        placeholder="Descripción del documento..."
                      />
                    </div>
                    <Button 
                      onClick={handleUpload}
                      disabled={!selectedFiles || uploadMutation.isPending}
                      className="w-full"
                    >
                      {uploadMutation.isPending ? "Subiendo..." : "Subir Archivos"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {documents.map((doc: Document) => (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.fileType, doc.category)}
                      <div>
                        <p className="font-medium">{doc.originalName}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {getCategoryBadge(doc.category)}
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>•</span>
                          <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/api/folders/${folderId}/documents/${doc.id}/view`, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {documents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay documentos en esta carpeta</p>
                  <p className="text-sm">Sube algunos documentos para comenzar</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="certification" className="space-y-4">
            {certificationLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando datos de certificación...</p>
              </div>
            ) : certificationData ? (
              <Card>
                <CardHeader>
                  <CardTitle>Datos de Certificación Energética</CardTitle>
                  <CardDescription>
                    Información completa de la certificación energética
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Información del Propietario</h4>
                      <div className="space-y-2">
                        <div>
                          <Label>Nombre Completo</Label>
                          <p className="text-sm">{certificationData.ownerName}</p>
                        </div>
                        <div>
                          <Label>DNI</Label>
                          <p className="text-sm">{certificationData.ownerDni}</p>
                        </div>
                        <div>
                          <Label>Email</Label>
                          <p className="text-sm">{certificationData.email}</p>
                        </div>
                        <div>
                          <Label>Teléfono</Label>
                          <p className="text-sm">{certificationData.phone}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">Información de la Propiedad</h4>
                      <div className="space-y-2">
                        <div>
                          <Label>Dirección</Label>
                          <p className="text-sm">{certificationData.propertyAddress}</p>
                        </div>
                        <div>
                          <Label>Referencia Catastral</Label>
                          <p className="text-sm font-mono">{certificationData.cadastralRef}</p>
                        </div>
                        <div>
                          <Label>Habitaciones</Label>
                          <p className="text-sm">{certificationData.rooms}</p>
                        </div>
                        <div>
                          <Label>Plantas del edificio</Label>
                          <p className="text-sm">{certificationData.buildingFloors}</p>
                        </div>
                        <div>
                          <Label>Plantas de la propiedad</Label>
                          <p className="text-sm">{certificationData.propertyFloors}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Características Técnicas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Orientación de Fachada</Label>
                        <p className="text-sm">{certificationData.facadeOrientation}</p>
                      </div>
                      <div>
                        <Label>Tipo de Cubierta</Label>
                        <p className="text-sm">{certificationData.roofType}</p>
                      </div>
                      <div>
                        <Label>Sistema de Calefacción</Label>
                        <p className="text-sm">{certificationData.heatingSystem}</p>
                      </div>
                      <div>
                        <Label>Sistema de Refrigeración</Label>
                        <p className="text-sm">{certificationData.airConditioningSystem}</p>
                      </div>
                      <div>
                        <Label>Calentamiento de Agua</Label>
                        <p className="text-sm">{certificationData.waterHeatingType}</p>
                      </div>
                      <div>
                        <Label>Calificación Energética</Label>
                        <Badge className="bg-green-100 text-green-800">
                          {certificationData.energyRating || 'Pendiente'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {certificationData.windowDetails && (
                    <div className="space-y-2">
                      <Label>Detalles de Ventanas</Label>
                      <p className="text-sm bg-gray-50 p-3 rounded-md">
                        {certificationData.windowDetails}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay datos de certificación disponibles</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="photos" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Fotos ({(groupedDocuments.photo?.length || 0) + (certificationData?.photos?.length || 0)})
              </h3>
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Camera className="w-4 h-4 mr-2" />
                    Subir Fotos
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Subir Fotos</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="photos">Seleccionar Fotos</Label>
                      <Input
                        id="photos"
                        type="file"
                        multiple
                        onChange={(e) => {
                          setSelectedFiles(e.target.files);
                          setUploadCategory('photo');
                        }}
                        accept=".jpg,.jpeg,.png,.gif"
                      />
                    </div>
                    <div>
                      <Label htmlFor="photoDescription">Descripción</Label>
                      <Textarea
                        id="photoDescription"
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        placeholder="Descripción de las fotos..."
                      />
                    </div>
                    <Button 
                      onClick={handleUpload}
                      disabled={!selectedFiles || uploadMutation.isPending}
                      className="w-full"
                    >
                      {uploadMutation.isPending ? "Subiendo..." : "Subir Fotos"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Fotos del formulario de certificación */}
            {certificationData?.photos && certificationData.photos.length > 0 && (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h4 className="font-medium text-green-700">Fotos del Formulario de Certificación</h4>
                  <p className="text-sm text-gray-600">Fotos subidas por el cliente en el formulario</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {certificationData.photos.map((photoPath: string, index: number) => (
                    <Card key={`form-photo-${index}`} className="overflow-hidden">
                      <div className="aspect-video bg-gray-100 flex items-center justify-center">
                        <img
                          src={`/uploads/${photoPath}`}
                          alt={`Foto ${index + 1} del formulario`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden flex items-center justify-center">
                          <Image className="w-8 h-8 text-gray-400" />
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium">Foto del formulario {index + 1}</p>
                        <p className="text-xs text-gray-500">Subida por el cliente</p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/uploads/${photoPath}`, '_blank')}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = `/uploads/${photoPath}`;
                              a.download = `foto-formulario-${index + 1}.jpg`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Descargar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Fotos adicionales subidas manualmente */}
            {groupedDocuments.photo && groupedDocuments.photo.length > 0 && (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h4 className="font-medium text-blue-700">Fotos Adicionales</h4>
                  <p className="text-sm text-gray-600">Fotos subidas adicionalmente por el certificador</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedDocuments.photo?.map((photo: Document) => (
                    <Card key={photo.id} className="overflow-hidden">
                      <div className="aspect-video bg-gray-100 flex items-center justify-center">
                        <img
                          src={`/api/folders/${folderId}/documents/${photo.id}/view`}
                          alt={photo.originalName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden">
                          <Image className="w-8 h-8 text-gray-400" />
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium truncate">{photo.originalName}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(photo.fileSize)} • {new Date(photo.uploadedAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-1 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(photo)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/api/folders/${folderId}/documents/${photo.id}/view`, '_blank')}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(photo.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Mensaje cuando no hay fotos */}
            {(!certificationData?.photos || certificationData.photos.length === 0) && 
             (!groupedDocuments.photo || groupedDocuments.photo.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay fotos en esta carpeta</p>
                <p className="text-sm">Sube algunas fotos para comenzar</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="shipping" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Envío Manual del Certificado
                  </CardTitle>
                  <CardDescription>
                    Configura el envío del certificado final al cliente con diferentes opciones de pago y entrega
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Payment requirement section */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">¿Requiere pago previo?</Label>
                    <RadioGroup
                      value={paymentRequired}
                      onValueChange={(value: 'yes' | 'no') => setPaymentRequired(value)}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="payment-yes" />
                        <Label htmlFor="payment-yes" className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Sí, generar enlace de pago
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="payment-no" />
                        <Label htmlFor="payment-no" className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          No, ya pagado (transferencia/efectivo)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Payment method explanation */}
                  {paymentRequired === 'yes' && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Link2 className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Enlace de Pago</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Se generará un enlace de pago seguro que el cliente deberá completar antes de poder descargar el certificado.
                      </p>
                    </div>
                  )}

                  {paymentRequired === 'no' && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Banknote className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">Pago Completado</span>
                      </div>
                      <p className="text-sm text-green-700">
                        El certificado se enviará directamente sin requisitos de pago adicionales.
                      </p>
                    </div>
                  )}

                  {/* Shipping method selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Método de Envío</Label>
                    <Select value={shippingMethod} onValueChange={(value: 'whatsapp' | 'email' | 'direct') => setShippingMethod(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el método de envío" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Envío por Email
                          </div>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Envío por WhatsApp
                          </div>
                        </SelectItem>
                        <SelectItem value="direct">
                          <div className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Entrega Directa
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Method-specific information */}
                  {shippingMethod === 'email' && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">Envío por Email</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {paymentRequired === 'yes' 
                          ? 'Se enviará un email con el enlace de pago. Una vez completado, el cliente recibirá el certificado.'
                          : 'Se enviará el certificado directamente por email al cliente.'
                        }
                      </p>
                    </div>
                  )}

                  {shippingMethod === 'whatsapp' && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Envío por WhatsApp</span>
                      </div>
                      <p className="text-sm text-green-600">
                        {paymentRequired === 'yes'
                          ? 'Se enviará un mensaje de WhatsApp con el enlace de pago. Una vez completado, el cliente recibirá el certificado.'
                          : 'Se enviará el certificado directamente por WhatsApp al cliente.'
                        }
                      </p>
                    </div>
                  )}

                  {shippingMethod === 'direct' && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Download className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">Entrega Directa</span>
                      </div>
                      <p className="text-sm text-orange-600">
                        {paymentRequired === 'yes'
                          ? 'Se proporcionará un enlace de pago para entrega presencial o coordinada.'
                          : 'Entrega directa sin procesamiento de pago online.'
                        }
                      </p>
                    </div>
                  )}

                  {/* Custom message */}
                  <div className="space-y-2">
                    <Label htmlFor="shipping-message">Mensaje Personalizado (Opcional)</Label>
                    <Textarea
                      id="shipping-message"
                      placeholder="Añade un mensaje personalizado para el cliente..."
                      value={shippingMessage}
                      onChange={(e) => setShippingMessage(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleShipping}
                      disabled={shippingMutation.isPending}
                      className="flex-1"
                    >
                      {shippingMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {paymentRequired === 'yes' ? 'Enviar con Enlace de Pago' : 'Enviar Certificado'}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Client information reminder */}
              {certificationData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Información de Contacto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Cliente:</span>
                        <p>{certificationData.ownerName}</p>
                      </div>
                      <div>
                        <span className="font-medium">Email:</span>
                        <p>{certificationData.email}</p>
                      </div>
                      <div>
                        <span className="font-medium">Teléfono:</span>
                        <p>{certificationData.phone}</p>
                      </div>
                      <div>
                        <span className="font-medium">Dirección:</span>
                        <p>{certificationData.propertyAddress}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}