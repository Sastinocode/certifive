/**
 * SolicitudConfirmacion — Pago exitoso.
 * Muestra check animado, nº de pedido, próximos pasos y enlace a seguimiento.
 */
import { useLocation } from "wouter";
import { PublicLayout } from "@/components/public/PublicLayout";
import { BtnPrimary, BtnGhost, ArrowRight } from "@/components/public/PublicButton";
import { Pill } from "@/components/public/Pill";
import { SumRow } from "@/components/public/SumRow";

const TIPO_LABEL: Record<string, string> = {
  vivienda: "Vivienda", local: "Local comercial", oficina: "Oficina",
};

const PASOS = [
  {
    done: true, current: false,
    label: "Solicitud y pago confirmados",
    sub: () => `Hoy · ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`,
  },
  {
    done: false, current: true,
    label: "Te llamamos para cerrar la visita",
    sub: () => "En menos de 2 h · de 9:00 a 20:00",
  },
  {
    done: false, current: false,
    label: "Visita técnica en tu inmueble",
    sub: () => "45 min · un técnico colegiado toma los datos",
  },
  {
    done: false, current: false,
    label: "Recibes el certificado en PDF",
    sub: () => "2-5 días · registrado oficialmente en la CCAA",
  },
];

export default function SolicitudConfirmacion() {
  const [, navigate] = useLocation();
  const datos = JSON.parse(sessionStorage.getItem("solicitud_cee") ?? "{}");

  const base     = datos.tipo === "local" || datos.tipo === "oficina" ? 169 : 129;
  const registro = datos.tipo === "edificio" ? 0 : 14;
  const total    = base;
  const cert     = base - registro; // cert portion for line-item display (115 for vivienda)
  const descuento = 20;
  const tipoNombre = (TIPO_LABEL[datos.tipo] ?? "Vivienda").toLowerCase();

  const numeroPedido: string =
    datos.numeroPedido ??
    `CTF-2026-${Math.floor(Math.random() * 90000 + 10000)}`;

  return (
    <PublicLayout variant="success">
      {/* Hero éxito */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 pt-14 sm:pt-16 pb-12 text-center">

          {/* Check animado */}
          <div className="relative inline-flex items-center justify-center mb-6">
            {/* One-shot ripple ring */}
            <span
              className="absolute inset-0 rounded-full bg-pub-primary/30"
              style={{ animation: "ring-pulse 1.4s .3s ease-out forwards" }}
            />
            {/* Circle + tick */}
            <span className="relative w-[72px] h-[72px] rounded-full bg-pub-primary flex items-center justify-center shadow-lg shadow-pub-primary/30 animate-pop">
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline
                  points="20 6 9 17 4 12"
                  strokeDasharray="30"
                  strokeDashoffset="30"
                  style={{ animation: "draw .4s .35s ease-out forwards" }}
                />
              </svg>
            </span>
          </div>

          <h1 className="text-[2rem] sm:text-[2.5rem] font-extrabold text-pub-ink leading-[1.05] tracking-tight">
            ¡Solicitud confirmada!
          </h1>
          <p className="text-[15px] sm:text-base text-pub-muted mt-4 max-w-md mx-auto leading-relaxed">
            Hemos recibido tu solicitud y enviado la confirmación a{" "}
            <strong className="text-pub-ink">{datos.email ?? "tu email"}</strong>.
            Te llamaremos en menos de 2 horas para cerrar la fecha de la visita.
          </p>

          {/* Pedido + importe — fila de texto plana */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6">
            <p className="text-[13px] text-pub-muted">
              Pedido <span className="font-bold text-pub-ink">{numeroPedido}</span>
            </p>
            <span className="hidden sm:block w-1 h-1 rounded-full bg-gray-300" />
            <p className="text-[13px] text-pub-muted">
              Importe pagado <span className="font-bold text-pub-ink">{total} €</span>
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-5 sm:px-8 py-10 sm:py-14 space-y-6">

        {/* Visita técnica */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8 animate-reveal">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <span className="w-12 h-12 rounded-2xl bg-pub-primary-soft text-pub-primary flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </span>
              <div>
                <p className="text-[11px] font-bold tracking-wider uppercase text-pub-muted">
                  Visita técnica · pendiente de confirmar
                </p>
                <p className="text-lg font-bold text-pub-ink mt-1">Fecha a confirmar · próximos días</p>
                <p className="text-[13px] text-pub-muted mt-1">
                  {datos.direccion
                    ? `${datos.direccion} · ${datos.ciudad ?? ""}`
                    : (datos.ciudad ?? "Dirección del inmueble")}
                </p>
              </div>
            </div>
            <Pill variant="amber">Por confirmar</Pill>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-100">
            <BtnGhost className="flex-1 !h-[46px]" type="button">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Añadir al calendario
            </BtnGhost>
            <BtnGhost className="flex-1 !h-[46px]" type="button">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
              </svg>
              Reprogramar
            </BtnGhost>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8 animate-reveal">
          <h2 className="text-base font-bold text-pub-ink mb-6">¿Qué pasa ahora?</h2>
          <div className="relative pl-[34px]">
            {/* Vertical line */}
            <div className="absolute left-[13px] top-[6px] bottom-[6px] w-[2px] bg-pub-border" />
            {PASOS.map((s, i) => (
              <div key={i} className={`relative ${i < PASOS.length - 1 ? "pb-[22px]" : ""}`}>
                {/* Node */}
                <span className={[
                  "absolute left-[-34px] top-0 w-[28px] h-[28px] rounded-full flex items-center justify-center bg-white border-[1.5px]",
                  s.done    ? "bg-pub-primary border-pub-primary text-white" :
                  s.current ? "bg-pub-primary-soft border-pub-primary text-pub-primary shadow-[0_0_0_4px_hsl(142_69%_36%/0.1)]" :
                               "border-pub-border text-pub-muted",
                ].join(" ")}>
                  {s.done ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : s.current ? (
                    <span className="w-2 h-2 rounded-full bg-pub-primary" />
                  ) : (
                    <span className="text-[11px] font-bold">{i + 1}</span>
                  )}
                </span>
                <p className="text-sm font-semibold text-pub-ink">{s.label}</p>
                <p className="text-[12.5px] text-pub-muted mt-0.5">{s.sub()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen del pedido */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8 animate-reveal">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-pub-ink">Resumen del pedido</h2>
            <button
              type="button"
              className="text-[12px] font-semibold text-pub-primary hover:underline inline-flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Descargar resguardo
            </button>
          </div>
          <SumRow
            label={<>Certificado {tipoNombre}{datos.m2 ? ` · ${datos.m2} m²` : ""}</>}
            value={`${cert} €`}
          />
          <SumRow label="Registro + tasa CCAA" value={`${registro} €`} />
          <SumRow
            label={<span className="text-pub-primary font-semibold">Descuento web</span>}
            value={<span className="text-pub-primary">−{descuento} €</span>}
          />
          <div className="flex items-center justify-between pt-4 mt-1 border-t border-gray-100">
            <span className="text-sm font-semibold text-pub-ink">Total pagado</span>
            <span className="text-lg font-extrabold text-pub-ink">{total} €</span>
          </div>
        </div>

        {/* Ayuda */}
        <div className="rounded-3xl p-6 sm:p-7 border border-emerald-100 bg-emerald-50/50 animate-reveal flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex gap-3.5">
            <span className="w-11 h-11 rounded-2xl bg-white text-pub-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
              </svg>
            </span>
            <div>
              <p className="text-sm font-bold text-pub-ink">¿Necesitas cambiar algo?</p>
              <p className="text-[13px] text-pub-muted mt-0.5">
                Escríbenos por WhatsApp al 654 78 32 19 o responde al email de confirmación.
              </p>
            </div>
          </div>
          <BtnPrimary
            className="whitespace-nowrap !h-[46px] !text-sm"
            onClick={() => window.open("https://wa.me/34654783219", "_blank")}
          >
            Abrir WhatsApp
          </BtnPrimary>
        </div>

        {/* CTA seguimiento */}
        <div className="text-center pt-2">
          <button
            onClick={() => navigate("/solicitud-cee/seguimiento")}
            className="text-sm font-semibold text-pub-primary hover:underline inline-flex items-center gap-1.5"
          >
            Seguir el estado de mi pedido
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </PublicLayout>
  );
}
