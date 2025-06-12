import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  Folder,
  FolderPlus,
  MoreVertical,
  MoveHorizontal,
  Building,
  Home,
  Archive
} from "lucide-react";

interface Certification {
  id: number;
  fullName: string;
  cadastralRef: string;
  energyRating: string | null;
  status: string;
  createdAt: string;
  energyConsumption: string | null;
  co2Emissions: string | null;
  folderId: number | null;
}

interface Folder {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  createdAt: string;
}

export default function Certificates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#3b82f6");
  const [newFolderIcon, setNewFolderIcon] = useState("folder");
  const { toast } = useToast();

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ["/api/certifications"],
  });

  const { data: folders = [] } = useQuery({
    queryKey: ["/api/folders"],
  });

  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; color: string; icon: string }) => {
      return await apiRequest("POST", "/api/folders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setShowCreateFolder(false);
      setNewFolderName("");
      setNewFolderDescription("");
      setNewFolderColor("#3b82f6");
      setNewFolderIcon("folder");
      toast({
        title: "Éxito",
        description: "Carpeta creada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al crear la carpeta",
        variant: "destructive",
      });
    },
  });

  const moveCertificationMutation = useMutation({
    mutationFn: async ({ certificationId, folderId }: { certificationId: number; folderId: number | null }) => {
      return await apiRequest("PUT", `/api/certifications/${certificationId}/move`, { folderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      toast({
        title: "Éxito",
        description: "Certificación movida correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al mover la certificación",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800">En Proceso</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Borrador</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getEnergyRatingBadge = (rating: string | null) => {
    if (!rating) return <Badge className="bg-gray-100 text-gray-800">Sin calificar</Badge>;
    
    const ratingClass = `energy-rating energy-rating-${rating.toLowerCase()}`;
    return <Badge className={ratingClass}>{rating}</Badge>;
  };

  const filteredCertifications = certifications.filter((cert: Certification) => {
    const matchesSearch = cert.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.cadastralRef.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || cert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar selectedTab="certificates" onTabChange={() => {}} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Certificados</h1>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Certificados Energéticos</h2>
                <p className="text-gray-600">Gestiona todos tus certificados de eficiencia energética</p>
              </div>
              <Link href="/certificacion">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Certificado
                </Button>
              </Link>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  Todos
                </Button>
                <Button
                  variant={statusFilter === "draft" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("draft")}
                >
                  Borradores
                </Button>
                <Button
                  variant={statusFilter === "in_progress" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("in_progress")}
                >
                  En Proceso
                </Button>
                <Button
                  variant={statusFilter === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("completed")}
                >
                  Completados
                </Button>
              </div>
            </div>
          </div>

          {/* Certificates List */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Certificados ({filteredCertifications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando certificados...</p>
                </div>
              ) : filteredCertifications.length === 0 ? (
                <div className="text-center py-8">
                  <IdCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== "all" 
                      ? "No se encontraron certificados con los filtros aplicados" 
                      : "No hay certificados aún"
                    }
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <Link href="/certificacion">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Crear primer certificado
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Propiedad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Calificación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Consumo (kWh/m²año)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Emisiones CO₂
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCertifications.map((cert: Certification) => (
                        <tr key={cert.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{cert.fullName}</div>
                            <div className="text-sm text-gray-500">Ref: {cert.cadastralRef}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getEnergyRatingBadge(cert.energyRating)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cert.energyConsumption ? parseFloat(cert.energyConsumption).toFixed(1) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cert.co2Emissions ? `${parseFloat(cert.co2Emissions).toFixed(1)} kg/m²año` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(cert.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(cert.createdAt).toLocaleDateString('es-ES')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            {cert.status !== 'completed' && (
                              <Link href={`/certificacion/${cert.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4 mr-1" />
                                  Editar
                                </Button>
                              </Link>
                            )}
                            {cert.status === 'completed' && (
                              <Button variant="ghost" size="sm" className="text-green-600">
                                <Download className="w-4 h-4 mr-1" />
                                Descargar
                              </Button>
                            )}
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