/**
 * CERTIFIVE — Landing page de captación beta
 *
 * 7 secciones:
 *   1. Hero (primera pantalla, oscura)
 *   2. Problema / Solución
 *   3. Cómo funciona (3 pasos)
 *   4. Funcionalidades clave (6 tarjetas)
 *   5. Precios beta (plan único)
 *   6. Formulario de registro beta
 *   7. Footer
 *
 * Stack: React 18 + Tailwind + Framer Motion
 * Colores: fondo #111827 (slate-900) + esmeralda #059669
 */

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

// ── Provinces list ─────────────────────────────────────────────────────────────
const PROVINCES = [
  "Álava","Albacete","Alicante","Almería","Asturias","Ávila","Badajoz","Baleares",
  "Barcelona","Burgos","Cáceres","Cádiz","Cantabria","Castellón","Ciudad Real","Córdoba",
  "A Coruña","Cuenca","Girona","Granada","Guadalajara","Gipuzkoa","Huelva","Huesca",
  "Jaén","León","Lleida","La Rioja","Lugo","Madrid","Málaga","Murcia","Navarra",
  "Ourense","Palencia","Las Palmas","Pontevedra","Salamanca","Santa Cruz de Tenerife",
  "Segovia","Sevilla","Soria","Tarragona","Teruel","Toledo","Valencia","Valladolid",
  "Bizkaia","Zamora","Zaragoza","Ceuta","Melilla",
];

// ── Animation helpers ─────────────────────────────────────────────────────────
interface FadeInProps { children: React.ReactNode; delay?: number; className?: string }
function FadeIn({ children, delay = 0, className = "" }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface Props {
  onShowLogin: () => void;
  onShowRegister: () => void;
}

// ── Input style ───────────────────────────────────────────────────────────────
const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all";

// ─────────────────────────────────────────────────────────────────────────────
export default function Landing({ onShowLogin, onShowRegister }: Props) {
  const formRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    nombre: "", email: "", telefono: "", provincia: "", certificacionesMes: "",
  });
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim()) {
      setErrorMsg("El nombre y el email son obligatorios.");
      return;
    }
    setFormState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/beta-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          certificacionesMes: form.certificacionesMes ? parseInt(form.certificacionesMes) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "Error desconocido");
      }
      setFormState("success");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Error al enviar el formulario.");
      setFormState("error");
    }
  };

  // ── Nav ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#111827] text-white antialiased">

      {/* ════════════ NAV ════════════ */}
      <nav className="sticky top-0 z-50 bg-[#111827]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <span className="material-symbols-outlined text-white text-[18px]">energy_savings_leaf</span>
            </div>
            <span className="font-black text-lg tracking-tight text-white">CERTIFIVE</span>
          </div>

          {/* Nav links — hidden on mobile */}
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-white/50">
            <a href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</a>
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#precios" className="hover:text-white transition-colors">Precios</a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onShowLogin}
              className="text-white/60 hover:text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors hidden sm:block"
            >
              Iniciar sesión
            </button>
            <button
              onClick={scrollToForm}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-md shadow-emerald-900/30"
            >
              Acceso beta
            </button>
          </div>
        </div>
      </nav>

      {/* ════════════ 1. HERO ════════════ */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-emerald-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-20 pb-24 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-emerald-900/50 border border-emerald-700/50 rounded-full px-4 py-2 mb-8"
          >
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-300 text-xs font-bold uppercase tracking-widest">
              Programa beta — Plazas limitadas
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6"
          >
            Gestiona tus certificaciones
            <span className="block text-emerald-400 mt-1">energéticas en 3 clics</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            La plataforma que automatiza el papeleo para que tú te centres en certificar.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <button
              onClick={scrollToForm}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-xl shadow-emerald-900/40 hover:shadow-emerald-700/30 hover:-translate-y-0.5 min-h-[52px]"
            >
              Empieza gratis — 30 días sin tarjeta
            </button>
            <button
              onClick={() => {}}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl font-semibold text-base transition-all min-h-[52px]"
            >
              <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px]">play_arrow</span>
              </span>
              Ver demo en vídeo
            </button>
          </motion.div>

          {/* Social proof */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 text-white/30 text-sm"
          >
            Sin tarjeta de crédito · Instalación en 2 minutos · Soporte en español
          </motion.p>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto"
          >
            {[
              { value: "+200", label: "Certificadores" },
              { value: "85%", label: "Menos papeleo" },
              { value: "3 clics", label: "Por certificación" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">{s.value}</p>
                <p className="text-white/40 text-xs mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════ 2. PROBLEMA / SOLUCIÓN ════════════ */}
      <section className="py-24 bg-[#0d1117]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <FadeIn className="text-center mb-14">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">El antes y el después</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">¿Reconoces esta situación?</h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sin Certifive */}
            <FadeIn delay={0.1}>
              <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-red-900/40 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-400 text-[18px]">close</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Sin Certifive</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    { icon: "table_chart",   text: "Excel para todo — un horror de pestañas y fórmulas rotas" },
                    { icon: "chat",          text: "WhatsApps manuales a cada cliente para pedir documentos" },
                    { icon: "receipt_long",  text: "Facturas a mano en Word que tardan 20 minutos" },
                    { icon: "schedule",      text: "Clientes que no pagan hasta que les persigues" },
                    { icon: "folder_open",   text: "Expedientes dispersos entre el email y el escritorio" },
                  ].map(p => (
                    <li key={p.text} className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-red-400 text-[14px]">{p.icon}</span>
                      </div>
                      <span className="text-white/60 text-sm leading-relaxed">{p.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            {/* Con Certifive */}
            <FadeIn delay={0.2}>
              <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/20 p-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-emerald-800/50 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Con Certifive</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    { icon: "dashboard",     text: "Panel unificado — toda tu cartera de certificaciones en una sola pantalla" },
                    { icon: "send",          text: "Link automático al propietario — rellena sus datos en el móvil sin llamadas" },
                    { icon: "receipt_long",  text: "Facturas legales generadas en un clic, listas para descargar" },
                    { icon: "payments",      text: "Pagos online con Stripe, Bizum o transferencia — con recordatorios automáticos" },
                    { icon: "folder_special", text: "Expedientes ordenados y archivados automáticamente por cliente" },
                  ].map(s => (
                    <li key={s.text} className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-emerald-800/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-emerald-400 text-[14px]">{s.icon}</span>
                      </div>
                      <span className="text-white/80 text-sm leading-relaxed">{s.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ════════════ 3. CÓMO FUNCIONA ════════════ */}
      <section id="como-funciona" className="py-24 bg-[#111827]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <FadeIn className="text-center mb-16">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">El proceso</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">3 pasos. Así de sencillo.</h2>
            <p className="text-white/50 mt-3 max-w-xl mx-auto">Del primer contacto al certificado entregado, todo dentro de Certifive.</p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connecting line — desktop only */}
            <div className="hidden md:block absolute top-14 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-gradient-to-r from-transparent via-emerald-700/40 to-transparent" />

            {[
              {
                num: "01",
                icon: "link",
                title: "Mandas el enlace",
                desc: "En un clic envías un formulario personalizado al propietario por email o WhatsApp. Él lo rellena desde el móvil en 5 minutos.",
                tag: "Sin llamadas",
              },
              {
                num: "02",
                icon: "task_alt",
                title: "Revisas y emites",
                desc: "Recibes todos los datos y documentos ordenados. Revisas, ajustas si hace falta, y emites el certificado desde el panel.",
                tag: "Todo centralizado",
              },
              {
                num: "03",
                icon: "payments",
                title: "El cliente paga y recibe",
                desc: "Cobras online con Stripe, Bizum o transferencia. El cliente recibe el certificado automáticamente al confirmar el pago.",
                tag: "Cobro automático",
              },
            ].map((step, i) => (
              <FadeIn key={step.num} delay={0.1 * (i + 1)}>
                <div className="relative bg-white/4 border border-white/8 rounded-2xl p-7 hover:border-emerald-700/40 transition-colors group">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 bg-emerald-600/20 border border-emerald-700/30 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600/30 transition-colors">
                      <span className="material-symbols-outlined text-emerald-400 text-[22px]">{step.icon}</span>
                    </div>
                    <span className="text-4xl font-black text-white/5 leading-none">{step.num}</span>
                  </div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-900/40 px-2 py-1 rounded-full mb-3">
                    {step.tag}
                  </span>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ 4. FUNCIONALIDADES ════════════ */}
      <section id="funcionalidades" className="py-24 bg-[#0d1117]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <FadeIn className="text-center mb-14">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Funcionalidades</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">Todo lo que necesitas, nada de lo que no</h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: "assignment",
                color: "bg-blue-600/20 border-blue-700/30 text-blue-400",
                title: "Formulario del propietario",
                desc: "Link personalizado para que el cliente rellene sus datos de propiedad desde cualquier dispositivo, sin crear cuenta.",
              },
              {
                icon: "payments",
                color: "bg-emerald-600/20 border-emerald-700/30 text-emerald-400",
                title: "Pagos automatizados",
                desc: "Stripe, Bizum, transferencia y efectivo. Dos tramos de cobro con confirmación automática y recordatorios.",
              },
              {
                icon: "chat",
                color: "bg-green-600/20 border-green-700/30 text-green-400",
                title: "WhatsApp integrado",
                desc: "Envía mensajes a tus clientes directamente desde el panel con plantillas predefinidas y variables dinámicas.",
              },
              {
                icon: "receipt_long",
                color: "bg-violet-600/20 border-violet-700/30 text-violet-400",
                title: "Facturas legales",
                desc: "Generación automática de facturas conforme a la normativa española con tu logo y datos fiscales.",
              },
              {
                icon: "folder_special",
                color: "bg-amber-600/20 border-amber-700/30 text-amber-400",
                title: "Gestión de expedientes",
                desc: "Todos los documentos, notas y el historial de cada certificación organizados en un solo expediente.",
              },
              {
                icon: "bar_chart",
                color: "bg-teal-600/20 border-teal-700/30 text-teal-400",
                title: "Generación de reportes",
                desc: "Exporta tu actividad en Excel o PDF. Listados de certificaciones, ingresos y métricas de rendimiento.",
              },
            ].map((f, i) => (
              <FadeIn key={f.title} delay={0.06 * i}>
                <div className={`h-full rounded-2xl border bg-white/3 border-white/8 p-6 hover:border-white/15 transition-all group`}>
                  <div className={`w-11 h-11 ${f.color} border rounded-xl flex items-center justify-center mb-4`}>
                    <span className="material-symbols-outlined text-[20px]">{f.icon}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ 5. PRECIOS ════════════ */}
      <section id="precios" className="py-24 bg-[#111827]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <FadeIn className="text-center mb-12">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Precios</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">Sin letra pequeña</h2>
            <p className="text-white/50 mt-3 max-w-xl mx-auto">Durante el programa beta, el acceso es completamente gratuito.</p>
          </FadeIn>

          <FadeIn delay={0.1} className="max-w-sm mx-auto">
            <div className="relative rounded-3xl border border-emerald-700/50 bg-gradient-to-b from-emerald-950/50 to-[#111827] p-8 text-center shadow-2xl shadow-emerald-900/20">
              {/* Best badge */}
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                Plan Beta
              </span>

              <div className="mt-3 mb-6">
                <p className="text-5xl font-black text-white tracking-tighter">Gratis</p>
                <p className="text-white/50 text-sm mt-1">30 días completos · Sin tarjeta</p>
              </div>

              <ul className="space-y-3 text-left mb-8">
                {[
                  "Certificaciones ilimitadas",
                  "Formularios de propietario",
                  "Pagos con Stripe + métodos manuales",
                  "Facturas legales automáticas",
                  "WhatsApp integrado",
                  "Soporte prioritario en español",
                  "Precio bloqueado al finalizar la beta",
                ].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                    <span className="w-5 h-5 bg-emerald-700/40 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-emerald-400 text-[12px]">check</span>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={scrollToForm}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold text-base transition-all shadow-lg shadow-emerald-900/30 min-h-[52px]"
              >
                Solicitar acceso beta →
              </button>

              <p className="text-white/30 text-xs mt-3">Plazas limitadas · Respuesta en 24 h</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════════ 6. FORMULARIO ════════════ */}
      <section id="registro" className="py-24 bg-[#0d1117]" ref={formRef}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Left — copy */}
            <FadeIn>
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Acceso beta</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 mb-5 tracking-tight leading-tight">
                Sé de los primeros en automatizar tu gestión CEE
              </h2>
              <p className="text-white/50 leading-relaxed mb-8">
                Rellena el formulario y te contactaremos en menos de 24 horas con tus credenciales de acceso. Sin coste, sin permanencia.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: "lock",         text: "Datos protegidos — nunca los compartimos" },
                  { icon: "calendar_today", text: "Acceso en 24 h laborables" },
                  { icon: "star",         text: "Precio beta bloqueado de por vida" },
                ].map(item => (
                  <li key={item.text} className="flex items-center gap-3 text-sm text-white/60">
                    <span className="w-8 h-8 bg-emerald-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-emerald-400 text-[16px]">{item.icon}</span>
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </FadeIn>

            {/* Right — form */}
            <FadeIn delay={0.15}>
              {formState === "success" ? (
                <div className="rounded-3xl bg-emerald-900/20 border border-emerald-700/40 p-10 text-center">
                  <div className="w-16 h-16 bg-emerald-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-emerald-400 text-[32px]">check_circle</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">¡Ya estás en lista!</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Hemos recibido tu solicitud y te hemos enviado un email de confirmación. Te contactaremos pronto con el acceso.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-3xl bg-white/3 border border-white/8 p-7 sm:p-8 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                        Nombre <span className="text-emerald-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Tu nombre"
                        required
                        value={form.nombre}
                        onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                        className={inputCls}
                        style={{ fontSize: "16px" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                        Email <span className="text-emerald-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="tu@email.com"
                        required
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className={inputCls}
                        style={{ fontSize: "16px" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Teléfono</label>
                      <input
                        type="tel"
                        placeholder="+34 600 000 000"
                        value={form.telefono}
                        onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                        className={inputCls}
                        style={{ fontSize: "16px" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Provincia</label>
                      <select
                        value={form.provincia}
                        onChange={e => setForm(f => ({ ...f, provincia: e.target.value }))}
                        className={inputCls + " appearance-none"}
                        style={{ fontSize: "16px" }}
                      >
                        <option value="">Selecciona...</option>
                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      ¿Cuántas certificaciones haces al mes? (aproximado)
                    </label>
                    <select
                      value={form.certificacionesMes}
                      onChange={e => setForm(f => ({ ...f, certificacionesMes: e.target.value }))}
                      className={inputCls + " appearance-none"}
                      style={{ fontSize: "16px" }}
                    >
                      <option value="">Selecciona...</option>
                      <option value="5">Menos de 5</option>
                      <option value="10">Entre 5 y 15</option>
                      <option value="25">Entre 15 y 30</option>
                      <option value="50">Más de 30</option>
                    </select>
                  </div>

                  {errorMsg && (
                    <div className="bg-red-900/30 border border-red-700/40 rounded-xl px-4 py-3 text-sm text-red-300">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={formState === "loading"}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-base transition-all shadow-lg shadow-emerald-900/30 min-h-[56px] flex items-center justify-center gap-2"
                  >
                    {formState === "loading" ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Quiero acceso beta →"
                    )}
                  </button>

                  <p className="text-white/25 text-xs text-center">
                    Al enviar aceptas nuestra{" "}
                    <button type="button" className="underline hover:text-white/50 transition-colors">
                      política de privacidad
                    </button>
                    .
                  </p>
                </form>
              )}
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ════════════ 7. FOOTER ════════════ */}
      <footer className="bg-[#111827] border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[16px]">energy_savings_leaf</span>
            </div>
            <span className="text-white font-bold text-sm">CERTIFIVE</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {[
              { label: "Privacidad",  href: "#" },
              { label: "Cookies",     href: "#" },
              { label: "Términos",    href: "#" },
            ].map(l => (
              <a key={l.label} href={l.href} className="text-white/30 hover:text-white/60 text-xs font-medium transition-colors">
                {l.label}
              </a>
            ))}
            <a href="mailto:hola@certifive.es" className="text-white/30 hover:text-white/60 text-xs font-medium transition-colors">
              hola@certifive.es
            </a>
          </div>

          <p className="text-white/20 text-xs text-center">© {new Date().getFullYear()} CERTIFIVE</p>
        </div>
      </footer>
    </div>
  );
}
