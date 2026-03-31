import { useQuery } from "@tanstack/react-query";
import { formatDate } from "../lib/utils";

export default function Dashboard() {
  const { data: stats } = useQuery({ queryKey: ["/api/stats"] });
  const { data: certifications } = useQuery({ queryKey: ["/api/certifications"] });

  const recentCerts = Array.isArray(certifications) ? certifications.slice(0, 5) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Panel de control</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen de tu actividad de certificación</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total certificaciones", value: stats?.totalCertifications ?? 0, color: "from-teal-500 to-teal-600", icon: "📋" },
          { label: "Activas", value: stats?.activeCertifications ?? 0, color: "from-blue-500 to-blue-600", icon: "⏳" },
          { label: "Archivadas", value: stats?.archivedCertifications ?? 0, color: "from-green-500 to-green-600", icon: "✅" },
          { label: "Carpetas", value: stats?.totalFolders ?? 0, color: "from-purple-500 to-purple-600", icon: "📁" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <div className={`bg-gradient-to-br ${card.color} text-white text-2xl font-bold px-3 py-1 rounded-xl`}>
                {card.value}
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {[
          { status: "Nuevo", count: stats?.byStatus?.Nuevo ?? 0, color: "bg-blue-100 text-blue-700" },
          { status: "En Proceso", count: stats?.byStatus?.["En Proceso"] ?? 0, color: "bg-yellow-100 text-yellow-700" },
          { status: "Finalizado", count: stats?.byStatus?.Finalizado ?? 0, color: "bg-green-100 text-green-700" },
        ].map((item) => (
          <div key={item.status} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Estado: {item.status}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{item.count}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${item.color}`}>{item.status}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Certificaciones recientes</h2>
        </div>
        <div className="overflow-x-auto">
          {recentCerts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-500">No hay certificaciones todavía</p>
              <p className="text-gray-400 text-sm">Crea tu primera certificación desde la sección de Certificados</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentCerts.map((cert: any) => (
                  <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{cert.ownerName || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{cert.address || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cert.status === "Nuevo" ? "bg-blue-100 text-blue-700" :
                        cert.status === "En Proceso" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(cert.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
