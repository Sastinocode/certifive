/**
 * SolicitudTecnico — Paso 2: datos técnicos del inmueble.
 * Dirección, características, instalaciones y documentación.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Stepper } from "@/components/public/Stepper";
import { ChoiceSmall } from "@/components/public/ChoiceCard";
import { PublicInput, PublicSelect, PublicTextarea, FieldLabel } from "@/components/public/PublicInput";
import { SumRow } from "@/components/public/SumRow";
import { BtnPrimary, BtnGhost, ArrowRight, ArrowLeft } from "@/components/public/PublicButton";
import { useToast } from "@/hooks/use-toast";

type Situacion  = "medianeras" | "esquina" | "atico" | "bajo";
type Orientacion = "norte" | "sur" | "este" | "oeste";

const situaciones: { id: Situacion; label: string }[] = [
  { id: "medianeras", label: "Entre medianeras" },
  { id: "esquina",    label: "Esquina" },
  { id: "atico",      label: "Ático" },
  { id: "bajo",       label: "Bajo" },
];

const orientaciones: { id: Orientacion; label: string }[] = [
  { id: "norte", label: "Norte" },
  { id: "sur",   label: "Sur" },
  { id: "este",  label: "Este" },
  { id: "oeste", label: "Oeste" },
];

const mejoras = [
  "Placas solares fotovoltaicas",
  "Aislamiento en fachada (SATE)",
  "Iluminación LED en toda la vivienda",
  "Aerotermia",
];

function TrustIco({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-7 h-7 rounded-lg bg-[hsl(142_60%_95%)] text-[hsl(142_60%_30%)] flex items-center justify-center flex-shrink-0">
      {children}
    </span>
  );
}

export default function SolicitudTecnico() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Dirección
  const [direccion,  setDireccion]  = useState("");
  const [cp,         setCp]         = useState("");
  const [municipio,  setMunicipio]  = useState("");
  const [catastral,  setCatastral]  = useState("");

  // Características
  const [anyo,        setAnyo]        = useState("");
  const [superficie,  setSuperficie]  = useState("");
  const [planta,      setPlanta]      = useState("");
  const [situacion,   setSituacion]   = useState<Situacion>("medianeras");
  const [orientacion, setOrientacion] = useState<Orientacion>("sur");

  // Instalaciones
  const [calefaccion,   setCalefaccion]   = useState("");
  const [acs,           setAcs]           = useState("");
  const [refrigeracion, setRefrigeracion] = useState("");
  const [ventanas,      setVentanas]      = useState("");
  const [mejorasActivas, setMejorasActivas] = useState<string[]>([]);

  // Docs
  const [notas, setNotas] = useState("");

  const toggleMejora = (m: string) =>
    setMejorasActivas(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!direccion.trim() || !cp.trim()) {
      toast({ title: "La dirección y el CP son obligatorios", variant: "destructive" });
      return;
    }
    const prev = JSON.parse(sessionStorage.getItem("solicitud_cee") ?? "{}");
    sessionStorage.setItem("solicitud_cee", JSON.stringify({
      ...prev,
      direccion, cp, municipio, catastral,
      anyo, superficie, planta, situacion, orientacion,
      calefaccion, acs, refrigeracion, ventanas, mejoras: mejorasActivas, notas,
    }));
    navigate("/solicitud-cee/presupuesto");
  };

  return (
    <PublicLayout backHref="/solicitud-cee">
      <Stepper current={2} />

      {/* Hero — left-aligned, no text-center */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-10 sm:pt-12 pb-8">
          <p className="text-[11px] font-bold tracking-wider uppercase text-pub-primary">Paso 2 de 4</p>
          <h1 className="text-[1.9rem] sm:text-[2.3rem] font-extrabold text-pub-ink mt-2 leading-[1.05] tracking-tight">
            Datos técnicos del inmueble
          </h1>
          <p className="text-[15px] text-pub-muted mt-3 max-w-2xl leading-relaxed">
            Cuanto más completo, más preciso será el certificado y antes podremos cerrarlo. Si no conoces algún dato, déjalo en blanco — el técnico lo verificará en la visita.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 lg:gap-12 items-start">

          <form onSubmit={handleSubmit} className="space-y-6 animate-reveal">

            {/* ── Dirección ── */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2.5">
                <TrustIco>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </TrustIco>
                <h2 className="text-base font-bold text-pub-ink">Dirección del inmueble</h2>
              </div>
              <PublicInput
                id="direccion"
                label="Dirección completa"
                placeholder="Calle, número, piso y puerta"
                value={direccion}
                onChange={e => setDireccion(e.target.value)}
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <PublicInput
                  id="cp"
                  label="C. Postal"
                  placeholder="28013"
                  value={cp}
                  onChange={e => setCp(e.target.value)}
                  required
                />
                <PublicInput
                  id="municipio"
                  label="Municipio"
                  placeholder="Madrid"
                  value={municipio}
                  onChange={e => setMunicipio(e.target.value)}
                />
                <PublicInput
                  id="catastral"
                  label="Ref. catastral"
                  optional
                  placeholder="20 dígitos"
                  value={catastral}
                  onChange={e => setCatastral(e.target.value)}
                />
              </div>
            </div>

            {/* ── Características ── */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2.5">
                <TrustIco>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </TrustIco>
                <h2 className="text-base font-bold text-pub-ink">Características generales</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <PublicInput
                  id="anyo"
                  label="Año de construcción"
                  type="number"
                  placeholder="Ej. 1998"
                  value={anyo}
                  onChange={e => setAnyo(e.target.value)}
                />
                <PublicInput
                  id="superficie"
                  label="Superficie útil"
                  type="number"
                  placeholder="0"
                  suffix="m²"
                  value={superficie}
                  onChange={e => setSuperficie(e.target.value)}
                />
                <PublicSelect
                  id="planta"
                  label="Planta"
                  value={planta}
                  onChange={e => setPlanta(e.target.value)}
                >
                  <option value="bajo">Bajo</option>
                  <option value="1a_3a">1ª – 3ª</option>
                  <option value="4a_7a">4ª – 7ª</option>
                  <option value="8_sup">8ª o superior</option>
                  <option value="unifamiliar">Unifamiliar</option>
                </PublicSelect>
              </div>
              <div>
                <FieldLabel>¿Cómo está situada la vivienda?</FieldLabel>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {situaciones.map(s => (
                    <ChoiceSmall
                      key={s.id}
                      selected={situacion === s.id}
                      onClick={() => setSituacion(s.id)}
                      label={s.label}
                    />
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel optional>Orientación principal</FieldLabel>
                <div className="grid grid-cols-4 gap-2.5">
                  {orientaciones.map(o => (
                    <ChoiceSmall
                      key={o.id}
                      selected={orientacion === o.id}
                      onClick={() => setOrientacion(o.id)}
                      label={o.label}
                      className="justify-center"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Instalaciones ── */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2.5">
                <TrustIco>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9z"/>
                  </svg>
                </TrustIco>
                <h2 className="text-base font-bold text-pub-ink">Instalaciones</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PublicSelect id="calefaccion" label="Sistema de calefacción" value={calefaccion} onChange={e => setCalefaccion(e.target.value)}>
                  <option value="">Caldera de gas natural</option>
                  <option value="gasoleo">Caldera de gasóleo</option>
                  <option value="bomba_calor">Bomba de calor</option>
                  <option value="electrico">Radiadores eléctricos</option>
                  <option value="sin">Sin calefacción</option>
                </PublicSelect>
                <PublicSelect id="acs" label="Agua caliente (ACS)" value={acs} onChange={e => setAcs(e.target.value)}>
                  <option value="">Misma caldera</option>
                  <option value="termo">Termo eléctrico</option>
                  <option value="solar">Solar térmica</option>
                  <option value="calentador">Calentador de gas</option>
                </PublicSelect>
                <PublicSelect id="refrigeracion" label="Refrigeración" value={refrigeracion} onChange={e => setRefrigeracion(e.target.value)}>
                  <option value="">Aire acondicionado (split)</option>
                  <option value="bomba_calor">Bomba de calor</option>
                  <option value="sin">Sin refrigeración</option>
                </PublicSelect>
                <PublicSelect id="ventanas" label="Tipo de ventanas" value={ventanas} onChange={e => setVentanas(e.target.value)}>
                  <option value="simple">Simple, marco metálico</option>
                  <option value="doble">Doble (climalit), aluminio</option>
                  <option value="doble_rpt">Doble, PVC/madera con RPT</option>
                  <option value="triple">Triple acristalamiento</option>
                </PublicSelect>
              </div>
              <div>
                <FieldLabel>
                  Mejoras de eficiencia ya instaladas{" "}
                  <span className="text-[#8a939e] font-medium ml-0.5">(marca las que apliquen)</span>
                </FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {mejoras.map(m => (
                    <label
                      key={m}
                      className="flex items-center gap-2.5 min-h-[48px] px-[14px] py-3 border-[1.5px] border-pub-border rounded-[12px] bg-white text-[14.5px] text-pub-ink cursor-pointer hover:border-[#cdd1d8] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={mejorasActivas.includes(m)}
                        onChange={() => toggleMejora(m)}
                        className="w-[18px] h-[18px] flex-shrink-0 cursor-pointer accent-pub-primary"
                      />
                      {m}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Documentación ── */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2.5">
                <TrustIco>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </TrustIco>
                <h2 className="text-base font-bold text-pub-ink">
                  Documentación <span className="text-pub-muted font-medium text-sm">· opcional</span>
                </h2>
              </div>
              <p className="text-[13px] text-pub-muted -mt-2">
                Si tienes a mano la nota simple, planos o facturas, adjúntalos y agilizamos el certificado.
              </p>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl py-9 cursor-pointer hover:border-pub-primary/50 hover:bg-emerald-50/30 transition">
                <span className="w-11 h-11 rounded-full bg-emerald-50 text-pub-primary flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </span>
                <p className="text-sm font-semibold text-pub-ink">
                  Arrastra archivos o <span className="text-pub-primary">examina</span>
                </p>
                <p className="text-[12px] text-pub-muted">PDF, JPG o PNG · hasta 10 MB</p>
                <input type="file" className="hidden" multiple />
              </label>
              <PublicTextarea
                id="notas"
                label="Notas para el técnico"
                optional
                placeholder="Por ejemplo: el portero tiene una copia de llaves; hay obra reciente en la cocina…"
                value={notas}
                onChange={e => setNotas(e.target.value)}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <BtnGhost type="button" onClick={() => navigate("/solicitud-cee")}>
                <ArrowLeft className="w-4 h-4" /> Atrás
              </BtnGhost>
              <BtnPrimary type="submit">
                Ver mi presupuesto <ArrowRight />
              </BtnPrimary>
            </div>
          </form>

          {/* ── Rail ── */}
          <aside className="space-y-6 lg:sticky lg:top-24 self-start">
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-[10px] font-bold tracking-wider uppercase text-pub-muted mb-3">Tu solicitud</p>
              {(() => {
                const datos = JSON.parse(sessionStorage.getItem("solicitud_cee") ?? "{}");
                return (
                  <>
                    {datos.tipo      && <SumRow label="Tipo"       value={<span className="capitalize">{datos.tipo}</span>} />}
                    {datos.ciudad    && <SumRow label="Ubicación"  value={datos.ciudad} />}
                    {datos.m2        && <SumRow label="Superficie" value={`${datos.m2} m²`} />}
                    {datos.finalidad && <SumRow label="Finalidad"  value={<span className="capitalize">{datos.finalidad}</span>} />}
                  </>
                );
              })()}
            </div>
            <div className="rounded-2xl p-5 border border-emerald-100 bg-emerald-50/50">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-pub-primary mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <p className="text-[12.5px] text-pub-ink leading-relaxed">
                  No te preocupes si no sabes algún dato técnico.{" "}
                  <span className="text-pub-muted">El técnico lo medirá y verificará en la visita.</span>
                </p>
              </div>
            </div>
          </aside>

        </div>
      </section>
    </PublicLayout>
  );
}
