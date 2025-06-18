import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import { 
  IdCard, 
  Plus, 
  Search,
  Download, 
  Eye,
  Edit,
  Filter,
  MoreVertical,
  FileText,
  Sheet,
  File,
  Archive
} from "lucide-react";

interface Certification {
  id: number;
  ownerName: string;
  ownerDni: string;
  propertyAddress: string;
  email: string | null;
  phone: string | null;
  cadastralRef: string;
  energyRating: string | null;
  status: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  folderId: number | null;
  userId: string;
  rooms: number | null;
  facadeOrientation: string | null;
  heatingSystem: string | null;
  waterHeatingType: string | null;
  buildingFloors: number | null;
  propertyFloors: number | null;
  windowDetails: string | null;
  roofType: string | null;
  airConditioningSystem: string | null;
}

export default function Certificates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ["/api/certifications"],
  });

  const downloadReportMutation = useMutation({
    mutationFn: async ({ certificationId, format }: { certificationId: number; format: string }) => {
      const response = await fetch(`/api/certifications/${certificationId}/report/${format}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al generar el reporte');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `certificacion_${certificationId}_${format}.${format === 'pdf' ? 'pdf' : format === 'word' ? 'docx' : 'xlsx'}`;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { filename };
    },
    onSuccess: (data) => {
      toast({
        title: "Reporte generado",
        description: `El archivo ${data.filename} se ha descargado correctamente`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al generar el reporte técnico",
        variant: "destructive",
      });
    },
  });

  const archiveCertificationMutation = useMutation({
    mutationFn: async (certificationId: number) => {
      return await apiRequest("POST", `/api/certifications/${certificationId}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      toast({
        title: "Certificación archivada",
        description: "La certificación se ha movido a la sección Propiedades",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al archivar la certificación",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Borrador</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };



  const filteredCertifications = (certifications as Certification[]).filter((cert: Certification) => {
    const matchesSearch = (cert.ownerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cert.cadastralRef || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || cert.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar selectedTab="certificates" onTabChange={() => {}} />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Solicitudes de Certificación</h1>
              <p className="text-gray-600 mt-1">
                Información recibida de formularios de clientes - {filteredCertifications.length} solicitud{filteredCertifications.length !== 1 ? 'es' : ''}
              </p>
            </div>
            <Link to="/certificacion">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Procesar Nueva Solicitud
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre o referencia catastral..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === "draft" ? "default" : "outline"}
                onClick={() => setStatusFilter("draft")}
                size="sm"
              >
                Borradores
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                onClick={() => setStatusFilter("pending")}
                size="sm"
              >
                Pendientes
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                onClick={() => setStatusFilter("completed")}
                size="sm"
              >
                Completados
              </Button>
            </div>
          </div>

          {/* Certifications List */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Certificados ({filteredCertifications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando certificaciones...</p>
                </div>
              ) : filteredCertifications.length === 0 ? (
                <div className="text-center py-12">
                  <IdCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || statusFilter !== "all" 
                      ? "No se encontraron certificaciones" 
                      : "No hay certificados aún"
                    }
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== "all"
                      ? "Intenta ajustar los filtros de búsqueda"
                      : "Comienza creando tu primera certificación energética"
                    }
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <Link to="/certificacion">
                      <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Crear primer certificado
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Propietario</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Referencia Catastral</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCertifications.map((cert) => (
                        <tr key={cert.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="font-medium text-gray-900">{cert.ownerName}</div>
                            <div className="text-sm text-gray-500">{cert.ownerDni}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600">{cert.cadastralRef}</span>
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(cert.status)}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600">
                              {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link to={`/certificacion-request/${cert.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4 mr-1" />
                                  Ver
                                </Button>
                              </Link>
                              
                              {cert.status === "completed" && (
                                <>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <Download className="w-4 h-4 mr-1" />
                                        Descargar
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => downloadReportMutation.mutate({
                                          certificationId: cert.id,
                                          format: 'pdf'
                                        })}
                                      >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Reporte PDF
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => downloadReportMutation.mutate({
                                          certificationId: cert.id,
                                          format: 'word'
                                        })}
                                      >
                                        <File className="w-4 h-4 mr-2" />
                                        Documento Word
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => downloadReportMutation.mutate({
                                          certificationId: cert.id,
                                          format: 'excel'
                                        })}
                                      >
                                        <Sheet className="w-4 h-4 mr-2" />
                                        Hoja Excel
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => archiveCertificationMutation.mutate(cert.id)}
                                    disabled={archiveCertificationMutation.isPending}
                                  >
                                    <Archive className="w-4 h-4 mr-1" />
                                    Archivar
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}