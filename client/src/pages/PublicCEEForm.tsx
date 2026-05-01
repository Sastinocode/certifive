import { useState, useEffect, useRef } from "react";
import { getZonaClimatica } from "../lib/zonaClimatica";

const STORAGE_KEY = (token: string) => `certifive_cee_${token}`;

// ── Option lists ───────────────────────────────────────────────────────────────
const CERRAMIENTO_OPTS = ["Ladrillo", "Hormigón", "Piedra natural", "Madera", "Panel sándwich", "No sé"];
const VENTANAS_OPTS = ["Simple acristalamiento", "Doble acristalamiento", "Triple acristalamiento", "No sé"];

interface MarcoOpt { value: string; label: string; sublabel?: string; }
const MARCOS_OPTS_CEX: MarcoOpt[] = [
  { value: "aluminio_sin_rpt", label: "Aluminio sin RPT",       sublabel: "Sin rotura de puente térmico — el más antiguo" },
  { value: "aluminio_con_rpt", label: "Aluminio con RPT",       sublabel: "Con rotura de puente térmico — más eficiente" },
  { value: "pvc",              label: "PVC",                    sublabel: "Plástico — buena aislación térmica" },
  { value: "madera",           label: "Madera",                 sublabel: "Natural — buena aislación" },
  { value: "mixto",            label: "Mixto (madera + aluminio)" },
  { value: "no_se",            label: "No lo sé",               sublabel: "El técnico lo verificará en la visita" },
];

const PERSIANA_TIPOS: { value: string; label: string }[] = [
  { value: "lamas_plastico",  label: "Lamas de plástico (PVC)" },
  { value: "lamas_metalico",  label: "Lamas metálicas" },
  { value: "lamas_madera",    label: "Lamas de madera" },
  { value: "enrollable_otro", label: "Otro tipo de cierre" },
];

interface SistemaOpt { value: string; emoji: string; label: string; sublabel?: string; }
const CALEFACCION_SISTEMAS: SistemaOpt[] = [
  { value: "caldera_gas_natural",   emoji: "🔵", label: "Caldera de gas natural" },
  { value: "caldera_gasoleo",       emoji: "🛢️", label: "Caldera de gasóleo" },
  { value: "caldera_propano",       emoji: "🟠", label: "Caldera de propano / butano" },
  { value: "radiadores_electricos", emoji: "⚡", label: "Radiadores eléctricos" },
  { value: "suelo_radiante_agua",   emoji: "🌡️", label: "Suelo radiante (agua)" },
  { value: "suelo_radiante_elec",   emoji: "⚡", label: "Suelo radiante (eléctrico)" },
  { value: "bomba_calor",           emoji: "🔄", label: "Bomba de calor / aerotermia" },
  { value: "chimenea_biomasa",      emoji: "🪵", label: "Chimenea o estufa de leña / pellets" },
  { value: "fancoil",               emoji: "💨", label: "Fan-coil (agua caliente-fría)" },
];
const ACS_SISTEMAS: SistemaOpt[] = [
  { value: "termo_electrico",       emoji: "⚡", label: "Termo eléctrico" },
  { value: "calentador_gas_nat",    emoji: "🔵", label: "Calentador de gas natural" },
  { value: "calentador_butano",     emoji: "🟠", label: "Calentador de butano / propano" },
  { value: "caldera_mixta_gas",     emoji: "🔥", label: "Caldera mixta de gas natural" },
  { value: "caldera_mixta_gasoleo", emoji: "🛢️", label: "Caldera mixta de gasóleo" },
  { value: "bomba_calor_acs",       emoji: "🌿", label: "Bomba de calor para ACS (aerotermia)" },
  { value: "solar_termica",         emoji: "☀️", label: "Solar térmica (placas solares)" },
];
const AIRE_TIPOS = ["Split individual", "Multi-split", "Cassette", "Conductos centralizado", "VRV/VRF", "No sé"];
const ILUMINACION_TIPOS = ["LED (predominante)", "Fluorescente", "Halógena / Incandescente", "Mixta"];

const REFORMA_TIPOS = [
  { tipo: "fachada",    emoji: "🧱", label: "Fachada (aislamiento exterior, revestimiento…)" },
  { tipo: "cubierta",   emoji: "🏠", label: "Tejado o cubierta" },
  { tipo: "ventanas",   emoji: "🪟", label: "Ventanas o puertas exteriores" },
  { tipo: "calefaccion",emoji: "🔥", label: "Calefacción (caldera, suelo radiante, bomba de calor…)" },
  { tipo: "acs",        emoji: "🚿", label: "Agua caliente (termo, calentador…)" },
  { tipo: "aire",       emoji: "❄️", label: "Aire acondicionado" },
  { tipo: "electrica",  emoji: "⚡", label: "Instalación eléctrica o solar" },
];
const REFORMA_PERIODOS = ["Antes de 2000", "2000-2010", "2011-2020", "2021 o más reciente"];

// ── Types ──────────────────────────────────────────────────────────────────────
interface Reforma { tipo: string; periodo: string; }
interface UploadedDoc { id: number; nombreOriginal: string; tipoDoc: string; tamano: number; estadoRevision: string; }
interface Props { token: string }

// ── Helpers ────────────────────────────────────────────────────────────────────
function isViviendaIndividual(pt: string) {
  // Pisos / apartamentos en edificio → need position questions
  return ["Piso/Apartamento", "Adosado", "Local comercial", "Oficinas"].includes(pt);
}
function isUnifamiliar(pt: string) {
  // Unifamiliar assumes top + direct ground → skip position questions
  return ["Vivienda unifamiliar", "Nave industrial", "Edificio de viviendas"].includes(pt);
}

// ── Main component ─────────────────────────────────────────────────────────────
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

  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    // Step 1 — general (pre-filled)
    ownerName: "", ownerEmail: "", ownerPhone: "", ownerDni: "",
    address: "", city: "", postalCode: "", province: "",
    propertyType: "", constructionYear: "", totalArea: "", numPlantas: "", cadastralReference: "",
    // Step 1 — position (MEJORA 1)
    esUltimaPlanta: "",    // "si" | "no" | ""
    tieneLocalDebajo: "",  // "si" | "no" | ""
    // Step 2 — constructive
    cerramientoExterior: "", tipoVentanas: "", tipoMarcos: "", superficieAcristalada: "",
    // Step 2 — window dimensions + persiana (MEJORA 2)
    anchoVentana: "", altoVentana: "",
    tienePersiana: "", tipoPersiana: "",
    // Step 4 — calefacción
    calefaccionTipoInstalacion: "",   // "individual" | "comunitaria" | "no_tiene"
    tipoCalefaccion: "", anioCalefaccion: "", potenciaCalefaccion: "",
    // Step 5 — ACS
    acsTipoInstalacion: "",           // "individual" | "comunitaria" | "no_tiene"
    tipoACS: "", tieneSolares: "", numPaneles: "",
    numOcupantes: "",                 // "1"|"2"|"3"|"4"|"5"|"6+"
    // Step 5 (refrigeración) — was step 5, now step 6
    tieneAireAcondicionado: "", tipoAire: "", anioAire: "",
    // Step 6 (iluminación) — was step 6, now step 7
    tipoIluminacion: "", controlIluminacion: "",
    // Step 3 NEW — reformas
    tuvoReformas: "",  // "Sí" | "No" | ""
  });

  // Reformas list is a separate array (managed outside set() helper)
  const [reformas, setReformas] = useState<Reforma[]>([]);

  const TOTAL_STEPS = 9;

  // ── Load + restore ──────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY(token));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.form) setForm(f => ({ ...f, ...parsed.form }));
        if (parsed.reformas) setReformas(parsed.reformas);
        if (parsed.step) setStep(parsed.step);
      } catch {}
    }

    fetch(`/api/formulario-cee/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.completed) { setDone(true); setLoading(false); return; }
        if (d.paymentBlocked) { setPaymentBlocked(true); setPaymentToken(d.paymentToken); setLoading(false); return; }

        setCertifier(d.certifier);
        if (d.prefill) {
          setForm(f => ({
            ...f,
            ...Object.fromEntries(Object.entries(d.prefill).filter(([, v]) => v !== "" && v !== null && v !== undefined)),
          }));
        }
        if (d.documents) setDocs(d.documents);
        if (d.certId) setCertId(d.certId);
        setLoading(false);
        fetch(`/api/formulario-cee/${token}/open`, { method: "POST" }).catch(() => {});
      })
      .catch(() => { setError("No pudimos cargar el formulario."); setLoading(false); });
  }, [token]);

  useEffect(() => {
    if (!certId && certifier) {
      fetch(`/api/formulario-cee/${token}`)
        .then(r => r.json())
        .then(d => { if (d.certId) setCertId(d.certId); })
        .catch(() => {});
    }
  }, [certifier, token, certId]);

  // Auto-save
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY(token), JSON.stringify({ form, reformas, step }));
    }
  }, [form, reformas, step, loading, token]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const toggleReforma = (tipo: string) => {
    setReformas(rs => {
      const exists = rs.find(r => r.tipo === tipo);
      if (exists) return rs.filter(r => r.tipo !== tipo);
      return [...rs, { tipo, periodo: "" }];
    });
  };

  const setReformaPeriodo = (tipo: string, periodo: string) => {
    setReformas(rs => rs.map(r => r.tipo === tipo ? { ...r, periodo } : r));
  };

  // Derived
  const anchoN = parseFloat(form.anchoVentana);
  const altoN = parseFloat(form.altoVentana);
  const superficieVentana = (anchoN > 0 && altoN > 0) ? (anchoN * altoN).toFixed(2) : null;

  const esUltima = form.esUltimaPlanta === "si";
  const tieneLocal = form.tieneLocalDebajo === "si";

  // font-size >= 16px prevents iOS Safari auto-zoom on focus
  const inputCls = "w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400";
  const labelCls = "text-xs font-semibold text-stone-500 block mb-1.5 uppercase tracking-wide";

  // ── Sub-components ──────────────────────────────────────────────────────────

  const OptionGrid = ({ field, options, cols = 2 }: { field: string; options: string[]; cols?: number }) => (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => set(field, opt)}
          className={`py-3 px-3 rounded-2xl text-sm font-medium border-2 transition-all text-center min-h-[44px] ${
            (form as any)[field] === opt
              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
              : "border-stone-100 bg-stone-50 text-stone-700 hover:border-emerald-200"
          }`}>
          {opt}
        </button>
      ))}
    </div>
  );

  // OptionGrid with sub-labels (for MARCOS_OPTS_CEX and PERSIANA_TIPOS)
  const OptionGridCEX = ({ field, options }: { field: string; options: MarcoOpt[] }) => (
    <div className="space-y-2">
      {options.map(opt => (
        <button key={opt.value} type="button" onClick={() => set(field, opt.value)}
          className={`w-full flex items-start gap-3 py-3 px-4 rounded-2xl border-2 transition-all text-left min-h-[44px] ${
            (form as any)[field] === opt.value
              ? "border-emerald-500 bg-emerald-50"
              : "border-stone-100 bg-stone-50 hover:border-emerald-200"
          }`}>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${(form as any)[field] === opt.value ? "text-emerald-800" : "text-stone-700"}`}>
              {opt.label}
            </p>
            {opt.sublabel && (
              <p className={`text-xs mt-0.5 ${(form as any)[field] === opt.value ? "text-emerald-600/80" : "text-stone-400"}`}>
                {opt.sublabel}
              </p>
            )}
          </div>
          {(form as any)[field] === opt.value && (
            <span className="text-emerald-600 font-bold text-lg leading-none flex-shrink-0 mt-0.5">✓</span>
          )}
        </button>
      ))}
    </div>
  );

  // Si/No cards with emoji icon + text (MEJORA 1 style)
  const SiNoCards = ({
    field, labelSi, labelNo, emojiSi, emojiNo, helpTip,
  }: {
    field: string; labelSi: string; labelNo: string;
    emojiSi: string; emojiNo: string; helpTip?: string;
  }) => (
    <div className="space-y-2">
      {helpTip && <p className="text-xs text-stone-400 italic">{helpTip}</p>}
      <div className="flex flex-col gap-2">
        {[
          { v: "si", emoji: emojiSi, label: labelSi },
          { v: "no", emoji: emojiNo, label: labelNo },
        ].map(opt => (
          <button key={opt.v} type="button" onClick={() => set(field, opt.v)}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] min-h-[56px] ${
              (form as any)[field] === opt.v
                ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                : "border-stone-100 bg-stone-50 text-stone-700 hover:border-emerald-200"
            }`}>
            <span className="text-2xl leading-none flex-shrink-0">{opt.emoji}</span>
            <span className="text-sm font-medium flex-1">{opt.label}</span>
            {(form as any)[field] === opt.v && (
              <span className="ml-auto text-emerald-600 font-bold text-lg leading-none">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const YesNo = ({ field, label }: { field: string; label: string }) => (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex gap-2">
        {["Sí", "No"].map(v => (
          <button key={v} type="button" onClick={() => set(field, v)}
            className={`flex-1 py-3 rounded-2xl text-sm font-bold border-2 transition-all min-h-[44px] ${
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

  // ── File upload ─────────────────────────────────────────────────────────────
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
            <p className="text-sm font-semibold text-stone-800">{label} {required && <span className="text-red-500">*</span>}</p>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{instruction}</p>
          </div>
          {uploaded && !rejected && <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-full flex-shrink-0">✓ Subido</span>}
          {rejected && <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-1 rounded-full flex-shrink-0">Rechazado</span>}
        </div>
        {uploaded && !rejected ? (
          <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-emerald-100">
            <span className="text-emerald-600">📎</span>
            <span className="text-xs text-stone-600 flex-1 truncate">{uploaded.nombreOriginal}</span>
            <span className="text-xs text-stone-400">{(uploaded.tamano / 1024).toFixed(0)} KB</span>
            <button type="button" onClick={() => setDocs(d => d.filter(x => x.id !== uploaded.id))} className="text-stone-400 hover:text-red-500 transition-colors text-xs">✕</button>
          </div>
        ) : (
          <>
            <input type="file" ref={el => { fileInputRefs.current[tipoDoc] = el; }}
              accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,image/*,application/pdf"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) uploadFile(tipoDoc, e.target.files[0]); }} />
            <button type="button" onClick={() => fileInputRefs.current[tipoDoc]?.click()} disabled={isUploading}
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-xl border-2 border-dashed transition-all text-sm font-semibold min-h-[56px] active:scale-[0.98] ${
                rejected
                  ? "border-red-300 text-red-600 bg-red-50 hover:border-red-400"
                  : "border-stone-300 text-stone-500 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50"
              }`}>
              {isUploading
                ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Subiendo…</>
                : <><span className="text-xl">📤</span> {rejected ? "Subir de nuevo" : "Seleccionar archivo"}</>}
            </button>
          </>
        )}
      </div>
    );
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...form,
        reformas,
        superficieVentana: superficieVentana ?? undefined,
        zonaClimatica: getZonaClimatica(form.postalCode) ?? undefined,
      };
      const res = await fetch(`/api/formulario-cee/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  // ── Screen variants ─────────────────────────────────────────────────────────
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
          <a href={`/pay/${paymentToken}`} className="block w-full py-4 bg-emerald-700 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-colors">
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

  // ── Main render ─────────────────────────────────────────────────────────────
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
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>
          {certifier?.name && (
            <p className="text-xs text-stone-400 mt-1">{certifier.name}{certifier.company ? ` · ${certifier.company}` : ""}</p>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        {/* ────────────────────────────────────────────────────────────────────
            STEP 1 — Datos del inmueble + tipo + posición vertical (MEJORA 1)
        ──────────────────────────────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Datos del inmueble</h1>
              <p className="text-stone-500 text-sm mt-1">Revisa y completa los datos básicos</p>
            </div>

            {/* Personal data */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4">
              {[
                { k: "ownerName",  label: "Nombre completo",        ph: "María García",         type: "text" },
                { k: "ownerPhone", label: "Teléfono",               ph: "+34 600 000 000",      type: "tel" },
                { k: "ownerEmail", label: "Email",                  ph: "maria@email.com",      type: "email" },
                { k: "ownerDni",   label: "DNI / NIF (opcional)",   ph: "12345678A",            type: "text" },
              ].map(f => (
                <div key={f.k}>
                  <label className={labelCls}>{f.label}</label>
                  <input className={inputCls} type={f.type} value={(form as any)[f.k]}
                    onChange={e => set(f.k, e.target.value)} placeholder={f.ph} />
                </div>
              ))}
            </div>

            {/* Address + dimensions */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4">
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

            {/* Property type */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4">
              <div>
                <label className={labelCls}>¿Qué tipo de inmueble es?</label>
                <OptionGrid field="propertyType" cols={1} options={[
                  "Piso/Apartamento",
                  "Vivienda unifamiliar",
                  "Adosado",
                  "Local comercial",
                  "Oficinas",
                  "Nave industrial",
                  "Edificio de viviendas",
                ]} />
              </div>

              {/* Position questions — only for piso/apartamento/adosado (MEJORA 1) */}
              {isViviendaIndividual(form.propertyType) && (
                <div className="space-y-5 pt-2 border-t border-stone-100">

                  {/* Pregunta A — última planta */}
                  <div>
                    <p className="text-sm font-bold text-stone-800 mb-1">
                      ¿Es la última planta o tiene cubierta directa sobre su vivienda?
                    </p>
                    <SiNoCards
                      field="esUltimaPlanta"
                      emojiSi="🏠" labelSi="Sí, es la última planta o tiene tejado/terraza encima"
                      emojiNo="🏢" labelNo="No, hay otra vivienda o planta encima"
                      helpTip="Esto determina si el calor se escapa por el techo"
                    />
                  </div>

                  {/* Pregunta B — local debajo */}
                  <div>
                    <p className="text-sm font-bold text-stone-800 mb-1">
                      ¿Hay un local, garaje o sótano debajo de su vivienda?
                    </p>
                    <SiNoCards
                      field="tieneLocalDebajo"
                      emojiSi="🏪" labelSi="Sí, hay local, garaje o sótano debajo"
                      emojiNo="🏠" labelNo="No, hay otra vivienda debajo"
                      helpTip="Esto determina si el frío sube desde abajo"
                    />
                  </div>
                </div>
              )}

              {/* Unifamiliar: auto-assume position, show informational note */}
              {isUnifamiliar(form.propertyType) && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-800 flex items-start gap-2">
                  <span className="text-lg">ℹ️</span>
                  <span>Al ser unifamiliar, el técnico asumirá exposición directa a cubierta y terreno.</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* ────────────────────────────────────────────────────────────────────
            STEP 2 — Características constructivas + MEJORA 2
        ──────────────────────────────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Características constructivas</h1>
              <p className="text-stone-500 text-sm mt-1">Sobre los muros, ventanas y cubierta</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-6">

              {/* Cerramiento — unchanged */}
              <div>
                <label className={labelCls}>¿De qué material son las paredes exteriores?</label>
                <OptionGrid field="cerramientoExterior" options={CERRAMIENTO_OPTS} />
              </div>

              {/* Tipo de vidrio — unchanged */}
              <div>
                <label className={labelCls}>¿Qué tipo de acristalamiento tienen las ventanas?</label>
                <OptionGrid field="tipoVentanas" options={VENTANAS_OPTS} cols={1} />
              </div>

              {/* ── Window dimensions (MEJORA 2) ── */}
              <div>
                <label className={labelCls}>Dimensiones de la ventana típica <span className="normal-case font-normal text-stone-400">(opcional)</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Ancho (m)</label>
                    <input
                      className={inputCls}
                      type="number" step="0.1" min="0.3" max="4.0"
                      placeholder="Ej: 1.20"
                      value={form.anchoVentana}
                      onChange={e => set("anchoVentana", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">Alto (m)</label>
                    <input
                      className={inputCls}
                      type="number" step="0.1" min="0.5" max="3.5"
                      placeholder="Ej: 1.50"
                      value={form.altoVentana}
                      onChange={e => set("altoVentana", e.target.value)}
                    />
                  </div>
                </div>
                {superficieVentana && (
                  <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                    <span>📐</span>
                    <span>Superficie: <strong>{superficieVentana} m²</strong> por ventana</span>
                  </p>
                )}
              </div>

              {/* ── Marco del marco — CEX options (MEJORA 2) ── */}
              <div>
                <label className={labelCls}>¿De qué material son los marcos?</label>
                <OptionGridCEX field="tipoMarcos" options={MARCOS_OPTS_CEX} />
              </div>

              {/* ── Persiana (MEJORA 2) ── */}
              <div className="space-y-3">
                <YesNo field="tienePersiana" label="¿Tienen persiana u otro tipo de cierre exterior?" />
                {form.tienePersiana === "Sí" && (
                  <div>
                    <label className={labelCls}>Tipo de persiana o cierre</label>
                    <OptionGridCEX
                      field="tipoPersiana"
                      options={PERSIANA_TIPOS.map(p => ({ value: p.value, label: p.label }))}
                    />
                  </div>
                )}
              </div>

              {/* Superficie acristalada — unchanged */}
              <div>
                <label className={labelCls}>Porcentaje aproximado de superficie acristalada <span className="normal-case font-normal text-stone-400">(del total de fachada)</span></label>
                <select className={inputCls} value={form.superficieAcristalada} onChange={e => set("superficieAcristalada", e.target.value)}>
                  <option value="">Selecciona...</option>
                  {["Menos del 10%", "Entre 10% y 20%", "Entre 20% y 40%", "Más del 40%", "No sé"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

            </div>
          </>
        )}

        {/* ────────────────────────────────────────────────────────────────────
            STEP 3 — 🔨 Reformas recientes (MEJORA 3 — nuevo paso)
        ──────────────────────────────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">🔨 ¿Ha habido reformas recientes?</h1>
              <p className="text-stone-500 text-sm mt-1">
                Las reformas cambian mucho la eficiencia. Si no ha habido ninguna, sáltate este paso.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-5">

              {/* Pregunta inicial — botones grandes */}
              <div>
                <p className="text-sm font-bold text-stone-800 mb-3">¿Ha habido alguna reforma en los últimos 20 años?</p>
                <div className="flex flex-col gap-3">
                  {[
                    { v: "Sí", label: "Sí, ha habido reformas", emoji: "🔨" },
                    { v: "No", label: "No, nunca se ha reformado", emoji: "✅" },
                  ].map(opt => (
                    <button key={opt.v} type="button" onClick={() => {
                        set("tuvoReformas", opt.v);
                        if (opt.v === "No") setReformas([]);
                      }}
                      className={`w-full flex items-center gap-4 px-5 py-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] min-h-[64px] ${
                        form.tuvoReformas === opt.v
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                          : "border-stone-100 bg-stone-50 text-stone-700 hover:border-emerald-200"
                      }`}>
                      <span className="text-2xl leading-none flex-shrink-0">{opt.emoji}</span>
                      <span className="text-sm font-semibold flex-1">{opt.label}</span>
                      {form.tuvoReformas === opt.v && (
                        <span className="text-emerald-600 font-bold text-xl leading-none">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkbox list — shown only if "Sí" */}
              {form.tuvoReformas === "Sí" && (
                <div className="space-y-4 pt-2 border-t border-stone-100">
                  <p className="text-sm font-semibold text-stone-700">¿Qué se reformó? <span className="font-normal text-stone-400">(puede ser más de una)</span></p>

                  <div className="space-y-2">
                    {REFORMA_TIPOS.map(rt => {
                      const selected = reformas.find(r => r.tipo === rt.tipo);
                      return (
                        <div key={rt.tipo} className="space-y-2">
                          {/* Checkbox row */}
                          <button type="button" onClick={() => toggleReforma(rt.tipo)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all min-h-[52px] ${
                              selected
                                ? "border-emerald-500 bg-emerald-50"
                                : "border-stone-100 bg-stone-50 hover:border-emerald-200"
                            }`}>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              selected ? "border-emerald-500 bg-emerald-500" : "border-stone-300 bg-white"
                            }`}>
                              {selected && <span className="text-white text-xs font-black leading-none">✓</span>}
                            </div>
                            <span className="text-lg leading-none flex-shrink-0">{rt.emoji}</span>
                            <span className={`text-sm font-medium flex-1 ${selected ? "text-emerald-800" : "text-stone-700"}`}>
                              {rt.label}
                            </span>
                          </button>

                          {/* Periodo select — shown when checkbox is ticked */}
                          {selected && (
                            <div className="ml-8 pl-3 border-l-2 border-emerald-200">
                              <label className="text-xs text-stone-500 font-medium block mb-1">
                                Año aproximado de la reforma <span className="text-stone-400">(opcional)</span>
                              </label>
                              <select
                                className={inputCls + " text-sm"}
                                value={selected.periodo}
                                onChange={e => setReformaPeriodo(rt.tipo, e.target.value)}
                              >
                                <option value="">Selecciona un período…</option>
                                {REFORMA_PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ────────────────────────────────────────────────────────────────────
            STEP 4 — Calefacción (MEJORA 1.1)
        ──────────────────────────────────────────────────────────────────── */}
        {step === 4 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Sistema de calefacción</h1>
              <p className="text-stone-500 text-sm mt-1">Cómo calientas tu vivienda en invierno</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-5">

              {/* Tipo de instalación — individual / comunitaria / no_tiene */}
              <div>
                <label className={labelCls}>¿La calefacción es individual o comunitaria?</label>
                <div className="space-y-2">
                  {[
                    { v: "individual",  emoji: "🏠", label: "Individual (solo de mi vivienda)",    sub: "Tienes tu propia caldera, radiadores o bomba de calor" },
                    { v: "comunitaria", emoji: "🏢", label: "Comunitaria (del edificio)",          sub: "Sala de calderas común, factura incluida o contada aparte" },
                    { v: "no_tiene",    emoji: "❌", label: "No hay calefacción" },
                  ].map(opt => (
                    <button key={opt.v} type="button" onClick={() => set("calefaccionTipoInstalacion", opt.v)}
                      className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-2 text-left transition-all min-h-[56px] ${
                        form.calefaccionTipoInstalacion === opt.v
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-stone-100 bg-stone-50 hover:border-emerald-200"
                      }`}>
                      <span className="text-2xl leading-none flex-shrink-0">{opt.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${form.calefaccionTipoInstalacion === opt.v ? "text-emerald-800" : "text-stone-700"}`}>{opt.label}</p>
                        {opt.sub && <p className={`text-xs mt-0.5 ${form.calefaccionTipoInstalacion === opt.v ? "text-emerald-600/80" : "text-stone-400"}`}>{opt.sub}</p>}
                      </div>
                      {form.calefaccionTipoInstalacion === opt.v && <span className="text-emerald-600 font-bold text-lg flex-shrink-0">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comunitaria → mensaje informativo, sin más preguntas */}
              {form.calefaccionTipoInstalacion === "comunitaria" && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">💡</span>
                  <p className="text-sm text-blue-800">
                    Al ser comunitaria, el técnico solicitará los datos técnicos a la comunidad de propietarios.
                    <strong> No necesitas aportar más información sobre calefacción.</strong>
                  </p>
                </div>
              )}

              {/* Individual → selector de sistema detallado + año + potencia */}
              {form.calefaccionTipoInstalacion === "individual" && (
                <>
                  <div>
                    <label className={labelCls}>Tipo de sistema de calefacción</label>
                    <div className="space-y-2">
                      {CALEFACCION_SISTEMAS.map(opt => (
                        <button key={opt.value} type="button" onClick={() => set("tipoCalefaccion", opt.value)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all min-h-[48px] ${
                            form.tipoCalefaccion === opt.value
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-stone-100 bg-stone-50 hover:border-emerald-200"
                          }`}>
                          <span className="text-xl leading-none flex-shrink-0">{opt.emoji}</span>
                          <span className={`text-sm font-medium flex-1 ${form.tipoCalefaccion === opt.value ? "text-emerald-800" : "text-stone-700"}`}>{opt.label}</span>
                          {form.tipoCalefaccion === opt.value && <span className="text-emerald-600 font-bold text-lg flex-shrink-0">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Año instalación aprox. <span className="normal-case font-normal text-stone-400">opt.</span></label>
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

        {/* ────────────────────────────────────────────────────────────────────
            STEP 5 — ACS (MEJORA 1.2 + 1.3)
        ──────────────────────────────────────────────────────────────────── */}
        {step === 5 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Agua caliente sanitaria</h1>
              <p className="text-stone-500 text-sm mt-1">Cómo calientas el agua en tu vivienda</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-5">

              {/* Tipo de instalación — individual / comunitaria / no_tiene */}
              <div>
                <label className={labelCls}>¿El agua caliente es individual o comunitaria?</label>
                <div className="space-y-2">
                  {[
                    { v: "individual",  emoji: "🏠", label: "Individual (mi propio equipo)",        sub: "Termo, calentador o caldera propio" },
                    { v: "comunitaria", emoji: "🏢", label: "Comunitaria (del edificio)",            sub: "Caldera central compartida con los vecinos" },
                    { v: "no_tiene",    emoji: "❌", label: "No hay agua caliente instalada" },
                  ].map(opt => (
                    <button key={opt.v} type="button" onClick={() => set("acsTipoInstalacion", opt.v)}
                      className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-2 text-left transition-all min-h-[56px] ${
                        form.acsTipoInstalacion === opt.v
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-stone-100 bg-stone-50 hover:border-emerald-200"
                      }`}>
                      <span className="text-2xl leading-none flex-shrink-0">{opt.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${form.acsTipoInstalacion === opt.v ? "text-emerald-800" : "text-stone-700"}`}>{opt.label}</p>
                        {opt.sub && <p className={`text-xs mt-0.5 ${form.acsTipoInstalacion === opt.v ? "text-emerald-600/80" : "text-stone-400"}`}>{opt.sub}</p>}
                      </div>
                      {form.acsTipoInstalacion === opt.v && <span className="text-emerald-600 font-bold text-lg flex-shrink-0">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comunitaria → informativo */}
              {form.acsTipoInstalacion === "comunitaria" && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">💡</span>
                  <p className="text-sm text-blue-800">
                    Al ser comunitaria, el técnico solicitará los datos técnicos a la comunidad.
                    <strong> No necesitas aportar más información sobre ACS.</strong>
                  </p>
                </div>
              )}

              {/* Individual → selector de sistema + paneles solares */}
              {form.acsTipoInstalacion === "individual" && (
                <>
                  <div>
                    <label className={labelCls}>Tipo de equipo para el agua caliente</label>
                    <div className="space-y-2">
                      {ACS_SISTEMAS.map(opt => (
                        <button key={opt.value} type="button" onClick={() => set("tipoACS", opt.value)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all min-h-[48px] ${
                            form.tipoACS === opt.value
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-stone-100 bg-stone-50 hover:border-emerald-200"
                          }`}>
                          <span className="text-xl leading-none flex-shrink-0">{opt.emoji}</span>
                          <span className={`text-sm font-medium flex-1 ${form.tipoACS === opt.value ? "text-emerald-800" : "text-stone-700"}`}>{opt.label}</span>
                          {form.tipoACS === opt.value && <span className="text-emerald-600 font-bold text-lg flex-shrink-0">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <YesNo field="tieneSolares" label="¿Tiene placas solares térmicas además?" />
                  {form.tieneSolares === "Sí" && (
                    <div>
                      <label className={labelCls}>Nº de paneles (aprox.)</label>
                      <input className={inputCls} type="number" min="1" value={form.numPaneles} onChange={e => set("numPaneles", e.target.value)} placeholder="4" />
                    </div>
                  )}
                </>
              )}

              {/* Número de ocupantes — MEJORA 1.3 (siempre visible) */}
              <div className="border-t border-stone-100 pt-5">
                <label className={labelCls}>¿Cuántas personas viven habitualmente en la vivienda?</label>
                <p className="text-xs text-stone-400 italic mb-3">
                  El número de ocupantes determina el consumo de agua caliente (litros/día) que necesita el certificado energético.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {["1", "2", "3", "4", "5", "6+"].map(n => (
                    <button key={n} type="button" onClick={() => set("numOcupantes", n)}
                      className={`py-4 rounded-2xl text-base font-bold border-2 transition-all min-h-[56px] ${
                        form.numOcupantes === n
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-stone-100 bg-stone-50 text-stone-600 hover:border-emerald-200"
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </>
        )}

        {/* ────────────────────────────────────────────────────────────────────
            STEP 6 — Refrigeración (was step 5)
        ──────────────────────────────────────────────────────────────────── */}
        {step === 6 && (
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

        {/* ────────────────────────────────────────────────────────────────────
            STEP 7 — Iluminación (was step 6)
        ──────────────────────────────────────────────────────────────────── */}
        {step === 7 && (
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

        {/* ────────────────────────────────────────────────────────────────────
            STEP 8 — Documentos (was step 7)
        ──────────────────────────────────────────────────────────────────── */}
        {step === 8 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Adjunta los documentos</h1>
              <p className="text-stone-500 text-sm mt-1">Necesarios para redactar el certificado</p>
            </div>
            <div className="space-y-3">
              <DocUpload tipoDoc="factura_luz"         label="Factura de electricidad (últimos 12 meses)" required instruction="Puedes descargarla desde la web de tu compañía eléctrica. Formato PDF o foto." />
              <DocUpload tipoDoc="factura_gas"         label="Factura de gas"                            instruction="Si no la tienes, no te preocupes. El certificador puede trabajar sin ella." />
              <DocUpload tipoDoc="referencia_catastral" label="Referencia catastral"                     instruction="La encuentras en el recibo del IBI o en catastro.meh.es. Solo si no la indicaste antes." />
              <DocUpload tipoDoc="planos"              label="Planos del inmueble"                       instruction="Si tienes planos en papel, puedes hacer una foto con el móvil. Es opcional." />
              <DocUpload tipoDoc="otro"                label="Otros documentos"                          instruction="Hasta 3 archivos adicionales. PDF, JPG, PNG o HEIC. Máx. 15 MB por archivo." />
            </div>
            {!certId && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
                La subida de documentos estará disponible en breve. Puedes continuar y añadirlos más tarde.
              </div>
            )}
          </>
        )}

        {/* ────────────────────────────────────────────────────────────────────
            STEP 9 — Resumen + Submit (was step 8) — updated with new fields
        ──────────────────────────────────────────────────────────────────── */}
        {step === 9 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Revisa y confirma</h1>
              <p className="text-stone-500 text-sm mt-1">Comprueba que todo está correcto antes de enviar</p>
            </div>

            {/* General data */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">📋 Datos del inmueble</p>
              {[
                { label: "Propietario",    value: form.ownerName },
                { label: "Dirección",      value: `${form.address}${form.city ? `, ${form.city}` : ""}` },
                { label: "Superficie",     value: form.totalArea ? `${form.totalArea} m²` : "" },
                { label: "Año constr.",    value: form.constructionYear },
                { label: "Tipo inmueble",  value: form.propertyType },
              ].filter(r => r.value).map(row => (
                <div key={row.label} className="flex justify-between items-start gap-4">
                  <span className="text-xs text-stone-400 font-medium pt-0.5 flex-shrink-0">{row.label}</span>
                  <span className="text-sm font-semibold text-stone-800 text-right">{row.value}</span>
                </div>
              ))}

              {/* Position summary (MEJORA 1) */}
              {isViviendaIndividual(form.propertyType) && (form.esUltimaPlanta || form.tieneLocalDebajo) && (
                <>
                  <div className="border-t border-stone-100 pt-3 mt-1" />
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">📍 Posición vertical</p>
                  {form.esUltimaPlanta && (
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-xs text-stone-400 font-medium pt-0.5 flex-shrink-0">Cubierta encima</span>
                      <span className="text-sm font-semibold text-stone-800 text-right">
                        {form.esUltimaPlanta === "si" ? "Sí — última planta" : "No — hay piso encima"}
                      </span>
                    </div>
                  )}
                  {form.tieneLocalDebajo && (
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-xs text-stone-400 font-medium pt-0.5 flex-shrink-0">Suelo debajo</span>
                      <span className="text-sm font-semibold text-stone-800 text-right">
                        {form.tieneLocalDebajo === "si" ? "Sí — local/garaje/sótano" : "No — hay piso debajo"}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Constructive summary */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">🏗️ Características constructivas</p>
              {[
                { label: "Cerramiento",    value: form.cerramientoExterior },
                { label: "Ventanas",       value: form.tipoVentanas },
                { label: "Marcos",         value: MARCOS_OPTS_CEX.find(m => m.value === form.tipoMarcos)?.label ?? form.tipoMarcos },
                {
                  label: "Dimensión ventana",
                  value: superficieVentana ? `${form.anchoVentana} × ${form.altoVentana} m = ${superficieVentana} m²` : "",
                },
                {
                  label: "Persiana",
                  value: form.tienePersiana === "Sí"
                    ? (PERSIANA_TIPOS.find(p => p.value === form.tipoPersiana)?.label ?? "Sí")
                    : form.tienePersiana === "No" ? "Sin persiana" : "",
                },
                { label: "Acristalamiento", value: form.superficieAcristalada },
              ].filter(r => r.value).map(row => (
                <div key={row.label} className="flex justify-between items-start gap-4">
                  <span className="text-xs text-stone-400 font-medium pt-0.5 flex-shrink-0">{row.label}</span>
                  <span className="text-sm font-semibold text-stone-800 text-right">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Reformas summary (MEJORA 3) */}
            {form.tuvoReformas && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">🔨 Reformas recientes</p>
                {form.tuvoReformas === "No" ? (
                  <p className="text-sm text-stone-600">Sin reformas en los últimos 20 años</p>
                ) : reformas.length === 0 ? (
                  <p className="text-sm text-stone-400 italic">Reformas indicadas pero sin detalle</p>
                ) : (
                  <div className="space-y-2">
                    {reformas.map(r => {
                      const rt = REFORMA_TIPOS.find(x => x.tipo === r.tipo);
                      return (
                        <div key={r.tipo} className="flex justify-between items-center gap-4">
                          <span className="text-sm text-stone-700 flex items-center gap-2">
                            <span>{rt?.emoji}</span>
                            <span>{rt?.label}</span>
                          </span>
                          {r.periodo && (
                            <span className="text-xs text-stone-400 font-medium flex-shrink-0">{r.periodo}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Installations summary */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">⚡ Instalaciones</p>
              {[
                {
                  label: "Calefacción",
                  value: form.calefaccionTipoInstalacion === "no_tiene" ? "Sin calefacción"
                    : form.calefaccionTipoInstalacion === "comunitaria" ? "Comunitaria"
                    : form.tipoCalefaccion
                    ? `Individual — ${CALEFACCION_SISTEMAS.find(s => s.value === form.tipoCalefaccion)?.label ?? form.tipoCalefaccion}`
                    : form.calefaccionTipoInstalacion === "individual" ? "Individual" : "",
                },
                {
                  label: "ACS",
                  value: form.acsTipoInstalacion === "no_tiene" ? "Sin ACS"
                    : form.acsTipoInstalacion === "comunitaria" ? "Comunitaria"
                    : form.tipoACS
                    ? `Individual — ${ACS_SISTEMAS.find(s => s.value === form.tipoACS)?.label ?? form.tipoACS}`
                    : form.acsTipoInstalacion === "individual" ? "Individual" : "",
                },
                { label: "Ocupantes", value: form.numOcupantes ? `${form.numOcupantes} persona${form.numOcupantes === "1" ? "" : "s"}` : "" },
                { label: "Aire acondicionado", value: form.tieneAireAcondicionado === "Sí" ? (form.tipoAire || "Sí") : form.tieneAireAcondicionado === "No" ? "No" : "" },
                { label: "Iluminación",       value: form.tipoIluminacion },
                { label: "Documentos adjuntos", value: docs.length > 0 ? `${docs.length} archivo${docs.length > 1 ? "s" : ""}` : "" },
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

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-700">{error}</div>
            )}
          </>
        )}
      </div>

      {/* ── Sticky bottom nav ──────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-4 pt-4"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-shrink-0 px-5 py-4 rounded-2xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 transition-colors min-h-[52px]">
              ←
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 py-4 bg-emerald-700 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-colors min-h-[52px]">
              Continuar →
            </button>
          ) : (
            <button onClick={submit} disabled={submitting}
              className="flex-1 py-4 bg-emerald-700 text-white rounded-2xl font-bold text-sm disabled:opacity-50 hover:bg-emerald-600 transition-colors min-h-[52px]">
              {submitting ? "Enviando…" : "Enviar documentación →"}
            </button>
          )}
        </div>

        {/* Skip hint for step 3 (reformas) */}
        {step === 3 && !form.tuvoReformas && (
          <div className="max-w-lg mx-auto mt-2">
            <p className="text-xs text-center text-stone-400">
              Si no ha habido reformas, pulsa <strong>Continuar →</strong> para saltar este paso.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
