/**
 * SolicitudPagoRechazado — Error de pago.
 * Anima X, tranquiliza al usuario, ofrece reintentar.
 */
import { useLocation } from "wouter";
import { PublicLayout } from "@/components/public/PublicLayout";
import { BtnPrimary, BtnGhost, ArrowLeft } from "@/components/public/PublicButton";
import { Pill } from "@/components/public/Pill";

const CAUSAS = [
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    title: "Fondos o límite insuficiente",
    desc: "Comprueba el saldo disponible o el límite diario de tu tarjeta.",
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><circle cx="12" cy="12" r="10"/></svg>,
    title: "Datos incorrectos",
    desc: "Un dígito, la caducidad o el CVC mal escritos son la causa más habitual.",
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2L3 7v6c0 5 3.8 8.5 9 9 5.2-.5 9-4 9-9V7z"/></svg>,
    title: "Bloqueo de seguridad del banco",
    desc: "Algunos bancos bloquean compras online. Una llamada a tu banco suele resolverlo.",
  },
];

export default function SolicitudPagoRechazado() {
  const [, navigate] = useLocation();
  const datos = JSON.parse(sessionStorage.getItem("solicitud_cee") ?? "{}");
  const base  = datos.tipo === "local" || datos.tipo === "oficina" ? 169 : 129;
  const total = base;

  return (
    <PublicLayout variant="rejected">
      {/* Error hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 pt-14 sm:pt-16 pb-12 text-center">

          {/* Animated error icon: pop then shake */}
          <div
            className="inline-flex w-[72px] h-[72px] rounded-full bg-[#fef2f2] border border-[#fecaca] items-center justify-center mb-6"
            style={{ animation: "pop .45s cubic-bezier(.16,1,.3,1) forwards, shake .5s .45s ease-in-out forwards" }}
          >
            <svg className="w-9 h-9 text-[#dc2626]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>

          <h1 className="text-[2rem] sm:text-[2.5rem] font-extrabold text-pub-ink leading-[1.05] tracking-tight">
            No se pudo procesar el pago
          </h1>
          <p className="text-[15px] sm:text-base text-pub-muted mt-4 max-w-md mx-auto leading-relaxed">
            Tu tarjeta ha sido rechazada por el banco y{" "}
            <strong className="text-pub-ink">no se ha realizado ningún cargo</strong>.
            Tu solicitud sigue guardada — solo falta completar el pago.
          </p>

          {/* Error code badge */}
          <div className="inline-flex items-center gap-2 mt-5 text-[12.5px] text-pub-muted bg-slate-50 rounded-lg px-3.5 py-2">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Código del banco: <span className="font-semibold text-pub-ink">DECLINED · 05</span>
          </div>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-5 sm:px-8 py-10 sm:py-14 space-y-6">

        {/* Acciones */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8 animate-reveal">
          <h2 className="text-base font-bold text-pub-ink">Vuelve a intentarlo</h2>
          <p className="text-[13px] text-pub-muted mt-1">Revisa los datos de tu tarjeta o prueba con otro método de pago.</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <BtnPrimary className="flex-1" onClick={() => navigate("/solicitud-cee/pago")}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
              </svg>
              Reintentar el pago
            </BtnPrimary>
            <BtnGhost className="flex-1" onClick={() => navigate("/solicitud-cee/pago")}>
              Usar otra tarjeta
            </BtnGhost>
          </div>
        </div>

        {/* Causas */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8 animate-reveal">
          <h2 className="text-base font-bold text-pub-ink mb-2">¿Por qué ha pasado esto?</h2>
          {CAUSAS.map(c => (
            <div key={c.title} className="flex gap-3 py-[14px] border-b border-pub-border-soft last:border-0">
              <span className="w-[30px] h-[30px] rounded-[9px] bg-[#fef3e2] text-[#b4690e] flex items-center justify-center flex-shrink-0">
                {c.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-pub-ink">{c.title}</p>
                <p className="text-[12.5px] text-pub-muted mt-0.5">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Solicitud guardada */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8 animate-reveal">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-pub-ink">Tu solicitud sigue guardada</h2>
            <Pill variant="amber">Pago pendiente</Pill>
          </div>
          <div className="flex gap-3 py-2">
            <span className="w-10 h-10 rounded-xl bg-pub-primary-soft text-pub-primary flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-pub-ink leading-tight">Certificado energético · Vivienda</p>
              <p className="text-[12px] text-pub-muted mt-0.5">Solicitud pendiente de pago</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
            <span className="text-sm text-pub-muted">Importe a pagar</span>
            <span className="text-lg font-extrabold text-pub-ink">{total} €</span>
          </div>
        </div>

        {/* Ayuda */}
        <div className="rounded-3xl p-6 sm:p-7 border border-emerald-100 bg-emerald-50/50 animate-reveal flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex gap-3.5">
            <span className="w-11 h-11 rounded-2xl bg-white text-pub-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
              </svg>
            </span>
            <div>
              <p className="text-sm font-bold text-pub-ink">¿El problema persiste?</p>
              <p className="text-[13px] text-pub-muted mt-0.5">
                Te ayudamos a completar el pago por teléfono o por transferencia. Escríbenos por WhatsApp al 654 78 32 19.
              </p>
            </div>
          </div>
          <BtnPrimary
            className="whitespace-nowrap !h-[46px] !text-sm"
            onClick={() => window.open("https://wa.me/34654783219", "_blank")}
          >
            Abrir WhatsApp
          </BtnPrimary>
        </div>

        {/* Volver a precios */}
        <div className="text-center pt-2">
          <button
            onClick={() => navigate("/precios")}
            className="text-sm font-semibold text-pub-primary hover:underline inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a los precios
          </button>
        </div>
      </section>
    </PublicLayout>
  );
}
