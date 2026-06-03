/**
 * SolicitudPresupuesto — Paso 3: presupuesto cerrado.
 * Muestra el desglose de precios y permite aceptar para ir al pago.
 */
import { useMemo } from "react";
import { useLocation } from "wouter";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Stepper } from "@/components/public/Stepper";
import { BtnPrimary, BtnGhost, ArrowRight, ArrowLeft } from "@/components/public/PublicButton";
import { Pill } from "@/components/public/Pill";
import { SumRow, LineItem } from "@/components/public/SumRow";
import { EnergyRatingRow } from "@/components/public/EnergyRating";

function calcularPrecio(tipo: string): { base: number; registro: number; total: number; sinDto: number } {
  const total    = tipo === "local" || tipo === "oficina" ? 169 : 129;
  const registro = tipo === "edificio" ? 0 : 14;
  const base     = total - registro; // cert portion for line-item display (115 for vivienda)
  return { base, registro, total, sinDto: total + 20 };
}

const TIPO_LABEL: Record<string, string> = {
  vivienda: "Vivienda / Piso", local: "Local comercial", oficina: "Oficina / Terciario",
};
const FINALIDAD_LABEL: Record<string, string> = {
  vender: "Venta", alquilar: "Alquiler", tramite: "Trámite administrativo",
};

const LINE_ITEMS = [
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    title: "Visita técnica + toma de datos",
    sub: "Técnico colegiado · 45 min · cuando te encaje",
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    title: "Certificado oficial en PDF",
    sub: "Etiqueta energética + informe completo",
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6L9 17l-5-5"/></svg>,
    title: "Registro oficial en la CCAA",
    sub: "Tramitamos el registro y tasa autonómica",
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    title: "Recomendaciones de mejora",
    sub: "Medidas para subir tu calificación",
  },
];

const TRUST_ITEMS = [
  {
    icon: <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>,
    text: "Garantía de aceptación oficial",
  },
  {
    icon: <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    text: "Pago seguro · no se cobra hasta la visita",
  },
];

export default function SolicitudPresupuesto() {
  const [, navigate] = useLocation();
  const datos = JSON.parse(sessionStorage.getItem("solicitud_cee") ?? "{}");
  const { base, registro, total, sinDto } = calcularPrecio(datos.tipo ?? "vivienda");

  const quoteNum = useMemo(
    () => `CTF-2026-${Math.floor(Math.random() * 90000 + 10000)}`,
    [],
  );
  const fechaHoy = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  const tipoNombre = (TIPO_LABEL[datos.tipo] ?? datos.tipo ?? "Vivienda").toLowerCase();

  return (
    <PublicLayout backHref="/solicitud-cee/tecnico">
      <Stepper current={3} />

      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 sm:pt-12 pb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-wider uppercase text-pub-primary">Paso 3 de 4</p>
              <h1 className="text-[1.9rem] sm:text-[2.3rem] font-extrabold text-pub-ink mt-2 leading-[1.05] tracking-tight">
                Tu presupuesto está listo
              </h1>
              <p className="text-[15px] text-pub-muted mt-3 max-w-xl leading-relaxed">
                Precio cerrado, sin sorpresas. Revísalo y confirma para agendar la visita técnica.
              </p>
            </div>
            <Pill variant="amber">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Válido 14 días
            </Pill>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-8 items-start">

          {/* Detalle */}
          <div className="space-y-6">

            {/* Quote header */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8 animate-reveal">
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-gray-100">
                <div>
                  <p className="text-[10px] font-bold tracking-wider uppercase text-pub-muted">Presupuesto</p>
                  <p className="text-lg font-bold text-pub-ink mt-1">Nº {quoteNum}</p>
                  <p className="text-[12.5px] text-pub-muted mt-1">
                    Emitido el {fechaHoy}{datos.nombre ? ` · a nombre de ${datos.nombre}` : ""}
                  </p>
                </div>
                <Pill variant="green">Recomendado</Pill>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
                {[
                  ["Inmueble",   TIPO_LABEL[datos.tipo]        ?? datos.tipo        ?? "—"],
                  ["Superficie", datos.m2 ? `${datos.m2} m²`  : "—"],
                  ["Ubicación",  datos.ciudad                  ?? "—"],
                  ["Finalidad",  FINALIDAD_LABEL[datos.finalidad] ?? datos.finalidad ?? "—"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[11px] text-pub-muted">{k}</p>
                    <p className="text-sm font-semibold text-pub-ink mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Qué incluye */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8 animate-reveal">
              <h2 className="text-base font-bold text-pub-ink mb-5">Qué incluye</h2>
              {LINE_ITEMS.map(item => (
                <LineItem
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  subtitle={item.sub}
                  badge={<span className="text-sm font-semibold text-pub-ink whitespace-nowrap">incluido</span>}
                />
              ))}
            </div>

            {/* Calificación estimada */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8 animate-reveal">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-pub-ink">Calificación estimada</h2>
                  <p className="text-[12.5px] text-pub-muted mt-1">Según los datos aportados. El certificado final la confirma.</p>
                </div>
                <EnergyRatingRow highlight="C" />
              </div>
            </div>
          </div>

          {/* Resumen sticky */}
          <aside className="lg:sticky lg:top-24 self-start space-y-5">
            <div className="bg-white border border-pub-border rounded-3xl shadow-sm p-6">
              <p className="text-[10px] font-bold tracking-wider uppercase text-pub-muted mb-4">Resumen</p>
              <SumRow
                label={<>Certificado {tipoNombre} · {datos.m2 ?? 80} m²</>}
                value={`${base} €`}
              />
              <SumRow label="Registro + tasa CCAA" value={`${registro} €`} />
              <SumRow
                label={<>Tramitación urgente <span className="text-pub-muted">(opcional)</span></>}
                value="—"
                muted
              />

              <div className="flex items-end justify-between pt-5 mt-2 border-t border-pub-border">
                <div>
                  <p className="text-[12px] text-pub-muted">Total <span className="text-[10px]">(IVA incl.)</span></p>
                  <p className="text-[33px] font-extrabold text-pub-ink leading-none tracking-tight mt-1">{total} €</p>
                </div>
                <p className="text-[12px] text-pub-muted line-through mb-1">{sinDto} €</p>
              </div>

              <BtnPrimary className="w-full mt-5" onClick={() => navigate("/solicitud-cee/pago")}>
                Aceptar y pagar <ArrowRight />
              </BtnPrimary>
              <BtnGhost className="w-full mt-3" onClick={() => navigate("/solicitud-cee/tecnico")}>
                <ArrowLeft className="w-4 h-4" /> Revisar datos
              </BtnGhost>

              <div className="mt-5 space-y-2.5">
                {TRUST_ITEMS.map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-[12px] text-pub-muted">
                    <span className="w-5 h-5 rounded-full bg-pub-primary-soft text-pub-primary flex items-center justify-center flex-shrink-0">
                      {icon}
                    </span>
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3 h-3 text-amber-500 fill-current" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
                  </svg>
                ))}
              </div>
              <p className="text-[13px] text-pub-ink leading-snug">"Precio cerrado desde el principio y sin letra pequeña. Justo lo que pagué."</p>
              <p className="text-[11px] text-pub-muted mt-2">Carlos R. · Madrid</p>
            </div>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}
