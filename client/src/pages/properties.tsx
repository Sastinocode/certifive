import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/layout/sidebar";
import { 
  Building, 
  Plus, 
  Search,
  MapPin,
  Home,
  Layers
} from "lucide-react";

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

export default function Properties() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ["/api/certifications"],
  });

  // Group certifications by property (cadastral reference)
  const properties: Property[] = certifications.reduce((acc: Property[], cert: any) => {
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
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Propiedades</h1>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Propiedades Registradas</h2>
                <p className="text-gray-600">Gestiona las propiedades y sus certificaciones energéticas</p>
              </div>
              <Link href="/certificacion">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Propiedad
                </Button>
              </Link>
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
                              <h3 className="font-semibold text-gray-900 text-sm">{property.fullName}</h3>
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
                              <Link href={`/certificacion/${property.id}`}>
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
    </div>
  );
}