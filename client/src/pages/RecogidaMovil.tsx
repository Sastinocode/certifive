/**
 * RecogidaMovil — Formulario móvil optimizado para recogida de datos CEE.
 *
 * Ruta: /recogida/:token  (pública, usa el mismo ceeToken)
 * API:  /api/formulario-cee/:token  (mismos endpoints que PublicCEEForm)
 *
 * 5 pasos consolidados (vs 9 en el formulario clásico):
 *   1. Tus datos     — Nombre, email, teléfono, DNI
 *   2. La vivienda   — Dirección, tipo, año, superficie, posición
 *   3. Instalaciones — Ventanas, calefacción, ACS, aire, reformas, iluminación
 *   4. Documentos    — Facturas, catastro, planos
 *   5. Revisar       — Resumen + envío
 */
import { useState, useEffect, useRef } from "react";
import { getZonaClimatica } from "../lib/zonaClimatica";
import {
  VENTANAS_OPTS, MARCOS_OPTS, CALEFACCION_SISTEMAS, ACS_SISTEMAS,
  REFORMA_TIPOS, REFORMA_PERIODOS, ILUMINACION_TIPOS, PROPERTY_TYPES,
} from "../lib/options";

// ─────────────────────────────────────────────────────────────────────────────
// Constants & option lists
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = (token: string) => `certifive_recogida_${token}`;


// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Reforma { tipo: string; periodo: string; }
interface UploadedDoc { id: number; nombreOriginal: string; tipoDoc: string; tamano: number; }

interface FormState {
  // Step 1
  ownerName: string; ownerEmail: string; ownerPhone: string; ownerDni: string;
  // Step 2
  address: string; city: string; postalCode: string; province: string;
  propertyType: string; constructionYear: string; totalArea: string;
  numPlantas: string; cadastralReference: string;
  esUltimaPlanta: string; tieneLocalDebajo: string;
  // Step 3 — ventanas
  tipoVentanas: string; tipoMarcos: string; tienePersiana: string;
  anchoVentana: string; altoVentana: string;
  // Step 3 — calefacción
  calefaccionTipoInstalacion: string; tipoCalefaccion: string; anioCalefaccion: string;
  // Step 3 — ACS
  acsTipoInstalacion: string; tipoACS: string; tieneSolares: string; numPaneles: string;
  numOcupantes: string;
  // Step 3 — aire
  tieneAireAcondicionado: string; tipoAire: string;
  // Step 3 — reformas
  tuvoReformas: string;
  // Step 3 — iluminación
  tipoIluminacion: string;
}

const INITIAL_FORM: FormState = {
  ownerName: "", ownerEmail: "", ownerPhone: "", ownerDni: "",
  address: "", city: "", postalCode: "", province: "",
  propertyType: "", constructionYear: "", totalArea: "",
  numPlantas: "", cadastralReference: "",
  esUltimaPlanta: "", tieneLocalDebajo: "",
  tipoVentanas: "", tipoMarcos: "", tienePersiana: "",
  anchoVentana: "", altoVentana: "",
  calefaccionTipoInstalacion: "", tipoCalefaccion: "", anioCalefaccion: "",
  acsTipoInstalacion: "", tipoACS: "", tieneSolares: "", numPaneles: "",
  numOcupantes: "",
  tieneAireAcondicionado: "", tipoAire: "",
  tuvoReformas: "",
  tipoIluminacion: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Step metadata
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, emoji: "👤", label: "Tus datos" },
  { n: 2, emoji: "🏠", label: "La vivienda" },
  { n: 3, emoji: "⚙️", label: "Instalaciones" },
  { n: 4, emoji: "📄", label: "Documentos" },
  { n: 5, emoji: "✅", label: "Revisar" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

function validateStep(step: number, form: FormState): string[] {
  const errs: string[] = [];
  if (step === 1) {
    if (!form.ownerName.trim()) errs.push("Introduce tu nombre completo.");
    if (!form.ownerEmail.trim()) errs.push("Introduce tu email.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail))
      errs.push("El email no parece válido.");
  }
  if (step === 2) {
    if (!form.address.trim()) errs.push("Introduce la dirección del inmueble.");
    if (!form.propertyType) errs.push("Selecciona el tipo de inmueble.");
  }
  return errs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2">
      <label className="text-sm font-semibold text-stone-700 block">{children}</label>
      {hint && <p className="text-xs text-stone-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Input({
  value, onChange, placeholder, type = "text", inputMode, pattern,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      pattern={pattern}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder:text-stone-400"
      style={{ fontSize: 16 }}
    />
  );
}

function BigOption({
  emoji, label, sub, selected, onClick,
}: {
  emoji: string; label: string; sub?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] min-h-[60px] ${
        selected
          ? "border-emerald-500 bg-emerald-50"
          : "border-stone-200 bg-white hover:border-emerald-300"
      }`}
    >
      <span className="text-2xl leading-none flex-shrink-0">{emoji}</span>
      <span className="flex-1 min-w-0">
        <span className={`text-sm font-semibold block ${selected ? "text-emerald-800" : "text-stone-700"}`}>
          {label}
        </span>
        {sub && (
          <span className={`text-xs block mt-0.5 ${selected ? "text-emerald-600/70" : "text-stone-400"}`}>
            {sub}
          </span>
        )}
      </span>
      {selected && (
        <span className="text-emerald-600 text-lg font-bold flex-shrink-0">✓</span>
      )}
    </button>
  );
}

function YesNoRow({
  label, yesLabel = "Sí", noLabel = "No",
  value, onChange, hint,
}: {
  label: string; yesLabel?: string; noLabel?: string;
  value: string; onChange: (v: string) => void; hint?: string;
}) {
  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <div className="grid grid-cols-2 gap-2">
        {[
          { v: "Sí", label: yesLabel },
          { v: "No", label: noLabel },
        ].map(opt => (
          <button
            key={opt.v}
            type="button"
            onClick={() => onChange(opt.v)}
            className={`py-4 rounded-2xl border-2 text-sm font-semibold transition-all min-h-[52px] ${
              value === opt.v
                ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                : "border-stone-200 bg-white text-stone-600 hover:border-emerald-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TipoInstalacion({
  label, value, onChange,
}: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  const OPTS = [
    { v: "individual",  e: "🏠", label: "Individual", sub: "Solo para esta vivienda" },
    { v: "comunitaria", e: "🏢", label: "Comunitaria", sub: "Compartida con el edificio" },
    { v: "no_tiene",    e: "❌", label: "No tiene",    sub: "Sin instalación" },
  ];
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="space-y-2">
        {OPTS.map(o => (
          <BigOption
            key={o.v}
            emoji={o.e}
            label={o.label}
            sub={o.sub}
            selected={value === o.v}
            onClick={() => onChange(o.v)}
          />
        ))}
      </div>
    </div>
  );
}

function SectionDivider({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <span className="text-lg">{emoji}</span>
      <span className="text-xs font-bold uppercase tracking-widest text-stone-500">{title}</span>
      <div className="flex-1 h-px bg-stone-100" />
    </div>
  );
}

function ErrorBanner({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
      {errors.map((e, i) => (
        <p key={i} className="text-sm text-red-700 flex items-start gap-2">
          <span className="flex-shrink-0 mt-0.5">⚠️</span>
          <span>{e}</span>
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Document upload
// ─────────────────────────────────────────────────────────────────────────────

function DocCard({
  tipoDoc, label, required, hint, certId, token,
  docs, onUploaded,
}: {
  tipoDoc: string; label: string; required?: boolean; hint?: string;
  certId: number | null; token: string;
  docs: UploadedDoc[]; onUploaded: (d: UploadedDoc) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const uploaded = docs.filter(d => d.tipoDoc === tipoDoc);

  const handleFile = async (file: File) => {
    if (!certId) { setErr("Podrás subir documentos en breve. Continúa sin ellos."); return; }
    setUploading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("tipoDoc", tipoDoc);
      const res = await fetch(`/api/formulario-cee/${token}/upload/${certId}`, {
        method: "POST", body: fd,
      });
      if (!res.ok) throw new Error();
      const d: UploadedDoc = await res.json();
      onUploaded(d);
    } catch {
      setErr("Error al subir el archivo. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-semibold text-stone-800">{label}</p>
        {required && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0">Recomendado</span>}
      </div>
      {hint && <p className="text-xs text-stone-400 mb-3">{hint}</p>}

      {uploaded.length > 0 && (
        <div className="space-y-1 mb-3">
          {uploaded.map(d => (
            <div key={d.id} className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">
              <span>📎</span>
              <span className="truncate flex-1">{d.nombreOriginal}</span>
              <span className="text-emerald-500 font-bold">✓</span>
            </div>
          ))}
        </div>
      )}

      <input
        ref={ref}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.heic,.heif"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={uploading}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-colors ${
          uploading
            ? "border-stone-200 text-stone-400"
            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100"
        }`}
      >
        {uploading ? (
          <><span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> Subiendo…</>
        ) : (
          <><span>📤</span>{uploaded.length > 0 ? "Añadir otro archivo" : "Seleccionar archivo"}</>
        )}
      </button>
      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary row helper
// ─────────────────────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-4 py-1.5 border-b border-stone-50 last:border-0">
      <span className="text-xs text-stone-400 font-medium flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm font-semibold text-stone-800 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function SummaryCard({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-100 flex items-center gap-2">
        <span>{emoji}</span>
        <span className="text-xs font-bold uppercase tracking-widest text-stone-500">{title}</span>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function RecogidaMovil({ token }: { token: string }) {
  const [step, setStep]           = useState(1);
  const [form, setForm]           = useState<FormState>(INITIAL_FORM);
  const [reformas, setReformas]   = useState<Reforma[]>([]);
  const [docs, setDocs]           = useState<UploadedDoc[]>([]);
  const [certId, setCertId]       = useState<number | null>(null);
  const [certifier, setCertifier] = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);
  const [rgpdAccepted, setRgpdAccepted] = useState(false);
  const [paymentBlocked, setPaymentBlocked] = useState(false);
  const [paymentToken, setPaymentToken]     = useState<string | null>(null);
  const [errors, setErrors]       = useState<string[]>([]);
  const [globalError, setGlobalError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  // ── Load + restore ──────────────────────────────────────────────────────────

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY(token));
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.form) setForm(f => ({ ...f, ...p.form }));
        if (p.reformas) setReformas(p.reformas);
        if (p.step) setStep(p.step);
      } catch {}
    }

    fetch(`/api/formulario-cee/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.completed) { setDone(true); setLoading(false); return; }
        if (d.paymentBlocked) {
          setPaymentBlocked(true); setPaymentToken(d.paymentToken);
          setLoading(false); return;
        }
        setCertifier(d.certifier);
        if (d.certId) setCertId(d.certId);
        if (d.prefill) {
          setForm(f => ({
            ...f,
            ...Object.fromEntries(
              Object.entries(d.prefill).filter(([, v]) => v !== "" && v !== null && v !== undefined)
            ),
          }));
        }
        if (d.documents) setDocs(d.documents);
        setLoading(false);
        fetch(`/api/formulario-cee/${token}/open`, { method: "POST" }).catch(() => {});
      })
      .catch(() => { setGlobalError("No pudimos cargar el formulario."); setLoading(false); });
  }, [token]);

  // ── Auto-save ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY(token), JSON.stringify({ form, reformas, step }));
    }
  }, [form, reformas, step, loading, token]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goNext = () => {
    const errs = validateStep(step, form);
    if (errs.length > 0) {
      setErrors(errs);
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors([]);
    setStep(s => Math.min(s + 1, STEPS.length));
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    setErrors([]);
    setStep(s => Math.max(s - 1, 1));
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Reformas helpers ─────────────────────────────────────────────────────────

  const toggleReforma = (tipo: string) => {
    setReformas(rs => rs.find(r => r.tipo === tipo)
      ? rs.filter(r => r.tipo !== tipo)
      : [...rs, { tipo, periodo: "" }]);
  };
  const setPeriodo = (tipo: string, periodo: string) => {
    setReformas(rs => rs.map(r => r.tipo === tipo ? { ...r, periodo } : r));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const submit = async () => {
    setSubmitting(true);
    setGlobalError("");
    try {
      const payload = {
        ...form,
        reformas,
        zonaClimatica: getZonaClimatica(form.postalCode) ?? undefined,
        superficieVentana:
          parseFloat(form.anchoVentana) > 0 && parseFloat(form.altoVentana) > 0
            ? (parseFloat(form.anchoVentana) * parseFloat(form.altoVentana)).toFixed(2)
            : undefined,
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
      setGlobalError("Hubo un error al enviar. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const needsPosition = ["Piso/Apartamento", "Adosado", "Local comercial", "Oficinas"]
    .includes(form.propertyType);

  const superficieVentana =
    parseFloat(form.anchoVentana) > 0 && parseFloat(form.altoVentana) > 0
      ? (parseFloat(form.anchoVentana) * parseFloat(form.altoVentana)).toFixed(2)
      : null;


  // ── Screen states ───────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (globalError && !loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">Algo salió mal</h2>
        <p className="text-stone-500 text-sm">{globalError}</p>
      </div>
    </div>
  );

  if (paymentBlocked) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">Formulario bloqueado</h2>
        <p className="text-stone-500 text-sm leading-relaxed mb-6">
          Se desbloqueará una vez confirmemos tu pago.
        </p>
        {paymentToken && (
          <a
            href={`/pay/${paymentToken}`}
            className="block w-full py-4 bg-emerald-700 text-white rounded-2xl font-bold text-sm"
          >
            Ir a la página de pago →
          </a>
        )}
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">¡Listo!</h2>
        <p className="text-stone-600 text-sm leading-relaxed mb-6">
          Tus datos han llegado a{" "}
          <strong>{certifier?.name ?? "tu certificador"}</strong>.
          Te contactarán pronto para concretar la visita.
        </p>
        {certifier?.phone && (
          <a
            href={`https://wa.me/${certifier.phone.replace(/\D/g, "")}`}
            target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-2xl font-bold text-sm"
          >
            📲 Contactar por WhatsApp
          </a>
        )}
      </div>
    </div>
  );

  // ── Progress bar ────────────────────────────────────────────────────────────

  const progress = Math.round(((step - 1) / (STEPS.length - 1)) * 100);

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm">
        {certifier && (
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <span className="text-xs text-stone-400">Formulario para</span>
            <span className="text-xs font-bold text-stone-700">{certifier.name}</span>
          </div>
        )}

        {/* Step indicators */}
        <div className="flex items-center px-3 pb-2 pt-1 gap-1 overflow-x-auto scrollbar-hide">
          {STEPS.map(s => (
            <button
              key={s.n}
              type="button"
              onClick={() => step > s.n && setStep(s.n)}
              disabled={step <= s.n}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold flex-shrink-0 transition-all ${
                step === s.n
                  ? "bg-emerald-600 text-white"
                  : step > s.n
                  ? "bg-emerald-100 text-emerald-700 cursor-pointer"
                  : "bg-stone-100 text-stone-400 cursor-default"
              }`}
            >
              <span>{step > s.n ? "✓" : s.emoji}</span>
              <span className={step === s.n ? "inline" : "hidden sm:inline"}>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-stone-100">
          <div
            className="h-1 bg-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: certifier ? 96 : 72, paddingBottom: 100 }}
      >
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

          {/* Validation errors */}
          <ErrorBanner errors={errors} />

          {/* ═══════════════════════════════════════════════════════════════
              STEP 1 — Tus datos
          ═══════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">👤 Tus datos</h1>
                <p className="text-sm text-stone-500 mt-1">
                  Necesitamos saber quién eres para enviar el certificado al titular correcto.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 space-y-4">
                <div>
                  <FieldLabel>Nombre completo *</FieldLabel>
                  <Input value={form.ownerName} onChange={v => set("ownerName", v)} placeholder="Ana García López" />
                </div>
                <div>
                  <FieldLabel hint="Recibirás la confirmación aquí">Email de contacto *</FieldLabel>
                  <Input value={form.ownerEmail} onChange={v => set("ownerEmail", v)} placeholder="ana@email.com" type="email" inputMode="email" />
                </div>
                <div>
                  <FieldLabel hint="Para coordinar la visita del técnico">Teléfono</FieldLabel>
                  <Input value={form.ownerPhone} onChange={v => set("ownerPhone", v)} placeholder="612 345 678" type="tel" inputMode="tel" />
                </div>
                <div>
                  <FieldLabel hint="DNI, NIE o CIF del titular">DNI / NIE / CIF</FieldLabel>
                  <Input value={form.ownerDni} onChange={v => set("ownerDni", v)} placeholder="12345678A" />
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 2 — La vivienda
          ═══════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">🏠 La vivienda</h1>
                <p className="text-sm text-stone-500 mt-1">
                  Datos básicos del inmueble a certificar.
                </p>
              </div>

              {/* Dirección */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 space-y-4">
                <SectionDivider emoji="📍" title="Ubicación" />
                <div>
                  <FieldLabel>Dirección completa *</FieldLabel>
                  <Input value={form.address} onChange={v => set("address", v)} placeholder="Calle Mayor 12, 3º A" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Código postal</FieldLabel>
                    <Input value={form.postalCode} onChange={v => set("postalCode", v)} placeholder="28001" inputMode="numeric" />
                  </div>
                  <div>
                    <FieldLabel>Ciudad</FieldLabel>
                    <Input value={form.city} onChange={v => set("city", v)} placeholder="Madrid" />
                  </div>
                </div>
                <div>
                  <FieldLabel hint="Ej: 9328101VK47B0001MP">Referencia catastral</FieldLabel>
                  <Input value={form.cadastralReference} onChange={v => set("cadastralReference", v)} placeholder="Encuéntrala en el recibo del IBI" />
                </div>
              </div>

              {/* Tipo de inmueble */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100">
                <SectionDivider emoji="🏗️" title="Tipo de inmueble" />
                <div className="space-y-2 mt-3">
                  {PROPERTY_TYPES.map(pt => (
                    <BigOption
                      key={pt.value}
                      emoji={pt.emoji}
                      label={pt.value}
                      selected={form.propertyType === pt.value}
                      onClick={() => set("propertyType", pt.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Datos físicos */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 space-y-4">
                <SectionDivider emoji="📐" title="Medidas y antigüedad" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel hint="Año de construcción del edificio">Año construido</FieldLabel>
                    <Input value={form.constructionYear} onChange={v => set("constructionYear", v)} placeholder="1985" inputMode="numeric" />
                  </div>
                  <div>
                    <FieldLabel hint="Superficie útil total">Superficie (m²)</FieldLabel>
                    <Input value={form.totalArea} onChange={v => set("totalArea", v)} placeholder="85" inputMode="decimal" />
                  </div>
                </div>
                <div>
                  <FieldLabel hint="Número de plantas del inmueble">Nº de plantas</FieldLabel>
                  <div className="grid grid-cols-4 gap-2">
                    {["1", "2", "3", "4+"].map(n => (
                      <button
                        key={n} type="button"
                        onClick={() => set("numPlantas", n)}
                        className={`py-4 rounded-2xl border-2 text-sm font-bold transition-all min-h-[52px] ${
                          form.numPlantas === n
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                            : "border-stone-200 bg-white text-stone-600"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Posición en el edificio */}
              {needsPosition && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 space-y-4">
                  <SectionDivider emoji="📊" title="Posición en el edificio" />
                  <p className="text-xs text-stone-400 italic">
                    Esto afecta al cálculo energético (pérdidas por cubierta y suelo).
                  </p>
                  <YesNoRow
                    label="¿Está en la última planta?"
                    yesLabel="Sí, hay cubierta/tejado encima"
                    noLabel="No, hay otro piso encima"
                    value={form.esUltimaPlanta === "si" ? "Sí" : form.esUltimaPlanta === "no" ? "No" : ""}
                    onChange={v => set("esUltimaPlanta", v === "Sí" ? "si" : "no")}
                  />
                  <YesNoRow
                    label="¿Hay local o garaje debajo?"
                    yesLabel="Sí, hay local/garaje/sótano"
                    noLabel="No, hay otro piso debajo"
                    value={form.tieneLocalDebajo === "si" ? "Sí" : form.tieneLocalDebajo === "no" ? "No" : ""}
                    onChange={v => set("tieneLocalDebajo", v === "Sí" ? "si" : "no")}
                  />
                </div>
              )}
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 3 — Instalaciones
          ═══════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">⚙️ Instalaciones</h1>
                <p className="text-sm text-stone-500 mt-1">
                  Cuéntanos cómo funciona tu vivienda. Si no sabes algo, puedes dejarlo en blanco — el técnico lo comprobará.
                </p>
              </div>

              {/* Ventanas */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 space-y-4">
                <SectionDivider emoji="🪟" title="Ventanas" />
                <div>
                  <FieldLabel>Tipo de acristalamiento</FieldLabel>
                  <div className="space-y-2">
                    {VENTANAS_OPTS.map(o => (
                      <BigOption
                        key={o.value} emoji={o.emoji} label={o.value} sub={o.sublabel}
                        selected={form.tipoVentanas === o.value}
                        onClick={() => set("tipoVentanas", o.value)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <FieldLabel hint="Material del marco de las ventanas">Tipo de marco</FieldLabel>
                  <div className="space-y-2">
                    {MARCOS_OPTS.map(o => (
                      <BigOption
                        key={o.value} emoji="🔲" label={o.label} sub={o.sublabel}
                        selected={form.tipoMarcos === o.value}
                        onClick={() => set("tipoMarcos", o.value)}
                      />
                    ))}
                  </div>
                </div>
                <YesNoRow
                  label="¿Tienen persiana?"
                  value={form.tienePersiana}
                  onChange={v => set("tienePersiana", v)}
                />
                <div>
                  <FieldLabel hint="Aproximado. Ejemplo: 1.20 × 1.10 m">Dimensión ventana típica (opcional)</FieldLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-stone-400 mb-1">Ancho (metros)</p>
                      <Input value={form.anchoVentana} onChange={v => set("anchoVentana", v)} placeholder="1.20" inputMode="decimal" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 mb-1">Alto (metros)</p>
                      <Input value={form.altoVentana} onChange={v => set("altoVentana", v)} placeholder="1.10" inputMode="decimal" />
                    </div>
                  </div>
                  {superficieVentana && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 mt-2">
                      📐 Superficie: <strong>{superficieVentana} m²</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Calefacción */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 space-y-4">
                <SectionDivider emoji="🔥" title="Calefacción" />
                <TipoInstalacion
                  label="¿Qué tipo de calefacción tienes?"
                  value={form.calefaccionTipoInstalacion}
                  onChange={v => set("calefaccionTipoInstalacion", v)}
                />
                {form.calefaccionTipoInstalacion === "individual" && (
                  <div>
                    <FieldLabel>Sistema de calefacción</FieldLabel>
                    <div className="space-y-2">
                      {CALEFACCION_SISTEMAS.map(s => (
                        <BigOption
                          key={s.value} emoji={s.emoji} label={s.label}
                          selected={form.tipoCalefaccion === s.value}
                          onClick={() => set("tipoCalefaccion", s.value)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ACS */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 space-y-4">
                <SectionDivider emoji="🚿" title="Agua caliente (ACS)" />
                <TipoInstalacion
                  label="¿Cómo se calienta el agua?"
                  value={form.acsTipoInstalacion}
                  onChange={v => set("acsTipoInstalacion", v)}
                />
                {form.acsTipoInstalacion === "individual" && (
                  <div>
                    <FieldLabel>Sistema de agua caliente</FieldLabel>
                    <div className="space-y-2">
                      {ACS_SISTEMAS.map(s => (
                        <BigOption
                          key={s.value} emoji={s.emoji} label={s.label}
                          selected={form.tipoACS === s.value}
                          onClick={() => set("tipoACS", s.value)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <FieldLabel hint="Determina el consumo de agua caliente (litros/día)">
                    ¿Cuántas personas viven habitualmente?
                  </FieldLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {["1", "2", "3", "4", "5", "6+"].map(n => (
                      <button
                        key={n} type="button"
                        onClick={() => set("numOcupantes", n)}
                        className={`py-5 rounded-2xl border-2 text-lg font-bold transition-all min-h-[64px] ${
                          form.numOcupantes === n
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                            : "border-stone-200 bg-white text-stone-600"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Aire acondicionado */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 space-y-4">
                <SectionDivider emoji="❄️" title="Refrigeración" />
                <YesNoRow
                  label="¿Tienes aire acondicionado?"
                  value={form.tieneAireAcondicionado}
                  onChange={v => set("tieneAireAcondicionado", v)}
                />
                {form.tieneAireAcondicionado === "Sí" && (
                  <div>
                    <FieldLabel>Tipo</FieldLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {["Split individual", "Multi-split", "Cassette", "Conductos centralizado", "VRV/VRF", "No sé"].map(t => (
                        <button
                          key={t} type="button"
                          onClick={() => set("tipoAire", t)}
                          className={`py-3 px-2 rounded-2xl border-2 text-xs font-medium text-center transition-all min-h-[44px] ${
                            form.tipoAire === t
                              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                              : "border-stone-200 bg-white text-stone-600"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Iluminación */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 space-y-3">
                <SectionDivider emoji="💡" title="Iluminación" />
                <div className="grid grid-cols-2 gap-2">
                  {ILUMINACION_TIPOS.map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => set("tipoIluminacion", t)}
                      className={`py-3 px-3 rounded-2xl border-2 text-xs font-medium text-center transition-all min-h-[48px] ${
                        form.tipoIluminacion === t
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-stone-200 bg-white text-stone-600"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reformas */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 space-y-4">
                <SectionDivider emoji="🔨" title="Reformas recientes" />
                <YesNoRow
                  label="¿Ha habido reformas importantes en los últimos 20 años?"
                  value={form.tuvoReformas}
                  onChange={v => set("tuvoReformas", v)}
                  hint="Influye en el cálculo energético"
                />
                {form.tuvoReformas === "Sí" && (
                  <div className="space-y-3">
                    <p className="text-xs text-stone-500 font-medium">Selecciona qué se reformó:</p>
                    {REFORMA_TIPOS.map(rt => {
                      const selected = reformas.find(r => r.tipo === rt.tipo);
                      return (
                        <div key={rt.tipo}>
                          <button
                            type="button"
                            onClick={() => toggleReforma(rt.tipo)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all min-h-[52px] ${
                              selected
                                ? "border-emerald-500 bg-emerald-50"
                                : "border-stone-200 bg-white"
                            }`}
                          >
                            <span className="text-xl leading-none">{rt.emoji}</span>
                            <span className={`text-sm font-medium flex-1 ${selected ? "text-emerald-800" : "text-stone-700"}`}>
                              {rt.label}
                            </span>
                            <span className={`text-lg font-bold flex-shrink-0 ${selected ? "text-emerald-600" : "text-stone-200"}`}>
                              {selected ? "✓" : "+"}
                            </span>
                          </button>
                          {selected && (
                            <div className="mt-1 grid grid-cols-2 gap-1 pl-2">
                              {REFORMA_PERIODOS.map(p => (
                                <button
                                  key={p} type="button"
                                  onClick={() => setPeriodo(rt.tipo, p)}
                                  className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                                    selected.periodo === p
                                      ? "border-emerald-400 bg-emerald-100 text-emerald-800"
                                      : "border-stone-200 text-stone-500"
                                  }`}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 4 — Documentos
          ═══════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">📄 Documentos</h1>
                <p className="text-sm text-stone-500 mt-1">
                  Sube los archivos que tengas disponibles. Si no tienes alguno, no te preocupes — puedes continuar.
                </p>
              </div>

              {!certId && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700">
                  La subida se activará en breve. Puedes continuar y añadirlos más tarde.
                </div>
              )}

              <DocCard
                tipoDoc="factura_luz" label="Factura de electricidad"
                required
                hint="PDF o foto. De los últimos 12 meses. La encuentras en la web de tu compañía."
                certId={certId} token={token} docs={docs}
                onUploaded={d => setDocs(prev => [...prev, d])}
              />
              <DocCard
                tipoDoc="factura_gas" label="Factura de gas"
                hint="Si no la tienes, no es necesaria. El técnico puede trabajar sin ella."
                certId={certId} token={token} docs={docs}
                onUploaded={d => setDocs(prev => [...prev, d])}
              />
              <DocCard
                tipoDoc="referencia_catastral" label="Referencia catastral"
                hint="Encuéntrala en el recibo del IBI o en catastro.meh.es. Solo si no la indicaste antes."
                certId={certId} token={token} docs={docs}
                onUploaded={d => setDocs(prev => [...prev, d])}
              />
              <DocCard
                tipoDoc="planos" label="Planos del inmueble"
                hint="Opcional. Si tienes planos en papel, puedes hacer una foto con el móvil."
                certId={certId} token={token} docs={docs}
                onUploaded={d => setDocs(prev => [...prev, d])}
              />
              <DocCard
                tipoDoc="otro" label="Otros documentos"
                hint="Cualquier documentación adicional que consideres útil."
                certId={certId} token={token} docs={docs}
                onUploaded={d => setDocs(prev => [...prev, d])}
              />
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 5 — Revisar y enviar
          ═══════════════════════════════════════════════════════════════ */}
          {step === 5 && (
            <>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">✅ Revisión final</h1>
                <p className="text-sm text-stone-500 mt-1">
                  Comprueba que todo es correcto antes de enviar.
                </p>
              </div>

              <SummaryCard emoji="👤" title="Tus datos">
                <SummaryRow label="Nombre" value={form.ownerName} />
                <SummaryRow label="Email" value={form.ownerEmail} />
                <SummaryRow label="Teléfono" value={form.ownerPhone} />
                <SummaryRow label="DNI/NIE" value={form.ownerDni} />
              </SummaryCard>

              <SummaryCard emoji="🏠" title="La vivienda">
                <SummaryRow label="Dirección" value={form.address} />
                <SummaryRow label="Ciudad" value={form.city} />
                <SummaryRow label="C. postal" value={form.postalCode} />
                <SummaryRow label="Referencia catastral" value={form.cadastralReference} />
                <SummaryRow label="Tipo" value={form.propertyType} />
                <SummaryRow label="Año construido" value={form.constructionYear} />
                <SummaryRow label="Superficie" value={form.totalArea ? `${form.totalArea} m²` : null} />
                {form.esUltimaPlanta && (
                  <SummaryRow
                    label="Última planta"
                    value={form.esUltimaPlanta === "si" ? "Sí, cubierta encima" : "No, hay piso encima"}
                  />
                )}
                {form.tieneLocalDebajo && (
                  <SummaryRow
                    label="Local debajo"
                    value={form.tieneLocalDebajo === "si" ? "Sí, local/garaje" : "No, hay piso debajo"}
                  />
                )}
              </SummaryCard>

              <SummaryCard emoji="⚙️" title="Instalaciones">
                <SummaryRow label="Ventanas" value={form.tipoVentanas} />
                <SummaryRow label="Marcos" value={MARCOS_OPTS.find(m => m.value === form.tipoMarcos)?.label ?? form.tipoMarcos} />
                <SummaryRow
                  label="Dimensión ventana"
                  value={superficieVentana ? `${form.anchoVentana} × ${form.altoVentana} m (${superficieVentana} m²)` : null}
                />
                <SummaryRow
                  label="Calefacción"
                  value={
                    form.calefaccionTipoInstalacion === "no_tiene" ? "Sin calefacción"
                    : form.calefaccionTipoInstalacion === "comunitaria" ? "Comunitaria"
                    : form.tipoCalefaccion
                      ? CALEFACCION_SISTEMAS.find(s => s.value === form.tipoCalefaccion)?.label
                      : form.calefaccionTipoInstalacion === "individual" ? "Individual (sin especificar)" : null
                  }
                />
                <SummaryRow
                  label="Agua caliente"
                  value={
                    form.acsTipoInstalacion === "no_tiene" ? "Sin ACS"
                    : form.acsTipoInstalacion === "comunitaria" ? "Comunitaria"
                    : form.tipoACS
                      ? ACS_SISTEMAS.find(s => s.value === form.tipoACS)?.label
                      : form.acsTipoInstalacion === "individual" ? "Individual (sin especificar)" : null
                  }
                />
                <SummaryRow
                  label="Ocupantes"
                  value={form.numOcupantes ? `${form.numOcupantes} persona${form.numOcupantes === "1" ? "" : "s"}` : null}
                />
                <SummaryRow
                  label="Aire acondicionado"
                  value={form.tieneAireAcondicionado === "Sí" ? (form.tipoAire || "Sí") : form.tieneAireAcondicionado === "No" ? "No" : null}
                />
                <SummaryRow label="Iluminación" value={form.tipoIluminacion} />
              </SummaryCard>

              {form.tuvoReformas && (
                <SummaryCard emoji="🔨" title="Reformas">
                  {form.tuvoReformas === "No" ? (
                    <p className="text-sm text-stone-600">Sin reformas en los últimos 20 años</p>
                  ) : reformas.length === 0 ? (
                    <p className="text-sm text-stone-400 italic">Reformas indicadas sin detalle</p>
                  ) : (
                    <div className="space-y-2">
                      {reformas.map(r => {
                        const rt = REFORMA_TIPOS.find(x => x.tipo === r.tipo);
                        return (
                          <div key={r.tipo} className="flex items-center gap-2 py-1">
                            <span>{rt?.emoji}</span>
                            <span className="text-sm text-stone-700 flex-1">{rt?.label}</span>
                            {r.periodo && (
                              <span className="text-xs text-stone-400 font-medium">{r.periodo}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SummaryCard>
              )}

              {docs.length > 0 && (
                <SummaryCard emoji="📄" title="Documentos adjuntos">
                  {docs.map(d => (
                    <div key={d.id} className="flex items-center gap-2 py-1">
                      <span className="text-emerald-500">📎</span>
                      <span className="text-sm text-stone-700 truncate">{d.nombreOriginal}</span>
                    </div>
                  ))}
                </SummaryCard>
              )}

              {/* Certifier card */}
              {certifier && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <p className="text-sm text-emerald-800">
                    Al enviar, tus datos llegarán a <strong>{certifier.name}</strong>,
                    quien gestionará tu certificado energético y se pondrá en contacto contigo.
                  </p>
                </div>
              )}

              {/* Consentimiento RGPD — requerido por LOPDGDD / RGPD art. 6.1.a */}
              <div className="bg-white rounded-3xl p-5 border border-stone-200">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={rgpdAccepted}
                    onClick={() => setRgpdAccepted(v => !v)}
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
                      rgpdAccepted
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-stone-300 bg-white"
                    }`}
                  >
                    {rgpdAccepted && <span className="text-white text-xs font-black leading-none">✓</span>}
                  </button>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    He leído y acepto la{" "}
                    <a href="/privacy" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-medium">
                      Política de Privacidad
                    </a>.{" "}
                    <span className="text-stone-500">
                      Responsable: {certifier?.company ?? certifier?.name ?? "[NOMBRE_EMPRESA]"}.
                      Finalidad: gestión de tu certificado de eficiencia energética.
                      Puedes ejercer tus derechos en [EMAIL_CONTACTO].
                    </span>
                  </p>
                </div>
                {!rgpdAccepted && (
                  <p className="text-xs text-amber-600 mt-3 flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Debes aceptar la política de privacidad para continuar.</span>
                  </p>
                )}
              </div>

              {globalError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
                  {globalError}
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* ── Sticky bottom nav ─────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-100 px-4 pt-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-lg mx-auto flex gap-3 items-center">
          {step > 1 && (
            <button
              type="button"
              onClick={goPrev}
              className="flex-shrink-0 w-12 h-12 rounded-2xl border border-stone-200 text-stone-600 font-bold text-lg flex items-center justify-center hover:bg-stone-50 transition-colors"
            >
              ←
            </button>
          )}

          {step < STEPS.length ? (
            <button
              type="button"
              onClick={goNext}
              className="flex-1 h-12 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
            >
              Continuar → <span className="opacity-70 text-xs">({step}/{STEPS.length})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !rgpdAccepted}
              className="flex-1 h-12 bg-emerald-600 text-white rounded-2xl font-bold text-sm disabled:opacity-50 hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando…
                </span>
              ) : (
                "Enviar documentación ✓"
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
