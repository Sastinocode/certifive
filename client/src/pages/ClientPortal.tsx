/**
 * CERTIFIVE — Portal del cliente
 * Accesible en /portal/:token — sin login requerido.
 */

import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { CheckCircle2, Circle, Clock, FileText, Phone, Mail, Building2, Download, MessageSquare } from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface PortalData {
  address:      string | null;
  city:         string | null;
  propertyType: string | null;
  status:       string;
  energyRating: string | null;
  ownerName:    string | null;
  createdAt:    string;
  currentStep:  number;
  totalSteps:   number;
  stepLabels:   string[];
  certifier: {
    name:    string;
    phone:   string | null;
    email:   string | null;
    company: string | null;
    logoUrl: string | null;
  };
  documentos: Array<{
    id:             number;
    nombreOriginal: string;
    path:           string;
    tipoDoc:        string;
    fechaSubida:    string;
  }>;
  mensajes: Array<{
    canal:      string;
    contenido:  string | null;
    fechaEnvio: string | null;
    estado:     string;
  }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ENERGY_COLORS: Record<string, string> = {
  A: "#1a9a4a", B: "#4db84a", C: "#b8d44a",
  D: "#f5e642", E: "#f5a623", F: "#e8621a", G: "#c0392b",
};

const TIPO_DOC_LABELS: Record<string, string> = {
  certificado:        "Certificado energético",
  presupuesto:        "Presupuesto",
  factura_luz:        "Factura de luz",
  factura_gas:        "Factura de gas",
  referencia_catastral: "Referencia catastral",
  planos:             "Planos",
  otro:               "Documento",
};

function fmtDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

// ── Componentes ───────────────────────────────────────────────────────────────

function ProgressBar({ currentStep, totalSteps, stepLabels }: { currentStep: number; totalSteps: number; stepLabels: string[] }) {
  return (
    <div className="w-full">
      <div className="flex items-start justify-between relative">
        {/* Línea de fondo */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" style={{ left: "calc(50% / 5)", right: "calc(50% / 5)" }} />
        {/* Línea de progreso */}
        <div
          className="absolute top-4 h-0.5 bg-emerald-500 z-0 transition-all duration-500"
          style={{
            left: "calc(50% / 5)",
            width: `${(currentStep / totalSteps) * 100}%`,
            maxWidth: "calc(100% - 50% / 5 * 2)",
          }}
        />
        {stepLabels.map((label, i) => {
          const done    = i < currentStep;
          const current = i === currentStep;
          return (
            <div key={label} className="flex flex-col items-center gap-2 z-10 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  done    ? "bg-emerald-500 border-emerald-500" :
                  current ? "bg-white border-emerald-500" :
                            "bg-white border-gray-300"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : current ? (
                  <Clock className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300" />
                )}
              </div>
              <span className={`text-[11px] font-medium text-center leading-tight ${
                done || current ? "text-emerald-700" : "text-gray-400"
              }`}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError } = useQuery<PortalData>({
    queryKey: ["portal", token],
    queryFn: () =>
      fetch(`/api/portal/${token}`).then(r => {
        if (!r.ok) throw new Error("Portal no disponible");
        return r.json();
      }),
    enabled: !!token,
    staleTime: 60_000,
  });

  if (!token || isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Enlace no válido</h1>
          <p className="text-gray-500 text-sm">Este enlace no existe o ha expirado. Contacta con tu certificador.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Cargando tu expediente…</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const rating = data.energyRating?.toUpperCase();
  const ratingColor = rating ? (ENERGY_COLORS[rating] ?? "#94a3b8") : null;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Certifive</span>
          </div>
          {rating && ratingColor && (
            <span
              className="text-white text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: ratingColor }}
            >
              Letra {rating}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Inmueble */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Tu expediente</p>
          <h1 className="text-lg font-bold text-gray-900 leading-snug">
            {data.address ?? "Inmueble"}{data.city ? `, ${data.city}` : ""}
          </h1>
          {data.ownerName && <p className="text-sm text-gray-500 mt-0.5">{data.ownerName}</p>}
          <p className="text-xs text-gray-400 mt-1">Abierto el {fmtDate(data.createdAt)}</p>
        </div>

        {/* Progreso */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-5">Estado del proceso</h2>
          <ProgressBar
            currentStep={data.currentStep}
            totalSteps={data.totalSteps}
            stepLabels={data.stepLabels}
          />
          <p className="text-xs text-gray-500 mt-4 text-center">
            {data.currentStep < data.totalSteps
              ? `Paso ${data.currentStep + 1} de ${data.totalSteps + 1}: ${data.stepLabels[data.currentStep]}`
              : "✅ Certificado completado"}
          </p>
        </div>

        {/* Certificador */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Tu certificador</h2>
          <div className="flex items-start gap-4">
            {data.certifier.logoUrl ? (
              <img src={data.certifier.logoUrl} alt="logo" className="w-12 h-12 rounded-xl object-contain border border-gray-100" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{data.certifier.name}</p>
              {data.certifier.company && <p className="text-sm text-gray-500">{data.certifier.company}</p>}
              <div className="flex flex-col gap-1 mt-2">
                {data.certifier.phone && (
                  <a href={`tel:${data.certifier.phone}`} className="flex items-center gap-1.5 text-sm text-emerald-700 hover:underline">
                    <Phone className="w-3.5 h-3.5" /> {data.certifier.phone}
                  </a>
                )}
                {data.certifier.email && (
                  <a href={`mailto:${data.certifier.email}`} className="flex items-center gap-1.5 text-sm text-emerald-700 hover:underline">
                    <Mail className="w-3.5 h-3.5" /> {data.certifier.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Documentos */}
        {data.documentos.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Documentos</h2>
            <div className="space-y-2">
              {data.documentos.map(doc => (
                <a
                  key={doc.id}
                  href={doc.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center flex-shrink-0 transition-colors">
                    <FileText className="w-4 h-4 text-gray-500 group-hover:text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {TIPO_DOC_LABELS[doc.tipoDoc] ?? doc.nombreOriginal}
                    </p>
                    <p className="text-xs text-gray-400">{fmtDate(doc.fechaSubida)}</p>
                  </div>
                  <Download className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Comunicaciones */}
        {data.mensajes.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Comunicaciones</h2>
            <div className="space-y-3">
              {data.mensajes.map((msg, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-gray-500 capitalize">{msg.canal}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{fmtDate(msg.fechaEnvio)}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{msg.contenido}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 py-4">
          Certifive · Certificación energética 100% online
        </p>

      </main>
    </div>
  );
}
