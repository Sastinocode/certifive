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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import { 
  Building, 
  Plus, 
  Search,
  MapPin,
  Home,
  Layers,
  Folder,
  FolderPlus,
  Archive,
  Building2,
  Upload,
  FileText
} from "lucide-react";
import CertificateManagement from "@/components/certificates/CertificateManagement";
import CertificateUploadDialog from "@/components/certificates/CertificateUploadDialog";

interface Property {
  id: number;
  fullName: string;
  cadastralRef: string;
  floors: number | null;
  rooms: number | null;
  roofType: string | null;
  status: string;
  energyRating: string | null;
  certificationCount: number;
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
  fullName: string;
  cadastralRef: string;
  status: string;
  folderId: number | null;
  energyRating: string | null;
}

export default function Properties() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<number | null | undefined>(undefined);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#059669");
  const [newFolderIcon, setNewFolderIcon] = useState("folder");
  const [activeTab, setActiveTab] = useState<'properties' | 'certificates'>('properties');
  const { toast } = useToast();

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ["/api/certifications"],
  });

  const { data: folders = [] } = useQuery({
    queryKey: ["/api/folders"],
  });

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
        description: "La carpeta se ha creado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la carpeta.",
        variant: "destructive",
      });
    },
  });

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "building":
        return Building;
      case "home":
        return Home;
      case "archive":
        return Archive;
      default:
        return Folder;
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    createFolderMutation.mutate({
      name: newFolderName,
      description: newFolderDescription,
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
    
    // Filter by selected folder
    const matchesFolder = selectedFolder === null ? 
      cert.folderId === null : // Show uncategorized when "all" is selected
      selectedFolder === undefined ? 
        true : // Show all when no specific folder filter
        cert.folderId === selectedFolder;
    
    return matchesSearch && matchesFolder;
  });

  // Group certifications by property (cadastral reference)
  const properties: Property[] = filteredCertifications.reduce((acc: Property[], cert: any) => {
    const existingProperty = acc.find(p => p.cadastralRef === cert.cadastralRef);
    
    if (existingProperty) {
      existingProperty.certificationCount += 1;
      // Update with latest certification data
      if (cert.status === 'completed' && !existingProperty.energyRating) {
        existingProperty.energyRating = cert.energyRating;
        existingProperty.status = cert.status;
      }
    } else {
      acc.push({
        id: cert.id,
        fullName: cert.fullName,
        cadastralRef: cert.cadastralRef,
        floors: cert.floors,
        rooms: cert.rooms,
        roofType: cert.roofType,
        status: cert.status,
        energyRating: cert.energyRating,
        certificationCount: 1
      });
    }
    
    return acc;
  }, []);

  const filteredProperties = properties.filter((property: Property) => {
    return property.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           property.cadastralRef.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getEnergyRatingBadge = (rating: string | null) => {
    if (!rating) return <Badge className="bg-gray-100 text-gray-800">Sin calificar</Badge>;
    
    const ratingClass = `energy-rating energy-rating-${rating.toLowerCase()}`;
    return <Badge className={ratingClass}>{rating}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Certificado</Badge>;
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
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nombre del Cliente</label>
                      <Input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Ej: Inmobiliaria ABC"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Descripción</label>
                      <Input
                        value={newFolderDescription}
                        onChange={(e) => setNewFolderDescription(e.target.value)}
                        placeholder="Descripción opcional"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Color</label>
                        <input
                          type="color"
                          value={newFolderColor}
                          onChange={(e) => setNewFolderColor(e.target.value)}
                          className="w-full h-10 rounded border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Icono</label>
                        <Select value={newFolderIcon} onValueChange={setNewFolderIcon}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="folder">📁 Carpeta</SelectItem>
                            <SelectItem value="building">🏢 Inmobiliaria</SelectItem>
                            <SelectItem value="home">🏠 Viviendas</SelectItem>
                            <SelectItem value="archive">📋 Archivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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
          
          {/* Folders List */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Clientes</h3>
            <div className="space-y-1">
              {(folders as Folder[]).map((folder) => {
                const IconComponent = getIconComponent(folder.icon || "folder");
                return (
                  <Button
                    key={folder.id}
                    variant={selectedFolder === folder.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedFolder(folder.id)}
                  >
                    <IconComponent 
                      className="w-4 h-4 mr-2" 
                      style={{ color: folder.color }}
                    />
                    <span className="truncate">{folder.name}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {getCertificationsInFolder(folder.id)}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedFolder === undefined 
                    ? "Todas las Propiedades"
                    : selectedFolder === null 
                      ? "Propiedades sin cliente"
                      : (folders as Folder[]).find(f => f.id === selectedFolder)?.name || "Propiedades"
                  }
                </h1>
                <p className="text-gray-600 mt-1">
                  {properties.length} propiedad{properties.length !== 1 ? 'es' : ''} 
                  {selectedFolder !== undefined && ` en esta ${selectedFolder === null ? 'categoría' : 'carpeta de cliente'}`}
                </p>
              </div>
              <CertificateUploadDialog 
                folders={folders}
                preselectedFolderId={selectedFolder === null || selectedFolder === undefined ? undefined : selectedFolder}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/uploaded-certificates"] });
                  toast({
                    title: "Certificado subido",
                    description: "El certificado se ha archivado correctamente en la carpeta del cliente",
                  });
                }}
                trigger={
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Certificado
                  </Button>
                }
              />
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por propietario o referencia catastral..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Propiedades</p>
                      <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Home className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Certificadas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {properties.filter(p => p.status === 'completed').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Layers className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">En Proceso</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {properties.filter(p => p.status !== 'completed').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Properties List */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Propiedades ({filteredProperties.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando propiedades...</p>
                </div>
              ) : filteredProperties.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    {searchTerm 
                      ? "No se encontraron propiedades con los criterios de búsqueda" 
                      : "No hay propiedades registradas aún"
                    }
                  </p>

                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProperties.map((property: Property) => (
                    <Card key={property.cadastralRef} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                              <Building className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm">{property.ownerName}</h3>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                {property.cadastralRef}
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(property.status)}
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Calificación Energética</span>
                            {getEnergyRatingBadge(property.energyRating)}
                          </div>

                          {property.floors && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Plantas</span>
                              <span className="text-sm text-gray-900">{property.floors}</span>
                            </div>
                          )}

                          {property.rooms && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Habitaciones</span>
                              <span className="text-sm text-gray-900">{property.rooms}</span>
                            </div>
                          )}

                          {property.roofType && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Tipo de Cubierta</span>
                              <span className="text-sm text-gray-900 capitalize">{property.roofType}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Certificaciones</span>
                            <Badge variant="secondary">{property.certificationCount}</Badge>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              Ver Detalles
                            </Button>
                            {property.status !== 'completed' && (
                              <Link to={`/certificacion/${property.id}`}>
                                <Button size="sm" className="flex-1">
                                  Continuar
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
    </div>
  );
}