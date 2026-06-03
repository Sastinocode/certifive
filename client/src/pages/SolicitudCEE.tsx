/**
 * SolicitudCEE — Paso 1 del flujo público de captación.
 * Recoge nombre, email, teléfono, tipo de inmueble, ciudad, m² y finalidad.
 * Guarda el lead en la DB y redirige al paso 2 (datos técnicos).
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Stepper } from "@/components/public/Stepper";
import { ChoiceCard, ChoiceSmall } from "@/components/public/ChoiceCard";
import { PublicInput, PublicCheckbox, FieldLabel } from "@/components/public/PublicInput";
import { BtnPrimary, BtnGhost, ArrowRight } from "@/components/public/PublicButton";
import { StepNum } from "@/components/public/StepNum";
import { useToast } from "@/hooks/use-toast";

type InmuebleTipo = "vivienda" | "local" | "oficina";
type Finalidad   = "vender" | "alquilar" | "tramite";

const tiposInmueble: { id: InmuebleTipo; icon: React.ReactNode; title: string; subtitle: string }[] = [
  {
    id: "vivienda",
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    title: "Vivienda",
    subtitle: "Piso, casa, chalet",
  },
  {
    id: "local",
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="14" rx="1"/><path d="M3 10h18"/></svg>,
    title: "Local",
    subtitle: "Comercial",
  },
  {
    id: "oficina",
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="1"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="13" y2="14"/></svg>,
    title: "Oficina",
    subtitle: "Terciario",
  },
];

const finalidades: { id: Finalidad; label: string }[] = [
  { id: "vender",    label: "Vender" },
  { id: "alquilar",  label: "Alquilar" },
  { id: "tramite",   label: "Trámite" },
];

export default function SolicitudCEE() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [nombre,    setNombre]    = useState("");
  const [email,     setEmail]     = useState("");
  const [telefono,  setTelefono]  = useState("");
  const [tipo,      setTipo]      = useState<InmuebleTipo>("vivienda");
  const [ciudad,    setCiudad]    = useState("");
  const [m2,        setM2]        = useState("");
  const [finalidad, setFinalidad] = useState<Finalidad>("vender");
  const [rgpd,      setRgpd]      = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) {
      toast({ title: "Nombre y email son obligatorios", variant: "destructive" });
      return;
    }
    if (!rgpd) {
      toast({ title: "Acepta la política de privacidad para continuar", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone: telefono, module: "solicitud-cee" }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      // Guardar en sessionStorage para siguiente paso
      sessionStorage.setItem("solicitud_cee", JSON.stringify({ nombre, email, telefono, tipo, ciudad, m2, finalidad }));
      navigate("/solicitud-cee/tecnico");
    } catch {
      toast({ title: "Error al guardar la solicitud", description: "Inténtalo de nuevo", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout backHref="/precios">
      <Stepper current={1} />

      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-10 sm:pt-12 pb-8 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pub-primary/10 text-pub-primary text-[11px] font-bold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-pub-primary" />
            Paso 1 de 4 · sin compromiso
          </span>
          <h1 className="text-[2rem] sm:text-[2.5rem] font-extrabold text-pub-ink mt-4 leading-[1.05] tracking-tight">
            Empieza tu certificado<br />energético (CEE)
          </h1>
          <p className="text-[15px] sm:text-base text-pub-muted mt-4 max-w-xl mx-auto leading-relaxed">
            Cuéntanos lo básico sobre ti y tu inmueble. En el siguiente paso recogeremos los datos técnicos y te daremos un precio cerrado.
          </p>
        </div>
      </section>

      {/* Form + Rail */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 lg:gap-12 items-start">

          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-9 space-y-7 animate-reveal">

            {/* Sobre ti */}
            <div>
              <h2 className="text-lg font-bold text-pub-ink">Sobre ti</h2>
              <p className="text-xs text-pub-muted mt-1">Solo necesitamos lo justo para contactarte</p>
            </div>

            <div className="space-y-5">
              <PublicInput
                id="nombre"
                label="¿Cómo te llamas?"
                placeholder="Nombre y apellidos"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <PublicInput
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <PublicInput
                  id="telefono"
                  label="Teléfono"
                  type="tel"
                  placeholder="+34 600 000 000"
                  hint="Solo lo usamos para confirmar la visita técnica"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                />
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Sobre el inmueble */}
            <div>
              <h2 className="text-lg font-bold text-pub-ink">Sobre el inmueble</h2>
              <p className="text-xs text-pub-muted mt-1">Lo justo para estimar tu precio</p>
            </div>

            <div className="space-y-5">
              <div>
                <FieldLabel>Tipo de inmueble</FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {tiposInmueble.map(t => (
                    <ChoiceCard
                      key={t.id}
                      vertical
                      selected={tipo === t.id}
                      onClick={() => setTipo(t.id)}
                      icon={t.icon}
                      title={t.title}
                      subtitle={t.subtitle}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-5">
                <PublicInput
                  id="ciudad"
                  label="Ciudad o código postal"
                  placeholder="Ej. Madrid, 28013"
                  value={ciudad}
                  onChange={e => setCiudad(e.target.value)}
                  prefixIcon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  }
                />
                <PublicInput
                  id="m2"
                  label="Superficie aprox."
                  type="number"
                  placeholder="0"
                  suffix="m²"
                  value={m2}
                  onChange={e => setM2(e.target.value)}
                />
              </div>

              <div>
                <FieldLabel optional>¿Para qué lo necesitas?</FieldLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {finalidades.map(f => (
                    <ChoiceSmall
                      key={f.id}
                      selected={finalidad === f.id}
                      onClick={() => setFinalidad(f.id)}
                      label={f.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <PublicCheckbox
              checked={rgpd}
              onChange={setRgpd}
              className="pt-2 border-t border-gray-100"
            >
              He leído y acepto la <a href="/privacy" className="text-pub-primary hover:underline font-semibold">política de privacidad</a> y el tratamiento de mis datos por Certifive Soluciones Energéticas S.L.
            </PublicCheckbox>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <p className="text-xs text-pub-muted flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-pub-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Sin pago hasta confirmar el precio
              </p>
              <BtnPrimary type="submit" disabled={loading}>
                {loading ? "Guardando…" : "Continuar"} <ArrowRight />
              </BtnPrimary>
            </div>
          </form>

          {/* Rail derecho */}
          <aside className="space-y-6 lg:sticky lg:top-24 self-start">
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-[10px] font-bold tracking-wider uppercase text-pub-muted mb-4">Así de fácil</p>
              <ol className="space-y-4">
                {[
                  { n: 1, title: "Rellenas el formulario", sub: "Menos de 1 minuto" },
                  { n: 2, title: "Datos técnicos",         sub: "Y precio cerrado al instante" },
                  { n: 3, title: "Visita técnica",          sub: "45 min · cuando te encaje" },
                  { n: 4, title: "Recibes el PDF",          sub: "Registrado en la CCAA" },
                ].map(s => (
                  <li key={s.n} className="flex gap-3">
                    <StepNum n={s.n} />
                    <div>
                      <p className="text-sm font-semibold text-pub-ink">{s.title}</p>
                      <p className="text-[12px] text-pub-muted mt-0.5">{s.sub}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl p-5 border border-emerald-100 bg-emerald-50/50">
              <p className="text-[10px] font-bold tracking-wider uppercase text-pub-primary mb-2">Precio orientativo</p>
              <p className="text-[15px] font-semibold text-pub-ink leading-snug">
                Vivienda hasta 100 m²<br />
                desde <span className="text-2xl font-extrabold tracking-tight">120 €</span>
              </p>
              <p className="text-[11.5px] text-pub-muted mt-2">Incluye visita, certificado PDF y registro oficial en la CCAA.</p>
            </div>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}
