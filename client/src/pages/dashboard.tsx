import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import { 
  IdCard, 
  Clock,
  Calculator,
  Copy, 
  AlertTriangle, 
  Leaf, 
  Plus, 
  Download, 
  Upload,
  Eye,
  Edit,
  MessageCircle,
  Phone,
  Share2,
  Settings,
  Zap,
  Users,
  CheckCircle,
  ExternalLink
} from "lucide-react";

interface DashboardStats {
  activeCertificates: number;
  inProgress: number;
  expiringSoon: number;
  co2Savings: number;
}

interface RecentCertification {
  id: number;
  fullName: string;
  cadastralRef: string;
  energyRating: string | null;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [showWhatsAppConfig, setShowWhatsAppConfig] = useState(false);
  const [whatsappConfig, setWhatsappConfig] = useState({
    businessToken: "",
    phoneNumberId: "",
    businessAccountId: "",
    webhookVerifyToken: "",
    integrationActive: false
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats = {} as DashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentCertifications = [], isLoading: certificationsLoading } = useQuery({
    queryKey: ["/api/certifications/recent"],
  });

  const { data: whatsappStatus } = useQuery({
    queryKey: ["/api/whatsapp/status"],
  });

  const { data: whatsappConversations = [] } = useQuery({
    queryKey: ["/api/whatsapp/conversations"],
  });

  const whatsappConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/whatsapp/configure", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "WhatsApp configurado",
        description: "La integración con WhatsApp Business ha sido configurada correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
      setShowWhatsAppConfig(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo configurar WhatsApp Business.",
        variant: "destructive",
      });
    },
  });

  const createQuoteLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/quote-requests", {});
      return response.json();
    },
    onSuccess: (data) => {
      const link = `${window.location.origin}/presupuesto/${data.uniqueLink}`;
      const whatsappMessage = `Hola! Aquí tienes el enlace para solicitar tu certificación energética: ${link}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappUrl, '_blank');
      toast({
        title: "Enlace generado",
        description: "Se ha abierto WhatsApp con el mensaje y enlace.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo generar el enlace.",
        variant: "destructive",
      });
    },
  });

  const handleWhatsAppConfig = (e: React.FormEvent) => {
    e.preventDefault();
    whatsappConfigMutation.mutate(whatsappConfig);
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

  const getEnergyRatingBadge = (rating: string | null) => {
    if (!rating) return <Badge className="bg-gray-100 text-gray-800">Sin calificar</Badge>;
    
    const ratingClass = `energy-rating energy-rating-${rating.toLowerCase()}`;
    return <Badge className={ratingClass}>{rating}</Badge>;
  };

  return (
    <div className="flex h-screen">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden backdrop-blur-md bg-white/70 border-b border-white/30 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">CertificoEnergia</h1>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Dashboard Energético
            </h2>
            <p className="text-gray-600">Gestiona tus certificaciones energéticas de forma eficiente y sostenible</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="stat-card floating-card">
              <div className="flex items-center">
                <div className="w-14 h-14 energy-gradient-a rounded-xl flex items-center justify-center shadow-lg">
                  <IdCard className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Certificados Activos</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                    {statsLoading ? "..." : stats.activeCertificates || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="stat-card floating-card">
              <div className="flex items-center">
                <div className="w-14 h-14 energy-gradient-b rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En Proceso</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">
                    {statsLoading ? "..." : stats.inProgress || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="stat-card floating-card">
              <div className="flex items-center">
                <div className="w-14 h-14 energy-gradient-c rounded-xl flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Próximos a Vencer</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    {statsLoading ? "..." : stats.expiringSoon || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="stat-card floating-card">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Leaf className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ahorro CO₂ (t)</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {statsLoading ? "..." : stats.co2Savings || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/certificacion">
                <div className="energy-card p-6 cursor-pointer group">
                  <div className="flex items-center">
                    <div className="w-12 h-12 energy-gradient-a rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Nueva Certificación</h4>
                      <p className="text-sm text-gray-600">Crear certificado</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/whatsapp">
                <div className="energy-card p-6 cursor-pointer group bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Gestión WhatsApp</h4>
                      <p className="text-sm text-gray-600">Clientes y conversaciones</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/demo-flujo">
                <div className="energy-card p-6 cursor-pointer group bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Demo Automatizado</h4>
                      <p className="text-sm text-gray-600">Ver flujo completo</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/tarifas">
                <div className="energy-card p-6 cursor-pointer group">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Gestionar Tarifas</h4>
                      <p className="text-sm text-gray-600">Configurar precios</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Public Tariff Generator Section */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Generador Público de Presupuestos</h4>
                    <p className="text-sm text-gray-600">Comparte este enlace con tus clientes para que generen presupuestos automáticamente</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      try {
                        await apiRequest("POST", "/api/create-sample-pricing");
                        toast({
                          title: "Datos de muestra creados",
                          description: "Se han añadido tarifas de ejemplo para probar el generador",
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Error al crear datos de muestra",
                          variant: "destructive",
                        });
                      }
                    }}
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Tarifas Demo
                  </Button>
                  <Button
                    onClick={() => {
                      const url = `${window.location.origin}/generador-tarifas`;
                      navigator.clipboard.writeText(url);
                      toast({
                        title: "Enlace copiado",
                        description: "El enlace del generador de tarifas se ha copiado al portapapeles",
                      });
                    }}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Enlace
                  </Button>
                </div>
              </div>
              <div className="mt-4 bg-white/60 rounded-lg p-3 border">
                <code className="text-sm text-gray-700 break-all">
                  {window.location.origin}/generador-tarifas
                </code>
              </div>
            </div>
          </div>

          {/* Recent Certificates */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Certificados Recientes</h3>
              <Link href="/certificados">
                <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                  Ver todos
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            {certificationsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando certificaciones...</p>
                </div>
              ) : recentCertifications.length === 0 ? (
                <div className="text-center py-8">
                  <IdCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No hay certificaciones aún</p>
                  <Link href="/certificacion">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear primera certificación
                    </Button>
                  </Link>
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
                      {recentCertifications.map((cert: RecentCertification) => (
                        <tr key={cert.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{cert.fullName}</div>
                            <div className="text-sm text-gray-500">Ref: {cert.cadastralRef}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getEnergyRatingBadge(cert.energyRating)}
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
                                  Continuar
                                </Button>
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
