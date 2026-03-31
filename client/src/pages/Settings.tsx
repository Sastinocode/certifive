import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";

export default function Settings() {
  const { data: user } = useQuery({ queryKey: ["/api/auth/user"] });
  const [form, setForm] = useState<any>(null);
  const [tab, setTab] = useState("profile");
  const [saved, setSaved] = useState(false);

  if (user && !form) {
    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      company: user.company || "",
      licenseNumber: user.licenseNumber || "",
      dniNif: user.dniNif || "",
      address: user.address || "",
      city: user.city || "",
      postalCode: user.postalCode || "",
      province: user.province || "",
    });
  }

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/auth/user", data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["/api/auth/user"], updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const tabs = [
    { id: "profile", label: "Perfil profesional" },
    { id: "pricing", label: "Tarifas" },
    { id: "notifications", label: "Notificaciones" },
    { id: "backup", label: "Copias de seguridad" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona tu perfil y preferencias</p>
      </div>

      <div className="flex gap-2 mb-8 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && form && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold mb-6">Datos profesionales</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { key: "firstName", label: "Nombre" },
              { key: "lastName", label: "Apellidos" },
              { key: "email", label: "Email", type: "email" },
              { key: "phone", label: "Teléfono" },
              { key: "company", label: "Empresa" },
              { key: "licenseNumber", label: "Nº Habilitación" },
              { key: "dniNif", label: "DNI/NIF" },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm text-gray-600 mb-1">{field.label}</label>
                <input
                  type={field.type || "text"}
                  value={form[field.key] || ""}
                  onChange={e => setForm((f: any) => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
            ))}
          </div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 mt-6">Dirección profesional</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Dirección</label>
              <input type="text" value={form.address || ""} onChange={e => setForm((f: any) => ({ ...f, address: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Ciudad</label>
              <input type="text" value={form.city || ""} onChange={e => setForm((f: any) => ({ ...f, city: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Código postal</label>
              <input type="text" value={form.postalCode || ""} onChange={e => setForm((f: any) => ({ ...f, postalCode: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Provincia</label>
              <input type="text" value={form.province || ""} onChange={e => setForm((f: any) => ({ ...f, province: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => updateMutation.mutate(form)}
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
            {saved && <span className="text-green-600 text-sm">✓ Cambios guardados</span>}
          </div>
        </div>
      )}

      {tab === "pricing" && <PricingSettings />}

      {tab === "notifications" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold mb-6">Notificaciones</h2>
          <div className="space-y-4">
            {[
              { label: "Notificaciones por email", desc: "Recibe alertas por email cuando haya actualizaciones" },
              { label: "Nueva solicitud de certificación", desc: "Cuando llegue una nueva solicitud" },
              { label: "Certificación completada", desc: "Cuando un certificado esté listo" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "backup" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold mb-6">Copias de seguridad</h2>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-xl">🔒</div>
              <div>
                <p className="font-medium text-teal-900">Sistema de copia de seguridad activo</p>
                <p className="text-teal-700 text-sm">Tus datos están protegidos con copias automáticas</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900 text-sm">Copias de seguridad automáticas</p>
                <p className="text-gray-500 text-xs">Frecuencia: Diaria</p>
              </div>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">Activo</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">Período de validez de certificados</p>
                <p className="text-gray-500 text-xs">Alertas de vencimiento</p>
              </div>
              <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500">
                <option>10 años</option>
                <option>5 años</option>
              </select>
            </div>
          </div>
          <button className="mt-4 bg-gradient-to-r from-teal-500 to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
            Crear copia manual
          </button>
        </div>
      )}
    </div>
  );
}

function PricingSettings() {
  const { data: rates, isLoading } = useQuery({ queryKey: ["/api/pricing"] });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ propertyType: "", basePrice: "", description: "" });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/pricing", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing"] });
      setShowForm(false);
      setForm({ propertyType: "", basePrice: "", description: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/pricing/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/pricing"] }),
  });

  const allRates = Array.isArray(rates) ? rates : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Tarifas por tipo de inmueble</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Nueva tarifa
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
          <input
            type="text"
            placeholder="Tipo de inmueble"
            value={form.propertyType}
            onChange={e => setForm(f => ({ ...f, propertyType: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
          />
          <input
            type="number"
            placeholder="Precio base (€)"
            value={form.basePrice}
            onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
          />
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="bg-teal-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-600 disabled:opacity-50">
              Guardar
            </button>
            <button onClick={() => setShowForm(false)} className="border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-6"><div className="animate-spin w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div></div>
      ) : allRates.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-3xl mb-2">💰</p>
          <p className="text-sm">No hay tarifas configuradas</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio base</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allRates.map((rate: any) => (
                <tr key={rate.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{rate.propertyType}</td>
                  <td className="px-4 py-3 text-sm text-teal-600 font-semibold">{Number(rate.basePrice).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{rate.description || "-"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { if (window.confirm("¿Eliminar tarifa?")) deleteMutation.mutate(rate.id); }} className="text-red-400 hover:text-red-600 text-xs font-medium">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
