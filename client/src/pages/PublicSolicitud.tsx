import { useState, useEffect } from "react";

const PROVINCES = [
  "Álava","Albacete","Alicante","Almería","Asturias","Ávila","Badajoz","Baleares","Barcelona",
  "Burgos","Cáceres","Cádiz","Cantabria","Castellón","Ciudad Real","Córdoba","A Coruña","Cuenca",
  "Girona","Granada","Guadalajara","Gipuzkoa","Huelva","Huesca","Jaén","León","Lleida","La Rioja",
  "Lugo","Madrid","Málaga","Murcia","Navarra","Ourense","Palencia","Las Palmas","Pontevedra",
  "Salamanca","Santa Cruz de Tenerife","Segovia","Sevilla","Soria","Tarragona","Teruel","Toledo",
  "Valencia","Valladolid","Bizkaia","Zamora","Zaragoza","Ceuta","Melilla",
];

const PROPERTY_TYPES = [
  { value: "Piso/Apartamento", label: "🏢 Piso o apartamento" },
  { value: "Vivienda unifamiliar", label: "🏠 Casa / chalet" },
  { value: "Adosado", label: "🏘️ Adosado" },
  { value: "Local comercial", label: "🏪 Local comercial" },
  { value: "Nave industrial", label: "🏭 Nave industrial" },
  { value: "Oficinas", label: "💼 Oficina" },
  { value: "Edificio de viviendas", label: "🏗️ Edificio de viviendas" },
  { value: "Otro", label: "📦 Otro" },
];

const STORAGE_KEY = (token: string) => `certifive_solicitud_${token}`;

interface Props { token: string }

export default function PublicSolicitud({ token }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [certifier, setCertifier] = useState<any>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);

  const [form, setForm] = useState({
    ownerName: "", ownerEmail: "", ownerPhone: "", ownerDni: "",
    address: "", city: "", postalCode: "", province: "",
    propertyType: "", constructionYear: "", totalArea: "", numPlantas: "",
    cadastralReference: "",
  });

  // Load from server + localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY(token));
    if (saved) { try { setForm(JSON.parse(saved)); } catch {} }

    fetch(`/api/solicitud/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.completed) { setDone(true); setLoading(false); return; }
        setCertifier(data.certifier);
        if (data.prefill) {
          setForm(f => ({ ...f, ...Object.fromEntries(Object.entries(data.prefill).filter(([, v]) => v !== "" && v !== null)) }));
        }
        setLoading(false);
        fetch(`/api/solicitud/${token}/open`, { method: "POST" }).catch(() => {});
      })
      .catch(() => { setError("No pudimos cargar el formulario. Comprueba el enlace."); setLoading(false); });
  }, [token]);

  // Auto-save
  useEffect(() => {
    if (!loading) localStorage.setItem(STORAGE_KEY(token), JSON.stringify(form));
  }, [form, loading, token]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Calculate price when step 2 is complete
  useEffect(() => {
    if (step === 3 && certifier?.id && form.propertyType) {
      setCalculating(true);
      fetch("/api/pricing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certifierId: certifier.id, propertyType: form.propertyType, totalArea: form.totalArea || null, province: form.province || null }),
      })
        .then(r => r.json())
        .then(d => { if (d.available) setEstimatedPrice(d.total); setCalculating(false); })
        .catch(() => setCalculating(false));
    }
  }, [step, certifier, form.propertyType, form.totalArea, form.province]);

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/solicitud/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      localStorage.removeItem(STORAGE_KEY(token));
      setDone(true);
    } catch {
      setError("Hubo un error al enviar. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const step1Valid = !!form.ownerName && !!form.ownerPhone;
  const step2Valid = !!form.propertyType && !!form.totalArea && !!form.address && !!form.city;

  // font-size must be >= 16px to prevent iOS Safari from auto-zooming on focus
  const inputCls = "w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all";
  const labelCls = "text-xs font-semibold text-stone-500 block mb-1.5 uppercase tracking-wide";

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error && !certifier) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="text-4xl mb-4">🔗</div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">Enlace no válido</h2>
        <p className="text-stone-500 text-sm">{error}</p>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">¡Solicitud enviada!</h2>
        <p className="text-stone-500 text-sm leading-relaxed">
          {certifier?.name ?? "Tu certificador"} revisará tus datos y recibirás el presupuesto en breve.
        </p>
        {certifier?.phone && (
          <a href={`https://wa.me/${certifier.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
            className="mt-6 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-2xl font-semibold text-sm hover:bg-green-700 transition-colors">
            📲 Contactar por WhatsApp
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-black">C5</span>
              </div>
              <span className="font-bold text-stone-800 text-sm">CERTIFIVE</span>
            </div>
            {certifier?.name && <p className="text-xs text-stone-400 mt-0.5 ml-9">{certifier.name}{certifier.company ? ` · ${certifier.company}` : ""}</p>}
          </div>
          {/* Progress */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map(s => (
              <div key={s} className={`transition-all rounded-full ${s === step ? "w-6 h-2.5 bg-emerald-600" : s < step ? "w-2.5 h-2.5 bg-emerald-400" : "w-2.5 h-2.5 bg-stone-200"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">

        {/* Step 1 — Owner data */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 leading-tight">Tus datos de contacto</h1>
              <p className="text-stone-500 text-sm mt-1">Paso 1 de 3 · Solo te pedimos lo esencial</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4">
              <div>
                <label className={labelCls}>Nombre completo *</label>
                <input className={inputCls} value={form.ownerName} onChange={e => set("ownerName", e.target.value)} placeholder="María García López" />
              </div>
              <div>
                <label className={labelCls}>Teléfono *</label>
                <input className={inputCls} type="tel" value={form.ownerPhone} onChange={e => set("ownerPhone", e.target.value)} placeholder="+34 600 000 000" />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input className={inputCls} type="email" value={form.ownerEmail} onChange={e => set("ownerEmail", e.target.value)} placeholder="maria@email.com" />
                <p className="text-xs text-stone-400 mt-1">Para enviarte el presupuesto y el certificado</p>
              </div>
              <div>
                <label className={labelCls}>DNI / NIF <span className="text-stone-400 normal-case font-normal">(opcional)</span></label>
                <input className={inputCls} value={form.ownerDni} onChange={e => set("ownerDni", e.target.value)} placeholder="12345678A" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Property data */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 leading-tight">Datos del inmueble</h1>
              <p className="text-stone-500 text-sm mt-1">Paso 2 de 3 · Información sobre la propiedad</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4">
              <div>
                <label className={labelCls}>Tipo de inmueble *</label>
                <div className="grid grid-cols-2 gap-2">
                  {PROPERTY_TYPES.map(pt => (
                    <button key={pt.value} type="button"
                      onClick={() => set("propertyType", pt.value)}
                      className={`py-3 px-3 rounded-2xl text-sm font-medium border-2 transition-all text-left min-h-[44px] ${
                        form.propertyType === pt.value
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-stone-100 bg-stone-50 text-stone-700 hover:border-emerald-200"
                      }`}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Superficie (m²) *</label>
                  <input className={inputCls} type="number" min="1" value={form.totalArea} onChange={e => set("totalArea", e.target.value)} placeholder="85" />
                </div>
                <div>
                  <label className={labelCls}>Año construcción</label>
                  <input className={inputCls} type="number" min="1900" max={new Date().getFullYear()} value={form.constructionYear} onChange={e => set("constructionYear", e.target.value)} placeholder="1985" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Nº de plantas</label>
                <input className={inputCls} type="number" min="1" value={form.numPlantas} onChange={e => set("numPlantas", e.target.value)} placeholder="3" />
              </div>

              <div>
                <label className={labelCls}>Provincia</label>
                <select className={inputCls} value={form.province} onChange={e => set("province", e.target.value)}>
                  <option value="">Selecciona provincia...</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Municipio / Ciudad</label>
                <input className={inputCls} value={form.city} onChange={e => set("city", e.target.value)} placeholder="Madrid" />
              </div>

              <div>
                <label className={labelCls}>Dirección completa *</label>
                <input className={inputCls} value={form.address} onChange={e => set("address", e.target.value)} placeholder="Calle Mayor 1, 2º A" />
              </div>

              <div>
                <label className={labelCls}>Código postal</label>
                <input className={inputCls} value={form.postalCode} onChange={e => set("postalCode", e.target.value)} placeholder="28001" />
              </div>

              <div>
                <label className={labelCls}>
                  Referencia catastral{" "}
                  <span className="text-stone-400 normal-case font-normal">(opcional · </span>
                  <a href="https://www.catastro.meh.es" target="_blank" rel="noreferrer" className="text-emerald-600 normal-case font-normal underline">búscala aquí</a>
                  <span className="text-stone-400 normal-case font-normal">)</span>
                </label>
                <input className={inputCls} value={form.cadastralReference} onChange={e => set("cadastralReference", e.target.value)} placeholder="7837298VK4873N0001RR" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Summary + Price */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 leading-tight">Resumen y precio</h1>
              <p className="text-stone-500 text-sm mt-1">Paso 3 de 3 · Confirma y envía la solicitud</p>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Tus datos</p>
              {[
                { label: "Nombre", value: form.ownerName },
                { label: "Teléfono", value: form.ownerPhone },
                form.ownerEmail && { label: "Email", value: form.ownerEmail },
                { label: "Tipo", value: form.propertyType },
                { label: "Superficie", value: form.totalArea ? `${form.totalArea} m²` : "" },
                { label: "Dirección", value: `${form.address}${form.city ? `, ${form.city}` : ""}` },
                form.province && { label: "Provincia", value: form.province },
              ].filter(Boolean).map((row: any) => row.value && (
                <div key={row.label} className="flex justify-between items-start gap-4">
                  <span className="text-xs text-stone-400 font-medium flex-shrink-0 pt-0.5">{row.label}</span>
                  <span className="text-sm font-semibold text-stone-800 text-right">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Price estimate */}
            <div className={`rounded-3xl p-6 border-2 transition-all ${
              estimatedPrice ? "bg-emerald-50 border-emerald-200" : "bg-stone-50 border-stone-200"
            }`}>
              {calculating ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span className="text-sm text-stone-500">Calculando precio estimado…</span>
                </div>
              ) : estimatedPrice ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-1">Precio estimado</p>
                  <p className="text-4xl font-black text-emerald-800 tracking-tight">{estimatedPrice.toFixed(2)} €</p>
                  <p className="text-xs text-emerald-700/70 mt-1">IVA incluido · Precio orientativo</p>
                  <p className="text-xs text-stone-500 mt-3 leading-relaxed">
                    Recibirás el presupuesto definitivo de <strong>{certifier?.name ?? "tu certificador"}</strong> en un plazo de {certifier?.plazoEntregaDias ?? 10} días laborables.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Precio estimado</p>
                  <p className="text-stone-500 text-sm">El certificador te enviará el presupuesto personalizado en breve.</p>
                </>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-700">{error}</div>
            )}
          </div>
        )}
      </div>

      {/* Sticky bottom nav – safe-area-inset-bottom for iOS notch/home bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-4 pt-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-shrink-0 px-5 py-4 rounded-2xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 transition-colors">
              ← Atrás
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 ? !step1Valid : !step2Valid}
              className="flex-1 py-4 bg-emerald-700 text-white rounded-2xl font-bold text-sm disabled:opacity-40 hover:bg-emerald-600 transition-colors active:scale-[0.98]"
            >
              Continuar →
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="flex-1 py-4 bg-emerald-700 text-white rounded-2xl font-bold text-sm disabled:opacity-50 hover:bg-emerald-600 transition-colors active:scale-[0.98]"
            >
              {submitting ? "Enviando…" : "Enviar solicitud →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
