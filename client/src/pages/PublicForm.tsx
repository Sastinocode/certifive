import { useState, useEffect } from "react";

interface PublicFormProps {
  token: string;
}

interface FormInfo {
  alreadyCompleted: boolean;
  certifier?: { name: string; company: string | null };
  prefill?: Record<string, string>;
}

// ── Step data types ───────────────────────────────────────────────────────────

interface Step1Data {
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerDni: string;
}

interface Step2Data {
  address: string;
  city: string;
  postalCode: string;
  province: string;
  propertyType: string;
  constructionYear: string;
  totalArea: string;
  cadastralReference: string;
}

interface Step3Data {
  heating: string;
  hotWater: string;
  cooling: string;
  windows: string;
  insulation: string;
}

const STORAGE_KEY_PREFIX = "certifive_form_";

// ── Small helpers ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center mb-3">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={i < total - 1 ? "flex-1 flex items-center" : "flex items-center"}>
            <div
              className={[
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all",
                i + 1 < step
                  ? "bg-primary text-primary-foreground"
                  : i + 1 === step
                  ? "bg-primary/10 text-primary ring-2 ring-primary/25"
                  : "bg-muted text-muted-foreground",
              ].join(" ")}
            >
              {i + 1 < step ? "✓" : i + 1}
            </div>
            {i < total - 1 && (
              <div
                className={[
                  "flex-1 h-0.5 mx-2 transition-all",
                  i + 1 < step ? "bg-primary" : "bg-border",
                ].join(" ")}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground font-medium">Paso {step} de {total}</p>
    </div>
  );
}

function OptionCard({
  value,
  label,
  emoji,
  selected,
  onClick,
}: {
  value: string;
  label: string;
  emoji: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-[1.5px] text-left transition-all active:scale-[0.98]",
        selected
          ? "border-primary bg-primary/5 text-foreground ring-[3px] ring-primary/8"
          : "border-border bg-card text-foreground hover:border-muted-foreground/40 hover:bg-muted/30",
      ].join(" ")}
    >
      <span className="text-2xl leading-none">{emoji}</span>
      <span className="text-sm font-medium">{label}</span>
      {selected && (
        <span className="ml-auto text-primary font-bold text-base leading-none">✓</span>
      )}
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-card border-[1.5px] border-border rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-muted-foreground/40 transition-all min-h-[48px]";

// ── Screens ───────────────────────────────────────────────────────────────────

function AlreadyDoneScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Ya enviaste tus datos</h1>
        <p className="text-muted-foreground text-sm">Tu certificador ya tiene toda la informacion. Te contactara en breve.</p>
      </div>
    </div>
  );
}

function ThankYouScreen({ certifierName }: { certifierName: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
          <span className="text-5xl">🎉</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Tus datos han llegado</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          <strong className="text-foreground">{certifierName}</strong> ya tiene toda la informacion que necesita para tu certificado energetico.
        </p>
        <p className="text-muted-foreground/60 text-xs">Recibiras noticias suyas en breve. Puedes cerrar esta ventana.</p>
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/40">
          <span className="font-bold tracking-widest uppercase">Certifive</span>
        </div>
      </div>
    </div>
  );
}

function ErrorScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🔗</div>
        <h1 className="text-xl font-bold text-foreground mb-2">Enlace no valido</h1>
        <p className="text-muted-foreground text-sm">
          Este enlace no existe o ya no esta disponible. Pide a tu certificador que te envie uno nuevo.
        </p>
      </div>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export default function PublicForm({ token }: PublicFormProps) {
  const [info, setInfo] = useState<FormInfo | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const storageKey = STORAGE_KEY_PREFIX + token;

  const [step1, setStep1] = useState<Step1Data>({
    ownerName: "", ownerPhone: "", ownerEmail: "", ownerDni: "",
  });
  const [step2, setStep2] = useState<Step2Data>({
    address: "", city: "", postalCode: "", province: "",
    propertyType: "", constructionYear: "", totalArea: "", cadastralReference: "",
  });
  const [step3, setStep3] = useState<Step3Data>({
    heating: "", hotWater: "", cooling: "", windows: "", insulation: "",
  });

  // Load form info + restore progress from localStorage
  useEffect(() => {
    fetch(`/api/form/${token}`)
      .then(r => r.json())
      .then((data: FormInfo) => {
        setInfo(data);
        if (!data.alreadyCompleted && data.prefill) {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setStep1(parsed.step1 ?? {});
              setStep2(parsed.step2 ?? {});
              setStep3(parsed.step3 ?? {});
              setStep(parsed.currentStep ?? 1);
            } catch {
              applyPrefill(data.prefill);
            }
          } else {
            applyPrefill(data.prefill);
          }
        }
      })
      .catch(() => setLoadError(true));

    fetch(`/api/form/${token}/open`, { method: "POST" }).catch(() => {});
  }, [token]);

  function applyPrefill(prefill: Record<string, string>) {
    setStep1(s => ({
      ...s,
      ownerName: prefill.ownerName || s.ownerName,
      ownerEmail: prefill.ownerEmail || s.ownerEmail,
      ownerPhone: prefill.ownerPhone || s.ownerPhone,
      ownerDni: prefill.ownerDni || s.ownerDni,
    }));
    setStep2(s => ({
      ...s,
      address: prefill.address || s.address,
      city: prefill.city || s.city,
      postalCode: prefill.postalCode || s.postalCode,
      province: prefill.province || s.province,
      propertyType: prefill.propertyType || s.propertyType,
      constructionYear: String(prefill.constructionYear || ""),
      totalArea: String(prefill.totalArea || ""),
      cadastralReference: prefill.cadastralReference || s.cadastralReference,
    }));
  }

  // Auto-save to localStorage on any change
  useEffect(() => {
    if (!info || info.alreadyCompleted) return;
    localStorage.setItem(storageKey, JSON.stringify({ step1, step2, step3, currentStep: step }));
  }, [step1, step2, step3, step]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/form/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...step1, ...step2, energyData: step3 }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message ?? "Error al enviar");
      }
      localStorage.removeItem(storageKey);
      setSubmitted(true);
    } catch (e: any) {
      setSubmitError(e.message ?? "No se pudo enviar. Intentalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (!info && !loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Cargando formulario…</p>
        </div>
      </div>
    );
  }

  if (loadError) return <ErrorScreen />;
  if (info?.alreadyCompleted) return <AlreadyDoneScreen />;
  if (submitted) return <ThankYouScreen certifierName={info?.certifier?.name ?? "Tu certificador"} />;

  const certifierName = info?.certifier?.name ?? "Tu certificador";

  // ── Step validation ────────────────────────────────────────────────────────
  const step1Valid = step1.ownerName.trim().length > 1 && step1.ownerPhone.trim().length > 5;
  const step2Valid =
    step2.address.trim().length > 3 &&
    step2.city.trim().length > 1 &&
    step2.postalCode.trim().length === 5;
  const step3Valid = !!step3.heating && !!step3.hotWater && !!step3.cooling;

  // ── Layout ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="bg-background/80 backdrop-blur-sm border-b border-border px-5 py-4 sticky top-0 z-30 h-16 flex items-center">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-sm">C</span>
          </div>
          <div>
            <p className="text-foreground font-bold text-sm leading-tight">Certifive</p>
            <p className="text-muted-foreground text-[11px]">Enviado por {certifierName}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 pb-28">

        {/* Progress */}
        <ProgressBar step={step} total={3} />

        {/* ── STEP 1: Tus datos ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="mt-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Tus datos</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Solo usaremos esta informacion para el certificado. Los campos con * son obligatorios.
              </p>
            </div>

            <Field label="Tu nombre completo *">
              <input
                className={inputCls}
                placeholder="Maria Garcia Lopez"
                value={step1.ownerName}
                onChange={e => setStep1(s => ({ ...s, ownerName: e.target.value }))}
              />
            </Field>

            <Field label="Tu telefono *" hint="Para que el certificador pueda contactarte si hay alguna duda">
              <input
                className={inputCls}
                type="tel"
                placeholder="+34 600 000 000"
                value={step1.ownerPhone}
                onChange={e => setStep1(s => ({ ...s, ownerPhone: e.target.value }))}
              />
            </Field>

            <Field label="Tu email">
              <input
                className={inputCls}
                type="email"
                placeholder="maria@email.com"
                value={step1.ownerEmail}
                onChange={e => setStep1(s => ({ ...s, ownerEmail: e.target.value }))}
              />
            </Field>

            <Field label="Tu DNI o NIE">
              <input
                className={inputCls}
                placeholder="12345678A"
                value={step1.ownerDni}
                onChange={e => setStep1(s => ({ ...s, ownerDni: e.target.value }))}
              />
            </Field>
          </div>
        )}

        {/* ── STEP 2: La vivienda ───────────────────────────────────────────── */}
        {step === 2 && (
          <div className="mt-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">La vivienda</h2>
              <p className="text-sm text-muted-foreground mt-1">Datos sobre el inmueble a certificar.</p>
            </div>

            <Field label="Direccion completa *" hint="Calle, numero, piso y puerta">
              <input
                className={inputCls}
                placeholder="Calle Mayor 1, 2 B"
                value={step2.address}
                onChange={e => setStep2(s => ({ ...s, address: e.target.value }))}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ciudad *">
                <input
                  className={inputCls}
                  placeholder="Madrid"
                  value={step2.city}
                  onChange={e => setStep2(s => ({ ...s, city: e.target.value }))}
                />
              </Field>
              <Field label="Codigo postal *">
                <input
                  className={inputCls}
                  placeholder="28001"
                  maxLength={5}
                  value={step2.postalCode}
                  onChange={e => setStep2(s => ({ ...s, postalCode: e.target.value.replace(/\D/g, "") }))}
                />
              </Field>
            </div>

            <Field label="Provincia">
              <input
                className={inputCls}
                placeholder="Madrid"
                value={step2.province}
                onChange={e => setStep2(s => ({ ...s, province: e.target.value }))}
              />
            </Field>

            <Field label="Tipo de vivienda">
              <select
                className={inputCls}
                value={step2.propertyType}
                onChange={e => setStep2(s => ({ ...s, propertyType: e.target.value }))}
              >
                <option value="">Selecciona una opcion…</option>
                <option value="Piso/Apartamento">Piso o apartamento</option>
                <option value="Vivienda unifamiliar">Casa unifamiliar (adosada o aislada)</option>
                <option value="Local comercial">Local comercial</option>
                <option value="Oficinas">Oficina</option>
                <option value="Industrial">Nave industrial</option>
                <option value="Edificio de viviendas">Edificio entero</option>
                <option value="Otro">Otro</option>
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ano de construccion" hint="Opcional, si lo sabes">
                <input
                  className={inputCls}
                  placeholder="1985"
                  maxLength={4}
                  value={step2.constructionYear}
                  onChange={e => setStep2(s => ({ ...s, constructionYear: e.target.value.replace(/\D/g, "") }))}
                />
              </Field>
              <Field label="Metros cuadrados" hint="Aproximado">
                <input
                  className={inputCls}
                  placeholder="85"
                  value={step2.totalArea}
                  onChange={e => setStep2(s => ({ ...s, totalArea: e.target.value.replace(/[^\d.]/g, "") }))}
                />
              </Field>
            </div>

            <Field
              label="Referencia catastral"
              hint="La encuentras en el recibo del IBI o en la escritura. Es opcional."
            >
              <input
                className={inputCls}
                placeholder="7837298VK4873N0001RR"
                value={step2.cadastralReference}
                onChange={e => setStep2(s => ({ ...s, cadastralReference: e.target.value.toUpperCase() }))}
              />
            </Field>
          </div>
        )}

        {/* ── STEP 3: Energia en casa ───────────────────────────────────────── */}
        {step === 3 && (
          <div className="mt-6 space-y-7">
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Energia en casa</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sin tecnicismos. Elige la opcion que mas se parezca a tu situacion. Las tres primeras son obligatorias.
              </p>
            </div>

            {/* Calefaccion */}
            <div className="space-y-2.5">
              <p className="text-sm font-bold text-foreground">Como calientas la casa? *</p>
              {[
                { value: "gas_natural", emoji: "🔥", label: "Caldera de gas natural" },
                { value: "gasoil", emoji: "🛢️", label: "Caldera de gasoil" },
                { value: "bomba_calor", emoji: "♨️", label: "Bomba de calor (aerotermia)" },
                { value: "radiadores_electricos", emoji: "⚡", label: "Radiadores o suelo electrico" },
                { value: "leña_pellet", emoji: "🪵", label: "Estufa de lena o pellet" },
                { value: "sin_calefaccion", emoji: "❌", label: "No tengo calefaccion" },
              ].map(o => (
                <OptionCard
                  key={o.value}
                  {...o}
                  selected={step3.heating === o.value}
                  onClick={() => setStep3(s => ({ ...s, heating: o.value }))}
                />
              ))}
            </div>

            {/* Agua caliente */}
            <div className="space-y-2.5">
              <p className="text-sm font-bold text-foreground">Como calientas el agua? *</p>
              {[
                { value: "caldera_gas", emoji: "🔥", label: "Caldera de gas (la misma de la calefaccion)" },
                { value: "calentador_gas", emoji: "💧", label: "Calentador de gas (solo para el agua)" },
                { value: "termo_electrico", emoji: "⚡", label: "Termo o calentador electrico" },
                { value: "bomba_calor_acs", emoji: "♨️", label: "Bomba de calor para el agua" },
                { value: "solar", emoji: "☀️", label: "Paneles solares" },
                { value: "no_se", emoji: "🤷", label: "No lo se" },
              ].map(o => (
                <OptionCard
                  key={o.value}
                  {...o}
                  selected={step3.hotWater === o.value}
                  onClick={() => setStep3(s => ({ ...s, hotWater: o.value }))}
                />
              ))}
            </div>

            {/* Aire acondicionado */}
            <div className="space-y-2.5">
              <p className="text-sm font-bold text-foreground">Tienes aire acondicionado? *</p>
              {[
                { value: "si_splits", emoji: "❄️", label: "Si, aparatos en algunos cuartos (splits)" },
                { value: "si_central", emoji: "🌬️", label: "Si, sistema central (conductos)" },
                { value: "no", emoji: "❌", label: "No tengo aire" },
              ].map(o => (
                <OptionCard
                  key={o.value}
                  {...o}
                  selected={step3.cooling === o.value}
                  onClick={() => setStep3(s => ({ ...s, cooling: o.value }))}
                />
              ))}
            </div>

            {/* Ventanas */}
            <div className="space-y-2.5">
              <p className="text-sm font-bold text-foreground">
                Que tipo de ventanas tienes?{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </p>
              {[
                { value: "vidrio_simple", emoji: "🪟", label: "Vidrio simple (antiguas, sin camara de aire)" },
                { value: "doble_vidrio", emoji: "🏠", label: "Doble vidrio (modernas, con camara)" },
                { value: "triple_vidrio", emoji: "🔒", label: "Triple vidrio (muy eficientes)" },
                { value: "no_se", emoji: "🤷", label: "No lo se" },
              ].map(o => (
                <OptionCard
                  key={o.value}
                  {...o}
                  selected={step3.windows === o.value}
                  onClick={() => setStep3(s => ({ ...s, windows: o.value }))}
                />
              ))}
            </div>

            {/* Aislamiento */}
            <div className="space-y-2.5">
              <p className="text-sm font-bold text-foreground">
                Tiene aislamiento en paredes, techo o suelo?{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </p>
              {[
                { value: "si", emoji: "🧱", label: "Si, tiene aislamiento" },
                { value: "no", emoji: "❌", label: "No tiene aislamiento" },
                { value: "no_se", emoji: "🤷", label: "No lo se" },
              ].map(o => (
                <OptionCard
                  key={o.value}
                  {...o}
                  selected={step3.insulation === o.value}
                  onClick={() => setStep3(s => ({ ...s, insulation: o.value }))}
                />
              ))}
            </div>

            {submitError && (
              <div className="bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sticky bottom navigation ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-5 py-4" style={{ boxShadow: '0 -8px 20px -8px rgba(15,31,46,0.08)' }}>
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-5 py-3.5 rounded-full border border-border text-sm font-semibold text-muted-foreground hover:bg-muted/40 transition-colors"
            >
              Atras
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 ? !step1Valid : !step2Valid}
              className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!step3Valid || submitting}
              className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {submitting ? "Enviando…" : "Enviar mis datos ✓"}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
