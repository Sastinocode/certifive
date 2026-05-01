import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import { SearchFilter } from "@/components/ui/search-filter";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { TableSkeleton } from "@/components/ui/loading-states";
import {
  Archive,
  FileText,
  FolderPlus,
  Folder,
  Upload,
  Eye,
  Download,
  FolderOpen
} from "lucide-react";
import CertificateManagement from "@/components/certificates/CertificateManagement";
import ClientFolderManager from "@/components/ClientFolderManager";
import CertificateUploadDialog from "@/components/certificates/CertificateUploadDialog";

interface Property {
  id: number;
  ownerName: string;
  ownerDni: string;
  propertyAddress: string;
  cadastralRef: string;
  buildingFloors: number | null;
  propertyFloors: number | null;
  rooms: number | null;
  roofType: string | null;
  status: string;
  energyRating: string | null;
  folderId: number | null;
  userId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface Folder {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  userId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface Certification {
  id: number;
  ownerName: string;
  ownerDni: string;
  propertyAddress: string;
  cadastralRef: string;
  status: string;
  folderId: number | null;
  energyRating: string | null;
  userId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export default function Properties() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedFolder, setSelectedFolder] = useState<number | null | undefined>(undefined);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showClientFolder, setShowClientFolder] = useState(false);
  const [currentClientFolderId, setCurrentClientFolderId] = useState<number | null>(null);
  const [currentClientFolderName, setCurrentClientFolderName] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#059669");
  const [newFolderIcon, setNewFolderIcon] = useState("folder");
  const [activeTab, setActiveTab] = useState<'properties' | 'certificates'>('properties');
  const { toast } = useToast();

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ["/api/certifications", "archived"],
    queryFn: async () => {
      const response = await fetch("/api/certifications?status=archived");
      if (!response.ok) {
        throw new Error("Failed to fetch archived certifications");
      }
      return response.json();
    }
  });

  const { data: folders = [] } = useQuery({
    queryKey: ["/api/folders"],
  });

  // Optimized filtering with memoization
  const filteredFolders = useMemo(() => {
    if (!Array.isArray(folders)) return [];
    
    let filtered = folders.filter((folder: any) => {
      const matchesSearch = folder.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           folder.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return folder[key] === value;
      });
      
      return matchesSearch && matchesFilters;
    });
    
    return filtered;
  }, [folders, searchTerm, filters]);

  const filterOptions = [
    {
      key: 'color',
      label: 'Color',
      values: [
        { value: '#059669', label: 'Verde' },
        { value: '#3b82f6', label: 'Azul' },
        { value: '#ef4444', label: 'Rojo' },
        { value: '#f59e0b', label: 'Naranja' },
        { value: '#8b5cf6', label: 'Púrpura' },
      ]
    }
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; color: string; icon: string }) =>
      apiRequest("POST", "/api/folders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setShowCreateFolder(false);
      setNewFolderName("");
      setNewFolderDescription("");
      setNewFolderColor("#059669");
      setNewFolderIcon("folder");
      toast({
        title: "Carpeta creada",
        description: "La carpeta de cliente se ha creado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la carpeta",
        variant: "destructive",
      });
    },
  });

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la carpeta es obligatorio",
        variant: "destructive",
      });
      return;
    }

    createFolderMutation.mutate({
      name: newFolderName.trim(),
      description: newFolderDescription.trim(),
      color: newFolderColor,
      icon: newFolderIcon,
    });
  };

  const getCertificationsInFolder = (folderId: number | null) => {
    return (certifications as Certification[]).filter(cert => cert.folderId === folderId).length;
  };

  const filteredCertifications = (certifications as Certification[]).filter((cert: Certification) => {
    const matchesSearch = (cert.ownerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cert.cadastralRef || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFolder = selectedFolder === null ? 
      cert.folderId === null :
      selectedFolder === undefined ? 
        true :
        cert.folderId === selectedFolder;
    
    return matchesSearch && matchesFolder;
  });

  // Group certifications by property (cadastral reference)
  const properties: Property[] = filteredCertifications.reduce((acc: Property[], cert: any) => {
    const existingProperty = acc.find(p => p.cadastralRef === cert.cadastralRef);
    
    if (existingProperty) {
      if (cert.status === 'completed' && !existingProperty.energyRating) {
        existingProperty.energyRating = cert.energyRating;
        existingProperty.status = cert.status;
      }
    } else {
      acc.push({
        id: cert.id,
        ownerName: cert.ownerName,
        ownerDni: cert.ownerDni,
        propertyAddress: cert.propertyAddress,
        cadastralRef: cert.cadastralRef,
        buildingFloors: cert.buildingFloors,
        propertyFloors: cert.propertyFloors,
        rooms: cert.rooms,
        roofType: cert.roofType,
        status: cert.status,
        energyRating: cert.energyRating,
        folderId: cert.folderId,
        userId: cert.userId,
        createdAt: cert.createdAt,
        updatedAt: cert.updatedAt
      });
    }
    
    return acc;
  }, []);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "folder":
        return Folder;
      case "archive":
        return Archive;
      default:
        return Folder;
    }
  };

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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar selectedTab="properties" onTabChange={() => {}} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header with Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Archivo de Certificados Finales</h1>
          </div>
          <div className="flex space-x-1">
            <Button
              variant={activeTab === 'properties' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('properties')}
              className="flex items-center gap-2"
            >
              <Archive className="h-4 w-4" />
              Archivo de Certificados
            </Button>
            <Button
              variant={activeTab === 'certificates' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('certificates')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Gestión de Subidas
            </Button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'properties' ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Folder Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">Gestión de Clientes</h2>
                  <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <FolderPlus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Crear Nueva Carpeta de Cliente</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <label className="text-sm font-medium">Nombre del Cliente</label>
                          <Input
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Ej: Juan Martínez"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Descripción (opcional)</label>
                          <Input
                            value={newFolderDescription}
                            onChange={(e) => setNewFolderDescription(e.target.value)}
                            placeholder="Información adicional del cliente"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Color</label>
                          <Select value={newFolderColor} onValueChange={setNewFolderColor}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="#059669">Verde</SelectItem>
                              <SelectItem value="#3b82f6">Azul</SelectItem>
                              <SelectItem value="#ef4444">Rojo</SelectItem>
                              <SelectItem value="#f59e0b">Naranja</SelectItem>
                              <SelectItem value="#8b5cf6">Púrpura</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleCreateFolder} disabled={createFolderMutation.isPending}>
                            {createFolderMutation.isPending ? "Creando..." : "Crear Carpeta"}
                          </Button>
                          <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Enhanced Search and Filter for Folders */}
                <SearchFilter
                  searchValue={searchTerm}
                  onSearchChange={setSearchTerm}
                  filters={filterOptions}
                  activeFilters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={clearFilters}
                  placeholder="Buscar carpetas..."
                  className="mb-4"
                />

                {/* All Properties */}
                <Button
                  variant={selectedFolder === undefined ? "default" : "ghost"}
                  className="w-full justify-start mb-2"
                  onClick={() => setSelectedFolder(undefined)}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Todas las propiedades
                  <Badge variant="secondary" className="ml-auto">
                    {properties.length}
                  </Badge>
                </Button>
                
                {/* Uncategorized */}
                <Button
                  variant={selectedFolder === null ? "default" : "ghost"}
                  className="w-full justify-start mb-4"
                  onClick={() => setSelectedFolder(null)}
                >
                  <Folder className="w-4 h-4 mr-2" />
                  Sin cliente asignado
                  <Badge variant="secondary" className="ml-auto">
                    {getCertificationsInFolder(null)}
                  </Badge>
                </Button>
              </div>
              
              {/* Folders List with Enhanced Display */}
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Clientes</h3>
                <div className="space-y-1">
                  {filteredFolders.length > 0 ? (
                    filteredFolders.map((folder) => {
                      const IconComponent = getIconComponent(folder.icon || "folder");
                      return (
                        <Button
                          key={folder.id}
                          variant={selectedFolder === folder.id ? "default" : "ghost"}
                          className="w-full justify-start floating-card"
                          onClick={() => setSelectedFolder(folder.id)}
                        >
                          <IconComponent 
                            className="w-4 h-4 mr-2" 
                            style={{ color: folder.color || '#059669' }}
                          />
                          <span className="truncate">{folder.name}</span>
                          <Badge variant="secondary" className="ml-auto">
                            {getCertificationsInFolder(folder.id)}
                          </Badge>
                        </Button>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No se encontraron carpetas</p>
                      {searchTerm && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          onClick={() => setSearchTerm("")}
                          className="mt-2"
                        >
                          Limpiar búsqueda
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
              {/* Breadcrumb Navigation */}
              <div className="bg-white border-b border-gray-200 px-6 py-3">
                <Breadcrumb
                  items={[
                    { label: "Archivo", href: "#" },
                    { 
                      label: selectedFolder === undefined 
                        ? "Todas las Propiedades"
                        : selectedFolder === null 
                          ? "Sin Cliente"
                          : filteredFolders.find(f => f.id === selectedFolder)?.name || "Propiedades"
                    }
                  ]}
                />
              </div>

              <div className="p-6">
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedFolder === undefined 
                          ? "Todas las Propiedades"
                          : selectedFolder === null 
                            ? "Propiedades sin cliente"
                            : filteredFolders.find(f => f.id === selectedFolder)?.name || "Propiedades"
                        }
                      </h1>
                      <p className="text-gray-600">
                        {properties.length} propiedad{properties.length !== 1 ? 'es' : ''} 
                        {selectedFolder !== undefined && ` en esta ${selectedFolder === null ? 'categoría' : 'carpeta de cliente'}`}
                      </p>
                    </div>
                  </div>

                  {/* Properties Table */}
                  <Card>
                    <CardContent className="p-0">
                      {isLoading ? (
                        <TableSkeleton />
                      ) : properties.length === 0 ? (
                        <div className="text-center py-12">
                          <Archive className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No hay propiedades archivadas
                          </h3>
                          <p className="text-gray-500 mb-6">
                            Los certificados completados aparecerán aquí automáticamente
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full data-table">
                            <thead>
                              <tr>
                                <th>Propietario</th>
                                <th>Referencia Catastral</th>
                                <th>Estado</th>
                                <th>Cliente</th>
                                <th className="text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {properties.map((property) => {
                                const folder = (folders as Folder[]).find(f => f.id === property.folderId);
                                return (
                                  <tr key={property.id}>
                                    <td>
                                      <div className="font-medium text-gray-900">
                                        {property.ownerName}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {property.ownerDni}
                                      </div>
                                    </td>
                                    <td className="text-sm text-gray-900">
                                      {property.cadastralRef}
                                    </td>
                                    <td>
                                      {getStatusBadge(property.status)}
                                    </td>
                                    <td>
                                      {folder ? (
                                        <div className="flex items-center">
                                          <div 
                                            className="w-3 h-3 rounded-full mr-2"
                                            style={{ backgroundColor: folder.color || '#059669' }}
                                          />
                                          <span className="text-sm text-gray-900">{folder.name}</span>
                                        </div>
                                      ) : (
                                        <span className="text-gray-400">Sin asignar</span>
                                      )}
                                    </td>
                                    <td className="text-right">
                                      <div className="flex items-center justify-end space-x-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            if (folder) {
                                              setCurrentClientFolderId(folder.id);
                                              setCurrentClientFolderName(folder.name);
                                              setShowClientFolder(true);
                                            }
                                          }}
                                          className="text-blue-600 hover:text-blue-800"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-green-600 hover:text-green-800"
                                        >
                                          <Download className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Certificate Management Tab
          <div className="flex-1 overflow-hidden p-6">
            <CertificateManagement 
              folders={folders} 
              selectedFolderId={selectedFolder === null || selectedFolder === undefined ? undefined : selectedFolder}
            />
          </div>
        )}
      </div>

      {/* Certificate Upload Dialog */}
      {selectedFolderId && (
        <CertificateUploadDialog 
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          folderId={selectedFolderId}
          folderName={selectedFolderName}
        />
      )}

      {/* Client Folder Manager */}
      <ClientFolderManager
        folderId={currentClientFolderId || 0}
        folderName={currentClientFolderName}
        isOpen={showClientFolder}
        onClose={() => setShowClientFolder(false)}
      />
    </div>
  );
}