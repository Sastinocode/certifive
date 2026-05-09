import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { formatDate } from "../lib/utils";
import CertDataDrawer from "../components/CertDataDrawer";

const STATUS_OPTIONS = ["Nuevo", "En Proceso", "Finalizado"];

const PROPERTY_TYPES = [
  "Vivienda unifamiliar", "Piso/Apartamento", "Local comercial",
  "Edificio de viviendas", "Oficinas", "Industrial", "Otro",
];

// ── Workflow status badge ────────────────────────────────────────────────────

const WORKFLOW_LABELS: Record<string, { label: string; color: string }> = {
  nuevo: { label: "Nuevo", color: "bg-stone-100 text-stone-600" },
  solicitud_enviada: { label: "Tasación enviada", color: "bg-blue-50 text-blue-700 border border-blue-100" },
  solicitud_completada: { label: "Tasación completada", color: "bg-cyan-50 text-cyan-700 border border-cyan-100" },
  presupuesto_enviado: { label: "Presupuesto enviado", color: "bg-violet-50 text-violet-700 border border-violet-100" },
  presupuesto_aceptado: { label: "Presupuesto aceptado", color: "bg-indigo-50 text-indigo-700 border border-indigo-100" },
  pago1_pendiente: { label: "Pago 1 pendiente", color: "bg-amber-50 text-amber-700 border border-amber-100" },
  pago1_confirmado: { label: "Pago 1 confirmado", color: "bg-lime-50 text-lime-700 border border-lime-100" },
  formulario_cee_enviado: { label: "CEE enviado", color: "bg-teal-50 text-teal-700 border border-teal-100" },
  formulario_cee_completado: { label: "CEE completado", color: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
  pago2_pendiente: { label: "Pago 2 pendiente", color: "bg-amber-50 text-amber-700 border border-amber-100" },
  certificado_entregado: { label: "Certificado entregado", color: "bg-emerald-100 text-emerald-800" },
};

function WorkflowBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const meta = WORKFLOW_LABELS[status] ?? { label: status, color: "bg-stone-100 text-stone-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${meta.color}`}>
      {meta.label}
    </span>
  );
}

// ── Solicitud modal ──────────────────────────────────────────────────────────

function SolicitudModal({ cert, onClose }: { cert: any; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await apiRequest("POST", `/api/certifications/${cert.id}/generate-solicitud`);
      setUrl(data.url);
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
    } catch {
      setErr("No se pudo generar el enlace.");
    } finally {
      setLoading(false);
    }
  };

  if (!url && !loading && !err) { generate(); }

  const copy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const whatsapp = () => {
    if (!url) return;
    const text = encodeURIComponent(`Hola ${cert.ownerName ?? ""}! Te envío el formulario para tasar tu certificado energético:\n\n${url}\n\nSolo te llevará 3 minutos. ¡Gracias!`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-emerald-50 px-6 py-5 flex items-center justify-between border-b border-emerald-100">
          <div>
            <h3 className="text-base font-bold text-emerald-900">Formulario de tasación</h3>
            {cert.ownerName && <p className="text-xs text-emerald-700/60 mt-0.5">{cert.ownerName}</p>}
          </div>
          <button onClick={onClose} className="text-emerald-700/40 hover:text-emerald-900">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-stone-600">Envía este enlace al propietario para que complete sus datos y calcular el precio automáticamente.</p>
          {loading && <div className="flex items-center gap-3 py-4"><div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /><span className="text-sm text-stone-500">Generando…</span></div>}
          {err && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">{err}</div>}
          {url && (
            <>
              <div className="bg-stone-50 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">link</span>
                <p className="text-xs text-stone-600 break-all flex-1">{url}</p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={copy} className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-800 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">{copied ? "check_circle" : "content_copy"}</span>
                  {copied ? "¡Copiado!" : "Copiar enlace"}
                </button>
                <button onClick={whatsapp} className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors">
                  📲 Enviar por WhatsApp
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Client link preview modal ─────────────────────────────────────────────────

function ClientLinkPreviewModal({
  title, subtitle, url, icon, onClose,
}: {
  title: string; subtitle: string; url: string; icon: string; onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: "92vh" }}>
        {/* Header */}
        <div className="bg-teal-700 px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <span className="text-xl">{icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
            <p className="text-xs text-teal-200 mt-0.5 truncate">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-teal-300 hover:text-white transition-colors p-1 flex-shrink-0">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* URL bar */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 flex-shrink-0">
          <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px] text-slate-400 flex-shrink-0">link</span>
            <span className="text-xs text-slate-500 font-mono truncate flex-1">{url}</span>
          </div>
          <button
            onClick={copy}
            data-testid="button-copy-client-link"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
              copied
                ? "bg-teal-600 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-700"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">{copied ? "check" : "content_copy"}</span>
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-700 text-white rounded-lg text-xs font-bold hover:bg-teal-600 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            Abrir
          </a>
        </div>

        {/* iframe preview */}
        <div className="flex-1 relative overflow-hidden min-h-0">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">Cargando vista del cliente…</p>
              </div>
            </div>
          )}
          <iframe
            src={url}
            onLoad={() => setIframeLoaded(true)}
            className="w-full h-full border-0"
            style={{ minHeight: 420 }}
            title="Vista previa del cliente"
          />
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2 flex-shrink-0">
          <span className="material-symbols-outlined text-[14px] text-slate-400">info</span>
          <p className="text-[10px] text-slate-400">Esta es la vista exacta que verá el cliente al abrir el enlace.</p>
        </div>
      </div>
    </div>
  );
}

// ── Presupuesto modal ────────────────────────────────────────────────────────

function PresupuestoModal({ cert, onClose }: { cert: any; onClose: () => void }) {
  const [finalPrice, setFinalPrice] = useState(cert.finalPrice ?? "");
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [err, setErr]               = useState("");

  // Suggested price state
  const [suggestion, setSuggestion]     = useState<any>(null);
  const [suggestLoading, setSuggestLoading] = useState(true);

  // Fetch price suggestion on mount
  useEffect(() => {
    const fetchSuggestion = async () => {
      try {
        const res = await fetch(`/api/certifications/${cert.id}/suggest-price`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestion(data);
          // Only pre-fill if price is not set yet
          if (!cert.finalPrice && data.suggestedPrice) {
            setFinalPrice(String(data.suggestedPrice));
          }
        }
      } catch { /* ignore */ }
      setSuggestLoading(false);
    };
    fetchSuggestion();
  }, [cert.id, cert.finalPrice]);

  const send = async () => {
    if (!finalPrice) return;
    setLoading(true);
    setErr("");
    try {
      const deliveryDays = suggestion?.matchedRate?.deliveryDays ?? undefined;
      await apiRequest("POST", `/api/certifications/${cert.id}/generate-presupuesto`, {
        finalPrice,
        ...(deliveryDays ? { plazoEntregaDias: deliveryDays } : {}),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      setDone(true);
    } catch {
      setErr("No se pudo generar el presupuesto.");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-teal-700 px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Enviar presupuesto</h3>
            {cert.ownerName && <p className="text-xs text-teal-200 mt-0.5">{cert.ownerName}</p>}
          </div>
          <button onClick={onClose} className="text-teal-300 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {done ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <p className="font-bold text-slate-800 text-lg">Presupuesto enviado</p>
              <p className="text-sm text-slate-500 mt-1">El cliente recibirá el enlace por email para aceptarlo o solicitar cambios.</p>
              <button onClick={onClose} className="mt-5 px-6 py-2 bg-teal-700 text-white rounded-xl text-sm font-semibold hover:bg-teal-600">
                Cerrar
              </button>
            </div>
          ) : (
            <>
              {/* Suggested price section */}
              {suggestLoading ? (
                <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <p className="text-xs text-slate-500">Calculando precio sugerido…</p>
                </div>
              ) : suggestion?.hasRate ? (
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-teal-600">Precio sugerido según tarifas</p>
                      <p className="text-2xl font-black text-teal-800 mt-0.5">{fmt(suggestion.suggestedPrice)} €</p>
                    </div>
                    <button
                      onClick={() => setFinalPrice(String(suggestion.suggestedPrice))}
                      className="text-[10px] font-bold bg-teal-600 text-white px-2.5 py-1 rounded-full hover:bg-teal-700 transition-colors whitespace-nowrap"
                    >
                      Usar este precio
                    </button>
                  </div>
                  {/* Breakdown */}
                  <div className="border-t border-teal-200 pt-3 space-y-1.5 text-xs text-teal-700">
                    <div className="flex justify-between">
                      <span>Precio base ({suggestion.matchedRate.propertyType})</span>
                      <span className="font-semibold">{fmt(suggestion.breakdown.basePrice)} €</span>
                    </div>
                    {suggestion.breakdown.surchargeArea > 0 && (
                      <div className="flex justify-between text-teal-600">
                        <span>Ajuste por superficie</span>
                        <span>+{fmt(suggestion.breakdown.surchargeArea)} €</span>
                      </div>
                    )}
                    {suggestion.breakdown.surchargeProvince > 0 && (
                      <div className="flex justify-between text-teal-600">
                        <span>Recargo provincia ({suggestion.breakdown.province})</span>
                        <span>+{fmt(suggestion.breakdown.surchargeProvince)} €</span>
                      </div>
                    )}
                    {suggestion.breakdown.m2Addition > 0 && (
                      <div className="flex justify-between text-teal-600">
                        <span>Por m² ({suggestion.breakdown.totalArea} m² × {fmt(suggestion.breakdown.pricePerM2)} €)</span>
                        <span>+{fmt(suggestion.breakdown.m2Addition)} €</span>
                      </div>
                    )}
                    {suggestion.propertyInfo.totalArea && (
                      <p className="text-teal-500 text-[10px] pt-0.5">
                        Superficie: {suggestion.propertyInfo.totalArea} m²
                        {suggestion.propertyInfo.province ? ` · ${suggestion.propertyInfo.province}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              ) : suggestion && !suggestion.hasRate ? (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
                  <p className="font-semibold">Sin tarifas configuradas</p>
                  <p className="text-xs mt-0.5">{suggestion.message}</p>
                  <a href="/tarifas" className="text-xs font-bold text-teal-700 underline mt-1 inline-block">
                    Ir a Ajustes → Tarifas →
                  </a>
                </div>
              ) : null}

              {/* Price input */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                  Precio final (€, IVA incluido) *
                  <span className="ml-1 text-[10px] font-normal text-slate-400 normal-case">(puedes modificarlo)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">€</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={finalPrice}
                    onChange={e => setFinalPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-teal-300 focus:border-teal-300 outline-none"
                    placeholder="0.00"
                    data-testid="input-final-price"
                  />
                </div>
                {suggestion?.matchedRate?.deliveryDays && (
                  <p className="text-xs text-slate-400 mt-1.5">
                    Plazo de entrega según tarifa: <strong>{suggestion.matchedRate.deliveryDays} días laborables</strong>
                  </p>
                )}
              </div>

              {err && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">{err}</div>
              )}

              <button
                onClick={send}
                disabled={!finalPrice || loading}
                className="w-full py-3.5 bg-teal-700 text-white rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-teal-600 transition-colors"
                data-testid="button-send-presupuesto"
              >
                {loading ? "Enviando…" : "Enviar presupuesto al cliente →"}
              </button>

              <p className="text-center text-xs text-slate-400">
                El cliente recibirá un enlace para aceptar o solicitar cambios
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Form status badge ────────────────────────────────────────────────────────

function FormStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const styles: Record<string, string> = {
    enviado: "bg-blue-50 text-blue-700 border border-blue-100",
    abierto: "bg-orange-50 text-orange-700 border border-orange-100",
    completado: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  };
  const labels: Record<string, string> = {
    enviado: "Enlace enviado",
    abierto: "Abierto",
    completado: "✓ Completado",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ── Generate link modal ──────────────────────────────────────────────────────

function LinkModal({ cert, onClose }: { cert: any; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("POST", `/api/certifications/${cert.id}/generate-link`);
      setUrl(data.url);
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
    } catch {
      setError("No se pudo generar el enlace. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const whatsapp = () => {
    if (!url) return;
    const name = cert.ownerName ? ` para ${cert.ownerName}` : "";
    const text = encodeURIComponent(
      `Hola! Te envío el enlace para rellenar los datos de tu certificado energético${name}:\n\n${url}\n\nSolo te llevará unos minutos. ¡Gracias!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  // Auto-generate on open if no url yet
  if (!url && !loading && !error) {
    generate();
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-emerald-50 px-6 py-5 flex items-center justify-between border-b border-emerald-100">
          <div>
            <h3 className="text-base font-bold text-emerald-900">Enlace para el propietario</h3>
            {cert.ownerName && <p className="text-xs text-emerald-700/60 mt-0.5">{cert.ownerName}</p>}
          </div>
          <button onClick={onClose} className="text-emerald-700/40 hover:text-emerald-900 transition-colors">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600">
            Envía este enlace al propietario. Podrá rellenar sus datos desde el móvil{" "}
            <strong>sin crear ninguna cuenta</strong>.
          </p>

          {loading && (
            <div className="flex items-center gap-3 py-4">
              <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Generando enlace…</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {url && (
            <>
              {/* URL display */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">link</span>
                <p className="text-xs text-gray-600 break-all flex-1">{url}</p>
              </div>

              {/* State badge */}
              {cert.formStatus && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Estado actual:</span>
                  <FormStatusBadge status={cert.formStatus} />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={copy}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-800 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copied ? "check_circle" : "content_copy"}
                  </span>
                  {copied ? "¡Copiado!" : "Copiar enlace"}
                </button>
                <button
                  onClick={whatsapp}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors"
                >
                  <span className="text-base">📲</span>
                  Enviar por WhatsApp
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Certification form ───────────────────────────────────────────────────────

function CertificationForm({ onClose, cert }: { onClose: () => void; cert?: any }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    ownerName: cert?.ownerName || "",
    ownerEmail: cert?.ownerEmail || "",
    ownerPhone: cert?.ownerPhone || "",
    ownerDni: cert?.ownerDni || "",
    address: cert?.address || "",
    city: cert?.city || "",
    postalCode: cert?.postalCode || "",
    province: cert?.province || "",
    cadastralReference: cert?.cadastralReference || "",
    propertyType: cert?.propertyType || "",
    constructionYear: cert?.constructionYear || "",
    totalArea: cert?.totalArea || "",
    status: cert?.status || "Nuevo",
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => cert
      ? apiRequest("PUT", `/api/certifications/${cert.id}`, data)
      : apiRequest("POST", "/api/certifications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      onClose();
    },
  });

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const steps = [
    { num: 1, label: "Cliente" },
    { num: 2, label: "Inmueble" },
    { num: 3, label: "Confirmar" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl flex flex-col max-h-[95vh]">
        <div className="bg-emerald-50 px-5 sm:px-8 py-5 sm:py-6 flex items-center justify-between border-b border-emerald-100 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-emerald-900">{cert ? "Editar certificación" : "Nueva certificación"}</h3>
            <p className="text-xs text-emerald-700/60 mt-0.5">Paso {step} de 3</p>
          </div>
          <div className="flex items-center gap-2">
            {steps.map(s => (
              <div key={s.num} className="flex items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s.num < step ? "bg-emerald-700 text-white" :
                  s.num === step ? "bg-emerald-800 text-white ring-4 ring-emerald-200" :
                  "bg-emerald-100 text-emerald-500"
                }`}>{s.num < step ? "✓" : s.num}</div>
                {s.num < 3 && <div className={`w-8 h-0.5 ${s.num < step ? "bg-emerald-700" : "bg-emerald-100"}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-8 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mb-4">Datos del propietario</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Nombre completo *</label>
                  <input
                    data-testid="input-ownerName"
                    value={form.ownerName}
                    onChange={e => update("ownerName", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="María García López"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Email</label>
                  <input
                    data-testid="input-ownerEmail"
                    value={form.ownerEmail}
                    onChange={e => update("ownerEmail", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="maria@email.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Teléfono</label>
                  <input
                    data-testid="input-ownerPhone"
                    value={form.ownerPhone}
                    onChange={e => update("ownerPhone", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="+34 600 000 000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">DNI/NIF</label>
                  <input
                    data-testid="input-ownerDni"
                    value={form.ownerDni}
                    onChange={e => update("ownerDni", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="12345678A"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mb-4">Datos del inmueble</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Dirección *</label>
                  <input
                    data-testid="input-address"
                    value={form.address}
                    onChange={e => update("address", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="Calle Mayor 1, 1º A"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Ciudad</label>
                  <input
                    data-testid="input-city"
                    value={form.city}
                    onChange={e => update("city", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="Madrid"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Código postal</label>
                  <input
                    data-testid="input-postalCode"
                    value={form.postalCode}
                    onChange={e => update("postalCode", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="28001"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Tipo de inmueble</label>
                  <select
                    data-testid="select-propertyType"
                    value={form.propertyType}
                    onChange={e => update("propertyType", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Año de construcción</label>
                  <input
                    data-testid="input-constructionYear"
                    value={form.constructionYear}
                    onChange={e => update("constructionYear", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="1985"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Superficie (m²)</label>
                  <input
                    data-testid="input-totalArea"
                    value={form.totalArea}
                    onChange={e => update("totalArea", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="85"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Referencia catastral</label>
                  <input
                    data-testid="input-cadastralReference"
                    value={form.cadastralReference}
                    onChange={e => update("cadastralReference", e.target.value)}
                    className="w-full bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
                    placeholder="7837298VK4873N0001RR"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mb-4">Revisión y estado</h4>
              <div className="bg-emerald-50 rounded-xl p-6 space-y-3">
                {[
                  { label: "Propietario", value: form.ownerName },
                  { label: "Dirección", value: `${form.address}, ${form.city}` },
                  { label: "Tipo", value: form.propertyType },
                  { label: "Superficie", value: form.totalArea ? `${form.totalArea} m²` : "" },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">{row.label}</span>
                    <span className="text-sm font-semibold text-emerald-900">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Estado inicial</label>
                <div className="flex gap-3">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      data-testid={`status-${s}`}
                      onClick={() => update("status", s)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all ${
                        form.status === s
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-emerald-100 text-emerald-700 hover:border-emerald-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 sm:px-8 py-4 sm:py-5 bg-emerald-50/50 border-t border-emerald-100 flex items-center justify-between flex-shrink-0">
          <button
            onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
            className="px-5 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors min-h-[44px]"
          >
            {step === 1 ? "Cancelar" : "← Atrás"}
          </button>
          {step < 3 ? (
            <button
              data-testid="btn-next-step"
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && !form.ownerName}
              className="px-6 py-3 bg-emerald-800 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-all shadow-sm min-h-[44px]"
            >
              Siguiente →
            </button>
          ) : (
            <button
              data-testid="btn-save-cert"
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending}
              className="px-6 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {createMutation.isPending ? "Guardando..." : cert ? "Guardar cambios" : "Crear certificación"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Communications drawer ────────────────────────────────────────────────────

const CANAL_ICON: Record<string, string> = { whatsapp: "📱", email: "✉️" };
const ESTADO_STYLE: Record<string, string> = {
  enviado:    "bg-blue-50 text-blue-700",
  entregado:  "bg-teal-50 text-teal-700",
  leido:      "bg-emerald-50 text-emerald-700",
  fallido:    "bg-red-50 text-red-700",
};
const MSG_TIPO_LABEL: Record<string, string> = {
  "1": "Formulario de tasación",
  "2": "Recordatorio tasación",
  "3": "Presupuesto listo",
  "4": "Confirmación de pago",
  "5": "Formulario CEE",
  "6": "Recordatorio CEE",
  "7": "Solicitud pago final",
  "8": "Entrega certificado",
  manual: "Mensaje manual",
};

function CommunicationsDrawer({ cert, onClose }: { cert: any; onClose: () => void }) {
  const { data: msgs, refetch } = useQuery<any[]>({
    queryKey: [`/api/certifications/${cert.id}/mensajes`],
  });

  const [showManual, setShowManual] = useState(false);
  const [manualText, setManualText] = useState("");
  const [sending, setSending] = useState(false);

  const sendManual = async () => {
    if (!manualText.trim()) return;
    setSending(true);
    try {
      await apiRequest("POST", `/api/certifications/${cert.id}/mensajes`, { texto: manualText });
      setManualText("");
      setShowManual(false);
      refetch();
    } finally {
      setSending(false);
    }
  };

  const retry = async (msgId: number) => {
    await apiRequest("POST", `/api/certifications/${cert.id}/mensajes/${msgId}/retry`);
    refetch();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-50 px-6 py-5 flex items-center justify-between border-b border-emerald-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-emerald-900">Comunicaciones</h3>
            <p className="text-xs text-emerald-700/60 mt-0.5">{cert.ownerName ?? "Sin nombre"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManual(true)}
              className="px-3 py-1.5 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
            >
              + Mensaje
            </button>
            <button onClick={onClose} className="text-emerald-700/40 hover:text-emerald-900 p-1">
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
        </div>

        {/* Manual message form */}
        {showManual && (
          <div className="px-6 py-4 bg-stone-50 border-b border-stone-100 flex-shrink-0">
            <p className="text-xs font-bold text-stone-600 uppercase tracking-widest mb-2">Mensaje libre</p>
            <textarea
              rows={3}
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              placeholder="Escribe tu mensaje…"
              className="w-full text-sm bg-white border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
            />
            <div className="flex gap-2 mt-2">
              <button onClick={() => { setShowManual(false); setManualText(""); }}
                className="px-3 py-1.5 text-stone-500 text-xs font-semibold hover:bg-stone-200 rounded-lg">
                Cancelar
              </button>
              <button onClick={sendManual} disabled={!manualText.trim() || sending}
                className="px-4 py-1.5 bg-emerald-800 text-white text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-emerald-700">
                {sending ? "Enviando…" : "Enviar →"}
              </button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {!msgs || msgs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-emerald-900 font-semibold text-sm">Sin comunicaciones</p>
              <p className="text-xs text-emerald-700/50 mt-1">Los mensajes enviados aparecerán aquí.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {msgs.map((msg: any) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{CANAL_ICON[msg.canal] ?? "💬"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-wider">
                        {MSG_TIPO_LABEL[msg.tipoMensaje] ?? msg.tipoMensaje ?? "Mensaje"}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${ESTADO_STYLE[msg.estado] ?? "bg-stone-100 text-stone-600"}`}>
                        {msg.estado}
                      </span>
                      <span className="text-[10px] text-stone-400 ml-auto">
                        {new Date(msg.fechaEnvio).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">{msg.contenido}</p>
                    {msg.errorDetalle && (
                      <p className="text-[10px] text-red-500 mt-1">⚠ {msg.errorDetalle}</p>
                    )}
                    {msg.estado === "fallido" && (
                      <button
                        onClick={() => retry(msg.id)}
                        className="mt-1.5 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                      >
                        Reintentar →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function Certifications() {
  const [showForm, setShowForm] = useState(false);
  const [editCert, setEditCert] = useState<any>(null);
  const [linkCert, setLinkCert] = useState<any>(null);
  const [solicitudCert, setSolicitudCert] = useState<any>(null);
  const [presupuestoCert, setPresupuestoCert] = useState<any>(null);
  const [commsCert, setCommsCert] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [dataCert, setDataCert] = useState<any>(null);
  const [previewLink, setPreviewLink] = useState<{ title: string; subtitle: string; url: string; icon: string } | null>(null);

  const { data: certifications, isLoading } = useQuery<any[]>({ queryKey: ["/api/certifications"] });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/certifications/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/certifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const ceeFormMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/certifications/${id}/generate-cee-form`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/certifications"] }),
  });

  const allCerts = Array.isArray(certifications) ? certifications : [];

  const filtered = allCerts.filter(c => {
    const matchStatus = statusFilter === "Todos" || c.status === statusFilter;
    const matchSearch = !search || [c.ownerName, c.address, c.cadastralReference]
      .some((v: string) => v?.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Nuevo": return "bg-blue-50 text-blue-700 border border-blue-100";
      case "En Proceso": return "bg-orange-50 text-orange-700 border border-orange-100";
      case "Finalizado": return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      default: return "bg-gray-50 text-gray-600 border border-gray-100";
    }
  };

  const getDotColor = (status: string) => {
    switch (status) {
      case "Nuevo": return "bg-blue-500";
      case "En Proceso": return "bg-orange-500";
      case "Finalizado": return "bg-emerald-600";
      default: return "bg-gray-400";
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {(showForm || editCert) && (
        <CertificationForm
          cert={editCert}
          onClose={() => { setShowForm(false); setEditCert(null); }}
        />
      )}

      {linkCert && (
        <LinkModal cert={linkCert} onClose={() => setLinkCert(null)} />
      )}

      {solicitudCert && (
        <SolicitudModal cert={solicitudCert} onClose={() => setSolicitudCert(null)} />
      )}

      {presupuestoCert && (
        <PresupuestoModal cert={presupuestoCert} onClose={() => setPresupuestoCert(null)} />
      )}

      {commsCert && (
        <CommunicationsDrawer cert={commsCert} onClose={() => setCommsCert(null)} />
      )}

      {dataCert && (
        <CertDataDrawer certId={dataCert.id} onClose={() => setDataCert(null)} />
      )}

      {previewLink && (
        <ClientLinkPreviewModal
          title={previewLink.title}
          subtitle={previewLink.subtitle}
          url={previewLink.url}
          icon={previewLink.icon}
          onClose={() => setPreviewLink(null)}
        />
      )}

      <div className="flex flex-wrap items-start sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-900 tracking-tight">Visión operacional</h1>
          <p className="text-sm text-emerald-700/60 mt-1 font-medium">Gestiona y realiza el seguimiento de tus certificaciones CEE.</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 mb-1">Total certificados</p>
          <p className="text-3xl font-bold text-emerald-800 tracking-tighter">{allCerts.length.toLocaleString("es-ES")}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 min-w-0">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 text-[20px]">search</span>
          <input
            data-testid="input-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, dirección o referencia catastral..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 px-1 block">Estado</label>
            <select
              data-testid="select-status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-emerald-100 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <option>Todos</option>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_32px_rgba(0,100,44,0.06)] border border-emerald-100/60 overflow-hidden">
        {/* Horizontal scroll on mobile */}
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[560px]">
          <thead>
            <tr className="bg-emerald-50/50 border-b border-emerald-100/60">
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Cliente</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Inmueble</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 hidden md:table-cell">Fecha</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Estado</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 hidden lg:table-cell">Flujo</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-8 py-16 text-center">
                  <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-16 text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-emerald-400 text-[32px]">verified</span>
                  </div>
                  <p className="font-semibold text-emerald-900 mb-1">
                    {search || statusFilter !== "Todos" ? "Sin resultados" : "Sin certificaciones"}
                  </p>
                  <p className="text-sm text-emerald-700/50">
                    {search || statusFilter !== "Todos" ? "Prueba otros filtros" : "Crea tu primera certificación energética"}
                  </p>
                  {!search && statusFilter === "Todos" && (
                    <button
                      data-testid="btn-create-first"
                      onClick={() => setShowForm(true)}
                      className="mt-4 px-6 py-2.5 bg-emerald-800 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      + Nueva certificación
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((cert: any) => {
                const initials = (cert.ownerName || "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <tr key={cert.id} data-testid={`row-cert-${cert.id}`} className="hover:bg-emerald-50/30 transition-colors relative">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-800 font-bold text-xs flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-900 text-sm">{cert.ownerName || "-"}</p>
                          {cert.ownerEmail && <p className="text-xs text-emerald-700/50">{cert.ownerEmail}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm text-emerald-800 font-medium">{cert.address || "-"}</p>
                      {cert.propertyType && <p className="text-xs text-emerald-700/50 mt-0.5">{cert.propertyType}</p>}
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-emerald-800 hidden md:table-cell">{formatDate(cert.createdAt)}</td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(cert.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(cert.status)}`} />
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 hidden lg:table-cell">
                      <div className="flex flex-col gap-1">
                        {cert.workflowStatus && cert.workflowStatus !== "nuevo"
                          ? <WorkflowBadge status={cert.workflowStatus} />
                          : cert.formStatus
                            ? <FormStatusBadge status={cert.formStatus} />
                            : null
                        }
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right relative">
                      <div className="flex items-center justify-end gap-1">
                        {/* Preview: presupuesto */}
                        {cert.presupuestoToken && (
                          <button
                            data-testid={`btn-preview-presupuesto-${cert.id}`}
                            title="Ver enlace de tarifa (vista cliente)"
                            onClick={() => {
                              setPreviewLink({
                                title: "Vista previa: Presupuesto",
                                subtitle: cert.ownerName ? `Para ${cert.ownerName}` : "Vista del cliente",
                                url: `${window.location.origin}/presupuesto/${cert.presupuestoToken}`,
                                icon: "💰",
                              });
                              setOpenMenu(null);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-50 border border-violet-100 text-violet-700 rounded-lg text-[11px] font-bold hover:bg-violet-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[13px]">visibility</span>
                            <span className="hidden sm:inline">Tarifa</span>
                          </button>
                        )}
                        {/* Preview: formulario CEE */}
                        {cert.ceeToken && (
                          <button
                            data-testid={`btn-preview-cee-${cert.id}`}
                            title="Ver enlace del formulario CEE (vista cliente)"
                            onClick={() => {
                              setPreviewLink({
                                title: "Vista previa: Formulario CEE",
                                subtitle: cert.ownerName ? `Para ${cert.ownerName}` : "Vista del cliente",
                                url: `${window.location.origin}/formulario-cee/${cert.ceeToken}`,
                                icon: "📋",
                              });
                              setOpenMenu(null);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 border border-teal-100 text-teal-700 rounded-lg text-[11px] font-bold hover:bg-teal-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[13px]">visibility</span>
                            <span className="hidden sm:inline">CEE</span>
                          </button>
                        )}
                        {/* Preview: solicitud (tasación) */}
                        {cert.solicitudToken && (
                          <button
                            data-testid={`btn-preview-solicitud-${cert.id}`}
                            title="Ver enlace del formulario de tasación (vista cliente)"
                            onClick={() => {
                              setPreviewLink({
                                title: "Vista previa: Formulario de tasación",
                                subtitle: cert.ownerName ? `Para ${cert.ownerName}` : "Vista del cliente",
                                url: `${window.location.origin}/solicitud/${cert.solicitudToken}`,
                                icon: "📝",
                              });
                              setOpenMenu(null);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[13px]">visibility</span>
                            <span className="hidden sm:inline">Tasación</span>
                          </button>
                        )}
                        <button
                          data-testid={`btn-menu-${cert.id}`}
                          onClick={() => setOpenMenu(openMenu === cert.id ? null : cert.id)}
                          className="p-2 hover:bg-emerald-100 rounded-xl transition-colors text-emerald-700/60 hover:text-emerald-900"
                        >
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                      </div>
                      {openMenu === cert.id && (
                        <div className="absolute right-6 top-14 bg-white border border-emerald-100 rounded-xl shadow-xl z-10 min-w-[200px] overflow-hidden">
                          <button
                            data-testid={`btn-edit-${cert.id}`}
                            onClick={() => { setEditCert(cert); setOpenMenu(null); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-emerald-800 hover:bg-emerald-50 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Editar
                          </button>
                          <button
                            onClick={() => { setLinkCert(cert); setOpenMenu(null); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-emerald-800 hover:bg-emerald-50 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">link</span>
                            {cert.formToken ? "Ver enlace CEE clásico" : "Enlace formulario clásico"}
                          </button>
                          {/* Preview links section */}
                          {(cert.presupuestoToken || cert.ceeToken || cert.solicitudToken) && (
                            <>
                              <div className="border-t border-emerald-50 px-4 py-2">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-700/40">Vista previa enlace cliente</p>
                              </div>
                              {cert.presupuestoToken && (
                                <button
                                  data-testid={`btn-menu-preview-presupuesto-${cert.id}`}
                                  onClick={() => {
                                    setPreviewLink({
                                      title: "Vista previa: Presupuesto",
                                      subtitle: cert.ownerName ? `Para ${cert.ownerName}` : "Vista del cliente",
                                      url: `${window.location.origin}/presupuesto/${cert.presupuestoToken}`,
                                      icon: "💰",
                                    });
                                    setOpenMenu(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-violet-700 hover:bg-violet-50 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                                  👁 Ver enlace de tarifa
                                </button>
                              )}
                              {cert.ceeToken && (
                                <button
                                  data-testid={`btn-menu-preview-cee-${cert.id}`}
                                  onClick={() => {
                                    setPreviewLink({
                                      title: "Vista previa: Formulario CEE",
                                      subtitle: cert.ownerName ? `Para ${cert.ownerName}` : "Vista del cliente",
                                      url: `${window.location.origin}/formulario-cee/${cert.ceeToken}`,
                                      icon: "📋",
                                    });
                                    setOpenMenu(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-teal-700 hover:bg-teal-50 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                                  👁 Ver enlace formulario CEE
                                </button>
                              )}
                              {cert.solicitudToken && (
                                <button
                                  data-testid={`btn-menu-preview-solicitud-${cert.id}`}
                                  onClick={() => {
                                    setPreviewLink({
                                      title: "Vista previa: Formulario de tasación",
                                      subtitle: cert.ownerName ? `Para ${cert.ownerName}` : "Vista del cliente",
                                      url: `${window.location.origin}/solicitud/${cert.solicitudToken}`,
                                      icon: "📝",
                                    });
                                    setOpenMenu(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                                  👁 Ver enlace formulario tasación
                                </button>
                              )}
                            </>
                          )}
                          <div className="border-t border-emerald-50 px-4 py-2">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-700/40">Flujo de certificación</p>
                          </div>
                          <button
                            onClick={() => { setSolicitudCert(cert); setOpenMenu(null); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-emerald-800 hover:bg-emerald-50 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">assignment</span>
                            Enviar formulario de tasación
                          </button>
                          <button
                            onClick={() => { setPresupuestoCert(cert); setOpenMenu(null); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-emerald-800 hover:bg-emerald-50 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">request_quote</span>
                            Enviar presupuesto
                          </button>
                          <button
                            onClick={() => { ceeFormMutation.mutate(cert.id); setOpenMenu(null); }}
                            disabled={ceeFormMutation.isPending}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-emerald-800 hover:bg-emerald-50 disabled:opacity-40 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">energy_program_saving</span>
                            Enviar formulario CEE
                          </button>
                          {(cert.workflowStatus === "formulario_cee_completado" || cert.formData?.ceeDetallado) && (
                            <button
                              onClick={() => { setDataCert(cert); setOpenMenu(null); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-teal-700 hover:bg-teal-50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">fact_check</span>
                              Ver datos técnicos CEE
                            </button>
                          )}
                          <div className="border-t border-emerald-50 px-4 py-2">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-700/40">Comunicación</p>
                          </div>
                          <button
                            onClick={() => { setCommsCert(cert); setOpenMenu(null); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-emerald-800 hover:bg-emerald-50 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">chat</span>
                            Ver comunicaciones
                          </button>
                          {cert.status === "Finalizado" && !cert.isArchived && (
                            <button
                              data-testid={`btn-archive-${cert.id}`}
                              onClick={() => { archiveMutation.mutate(cert.id); setOpenMenu(null); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-emerald-800 hover:bg-emerald-50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">folder</span>
                              Archivar
                            </button>
                          )}
                          <button
                            data-testid={`btn-delete-${cert.id}`}
                            onClick={() => {
                              if (window.confirm("¿Eliminar esta certificación?")) {
                                deleteMutation.mutate(cert.id);
                              }
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-emerald-50"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>{/* /overflow-x-auto */}
        {filtered.length > 0 && (
          <div className="px-4 sm:px-8 py-4 border-t border-emerald-50 flex items-center justify-between">
            <p className="text-xs text-emerald-700/60 font-medium">
              Mostrando {filtered.length} de {allCerts.length} certificaciones
            </p>
            <button
              data-testid="btn-nueva-cert"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Nueva
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
