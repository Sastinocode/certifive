import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Link } from "wouter";
import { useState } from "react";
import {
  ArrowLeft,
  Download,
  Phone,
  Mail,
  MapPin,
  Home,
  Zap,
  Droplets,
  Wind,
  Eye,
  FileImage,
  ClipboardList,
  User,
  Check,
  X,
  ChevronDown,
  Globe,
  Clock,
  AlertTriangle,
  Paperclip,
} from "lucide-react";

interface CertificationRequest {
  id: number;
  fullName: string;
  dni: string;
  email: string;
  phone: string;
  cadastralRef: string;
  status: string;
  createdAt: string;
  rooms: number;
  facadeOrientation: string;
  habitableFloors: number;
  windowDetails: string;
  roofType: string;
  airConditioningSystem: string;
  heatingSystem: string;
  waterHeatingType: string;
  waterHeatingCapacity: number;
  photos: string[] | null;
  propertyAddress?: string;
}

function Datapoint({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-muted/40 border border-border">
      <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{children}</span>
    </div>
  );
}

const HEATING_LABELS: Record<string, string> = {
  gas_natural: "Gas Natural", electrico: "Eléctrico", bomba_calor: "Bomba de calor",
  carbon: "Carbón", biomasa: "Biomasa", no: "Sin calefacción",
};
const WATER_LABELS: Record<string, string> = {
  gas: "Gas", electrico: "Eléctrico", solar: "Solar", bomba_calor: "Bomba de calor", no: "Sin ACS",
};
const AC_LABELS: Record<string, string> = {
  split_individual: "Split individual", central: "Central", portatil: "Portátil", no: "Sin A/A",
};
const ROOF_LABELS: Record<string, string> = {
  plana: "Cubierta plana", inclinada: "Cubierta inclinada", mixta: "Mixta",
};

function statusPill(status: string) {
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Pendiente de aceptar
      </span>
    );
  if (status === "completed")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        Completado
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export default function ViewCertificationRequest() {
  const [match, params] = useRoute("/certificacion-request/:id");
  const certificationId = params?.id;
  const [rejectOpen, setRejectOpen] = useState(false);

  const { data: certification, isLoading } = useQuery({
    queryKey: ["/api/certifications", certificationId],
    enabled: !!certificationId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!certification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Solicitud no encontrada</h2>
          <Link to="/certificados">
            <button className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              Volver a solicitudes
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const cert = certification as CertificationRequest;
  const initials = cert.fullName?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() ?? "??";
  const createdDate = cert.createdAt ? new Date(cert.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  const installations = [
    cert.heatingSystem && cert.heatingSystem !== "no" ? `🔥 ${HEATING_LABELS[cert.heatingSystem] ?? cert.heatingSystem}` : null,
    cert.airConditioningSystem && cert.airConditioningSystem !== "no" ? `❄️ ${AC_LABELS[cert.airConditioningSystem] ?? cert.airConditioningSystem}` : null,
    cert.waterHeatingType && cert.waterHeatingType !== "no" ? `🚿 ${WATER_LABELS[cert.waterHeatingType] ?? cert.waterHeatingType}` : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <style>{`@keyframes cert-glow { 0%, 100% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0.4); } 50% { box-shadow: 0 0 0 8px hsl(var(--primary) / 0); } }`}</style>
      {/* Breadcrumb */}
      <div className="px-4 sm:px-8 pt-5 max-w-[1400px] mx-auto">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/certificados" className="hover:text-foreground">Expedientes</Link>
          <span className="opacity-50">/</span>
          <span className="hover:text-foreground cursor-pointer">Solicitudes entrantes</span>
          <span className="opacity-50">/</span>
          <span className="text-foreground font-semibold">SOL-{String(cert.id).padStart(4, "0")}</span>
        </nav>
      </div>

      <div className="px-4 py-5 sm:px-8 sm:py-6 max-w-[1400px] mx-auto space-y-6">

        {/* Page header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              {statusPill(cert.status)}
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Recibida el {createdDate} · vía formulario web
              </p>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-2">
              Solicitud SOL-{String(cert.id).padStart(4, "0")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Certificación energética · solicitada por {cert.fullName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/certificados">
              <button className="h-10 px-3 rounded-full border border-border bg-card text-sm font-medium hover:bg-muted/40 inline-flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>
            </Link>
            <Link to={`/visita/${cert.id}`}>
              <button className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm inline-flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4" />
                Ficha de visita
              </button>
            </Link>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

          {/* LEFT */}
          <div className="space-y-5 min-w-0">

            {/* Decision banner */}
            {cert.status === "pending" && (
              <div className="rounded-2xl border-2 border-primary/40 bg-primary/[0.04] dark:bg-primary/10 p-5 sm:p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary flex-shrink-0" style={{ animation: 'cert-glow 2s ease-in-out infinite' }}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">Decide en las próximas horas</p>
                      <p className="text-[12.5px] text-muted-foreground mt-0.5">
                        Los clientes contratan al primero que les responde.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setRejectOpen(true)}
                      className="h-11 px-4 rounded-full border border-border bg-card text-sm font-semibold hover:bg-muted/40 inline-flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      Rechazar
                    </button>
                    <button className="h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm inline-flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      Aceptar y crear expediente
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Solicitante */}
            <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <header className="px-6 py-4 border-b border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold tracking-tight">Datos del solicitante</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Quién ha rellenado el formulario</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                  <Check className="w-2.5 h-2.5" />
                  Cliente nuevo
                </span>
              </header>
              <div className="px-6 py-5">
                <div className="flex items-center gap-4 mb-5">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #a78bfa, #6d28d9)" }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold">{cert.fullName}</p>
                    <p className="text-xs text-muted-foreground">DNI: {cert.dni}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Datapoint label="Email">{cert.email}</Datapoint>
                  <Datapoint label="Teléfono">
                    <a href={`tel:${cert.phone}`} className="text-primary hover:underline">{cert.phone}</a>
                  </Datapoint>
                </div>
              </div>
            </section>

            {/* Inmueble */}
            <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <header className="px-6 py-4 border-b border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400 flex-shrink-0">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">Datos del inmueble</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Lo que ha indicado el cliente en el formulario</p>
                </div>
              </header>
              <div className="px-6 py-5 space-y-4">
                {cert.propertyAddress && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Dirección</p>
                    <p className="text-base font-bold">{cert.propertyAddress}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <Datapoint label="Habitaciones">{cert.rooms ?? "—"}</Datapoint>
                  <Datapoint label="Plantas habitables">{cert.habitableFloors ?? "—"}</Datapoint>
                  <Datapoint label="Orientación">{cert.facadeOrientation ?? "—"}</Datapoint>
                  <Datapoint label="Cubierta">{ROOF_LABELS[cert.roofType] ?? cert.roofType ?? "—"}</Datapoint>
                </div>
                {cert.windowDetails && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Detalles de ventanas</p>
                    <p className="text-sm text-foreground">{cert.windowDetails}</p>
                  </div>
                )}
                {/* Ref catastral */}
                <div className="rounded-xl border border-border bg-muted/20 p-3 flex items-center gap-3 text-sm">
                  <div className="w-7 h-7 rounded-md bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">Referencia catastral</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">{cert.cadastralRef}</p>
                  </div>
                </div>
                {/* Instalaciones */}
                {installations.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Instalaciones declaradas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {installations.map((i, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-foreground">
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Fotos */}
            {cert.photos && cert.photos.length > 0 && (
              <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <header className="px-6 py-4 border-b border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight">Adjuntos</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">El cliente ha subido {cert.photos.length} archivos</p>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-primary hover:underline">⬇ Descargar todo</button>
                </header>
                <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {cert.photos.map((photo, idx) => (
                    <div key={idx} className="rounded-xl border border-border overflow-hidden">
                      <div className="aspect-[4/3] relative group bg-muted/60">
                        <img src={photo} alt={`Adjunto ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2">
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full bg-white/90 flex items-center justify-center"
                            onClick={() => window.open(photo, "_blank")}
                          >
                            <Eye className="w-4 h-4 text-gray-800" />
                          </button>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full bg-white/90 flex items-center justify-center"
                            onClick={() => { const a = document.createElement("a"); a.href = photo; a.download = `adjunto-${idx + 1}.jpg`; a.click(); }}
                          >
                            <Download className="w-4 h-4 text-gray-800" />
                          </button>
                        </div>
                      </div>
                      <div className="px-3 py-2">
                        <p className="text-[11px] font-semibold truncate">adjunto-{idx + 1}.jpg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reject section */}
            <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <button
                onClick={() => setRejectOpen(!rejectOpen)}
                className="w-full px-6 py-4 flex items-center gap-3 text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
                  <X className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold tracking-tight">Rechazar la solicitud</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Avisa al cliente con un motivo (opcional)</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${rejectOpen ? "rotate-180" : ""}`} />
              </button>
              {rejectOpen && (
                <div className="px-6 pb-5 border-t border-border pt-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5">Motivo</label>
                    <select className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                      <option>Zona fuera de cobertura</option>
                      <option>Sin disponibilidad antes de la fecha solicitada</option>
                      <option>Tipo de inmueble que no certifico</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5">
                      Mensaje para el cliente <span className="text-muted-foreground font-normal">(opcional)</span>
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm min-h-[80px] focus:outline-none focus:border-primary resize-none"
                      placeholder={`Hola ${cert.fullName?.split(" ")[0] ?? ""}, gracias por contactar pero…`}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setRejectOpen(false)}
                      className="h-10 px-4 rounded-full border border-border bg-card text-sm font-medium hover:bg-muted/40"
                    >
                      Cancelar
                    </button>
                    <button className="h-10 px-5 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700">
                      Enviar rechazo
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-6 h-fit">

            {/* Summary */}
            <section className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Resumen de la solicitud</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Origen</span>
                  <span className="font-semibold flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-primary" />
                    Web
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Recibida</span>
                  <span className="font-semibold">{createdDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Calefacción</span>
                  <span className="font-semibold">{HEATING_LABELS[cert.heatingSystem] ?? cert.heatingSystem ?? "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">ACS</span>
                  <span className="font-semibold">{WATER_LABELS[cert.waterHeatingType] ?? cert.waterHeatingType ?? "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">A/A</span>
                  <span className="font-semibold">{AC_LABELS[cert.airConditioningSystem] ?? cert.airConditioningSystem ?? "—"}</span>
                </div>
              </div>

              <div className="my-4 border-t border-border" />

              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Actividad reciente</p>
              <ol className="space-y-3 relative">
                <span className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                <li className="flex gap-3 relative">
                  <span className="w-3.5 h-3.5 rounded-full bg-card border-2 border-primary flex-shrink-0 mt-0.5 ring-4 ring-card" />
                  <div>
                    <p className="text-xs font-semibold">Esperando decisión</p>
                    <p className="text-[10.5px] text-muted-foreground mt-0.5">Recibida {createdDate}</p>
                  </div>
                </li>
                <li className="flex gap-3 relative">
                  <span className="w-3.5 h-3.5 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 mt-0.5 ring-4 ring-card">
                    <Check className="w-2 h-2" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold">Formulario completado</p>
                    <p className="text-[10.5px] text-muted-foreground mt-0.5">{createdDate}</p>
                  </div>
                </li>
              </ol>
            </section>

          </aside>
        </div>
      </div>
    </div>
  );
}
