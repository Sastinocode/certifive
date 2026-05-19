// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import { NotificationModal } from "@/components/notifications/NotificationModal";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import {
  IdCard, Clock, Euro, Users, TrendingUp, TrendingDown,
  Minus, Plus, Eye, Edit, ExternalLink, BarChart2,
  MessageCircle, Settings, Calendar,
  AlertTriangle, AlertCircle, Bell, FileWarning, CreditCard,
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

type AlertType = "deadline_overdue" | "deadline_soon" | "payment_pending" | "form_pending";
interface CertAlert {
  type: AlertType;
  priority: "high" | "medium" | "low";
  certId: number;
  ownerName: string | null;
  address: string | null;
  daysLeft: number | null;
  message: string;
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
  if (diff === null) return <span className="text-xs text-muted-foreground">Sin datos previos</span>;
  const up = diff >= 0;
  const Icon = diff === 0 ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
      diff === 0
        ? "text-muted-foreground"
        : up
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400"
    }`}>
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
    <div
      className="bg-card rounded-xl p-5 border border-border shadow-sm relative"
      style={accent ? { borderLeftWidth: 3, borderLeftColor: iconColor } : undefined}
    >
      <div
        className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ background: `${iconColor}18` }}
      >
        <Icon size={18} color={iconColor} />
      </div>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-bold text-foreground tracking-tight leading-none mb-1.5">{value}</p>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      {trend && <div className="mt-2">{trend}</div>}
    </div>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pctVal = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-sm text-foreground/80 font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {count} <span className="text-[11px] text-muted-foreground/60">({pctVal}%)</span>
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pctVal}%`, background: color }}
        />
      </div>
    </div>
  );
}

function MiniTrendChart({ data }: { data: Array<{ month: string; total: number }> }) {
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="flex items-end gap-1.5 h-14 px-1">
      {data.map(d => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-[3px] transition-all duration-300"
            style={{ background: "hsl(var(--primary))", height: `${Math.max(4, Math.round((d.total / max) * 48))}px` }}
            title={`${d.total} cert.`}
          />
          <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">{fmtMonth(d.month)}</span>
        </div>
      ))}
    </div>
  );
}

function EnergyBadge({ rating }: { rating: string | null }) {
  if (!rating) return <span className="text-xs text-muted-foreground">—</span>;
  // Energía A-G: colores estándar, mantienen contraste en dark por ser sólidos con texto blanco
  const colors: Record<string, { bg: string }> = {
    A: { bg: "#166534" }, B: { bg: "#15803d" }, C: { bg: "#65a30d" },
    D: { bg: "#ca8a04" }, E: { bg: "#ea580c" }, F: { bg: "#dc2626" },
    G: { bg: "#7f1d1d" },
  };
  const c = colors[rating.toUpperCase()] ?? { bg: "#94A3B8" };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold text-white"
      style={{ background: c.bg }}
    >
      {rating.toUpperCase()}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    "Nuevo":      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "En Proceso": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    "Finalizado": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    "Archivado":  "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cls[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

// ─── alert helpers ───────────────────────────────────────────────────────────

const ALERT_META: Record<AlertType, {
  label: string; Icon: any; iconColor: string;
  rowCls: string; iconBgCls: string; labelCls: string; btnCls: string;
}> = {
  deadline_overdue: {
    label: "Plazo vencido", Icon: AlertTriangle, iconColor: "#DC2626",
    rowCls:    "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40",
    iconBgCls: "bg-red-100 dark:bg-red-900/40",
    labelCls:  "text-red-700 dark:text-red-400",
    btnCls:    "text-red-600 dark:text-red-400 border-red-300 dark:border-red-700/60 hover:bg-red-100 dark:hover:bg-red-900/30",
  },
  deadline_soon: {
    label: "Plazo próximo", Icon: Clock, iconColor: "#D97706",
    rowCls:    "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40",
    iconBgCls: "bg-amber-100 dark:bg-amber-900/40",
    labelCls:  "text-amber-700 dark:text-amber-400",
    btnCls:    "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/30",
  },
  payment_pending: {
    label: "Pago pendiente", Icon: CreditCard, iconColor: "#0891B2",
    rowCls:    "bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40",
    iconBgCls: "bg-cyan-100 dark:bg-cyan-900/40",
    labelCls:  "text-cyan-700 dark:text-cyan-400",
    btnCls:    "text-cyan-600 dark:text-cyan-400 border-cyan-300 dark:border-cyan-700/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/30",
  },
  form_pending: {
    label: "Formulario sin resp.", Icon: FileWarning, iconColor: "#7C3AED",
    rowCls:    "bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40",
    iconBgCls: "bg-violet-100 dark:bg-violet-900/40",
    labelCls:  "text-violet-700 dark:text-violet-400",
    btnCls:    "text-violet-600 dark:text-violet-400 border-violet-300 dark:border-violet-700/60 hover:bg-violet-100 dark:hover:bg-violet-900/30",
  },
};

function AlertRow({ alert, onNavigate }: { alert: CertAlert; onNavigate?: (p: string) => void }) {
  const meta = ALERT_META[alert.type];
  return (
    <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg ${meta.rowCls}`}>
      <div className={`w-8 h-8 rounded-md ${meta.iconBgCls} flex items-center justify-center flex-shrink-0`}>
        <meta.Icon size={15} color={meta.iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`text-[11px] font-bold uppercase tracking-wide ${meta.labelCls}`}>{meta.label}</span>
          {alert.priority === "high" && (
            <span className="text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 rounded px-1.5 py-px">
              URGENTE
            </span>
          )}
        </div>
        <div className="text-[13px] text-foreground font-medium truncate">
          {alert.ownerName || "Sin propietario"}{alert.address ? ` · ${alert.address}` : ""}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{alert.message}</div>
      </div>
      <button
        onClick={() => onNavigate?.("certifications")}
        className={`text-xs font-medium border rounded-md px-2.5 py-1 cursor-pointer whitespace-nowrap flex-shrink-0 transition-colors ${meta.btnCls}`}
      >
        Ver →
      </button>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Nueva Certificación", sub: "Crear expediente",          iconColor: "#0D7C66", Icon: Plus,          page: "certifications" },
  { label: "Gestión WhatsApp",    sub: "Clientes y conversaciones", iconColor: "#16A34A", Icon: MessageCircle, page: "whatsapp"       },
  { label: "Ver Certificados",    sub: "Lista completa",            iconColor: "#0891B2", Icon: IdCard,        page: "certifications" },
  { label: "Configuración",       sub: "Ajustes de cuenta",         iconColor: "#D97706", Icon: Settings,      page: "settings"       },
];

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

  const { data: alertsRaw = [] } = useQuery<CertAlert[]>({
    queryKey: ["/api/dashboard/alerts"],
    refetchInterval: 5 * 60 * 1000,
  });

  const alerts = alertsRaw as CertAlert[];
  const highAlerts = alerts.filter(a => a.priority === "high").length;
  const recentCertifications = recentRaw as RecentCert[];

  const totalActive  = stats?.activeCertificates ?? 0;
  const nuevo        = stats?.byStatus?.["Nuevo"]      ?? 0;
  const enProceso    = stats?.byStatus?.["En Proceso"] ?? 0;
  const finalizado   = stats?.byStatus?.["Finalizado"] ?? 0;
  const archivado    = stats?.byStatus?.["Archivado"]  ?? 0;
  const totalAll     = totalActive + archivado;

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
              <p className="text-[13px] font-medium text-muted-foreground mb-1">{getGreeting()},</p>
              <h2 className="text-[26px] font-bold text-foreground tracking-tight leading-tight mb-1">
                {displayName} 👋
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground">Aquí tienes el resumen de tu negocio</p>
                {alerts.length > 0 && (
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 border ${
                    highAlerts > 0
                      ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/25 border-red-200 dark:border-red-800/40"
                      : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/25 border-amber-200 dark:border-amber-800/40"
                  }`}>
                    <Bell size={11} />
                    {alerts.length} alerta{alerts.length !== 1 ? "s" : ""}
                    {highAlerts > 0 ? ` · ${highAlerts} urgente${highAlerts !== 1 ? "s" : ""}` : ""}
                  </span>
                )}
              </div>
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
              icon={IdCard} iconColor="#0D7C66" accent
              sub={`${finalizado} finalizados · ${archivado} archivados`}
              trend={!statsLoading && stats ? <TrendBadge current={totalActive} previous={0} /> : undefined}
            />
            <KpiCard
              label="Ingresos del Mes"
              value={statsLoading ? "…" : fmtEur(stats?.monthlyIncome?.current ?? 0)}
              icon={Euro} iconColor="#0891B2"
              sub={`Mes anterior: ${fmtEur(stats?.monthlyIncome?.previous ?? 0)}`}
              trend={!statsLoading && stats ? <TrendBadge current={stats.monthlyIncome.current} previous={stats.monthlyIncome.previous} /> : undefined}
            />
            <KpiCard
              label="Tiempo Medio CEE"
              value={statsLoading ? "…" : stats?.avgDaysToComplete ? `${stats.avgDaysToComplete}d` : "—"}
              icon={Clock} iconColor="#D97706"
              sub="Desde apertura hasta archivo"
            />
            <KpiCard
              label="Clientes Nuevos"
              value={statsLoading ? "…" : String(stats?.newClientsThisMonth ?? 0)}
              icon={Users} iconColor="#7C3AED"
              sub={`Mes anterior: ${stats?.newClientsPrevMonth ?? 0}`}
              trend={!statsLoading && stats ? <TrendBadge current={stats.newClientsThisMonth} previous={stats.newClientsPrevMonth} /> : undefined}
            />
          </div>

          {/* ── Analytics row ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

            {/* Status distribution */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <BarChart2 size={16} color="#0D7C66" />
                <h3 className="text-sm font-semibold text-foreground">Distribución por estado</h3>
              </div>
              {statsLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-8 bg-muted rounded-md animate-pulse" />)}
                </div>
              ) : (
                <>
                  <StatusBar label="Nuevo"      count={nuevo}      total={totalAll} color="#3B82F6" />
                  <StatusBar label="En Proceso"  count={enProceso}  total={totalAll} color="#F59E0B" />
                  <StatusBar label="Finalizado"  count={finalizado} total={totalAll} color="#10B981" />
                  <StatusBar label="Archivado"   count={archivado}  total={totalAll} color="#94A3B8" />
                  <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground/60 text-right">
                    Total: {totalAll} expedientes
                  </div>
                </>
              )}
            </div>

            {/* Monthly trend chart */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} color="#0D7C66" />
                  <h3 className="text-sm font-semibold text-foreground">Certificados — últimos 6 meses</h3>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                </span>
              </div>
              {statsLoading || !stats?.monthlyTrend?.length ? (
                <div className="h-20 bg-muted/50 rounded-lg flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">{statsLoading ? "Cargando…" : "Sin datos aún"}</span>
                </div>
              ) : (
                <MiniTrendChart data={stats.monthlyTrend} />
              )}
            </div>
          </div>

          {/* ── Alertas activas ──────────────────────────────────────────────── */}
          {alerts.length > 0 && (
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm mb-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500 dark:text-red-400" />
                  <h3 className="text-sm font-semibold text-foreground">Alertas activas</h3>
                  <span className={`text-xs font-bold text-white rounded-full px-2 py-px ${
                    alerts.some(a => a.priority === "high") ? "bg-red-500" : "bg-amber-500"
                  }`}>
                    {alerts.length}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">Se actualiza cada 5 min</span>
              </div>
              <div className="flex flex-col gap-2">
                {alerts.slice(0, 5).map(alert => (
                  <AlertRow key={`${alert.certId}-${alert.type}`} alert={alert} onNavigate={onNavigate} />
                ))}
                {alerts.length > 5 && (
                  <button
                    onClick={() => onNavigate?.("certifications")}
                    className="text-sm text-muted-foreground bg-transparent border border-border rounded-lg py-2 cursor-pointer hover:bg-muted transition-colors"
                  >
                    +{alerts.length - 5} alertas más → Ver todos los certificados
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Quick Actions ─────────────────────────────────────────────────── */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map(({ label, sub, iconColor, Icon, page }) => (
                <button
                  key={label}
                  onClick={() => onNavigate?.(page)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/60 cursor-pointer text-left transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: iconColor }}
                  >
                    <Icon size={17} color="#fff" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Recent Certificates ───────────────────────────────────────────── */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Certificados Recientes</h3>
              <button
                onClick={() => onNavigate?.("certifications")}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary border border-border rounded-lg px-3.5 py-1.5 hover:bg-muted transition-colors"
              >
                Ver todos <ExternalLink size={13} />
              </button>
            </div>

            {certsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Cargando…</p>
              </div>
            ) : recentCertifications.length === 0 ? (
              <div className="text-center py-8">
                <IdCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">No hay certificaciones aún</p>
                <button
                  onClick={() => onNavigate?.("certifications")}
                  className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-semibold cursor-pointer inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  <Plus size={15} /> Crear primera certificación
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["Propiedad / Propietario", "Calificación", "Estado", "Fecha", "Acciones"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentCertifications.map(cert => (
                      <tr key={cert.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-[13px] font-medium text-foreground">{cert.ownerName || "—"}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {cert.address || cert.cadastralReference || "Sin dirección"}
                          </div>
                        </td>
                        <td className="px-4 py-3"><EnergyBadge rating={cert.energyRating} /></td>
                        <td className="px-4 py-3"><StatusBadge status={cert.status} /></td>
                        <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                          {new Date(cert.createdAt).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => onNavigate?.("certifications")}
                              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground border border-border rounded-md px-2.5 py-1 hover:bg-muted transition-colors"
                            >
                              <Eye size={12} /> Ver
                            </button>
                            {cert.status !== "Finalizado" && (
                              <button
                                onClick={() => onNavigate?.("certifications")}
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary border border-border rounded-md px-2.5 py-1 hover:bg-muted transition-colors"
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
