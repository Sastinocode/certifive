/**
 * SolicitudSeguimiento — Estado en vivo del pedido.
 * Barra de progreso, timeline detallado, descarga del PDF (cuando esté listo).
 */
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Pill } from "@/components/public/Pill";
import { EnergyRating } from "@/components/public/EnergyRating";

interface TimelineStep {
  done:    boolean;
  current: boolean;
  pending: boolean;
  label:   string;
  sub:     string;
  badge:   string | null;
  detail:  string | null;
}

interface SeguimientoData {
  paso:         number;
  totalPasos:   number;
  progreso:     number;
  estado:       string;
  subtitulo:    string;
  entrega:      string;
  numero:       string;
  inmueble:     string;
  direccion:    string;
  ciudad:       string;
  finalidad:    string;
  calificacion: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  pdfUrl:       string | null;
  total:        number;
  timeline:     TimelineStep[];
}

const PROGRESS_LABELS = ["Solicitud", "Visita", "Redacción", "Registro"] as const;

export default function SolicitudSeguimiento() {
  const token = new URLSearchParams(window.location.search).get("token");

  const { data, isLoading, isError } = useQuery<SeguimientoData>({
    queryKey:  ["seguimiento", token],
    queryFn:   () =>
      fetch(`/api/solicitudes/seguimiento/${token}`).then(r => {
        if (!r.ok) throw new Error("Error al cargar el pedido");
        return r.json();
      }),
    enabled:   !!token,
    staleTime: 60_000,
  });

  if (!token || isError) {
    return (
      <PublicLayout variant="tracking">
        <section className="max-w-2xl mx-auto px-5 sm:px-8 py-20 text-center">
          <p className="text-pub-muted text-sm">
            {isError ? "No se pudo cargar el estado del pedido." : "Enlace de seguimiento no válido."}
          </p>
        </section>
      </PublicLayout>
    );
  }

  if (isLoading || !data) {
    return (
      <PublicLayout variant="tracking">
        <section className="max-w-2xl mx-auto px-5 sm:px-8 py-20 text-center">
          <p className="text-pub-muted text-sm animate-pulse">Cargando estado del pedido…</p>
        </section>
      </PublicLayout>
    );
  }

  const pdfListo = !!data.pdfUrl;

  return (
    <PublicLayout variant="tracking">
      {/* Hero estado */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 sm:pt-12 pb-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-[11px] font-bold tracking-wider uppercase text-pub-muted">
                Pedido {data.numero}
              </p>
              <h1 className="text-[1.9rem] sm:text-[2.3rem] font-extrabold text-pub-ink mt-2 leading-[1.05] tracking-tight">
                {data.estado}
              </h1>
              <p className="text-[15px] text-pub-muted mt-3 max-w-xl leading-relaxed">
                {data.subtitulo}
              </p>
            </div>
            <div className="text-right">
              <Pill variant="green">Paso {data.paso} de {data.totalPasos}</Pill>
              <p className="text-[12.5px] text-pub-muted mt-3">Entrega estimada</p>
              <p className="text-base font-bold text-pub-ink">{data.entrega}</p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mt-7">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-pub-primary transition-all duration-700"
                style={{ width: `${data.progreso}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[11px] font-medium text-pub-muted">
              {PROGRESS_LABELS.map((label, i) => (
                <span
                  key={label}
                  className={i + 1 === data.paso ? "text-pub-primary font-bold" : ""}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

          {/* Timeline */}
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-9 animate-reveal">
            <h2 className="text-base font-bold text-pub-ink mb-7">Estado detallado</h2>
            <div className="relative pl-[42px]">
              {/* Vertical background line */}
              <div className="absolute left-[17px] top-[8px] bottom-[8px] w-[2px] bg-pub-border" />
              {/* Green fill up to current step */}
              <div
                className="absolute left-[17px] top-[8px] w-[2px] bg-pub-primary rounded-sm"
                style={{ height: "calc(50% - 8px)" }}
              />

              {data.timeline.map((step, i) => (
                <div key={i} className={`relative ${i < data.timeline.length - 1 ? "pb-[30px]" : ""}`}>
                  {/* Node */}
                  <span className={[
                    "absolute left-[-42px] top-[-2px] w-9 h-9 rounded-full flex items-center justify-center z-10",
                    step.done    ? "bg-pub-primary border-[1.5px] border-pub-primary text-white" :
                    step.current ? "bg-pub-primary-soft border-[1.5px] border-pub-primary text-pub-primary shadow-[0_0_0_5px_hsl(142_69%_36%/0.1)]" :
                                   "bg-white border-[1.5px] border-pub-border text-pub-muted",
                  ].join(" ")}>
                    {/* Ping ring for current */}
                    {step.current && (
                      <span className="absolute inset-[-1.5px] rounded-full border-2 border-pub-primary animate-ring-pulse" />
                    )}
                    {step.done ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : step.current ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-pub-primary" />
                    ) : (
                      <span className="text-[12px] font-bold">{i + 1}</span>
                    )}
                  </span>

                  {/* Content */}
                  <p className={`text-sm font-bold ${step.pending ? "text-[#94a3b8]" : "text-pub-ink"}`}>
                    {step.label}
                  </p>
                  <p className="text-[12.5px] text-pub-muted mt-1">{step.sub}</p>

                  {/* Badge (step 2) */}
                  {step.badge && (
                    <div className="mt-2.5 inline-flex items-center gap-2 text-[12px] text-pub-muted bg-slate-50 rounded-lg px-3 py-1.5">
                      <svg className="w-3.5 h-3.5 text-pub-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {step.badge}
                    </div>
                  )}

                  {/* Detail box (current step) */}
                  {step.detail && (
                    <p className="text-[12.5px] text-pub-muted mt-2 leading-relaxed bg-emerald-50/60 border border-emerald-100 rounded-xl px-3.5 py-2.5">
                      {step.detail}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Aside */}
          <aside className="space-y-5 lg:sticky lg:top-24 self-start">

            {/* Inmueble */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-[10px] font-bold tracking-wider uppercase text-pub-muted mb-3">Inmueble</p>
              <div className="flex gap-3">
                <span className="w-10 h-10 rounded-xl bg-pub-primary-soft text-pub-primary flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-pub-ink leading-tight">{data.inmueble}</p>
                  <p className="text-[12px] text-pub-muted mt-0.5">
                    {data.direccion}<br />{data.ciudad}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-pub-border-soft text-[12.5px]">
                <span className="text-pub-muted">Finalidad</span>
                <span className="font-semibold text-pub-ink">{data.finalidad}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-pub-border-soft text-[12.5px]">
                <span className="text-pub-muted">Calificación est.</span>
                <EnergyRating rating={data.calificacion} size="sm" />
              </div>
            </div>

            {/* Tu certificado */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-[10px] font-bold tracking-wider uppercase text-pub-muted mb-3">Tu certificado</p>
              {pdfListo ? (
                <a href={data.pdfUrl!} className="flex items-center gap-2.5 text-pub-primary font-semibold text-sm hover:underline">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Descargar PDF
                </a>
              ) : (
                <>
                  <button
                    disabled
                    className="w-full flex items-center gap-3 text-left border border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-not-allowed opacity-70"
                  >
                    <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-pub-ink">Certificado PDF</p>
                      <p className="text-[11px] text-pub-muted">Disponible al finalizar</p>
                    </div>
                  </button>
                  <p className="text-[11.5px] text-pub-muted mt-3 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-pub-primary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Te enviaremos un email al estar listo
                  </p>
                </>
              )}
            </div>

            {/* Ayuda */}
            <div className="rounded-2xl p-5 border border-emerald-100 bg-emerald-50/50">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-pub-primary mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                </svg>
                <div>
                  <p className="text-[13px] font-bold text-pub-ink">¿Alguna duda?</p>
                  <p className="text-[12px] text-pub-muted mt-0.5 leading-relaxed">
                    Escríbenos por WhatsApp y te respondemos al momento.
                  </p>
                  <a
                    href="https://wa.me/34654783219"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12.5px] font-semibold text-pub-primary hover:underline mt-2 inline-block"
                  >
                    Abrir WhatsApp →
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}
