import { useState, useEffect } from "react";

interface Props { token: string }

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  vivienda: "Vivienda / Piso",
  piso: "Piso / Apartamento",
  unifamiliar: "Vivienda unifamiliar",
  chalet: "Chalet / Casa unifamiliar",
  local_comercial: "Local comercial",
  duplex: "Dúplex",
  edificio_completo: "Edificio completo",
  oficinas: "Oficinas",
  industrial: "Industrial / Nave",
  garaje: "Garaje / Aparcamiento",
};

function formatPropertyType(raw: string | null | undefined) {
  if (!raw) return null;
  return PROPERTY_TYPE_LABELS[raw.toLowerCase().replace(/\s+/g, "_")] ?? raw;
}

const SERVICE_INCLUDES = [
  "Certificado oficial de eficiencia energética (CEE)",
  "Etiqueta energética en formato digital",
  "Registro en el organismo autonómico competente",
  "Informe técnico en formato PDF",
  "Asistencia técnica durante el proceso",
];

export default function PublicPresupuesto({ token }: Props) {
  const [loading, setLoading]         = useState(true);
  const [data, setData]               = useState<any>(null);
  const [error, setError]             = useState("");
  const [status, setStatus]           = useState<"pending" | "accepted" | "modification" | "done">("pending");
  const [modMotivo, setModMotivo]     = useState("");
  const [showModForm, setShowModForm] = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    fetch(`/api/presupuesto/${token}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => {
        setData(d);
        if (d.status === "aceptado") setStatus("accepted");
        else if (d.status === "modificacion_solicitada") setStatus("modification");
        setLoading(false);
      })
      .catch(() => { setError("Presupuesto no encontrado o enlace inválido."); setLoading(false); });
  }, [token]);

  const accept = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/presupuesto/${token}/aceptar`, { method: "POST" });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setStatus("accepted");
      if (d.paymentToken) {
        setTimeout(() => { window.location.href = `/pay/${d.paymentToken}`; }, 2000);
      }
    } catch {
      setError("Error al aceptar el presupuesto. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const requestMod = async () => {
    if (!modMotivo.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`/api/presupuesto/${token}/modificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: modMotivo }),
      });
      setStatus("modification");
    } catch {
      setError("Error al enviar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error && !data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl border border-slate-100">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📄</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Presupuesto no disponible</h2>
        <p className="text-slate-500 text-sm">{error}</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { cert, certifier } = data;
  const amount = parseFloat(cert.finalPrice ?? "0");
  const tramo1 = parseFloat(cert.tramo1Amount ?? "0");
  const tramo2 = parseFloat(cert.tramo2Amount ?? "0");
  const typeLabel = formatPropertyType(cert.propertyType);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* ── Header ── */}
      <div className="bg-teal-700 text-white">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Certifive brand */}
          <div className="flex items-center gap-2 mb-5 opacity-80">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white text-[11px] font-black">C5</span>
            </div>
            <span className="font-bold text-sm tracking-wide">CERTIFIVE</span>
          </div>
          <h1 className="text-2xl font-black leading-tight">Presupuesto de certificación energética</h1>
          <p className="text-teal-200 text-sm mt-2 font-medium">
            {certifier.name}{certifier.company ? ` · ${certifier.company}` : ""}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-3 space-y-4 pb-8">

        {/* ── Status banners ── */}
        {status === "accepted" && (
          <div className="bg-teal-600 text-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-sm">Presupuesto aceptado</p>
              <p className="text-xs text-teal-100">Redirigiendo a la página de pago…</p>
            </div>
          </div>
        )}
        {status === "modification" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">✏️</span>
            <div>
              <p className="font-bold text-sm text-amber-800">Modificación solicitada</p>
              <p className="text-xs text-amber-700">El certificador revisará tu solicitud y te enviará un presupuesto actualizado.</p>
            </div>
          </div>
        )}

        {/* ── Price hero card ── */}
        <div className="bg-teal-700 text-white rounded-3xl p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-300 mb-1">Precio total del servicio</p>
          <p className="text-5xl font-black tracking-tight leading-none mt-1">{amount.toFixed(2)} <span className="text-2xl font-bold text-teal-300">€</span></p>
          <p className="text-teal-300 text-xs mt-2">IVA incluido</p>

          {(tramo1 > 0 || tramo2 > 0) && (
            <div className="mt-5 border-t border-teal-600 pt-4 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-300 mb-2">Forma de pago</p>
              {tramo1 > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-teal-500/40 flex items-center justify-center text-[10px] font-bold">1</div>
                    <span className="text-sm text-teal-100">Pago inicial (inicio del servicio)</span>
                  </div>
                  <span className="font-bold text-base">{tramo1.toFixed(2)} €</span>
                </div>
              )}
              {tramo2 > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-teal-500/40 flex items-center justify-center text-[10px] font-bold">2</div>
                    <span className="text-sm text-teal-100">Pago final (entrega del certificado)</span>
                  </div>
                  <span className="font-bold text-base">{tramo2.toFixed(2)} €</span>
                </div>
              )}
            </div>
          )}

          {cert.plazoEntregaDias && (
            <div className="mt-4 flex items-center gap-1.5">
              <span className="text-teal-400 text-xs">⏱</span>
              <p className="text-xs text-teal-300">Plazo estimado de entrega: <strong className="text-teal-200">{cert.plazoEntregaDias} días laborables</strong></p>
            </div>
          )}
        </div>

        {/* ── Property data ── */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Datos del inmueble</p>
          <div className="space-y-3">
            {[
              { icon: "🏠", label: "Propietario",         value: cert.ownerName },
              { icon: "📍", label: "Dirección",           value: cert.address ? `${cert.address}${cert.city ? `, ${cert.city}` : ""}` : null },
              { icon: "🗺",  label: "Provincia",           value: cert.province },
              { icon: "🏗",  label: "Tipo de inmueble",   value: typeLabel },
              { icon: "📐", label: "Superficie",          value: cert.totalArea ? `${parseFloat(cert.totalArea).toFixed(0)} m²` : null },
              { icon: "📅", label: "Año de construcción", value: cert.constructionYear },
              { icon: "📋", label: "Ref. Catastral",      value: cert.cadastralReference },
            ].filter(r => r.value).map(row => (
              <div key={row.label} className="flex items-start gap-3">
                <span className="text-base flex-shrink-0 mt-0.5">{row.icon}</span>
                <div className="flex-1 flex justify-between items-start gap-4 min-w-0">
                  <span className="text-xs text-slate-400 font-medium pt-0.5 flex-shrink-0">{row.label}</span>
                  <span className="text-sm font-semibold text-slate-800 text-right break-words">{row.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Service description ── */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">El servicio incluye</p>
          <div className="space-y-2.5">
            {SERVICE_INCLUDES.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal-700 text-[10px] font-black">✓</span>
                </div>
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Certifier card ── */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Tu certificador</p>
          <div className="space-y-1.5">
            <p className="font-bold text-slate-900 text-base">{certifier.name}</p>
            {certifier.company && <p className="text-sm text-slate-600">{certifier.company}</p>}
            {certifier.licenseNumber && (
              <p className="text-xs text-slate-400">Nº habilitación: <span className="font-medium text-slate-600">{certifier.licenseNumber}</span></p>
            )}
            {certifier.dniNif && (
              <p className="text-xs text-slate-400">NIF: <span className="font-medium text-slate-600">{certifier.dniNif}</span></p>
            )}
            {certifier.address && (
              <p className="text-xs text-slate-400">{certifier.address}{certifier.city ? `, ${certifier.city}` : ""}</p>
            )}
            <div className="flex gap-4 pt-2">
              {certifier.phone && (
                <a href={`tel:${certifier.phone}`} className="flex items-center gap-1.5 text-xs text-teal-700 font-semibold">
                  <span>📞</span> {certifier.phone}
                </a>
              )}
              {certifier.email && (
                <a href={`mailto:${certifier.email}`} className="flex items-center gap-1.5 text-xs text-teal-700 font-semibold">
                  <span>✉️</span> {certifier.email}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Conditions ── */}
        {certifier.condicionesServicio && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Condiciones del servicio</p>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{certifier.condicionesServicio}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── CTA actions ── */}
        {status === "pending" && !showModForm && (
          <div className="space-y-3 pt-2">
            <button
              onClick={accept}
              disabled={submitting}
              data-testid="button-accept-presupuesto"
              className="w-full py-4 bg-teal-700 text-white rounded-2xl font-bold text-base disabled:opacity-50 hover:bg-teal-600 transition-colors active:scale-[0.98] shadow-sm"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Procesando…
                </span>
              ) : "✅ Aceptar y continuar al pago →"}
            </button>
            <button
              onClick={() => setShowModForm(true)}
              className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              ✏️ Solicitar modificación
            </button>
          </div>
        )}

        {/* ── Modification form ── */}
        {showModForm && status === "pending" && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-800">¿Qué te gustaría cambiar?</h3>
            <p className="text-xs text-slate-500">El certificador recibirá tu mensaje y te enviará un presupuesto revisado.</p>
            <textarea
              value={modMotivo}
              onChange={e => setModMotivo(e.target.value)}
              placeholder="Describe los cambios que necesitas..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowModForm(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-2xl font-semibold text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={requestMod}
                disabled={!modMotivo.trim() || submitting}
                className="flex-1 py-3 bg-amber-600 text-white rounded-2xl font-semibold text-sm disabled:opacity-40 hover:bg-amber-700"
              >
                {submitting ? "Enviando…" : "Enviar solicitud"}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-xs text-slate-400">
            Presupuesto generado con <strong className="text-teal-600">CERTIFIVE</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
