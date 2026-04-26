import { useState, useEffect } from "react";

interface Props { token: string }

export default function PublicPresupuesto({ token }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"pending" | "accepted" | "modification" | "done">("pending");
  const [modMotivo, setModMotivo] = useState("");
  const [showModForm, setShowModForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      // Redirect to payment
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error && !data) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="text-4xl mb-4">📄</div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">Presupuesto no disponible</h2>
        <p className="text-stone-500 text-sm">{error}</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { cert, certifier } = data;
  const amount = parseFloat(cert.finalPrice ?? "0");
  const tramo1 = parseFloat(cert.tramo1Amount ?? "0");
  const tramo2 = parseFloat(cert.tramo2Amount ?? "0");

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 pb-8">
      {/* Header */}
      <div className="bg-emerald-800 text-white px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-4 opacity-70">
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white text-[10px] font-black">C5</span>
            </div>
            <span className="font-bold text-sm">CERTIFIVE</span>
          </div>
          <h1 className="text-2xl font-black leading-tight">Presupuesto de certificación energética</h1>
          <p className="text-emerald-200 text-sm mt-2">
            {certifier.name}{certifier.company ? ` · ${certifier.company}` : ""}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4 pb-8">

        {/* Status banner */}
        {status === "accepted" && (
          <div className="bg-emerald-600 text-white rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-sm">Presupuesto aceptado</p>
              <p className="text-xs text-emerald-100">Redirigiendo al pago…</p>
            </div>
          </div>
        )}
        {status === "modification" && (
          <div className="bg-amber-100 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">✏️</span>
            <div>
              <p className="font-bold text-sm text-amber-800">Modificación solicitada</p>
              <p className="text-xs text-amber-700">El certificador recibirá tu solicitud y te enviará un presupuesto revisado.</p>
            </div>
          </div>
        )}

        {/* Certifier info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Certificador</p>
          <div className="space-y-1.5">
            <p className="font-bold text-stone-900">{certifier.name}</p>
            {certifier.company && <p className="text-sm text-stone-600">{certifier.company}</p>}
            {certifier.licenseNumber && <p className="text-xs text-stone-400">Nº habilitación: {certifier.licenseNumber}</p>}
            {certifier.dniNif && <p className="text-xs text-stone-400">NIF: {certifier.dniNif}</p>}
            {certifier.address && <p className="text-xs text-stone-400">{certifier.address}{certifier.city ? `, ${certifier.city}` : ""}</p>}
            <div className="flex gap-3 pt-1">
              {certifier.phone && <a href={`tel:${certifier.phone}`} className="text-xs text-emerald-700 font-medium underline">{certifier.phone}</a>}
              {certifier.email && <a href={`mailto:${certifier.email}`} className="text-xs text-emerald-700 font-medium underline">{certifier.email}</a>}
            </div>
          </div>
        </div>

        {/* Property info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Inmueble</p>
          <div className="space-y-2">
            {[
              { label: "Propietario", value: cert.ownerName },
              { label: "Dirección", value: cert.address ? `${cert.address}${cert.city ? `, ${cert.city}` : ""}` : null },
              { label: "Provincia", value: cert.province },
              { label: "Tipo", value: cert.propertyType },
              { label: "Superficie", value: cert.totalArea ? `${parseFloat(cert.totalArea).toFixed(0)} m²` : null },
              { label: "Año", value: cert.constructionYear },
            ].filter(r => r.value).map(row => (
              <div key={row.label} className="flex justify-between items-start gap-4">
                <span className="text-xs text-stone-400 font-medium pt-0.5 flex-shrink-0">{row.label}</span>
                <span className="text-sm font-semibold text-stone-800 text-right">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-emerald-800 text-white rounded-3xl p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-4">Desglose del precio</p>
          <div className="space-y-3">
            {tramo1 > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-200">Primer pago (inicio del servicio)</span>
                <span className="font-bold">{tramo1.toFixed(2)} €</span>
              </div>
            )}
            {tramo2 > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-200">Segundo pago (entrega del certificado)</span>
                <span className="font-bold">{tramo2.toFixed(2)} €</span>
              </div>
            )}
            <div className="border-t border-emerald-700 pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-emerald-100">Total (IVA incluido)</span>
              <span className="text-3xl font-black tracking-tight">{amount.toFixed(2)} €</span>
            </div>
          </div>
          {cert.plazoEntregaDias && (
            <p className="text-xs text-emerald-400 mt-4">Plazo estimado de entrega: {cert.plazoEntregaDias} días laborables</p>
          )}
        </div>

        {/* Conditions */}
        {certifier.condicionesServicio && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Condiciones del servicio</p>
            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{certifier.condicionesServicio}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Actions */}
        {status === "pending" && !showModForm && (
          <div className="space-y-3">
            <button onClick={accept} disabled={submitting}
              className="w-full py-4 bg-emerald-700 text-white rounded-2xl font-bold text-base disabled:opacity-50 hover:bg-emerald-600 transition-colors active:scale-[0.98]">
              {submitting ? "Procesando…" : "✅ Aceptar y pagar →"}
            </button>
            <button onClick={() => setShowModForm(true)}
              className="w-full py-4 bg-white border border-stone-200 text-stone-600 rounded-2xl font-semibold text-sm hover:bg-stone-50 transition-colors">
              ✏️ Solicitar modificación
            </button>
          </div>
        )}

        {/* Modification form */}
        {showModForm && status === "pending" && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4">
            <h3 className="font-bold text-stone-800">¿Qué te gustaría cambiar?</h3>
            <textarea
              value={modMotivo}
              onChange={e => setModMotivo(e.target.value)}
              placeholder="Describe los cambios que necesitas..."
              rows={4}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowModForm(false)}
                className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-2xl font-semibold text-sm hover:bg-stone-50">
                Cancelar
              </button>
              <button onClick={requestMod} disabled={!modMotivo.trim() || submitting}
                className="flex-1 py-3 bg-amber-600 text-white rounded-2xl font-semibold text-sm disabled:opacity-40 hover:bg-amber-700">
                {submitting ? "Enviando…" : "Enviar solicitud"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
