import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { queryClient, apiRequest } from "../lib/queryClient";
import { formatDate } from "../lib/utils";
import type { Notificacion } from "../hooks/useNotifications";

interface DashboardStats {
  totalCertifications: number;
  activeCertifications: number;
  archivedCertifications: number;
  totalFolders: number;
  totalInvoices: number;
  byStatus: { Nuevo: number; "En Proceso": number; Finalizado: number };
}

interface DashboardProps {
  onNavigate?: (page: any) => void;
}

// ── Notification type metadata (mirrors NotificationBell) ─────────────────────
const TIPO_META: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  solicitud_completada:    { icon: "assignment_turned_in", color: "text-blue-600",    bg: "bg-blue-50",    label: "Solicitud completada"    },
  presupuesto_aceptado:    { icon: "thumb_up",             color: "text-indigo-600",  bg: "bg-indigo-50",  label: "Presupuesto aceptado"    },
  pago_recibido:           { icon: "payments",             color: "text-emerald-600", bg: "bg-emerald-50", label: "Pago recibido"           },
  pago_fallido:            { icon: "money_off",            color: "text-red-600",     bg: "bg-red-50",     label: "Pago fallido"            },
  cee_completado:          { icon: "fact_check",           color: "text-teal-600",    bg: "bg-teal-50",    label: "CEE completado"          },
  recordatorio_formulario: { icon: "schedule",             color: "text-amber-600",   bg: "bg-amber-50",   label: "Recordatorio formulario" },
};
const TIPO_DEFAULT = { icon: "notifications", color: "text-stone-500", bg: "bg-stone-100", label: "Actividad" };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return "ahora mismo";
  const m = Math.floor(s / 60);
  if (m < 60)  return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `hace ${d} d`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

const METHOD_LABELS: Record<string, { icon: string; label: string }> = {
  bizum: { icon: "🟣", label: "Bizum" },
  transferencia: { icon: "🏦", label: "Transferencia" },
  efectivo: { icon: "💵", label: "Efectivo" },
  stripe: { icon: "💳", label: "Tarjeta" },
};

interface CompletenessData {
  percent: number;
  missing: string[];
  complete: boolean;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { data: stats } = useQuery<DashboardStats>({ queryKey: ["/api/stats"] });
  const { data: certifications } = useQuery<any[]>({ queryKey: ["/api/certifications"] });
  const { data: pendingPayments } = useQuery<any[]>({ queryKey: ["/api/payments/pending"] });
  const { data: completeness } = useQuery<CompletenessData>({ queryKey: ["/api/auth/user/completeness"] });
  const { data: activity } = useQuery<Notificacion[]>({
    queryKey: ["/api/activity"],
    refetchInterval: 60_000,
  });

  const recentCerts = Array.isArray(certifications) ? certifications.slice(0, 5) : [];
  const pending = Array.isArray(pendingPayments) ? pendingPayments : [];

  const confirmMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/payments/${id}/confirm`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/payments/pending"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/payments/${id}/reject`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/payments/pending"] }),
  });

  const statCards = [
    {
      label: "Total certificaciones",
      value: stats?.totalCertifications ?? 0,
      icon: "verified",
      color: "bg-emerald-800",
      lightColor: "bg-emerald-50 text-emerald-800",
      change: "+12%",
    },
    {
      label: "En proceso",
      value: stats?.activeCertifications ?? 0,
      icon: "pending_actions",
      color: "bg-orange-600",
      lightColor: "bg-orange-50 text-orange-700",
      change: "+3",
    },
    {
      label: "Finalizadas",
      value: stats?.archivedCertifications ?? 0,
      icon: "task_alt",
      color: "bg-teal-600",
      lightColor: "bg-teal-50 text-teal-700",
      change: "98.4%",
    },
    {
      label: "Carpetas de cliente",
      value: stats?.totalFolders ?? 0,
      icon: "folder_open",
      color: "bg-violet-600",
      lightColor: "bg-violet-50 text-violet-700",
      change: "+2",
    },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Nuevo": return "bg-blue-50 text-blue-700 border border-blue-100";
      case "En Proceso": return "bg-orange-50 text-orange-700 border border-orange-100";
      case "Finalizado": return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      default: return "bg-gray-50 text-gray-700 border border-gray-100";
    }
  };

  const getDotColor = (status: string) => {
    switch (status) {
      case "Nuevo": return "bg-blue-500";
      case "En Proceso": return "bg-orange-500";
      case "Finalizado": return "bg-emerald-600";
      default: return "bg-gray-400";
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-900 tracking-tight">Panel de control</h1>
          <p className="text-sm text-emerald-700/60 mt-1 font-medium">Resumen de tu actividad de certificación energética</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mb-1">Total certificados</p>
          <p className="text-3xl font-bold text-emerald-800 tracking-tighter">{(stats?.totalCertifications ?? 0).toLocaleString("es-ES")}</p>
        </div>
      </div>

      {/* Profile completeness banner */}
      {completeness && !completeness.complete && !bannerDismissed && (
        <div className="relative bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-[0_4px_24px_rgba(251,146,60,0.12)]">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-amber-600 text-[20px]">account_circle</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1.5">
              <p className="text-sm font-semibold text-amber-900">Completa tu perfil profesional</p>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                {completeness.percent}% completado
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden w-full max-w-xs mb-2">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${completeness.percent}%` }}
              />
            </div>
            {completeness.missing.length > 0 && (
              <p className="text-xs text-amber-700/80 leading-relaxed">
                Faltan: {completeness.missing.join(" · ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onNavigate?.("settings")}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Completar perfil →
            </button>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-amber-500 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,100,44,0.06)] border border-emerald-100/60">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center shadow-sm`}>
                <span className="material-symbols-outlined text-white text-[20px]">{card.icon}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${card.lightColor}`}>{card.change}</span>
            </div>
            <p className="text-3xl font-bold text-emerald-900 tracking-tighter mb-1">{card.value}</p>
            <p className="text-xs font-medium text-emerald-700/60 uppercase tracking-wider">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { status: "Nuevo", icon: "fiber_new", color: "bg-blue-600" },
          { status: "En Proceso", icon: "autorenew", color: "bg-orange-600" },
          { status: "Finalizado", icon: "check_circle", color: "bg-emerald-700" },
        ].map((item) => (
          <div key={item.status} className="bg-white rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,100,44,0.06)] border border-emerald-100/60">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 ${item.color} rounded-xl flex items-center justify-center`}>
                <span className="material-symbols-outlined text-white text-[18px]">{item.icon}</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/50">{item.status}</p>
            </div>
            <p className="text-4xl font-bold text-emerald-900 tracking-tighter">
              {stats?.byStatus?.[item.status as keyof typeof stats.byStatus] ?? 0}
            </p>
            <p className="text-xs text-emerald-700/50 mt-1 font-medium">certificaciones</p>
          </div>
        ))}
      </div>

      {/* Pending manual payments */}
      {pending.length > 0 && (
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,100,44,0.06)] border border-amber-100 overflow-hidden">
          <div className="px-5 sm:px-8 py-5 border-b border-amber-50 flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 text-[18px]">payments</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-emerald-900">Cobros pendientes de confirmar</h2>
              <p className="text-xs text-emerald-700/50 mt-0.5">{pending.length} pago{pending.length !== 1 ? "s" : ""} esperando confirmación</p>
            </div>
          </div>
          <div className="divide-y divide-amber-50">
            {pending.map((p: any) => {
              const method = METHOD_LABELS[p.metodo] ?? { icon: "💶", label: p.metodo };
              return (
                <div key={p.id} className="px-5 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <p className="font-semibold text-emerald-900 text-sm">
                        {p.cert?.ownerName ?? "—"}
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                          Tramo {p.tramo}
                        </span>
                      </p>
                      <p className="text-xs text-emerald-700/50 mt-0.5">
                        {method.label} · {parseFloat(p.amount ?? "0").toFixed(2)} € · {formatDate(p.fechaNotificacion)}
                      </p>
                      {p.notas && <p className="text-xs text-stone-500 mt-1 italic">"{p.notas}"</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => rejectMutation.mutate(p.id)}
                      disabled={rejectMutation.isPending || confirmMutation.isPending}
                      className="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 disabled:opacity-40 transition-colors"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => confirmMutation.mutate(p.id)}
                      disabled={confirmMutation.isPending || rejectMutation.isPending}
                      className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 disabled:opacity-40 transition-colors"
                    >
                      ✓ Confirmar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,100,44,0.06)] border border-emerald-100/60 overflow-hidden">
          <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-emerald-50 flex items-center justify-between">
            <h2 className="text-base font-semibold text-emerald-900">Certificaciones recientes</h2>
            <button
              onClick={() => onNavigate?.("certifications")}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 uppercase tracking-wider transition-colors"
            >
              Ver todas →
            </button>
          </div>
          {recentCerts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-emerald-400 text-[32px]">verified</span>
              </div>
              <p className="text-emerald-900 font-semibold mb-1">Sin certificaciones</p>
              <p className="text-emerald-700/50 text-sm">Crea tu primera certificación</p>
              <button
                onClick={() => onNavigate?.("certifications")}
                className="mt-4 px-5 py-2 bg-emerald-800 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                + Nueva certificación
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="bg-emerald-50/50">
                  <th className="px-5 sm:px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Cliente</th>
                  <th className="px-5 sm:px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 hidden sm:table-cell">Dirección</th>
                  <th className="px-5 sm:px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Estado</th>
                  <th className="px-5 sm:px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 hidden sm:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {recentCerts.map((cert: any) => {
                  const initials = (cert.ownerName || "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <tr key={cert.id} data-testid={`row-cert-${cert.id}`} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-5 sm:px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-800 font-bold text-xs flex-shrink-0">
                            {initials}
                          </div>
                          <span className="text-sm font-semibold text-emerald-900 truncate max-w-[120px] sm:max-w-none">{cert.ownerName || "-"}</span>
                        </div>
                      </td>
                      <td className="px-5 sm:px-8 py-4 text-sm text-emerald-700/60 hidden sm:table-cell">{cert.address || "-"}</td>
                      <td className="px-5 sm:px-8 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(cert.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(cert.status)}`} />
                          {cert.status}
                        </span>
                      </td>
                      <td className="px-5 sm:px-8 py-4 text-sm font-medium text-emerald-800 hidden sm:table-cell">{formatDate(cert.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* ── Actividad reciente ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,100,44,0.06)] border border-emerald-100/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-emerald-50 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">history</span>
            <h2 className="text-base font-semibold text-emerald-900 flex-1">Actividad reciente</h2>
            <span className="text-[10px] font-bold text-emerald-700/50 uppercase tracking-wider">Últimas 24 h</span>
          </div>

          {!activity || activity.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-center px-4">
              <span className="material-symbols-outlined text-emerald-200 text-[36px]">timeline</span>
              <p className="text-sm font-semibold text-emerald-900">Sin actividad reciente</p>
              <p className="text-xs text-emerald-700/50">Las acciones de hoy aparecerán aquí</p>
            </div>
          ) : (
            <ul className="divide-y divide-emerald-50/80">
              {activity.map((n) => {
                const meta = TIPO_META[n.tipo] ?? TIPO_DEFAULT;
                return (
                  <li key={n.id} className="px-5 py-3 flex items-start gap-3 hover:bg-emerald-50/30 transition-colors">
                    <div className={`w-7 h-7 ${meta.bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <span className={`material-symbols-outlined text-[14px] ${meta.color}`}>{meta.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-700 leading-snug">{n.mensaje}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.leida && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-2" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,100,44,0.06)] border border-emerald-100/60 p-6">
          <h2 className="text-base font-semibold text-emerald-900 mb-6">Métricas clave</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-end justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Tasa de éxito</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-emerald-900 tracking-tighter">
                    {stats?.totalCertifications ? Math.round((stats.archivedCertifications / stats.totalCertifications) * 100) : 0}%
                  </p>
                </div>
              </div>
              <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-700 rounded-full transition-all"
                  style={{ width: `${stats?.totalCertifications ? Math.round((stats.archivedCertifications / stats.totalCertifications) * 100) : 0}%` }}
                />
              </div>
            </div>
            <div className="border-t border-emerald-50 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mb-1">Emitidas hoy</p>
              <p className="text-2xl font-bold text-emerald-900">{stats?.activeCertifications ?? 0}</p>
              <p className="text-xs text-emerald-700/50 mt-0.5 font-medium">Meta diaria: 15 certificados</p>
            </div>
            <div className="border-t border-emerald-50 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mb-1">Carpetas activas</p>
              <p className="text-2xl font-bold text-emerald-900">{stats?.totalFolders ?? 0}</p>
              <p className="text-xs text-emerald-700/50 mt-0.5 font-medium">Clientes registrados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
