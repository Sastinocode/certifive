import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  X, ExternalLink, Download, Send, Archive,
  User, Home, MapPin, Zap, Thermometer, Droplets,
  Wind, Building2, Calendar, Ruler, Euro,
  CheckCircle, Clock, XCircle, ChevronRight,
  FileText, Phone, Mail, IdCard, Layers,
} from "lucide-react";

// ── Paleta ────────────────────────────────────────────────────────────────────
const HEADER_BG = "#0F1923";
const PANEL_BG  = "var(--background)";
const BORDER    = "rgba(255,255,255,0.08)";
const DIM_W     = "rgba(255,255,255,0.45)";
const ACTIVE    = "#1FA94B";

const RATING_COLORS: Record<string, string> = {
  A: "#22c55e", B: "#84cc16", C: "#eab308",
  D: "#f97316", E: "#ef4444", F: "#dc2626", G: "#991b1b",
};
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "Nuevo":      { bg: "#eef2ff", text: "#4f46e5" },
  "En Proceso": { bg: "#fffbeb", text: "#d97706" },
  "Finalizado": { bg: "#f0fdf4", text: "#16a34a" },
};

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface CertDetail {
  id: number;
  ownerName: string | null;
  ownerDni: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  province: string | null;
  cadastralReference: string | null;
  propertyType: string | null;
  constructionYear: number | null;
  totalArea: string | null;
  zonaClimatica: string | null;
  energyRating: string | null;
  status: string;
  isArchived: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  // Técnico
  heatingSystem: string | null;
  waterHeatingType: string | null;
  airConditioningSystem: string | null;
  windowDetails: string | null;
  roofType: string | null;
  facadeOrientation: string | null;
  numPlantas: number | null;
  esUltimaPlanta: boolean | null;
  // Pagos
  estimatedPrice: string | null;
  finalPrice: string | null;
  isPaid: boolean;
  plazoEntregaDias: number | null;
  tramo1Amount: string | null;
  tramo2Amount: string | null;
  tramo1PaidAt: string | null;
  tramo2PaidAt: string | null;
  // Tokens
  presupuestoToken: string | null;
  paymentToken: string | null;
  ceeToken: string | null;
  solicitudToken: string | null;
  técnicoFormStatus: string | null;
  ceeFormStatus: string | null;
  deliveryStatus: string | null;
}

interface Props {
  certId: number | null;
  onClose: () => void;
  onDownload?: (certId: number, format: "pdf" | "word" | "excel") => void;
  onSend?: (certId: number) => void;
  onArchive?: (certId: number) => void;
  onStatusChange?: (certId: number, status: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const HEATING_LABELS: Record<string, string> = {
  gas_natural: "Gas Natural", electrico: "Eléctrico", bomba_calor: "Bomba de Calor",
  carbon: "Carbón", biomasa: "Biomasa", no: "Sin calefacción",
};
const ACS_LABELS: Record<string, string> = {
  gas: "Gas", electrico: "Eléctrico", solar: "Solar",
  bomba_calor: "Bomba de Calor", no: "Sin ACS",
};
const AC_LABELS: Record<string, string> = {
  split_individual: "Split Individual", central: "Sistema Central",
  portatil: "Portátil", no: "Sin aire acondicionado",
};
const PROP_LABELS: Record<string, string> = {
  piso: "Piso", casa: "Casa Unifamiliar", chalet: "Chalet",
  local: "Local Comercial", oficina: "Oficina",
};
const ORIENTATION_LABELS: Record<string, string> = {
  norte: "Norte", sur: "Sur", este: "Este", oeste: "Oeste",
  noreste: "Noreste", noroeste: "Noroeste", sureste: "Sureste", suroeste: "Suroeste",
};

function fmt(val: string | null | undefined): string {
  return val || "No indicado";
}
function fmtEuro(val: string | null | undefined): string {
  if (!val) return "No indicado";
  return parseFloat(val).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}
function fmtDate(val: string | null | undefined): string {
  if (!val) return "No indicado";
  return new Date(val).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export function CertDetailPanel({ certId, onClose, onDownload, onSend, onArchive, onStatusChange }: Props) {
  const [tab, setTab] = useState<"resumen" | "técnico" | "pagos">("resumen");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: cert, isLoading } = useQuery<CertDetail>({
    queryKey: ["/api/certifications", certId],
    queryFn: async () => {
      const res = await fetch(`/api/certifications/${certId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error cargando expediente");
      return res.json();
    },
    enabled: certId !== null,
    staleTime: 30_000,
  });

  // ── Cerrar con Escape ─────────────────────────────────────────────────────
  useEffect(() => {
    if (certId === null) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [certId, onClose]);

  // ── Resetear tab al cambiar expediente ────────────────────────────────────
  useEffect(() => { setTab("resumen"); }, [certId]);

  if (certId === null) return null;

  const statusStyle = STATUS_COLORS[cert?.status ?? ""] ?? { bg: "#f3f4f6", text: "#6b7280" };
  const ratingColor = RATING_COLORS[cert?.energyRating ?? ""] ?? "#9ca3af";

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 8000,
          background: "rgba(0,0,0,0.35)",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: 460, zIndex: 8001,
          background: PANEL_BG,
          display: "flex", flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.25)",
          animation: "slideInRight .2s ease-out",
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{ background: HEADER_BG, padding: "18px 20px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                {/* Energy badge */}
                {cert?.energyRating && (
                  <span style={{
                    background: ratingColor, color: "#fff",
                    fontWeight: 800, fontSize: 13, borderRadius: 6,
                    padding: "2px 10px", letterSpacing: ".03em",
                  }}>
                    {cert.energyRating}
                  </span>
                )}
                {/* Status badge */}
                {cert?.status && (
                  <span style={{
                    background: statusStyle.bg, color: statusStyle.text,
                    fontSize: 11, fontWeight: 600, borderRadius: 20,
                    padding: "3px 10px",
                  }}>
                    {cert.status}
                  </span>
                )}
                {cert?.isArchived && (
                  <span style={{ background: "#f3f4f6", color: "#6b7280", fontSize: 11, borderRadius: 20, padding: "3px 10px" }}>
                    Archivado
                  </span>
                )}
              </div>

              {isLoading ? (
                <div style={{ height: 20, width: 200, background: "rgba(255,255,255,0.1)", borderRadius: 4 }} />
              ) : (
                <>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {cert?.ownerName || "Sin nombre"}
                  </div>
                  <div style={{ fontSize: 12, color: DIM_W, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {[cert?.address, cert?.city, cert?.province].filter(Boolean).join(", ") || "Dirección no indicada"}
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {/* Abrir vista completa */}
              <button
                title="Ver pagina completa"
                onClick={() => { setLocation(`/certificacion-request/${certId}`); onClose(); }}
                style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 7, padding: "7px 8px", cursor: "pointer", color: DIM_W, display: "flex", alignItems: "center" }}
              >
                <ExternalLink size={14} />
              </button>
              {/* Cerrar */}
              <button
                onClick={onClose}
                style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 7, padding: "7px 8px", cursor: "pointer", color: DIM_W, display: "flex", alignItems: "center" }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Info pill: ID + fecha */}
          {cert && (
            <div style={{ marginTop: 10, display: "flex", gap: 12 }}>
              <span style={{ fontSize: 11, color: DIM_W }}>Exp. #{cert.id}</span>
              <span style={{ fontSize: 11, color: DIM_W }}>Creado {fmtDate(cert.createdAt ?? undefined)}</span>
              {cert.zonaClimatica && (
                <span style={{ fontSize: 11, color: DIM_W }}>Zona {cert.zonaClimatica}</span>
              )}
            </div>
          )}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0, background: PANEL_BG }}>
          {(["resumen", "técnico", "pagos"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "11px 0", border: "none", background: "transparent",
                cursor: "pointer", fontSize: 13, fontWeight: tab === t ? 600 : 400,
                color: tab === t ? ACTIVE : "var(--muted-foreground)",
                borderBottom: tab === t ? `2px solid ${ACTIVE}` : "2px solid transparent",
                textTransform: "capitalize", transition: "color .15s",
              }}
            >
              {t === "resumen" ? "Resumen" : t === "técnico" ? "Técnico" : "Pagos"}
            </button>
          ))}
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {isLoading ? (
            <LoadingSkeleton />
          ) : cert ? (
            <>
              {tab === "resumen"  && <TabResumen cert={cert} />}
              {tab === "técnico"  && <TabTécnico cert={cert} />}
              {tab === "pagos"    && <TabPagos cert={cert} />}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted-foreground)" }}>
              No se pudo cargar el expediente
            </div>
          )}
        </div>

        {/* ── Footer actions ───────────────────────────────────────────────── */}
        {cert && (
          <div style={{
            borderTop: "1px solid var(--border)", padding: "12px 16px",
            display: "flex", gap: 8, flexShrink: 0, background: PANEL_BG,
          }}>
            <ActionBtn icon={<Download size={13} />} label="PDF" onClick={() => onDownload?.(certId!, "pdf")} />
            <ActionBtn icon={<Send size={13} />}     label="Enviar" onClick={() => onSend?.(certId!)} primary />
            {!cert.isArchived && (
              <ActionBtn icon={<Archive size={13} />} label="Archivar" onClick={() => { onArchive?.(certId!); onClose(); }} />
            )}
          </div>
        )}
      </div>

      {/* Keyframe animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ── Tab: Resumen ──────────────────────────────────────────────────────────────
function TabResumen({ cert }: { cert: CertDetail }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Section title="Propietario" icon={<User size={14} />}>
        <Row label="Nombre"    value={fmt(cert.ownerName)} />
        <Row label="DNI / NIF" value={fmt(cert.ownerDni)} icon={<IdCard size={12} />} />
        <Row label="Email"     value={fmt(cert.ownerEmail)} icon={<Mail size={12} />} />
        <Row label="Telefono"  value={fmt(cert.ownerPhone)} icon={<Phone size={12} />} />
      </Section>

      <Section title="Inmueble" icon={<Home size={14} />}>
        <Row label="Dirección"   value={fmt(cert.address)} icon={<MapPin size={12} />} />
        <Row label="Ciudad"      value={fmt(cert.city)} />
        <Row label="Provincia"   value={fmt(cert.province)} />
        <Row label="Cód. Postal" value={fmt(cert.postalCode)} />
        <Row label="Ref. Catastral" value={fmt(cert.cadastralReference)} mono />
        <Row label="Tipo"        value={PROP_LABELS[cert.propertyType ?? ""] ?? fmt(cert.propertyType)} icon={<Building2 size={12} />} />
        <Row label="Año construcción" value={cert.constructionYear ? String(cert.constructionYear) : "No indicado"} icon={<Calendar size={12} />} />
        <Row label="Superficie"  value={cert.totalArea ? `${parseFloat(cert.totalArea).toFixed(0)} m2` : "No indicado"} icon={<Ruler size={12} />} />
        {cert.zonaClimatica && (
          <Row label="Zona climatica" value={cert.zonaClimatica} />
        )}
      </Section>
    </div>
  );
}

// ── Tab: Técnico ──────────────────────────────────────────────────────────────
function TabTécnico({ cert }: { cert: CertDetail }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Section title="Sistemas energéticos" icon={<Zap size={14} />}>
        <Row label="Calefaccion"  value={HEATING_LABELS[cert.heatingSystem ?? ""] ?? fmt(cert.heatingSystem)} icon={<Thermometer size={12} />} />
        <Row label="Agua caliente" value={ACS_LABELS[cert.waterHeatingType ?? ""] ?? fmt(cert.waterHeatingType)} icon={<Droplets size={12} />} />
        <Row label="Aire acondicionado" value={AC_LABELS[cert.airConditioningSystem ?? ""] ?? fmt(cert.airConditioningSystem)} icon={<Wind size={12} />} />
      </Section>

      <Section title="Envolvente del edificio" icon={<Building2 size={14} />}>
        <Row label="Ventanas"    value={fmt(cert.windowDetails)} />
        <Row label="Cubierta"    value={fmt(cert.roofType)} />
        <Row label="Orientación fachada" value={ORIENTATION_LABELS[cert.facadeOrientation ?? ""] ?? fmt(cert.facadeOrientation)} />
        {cert.numPlantas !== null && cert.numPlantas !== undefined && (
          <Row label="Número de plantas" value={String(cert.numPlantas)} icon={<Layers size={12} />} />
        )}
        {cert.esUltimaPlanta !== null && cert.esUltimaPlanta !== undefined && (
          <Row label="Última planta" value={cert.esUltimaPlanta ? "Sí (cubierta afecta)" : "No"} />
        )}
      </Section>

      <Section title="Estado formularios" icon={<FileText size={14} />}>
        <StatusRow label="Formulario CEE"     value={cert.ceeFormStatus} />
        <StatusRow label="Formulario técnico" value={cert.técnicoFormStatus} />
        <StatusRow label="Entrega"            value={cert.deliveryStatus} />
        {cert.plazoEntregaDias !== null && (
          <Row label="Plazo entrega" value={`${cert.plazoEntregaDias} días`} icon={<Calendar size={12} />} />
        )}
      </Section>
    </div>
  );
}

// ── Tab: Pagos ────────────────────────────────────────────────────────────────
function TabPagos({ cert }: { cert: CertDetail }) {
  const totalPaid =
    (cert.tramo1PaidAt ? parseFloat(cert.tramo1Amount ?? "0") : 0) +
    (cert.tramo2PaidAt ? parseFloat(cert.tramo2Amount ?? "0") : 0);
  const totalFinal = parseFloat(cert.finalPrice ?? cert.estimatedPrice ?? "0");
  const pct = totalFinal > 0 ? Math.min(100, Math.round((totalPaid / totalFinal) * 100)) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Resumen de cobro */}
      <div style={{
        background: cert.isPaid ? "#f0fdf4" : "var(--muted)",
        borderRadius: 10, padding: "14px 16px",
        border: `1px solid ${cert.isPaid ? "#bbf7d0" : "var(--border)"}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
            {cert.isPaid ? "Pagado completamente" : "Pendiente de cobro"}
          </span>
          {cert.isPaid
            ? <CheckCircle size={18} style={{ color: "#16a34a" }} />
            : <Clock size={18} style={{ color: "#d97706" }} />
          }
        </div>
        {/* Barra de progreso */}
        <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#16a34a" : "#f59e0b", borderRadius: 3, transition: "width .4s" }} />
        </div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
          {fmtEuro(String(totalPaid))} cobrados de {fmtEuro(cert.finalPrice ?? cert.estimatedPrice ?? "0")}
        </div>
      </div>

      <Section title="Precios" icon={<Euro size={14} />}>
        <Row label="Precio estimado" value={fmtEuro(cert.estimatedPrice)} />
        <Row label="Precio final"    value={fmtEuro(cert.finalPrice)} />
      </Section>

      <Section title="Tramo 1" icon={<Euro size={14} />}>
        <Row label="Importe" value={fmtEuro(cert.tramo1Amount)} />
        <Row
          label="Estado"
          value={cert.tramo1PaidAt ? `Pagado el ${fmtDate(cert.tramo1PaidAt)}` : "Pendiente"}
          valueColor={cert.tramo1PaidAt ? "#16a34a" : "#d97706"}
        />
      </Section>

      <Section title="Tramo 2" icon={<Euro size={14} />}>
        <Row label="Importe" value={fmtEuro(cert.tramo2Amount)} />
        <Row
          label="Estado"
          value={cert.tramo2PaidAt ? `Pagado el ${fmtDate(cert.tramo2PaidAt)}` : "Pendiente"}
          valueColor={cert.tramo2PaidAt ? "#16a34a" : "#d97706"}
        />
      </Section>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ color: ACTIVE }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          {title}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, icon, mono, valueColor }: { label: string; value: string; icon?: React.ReactNode; mono?: boolean; valueColor?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--muted-foreground)", fontSize: 12 }}>
        {icon && <span style={{ opacity: .7 }}>{icon}</span>}
        {label}
      </div>
      <div style={{
        fontSize: 12, fontWeight: 500, color: valueColor ?? "var(--foreground)",
        fontFamily: mono ? "monospace" : "inherit",
        maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        textAlign: "right",
      }}>
        {value}
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string | null | undefined }) {
  const norm = value?.toLowerCase();
  const color = norm === "completado" || norm === "entregado" ? "#16a34a"
    : norm === "enviado" || norm === "en proceso" ? "#d97706"
    : "#9ca3af";
  const Icon = norm === "completado" || norm === "entregado" ? CheckCircle
    : norm === "enviado" || norm === "en proceso" ? Clock : XCircle;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color }}>
        <Icon size={12} />
        {value ?? "No iniciado"}
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, primary }: { icon: React.ReactNode; label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        padding: "9px 8px", borderRadius: 8, border: `1px solid ${primary ? ACTIVE : "var(--border)"}`,
        background: primary ? ACTIVE : "transparent",
        color: primary ? "#fff" : "var(--foreground)",
        fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "opacity .15s",
      }}
    >
      {icon}{label}
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[120, 80, 100, 60, 90].map((w, i) => (
        <div key={i} style={{ height: 14, width: `${w}%`, maxWidth: `${w * 3}px`, background: "var(--muted)", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
      ))}
    </div>
  );
}
