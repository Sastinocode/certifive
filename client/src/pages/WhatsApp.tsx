import { useState } from "react";

export default function WhatsApp() {
  const [connected, setConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">WhatsApp Business</h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium">Integración con WhatsApp Business API para captación y notificación automática de clientes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4">
          <h2 className="text-xl font-bold text-foreground tracking-tight mb-2">Estado de conexión</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Conecta tu cuenta de WhatsApp Business para automatizar el flujo con tus clientes.</p>
        </div>
        <div className="lg:col-span-8">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[32px]">chat</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">WhatsApp Business API</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${connected ? "bg-primary" : "bg-orange-400"}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${connected ? "text-primary" : "text-orange-600"}`}>
                    {connected ? "Conectado" : "Sin conectar"}
                  </span>
                </div>
              </div>
            </div>

            {!connected ? (
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Número de teléfono de empresa</label>
                  <input
                    data-testid="input-phone-whatsapp"
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full bg-muted/40 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Token de acceso de API</label>
                  <input
                    data-testid="input-api-token"
                    type="password"
                    placeholder="EAAxxxxx..."
                    className="w-full bg-muted/40 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  />
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-orange-500 text-[20px] flex-shrink-0 mt-0.5">info</span>
                    <div>
                      <p className="text-xs font-semibold text-orange-800 mb-1">Requiere cuenta verificada de WhatsApp Business</p>
                      <p className="text-xs text-orange-700/70">Necesitas una cuenta de Meta Business Manager verificada para usar la API oficial de WhatsApp Business.</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    data-testid="btn-connect-whatsapp"
                    onClick={() => setConnected(true)}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Conectar WhatsApp
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Cuenta conectada</p>
                      <p className="text-xs text-muted-foreground">{phoneNumber || "+34 600 000 000"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setConnected(false)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6 border-t border-border">
        <div className="lg:col-span-4">
          <h2 className="text-xl font-bold text-foreground tracking-tight mb-2">Plantillas de mensajes</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Configura los mensajes automáticos que se envían a tus clientes en cada etapa del proceso.</p>
        </div>
        <div className="lg:col-span-8 space-y-4">
          {[
            { title: "Confirmación de solicitud", desc: "Cuando el cliente envía su solicitud de certificado", trigger: "Al crear certificación", active: true },
            { title: "Certificado listo", desc: "Cuando el certificado CEE ha sido finalizado", trigger: "Al finalizar", active: true },
            { title: "Recordatorio de visita", desc: "24h antes de la visita al inmueble", trigger: "Automático -24h", active: false },
          ].map((template, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border shadow-sm p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">chat_bubble</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{template.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{template.desc}</p>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{template.trigger}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${template.active ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${template.active ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
