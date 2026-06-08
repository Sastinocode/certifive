import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  X, ExternalLink, Download, Send, Archive, FileCode,
  User, Home, MapPin, Zap, Thermometer, Droplets,
  Wind, Building2, Calendar, Ruler, Euro,
  CheckCircle, Clock, XCircle, ChevronRight,
  FileText, Phone, Mail, IdCard, Layers,
  UploadCloud, Trash2, MessageCircle,
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

interface Documento {
  id: number;
  nombreOriginal: string;
  path: string;
  tipoDoc: string;
  mimeType: string;
  tamano: number;
  fechaSubida: string | null;
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
  const [tab, setTab] = useState<"resumen" | "técnico" | "pagos" | "certificado">("resumen");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [exportingCE3X, setExportingCE3X] = useState(false);

  // ── Estado del tab Certificado ────────────────────────────────────────────
  const [uploading, setUploading]         = useState(false);
  const [sendDialog, setSendDialog]       = useState<{ open: boolean; docId: number | null }>({ open: false, docId: null });
  const [sendChannel, setSendChannel]     = useState<"email" | "whatsapp">("email");
  const [sendRecipient, setSendRecipient] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExportCE3X() {
    if (!certId) return;
    setExportingCE3X(true);
    try {
      const res = await fetch(`/api/certifications/${certId}/export-ce3x.xml`, { credentials: "include" });
      if (!res.ok) throw new Error("Error generando XML");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : `CEE_cert_${certId}.xml`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "CE3X exportado", description: filename });
    } catch {
      toast({ title: "Error", description: "No se pudo generar el XML CE3X", variant: "destructive" });
    } finally {
      setExportingCE3X(false);
    }
  }

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

  // ── Query: documentos tipo "certificado" ─────────────────────────────────
  const { data: docsData = [], refetch: refetchDocs } = useQuery<Documento[]>({
    queryKey: ["/api/certifications", certId, "documentos"],
    queryFn: async () => {
      const res = await fetch(`/api/certifications/${certId}/documentos`, { credentials: "include" });
      if (!res.ok) return [];
      const all: Documento[] = await res.json();
      return all.filter(d => d.tipoDoc === "certificado");
    },
    enabled: certId !== null && tab === "certificado",
    staleTime: 0,
  });

  // ── Mutación: subir certificado ───────────────────────────────────────────
  async function handleUpload(file: File) {
    if (!certId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("tipoDoc", "certificado");
      const res = await fetch(`/api/certifications/${certId}/documentos`, {
        method: "POST", body: fd, credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Error al subir");
      toast({ title: "Certificado subido", description: file.name });
      refetchDocs();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── Mutación: eliminar documento ──────────────────────────────────────────
  const deleteMut = useMutation({
    mutationFn: (docId: number) => apiRequest("DELETE", `/api/documentos/${docId}`),
    onSuccess: () => { toast({ title: "Eliminado" }); refetchDocs(); },
    onError:   () => toast({ title: "Error al eliminar", variant: "destructive" } as any),
  });

  // ── Mutación: enviar al propietario ───────────────────────────────────────
  const sendMut = useMutation({
    mutationFn: ({ docId, channel, recipient }: { docId: number; channel: string; recipient: string }) =>
      apiRequest("POST", `/api/certifications/${certId}/documentos/${docId}/send`, { channel, recipient }),
    onSuccess: () => {
      toast({ title: "Enviado correctamente" });
      setSendDialog({ open: false, docId: null });
      setSendRecipient("");
    },
    onError: (err: any) => toast({ title: "Error al enviar", description: err.message, variant: "destructive" }),
  });

  function openSendDialog(docId: number) {
    setSendDialog({ open: true, docId });
    setSendChannel("email");
    setSendRecipient(cert?.ownerEmail ?? "");
  }

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
          {(["resumen", "técnico", "pagos", "certificado"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "11px 0", border: "none", background: "transparent",
                cursor: "pointer", fontSize: 12, fontWeight: tab === t ? 600 : 400,
                color: tab === t ? ACTIVE : "var(--muted-foreground)",
                borderBottom: tab === t ? `2px solid ${ACTIVE}` : "2px solid transparent",
                textTransform: "capitalize", transition: "color .15s",
              }}
            >
              {t === "resumen" ? "Resumen" : t === "técnico" ? "Técnico" : t === "pagos" ? "Pagos" : "Certificado"}
            </button>
          ))}
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {isLoading ? (
            <LoadingSkeleton />
          ) : cert ? (
            <>
              {tab === "resumen"      && <TabResumen cert={cert} />}
              {tab === "técnico"      && <TabTécnico cert={cert} />}
              {tab === "pagos"        && <TabPagos cert={cert} />}
              {tab === "certificado"  && (
                <TabCertificado
                  docs={docsData}
                  uploading={uploading}
                  fileInputRef={fileInputRef}
                  onUpload={handleUpload}
                  onDelete={(id) => deleteMut.mutate(id)}
                  onSend={openSendDialog}
                />
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted-foreground)" }}>
              No se pudo cargar el expediente
            </div>
          )}
        </div>

        {/* ── Dialog: enviar certificado ──────────────────────────────────── */}
        {sendDialog.open && (
          <>
            <div
              onClick={() => setSendDialog({ open: false, docId: null })}
              style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.4)" }}
            />
            <div style={{
              position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
              zIndex: 9001, background: "var(--background)", borderRadius: 14,
              padding: "24px 24px 20px", width: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Enviar certificado</div>

              {/* Canal */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {(["email", "whatsapp"] as const).map(ch => (
                  <button
                    key={ch}
                    onClick={() => {
                      setSendChannel(ch);
                      setSendRecipient(ch === "email" ? (cert?.ownerEmail ?? "") : (cert?.ownerPhone ?? ""));
                    }}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid",
                      borderColor: sendChannel === ch ? ACTIVE : "var(--border)",
                      background: sendChannel === ch ? `${ACTIVE}15` : "transparent",
                      color: sendChannel === ch ? ACTIVE : "var(--muted-foreground)",
                      fontWeight: 600, fontSize: 13, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    {ch === "email" ? <><Mail size={13} /> Email</> : <><MessageCircle size={13} /> WhatsApp</>}
                  </button>
                ))}
              </div>

              {/* Destinatario */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>
                  {sendChannel === "email" ? "Email del propietario" : "Teléfono (con prefijo, ej: +34600000000)"}
                </label>
                <input
                  type={sendChannel === "email" ? "email" : "tel"}
                  value={sendRecipient}
                  onChange={e => setSendRecipient(e.target.value)}
                  placeholder={sendChannel === "email" ? "propietario@email.com" : "+34600000000"}
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 8,
                    border: "1px solid var(--border)", fontSize: 13,
                    background: "var(--background)", color: "var(--foreground)", boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setSendDialog({ open: false, docId: null })}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", cursor: "pointer", fontSize: 13 }}
                >
                  Cancelar
                </button>
                <button
                  disabled={!sendRecipient || sendMut.isPending}
                  onClick={() => sendMut.mutate({ docId: sendDialog.docId!, channel: sendChannel, recipient: sendRecipient })}
                  style={{
                    padding: "8px 16px", borderRadius: 8, border: "none",
                    background: !sendRecipient ? "var(--muted)" : ACTIVE,
                    color: !sendRecipient ? "var(--muted-foreground)" : "#fff",
                    fontWeight: 600, fontSize: 13, cursor: sendRecipient ? "pointer" : "default",
                  }}
                >
                  {sendMut.isPending ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Footer actions ───────────────────────────────────────────────── */}
        {cert && (
          <div style={{
            borderTop: "1px solid var(--border)", padding: "12px 16px",
            display: "flex", gap: 8, flexShrink: 0, background: PANEL_BG,
          }}>
            <ActionBtn icon={<Download size={13} />} label="PDF" onClick={() => onDownload?.(certId!, "pdf")} />
            <ActionBtn
              icon={exportingCE3X ? <span style={{fontSize:11}}>...</span> : <FileCode size={13} />}
              label="CE3X"
              onClick={handleExportCE3X}
            />
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

// ── Tab: Certificado ─────────────────────────────────────────────────────────
function TabCertificado({
  docs, uploading, fileInputRef, onUpload, onDelete, onSend,
}: {
  docs: Documento[];
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onUpload: (f: File) => void;
  onDelete: (id: number) => void;
  onSend: (id: number) => void;
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  }

  function fmtSize(bytes: number) {
    return bytes < 1_000_000
      ? (bytes / 1024).toFixed(0) + " KB"
      : (bytes / 1_048_576).toFixed(1) + " MB";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Zona de subida */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <span style={{ color: ACTIVE }}><UploadCloud size={14} /></span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
            Subir certificado CEE
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={handleChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            width: "100%", padding: "20px 16px", borderRadius: 10,
            border: `2px dashed ${ACTIVE}55`,
            background: `${ACTIVE}08`,
            cursor: uploading ? "default" : "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            transition: "background .15s",
          }}
        >
          <UploadCloud size={24} style={{ color: ACTIVE, opacity: uploading ? .5 : 1 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
            {uploading ? "Subiendo..." : "Seleccionar PDF del certificado"}
          </span>
          <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
            Solo PDF · Máximo 25 MB
          </span>
        </button>
      </div>

      {/* Lista de certificados subidos */}
      {docs.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span style={{ color: ACTIVE }}><FileText size={14} /></span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
              Certificados subidos ({docs.length})
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {docs.map(doc => (
              <div
                key={doc.id}
                style={{
                  border: "1px solid var(--border)", borderRadius: 10,
                  padding: "12px 14px", display: "flex", alignItems: "center", gap: 10,
                }}
              >
                <FileText size={20} style={{ color: ACTIVE, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.nombreOriginal}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                    {fmtSize(doc.tamano)}
                    {doc.fechaSubida && ` · ${new Date(doc.fechaSubida).toLocaleDateString("es-ES")}`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <a
                    href={doc.path}
                    target="_blank"
                    rel="noreferrer"
                    title="Descargar"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 30, height: 30, borderRadius: 7,
                      border: "1px solid var(--border)", color: "var(--foreground)",
                      textDecoration: "none",
                    }}
                  >
                    <Download size={13} />
                  </a>
                  <button
                    title="Enviar al propietario"
                    onClick={() => onSend(doc.id)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 30, height: 30, borderRadius: 7,
                      border: `1px solid ${ACTIVE}`, background: `${ACTIVE}15`,
                      color: ACTIVE, cursor: "pointer",
                    }}
                  >
                    <Send size={13} />
                  </button>
                  <button
                    title="Eliminar"
                    onClick={() => onDelete(doc.id)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 30, height: 30, borderRadius: 7,
                      border: "1px solid #fecaca", background: "#fef2f2",
                      color: "#dc2626", cursor: "pointer",
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {docs.length === 0 && !uploading && (
        <p style={{ fontSize: 12, color: "var(--muted-foreground)", textAlign: "center" }}>
          Sube el PDF generado por CE3X y podrás enviárselo al propietario directamente desde aquí.
        </p>
      )}
    </div>
  );
}
