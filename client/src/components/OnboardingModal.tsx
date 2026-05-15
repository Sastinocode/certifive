import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  FileCheck,
  MessageCircle,
  Euro,
  BarChart3,
  Settings,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  CheckCircle,
  Zap,
  Users,
  FileText,
  Bell,
} from "lucide-react";

const ONBOARDING_KEY = "certifive_onboarding_v1_done";

const steps = [
  {
    id: "welcome",
    icon: Sparkles,
    iconBg: "bg-gradient-to-br from-emerald-800 to-emerald-600",
    label: "Bienvenido",
    title: "Bienvenido a CERTIFIVE",
    subtitle: "Tu plataforma profesional de certificación energética",
    description:
      "En los próximos minutos te mostraremos cómo sacarle el máximo partido a la plataforma. Sigue los pasos y empieza a gestionar tus certificados de forma más eficiente.",
    tips: [
      { icon: CheckCircle, text: "Gestión completa de CEEs" },
      { icon: CheckCircle, text: "Automatización con WhatsApp" },
      { icon: CheckCircle, text: "Facturación y cobros integrados" },
    ],
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    iconBg: "bg-gradient-to-br from-emerald-800 to-emerald-600",
    label: "Dashboard",
    title: "Tu centro de operaciones",
    subtitle: "Sección: Dashboard",
    description:
      "El dashboard es tu punto de partida. Desde aquí puedes ver de un vistazo tus certificados activos, los en proceso, los que están a punto de vencer y tus ingresos del mes.",
    tips: [
      { icon: Zap, text: "Accede a las acciones más frecuentes con un clic" },
      { icon: Bell, text: "Notificaciones de vencimientos y novedades" },
      { icon: FileText, text: "Historial de tus últimas certificaciones" },
    ],
  },
  {
    id: "certificates",
    icon: FileCheck,
    iconBg: "bg-emerald-700",
    label: "Certificaciones",
    title: "Crea y gestiona certificados",
    subtitle: "Sección: Certificaciones",
    description:
      "El módulo de certificaciones es el corazón de la plataforma. Aquí gestionas todas las solicitudes que recibes de clientes, haces el seguimiento del estado y puedes archivar los certificados finales.",
    tips: [
      { icon: FileCheck, text: "Asistente paso a paso para nuevas certificaciones" },
      { icon: Users, text: "Gestión de solicitudes de clientes por correo o WhatsApp" },
      { icon: CheckCircle, text: "Archivo organizado de certificados emitidos" },
    ],
  },
  {
    id: "whatsapp",
    icon: MessageCircle,
    iconBg: "bg-emerald-600",
    label: "WhatsApp",
    title: "Automatiza con WhatsApp",
    subtitle: "Sección: Clientes WhatsApp",
    description:
      "Conecta tu cuenta de WhatsApp Business y automatiza la captación de nuevos clientes. El sistema recoge los datos del inmueble, genera el presupuesto y cobra el anticipo de forma automática.",
    tips: [
      { icon: MessageCircle, text: "Flujo conversacional inteligente 24/7" },
      { icon: Zap, text: "Presupuesto generado y enviado en segundos" },
      { icon: Euro, text: "Cobro del anticipo automatizado vía Stripe" },
    ],
  },
  {
    id: "pricing",
    icon: Euro,
    iconBg: "bg-orange-500",
    label: "Tarifas",
    title: "Configura tus precios",
    subtitle: "Sección: Tarifas",
    description:
      "Define tus tarifas base por tipo de inmueble y zona, añade servicios adicionales (urgente, fotografía, medición) y genera un enlace público para que tus clientes calculen su presupuesto antes de contactarte.",
    tips: [
      { icon: Euro, text: "Precios diferenciados por tipo de inmueble" },
      { icon: Zap, text: "Servicio urgente y extras configurables" },
      { icon: ArrowRight, text: "Enlace público del generador de presupuestos" },
    ],
  },
  {
    id: "reports",
    icon: BarChart3,
    iconBg: "bg-emerald-700",
    label: "Informes",
    title: "Control financiero total",
    subtitle: "Sección: Informes",
    description:
      "Emite facturas, gestiona cobros y lleva el control de tu tesorería desde un único lugar. Puedes exportar tus facturas, hacer seguimiento de pagos pendientes y ver la evolución de tus ingresos.",
    tips: [
      { icon: FileText, text: "Facturación profesional con IVA e IRPF" },
      { icon: CheckCircle, text: "Gestión de cobros y pagos pendientes" },
      { icon: BarChart3, text: "Gráficas de ingresos y análisis mensual" },
    ],
  },
  {
    id: "settings",
    icon: Settings,
    iconBg: "bg-gradient-to-br from-emerald-800 to-emerald-600",
    label: "Configuración",
    title: "Personaliza tu cuenta",
    subtitle: "Sección: Configuración",
    description:
      "Completa tu perfil profesional con tu número de colegiado, empresa y datos de contacto. Estos datos aparecerán en los certificados que emitas, así que asegúrate de que están correctos.",
    tips: [
      { icon: Settings, text: "Perfil profesional para tus certificados" },
      { icon: Bell, text: "Preferencias de notificaciones" },
      { icon: CheckCircle, text: "Validación de datos obligatorios" },
    ],
  },
  {
    id: "start",
    icon: Zap,
    iconBg: "bg-orange-500",
    label: "¡Empezar!",
    title: "¡Todo listo para empezar!",
    subtitle: "Configuración inicial recomendada",
    description:
      "Ya conoces los puntos clave de CERTIFIVE. Te recomendamos seguir estos tres pasos para tener todo configurado antes de tu primer certificado.",
    tips: [
      { icon: Settings, text: "Completa tu perfil profesional en Configuración" },
      { icon: Euro, text: "Define tus tarifas en la sección Tarifas" },
      { icon: FileCheck, text: "Crea tu primera certificación" },
    ],
  },
];

interface OnboardingModalProps {
  onComplete?: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const markDone = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setIsVisible(false);
  };

  const handleComplete = () => {
    markDone();
    navigate("/");
    onComplete?.();
  };

  const handleSkip = () => {
    markDone();
  };

  const handleFinishToSettings = () => {
    markDone();
    navigate("/configuracion");
    onComplete?.();
  };

  const goToStep = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(index);
      setIsAnimating(false);
    }, 200);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-emerald-950/60 backdrop-blur-sm"
        onClick={handleSkip}
      />

      <div
        className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transition-all duration-300 ${
          isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        {/* Top bar */}
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? "w-6 bg-emerald-800"
                      : i < currentStep
                      ? "w-1.5 bg-emerald-400"
                      : "w-1.5 bg-emerald-100"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/40">
                {currentStep + 1} / {steps.length}
              </span>
              <button
                onClick={handleSkip}
                className="text-emerald-700/40 hover:text-emerald-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Step breadcrumb */}
        <div className="px-6 mb-0">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={i}
                  onClick={() => goToStep(i)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${
                    i === currentStep
                      ? "bg-emerald-50 text-emerald-800"
                      : i < currentStep
                      ? "text-emerald-500 hover:text-emerald-700"
                      : "text-emerald-300 hover:text-emerald-500"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-emerald-50 mx-6 mt-3" />

        {/* Content */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4 mb-5">
            <div
              className={`w-14 h-14 ${step.iconBg} rounded-2xl flex items-center justify-center shrink-0`}
            >
              <StepIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              {step.subtitle && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/50 mb-0.5">
                  {step.subtitle}
                </p>
              )}
              <h2 className="text-xl font-black text-emerald-900 leading-tight">
                {step.title}
              </h2>
            </div>
          </div>

          <p className="text-sm text-emerald-700/70 leading-relaxed mb-5">
            {step.description}
          </p>

          <div className="space-y-2.5">
            {step.tips.map((tip, i) => {
              const TipIcon = tip.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-emerald-50 rounded-xl px-4 py-3"
                >
                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center border border-emerald-100 shrink-0">
                    <TipIcon className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-900">
                    {tip.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="h-px bg-emerald-50 mb-4" />
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-colors ${
                isFirst
                  ? "border-transparent text-transparent cursor-default"
                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </button>

            {!isLast && (
              <button
                onClick={handleSkip}
                className="text-xs text-emerald-700/40 hover:text-emerald-700 transition-colors"
              >
                Omitir tutorial
              </button>
            )}

            {isLast ? (
              <div className="flex gap-2">
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  Al Dashboard
                </button>
                <button
                  onClick={handleFinishToSettings}
                  className="flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Configurar perfil
                </button>
              </div>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white transition-colors"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
