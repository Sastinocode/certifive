// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import { NotificationModal } from "@/components/notifications/NotificationModal";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import {
  IdCard, Clock, Euro, Users, TrendingUp, TrendingDown,
  Minus, Plus, Eye, Edit, ExternalLink, BarChart2, Zap,
  MessageCircle, Settings, Calendar
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 14) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function pct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function fmtEur(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function fmtMonth(yyyyMM: string) {
  const [y, m] = yyyyMM.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("es-ES", { month: "short" });
}

// ─── interfaces ──────────────────────────────────────────────────────────────

interface DashboardStats {
  byStatus: Record<string, number>;
  activeCertificates: number;
  inProgress: number;
  completedTotal: number;
  monthlyIncome: { current: number; previous: number };
  avgDaysToComplete: number;
  newClientsThisMonth: number;
  newClientsPrevMonth: number;
  monthlyTrend: Array<{ month: string; total: number }>;
  expiringSoon: number;
}

interface RecentCert {
  id: number;
  ownerName: string | null;
  address: string | null;
  cadastralReference: string | null;
  energyRating: string | null;
  status: string;
  createdAt: string;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const diff = pct(current, previous);
  if (diff === null) return <span style={{ fontSize: 12, color: "#94A3B8" }}>Sin datos previos</span>;
  const up = diff >= 0;
  const Icon = diff === 0 ? Minus : up ? TrendingUp : TrendingDown;
  const color = diff === 0 ? "#94A3B8" : up ? "#16A34A" : "#DC2626";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, color, fontWeight: 500 }}>
      <Icon size={12} />
      {diff === 0 ? "Sin cambio" : `${up ? "+" : ""}${diff}% vs mes anterior`}
    </span>
  );
}

function KpiCard({ label, value, sub, icon: Icon, iconColor, accent, trend }: {
  label: string; value: string; sub?: React.ReactNode;
  icon: any; iconColor: string; accent?: boolean; trend?: React.ReactNode;
}) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: "20px 20px 16px",
      border: "1px solid #E2E8F0", borderLeft: accent ? `3px solid ${iconColor}` : "1px solid #E2E8F0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)", position: "relative",
    }}>
      <div style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: 8, background: `${iconColor}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={18} color={iconColor} />
      </div>
      <p style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: "#0F172A", letterSpacing: "-.02em", lineHeight: 1, marginBottom: 6 }}>{value}</p>
      {sub && <div style={{ fontSize: 12, color: "#64748B" }}>{sub}</div>}
      {trend && <div style={{ marginTop: 8 }}>{trend}</div>}
    </div>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pctVal = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, color: "#64748B" }}>{count} <span style={{ color: "#94A3B8", fontSize: 11 }}>({pctVal}%)</span></span>
      </div>
      <div style={{ height: 6, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pctVal}%`, background: color, borderRadius: 4, transition: "width .4s ease" }} />
      </div>
    </div>
  );
}

function MiniTrendChart({ data }: { data: Array<{ month: string; total: number }> }) {
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 56, padding: "0 4px" }}>
      {data.map(d => (
        <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: "100%", background: "#0D7C66",
            height: `${Math.max(4, Math.round((d.total / max) * 48))}px`,
            borderRadius: "3px 3px 0 0", transition: "height .3s ease",
          }} title={`${d.total} cert.`} />
          <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500, whiteSpace: "nowrap" }}>{fmtMonth(d.month)}</span>
        </div>
      ))}
    </div>
  );
}

function EnergyBadge({ rating }: { rating: string | null }) {
  if (!rating) return <span style={{ fontSize: 12, color: "#94A3B8" }}>—</span>;
  const colors: Record<string, { bg: string; color: string }> = {
    A: { bg: "#166534", color: "#fff" }, B: { bg: "#15803d", color: "#fff" },
    C: { bg: "#65a30d", color: "#fff" }, D: { bg: "#ca8a04", color: "#fff" },
    E: { bg: "#ea580c", color: "#fff" }, F: { bg: "#dc2626", color: "#fff" },
    G: { bg: "#7f1d1d", color: "#fff" },
  };
  const c = colors[rating.toUpperCase()] ?? { bg: "#E2E8F0", color: "#334155" };
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: c.bg, color: c.color }}>{rating.toUpperCase()}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    "Nuevo":      { bg: "#dbeafe", color: "#1e40af", label: "Nuevo"      },
    "En Proceso": { bg: "#fef9c3", color: "#854d0e", label: "En Proceso" },
    "Finalizado": { bg: "#dcfce7", color: "#166534", label: "Finalizado" },
  };
  const s = map[status] ?? { bg: "#F1F5F9", color: "#475569", label: status };
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: s.bg, color: s.color }}>{s.label}</span>;
}

// ─── main component ──────────────────────────────────────────────────────────

export default function Dashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { user } = useAuth();
  const displayName = user?.firstName || user?.username?.split("@")[0] || "certificador";
  const [selectedTab, setSelectedTab] = useState("dashboard");

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentRaw = [], isLoading: certsLoading } = useQuery<RecentCert[]>({
    queryKey: ["/api/certifications/recent"],
  });
  const recentCertifications = recentRaw as RecentCert[];

  // Totales para barras
  const totalActive = stats?.activeCertificates ?? 0;
  const nuevo     = stats?.byStatus?.["Nuevo"]       ?? 0;
  const enProceso = stats?.byStatus?.["En Proceso"]  ?? 0;
  const finalizado = stats?.byStatus?.["Finalizado"] ?? 0;
  const archivado = stats?.byStatus?.["Archivado"]   ?? 0;
  const totalAll  = totalActive + archivado;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden px-4 py-3 bg-card border-b border-border">
          <h1 className="text-lg font-semibold text-foreground">CERTIFIVE</h1>
        </div>

        <div className="flex-1 overflow-auto p-6">

          {/* ── Greeting ─────────────────────────────────────────────────────── */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#64748B", marginBottom: 4 }}>{getGreeting()},</p>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", letterSpacing: "-.02em", lineHeight: 1.15, marginBottom: 4 }}>
                {displayName} 👋
              </h2>
              <p style={{ fontSize: 14, color: "#64748B" }}>Aquí tienes el resumen de tu negocio</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationModal />
              <ProfileMenu />
            </div>
          </div>

          {/* ── KPI cards ────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard
              label="Certificados Activos"
              value={statsLoading ? "…" : String(totalActive)}
              icon={IdCard}
              iconColor="#0D7C66"
              accent
              sub={`${finalizado} finalizados · ${archivado} archivados`}
              trend={!statsLoading && stats ? <TrendBadge current={totalActive} previous={0} /> : undefined}
            />
            <KpiCard
              label="Ingresos del Mes"
              value={statsLoading ? "…" : fmtEur(stats?.monthlyIncome?.current ?? 0)}
              icon={Euro}
              iconColor="#0891B2"
              sub={`Mes anterior: ${fmtEur(stats?.monthlyIncome?.previous ?? 0)}`}
              trend={!statsLoading && stats ? <TrendBadge current={stats.monthlyIncome.current} previous={stats.monthlyIncome.previous} /> : undefined}
            />
            <KpiCard
              label="Tiempo Medio CEE"
              value={statsLoading ? "…" : stats?.avgDaysToComplete ? `${stats.avgDaysToComplete}d` : "—"}
              icon={Clock}
              iconColor="#D97706"
              sub="Desde apertura hasta archivo"
            />
            <KpiCard
              label="Clientes Nuevos"
              value={statsLoading ? "…" : String(stats?.newClientsThisMonth ?? 0)}
              icon={Users}
              iconColor="#7C3AED"
              sub={`Mes anterior: ${stats?.newClientsPrevMonth ?? 0}`}
              trend={!statsLoading && stats ? <TrendBadge current={stats.newClientsThisMonth} previous={stats.newClientsPrevMonth} /> : undefined}
            />
          </div>

          {/* ── Analytics row ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

            {/* Status distribution */}
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <BarChart2 size={16} color="#0D7C66" />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Distribución por estado</h3>
              </div>
              {statsLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1,2,3].map(i => <div key={i} style={{ height: 32, background: "#F1F5F9", borderRadius: 6, animation: "pulse 1.5s infinite" }} />)}
                </div>
              ) : (
                <>
                  <StatusBar label="Nuevo"      count={nuevo}      total={totalAll} color="#3B82F6" />
                  <StatusBar label="En Proceso"  count={enProceso}  total={totalAll} color="#F59E0B" />
                  <StatusBar label="Finalizado"  count={finalizado} total={totalAll} color="#10B981" />
                  <StatusBar label="Archivado"   count={archivado}  total={totalAll} color="#94A3B8" />
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F1F5F9", fontSize: 12, color: "#94A3B8", textAlign: "right" }}>
                    Total: {totalAll} expedientes
                  </div>
                </>
              )}
            </div>

            {/* Monthly trend chart */}
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", gridColumn: "span 2" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <TrendingUp size={16} color="#0D7C66" />
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Certificados creados — últimos 6 meses</h3>
                </div>
                <span style={{ fontSize: 12, color: "#94A3B8", display: "flex", alignItems: "center", gap: 4 }}>
                  <Calendar size={12} /> {new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                </span>
              </div>
              {statsLoading || !stats?.monthlyTrend?.length ? (
                <div style={{ height: 80, background: "#F8FAFC", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 13, color: "#94A3B8" }}>{statsLoading ? "Cargando…" : "Sin datos aún"}</span>
                </div>
              ) : (
                <MiniTrendChart data={stats.monthlyTrend} />
              )}
            </div>
          </div>

          {/* ── Quick Actions ─────────────────────────────────────────────────── */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>Acciones Rápidas</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Nueva Certificación", sub: "Crear expediente", color: "#0D7C66", Icon: Plus,          page: "certifications" },
                { label: "Gestión WhatsApp",    sub: "Clientes y conversaciones", color: "#16A34A", Icon: MessageCircle, page: "whatsapp" },
                { label: "Ver Certificados",    sub: "Lista completa",   color: "#0891B2", Icon: IdCard,         page: "certifications" },
                { label: "Configuración",       sub: "Ajustes de cuenta",color: "#D97706", Icon: Settings,       page: "settings"       },
              ].map(({ label, sub, color, Icon, page }) => (
                <button
                  key={label}
                  onClick={() => onNavigate?.(page)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", textAlign: "left", transition: "background .15s" }}
                  onMouseOver={e => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseOut={e => (e.currentTarget.style.background = "#fff")}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={17} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{label}</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 1 }}>{sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Recent Certificates ───────────────────────────────────────────── */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Certificados Recientes</h3>
              <button
                onClick={() => onNavigate?.("certifications")}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#0D7C66", background: "none", border: "1px solid #E2E8F0", borderRadius: 8, padding: "7px 14px", cursor: "pointer", transition: "background .15s" }}
                onMouseOver={e => (e.currentTarget.style.background = "#F8FAFC")}
                onMouseOut={e => (e.currentTarget.style.background = "none")}
              >
                Ver todos <ExternalLink size={13} />
              </button>
            </div>

            {certsLoading ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: "#0D7C66" }} />
                <p style={{ color: "#64748B", fontSize: 14 }}>Cargando…</p>
              </div>
            ) : recentCertifications.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <IdCard style={{ color: "#CBD5E1", width: 48, height: 48, margin: "0 auto 16px" }} />
                <p style={{ color: "#64748B", fontSize: 14, marginBottom: 16 }}>No hay certificaciones aún</p>
                <button
                  onClick={() => onNavigate?.("certifications")}
                  style={{ background: "#0D7C66", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Plus size={15} /> Crear primera certificación
                </button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Propiedad / Propietario", "Calificación", "Estado", "Fecha", "Acciones"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid #F1F5F9", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentCertifications.map(cert => (
                      <tr key={cert.id} style={{ borderBottom: "1px solid #F8FAFC", transition: "background .1s" }}
                        onMouseOver={e => ((e.currentTarget as HTMLElement).style.background = "#FAFAFA")}
                        onMouseOut={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                      >
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{cert.ownerName || "—"}</div>
                          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>{cert.address || cert.cadastralReference || "Sin dirección"}</div>
                        </td>
                        <td style={{ padding: "13px 16px" }}><EnergyBadge rating={cert.energyRating} /></td>
                        <td style={{ padding: "13px 16px" }}><StatusBadge status={cert.status} /></td>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#64748B", whiteSpace: "nowrap" }}>
                          {new Date(cert.createdAt).toLocaleDateString("es-ES")}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => onNavigate?.("certifications")}
                              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, color: "#64748B", background: "none", border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 10px", cursor: "pointer", transition: "background .15s" }}
                              onMouseOver={e => (e.currentTarget.style.background = "#F8FAFC")}
                              onMouseOut={e => (e.currentTarget.style.background = "none")}
                            >
                              <Eye size={12} /> Ver
                            </button>
                            {cert.status !== "Finalizado" && (
                              <button
                                onClick={() => onNavigate?.("certifications")}
                                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, color: "#0D7C66", background: "none", border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 10px", cursor: "pointer", transition: "background .15s" }}
                                onMouseOver={e => (e.currentTarget.style.background = "#F0FDF4")}
                                onMouseOut={e => (e.currentTarget.style.background = "none")}
                              >
                                <Edit size={12} /> Continuar
                              </button>
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
