import { useState } from "react";
import { useLocation } from "wouter";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Pill } from "@/components/public/Pill";
import { BtnPrimary, BtnGhost, ArrowRight } from "@/components/public/PublicButton";

const plans = [
  {
    id: "vivienda",
    iconBg: "bg-emerald-50 text-pub-primary",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: "Vivienda",
    desc: "Pisos, casas y chalets. El más solicitado para vender o alquilar.",
    price: 129 as number | null,
    sqmNote: "Hasta 100 m² · +0,40 €/m² adicional",
    features: [
      "Visita técnica de un colegiado",
      "Certificado oficial en PDF",
      "Registro en la CCAA incluido",
      "Etiqueta energética",
    ],
    featured: false,
    badge: undefined as string | undefined,
    primary: false,
    cta: "Solicitar",
    href: "/solicitud-cee?plan=vivienda",
  },
  {
    id: "local",
    iconBg: "bg-pub-primary text-white",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="6" width="18" height="14" rx="1"/>
        <path d="M3 10h18"/>
      </svg>
    ),
    title: "Local / Oficina",
    desc: "Locales comerciales y espacios de oficina (uso terciario).",
    price: 169 as number | null,
    sqmNote: "Hasta 150 m² · +0,50 €/m² adicional",
    features: [
      "Todo lo de Vivienda, y además:",
      "Cálculo de instalaciones terciarias",
      "Informe de medidas de mejora",
      "Soporte prioritario por WhatsApp",
    ],
    featured: true,
    badge: "Más completo",
    primary: true,
    cta: "Solicitar",
    href: "/solicitud-cee?plan=local",
  },
  {
    id: "edificio",
    iconBg: "bg-emerald-50 text-pub-primary",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="2" width="16" height="20" rx="1"/>
        <line x1="9" y1="6" x2="9" y2="6"/><line x1="15" y1="6" x2="15" y2="6"/>
        <line x1="9" y1="10" x2="9" y2="10"/><line x1="15" y1="10" x2="15" y2="10"/>
        <line x1="9" y1="14" x2="9" y2="14"/><line x1="15" y1="14" x2="15" y2="14"/>
      </svg>
    ),
    title: "Edificio completo",
    desc: "Bloques residenciales, comunidades y promociones.",
    price: null as number | null,
    sqmNote: "Presupuesto según nº de viviendas y portales",
    features: [
      "Certificación de todo el edificio",
      "Descuento por volumen",
      "Gestor de cuenta dedicado",
      "Facturación a comunidad/administrador",
    ],
    featured: false,
    badge: undefined as string | undefined,
    primary: false,
    cta: "Pedir presupuesto",
    href: "/solicitar-demo",
  },
];

const addons = [
  {
    price: "+29 €",
    title: "Tramitación urgente",
    subtitle: "Visita en 24-48 h y PDF el mismo día de la visita.",
    iconBg: "bg-amber-50 text-amber-600",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2L3 14h9l-1 8 10-12h-9z"/>
      </svg>
    ),
  },
  {
    price: "+19 €",
    title: "Plan de mejora detallado",
    subtitle: "Informe con coste y ahorro estimado de cada medida.",
    iconBg: "bg-emerald-50 text-pub-primary",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
  },
  {
    price: "+15 €",
    title: "Copia compulsada",
    subtitle: "Documento sellado para notaría o trámites oficiales.",
    iconBg: "bg-emerald-50 text-pub-primary",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
];

const faqs = [
  {
    q: "¿El precio incluye el registro oficial?",
    a: "Sí. Todos los planes incluyen el registro del certificado en el órgano competente de tu Comunidad Autónoma, así como la tasa autonómica correspondiente. No hay costes ocultos.",
  },
  {
    q: "¿Cuánto tarda en estar listo?",
    a: "Tras la visita técnica recibes el certificado en PDF en un plazo de 2 a 5 días laborables. Con el servicio de tramitación urgente, el mismo día de la visita.",
  },
  {
    q: "¿Cuándo se realiza el cobro?",
    a: "No se realiza ningún cargo hasta que confirmamos contigo la fecha y hora de la visita técnica. Puedes cancelar de forma gratuita hasta 24 horas antes de la visita.",
  },
  {
    q: "¿Qué pasa si mi inmueble supera los m² incluidos?",
    a: "Verás el precio exacto antes de pagar. Sobre la superficie incluida en cada plan se aplica una tarifa por metro cuadrado adicional, que se calcula automáticamente en tu presupuesto.",
  },
  {
    q: "¿El certificado es válido en toda España?",
    a: "Sí. El certificado de eficiencia energética es un documento oficial con validez de 10 años, reconocido en todo el territorio nacional y emitido por un técnico colegiado.",
  },
];

export default function PreciosCEE() {
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <PublicLayout variant="marketing">

      {/* ── Hero ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pub-primary/10 text-pub-primary text-[11px] font-bold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-pub-primary" />
            Precio cerrado · sin sorpresas
          </span>
          <h1 className="text-[2.4rem] sm:text-[3rem] font-extrabold text-pub-ink mt-4 leading-[1.04] tracking-tight">
            Un precio claro<br />para tu certificado
          </h1>
          <p className="text-[15px] sm:text-[17px] text-pub-muted mt-5 max-w-xl mx-auto leading-relaxed">
            Visita técnica, certificado oficial en PDF y registro en la CCAA, todo incluido. Sin permanencia y con garantía de aceptación oficial.
          </p>
        </div>
      </section>

      {/* ── Plans ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 -mt-2 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={[
                "relative flex flex-col bg-white border-[1.5px] rounded-[24px] py-[30px] px-7 transition-all duration-200",
                "hover:-translate-y-[3px] hover:shadow-[0_18px_40px_rgba(15,31,46,.08)] hover:border-[#cdd1d8]",
                plan.featured
                  ? "border-pub-primary shadow-[0_18px_44px_hsl(142_69%_36%/0.16)]"
                  : "border-pub-border",
              ].join(" ")}
            >
              {plan.featured && plan.badge && (
                <Pill
                  variant="green"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-sm whitespace-nowrap"
                >
                  {plan.badge}
                </Pill>
              )}

              <div className="flex items-center gap-2.5 mb-4">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${plan.iconBg}`}>
                  {plan.icon}
                </span>
                <h3 className="text-lg font-bold text-pub-ink">{plan.title}</h3>
              </div>

              <p className="text-[13px] text-pub-muted leading-relaxed mb-5">{plan.desc}</p>

              {plan.price !== null ? (
                <>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-[42px] font-extrabold text-pub-ink leading-none tracking-tight">{plan.price} €</span>
                    <span className="text-[13px] text-pub-muted mb-1.5">IVA incl.</span>
                  </div>
                  <p className="text-[12px] text-pub-muted mb-6">{plan.sqmNote}</p>
                </>
              ) : (
                <>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-[42px] font-extrabold text-pub-ink leading-none tracking-tight">A medida</span>
                  </div>
                  <p className="text-[12px] text-pub-muted mb-6">{plan.sqmNote}</p>
                </>
              )}

              <div className="space-y-0.5 mb-7 flex-1">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-[10px] text-[13.5px] text-pub-ink py-[7px]">
                    <svg className="w-4 h-4 text-pub-primary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {f}
                  </div>
                ))}
              </div>

              {plan.primary ? (
                <BtnPrimary className="w-full mt-auto" onClick={() => navigate(plan.href)}>
                  {plan.cta}
                </BtnPrimary>
              ) : (
                <BtnGhost className="w-full mt-auto" onClick={() => navigate(plan.href)}>
                  {plan.cta}
                </BtnGhost>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-[12.5px] text-pub-muted mt-7 flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-pub-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Sin pago hasta confirmar la visita · cancela gratis hasta 24 h antes
        </p>
      </section>

      {/* ── Add-ons ── */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
          <div className="text-center mb-10">
            <h2 className="text-[1.7rem] sm:text-[2rem] font-extrabold text-pub-ink tracking-tight">Servicios opcionales</h2>
            <p className="text-[15px] text-pub-muted mt-2">Añádelos en el momento de la solicitud si los necesitas</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {addons.map(a => (
              <div key={a.title} className="border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.iconBg}`}>
                    {a.icon}
                  </span>
                  <span className="text-lg font-extrabold text-pub-ink">{a.price}</span>
                </div>
                <p className="text-sm font-semibold text-pub-ink">{a.title}</p>
                <p className="text-[12.5px] text-pub-muted mt-1 leading-relaxed">{a.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="max-w-3xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <h2 className="text-[1.7rem] sm:text-[2rem] font-extrabold text-pub-ink tracking-tight text-center mb-8">
          Preguntas frecuentes
        </h2>
        <div>
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-pub-border-soft">
              <button
                className="w-full py-5 text-left flex items-center justify-between gap-4 font-semibold text-[15.5px] text-pub-ink cursor-pointer"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {faq.q}
                <svg
                  className={`w-5 h-5 text-pub-muted flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {openFaq === i && (
                <p className="pb-5 text-[14px] text-pub-muted leading-relaxed max-w-[62ch]">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14 sm:py-16 text-center">
          <h2 className="text-[1.7rem] sm:text-[2.1rem] font-extrabold text-pub-ink tracking-tight">¿Listo para empezar?</h2>
          <p className="text-[15px] text-pub-muted mt-3 max-w-md mx-auto">
            Solicita tu certificado en menos de un minuto. Sin compromiso y con precio cerrado.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-7">
            <BtnPrimary onClick={() => navigate("/solicitud-cee")}>
              Solicitar mi certificado <ArrowRight />
            </BtnPrimary>
            <BtnGhost>Hablar con nosotros</BtnGhost>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}
