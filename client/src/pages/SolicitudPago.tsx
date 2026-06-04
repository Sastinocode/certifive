/**
 * SolicitudPago — Paso 4: pago seguro.
 * Método de pago (tarjeta/PayPal/transferencia), campos de tarjeta, datos de facturación.
 * En producción: conectar con Stripe.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Stepper } from "@/components/public/Stepper";
import { ChoiceCard } from "@/components/public/ChoiceCard";
import { PublicInput, PublicCheckbox, FieldLabel } from "@/components/public/PublicInput";
import { BtnPrimary } from "@/components/public/PublicButton";
import { SumRow } from "@/components/public/SumRow";
import { TrustItem } from "@/components/public/TrustStrip";

type MetodoPago = "tarjeta" | "paypal" | "transferencia";

const METODOS: { id: MetodoPago; icon: React.ReactNode; title: string; subtitle: string }[] = [
  {
    id: "tarjeta",
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    title: "Tarjeta",
    subtitle: "Visa, Mastercard, Amex",
  },
  {
    id: "paypal",
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7.4 6.5h3.5c2.3 0 3.4 1.2 3 3.3-.4 2.2-2 3.3-4.2 3.3H8.3l-.5 3.4H5.5L7.4 6.5zm1.2 4.6h1c1 0 1.7-.4 1.9-1.4.1-.8-.3-1.2-1.2-1.2H9l-.4 2.6z"/><path d="M14 6.5h3.5c2.3 0 3.4 1.2 3 3.3-.4 2.2-2 3.3-4.2 3.3h-1.4l-.5 3.4h-2.3L14 6.5z" opacity=".55"/></svg>,
    title: "PayPal",
    subtitle: "Pago seguro con tu cuenta",
  },
  {
    id: "transferencia",
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h18M3 10l2-5h14l2 5M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9"/></svg>,
    title: "Transferencia",
    subtitle: "Confirma en 1–2 días hábiles",
  },
];

const TIPO_LABEL: Record<string, string> = {
  vivienda: "Vivienda", local: "Local comercial", oficina: "Oficina",
};

function calcularPrecio(tipo: string): { base: number; subtotal: number; iva: number; registro: number; total: number } {
  const base     = tipo === "local" || tipo === "oficina" ? 169 : 129;
  const registro = tipo === "edificio" ? 0 : 14;
  const subtotal = parseFloat((base / 1.21).toFixed(2));
  const iva      = parseFloat((base - subtotal).toFixed(2));
  return { base, subtotal, iva, registro, total: base };
}

const DESCUENTO = 20;

// Resolves to null when VITE_STRIPE_PUBLIC_KEY is not set (dev / mock mode).
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY as string)
  : Promise.resolve(null);

function SolicitudPagoInner() {
  const [, navigate] = useLocation();
  const stripe   = useStripe();
  const elements = useElements();

  const datos = JSON.parse(sessionStorage.getItem("solicitud_cee") ?? "{}");
  const { subtotal, iva, registro, total } = calcularPrecio(datos.tipo ?? "vivienda");
  const tipoNombre = TIPO_LABEL[datos.tipo] ?? "Vivienda";

  const [metodo,  setMetodo]  = useState<MetodoPago>("tarjeta");
  const [cp,      setCp]      = useState("");
  const [factura, setFactura] = useState(false);
  const [terminos,setTerminos]= useState(true);
  const [loading, setLoading] = useState(false);

  const handlePagar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminos) return;
    setLoading(true);

    try {
      const checkoutRes = await fetch("/api/solicitudes/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metodoPago: metodo, importeTotal: total }),
      });
      if (!checkoutRes.ok) throw new Error("checkout");

      const payload = await checkoutRes.json() as {
        numeroPedido: string;
        clientSecret?: string;
        pendiente?: boolean;
      };

      if (metodo === "tarjeta") {
        if (stripe && elements && payload.clientSecret) {
          const cardElement = elements.getElement(CardElement);
          if (!cardElement) throw new Error("card element not found");
          const { error } = await stripe.confirmCardPayment(payload.clientSecret, {
            payment_method: { card: cardElement },
          });
          if (error) throw new Error(error.message);
        } else {
          // Stripe not configured (VITE_STRIPE_PUBLIC_KEY absent) — dev/mock mode.
          const confirmRes = await fetch("/api/solicitudes/checkout/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ numeroPedido: payload.numeroPedido, stripePaymentIntentId: null }),
          });
          if (!confirmRes.ok) throw new Error("confirm");
        }
      }

      const saved = JSON.parse(sessionStorage.getItem("solicitud_cee") ?? "{}");
      sessionStorage.setItem("solicitud_cee", JSON.stringify({ ...saved, numeroPedido: payload.numeroPedido }));
      navigate("/solicitud-cee/confirmacion");
    } catch {
      setLoading(false);
      navigate("/solicitud-cee/pago-rechazado");
    }
  };

  return (
    <PublicLayout variant="payment" backHref="/solicitud-cee/presupuesto">
      <Stepper current={4} />

      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 sm:pt-12 pb-14">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-bold tracking-wider uppercase text-pub-primary">Paso 4 de 4</p>
          <h1 className="text-[1.9rem] sm:text-[2.3rem] font-extrabold text-pub-ink mt-2 leading-[1.05] tracking-tight">
            Confirma y paga
          </h1>
          <p className="text-[15px] text-pub-muted mt-3 max-w-xl leading-relaxed">
            Solo se realizará el cargo cuando confirmemos la visita técnica. Cancela gratis hasta 24 h antes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-8 items-start">

          <form id="payment-form" onSubmit={handlePagar} className="space-y-6">

            {/* Método de pago */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8 space-y-5 animate-reveal">
              <h2 className="text-base font-bold text-pub-ink">Método de pago</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {METODOS.map(m => (
                  <ChoiceCard
                    key={m.id}
                    vertical
                    selected={metodo === m.id}
                    onClick={() => setMetodo(m.id)}
                    icon={m.icon}
                    title={m.title}
                    subtitle={m.subtitle}
                  />
                ))}
              </div>

              {metodo === "tarjeta" && (
                <div className="pt-1">
                  <FieldLabel htmlFor="card-element">Datos de tarjeta</FieldLabel>
                  <div style={{
                    border: "1.5px solid #e4e6ea",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    minHeight: "48px",
                  }}>
                    <CardElement
                      id="card-element"
                      options={{
                        style: {
                          base: {
                            fontSize: "15px",
                            color: "#0f1f2e",
                            fontFamily: "Inter, sans-serif",
                            "::placeholder": { color: "#5e6772" },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}

              {metodo === "paypal" && (
                <div className="bg-[#fef9e7] border border-amber-200 rounded-2xl p-4 text-[13px] text-pub-ink">
                  Serás redirigido a PayPal para completar el pago de forma segura.
                </div>
              )}

              {metodo === "transferencia" && (
                <div className="bg-pub-primary-soft border border-pub-primary/20 rounded-2xl p-4 space-y-2 text-[13px]">
                  <p className="font-semibold text-pub-ink">Datos para la transferencia:</p>
                  <p className="text-pub-muted">IBAN: <span className="font-mono font-semibold text-pub-ink">ES12 3456 7890 1234 5678 9012</span></p>
                  <p className="text-pub-muted">Concepto: <span className="font-semibold text-pub-ink">{datos.nombre ?? "Tu nombre"} · CEE</span></p>
                  <p className="text-pub-muted text-[12px] mt-1">Recibirás confirmación por email en 1–2 días hábiles.</p>
                </div>
              )}
            </div>

            {/* Datos de facturación */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8 space-y-5 animate-reveal">
              <h2 className="text-base font-bold text-pub-ink">Datos de facturación</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <PublicInput id="fac-nombre" label="Nombre / Razón social" placeholder="María González" defaultValue={datos.nombre ?? ""} />
                <PublicInput id="fac-nif" label="NIF / DNI" placeholder="00000000X" optional />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-5">
                <PublicInput id="fac-addr" label="Dirección" placeholder="Calle, número" optional />
                <PublicInput id="fac-cp" label="C. Postal" placeholder="28013" value={cp} onChange={e => setCp(e.target.value)} maxLength={5} optional />
              </div>
              <PublicCheckbox checked={factura} onChange={setFactura}>
                Necesito factura con datos de empresa
              </PublicCheckbox>
            </div>

            {/* Términos */}
            <PublicCheckbox checked={terminos} onChange={setTerminos}>
              Acepto los{" "}
              <a href="/terms" className="text-pub-primary hover:underline font-semibold">términos de contratación</a>
              {" "}y autorizo el cargo una vez confirmada la visita técnica. Conozco mi derecho de desistimiento.
            </PublicCheckbox>
          </form>

          {/* Resumen pedido sticky */}
          <aside className="lg:sticky lg:top-24 self-start space-y-5">
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold tracking-wider uppercase text-pub-muted">Tu pedido</p>
                <button
                  type="button"
                  onClick={() => navigate("/solicitud-cee/presupuesto")}
                  className="text-[11px] font-semibold text-pub-primary hover:underline"
                >
                  Editar
                </button>
              </div>

              {/* Product row */}
              <div className="flex gap-3 pb-4 border-b border-gray-100">
                <span className="w-10 h-10 rounded-xl bg-pub-primary-soft text-pub-primary flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-pub-ink leading-tight">Certificado energético</p>
                  <p className="text-[12px] text-pub-muted mt-0.5">
                    {tipoNombre}{datos.m2 ? ` · ${datos.m2} m²` : ""}{datos.ciudad ? ` · ${datos.ciudad}` : ""}
                  </p>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="pt-2">
                <SumRow label="Subtotal" value={`${subtotal.toFixed(2).replace(".", ",")} €`} />
                <SumRow label="Registro + tasa CCAA" value={`${registro} €`} />
                <SumRow label="IVA (21%)" value={`${iva.toFixed(2).replace(".", ",")} €`} />
                <SumRow
                  label={<span className="text-pub-primary font-semibold flex items-center gap-1.5">Descuento web</span>}
                  value={<span className="text-pub-primary">−{DESCUENTO} €</span>}
                />
              </div>

              <div className="flex items-end justify-between pt-4 mt-1 border-t border-gray-100">
                <p className="text-sm font-semibold text-pub-ink">Total a pagar</p>
                <p className="text-[30px] font-extrabold text-pub-ink leading-none tracking-tight">{total} €</p>
              </div>

              <BtnPrimary
                type="submit"
                form="payment-form"
                className="w-full mt-5"
                disabled={loading || !terminos}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                {loading ? "Procesando…" : `Pagar ${total} €`}
              </BtnPrimary>
              <p className="text-[11px] text-pub-muted text-center mt-3 leading-relaxed">
                No se realiza el cargo hasta confirmar la visita. Cancela gratis hasta 24 h antes.
              </p>
            </div>

            {/* Trust card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
              <TrustItem
                label="Pago cifrado SSL 256-bit"
                icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>}
              />
              <TrustItem
                label="Garantía de devolución"
                icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>}
              />
              <TrustItem
                label="Datos protegidos · RGPD"
                icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 2L3 7v6c0 5 3.8 8.5 9 9 5.2-.5 9-4 9-9V7z"/></svg>}
              />
            </div>
            <p className="text-center text-[11px] text-pub-muted">
              Procesado por <span className="font-semibold text-pub-ink">Stripe</span> · no almacenamos tu tarjeta
            </p>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}

export default function SolicitudPago() {
  return (
    <Elements stripe={stripePromise}>
      <SolicitudPagoInner />
    </Elements>
  );
}
