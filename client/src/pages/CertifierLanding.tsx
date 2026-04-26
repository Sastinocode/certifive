import { useState, useEffect } from "react";

const PROPERTY_TYPES = [
  { value: "Piso/Apartamento", label: "🏢 Piso / Apartamento" },
  { value: "Vivienda unifamiliar", label: "🏠 Casa / Chalet" },
  { value: "Adosado", label: "🏘️ Adosado" },
  { value: "Local comercial", label: "🏪 Local comercial" },
  { value: "Nave industrial", label: "🏭 Nave / Almacén" },
  { value: "Oficinas", label: "💼 Oficina" },
];

interface Props { slug: string }

export default function CertifierLanding({ slug }: Props) {
  const [loading, setLoading] = useState(true);
  const [certifier, setCertifier] = useState<any>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    ownerName: "", ownerEmail: "", ownerPhone: "",
    propertyType: "", province: "", address: "",
  });

  useEffect(() => {
    fetch(`/api/c/${slug}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setCertifier(d); setLoading(false); })
      .catch(() => { setError("Certificador no encontrado."); setLoading(false); });
  }, [slug]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!certifier?.id) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/solicitud/nueva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certifierId: certifier.id, ...form }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDone(true);
      // Redirect to the solicitud form to continue filling property data
      setTimeout(() => { window.location.href = `/solicitud/${data.token}`; }, 1500);
    } catch {
      setError("Error al enviar. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400";
  const labelCls = "text-xs font-semibold text-stone-500 block mb-1.5 uppercase tracking-wide";

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 to-emerald-900 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-300 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">Certificador no encontrado</h2>
        <p className="text-stone-500 text-sm">Comprueba el enlace que te han proporcionado.</p>
      </div>
    </div>
  );

  const initials = (certifier?.name || certifier?.company || "C").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 to-emerald-950">
      {/* Hero */}
      <div className="px-4 pt-16 pb-12 text-center text-white">
        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-5 backdrop-blur-sm border border-white/20">
          <span className="text-white text-3xl font-black">{initials}</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-1">{certifier.name ?? certifier.company ?? "Certificador energético"}</h1>
        {certifier.company && <p className="text-emerald-300 text-sm font-medium">{certifier.company}</p>}
        <div className="flex items-center justify-center gap-3 mt-3">
          {certifier.licenseNumber && (
            <span className="bg-white/10 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full border border-white/10">
              Nº {certifier.licenseNumber}
            </span>
          )}
          {(certifier.city || certifier.province) && (
            <span className="bg-white/10 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full border border-white/10">
              📍 {certifier.city || certifier.province}
            </span>
          )}
        </div>
        <p className="text-emerald-200/70 text-sm mt-4 max-w-sm mx-auto leading-relaxed">
          Certificados de eficiencia energética (CEE) para tu vivienda o local comercial.
        </p>
      </div>

      {/* CTA card */}
      <div className="px-4 max-w-lg mx-auto pb-16">
        {done ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">¡Solicitud enviada!</h2>
            <p className="text-stone-500 text-sm">Redirigiendo para completar los datos de tu inmueble…</p>
          </div>
        ) : !showForm ? (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-black text-stone-900 mb-2">Solicita tu presupuesto</h2>
              <p className="text-stone-500 text-sm mb-6 leading-relaxed">
                Sin compromiso. Recibirás el presupuesto en menos de{" "}
                <strong>{certifier.plazoEntregaDias ?? 10} días laborables</strong>.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  { icon: "📋", text: "Rellenas un formulario de 3 pasos (5 min)" },
                  { icon: "💰", text: "Recibes el presupuesto personalizado" },
                  { icon: "✅", text: "Aceptas y se tramita el certificado" },
                  { icon: "📄", text: "Recibes el CEE oficial" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm text-stone-700">{item.text}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => setShowForm(true)}
                className="w-full py-4 bg-emerald-700 text-white rounded-2xl font-bold text-base hover:bg-emerald-600 transition-colors active:scale-[0.98]">
                Solicitar presupuesto gratis →
              </button>
            </div>

            <div className="bg-stone-50 border-t border-stone-100 px-8 py-4 flex flex-wrap gap-4 justify-center">
              {certifier.phone && (
                <a href={`tel:${certifier.phone}`} className="text-sm text-emerald-700 font-semibold flex items-center gap-1.5">
                  📞 {certifier.phone}
                </a>
              )}
              {certifier.email && (
                <a href={`mailto:${certifier.email}`} className="text-sm text-emerald-700 font-semibold flex items-center gap-1.5 truncate">
                  ✉️ {certifier.email}
                </a>
              )}
            </div>
          </div>
        ) : (
          /* Contact form */
          <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-900">Tus datos</h2>
              <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-700 text-xl">✕</button>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-stone-500">Paso 1 de 2 · Datos de contacto</p>
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
                </div>
                <button onClick={() => form.ownerName && form.ownerPhone && setStep(2)}
                  disabled={!form.ownerName || !form.ownerPhone}
                  className="w-full py-4 bg-emerald-700 text-white rounded-2xl font-bold text-sm disabled:opacity-40 hover:bg-emerald-600">
                  Continuar →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-stone-500">Paso 2 de 2 · Sobre tu inmueble</p>
                <div>
                  <label className={labelCls}>Tipo de inmueble</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROPERTY_TYPES.map(pt => (
                      <button key={pt.value} type="button" onClick={() => set("propertyType", pt.value)}
                        className={`py-3 px-2 rounded-2xl text-xs font-medium border-2 transition-all text-left ${
                          form.propertyType === pt.value
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                            : "border-stone-100 bg-stone-50 text-stone-700"
                        }`}>
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Municipio o dirección aproximada</label>
                  <input className={inputCls} value={form.address} onChange={e => set("address", e.target.value)} placeholder="Madrid, Calle Mayor..." />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-shrink-0 px-4 py-4 rounded-2xl border border-stone-200 text-stone-600 text-sm font-semibold">← Atrás</button>
                  <button onClick={submit} disabled={submitting}
                    className="flex-1 py-4 bg-emerald-700 text-white rounded-2xl font-bold text-sm disabled:opacity-50 hover:bg-emerald-600">
                    {submitting ? "Enviando…" : "Enviar solicitud →"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {certifier.condicionesServicio && (
          <p className="text-center text-xs text-white/40 mt-6 px-4 leading-relaxed">{certifier.condicionesServicio.slice(0, 200)}…</p>
        )}

        <p className="text-center text-xs text-white/30 mt-4">
          Gestionado por <span className="font-bold">CERTIFIVE</span>
        </p>
      </div>
    </div>
  );
}
