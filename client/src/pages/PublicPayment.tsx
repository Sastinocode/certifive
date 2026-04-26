import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = (window as any).__STRIPE_PK__
  ? loadStripe((window as any).__STRIPE_PK__)
  : null;

interface Props { token: string }

// ── Stripe card form ──────────────────────────────────────────────────────────
function StripeCardForm({ token, amount, onSuccess }: { token: string; amount: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState("");

  const pay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setErr("");
    try {
      const res = await fetch(`/api/pay/${token}/stripe-intent`, { method: "POST" });
      const { clientSecret } = await res.json();

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement)! },
      });

      if (result.error) {
        setErr(result.error.message ?? "Error en el pago");
      } else {
        onSuccess();
      }
    } catch {
      setErr("Error al procesar el pago. Inténtalo de nuevo.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
        <CardElement options={{ style: { base: { fontSize: "16px", color: "#1c1917", "::placeholder": { color: "#a8a29e" } } } }} />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button onClick={pay} disabled={paying || !stripe}
        className="w-full py-4 bg-emerald-700 text-white rounded-2xl font-bold text-base disabled:opacity-50 hover:bg-emerald-600 transition-colors">
        {paying ? "Procesando…" : `Pagar ${amount.toFixed(2)} € →`}
      </button>
    </div>
  );
}

// ── Manual payment notification form ─────────────────────────────────────────
function ManualPaymentForm({ token, metodo, amount, certifier, onSuccess }: {
  token: string; metodo: string; amount: number; certifier: any; onSuccess: () => void;
}) {
  const [notas, setNotas] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const send = async () => {
    setSending(true);
    setErr("");
    try {
      const res = await fetch(`/api/pay/${token}/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metodo, notas }),
      });
      if (!res.ok) throw new Error();
      onSuccess();
    } catch {
      setErr("Error al notificar el pago. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  };

  if (metodo === "bizum") return (
    <div className="space-y-4">
      <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-3">Paga por Bizum</p>
        <p className="text-sm text-violet-800 mb-3">Envía <strong>{amount.toFixed(2)} €</strong> al número:</p>
        <p className="text-3xl font-black text-violet-900 tracking-tight">{certifier.bizumPhone ?? "—"}</p>
        <p className="text-xs text-violet-600 mt-2">Concepto: <strong>Certificado energético</strong></p>
      </div>
      <div>
        <label className="text-xs font-semibold text-stone-500 block mb-1.5 uppercase tracking-wide">
          ¿Añadir alguna nota? <span className="font-normal normal-case">(opcional)</span>
        </label>
        <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
          placeholder="Ej: Te lo acabo de enviar desde mi teléfono 666..."
          className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button onClick={send} disabled={sending}
        className="w-full py-4 bg-violet-700 text-white rounded-2xl font-bold text-base disabled:opacity-50 hover:bg-violet-800 transition-colors">
        {sending ? "Notificando…" : "Ya lo he enviado →"}
      </button>
    </div>
  );

  if (metodo === "transferencia") return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Datos para transferencia</p>
        <div>
          <p className="text-xs text-blue-500 font-medium mb-0.5">IBAN</p>
          <p className="text-lg font-black text-blue-900 font-mono tracking-wide break-all">{certifier.iban ?? "—"}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-blue-500 font-medium mb-0.5">Beneficiario</p>
            <p className="text-sm font-bold text-blue-900">{certifier.name ?? certifier.company ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-blue-500 font-medium mb-0.5">Importe</p>
            <p className="text-sm font-black text-blue-900">{amount.toFixed(2)} €</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-blue-500 font-medium mb-0.5">Concepto</p>
          <p className="text-sm font-bold text-blue-900">Certificado energético</p>
        </div>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button onClick={send} disabled={sending}
        className="w-full py-4 bg-blue-700 text-white rounded-2xl font-bold text-base disabled:opacity-50 hover:bg-blue-800 transition-colors">
        {sending ? "Notificando…" : "Ya he realizado la transferencia →"}
      </button>
    </div>
  );

  if (metodo === "efectivo") return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">Pago en efectivo</p>
        <p className="text-sm text-amber-800 leading-relaxed">
          Acuerda con <strong>{certifier.name ?? "tu certificador"}</strong> el lugar y momento para abonar en efectivo <strong>{amount.toFixed(2)} €</strong>.
        </p>
        {certifier.phone && (
          <a href={`https://wa.me/${certifier.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
            className="mt-4 flex items-center gap-2 text-sm font-semibold text-green-700 underline">
            📲 Contactar por WhatsApp
          </a>
        )}
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button onClick={send} disabled={sending}
        className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold text-base disabled:opacity-50 hover:bg-amber-700 transition-colors">
        {sending ? "Notificando…" : "Notificar al certificador →"}
      </button>
    </div>
  );

  return null;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PublicPayment({ token }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    fetch(`/api/pay/${token}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setData(d); if (d.alreadyPaid) setPaid(true); setLoading(false); })
      .catch(() => { setError("Enlace de pago no válido."); setLoading(false); });
  }, [token]);

  const methodLabels: Record<string, { icon: string; label: string; color: string }> = {
    stripe: { icon: "💳", label: "Tarjeta bancaria", color: "bg-emerald-50 border-emerald-200" },
    bizum: { icon: "🟣", label: "Bizum", color: "bg-violet-50 border-violet-200" },
    transferencia: { icon: "🏦", label: "Transferencia bancaria", color: "bg-blue-50 border-blue-200" },
    efectivo: { icon: "💵", label: "Efectivo", color: "bg-amber-50 border-amber-200" },
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="text-4xl mb-4">💳</div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">Enlace no válido</h2>
        <p className="text-stone-500 text-sm">{error}</p>
      </div>
    </div>
  );

  if (paid) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Pago confirmado</h2>
        <p className="text-stone-500 text-sm">Tu certificador ha recibido el pago. Recibirás las instrucciones del siguiente paso en breve.</p>
      </div>
    </div>
  );

  const { tramo, amount, certifier, cert } = data;
  const methods: string[] = certifier.enabledPaymentMethods ?? ["stripe", "bizum", "transferencia", "efectivo"];

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
          <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-1">
            {tramo === 1 ? "Primer pago · Inicio del servicio" : "Pago final · Entrega del certificado"}
          </p>
          <h1 className="text-4xl font-black tracking-tight">{amount.toFixed(2)} €</h1>
          <p className="text-emerald-200 text-sm mt-1">IVA incluido</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">

        {/* Property summary */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-stone-900 text-sm">{cert.ownerName ?? "—"}</p>
              <p className="text-xs text-stone-400 mt-0.5">{cert.address ?? cert.propertyType ?? "Certificado energético"}</p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-full">
              Tramo {tramo}/2
            </span>
          </div>
        </div>

        {/* Method selector */}
        {!selectedMethod && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-500 px-1">Elige cómo pagar</p>
            {methods.map(m => {
              const meta = methodLabels[m];
              if (!meta) return null;
              const available = (m === "bizum" && !certifier.bizumPhone) || (m === "transferencia" && !certifier.iban) || (m === "stripe" && !stripePromise)
                ? false : true;
              return (
                <button key={m} onClick={() => available && setSelectedMethod(m)} disabled={!available}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left disabled:opacity-40 ${
                    available ? `hover:scale-[1.01] active:scale-[0.99] ${meta.color} hover:border-current` : "bg-stone-50 border-stone-100"
                  }`}>
                  <span className="text-3xl">{meta.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-stone-900">{meta.label}</p>
                    {!available && <p className="text-xs text-stone-400">No disponible</p>}
                  </div>
                  <span className="text-stone-300 text-xl">›</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected method form */}
        {selectedMethod && (
          <div className="space-y-4">
            <button onClick={() => setSelectedMethod(null)}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors">
              ← Cambiar método
            </button>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">{methodLabels[selectedMethod]?.icon}</span>
                <p className="font-bold text-stone-900">{methodLabels[selectedMethod]?.label}</p>
              </div>

              {selectedMethod === "stripe" && stripePromise ? (
                <Elements stripe={stripePromise}>
                  <StripeCardForm token={token} amount={amount} onSuccess={() => setPaid(true)} />
                </Elements>
              ) : (
                <ManualPaymentForm token={token} metodo={selectedMethod} amount={amount} certifier={certifier} onSuccess={() => setPaid(true)} />
              )}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-stone-400 pt-2">
          Pago gestionado de forma segura por CERTIFIVE
        </p>
      </div>
    </div>
  );
}
