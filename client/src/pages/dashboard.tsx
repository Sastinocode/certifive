// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense } from "react";
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
import { DashboardSkeletons, TableSkeleton } from "@/components/ui/loading-states";
import { NotificationModal } from "@/components/notifications/NotificationModal";
import { ProfileMenu } from "@/components/layout/ProfileMenu";

import { 
  IdCard, 
  Clock,
  Calculator,
  Copy, 
  AlertTriangle, 
  Euro, 
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
  monthlyIncome: number;
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
    <div className="flex h-screen" style={{ background: "#F8FAFC" }}>
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden px-4 py-3" style={{ background: "#fff", borderBottom: "1px solid #E2E8F0" }}>
          <h1 className="text-lg font-semibold" style={{ color: "#0F172A" }}>CERTIFIVE</h1>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: "#0F172A", letterSpacing: "-.02em" }}>
                Dashboard
              </h2>
              <p style={{ fontSize: 14, color: "#64748B" }}>Gestiona tus certificaciones energéticas</p>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationModal />
              <ProfileMenu />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Certificados Activos", value: statsLoading ? "..." : String(stats.activeCertificates || 0), icon: IdCard, iconBg: "#0D7C66" },
              { label: "En Proceso", value: statsLoading ? "..." : String(stats.inProgress || 0), icon: Clock, iconBg: "#0891B2" },
              { label: "Próximos a Vencer", value: statsLoading ? "..." : String(stats.expiringSoon || 0), icon: AlertTriangle, iconBg: "#D97706" },
              { label: "Ingresos Mensuales", value: statsLoading ? "..." : `€${(stats.monthlyIncome || 0).toLocaleString()}`, icon: Euro, iconBg: "#0D7C66" },
            ].map(({ label, value, icon: Icon, iconBg }) => (
              <div key={label} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "20px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={20} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "#64748B", marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", letterSpacing: "-.02em" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "24px", marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>Acciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { href: "/certificacion", label: "Nueva Certificación", sub: "Crear certificado", iconBg: "#0D7C66", Icon: Plus },
                { href: "/whatsapp", label: "Gestión WhatsApp", sub: "Clientes y conversaciones", iconBg: "#16A34A", Icon: MessageCircle },
                { href: "/demo-flujo", label: "Demo Automatizado", sub: "Ver flujo completo", iconBg: "#0891B2", Icon: Zap },
                { href: "/tarifas", label: "Gestionar Tarifas", sub: "Configurar precios", iconBg: "#D97706", Icon: Settings },
              ].map(({ href, label, sub, iconBg, Icon }) => (
                <Link key={href} href={href}>
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: 6, padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "border-color .15s, background .15s" }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = "#F8FAFC"; (e.currentTarget as HTMLElement).style.borderColor = "#CBD5E1"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "#E2E8F0"; }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={18} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{label}</div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 1 }}>{sub}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Certificates */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "24px" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>Certificados Recientes</h3>
              <Link href="/certificados">
                <button style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#0D7C66", background: "none", border: "1px solid #E2E8F0", borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}>
                  Ver todos
                  <ExternalLink size={13} />
                </button>
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
