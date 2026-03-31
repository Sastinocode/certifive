import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { formatDate } from "../lib/utils";

const STATUS_OPTIONS = ["Nuevo", "En Proceso", "Finalizado"];

const PROPERTY_TYPES = [
  "Vivienda unifamiliar", "Piso/Apartamento", "Local comercial",
  "Edificio de viviendas", "Oficinas", "Industrial", "Otro"
];

function CertificationForm({ onClose, cert }: { onClose: () => void; cert?: any }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    ownerName: cert?.ownerName || "",
    ownerEmail: cert?.ownerEmail || "",
    ownerPhone: cert?.ownerPhone || "",
    ownerDni: cert?.ownerDni || "",
    address: cert?.address || "",
    city: cert?.city || "",
    postalCode: cert?.postalCode || "",
    province: cert?.province || "",
    cadastralReference: cert?.cadastralReference || "",
    propertyType: cert?.propertyType || "",
    constructionYear: cert?.constructionYear || "",
    totalArea: cert?.totalArea || "",
    status: cert?.status || "Nuevo",
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => cert
      ? apiRequest("PUT", `/api/certifications/${cert.id}`, data)
      : apiRequest("POST", "/api/certifications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      onClose();
    },
  });

  const steps = [
    { title: "Datos del propietario", num: 1 },
    { title: "Datos del inmueble", num: 2 },
    { title: "Información técnica", num: 3 },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{cert ? "Editar certificación" : "Nueva certificación"}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <div className="flex gap-2">
            {steps.map(s => (
              <button
                key={s.num}
                onClick={() => setStep(s.num)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  step === s.num
                    ? "bg-gradient-to-r from-teal-500 to-blue-600 text-white"
                    : step > s.num ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {s.num}. {s.title}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 mb-4">Datos del propietario</h3>
              {[
                { key: "ownerName", label: "Nombre completo", type: "text", placeholder: "Nombre y apellidos" },
                { key: "ownerDni", label: "DNI/NIE", type: "text", placeholder: "12345678A" },
                { key: "ownerEmail", label: "Email", type: "email", placeholder: "email@ejemplo.com" },
                { key: "ownerPhone", label: "Teléfono", type: "tel", placeholder: "+34 600 000 000" },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm text-gray-600 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 mb-4">Datos del inmueble</h3>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Dirección</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                  placeholder="Calle, número, piso"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ciudad</label>
                  <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Código postal</label>
                  <input type="text" value={form.postalCode} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Provincia</label>
                <input type="text" value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Referencia catastral</label>
                <input type="text" value={form.cadastralReference} onChange={e => setForm(f => ({ ...f, cadastralReference: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" placeholder="Referencia catastral" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 mb-4">Información técnica</h3>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tipo de inmueble</label>
                <select
                  value={form.propertyType}
                  onChange={e => setForm(f => ({ ...f, propertyType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                >
                  <option value="">Seleccionar tipo</option>
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Año de construcción</label>
                  <input type="number" value={form.constructionYear} onChange={e => setForm(f => ({ ...f, constructionYear: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" placeholder="1990" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Superficie (m²)</label>
                  <input type="number" value={form.totalArea} onChange={e => setForm(f => ({ ...f, totalArea: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" placeholder="85" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Estado</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-between">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            {step > 1 ? "Anterior" : "Cancelar"}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {createMutation.isPending ? "Guardando..." : cert ? "Guardar cambios" : "Crear certificación"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Certifications() {
  const [showForm, setShowForm] = useState(false);
  const [editCert, setEditCert] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: certifications, isLoading } = useQuery({ queryKey: ["/api/certifications"] });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/certifications/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/certifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PUT", `/api/certifications/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/certifications"] }),
  });

  const certs = Array.isArray(certifications) ? certifications : [];
  const filtered = certs.filter((c: any) => {
    const matchSearch = !search ||
      c.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      c.address?.toLowerCase().includes(search.toLowerCase()) ||
      c.cadastralReference?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Certificación</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona las solicitudes de certificación energética</p>
        </div>
        <button
          onClick={() => { setEditCert(null); setShowForm(true); }}
          className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          + Nueva certificación
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar por propietario, dirección, ref. catastral..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500 font-medium">No hay certificaciones</p>
            <p className="text-gray-400 text-sm mt-1">Crea tu primera certificación con el botón de arriba</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Propietario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref. Catastral</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((cert: any) => (
                  <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 text-sm">{cert.ownerName || "-"}</div>
                      <div className="text-gray-400 text-xs">{cert.ownerPhone || cert.ownerEmail || ""}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{cert.address || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">{cert.cadastralReference || "-"}</td>
                    <td className="px-6 py-4">
                      <select
                        value={cert.status}
                        onChange={e => {
                          const newStatus = e.target.value;
                          if (newStatus === "Finalizado") {
                            if (window.confirm("¿Archivar esta certificación y moverla a Propiedades?")) {
                              archiveMutation.mutate(cert.id);
                            }
                          } else {
                            updateStatusMutation.mutate({ id: cert.id, status: newStatus });
                          }
                        }}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 focus:outline-none cursor-pointer ${
                          cert.status === "Nuevo" ? "bg-blue-100 text-blue-700" :
                          cert.status === "En Proceso" ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        }`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(cert.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditCert(cert); setShowForm(true); }}
                          className="text-teal-600 hover:text-teal-800 text-xs font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => { if (window.confirm("¿Archivar esta certificación?")) archiveMutation.mutate(cert.id); }}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Archivar
                        </button>
                        <button
                          onClick={() => { if (window.confirm("¿Eliminar esta certificación?")) deleteMutation.mutate(cert.id); }}
                          className="text-red-400 hover:text-red-600 text-xs font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <CertificationForm
          onClose={() => { setShowForm(false); setEditCert(null); }}
          cert={editCert}
        />
      )}
    </div>
  );
}
