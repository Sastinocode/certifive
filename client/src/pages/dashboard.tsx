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
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      completed:  { bg: "#dcfce7", color: "#166534", label: "Completado" },
      in_progress:{ bg: "#fef9c3", color: "#854d0e", label: "En Proceso" },
      draft:      { bg: "#dbeafe", color: "#1e40af", label: "Borrador"   },
      pending:    { bg: "#fee2e2", color: "#991b1b", label: "Pendiente"  },
      Nuevo:      { bg: "#dbeafe", color: "#1e40af", label: "Nuevo"      },
      "En Proceso":{ bg: "#fef9c3", color: "#854d0e", label: "En Proceso"},
      Finalizado: { bg: "#dcfce7", color: "#166534", label: "Finalizado" },
    };
    const s = styles[status];
    if (s) return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: s.bg, color: s.color }}>{s.label}</span>;
    return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: "#F1F5F9", color: "#475569" }}>{status}</span>;
  };

  const getEnergyRatingBadge = (rating: string | null) => {
    if (!rating) return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: "#F1F5F9", color: "#64748B" }}>—</span>;
    const colors: Record<string, { bg: string; color: string }> = {
      A: { bg: "#166534", color: "#fff" }, B: { bg: "#15803d", color: "#fff" },
      C: { bg: "#65a30d", color: "#fff" }, D: { bg: "#ca8a04", color: "#fff" },
      E: { bg: "#ea580c", color: "#fff" }, F: { bg: "#dc2626", color: "#fff" },
      G: { bg: "#7f1d1d", color: "#fff" },
    };
    const c = colors[rating.toUpperCase()] ?? { bg: "#E2E8F0", color: "#334155" };
    return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: c.bg, color: c.color }}>{rating.toUpperCase()}</span>;
  };

  return (
    <div className="flex h-screen" className="bg-background" style={{}}>
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
              <ThemeToggle />
              <NotificationModal />
              <ProfileMenu />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Certificados Activos", value: statsLoading ? "..." : String(stats.activeCertificates || 0), icon: IdCard, iconColor: "#1FA94B", accent: true },
              { label: "En Proceso",           value: statsLoading ? "..." : String(stats.inProgress || 0),          icon: Clock,        iconColor: "#0891B2" },
              { label: "Próximos a Vencer",    value: statsLoading ? "..." : String(stats.expiringSoon || 0),         icon: AlertTriangle, iconColor: "#D97706" },
              { label: "Ingresos del Mes",     value: statsLoading ? "..." : `€${(stats.monthlyIncome || 0).toLocaleString()}`, icon: Euro, iconColor: "#1FA94B" },
            ].map(({ label, value, icon: Icon, iconColor, accent }) => (
              <div key={label} style={{ background: "#fff", border: "1px solid #E2E8F0", borderLeft: accent ? "3px solid #1FA94B" : "1px solid #E2E8F0", borderRadius: 12, padding: "20px", position: "relative", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <div style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: 8, background: `${iconColor}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} color={iconColor} />
                </div>
                <p style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: "#0F1923", letterSpacing: "-.02em", lineHeight: 1 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>Acciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { href: "/certificacion", label: "Nueva Certificación", sub: "Crear certificado", iconBg: "#1FA94B", Icon: Plus },
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
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0F1923" }}>Certificados Recientes</h3>
              <Link href="/certificados">
                <button style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#1FA94B", background: "none", border: "1px solid #E2E8F0", borderRadius: 8, padding: "7px 14px", cursor: "pointer", transition: "background .15s" }}
                  onMouseOver={e => ((e.currentTarget as HTMLElement).style.background = "#F8FAFC")}
                  onMouseOut={e => ((e.currentTarget as HTMLElement).style.background = "none")}>
                  Ver todos
                  <ExternalLink size={13} />
                </button>
              </Link>
            </div>
            {certificationsLoading ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: "#1FA94B" }}></div>
                  <p style={{ color: "#6B7280", fontSize: 14 }}>Cargando certificaciones...</p>
                </div>
              ) : recentCertifications.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <IdCard className="w-12 h-12 mx-auto mb-4" style={{ color: "#CBD5E1" }} />
                  <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 16 }}>No hay certificaciones aún</p>
                  <Link href="/certificacion">
                    <button style={{ background: "#1FA94B", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Plus size={15} />
                      Crear primera certificación
                    </button>
                  </Link>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr className="bg-background" style={{}}>
                        {["Propiedad", "Calificación", "Estado", "Fecha", "Acciones"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentCertifications.map((cert: RecentCertification) => (
                        <tr key={cert.id}
                          style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", transition: "background .1s" }}
                          onMouseOver={e => ((e.currentTarget as HTMLElement).style.background = "#F8FAFC")}
                          onMouseOut={e => ((e.currentTarget as HTMLElement).style.background = "#fff")}>
                          <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>{cert.fullName}</div>
                            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>Ref: {cert.cadastralRef}</div>
                          </td>
                          <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                            {getEnergyRatingBadge(cert.energyRating)}
                          </td>
                          <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                            {getStatusBadge(cert.status)}
                          </td>
                          <td style={{ padding: "14px 16px", whiteSpace: "nowrap", fontSize: 14, color: "#6B7280" }}>
                            {new Date(cert.createdAt).toLocaleDateString('es-ES')}
                          </td>
                          <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 500, color: "#475569", background: "none", border: "1px solid #E2E8F0", borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}>
                                <Eye size={13} /> Ver
                              </button>
                              {cert.status !== 'completed' && (
                                <Link href={`/certificacion/${cert.id}`}>
                                  <button style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 500, color: "#1FA94B", background: "none", border: "1px solid #E2E8F0", borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}>
                                    <Edit size={13} /> Continuar
                                  </button>
                                </Link>
                              )}
                            </div>
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
