import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { formatDate } from "../lib/utils";

const STATUS_OPTIONS = ["Nuevo", "En Proceso", "Finalizado"];

const PROPERTY_TYPES = [
  "Vivienda unifamiliar", "Piso/Apartamento", "Local comercial",
  "Edificio de viviendas", "Oficinas", "Industrial", "Otro",
];

// ── Form status badge ────────────────────────────────────────────────────────

function FormStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const styles: Record<string, string> = {
    enviado: "bg-blue-50 text-blue-700 border border-blue-100",
    abierto: "bg-orange-50 text-orange-700 border border-orange-100",
    completado: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  };
  const labels: Record<string, string> = {
    enviado: "Enlace enviado",
    abierto: "Abierto",
    completado: "✓ Completado",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ── Generate link modal ──────────────────────────────────────────────────────

function LinkModal({ cert, onClose }: { cert: any; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("POST", `/api/certifications/${cert.id}/generate-link`);
      setUrl(data.url);
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
    } catch {
      setError("No se pudo generar el enlace. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const whatsapp = () => {
    if (!url) return;
    const name = cert.ownerName ? ` para ${cert.ownerName}` : "";
    const text = encodeURIComponent(
      `Hola! Te envío el enlace para rellenar los datos de tu certificado energético${name}:\n\n${url}\n\nSolo te llevará unos minutos. ¡Gracias!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  // Auto-generate on open if no url yet
  if (!url && !loading && !error) {
    generate();
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-emerald-50 px-6 py-5 flex items-center justify-between border-b border-emerald-100">
          <div>
            <h3 className="text-base font-bold text-emerald-900">Enlace para el propietario</h3>
            {cert.ownerName && <p className="text-xs text-emerald-700/60 mt-0.5">{cert.ownerName}</p>}
          </div>
          <button onClick={onClose} className="text-emerald-700/40 hover:text-emerald-900 transition-colors">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600">
            Envía este enlace al propietario. Podrá rellenar sus datos desde el móvil{" "}
            <strong>sin crear ninguna cuenta</strong>.
          </p>

          {loading && (
            <div className="flex items-center gap-3 py-4">
              <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Generando enlace…</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {url && (
            <>
              {/* URL display */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">link</span>
                <p className="text-xs text-gray-600 break-all flex-1">{url}</p>
              </div>

              {/* State badge */}
              {cert.formStatus && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Estado actual:</span>
                  <FormStatusBadge status={cert.formStatus} />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={copy}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-800 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copied ? "check_circle" : "content_copy"}
                  </span>
                  {copied ? "¡Copiado!" : "Copiar enlace"}
                </button>
                <button
                  onClick={whatsapp}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors"
                >
                  <span className="text-base">📲</span>
                  Enviar por WhatsApp
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Certification form ───────────────────────────────────────────────────────

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

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const steps = [
    { num: 1, label: "Cliente" },
    { num: 2, label: "Inmueble" },
    { num: 3, label: "Confirmar" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="bg-emerald-50 px-8 py-6 flex items-center justify-between border-b border-emerald-100">
          <div>
            <h3 className="text-lg font-bold text-emerald-900">{cert ? "Editar certificación" : "Nueva certificación"}</h3>
            <p className="text-xs text-emerald-700/60 mt-0.5">Paso {step} de 3</p>
          </div>
          <div className="flex items-center gap-2">
            {steps.map(s => (
              <div key={s.num} className="flex items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s.num < step ? "bg-emerald-700 text-white" :
                  s.num === step ? "bg-emerald-800 text-white ring-4 ring-emerald-200" :
                  "bg-emerald-100 text-emerald-500"
                }`}>{s.num < step ? "✓" : s.num}</div>
                {s.num < 3 && <div className={`w-8 h-0.5 ${s.num < step ? "bg-emerald-700" : "bg-emerald-100"}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mb-4">Datos del propietario</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Nombre completo *</label>
                  <input
                    data-testid="input-ownerName"
                    value={form.ownerName}
                    onChange={e => update("ownerName", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="María García López"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Email</label>
                  <input
                    data-testid="input-ownerEmail"
                    value={form.ownerEmail}
                    onChange={e => update("ownerEmail", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="maria@email.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Teléfono</label>
                  <input
                    data-testid="input-ownerPhone"
                    value={form.ownerPhone}
                    onChange={e => update("ownerPhone", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="+34 600 000 000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">DNI/NIF</label>
                  <input
                    data-testid="input-ownerDni"
                    value={form.ownerDni}
                    onChange={e => update("ownerDni", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="12345678A"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mb-4">Datos del inmueble</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Dirección *</label>
                  <input
                    data-testid="input-address"
                    value={form.address}
                    onChange={e => update("address", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="Calle Mayor 1, 1º A"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Ciudad</label>
                  <input
                    data-testid="input-city"
                    value={form.city}
                    onChange={e => update("city", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="Madrid"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Código postal</label>
                  <input
                    data-testid="input-postalCode"
                    value={form.postalCode}
                    onChange={e => update("postalCode", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="28001"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Tipo de inmueble</label>
                  <select
                    data-testid="select-propertyType"
                    value={form.propertyType}
                    onChange={e => update("propertyType", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Año de construcción</label>
                  <input
                    data-testid="input-constructionYear"
                    value={form.constructionYear}
                    onChange={e => update("constructionYear", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="1985"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Superficie (m²)</label>
                  <input
                    data-testid="input-totalArea"
                    value={form.totalArea}
                    onChange={e => update("totalArea", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="85"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Referencia catastral</label>
                  <input
                    data-testid="input-cadastralReference"
                    value={form.cadastralReference}
                    onChange={e => update("cadastralReference", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="7837298VK4873N0001RR"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mb-4">Revisión y estado</h4>
              <div className="bg-emerald-50 rounded-xl p-6 space-y-3">
                {[
                  { label: "Propietario", value: form.ownerName },
                  { label: "Dirección", value: `${form.address}, ${form.city}` },
                  { label: "Tipo", value: form.propertyType },
                  { label: "Superficie", value: form.totalArea ? `${form.totalArea} m²` : "" },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">{row.label}</span>
                    <span className="text-sm font-semibold text-emerald-900">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Estado inicial</label>
                <div className="flex gap-3">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      data-testid={`status-${s}`}
                      onClick={() => update("status", s)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all ${
                        form.status === s
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-emerald-100 text-emerald-700 hover:border-emerald-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-5 bg-emerald-50/50 border-t border-emerald-100 flex items-center justify-between">
          <button
            onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
            className="px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors"
          >
            {step === 1 ? "Cancelar" : "← Atrás"}
          </button>
          {step < 3 ? (
            <button
              data-testid="btn-next-step"
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && !form.ownerName}
              className="px-6 py-2.5 bg-emerald-800 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-all shadow-sm"
            >
              Siguiente →
            </button>
          ) : (
            <button
              data-testid="btn-save-cert"
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending}
              className="px-6 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {createMutation.isPending ? "Guardando..." : cert ? "Guardar cambios" : "Crear certificación"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function Certifications() {
  const [showForm, setShowForm] = useState(false);
  const [editCert, setEditCert] = useState<any>(null);
  const [linkCert, setLinkCert] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const { data: certifications, isLoading } = useQuery<any[]>({ queryKey: ["/api/certifications"] });

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

  const allCerts = Array.isArray(certifications) ? certifications : [];

  const filtered = allCerts.filter(c => {
    const matchStatus = statusFilter === "Todos" || c.status === statusFilter;
    const matchSearch = !search || [c.ownerName, c.address, c.cadastralReference]
      .some((v: string) => v?.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Nuevo": return "bg-blue-50 text-blue-700 border border-blue-100";
      case "En Proceso": return "bg-orange-50 text-orange-700 border border-orange-100";
      case "Finalizado": return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      default: return "bg-gray-50 text-gray-600 border border-gray-100";
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
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {(showForm || editCert) && (
        <CertificationForm
          cert={editCert}
          onClose={() => { setShowForm(false); setEditCert(null); }}
        />
      )}

      {linkCert && (
        <LinkModal cert={linkCert} onClose={() => setLinkCert(null)} />
      )}

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900 tracking-tight">Visión operacional</h1>
          <p className="text-sm text-emerald-700/60 mt-1 font-medium">Gestiona y realiza el seguimiento de tus certificaciones CEE.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mb-1">Total certificados</p>
          <p className="text-3xl font-bold text-emerald-800 tracking-tighter">{allCerts.length.toLocaleString("es-ES")}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 min-w-0">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 text-[20px]">search</span>
          <input
            data-testid="input-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, dirección o referencia catastral..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 px-1 block">Estado</label>
            <select
              data-testid="select-status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-emerald-100 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <option>Todos</option>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_32px_rgba(0,100,44,0.06)] border border-emerald-100/60 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-emerald-50/50 border-b border-emerald-100/60">
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Cliente</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Inmueble</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 hidden md:table-cell">Fecha</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Estado</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 hidden lg:table-cell">Formulario</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-8 py-16 text-center">
                  <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-16 text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-emerald-400 text-[32px]">verified</span>
                  </div>
                  <p className="font-semibold text-emerald-900 mb-1">
                    {search || statusFilter !== "Todos" ? "Sin resultados" : "Sin certificaciones"}
                  </p>
                  <p className="text-sm text-emerald-700/50">
                    {search || statusFilter !== "Todos" ? "Prueba otros filtros" : "Crea tu primera certificación energética"}
                  </p>
                  {!search && statusFilter === "Todos" && (
                    <button
                      data-testid="btn-create-first"
                      onClick={() => setShowForm(true)}
                      className="mt-4 px-6 py-2.5 bg-emerald-800 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      + Nueva certificación
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((cert: any) => {
                const initials = (cert.ownerName || "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <tr key={cert.id} data-testid={`row-cert-${cert.id}`} className="hover:bg-emerald-50/30 transition-colors relative">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-800 font-bold text-xs flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-900 text-sm">{cert.ownerName || "-"}</p>
                          {cert.ownerEmail && <p className="text-xs text-emerald-700/50">{cert.ownerEmail}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm text-emerald-800 font-medium">{cert.address || "-"}</p>
                      {cert.propertyType && <p className="text-xs text-emerald-700/50 mt-0.5">{cert.propertyType}</p>}
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-emerald-800 hidden md:table-cell">{formatDate(cert.createdAt)}</td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(cert.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(cert.status)}`} />
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 hidden lg:table-cell">
                      {cert.formStatus ? (
                        <FormStatusBadge status={cert.formStatus} />
                      ) : (
                        <button
                          onClick={() => { setLinkCert(cert); setOpenMenu(null); }}
                          className="text-[11px] text-emerald-700/50 hover:text-emerald-800 underline underline-offset-2 transition-colors"
                        >
                          Generar enlace
                        </button>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right relative">
                      <button
                        data-testid={`btn-menu-${cert.id}`}
                        onClick={() => setOpenMenu(openMenu === cert.id ? null : cert.id)}
                        className="p-2 hover:bg-emerald-100 rounded-xl transition-colors text-emerald-700/60 hover:text-emerald-900"
                      >
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                      {openMenu === cert.id && (
                        <div className="absolute right-6 top-14 bg-white border border-emerald-100 rounded-xl shadow-xl z-10 min-w-[200px] overflow-hidden">
                          <button
                            data-testid={`btn-edit-${cert.id}`}
                            onClick={() => { setEditCert(cert); setOpenMenu(null); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-emerald-800 hover:bg-emerald-50 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Editar
                          </button>
                          <button
                            onClick={() => { setLinkCert(cert); setOpenMenu(null); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-emerald-800 hover:bg-emerald-50 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">link</span>
                            {cert.formToken ? "Ver enlace del propietario" : "Enviar enlace al propietario"}
                          </button>
                          {cert.status === "Finalizado" && !cert.isArchived && (
                            <button
                              data-testid={`btn-archive-${cert.id}`}
                              onClick={() => { archiveMutation.mutate(cert.id); setOpenMenu(null); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-emerald-800 hover:bg-emerald-50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">folder</span>
                              Archivar
                            </button>
                          )}
                          <button
                            data-testid={`btn-delete-${cert.id}`}
                            onClick={() => {
                              if (window.confirm("¿Eliminar esta certificación?")) {
                                deleteMutation.mutate(cert.id);
                              }
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-emerald-50"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="px-8 py-4 border-t border-emerald-50 flex items-center justify-between">
            <p className="text-xs text-emerald-700/60 font-medium">
              Mostrando {filtered.length} de {allCerts.length} certificaciones
            </p>
            <button
              data-testid="btn-nueva-cert"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Nueva
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
