import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = (token: string) => `certifive_cee_${token}`;

const CERRAMIENTO_OPTS = ["Ladrillo", "Hormigón", "Piedra natural", "Madera", "Panel sándwich", "No sé"];
const VENTANAS_OPTS = ["Simple acristalamiento", "Doble acristalamiento", "Triple acristalamiento", "No sé"];
const MARCOS_OPTS = ["Madera", "Aluminio (sin RPT)", "Aluminio con RPT", "PVC", "Otros / No sé"];
const CALEFACCION_TIPOS = ["Caldera de gas", "Caldera de gasoil", "Bomba de calor", "Eléctrica (radiadores)", "Biomasa", "Suelo radiante", "No sé"];
const ACS_TIPOS = ["Caldera (compartida con calefacción)", "Termo eléctrico", "Calentador de gas", "Caldera independiente", "Placas solares térmicas", "No sé"];
const AIRE_TIPOS = ["Split individual", "Multi-split", "Cassette", "Conductos centralizado", "VRV/VRF", "No sé"];
const ILUMINACION_TIPOS = ["LED (predominante)", "Fluorescente", "Halógena / Incandescente", "Mixta"];

interface UploadedDoc { id: number; nombreOriginal: string; tipoDoc: string; tamano: number; estadoRevision: string; }

interface Props { token: string }

export default function PublicCEEForm({ token }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [certifier, setCertifier] = useState<any>(null);
  const [certId, setCertId] = useState<number | null>(null);
  const [paymentBlocked, setPaymentBlocked] = useState(false);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);

  const [prefill, setPrefill] = useState<any>({});
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState({
    // Step 1 — general (pre-filled)
    ownerName: "", ownerEmail: "", ownerPhone: "", ownerDni: "",
    address: "", city: "", postalCode: "", province: "",
    propertyType: "", constructionYear: "", totalArea: "", numPlantas: "", cadastralReference: "",
    // Step 2 — constructive
    cerramientoExterior: "", tipoVentanas: "", tipoMarcos: "", superficieAcristalada: "",
    // Step 3 — calefacción
    tieneCalefaccion: "", tipoCalefaccion: "", anioCalefaccion: "", potenciaCalefaccion: "",
    // Step 4 — ACS
    tipoACS: "", tieneSolares: "", numPaneles: "",
    // Step 5 — refrigeración
    tieneAireAcondicionado: "", tipoAire: "", anioAire: "",
    // Step 6 — iluminación
    tipoIluminacion: "", controlIluminacion: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY(token));
    if (saved) { try { setForm(f => ({ ...f, ...JSON.parse(saved) })); } catch {} }

    fetch(`/api/formulario-cee/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.completed) { setDone(true); setLoading(false); return; }
        if (d.paymentBlocked) { setPaymentBlocked(true); setPaymentToken(d.paymentToken); setLoading(false); return; }

        setCertifier(d.certifier);
        if (d.prefill) setForm(f => ({ ...f, ...Object.fromEntries(Object.entries(d.prefill).filter(([, v]) => v !== "" && v !== null && v !== undefined)) }));
        if (d.documents) setDocs(d.documents);
        if (d.prefill?.certId) setCertId(d.prefill.certId);
        // Extract certId from existing data
        fetch(`/api/formulario-cee/${token}`)
          .then(r2 => r2.json())
          .then(() => {});
        setLoading(false);
        fetch(`/api/formulario-cee/${token}/open`, { method: "POST" }).catch(() => {});
      })
      .catch(() => { setError("No pudimos cargar el formulario."); setLoading(false); });
  }, [token]);

  // Get certId from the cert data – it's embedded in the prefill call
  useEffect(() => {
    if (!certId && certifier) {
      // We need the certId for file uploads. Re-fetch to get it.
      fetch(`/api/formulario-cee/${token}`)
        .then(r => r.json())
        .then(d => { if (d.certId) setCertId(d.certId); })
        .catch(() => {});
    }
  }, [certifier, token, certId]);

  // Auto-save
  useEffect(() => {
    if (!loading) localStorage.setItem(STORAGE_KEY(token), JSON.stringify(form));
  }, [form, loading, token]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // font-size >= 16px prevents iOS Safari auto-zoom
  const inputCls = "w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400";
  const labelCls = "text-xs font-semibold text-stone-500 block mb-1.5 uppercase tracking-wide";

  const OptionGrid = ({ field, options, cols = 2 }: { field: string; options: string[]; cols?: number }) => (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => set(field, opt)}
          className={`py-3 px-3 rounded-2xl text-sm font-medium border-2 transition-all text-center ${
            (form as any)[field] === opt
              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
              : "border-stone-100 bg-stone-50 text-stone-700 hover:border-emerald-200"
          }`}>
          {opt}
        </button>
      ))}
    </div>
  );

  const YesNo = ({ field, label }: { field: string; label: string }) => (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex gap-2">
        {["Sí", "No"].map(v => (
          <button key={v} type="button" onClick={() => set(field, v)}
            className={`flex-1 py-3 rounded-2xl text-sm font-bold border-2 transition-all ${
              (form as any)[field] === v
                ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                : "border-stone-100 bg-stone-50 text-stone-600 hover:border-emerald-200"
            }`}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );

  // File upload
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const uploadFile = async (tipoDoc: string, file: File) => {
    if (!certId) return;
    setUploading(u => ({ ...u, [tipoDoc]: true }));
    const fd = new FormData();
    fd.append("file", file);
    fd.append("tipoDoc", tipoDoc);
    try {
      const res = await fetch(`/api/formulario-cee/${token}/upload/${certId}`, { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const doc = await res.json();
      setDocs(d => [...d.filter(x => x.tipoDoc !== tipoDoc), doc]);
    } catch {
      alert("Error al subir el archivo. Intenta con un archivo más pequeño o en formato PDF/JPG/PNG.");
    } finally {
      setUploading(u => ({ ...u, [tipoDoc]: false }));
    }
  };

  const DocUpload = ({ tipoDoc, label, required, instruction }: { tipoDoc: string; label: string; required?: boolean; instruction: string }) => {
    const uploaded = docs.find(d => d.tipoDoc === tipoDoc);
    const isUploading = uploading[tipoDoc];
    const rejected = uploaded?.estadoRevision === "rechazado";

    return (
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-sm font-semibold text-stone-800">
              {label} {required && <span className="text-red-500">*</span>}
            </p>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{instruction}</p>
          </div>
          {uploaded && !rejected && (
            <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-full flex-shrink-0">✓ Subido</span>
          )}
          {rejected && (
            <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-1 rounded-full flex-shrink-0">Rechazado</span>
          )}
        </div>

        {uploaded && !rejected ? (
          <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-emerald-100">
            <span className="text-emerald-600">📎</span>
            <span className="text-xs text-stone-600 flex-1 truncate">{uploaded.nombreOriginal}</span>
            <span className="text-xs text-stone-400">{(uploaded.tamano / 1024).toFixed(0)} KB</span>
            <button type="button" onClick={() => setDocs(d => d.filter(x => x.id !== uploaded.id))}
              className="text-stone-400 hover:text-red-500 transition-colors text-xs">✕</button>
          </div>
        ) : (
          <>
            {/*
              accept: includes HEIC/HEIF for iOS Live Photos + PDF + common images.
              No `capture` attribute so iOS/Android shows the full picker
              (camera + gallery + files), not just camera.
              The hidden input is triggered via ref so the tap target can be styled.
            */}
            <input
              type="file"
              ref={el => { fileInputRefs.current[tipoDoc] = el; }}
              accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,image/*,application/pdf"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) uploadFile(tipoDoc, e.target.files[0]); }}
            />
            <button type="button" onClick={() => fileInputRefs.current[tipoDoc]?.click()} disabled={isUploading}
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-xl border-2 border-dashed transition-all text-sm font-semibold min-h-[56px] active:scale-[0.98] ${
                rejected
                  ? "border-red-300 text-red-600 bg-red-50 hover:border-red-400"
                  : "border-stone-300 text-stone-500 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50"
              }`}>
              {isUploading
                ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Subiendo…</>
                : <><span className="text-xl">📤</span> {rejected ? "Subir de nuevo" : "Seleccionar archivo"}</>
              }
            </button>
          </>
        )}
      </div>
    );
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/formulario-cee/${token}/submit`, {
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

  const TOTAL_STEPS = 8;

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (paymentBlocked) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">Formulario bloqueado</h2>
        <p className="text-stone-500 text-sm leading-relaxed mb-6">Este formulario se desbloqueará una vez confirmemos tu pago.</p>
        {paymentToken && (
          <a href={`/pay/${paymentToken}`}
            className="block w-full py-4 bg-emerald-700 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-colors">
            Ir a la página de pago →
          </a>
        )}
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">¡Documentación enviada!</h2>
        <p className="text-stone-500 text-sm leading-relaxed">
          Tus datos y documentos han llegado a{" "}
          <strong>{certifier?.name ?? "tu certificador"}</strong>. Te contactarán en breve.
        </p>
        {certifier?.phone && (
          <a href={`https://wa.me/${certifier.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
            className="mt-6 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-2xl font-semibold text-sm">
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
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-black">C5</span>
              </div>
              <span className="font-bold text-stone-800 text-sm">Formulario CEE</span>
            </div>
            <span className="text-xs text-stone-400 font-medium">Paso {step}/{TOTAL_STEPS}</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>
          {certifier?.name && <p className="text-xs text-stone-400 mt-1">{certifier.name}{certifier.company ? ` · ${certifier.company}` : ""}</p>}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        {/* STEP 1 — General property info */}
        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Datos del inmueble</h1>
              <p className="text-stone-500 text-sm mt-1">Revisa y completa los datos básicos</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4">
              {[
                { k: "ownerName", label: "Nombre completo", ph: "María García" },
                { k: "ownerPhone", label: "Teléfono", ph: "+34 600 000 000", type: "tel" },
                { k: "ownerEmail", label: "Email", ph: "maria@email.com", type: "email" },
                { k: "ownerDni", label: "DNI / NIF (opcional)", ph: "12345678A" },
              ].map(f => (
                <div key={f.k}>
                  <label className={labelCls}>{f.label}</label>
                  <input className={inputCls} type={(f as any).type ?? "text"} value={(form as any)[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} />
                </div>
              ))}
              <div className="border-t border-stone-100 pt-4 space-y-3">
                <div>
                  <label className={labelCls}>Dirección completa</label>
                  <input className={inputCls} value={form.address} onChange={e => set("address", e.target.value)} placeholder="Calle Mayor 1, 2º A" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Ciudad</label><input className={inputCls} value={form.city} onChange={e => set("city", e.target.value)} placeholder="Madrid" /></div>
                  <div><label className={labelCls}>C.P.</label><input className={inputCls} value={form.postalCode} onChange={e => set("postalCode", e.target.value)} placeholder="28001" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Superficie (m²)</label><input className={inputCls} type="number" value={form.totalArea} onChange={e => set("totalArea", e.target.value)} placeholder="85" /></div>
                  <div><label className={labelCls}>Año construcción</label><input className={inputCls} type="number" value={form.constructionYear} onChange={e => set("constructionYear", e.target.value)} placeholder="1985" /></div>
                </div>
                <div><label className={labelCls}>Referencia catastral (opcional)</label><input className={inputCls} value={form.cadastralReference} onChange={e => set("cadastralReference", e.target.value)} placeholder="7837298VK4873N0001RR" /></div>
              </div>
            </div>
          </>
        )}

        {/* STEP 2 — Constructive features */}
        {step === 2 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Características constructivas</h1>
              <p className="text-stone-500 text-sm mt-1">Sobre los muros, ventanas y cubierta</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-5">
              <div>
                <label className={labelCls}>¿De qué material son las paredes exteriores?</label>
                <OptionGrid field="cerramientoExterior" options={CERRAMIENTO_OPTS} />
              </div>
              <div>
                <label className={labelCls}>¿Qué tipo de ventanas tienes?</label>
                <OptionGrid field="tipoVentanas" options={VENTANAS_OPTS} cols={1} />
              </div>
              <div>
                <label className={labelCls}>¿De qué son los marcos de las ventanas?</label>
                <OptionGrid field="tipoMarcos" options={MARCOS_OPTS} cols={1} />
              </div>
              <div>
                <label className={labelCls}>Porcentaje aproximado de superficie acristalada</label>
                <select className={inputCls} value={form.superficieAcristalada} onChange={e => set("superficieAcristalada", e.target.value)}>
                  <option value="">Selecciona...</option>
                  {["Menos del 10%", "Entre 10% y 20%", "Entre 20% y 40%", "Más del 40%", "No sé"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </>
        )}

        {/* STEP 3 — Heating */}
        {step === 3 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Sistema de calefacción</h1>
              <p className="text-stone-500 text-sm mt-1">Cómo calientas tu vivienda en invierno</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-5">
              <YesNo field="tieneCalefaccion" label="¿Tiene calefacción?" />
              {form.tieneCalefaccion === "Sí" && (
                <>
                  <div>
                    <label className={labelCls}>Tipo de calefacción</label>
                    <OptionGrid field="tipoCalefaccion" options={CALEFACCION_TIPOS} cols={1} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Año de instalación aprox.</label>
                      <input className={inputCls} type="number" min="1960" max={new Date().getFullYear()} value={form.anioCalefaccion} onChange={e => set("anioCalefaccion", e.target.value)} placeholder="2010" />
                    </div>
                    <div>
                      <label className={labelCls}>Potencia (kW) <span className="normal-case font-normal text-stone-400">opt.</span></label>
                      <input className={inputCls} type="number" value={form.potenciaCalefaccion} onChange={e => set("potenciaCalefaccion", e.target.value)} placeholder="24" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* STEP 4 — ACS */}
        {step === 4 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Agua caliente sanitaria</h1>
              <p className="text-stone-500 text-sm mt-1">Cómo calientas el agua en tu vivienda</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-5">
              <div>
                <label className={labelCls}>¿Cómo se calienta el agua?</label>
                <OptionGrid field="tipoACS" options={ACS_TIPOS} cols={1} />
              </div>
              <YesNo field="tieneSolares" label="¿Tiene placas solares térmicas?" />
              {form.tieneSolares === "Sí" && (
                <div>
                  <label className={labelCls}>Nº de paneles (aprox.)</label>
                  <input className={inputCls} type="number" min="1" value={form.numPaneles} onChange={e => set("numPaneles", e.target.value)} placeholder="4" />
                </div>
              )}
            </div>
          </>
        )}

        {/* STEP 5 — Cooling */}
        {step === 5 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Refrigeración y ventilación</h1>
              <p className="text-stone-500 text-sm mt-1">Cómo refrescas tu vivienda en verano</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-5">
              <YesNo field="tieneAireAcondicionado" label="¿Tiene aire acondicionado?" />
              {form.tieneAireAcondicionado === "Sí" && (
                <>
                  <div>
                    <label className={labelCls}>Tipo de aire acondicionado</label>
                    <OptionGrid field="tipoAire" options={AIRE_TIPOS} cols={2} />
                  </div>
                  <div>
                    <label className={labelCls}>Año de instalación aprox.</label>
                    <input className={inputCls} type="number" min="1980" max={new Date().getFullYear()} value={form.anioAire} onChange={e => set("anioAire", e.target.value)} placeholder="2015" />
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* STEP 6 — Lighting */}
        {step === 6 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Iluminación</h1>
              <p className="text-stone-500 text-sm mt-1">Sobre el tipo de iluminación instalada</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-5">
              <div>
                <label className={labelCls}>¿Qué tipo de iluminación predomina?</label>
                <OptionGrid field="tipoIluminacion" options={ILUMINACION_TIPOS} cols={2} />
              </div>
              <YesNo field="controlIluminacion" label="¿Tiene sensores, temporizadores o domótica para la luz?" />
            </div>
          </>
        )}

        {/* STEP 7 — Documents */}
        {step === 7 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Adjunta los documentos</h1>
              <p className="text-stone-500 text-sm mt-1">Necesarios para redactar el certificado</p>
            </div>
            <div className="space-y-3">
              <DocUpload tipoDoc="factura_luz" label="Factura de electricidad (últimos 12 meses)" required instruction="Puedes descargarla desde la web de tu compañía eléctrica. Formato PDF o foto." />
              <DocUpload tipoDoc="factura_gas" label="Factura de gas" instruction="Si no la tienes, no te preocupes. El certificador puede trabajar sin ella." />
              <DocUpload tipoDoc="referencia_catastral" label="Referencia catastral" instruction="La encuentras en el recibo del IBI o en catastro.meh.es. Solo si no la indicaste antes." />
              <DocUpload tipoDoc="planos" label="Planos del inmueble" instruction="Si tienes planos en papel, puedes hacer una foto con el móvil. Es opcional." />
              <DocUpload tipoDoc="otro" label="Otros documentos" instruction="Hasta 3 archivos adicionales. PDF, JPG, PNG o HEIC. Máx. 15 MB por archivo." />
            </div>
            {!certId && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
                La subida de documentos estará disponible en breve. Puedes continuar y añadirlos más tarde.
              </div>
            )}
          </>
        )}

        {/* STEP 8 — Summary + Submit */}
        {step === 8 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Revisa y confirma</h1>
              <p className="text-stone-500 text-sm mt-1">Comprueba que todo está correcto antes de enviar</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-3">
              {[
                { label: "Propietario", value: form.ownerName },
                { label: "Dirección", value: `${form.address}${form.city ? `, ${form.city}` : ""}` },
                { label: "Superficie", value: form.totalArea ? `${form.totalArea} m²` : "" },
                { label: "Año construcción", value: form.constructionYear },
                { label: "Cerramiento", value: form.cerramientoExterior },
                { label: "Ventanas", value: form.tipoVentanas },
                { label: "Calefacción", value: form.tieneCalefaccion === "Sí" ? form.tipoCalefaccion || "Sí" : "No" },
                { label: "ACS", value: form.tipoACS },
                { label: "Aire acondicionado", value: form.tieneAireAcondicionado === "Sí" ? form.tipoAire || "Sí" : "No" },
                { label: "Iluminación", value: form.tipoIluminacion },
                { label: "Documentos adjuntos", value: docs.length > 0 ? `${docs.length} archivos` : "Ninguno" },
              ].filter(r => r.value).map(row => (
                <div key={row.label} className="flex justify-between items-start gap-4">
                  <span className="text-xs text-stone-400 font-medium pt-0.5 flex-shrink-0">{row.label}</span>
                  <span className="text-sm font-semibold text-stone-800 text-right">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-800">
              Al pulsar "Enviar", tu documentación llegará a <strong>{certifier?.name ?? "tu certificador"}</strong> y recibirás una confirmación por email.
            </div>

            {error && <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-700">{error}</div>}
          </>
        )}
      </div>

      {/* Sticky bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-4 pt-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-shrink-0 px-5 py-4 rounded-2xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 transition-colors">
              ←
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 py-4 bg-emerald-700 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-colors">
              Continuar →
            </button>
          ) : (
            <button onClick={submit} disabled={submitting}
              className="flex-1 py-4 bg-emerald-700 text-white rounded-2xl font-bold text-sm disabled:opacity-50 hover:bg-emerald-600 transition-colors">
              {submitting ? "Enviando…" : "Enviar documentación →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
