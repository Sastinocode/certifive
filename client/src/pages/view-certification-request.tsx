import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Phone, Mail, MapPin, Home, Zap, Droplets, Wind, Eye, FileImage } from "lucide-react";
import { Link } from "wouter";

interface CertificationRequest {
  id: number;
  fullName: string;
  dni: string;
  email: string;
  phone: string;
  cadastralRef: string;
  status: string;
  createdAt: string;
  rooms: number;
  facadeOrientation: string;
  habitableFloors: number;
  windowDetails: string;
  roofType: string;
  airConditioningSystem: string;
  heatingSystem: string;
  waterHeatingType: string;
  waterHeatingCapacity: number;
  photos: string[] | null;
}

export default function ViewCertificationRequest() {
  const [match, params] = useRoute("/certificacion-request/:id");
  const certificationId = params?.id;

  const { data: certification, isLoading } = useQuery({
    queryKey: ["/api/certifications", certificationId],
    enabled: !!certificationId,
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

  const getHeatingSystemLabel = (system: string) => {
    const labels: Record<string, string> = {
      gas_natural: "Gas Natural",
      electrico: "Eléctrico",
      bomba_calor: "Bomba de Calor",
      carbon: "Carbón",
      biomasa: "Biomasa",
      no: "Sin Calefacción"
    };
    return labels[system] || system;
  };

  const getWaterHeatingLabel = (type: string) => {
    const labels: Record<string, string> = {
      gas: "Gas",
      electrico: "Eléctrico",
      solar: "Solar",
      bomba_calor: "Bomba de Calor",
      no: "Sin Agua Caliente"
    };
    return labels[type] || type;
  };

  const getAirConditioningLabel = (system: string) => {
    const labels: Record<string, string> = {
      split_individual: "Split Individual",
      central: "Sistema Central",
      portatil: "Portátil",
      no: "Sin Aire Acondicionado"
    };
    return labels[system] || system;
  };

  const getRoofTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      plana: "Cubierta Plana",
      inclinada: "Cubierta Inclinada",
      mixta: "Cubierta Mixta"
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!certification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Solicitud no encontrada</h2>
          <Link to="/certificados">
            <Button>Volver a Solicitudes</Button>
          </Link>
        </div>
      </div>
    );
  }

  const cert = certification as CertificationRequest;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/certificados">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Solicitud de Certificación</h1>
              <p className="text-gray-600">ID: {cert.id} • Recibida el {new Date(cert.createdAt).toLocaleDateString('es-ES')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(cert.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Datos del Cliente */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                  <p className="text-lg font-semibold text-gray-900">{cert.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">DNI</label>
                  <p className="text-lg font-semibold text-gray-900">{cert.dni}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Teléfono</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{cert.phone}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{cert.email}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-sm font-medium text-gray-700">Referencia Catastral</label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <p className="text-lg font-mono text-gray-900">{cert.cadastralRef}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la Vivienda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Habitaciones:</span>
                <span className="font-semibold">{cert.rooms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Plantas:</span>
                <span className="font-semibold">{cert.habitableFloors}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Orientación:</span>
                <span className="font-semibold">{cert.facadeOrientation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo de Cubierta:</span>
                <span className="font-semibold">{getRoofTypeLabel(cert.roofType)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalles de la Vivienda */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Detalles de la Vivienda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Detalles de Ventanas</label>
                <p className="text-gray-900 mt-1">{cert.windowDetails}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instalaciones */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Instalaciones Energéticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <h4 className="font-medium">Calefacción</h4>
                </div>
                <p className="text-gray-900">{getHeatingSystemLabel(cert.heatingSystem)}</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <h4 className="font-medium">Agua Caliente</h4>
                </div>
                <p className="text-gray-900">{getWaterHeatingLabel(cert.waterHeatingType)}</p>
                {cert.waterHeatingCapacity && (
                  <p className="text-sm text-gray-600">Capacidad: {cert.waterHeatingCapacity}L</p>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-cyan-500" />
                  <h4 className="font-medium">Aire Acondicionado</h4>
                </div>
                <p className="text-gray-900">{getAirConditioningLabel(cert.airConditioningSystem)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Imágenes */}
        {cert.photos && cert.photos.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                Imágenes de la Propiedad ({cert.photos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {cert.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Imagen ${index + 1} de la propiedad`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(photo, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = photo;
                            link.download = `imagen-${index + 1}.jpg`;
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acciones */}
        <div className="mt-8 flex justify-center">
          <Link to="/certificados">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Solicitudes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}