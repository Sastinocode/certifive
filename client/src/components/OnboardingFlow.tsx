/**
 * OnboardingFlow
 *
 * Full-screen guided onboarding for new certifiers.
 * Shown only when user.onboardingCompleted === false.
 * Never shown again after completion (persisted in DB).
 *
 * Steps:
 *  1 — Complete your profile (name, DNI, phone, email, logo)
 *  2 — Set up payments  (Stripe connect or skip)
 *  3 — Create first certification (pre-filled dummy data)
 *  ✓ — Confetti + "¡Listo!" screen
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { queryClient } from "../lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OnboardingFlowProps {
  user: {
    id: number;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    dniNif?: string | null;
    logoUrl?: string | null;
  };
  onComplete: () => void;
}

// ── Confetti canvas ───────────────────────────────────────────────────────────

function useConfetti(active: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ["#059669", "#f97316", "#3b82f6", "#8b5cf6", "#fbbf24", "#ec4899", "#14b8a6"];
    const pieces = Array.from({ length: 120 }, () => ({
      x:   Math.random() * canvas.width,
      y:   -(Math.random() * canvas.height * 0.3),
      vx:  (Math.random() - 0.5) * 5,
      vy:  Math.random() * 4 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w:    Math.random() * 10 + 5,
      h:    Math.random() * 5  + 3,
      rot:  Math.random() * 360,
      rVel: (Math.random() - 0.5) * 8,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    }));

    let frame: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of pieces) {
        if (p.y < canvas.height + 20) alive = true;
        p.x   += p.vx;
        p.y   += p.vy;
        p.vy  += 0.06;
        p.rot += p.rVel;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }
      if (alive) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return canvasRef;
}

// ── Shared input style ────────────────────────────────────────────────────────

const ic = "w-full bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-900 placeholder:text-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all";
const lc = "block text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mb-1.5";

// ── Step indicator ────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current  ? "bg-emerald-600 w-6" :
            i === current ? "bg-emerald-600 w-8" :
                           "bg-emerald-100 w-4"
          }`}
        />
      ))}
    </div>
  );
}

// ── STEP 1 — Profile ─────────────────────────────────────────────────────────

function Step1Profile({
  initial,
  onNext,
}: {
  initial: OnboardingFlowProps["user"];
  onNext: () => void;
}) {
  const [form, setForm] = useState({
    firstName: initial.firstName ?? "",
    lastName:  initial.lastName  ?? "",
    email:     initial.email     ?? "",
    phone:     initial.phone     ?? "",
    dniNif:    initial.dniNif    ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logoUrl ?? null);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    const fd = new FormData();
    fd.append("logo", file);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/user/logo", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        setLogoUrl(data.url);
      }
    } catch {}
    setLogoUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest("PUT", "/api/auth/user", {
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        email:     form.email.trim(),
        phone:     form.phone.trim(),
        dniNif:    form.dniNif.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onNext();
    } catch {
      // On error still advance — profile can be fixed in settings
      onNext();
    } finally {
      setSaving(false);
    }
  };

  const isValid = form.firstName.trim().length > 0;

  return (
    <div className="space-y-5">
      {/* Logo upload */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-emerald-300 hover:border-emerald-500 transition-colors group"
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <span className="material-symbols-outlined text-emerald-400 text-[28px] block">add_photo_alternate</span>
              {logoUploading && (
                <span className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <span className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </span>
              )}
            </div>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoChange}
        />
        <p className="text-xs text-emerald-700/50 text-center">
          {logoUrl ? "Logo subido ✓ (opcional)" : "Sube tu logo (opcional)"}
        </p>
      </div>

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lc}>Nombre <span className="text-orange-500">*</span></label>
          <input
            type="text"
            placeholder="María"
            value={form.firstName}
            onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
            className={ic}
            style={{ fontSize: "16px" }}
            autoFocus
          />
        </div>
        <div>
          <label className={lc}>Apellidos</label>
          <input
            type="text"
            placeholder="García López"
            value={form.lastName}
            onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
            className={ic}
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      {/* Email + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={lc}>Email profesional</label>
          <input
            type="email"
            placeholder="tu@email.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className={ic}
            style={{ fontSize: "16px" }}
          />
        </div>
        <div>
          <label className={lc}>Teléfono</label>
          <input
            type="tel"
            placeholder="+34 600 000 000"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className={ic}
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      {/* DNI */}
      <div>
        <label className={lc}>DNI / NIF</label>
        <input
          type="text"
          placeholder="12345678A"
          value={form.dniNif}
          onChange={e => setForm(f => ({ ...f, dniNif: e.target.value }))}
          className={ic}
          style={{ fontSize: "16px" }}
        />
        <p className="text-xs text-emerald-700/40 mt-1.5">Necesario para las facturas oficiales</p>
      </div>

      <button
        onClick={handleSave}
        disabled={!isValid || saving}
        className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white py-4 rounded-xl font-bold text-sm transition-all mt-2 min-h-[52px] flex items-center justify-center gap-2"
      >
        {saving ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>
        ) : (
          <>Guardar y continuar <span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
        )}
      </button>
    </div>
  );
}

// ── STEP 2 — Payments ─────────────────────────────────────────────────────────

function Step2Payments({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bizumPhone, setBizumPhone] = useState("");
  const [iban, setIban] = useState("");
  const [enabledMethods, setEnabledMethods] = useState<string[]>(["stripe", "bizum", "transferencia", "efectivo"]);

  const toggleMethod = (m: string) =>
    setEnabledMethods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest("PUT", "/api/auth/user/settings", {
        bizumPhone:            bizumPhone.trim() || null,
        iban:                  iban.trim() || null,
        enabledPaymentMethods: enabledMethods,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setSaved(true);
      setTimeout(onNext, 1000);
    } catch {
      onNext(); // on error, still advance
    } finally {
      setSaving(false);
    }
  };

  const METHODS = [
    { id: "stripe",       icon: "💳", label: "Tarjeta (Stripe)", desc: "Cobro online automático" },
    { id: "bizum",        icon: "🟣", label: "Bizum",             desc: "El cliente te manda el dinero" },
    { id: "transferencia",icon: "🏦", label: "Transferencia",     desc: "IBAN bancario" },
    { id: "efectivo",     icon: "💵", label: "Efectivo",          desc: "Pago en mano" },
  ];

  return (
    <div className="space-y-5">
      {/* Method toggles */}
      <div className="space-y-2">
        <p className={lc}>Métodos de cobro activos</p>
        {METHODS.map(m => {
          const active = enabledMethods.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleMethod(m.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 transition-all text-left ${
                active
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-emerald-100 bg-white hover:border-emerald-200"
              }`}
            >
              <span className="text-xl flex-shrink-0">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-900">{m.label}</p>
                <p className="text-xs text-emerald-700/50">{m.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                active ? "bg-emerald-600 border-emerald-600" : "border-emerald-200"
              }`}>
                {active && <span className="material-symbols-outlined text-white text-[12px]">check</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Conditional fields */}
      {enabledMethods.includes("bizum") && (
        <div>
          <label className={lc}>Teléfono Bizum</label>
          <input
            type="tel"
            placeholder="+34 600 000 000"
            value={bizumPhone}
            onChange={e => setBizumPhone(e.target.value)}
            className={ic}
            style={{ fontSize: "16px" }}
          />
        </div>
      )}
      {enabledMethods.includes("transferencia") && (
        <div>
          <label className={lc}>IBAN bancario</label>
          <input
            type="text"
            placeholder="ES00 0000 0000 0000 0000 0000"
            value={iban}
            onChange={e => setIban(e.target.value.toUpperCase())}
            className={ic}
            style={{ fontSize: "16px" }}
          />
        </div>
      )}

      {saved ? (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <span className="material-symbols-outlined text-emerald-600 text-[22px]">check_circle</span>
          <p className="font-semibold text-emerald-900 text-sm">Pagos configurados ✓</p>
        </div>
      ) : (
        <button
          onClick={handleSave}
          disabled={saving || enabledMethods.length === 0}
          className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white py-4 rounded-xl font-bold text-sm transition-all min-h-[52px] flex items-center justify-center gap-2"
        >
          {saving ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>
          ) : (
            <>Guardar y continuar <span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
          )}
        </button>
      )}

      <button
        onClick={onSkip}
        className="w-full text-emerald-700/50 hover:text-emerald-700 py-2 text-sm font-medium transition-colors"
      >
        Lo haré después →
      </button>
    </div>
  );
}

// ── STEP 3 — First certification ──────────────────────────────────────────────

const DUMMY_CERT = {
  ownerName:     "Ana García Martínez",
  ownerEmail:    "propietario@ejemplo.com",
  ownerPhone:    "+34 612 345 678",
  address:       "Calle Mayor 15, 3º B",
  city:          "Madrid",
  postalCode:    "28001",
  province:      "Madrid",
  propertyType:  "Piso/Apartamento",
  constructionYear: 1995,
  totalArea:     "85",
  status:        "Nuevo",
};

function Step3FirstCert({ onNext }: { onNext: (certId?: number) => void }) {
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [certId, setCertId] = useState<number | null>(null);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const cert = await apiRequest("POST", "/api/certifications", DUMMY_CERT);
      setCertId(cert.id);
      setCreated(true);
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setTimeout(() => onNext(cert.id), 1400);
    } catch {
      // Even on error, advance
      onNext();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[20px]">verified</span>
          </div>
          <div>
            <p className="font-bold text-emerald-900">Certificación de prueba</p>
            <p className="text-xs text-emerald-700/60">Datos ficticios para explorar el flujo</p>
          </div>
        </div>

        {/* Preview of dummy data */}
        <div className="space-y-2">
          {[
            { label: "Propietario", value: DUMMY_CERT.ownerName },
            { label: "Inmueble",    value: `${DUMMY_CERT.address}, ${DUMMY_CERT.city}` },
            { label: "Tipo",        value: DUMMY_CERT.propertyType },
            { label: "Superficie",  value: `${DUMMY_CERT.totalArea} m²` },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-3 text-sm">
              <span className="w-20 text-[10px] font-bold uppercase tracking-wider text-emerald-700/50 flex-shrink-0">{r.label}</span>
              <span className="text-emerald-900 font-medium">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {created ? (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <span className="material-symbols-outlined text-emerald-600 text-[24px]">check_circle</span>
          <div>
            <p className="font-semibold text-emerald-900 text-sm">Certificación creada ✓</p>
            <p className="text-xs text-emerald-700/60">Preparando tu panel...</p>
          </div>
        </div>
      ) : (
        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white py-4 rounded-xl font-bold text-base transition-all shadow-lg shadow-emerald-200 min-h-[56px] flex items-center justify-center gap-2"
        >
          {creating ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creando...</>
          ) : (
            <><span className="material-symbols-outlined text-[20px]">add_circle</span>Crear certificación de prueba</>
          )}
        </button>
      )}

      <button
        onClick={() => onNext()}
        className="w-full text-emerald-700/50 hover:text-emerald-700 py-2 text-sm font-medium transition-colors"
      >
        Saltarme este paso →
      </button>
    </div>
  );
}

// ── FINISH screen ─────────────────────────────────────────────────────────────

function FinishScreen({ onDone }: { onDone: () => void }) {
  const canvasRef = useConfetti(true);

  return (
    <div className="text-center space-y-4">
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10" />

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 250, damping: 18 }}
        className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"
      >
        <span className="material-symbols-outlined text-emerald-600 text-[40px]"
          style={{ fontVariationSettings: "'FILL' 1" }}>
          celebration
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-black text-emerald-900 mb-2">¡Listo! Ya puedes usar Certifive.</h2>
        <p className="text-emerald-700/60 text-sm leading-relaxed max-w-sm mx-auto">
          Has completado la configuración inicial. Todo lo que necesitas está en el panel.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-3 gap-3 mt-4"
      >
        {[
          { icon: "verified",    label: "Certificaciones" },
          { icon: "payments",    label: "Cobros online"   },
          { icon: "receipt_long",label: "Facturas"        },
        ].map(f => (
          <div key={f.label} className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
            <span className="material-symbols-outlined text-emerald-600 text-[22px] block mb-1">{f.icon}</span>
            <p className="text-[10px] font-bold text-emerald-700/70 uppercase tracking-wide">{f.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        onClick={onDone}
        className="w-full bg-emerald-700 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold text-base transition-all shadow-lg shadow-emerald-200 mt-2 min-h-[52px]"
      >
        Ir a mi panel →
      </motion.button>
    </div>
  );
}

// ── MAIN component ────────────────────────────────────────────────────────────

const STEP_META = [
  { title: "Completa tu perfil",        subtitle: "Para que tus clientes te reconozcan y tus facturas sean legales." },
  { title: "Configura tus pagos",       subtitle: "Cobra online con Stripe o usa métodos manuales." },
  { title: "Crea tu primera certificación", subtitle: "Usaremos datos de prueba para que veas cómo funciona el flujo." },
];

export default function OnboardingFlow({ user, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);   // 0 | 1 | 2 | 3 (finish)
  const [direction, setDirection] = useState(1);

  const completeMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/auth/onboarding/complete"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const advance = useCallback((n = 1) => {
    setDirection(1);
    setStep(s => s + n);
  }, []);

  const handleFinish = useCallback(() => {
    completeMutation.mutate();
    onComplete();
  }, [completeMutation, onComplete]);

  const isFinish = step === 3;
  const meta = STEP_META[step] ?? null;

  const variants = {
    enter:  (dir: number) => ({ x: dir * 40, opacity: 0 }),
    center: { x: 0,        opacity: 1 },
    exit:   (dir: number) => ({ x: dir * -40, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto">
      {/* ── Header bar ─── */}
      {!isFinish && (
        <div className="flex-shrink-0 bg-emerald-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[16px]">energy_savings_leaf</span>
            </div>
            <span className="text-white font-black text-sm tracking-tight">CERTIFIVE</span>
          </div>
          <span className="text-emerald-300 text-xs font-semibold">
            Configuración inicial — Paso {step + 1} de {STEP_META.length}
          </span>
        </div>
      )}

      {/* ── Content ─── */}
      <div className="flex-1 flex items-start sm:items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">

          {/* Dots */}
          {!isFinish && <StepDots current={step} total={STEP_META.length} />}

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              {isFinish ? (
                <FinishScreen onDone={handleFinish} />
              ) : (
                <>
                  <div className="mb-7">
                    <h1 className="text-2xl font-black text-emerald-900 tracking-tight">{meta.title}</h1>
                    <p className="text-emerald-700/60 text-sm mt-1 leading-relaxed">{meta.subtitle}</p>
                  </div>

                  {step === 0 && <Step1Profile initial={user} onNext={() => advance()} />}
                  {step === 1 && <Step2Payments onNext={() => advance()} onSkip={() => advance()} />}
                  {step === 2 && <Step3FirstCert onNext={() => advance()} />}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Background pattern ─── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-50 rounded-full opacity-60" />
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-50 rounded-full opacity-40" />
      </div>
    </div>
  );
}
