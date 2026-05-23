// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import { EmptyState } from "@/components/ui/empty-state";
import { NotificationModal } from "@/components/notifications/NotificationModal";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import {
  IdCard, Clock, Euro, Users,
  TrendingUp, TrendingDown, Minus,
  Plus, Eye, Edit, ExternalLink, Bell,
  AlertTriangle, FileWarning, CreditCard,
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

// ─── TrendBadge ──────────────────────────────────────────────────────────────

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const diff = pct(current, previous);
  if (diff === null) return null;
  const Icon = diff === 0 ? Minus : diff > 0 ? TrendingUp : TrendingDown;
  const cls =
    diff === 0
      ? "text-muted-foreground"
      : diff > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-red-500 dark:text-red-400";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cls}`}>
      <Icon size={11} />
      {diff === 0 ? "Sin cambio" : `${diff > 0 ? "+" : ""}${diff}%`}
      <span className="font-normal text-muted-foreground">vs mes ant.</span>
    </span>
  );
}

// ─── KpiCard ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
  iconBg: string;
  trend?: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground leading-tight">
          {label}
        </p>
        <div
          className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${iconBg}`}
        >
          <Icon size={15} className="text-white" />
        </div>
      </div>

      <div>
        <p className="text-[2rem] font-bold text-foreground tracking-tight leading-none">
          {value}
        </p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
        )}
      </div>

      {trend && (
        <div className="pt-2.5 border-t border-border mt-auto">{trend}</div>
      )}
    </div>
  );
}

// ─── ActivityChart ────────────────────────────────────────────────────────────

function ActivityChart({
  data,
  loading,
}: {
  data: Array<{ month: string; total: number }>;
  loading: boolean;
}) {
  const BAR_H = 128;

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-end gap-2" style={{ height: BAR_H }}>
          {[55, 35, 70, 45, 80, 60].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-muted animate-pulse rounded-t-md"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex gap-2">
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
    <div className="space-y-2">
      <div className="flex items-end gap-2" style={{ height: BAR_H }}>
        {data.map((d) => {
          const h = Math.max(4, Math.round((d.total / max) * BAR_H));
          return (
            <div
              key={d.month}
              className="flex-1 rounded-t-md bg-primary/70 hover:bg-primary transition-colors cursor-default"
              style={{ height: h }}
              title={`${fmtMonth(d.month)}: ${d.total} certificados`}
            />
          );
        })}
      </div>
      <div className="flex gap-2">
        {data.map((d) => (
          <div key={d.month} className="flex-1 text-center">
            <span className="text-[11px] text-muted-foreground capitalize">
              {fmtMonth(d.month)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Alert config ─────────────────────────────────────────────────────────────

const ALERT_CFG = {
  deadline_overdue: {
    Icon: AlertTriangle,
    iconCls: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-800/40",
  },
  deadline_soon: {
    Icon: Clock,
    iconCls: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800/40",
  },
  payment_pending: {
    Icon: CreditCard,
    iconCls: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800/40",
  },
  form_pending: {
    Icon: FileWarning,
    iconCls: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-800/40",
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
      className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-lg border transition-opacity hover:opacity-75 active:opacity-60 ${cfg.bg} ${cfg.border}`}
    >
      <cfg.Icon size={13} className={`${cfg.iconCls} flex-shrink-0 mt-0.5`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-[12px] font-semibold text-foreground truncate">
            {alert.ownerName || "Sin propietario"}
          </p>
          {alert.priority === "high" && (
            <span className="text-[9px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 rounded px-1 leading-tight">
              Urgente
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
          {alert.message}
        </p>
      </div>
    </button>
  );
}

// ─── EnergyBadge ─────────────────────────────────────────────────────────────

function EnergyBadge({ rating }: { rating: string | null }) {
  if (!rating) return <span className="text-xs text-muted-foreground">—</span>;
  const colors: Record<string, string> = {
    A: "#166534", B: "#15803d", C: "#65a30d",
    D: "#ca8a04", E: "#ea580c", F: "#dc2626", G: "#7f1d1d",
  };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white"
      style={{ background: colors[rating.toUpperCase()] ?? "#94A3B8" }}
    >
      {rating.toUpperCase()}
    </span>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Nuevo":      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "En Proceso": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    "Finalizado": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    "Archivado":  "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        map[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { user } = useAuth();
  const displayName =
    user?.firstName
      ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
      : user?.username?.split("@")[0] ?? "Certificador";

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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Mobile header ──────────────────────────────────────────────────── */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border flex-shrink-0">
          <span className="text-sm font-semibold text-foreground">Dashboard</span>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <NotificationModal />
            <ProfileMenu />
          </div>
        </div>

        {/* ── Scrollable body ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto">
          <div className="px-4 py-4 sm:px-6 sm:py-6 max-w-[1400px] mx-auto space-y-5">

            {/* ── Desktop header ─────────────────────────────────────────────── */}
            <div className="hidden lg:flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-0.5 capitalize">{todayLabel()}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground">Certificador energético</p>
                </div>
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <NotificationModal />
                  <ProfileMenu />
                </div>
              </div>
            </div>

            {/* ── KPI cards — 2×2 móvil, 4 cols desktop ──────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <KpiCard
                label="Certificados activos"
                value={statsLoading ? "…" : String(totalActive)}
                sub={`${nuevo} nuevo · ${enProceso} en proceso`}
                icon={IdCard}
                iconBg="bg-primary"
              />
              <KpiCard
                label="Ingresos del mes"
                value={statsLoading ? "…" : fmtEur(stats?.monthlyIncome?.current ?? 0)}
                sub={`Anterior: ${fmtEur(stats?.monthlyIncome?.previous ?? 0)}`}
                icon={Euro}
                iconBg="bg-blue-500"
                trend={
                  !statsLoading && stats ? (
                    <TrendBadge
                      current={stats.monthlyIncome.current}
                      previous={stats.monthlyIncome.previous}
                    />
                  ) : undefined
                }
              />
              <KpiCard
                label="Días medio CEE"
                value={
                  statsLoading
                    ? "…"
                    : stats?.avgDaysToComplete
                      ? `${stats.avgDaysToComplete}d`
                      : "—"
                }
                sub="Desde apertura hasta cierre"
                icon={Clock}
                iconBg="bg-amber-500"
              />
              <KpiCard
                label="Clientes nuevos"
                value={statsLoading ? "…" : String(stats?.newClientsThisMonth ?? 0)}
                sub={`Anterior: ${stats?.newClientsPrevMonth ?? 0}`}
                icon={Users}
                iconBg="bg-violet-500"
                trend={
                  !statsLoading && stats ? (
                    <TrendBadge
                      current={stats.newClientsThisMonth}
                      previous={stats.newClientsPrevMonth}
                    />
                  ) : undefined
                }
              />
            </div>

            {/* ── Gráfico + Alertas ──────────────────────────────────────────── */}
            {/* Desktop: chart 2/3 + alerts 1/3. Móvil: apilados */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Gráfico de actividad */}
              <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Actividad mensual</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Certificados creados — últimos 6 meses
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {new Date().toLocaleDateString("es-ES", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <ActivityChart
                  data={stats?.monthlyTrend ?? []}
                  loading={statsLoading}
                />
              </div>

              {/* Panel de alertas */}
              <div className="bg-card rounded-xl border border-border p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">Alertas activas</h2>
                  </div>
                  {alerts.length > 0 && (
                    <span
                      className={`text-xs font-bold text-white rounded-full px-2 py-0.5 ${
                        highAlerts > 0 ? "bg-red-500" : "bg-amber-500"
                      }`}
                    >
                      {alerts.length}
                    </span>
                  )}
                </div>

                {alerts.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2.5">
                      <Bell size={17} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Sin alertas</p>
                    <p className="text-xs text-muted-foreground mt-1">Todo al día</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 overflow-auto flex-1">
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

            {/* ── Certificaciones recientes ───────────────────────────────────── */}
            <div className="bg-card rounded-xl border border-border">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Certificaciones recientes
                </h2>
                <button
                  onClick={() => onNavigate?.("certifications")}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-70 transition-opacity"
                >
                  Ver todas <ExternalLink size={12} />
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
                      <tr className="border-b border-border">
                        {[
                          "Propietario / Dirección",
                          "Calificación",
                          "Estado",
                          "Fecha",
                          "",
                        ].map((h, i) => (
                          <th
                            key={i}
                            className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentCerts.map((cert) => (
                        <tr
                          key={cert.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <p className="text-sm font-medium text-foreground">
                              {cert.ownerName || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {cert.address || cert.cadastralReference || "Sin dirección"}
                            </p>
                          </td>
                          <td className="px-5 py-3.5">
                            <EnergyBadge rating={cert.energyRating} />
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={cert.status} />
                          </td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(cert.createdAt).toLocaleDateString("es-ES")}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => onNavigate?.("certifications")}
                                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground border border-border rounded-md px-2.5 py-1 hover:bg-muted hover:text-foreground transition-colors"
                              >
                                <Eye size={11} /> Ver
                              </button>
                              {cert.status !== "Finalizado" && (
                                <button
                                  onClick={() => onNavigate?.("certifications")}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-primary border border-primary/20 rounded-md px-2.5 py-1 hover:bg-primary/5 transition-colors"
                                >
                                  <Edit size={11} /> Editar
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
    </div>
  );
}
