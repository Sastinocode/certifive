import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";

interface User {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  licenseNumber?: string | null;
  dniNif?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  province?: string | null;
  username: string;
  name?: string | null;
}

export default function Settings() {
  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/user"] });
  const [form, setForm] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({ email: true, newRequest: true, completed: true, digest: false });

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

  const Section = ({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) => (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start py-10 border-b border-emerald-100 last:border-0">
      <div className="lg:col-span-4">
        <h2 className="text-xl font-bold text-emerald-800 tracking-tight mb-2">{title}</h2>
        <p className="text-sm text-emerald-700/60 leading-relaxed">{desc}</p>
      </div>
      <div className="lg:col-span-8">{children}</div>
    </section>
  );

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${checked ? "bg-emerald-700" : "bg-emerald-200"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );

  const inputClass = "w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none text-emerald-900 placeholder:text-emerald-500/50";
  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 block mb-1";

  const initials = user ? `${(user.firstName || user.username || "U")[0]}${(user.lastName || "")[0] || ""}`.toUpperCase() : "U";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-emerald-900 tracking-tight">Configuración del sistema</h1>
        <p className="text-sm text-emerald-700/60 mt-1 font-medium">Gestiona tu perfil, suscripción e integraciones</p>
      </div>

      <Section
        title="Perfil profesional"
        desc="Actualiza tu identidad pública y las credenciales de certificación utilizadas en el ecosistema Certifive."
      >
        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,100,44,0.06)] border border-emerald-100/60">
          <div className="flex items-center gap-5 mb-8">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-emerald-800 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">{initials}</span>
              </div>
              <button className="absolute bottom-0 right-0 bg-emerald-800 text-white p-1.5 rounded-full shadow-md hover:bg-emerald-700 transition-colors">
                <span className="material-symbols-outlined text-[14px]">edit</span>
              </button>
            </div>
            <div>
              <h3 className="text-base font-semibold text-emerald-900">{user?.name || user?.username}</h3>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/60 mb-2">Auditor energético senior</p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">VERIFICADO</span>
                {user?.licenseNumber && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200">{user.licenseNumber}</span>
                )}
              </div>
            </div>
          </div>

          {form && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className={labelClass}>Nombre</label>
                  <input
                    data-testid="input-firstName"
                    className={inputClass}
                    value={form.firstName}
                    onChange={e => setForm((f: any) => ({ ...f, firstName: e.target.value }))}
                    placeholder="María"
                  />
                </div>
                <div>
                  <label className={labelClass}>Apellidos</label>
                  <input
                    data-testid="input-lastName"
                    className={inputClass}
                    value={form.lastName}
                    onChange={e => setForm((f: any) => ({ ...f, lastName: e.target.value }))}
                    placeholder="García López"
                  />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    data-testid="input-email"
                    type="email"
                    className={inputClass}
                    value={form.email}
                    onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))}
                    placeholder="maria@email.com"
                  />
                </div>
                <div>
                  <label className={labelClass}>Teléfono</label>
                  <input
                    data-testid="input-phone"
                    className={inputClass}
                    value={form.phone}
                    onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))}
                    placeholder="+34 600 000 000"
                  />
                </div>
                <div>
                  <label className={labelClass}>Empresa</label>
                  <input
                    data-testid="input-company"
                    className={inputClass}
                    value={form.company}
                    onChange={e => setForm((f: any) => ({ ...f, company: e.target.value }))}
                    placeholder="Mi empresa S.L."
                  />
                </div>
                <div>
                  <label className={labelClass}>Nº Habilitación</label>
                  <input
                    data-testid="input-licenseNumber"
                    className={inputClass}
                    value={form.licenseNumber}
                    onChange={e => setForm((f: any) => ({ ...f, licenseNumber: e.target.value }))}
                    placeholder="CEE-2024-001"
                  />
                </div>
                <div>
                  <label className={labelClass}>DNI / NIF</label>
                  <input
                    data-testid="input-dniNif"
                    className={inputClass}
                    value={form.dniNif}
                    onChange={e => setForm((f: any) => ({ ...f, dniNif: e.target.value }))}
                    placeholder="12345678A"
                  />
                </div>
              </div>
              <div className="border-t border-emerald-50 pt-5 mb-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mb-4">Dirección profesional</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Dirección</label>
                    <input
                      data-testid="input-address"
                      className={inputClass}
                      value={form.address}
                      onChange={e => setForm((f: any) => ({ ...f, address: e.target.value }))}
                      placeholder="Calle Mayor 1"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Ciudad</label>
                    <input
                      data-testid="input-city"
                      className={inputClass}
                      value={form.city}
                      onChange={e => setForm((f: any) => ({ ...f, city: e.target.value }))}
                      placeholder="Madrid"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Código postal</label>
                    <input
                      data-testid="input-postalCode"
                      className={inputClass}
                      value={form.postalCode}
                      onChange={e => setForm((f: any) => ({ ...f, postalCode: e.target.value }))}
                      placeholder="28001"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Provincia</label>
                    <input
                      data-testid="input-province"
                      className={inputClass}
                      value={form.province}
                      onChange={e => setForm((f: any) => ({ ...f, province: e.target.value }))}
                      placeholder="Madrid"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                {saved && (
                  <span className="flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Cambios guardados
                  </span>
                )}
                <button
                  data-testid="btn-save-profile"
                  onClick={() => updateMutation.mutate(form)}
                  disabled={updateMutation.isPending}
                  className="px-6 py-2.5 bg-emerald-800 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm"
                >
                  {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </>
          )}
        </div>
      </Section>

      <Section
        title="Suscripción"
        desc="Gestiona tu ciclo de facturación y opciones de escalado empresarial."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 bg-white rounded-2xl p-8 border border-emerald-100/60 shadow-[0_4px_24px_rgba(0,100,44,0.06)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-orange-500 text-[18px]">loyalty</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Plan activo actual</span>
              </div>
              <h3 className="text-2xl font-bold text-emerald-900 tracking-tight">Profesional CEE</h3>
              <p className="text-sm text-emerald-700/60 mt-1">Renovación: 12 de noviembre de 2024</p>
            </div>
            <div className="flex items-end gap-3">
              <div className="text-right">
                <p className="text-3xl font-bold text-emerald-900 tracking-tighter">€129<span className="text-base font-normal text-emerald-700/60">/mes</span></p>
              </div>
              <button className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm">
                Cambiar plan
              </button>
            </div>
          </div>
          <div className="bg-emerald-800 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/70">Uso mensual</p>
              <span className="material-symbols-outlined text-emerald-300 text-[20px]">insert_chart</span>
            </div>
            <p className="text-3xl font-bold tracking-tighter mb-1">124 <span className="text-lg font-normal text-emerald-300">/ 500</span></p>
            <p className="text-xs text-emerald-300 mb-4">Certificados generados este mes</p>
            <div className="h-2 bg-emerald-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-300 rounded-full" style={{ width: "24.8%" }} />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-emerald-100/60">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Última factura</p>
              <span className="material-symbols-outlined text-emerald-400 text-[20px]">receipt</span>
            </div>
            <p className="font-bold text-emerald-900 mb-0.5">Factura #88219-B</p>
            <p className="text-xs text-emerald-700/60 mb-3">Pagado el 12 de octubre, 2024</p>
            <button className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors">
              <span className="material-symbols-outlined text-[16px]">download</span>
              Descargar PDF
            </button>
          </div>
        </div>
      </Section>

      <Section
        title="Integraciones"
        desc="Conecta tu ecosistema técnico para agilizar el proceso de certificación."
      >
        <div className="bg-white rounded-2xl border border-emerald-100/60 shadow-[0_4px_24px_rgba(0,100,44,0.06)] overflow-hidden">
          {[
            { name: "API Catastro España", desc: "Extracción automática de datos de parcelas para proyectos ibéricos.", connected: true, icon: "public" },
            { name: "Motor CE3X", desc: "Exportación XML directa para la calificación energética oficial.", connected: false, icon: "settings_ethernet" },
            { name: "WhatsApp Business", desc: "Envío automático de notificaciones y certificados a clientes.", connected: false, icon: "chat" },
          ].map((integration, i) => (
            <div key={integration.name} className={`flex items-center justify-between px-6 py-5 ${i > 0 ? "border-t border-emerald-50" : ""}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-700 text-[20px]">{integration.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-emerald-900 text-sm">{integration.name}</p>
                  <p className="text-xs text-emerald-700/60 mt-0.5">{integration.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {integration.connected ? (
                  <>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Conectado
                    </span>
                    <button className="p-2 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-700">
                      <span className="material-symbols-outlined text-[18px]">settings</span>
                    </button>
                  </>
                ) : (
                  <button className="px-4 py-2 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-50 transition-colors">
                    Conectar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Preferencias del sistema"
        desc="Configura tu entorno de trabajo y la frecuencia de notificaciones."
      >
        <div className="bg-white rounded-2xl border border-emerald-100/60 shadow-[0_4px_24px_rgba(0,100,44,0.06)] overflow-hidden">
          {[
            { key: "email", label: "Notificaciones push", desc: "Recibe alertas cuando las auditorías de certificación estén completas." },
            { key: "newRequest", label: "Nueva solicitud de certificación", desc: "Cuando llegue una nueva solicitud de cliente." },
            { key: "completed", label: "Certificación completada", desc: "Cuando un certificado esté listo para entregar." },
            { key: "digest", label: "Resumen semanal por email", desc: "Resumen semanal de tendencias de eficiencia energética y actividad de cuenta." },
          ].map((item, i) => (
            <div key={item.key} className={`flex items-center justify-between px-6 py-5 ${i > 0 ? "border-t border-emerald-50" : ""}`}>
              <div>
                <p className="font-semibold text-emerald-900 text-sm">{item.label}</p>
                <p className="text-xs text-emerald-700/60 mt-0.5">{item.desc}</p>
              </div>
              <Toggle
                checked={notifications[item.key as keyof typeof notifications]}
                onChange={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))}
              />
            </div>
          ))}
          <div className="border-t border-emerald-50 px-6 py-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-emerald-900 text-sm">Idioma de la interfaz</p>
              <p className="text-xs text-emerald-700/60 mt-0.5">Selecciona el idioma predeterminado para informes y herramientas.</p>
            </div>
            <select className="bg-emerald-50 border-none rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-300 text-emerald-800">
              <option>Español (ES)</option>
              <option>English (UK)</option>
              <option>Català</option>
            </select>
          </div>
        </div>
      </Section>

      <Section
        title="Zona de peligro"
        desc="Acciones irreversibles sobre tus datos profesionales y acceso a la cuenta."
      >
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-red-100 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-red-700 text-sm mb-0.5">Cerrar todas las sesiones</p>
              <p className="text-xs text-red-600/70">Deberás volver a autenticarte en todos los dispositivos, incluido el móvil.</p>
            </div>
            <button className="flex-shrink-0 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm">
              Cerrar sesiones
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-red-100 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-red-700 text-sm mb-0.5">Eliminación permanente de cuenta</p>
              <p className="text-xs text-red-600/70">Una vez eliminada, tu historial de certificaciones y claves API no se pueden recuperar.</p>
            </div>
            <button className="flex-shrink-0 px-5 py-2.5 bg-red-700 text-white rounded-xl text-sm font-semibold hover:bg-red-800 transition-colors shadow-sm">
              Eliminar cuenta
            </button>
          </div>
        </div>
      </Section>

      <footer className="pt-10 border-t border-emerald-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">CERTIFIVE</p>
          <p className="text-xs text-emerald-700/40 mt-0.5">© 2024 Certifive Certification. Preciso. Seguro. Conforme.</p>
        </div>
        <div className="flex gap-4">
          {["Privacidad", "Términos", "Cookies", "SLA"].map(link => (
            <button key={link} className="text-xs text-emerald-700/50 hover:text-emerald-900 transition-colors font-medium">{link}</button>
          ))}
        </div>
      </footer>
    </div>
  );
}
