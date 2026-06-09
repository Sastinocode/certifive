import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/contexts/AuthContext";
import {
  IdCard, Clock, Euro, Users, FileCheck2,
  Plus, Eye, Edit, ArrowUpRight, BellRing, Bell,
  AlertTriangle, FileWarning, CreditCard, BarChart3, TrendingUp,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pct = (a: number, b: number): number | null =>
  b === 0 ? null : Math.round(((a - b) / b) * 100);

const fmtEur = (n: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

const fmtMonth = (yyyyMM: string) => {
  const [y, m] = yyyyMM.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("es-ES", {
    month: "short",
  });
};

const todayLabel = () =>
  new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

function makeDelta(
  curr: number,
  prev: number,
): { value: string; positive: boolean } | undefined {
  const d = pct(curr, prev);
  if (d === null || d === 0) return undefined;
  return { value: `${d > 0 ? "+" : ""}${d}%`, positive: d > 0 };
}

// ─── Status badge helper ──────────────────────────────────────────────────────

function statusCls(status: string) {
  switch (status) {
    case "Finalizado": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
    case "En Proceso": return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
    case "Nuevo":      return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
    default:           return "bg-muted text-muted-foreground";
  }
}

// ─── Energy rating colors ─────────────────────────────────────────────────────

const ENERGY_COLORS: Record<string, string> = {
  A: "#166534", B: "#15803d", C: "#65a30d",
  D: "#ca8a04", E: "#ea580c", F: "#dc2626", G: "#991b1b",
};

// ─── Interfaces ───────────────────────────────────────────────────────────────

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
  revenueByMonth: Array<{ month: string; tramo1: number; tramo2: number; total: number }>;
  conversion: { enviados: number; aceptados: number; rate: number };
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

// ─── ActivityChart ────────────────────────────────────────────────────────────

function ActivityChart({
  data,
  loading,
}: {
  data: Array<{ month: string; total: number }>;
  loading: boolean;
}) {
  const BAR_H = 160;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-end gap-3" style={{ height: BAR_H }}>
          {[55, 35, 70, 45, 80, 60].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-muted animate-pulse rounded-lg"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 h-3 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-muted/40"
        style={{ height: BAR_H }}
      >
        <p className="text-sm text-muted-foreground">Sin actividad registrada aún</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3" style={{ height: BAR_H }}>
        {data.map((d) => {
          const h = Math.max(4, Math.round((d.total / max) * BAR_H));
          const isLast = d === data[data.length - 1];
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center justify-end gap-2">
              {isLast && (
                <span className="text-[11px] font-semibold text-foreground">{d.total}</span>
              )}
              <div
                className="w-full rounded-lg bg-primary hover:bg-primary/90 transition-colors cursor-default"
                style={{ height: h }}
                title={`${fmtMonth(d.month)}: ${d.total} certificados`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-3">
        {data.map((d) => (
          <div key={d.month} className="flex-1 text-center">
            <span className="text-[11px] font-medium text-muted-foreground capitalize">
              {fmtMonth(d.month)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RevenueChart ─────────────────────────────────────────────────────────────

function RevenueChart({ data }: { data: Array<{ month: string; tramo1: number; tramo2: number; total: number }> }) {
  if (!data.length) return <p className="text-sm text-muted-foreground py-8 text-center">Sin datos de ingresos</p>;
  const hasTrustData = data.some(d => d.total > 0);
  if (!hasTrustData) return <p className="text-sm text-muted-foreground py-8 text-center">Sin ingresos registrados aún</p>;
  const fmt = (v: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
  const fmtM = (m: string) => { const [y, mo] = m.split("-"); return new Date(Number(y), Number(mo) - 1).toLocaleDateString("es-ES", { month: "short" }); };
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(142 60% 32%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(142 60% 32%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" tickFormatter={fmtM} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => `€${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
        <Tooltip formatter={(v: number) => [fmt(v), ""]} labelFormatter={fmtM} />
        <Area type="monotone" dataKey="total" stroke="hsl(142 60% 32%)" fill="url(#gradTotal)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── StatusChart ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  "Nuevo":      "#6366f1",
  "En Proceso": "#059669",
  "Pendiente":  "#f59e0b",
  "Finalizado": "#10b981",
  "Archivado":  "#94a3b8",
};

function StatusChart({ byStatus }: { byStatus: Record<string, number> }) {
  const data = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (!data.length) return <p className="text-sm text-muted-foreground py-4 text-center">Sin expedientes</p>;

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
        <Tooltip cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="value" name="Expedientes" radius={[0, 6, 6, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── ConversionCard ───────────────────────────────────────────────────────────

function ConversionCard({ conversion }: { conversion: { enviados: number; aceptados: number; rate: number } }) {
  const { enviados, aceptados, rate } = conversion;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Tasa de conversión</span>
        <span className="text-2xl font-bold text-foreground">{rate}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2.5">
        <div
          className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{enviados} presupuestos enviados</span>
        <span>{aceptados} aceptados</span>
      </div>
    </div>
  );
}

// ─── Alert config ─────────────────────────────────────────────────────────────

const ALERT_CFG = {
  deadline_overdue: {
    Icon: AlertTriangle,
    iconCls: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-950/50",
  },
  deadline_soon: {
    Icon: Clock,
    iconCls: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-950/50",
  },
  payment_pending: {
    Icon: CreditCard,
    iconCls: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-950/50",
  },
  form_pending: {
    Icon: FileWarning,
    iconCls: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-100 dark:bg-violet-950/50",
  },
} as const;

function AlertItem({
  alert,
  onNavigate,
}: {
  alert: CertAlert;
  onNavigate?: (p: string) => void;
}) {
  const cfg = ALERT_CFG[alert.type];
  return (
    <button
      onClick={() => onNavigate?.("certifications")}
      className="w-full text-left flex items-start gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors"
    >
      <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center ${cfg.iconBg}`}>
        <cfg.Icon size={16} className={cfg.iconCls} />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-[13px] font-semibold text-foreground truncate">
            {alert.ownerName || "Sin propietario"}
          </p>
          {alert.priority === "high" && (
            <span className="text-[9px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/50 rounded-full px-1.5 py-0.5 leading-none">
              Urgente
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {alert.message}
        </p>
      </div>
    </button>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { user } = useAuth();
  const firstName = user?.firstName ?? user?.username?.split("@")[0] ?? "Certificador";
  const displayName =
    user?.firstName
      ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
      : firstName;

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
  const recentCerts = recentRaw as RecentCert[];
  const highAlerts = alerts.filter((a) => a.priority === "high").length;

  const totalActive = stats?.activeCertificates ?? 0;
  const nuevo       = stats?.byStatus?.["Nuevo"]      ?? 0;
  const enProceso   = stats?.byStatus?.["En Proceso"] ?? 0;

  const incomeDelta  = !statsLoading && stats ? makeDelta(stats.monthlyIncome.current,  stats.monthlyIncome.previous) : undefined;
  const clientsDelta = !statsLoading && stats ? makeDelta(stats.newClientsThisMonth,     stats.newClientsPrevMonth)   : undefined;

  void displayName;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppTopbar
          title={`Hola, ${firstName} 👋`}
          subtitle={todayLabel()}
        />

        <div className="flex-1 overflow-auto">
          <div className="px-4 py-5 sm:px-8 sm:py-8 max-w-[1400px] mx-auto space-y-6">

            {/* ── KPI cards ───────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

              {/* KPI 1 — Certificados activos */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary shadow-sm">
                    <FileCheck2 size={20} className="text-white" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-tight">Certificados activos</p>
                  <p className="text-[2.25rem] sm:text-[2.5rem] font-bold text-foreground tracking-tight leading-none">
                    {statsLoading ? "…" : totalActive}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{nuevo} nuevo · {enProceso} en proceso</p>
                </div>
              </div>

              {/* KPI 2 — Ingresos del mes */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-500 shadow-sm">
                    <Euro size={20} className="text-white" />
                  </div>
                  {incomeDelta && (
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                      incomeDelta.positive
                        ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                        : "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
                    }`}>
                      <TrendingUp size={11} />
                      {incomeDelta.value}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-tight">Ingresos del mes</p>
                  <p className="text-[2.25rem] sm:text-[2.5rem] font-bold text-foreground tracking-tight leading-none">
                    {statsLoading ? "…" : fmtEur(stats?.monthlyIncome?.current ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Anterior: {fmtEur(stats?.monthlyIncome?.previous ?? 0)}</p>
                </div>
              </div>

              {/* KPI 3 — Días medio CEE */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-500 shadow-sm">
                    <Clock size={20} className="text-white" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-tight">Días medio CEE</p>
                  <p className="text-[2.25rem] sm:text-[2.5rem] font-bold text-foreground tracking-tight leading-none">
                    {statsLoading ? "…" : stats?.avgDaysToComplete ? `${stats.avgDaysToComplete}d` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Desde apertura hasta cierre</p>
                </div>
              </div>

              {/* KPI 4 — Clientes nuevos */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-violet-500 shadow-sm">
                    <Users size={20} className="text-white" />
                  </div>
                  {clientsDelta && (
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                      clientsDelta.positive
                        ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                        : "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
                    }`}>
                      <TrendingUp size={11} />
                      {clientsDelta.value}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-tight">Clientes nuevos</p>
                  <p className="text-[2.25rem] sm:text-[2.5rem] font-bold text-foreground tracking-tight leading-none">
                    {statsLoading ? "…" : stats?.newClientsThisMonth ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Anterior: {stats?.newClientsPrevMonth ?? 0}</p>
                </div>
              </div>
            </div>

            {/* ── Actividad + Alertas ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Chart */}
              <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BarChart3 size={18} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Actividad mensual</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Certificados creados — últimos 6 meses</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground capitalize bg-muted/60 rounded-full px-3 py-1">
                    {new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                  </span>
                </div>
                <ActivityChart data={stats?.monthlyTrend ?? []} loading={statsLoading} />
                <div className="mt-6 pt-5 border-t border-border">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3">
                    Expedientes por estado
                  </p>
                  <StatusChart byStatus={stats?.byStatus ?? {}} />
                </div>
              </div>

              {/* Alerts */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-950/50">
                      <BellRing size={18} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">Alertas</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{alerts.length} activas</p>
                    </div>
                  </div>
                  {alerts.length > 0 && (
                    <span className={`text-xs font-bold text-white rounded-full min-w-[26px] h-[26px] inline-flex items-center justify-center px-1.5 ${highAlerts > 0 ? "bg-red-500" : "bg-amber-500"}`}>
                      {alerts.length}
                    </span>
                  )}
                </div>

                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2.5">
                      <Bell size={17} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Sin alertas</p>
                    <p className="text-xs text-muted-foreground mt-1">Todo al día</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 -mx-2">
                    {alerts.slice(0, 6).map((alert) => (
                      <AlertItem
                        key={`${alert.certId}-${alert.type}`}
                        alert={alert}
                        onNavigate={onNavigate}
                      />
                    ))}
                    {alerts.length > 6 && (
                      <button
                        onClick={() => onNavigate?.("certifications")}
                        className="text-xs text-muted-foreground hover:text-foreground text-center py-1.5 transition-colors"
                      >
                        Ver {alerts.length - 6} alertas más →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Ingresos mensuales ───────────────────────────────────────────── */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Euro size={18} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground tracking-tight">Ingresos mensuales</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Cobros registrados — últimos 12 meses</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <RevenueChart data={stats?.revenueByMonth ?? []} />
                </div>
                <div className="pt-4 lg:pt-0 lg:border-l lg:border-border lg:pl-6 flex flex-col justify-center">
                  <p className="text-sm font-semibold text-foreground mb-1">Conversión</p>
                  <p className="text-xs text-muted-foreground mb-4">Presupuestos enviados → aceptados</p>
                  <ConversionCard
                    conversion={stats?.conversion ?? { enviados: 0, aceptados: 0, rate: 0 }}
                  />
                </div>
              </div>
            </div>

            {/* ── Certificaciones recientes ────────────────────────────────────── */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileCheck2 size={18} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground tracking-tight">Certificaciones recientes</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Los últimos expedientes registrados</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate?.("certifications")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/5 rounded-lg px-3 py-1.5 transition-colors"
                >
                  Ver todas
                  <ArrowUpRight size={14} />
                </button>
              </div>

              {certsLoading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-muted animate-pulse rounded-md" />
                  ))}
                </div>
              ) : recentCerts.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={<IdCard />}
                    title="Sin certificaciones todavía"
                    description="Crea tu primera certificación y aparecerá aquí junto con su estado."
                    action={{
                      label: "Crear primera certificación",
                      onClick: () => onNavigate?.("certifications"),
                      icon: <Plus size={16} />,
                    }}
                    size="compact"
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        {["Propietario / Dirección", "Calificación", "Estado", "Fecha", ""].map((h, i) => (
                          <th
                            key={i}
                            className="px-6 py-3 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em] whitespace-nowrap bg-muted/30"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentCerts.map((cert) => (
                        <tr key={cert.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-foreground">
                              {cert.ownerName || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {cert.address || cert.cadastralReference || "Sin dirección"}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            {cert.energyRating ? (
                              <span
                                className="inline-flex items-center justify-center min-w-[26px] px-2 py-0.5 rounded-md text-xs font-bold text-white shadow-sm"
                                style={{ background: ENERGY_COLORS[cert.energyRating] ?? "#94a3b8" }}
                              >
                                {cert.energyRating}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusCls(cert.status)}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
                              {cert.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap font-medium">
                            {new Date(cert.createdAt).toLocaleDateString("es-ES")}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => onNavigate?.("certifications")}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground rounded-lg px-3 py-1.5 hover:bg-muted hover:text-foreground transition-colors"
                              >
                                <Eye size={12} /> Ver
                              </button>
                              {cert.status !== "Finalizado" && (
                                <button
                                  onClick={() => onNavigate?.("certifications")}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 rounded-lg px-3 py-1.5 hover:bg-primary/15 transition-colors"
                                >
                                  <Edit size={12} /> Editar
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

            <div className="h-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
