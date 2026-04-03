import { useQuery } from "@tanstack/react-query";
import { formatDate } from "../lib/utils";

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

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { data: stats } = useQuery<DashboardStats>({ queryKey: ["/api/stats"] });
  const { data: certifications } = useQuery<any[]>({ queryKey: ["/api/certifications"] });

  const recentCerts = Array.isArray(certifications) ? certifications.slice(0, 5) : [];

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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900 tracking-tight">Panel de control</h1>
          <p className="text-sm text-emerald-700/60 mt-1 font-medium">Resumen de tu actividad de certificación energética</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mb-1">Total certificados</p>
          <p className="text-3xl font-bold text-emerald-800 tracking-tighter">{(stats?.totalCertifications ?? 0).toLocaleString("es-ES")}</p>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,100,44,0.06)] border border-emerald-100/60 overflow-hidden">
          <div className="px-8 py-6 border-b border-emerald-50 flex items-center justify-between">
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
            <table className="w-full">
              <thead>
                <tr className="bg-emerald-50/50">
                  <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Cliente</th>
                  <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Dirección</th>
                  <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Estado</th>
                  <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {recentCerts.map((cert: any) => {
                  const initials = (cert.ownerName || "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <tr key={cert.id} data-testid={`row-cert-${cert.id}`} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-800 font-bold text-xs flex-shrink-0">
                            {initials}
                          </div>
                          <span className="text-sm font-semibold text-emerald-900">{cert.ownerName || "-"}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-sm text-emerald-700/60">{cert.address || "-"}</td>
                      <td className="px-8 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(cert.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(cert.status)}`} />
                          {cert.status}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-sm font-medium text-emerald-800">{formatDate(cert.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
