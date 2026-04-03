import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

interface LandingProps {
  onShowLogin: () => void;
  onShowRegister: () => void;
}

export default function Landing({ onShowLogin, onShowRegister }: LandingProps) {
  const { loginDemo } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDemo = async () => {
    setLoading(true);
    try {
      await loginDemo();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50">
      <nav className="flex items-center justify-between px-8 py-5 bg-white border-b border-emerald-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-800 rounded-xl flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-white text-[20px]">energy_savings_leaf</span>
          </div>
          <div>
            <span className="text-emerald-900 font-bold text-xl">CERTIFIVE</span>
            <span className="ml-2 text-[9px] font-bold uppercase tracking-widest text-emerald-600/60">Certificación CEE</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onShowLogin}
            className="text-emerald-700 hover:text-emerald-900 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            Iniciar sesión
          </button>
          <button
            onClick={onShowRegister}
            className="bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Comenzar gratis
          </button>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-8 py-20 text-center">
        <span className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200 rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
          <span className="text-emerald-700 text-xs font-bold uppercase tracking-widest">Plataforma CEE para auditores profesionales</span>
        </span>

        <h1 className="text-5xl md:text-6xl font-black text-emerald-900 mb-6 leading-tight tracking-tighter">
          CERTIFICA EN 5 MINUTOS.
          <span className="block text-orange-600 mt-1">MULTIPLICA TUS INGRESOS ×5</span>
        </h1>

        <p className="text-emerald-700/70 text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
          La plataforma todo-en-uno para auditores energéticos en España. Automatiza tus certificaciones CEE y multiplica tu productividad.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <button
            onClick={onShowRegister}
            className="bg-emerald-800 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-900/20"
          >
            Comenzar gratis
          </button>
          <button
            onClick={handleDemo}
            disabled={loading}
            className="border-2 border-emerald-200 text-emerald-800 bg-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-colors"
          >
            {loading ? "Cargando..." : "▶ Probar Demo"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-20">
          {[
            { num: "1", title: "CONECTA", desc: "Registro y configuración profesional" },
            { num: "2", title: "EXPLORA", desc: "Dashboard con tus oportunidades" },
            { num: "3", title: "REVISA", desc: "Análisis automatizado de datos" },
            { num: "4", title: "TRAMITA", desc: "Procesado CEE con un clic" },
            { num: "5", title: "FACTURA", desc: "Facturación instantánea conforme" },
          ].map(step => (
            <div key={step.num} className="bg-white border border-emerald-100 rounded-2xl p-6 text-center hover:border-emerald-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-emerald-800 rounded-xl flex items-center justify-center mx-auto mb-3 font-black text-white text-xl shadow-sm">
                {step.num}
              </div>
              <div className="text-emerald-700 font-black text-sm mb-1 tracking-wider">{step.title}</div>
              <div className="text-emerald-700/50 text-xs">{step.desc}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            { metric: "+400%", label: "Aumento de ingresos", sub: "Certificadores activos" },
            { metric: "85%", label: "Reducción de tiempo", sub: "En gestión administrativa" },
            { metric: "24h", label: "Entrega garantizada", sub: "De certificado al cliente" },
          ].map(stat => (
            <div key={stat.metric} className="bg-white border border-emerald-100 rounded-2xl p-8 text-center">
              <div className="text-4xl font-black text-emerald-800 mb-2 tracking-tighter">{stat.metric}</div>
              <div className="text-emerald-900 font-semibold mb-1">{stat.label}</div>
              <div className="text-emerald-700/50 text-sm">{stat.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "chat", title: "WhatsApp Business", desc: "Automatiza la captación de clientes con flujos inteligentes de WhatsApp" },
            { icon: "verified", title: "CEE Compliant", desc: "Formularios alineados con los estándares oficiales españoles de certificación" },
            { icon: "description", title: "Informes automáticos", desc: "Generación automática de PDFs, Excel y Word con los datos del certificado" },
          ].map(feat => (
            <div key={feat.title} className="bg-white border border-emerald-100 rounded-2xl p-6 text-left hover:border-emerald-200 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-emerald-700 text-[24px]">{feat.icon}</span>
              </div>
              <div className="text-emerald-900 font-bold mb-2">{feat.title}</div>
              <div className="text-emerald-700/60 text-sm leading-relaxed">{feat.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-white border-t border-emerald-100 mt-16 px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-800 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[16px]">energy_savings_leaf</span>
            </div>
            <span className="text-emerald-900 font-bold text-sm">CERTIFIVE</span>
          </div>
          <p className="text-emerald-700/40 text-xs">© 2024 CERTIFIVE. Plataforma para certificadores energéticos en España.</p>
          <div className="flex gap-4">
            {["Privacidad", "Términos", "Cookies"].map(l => (
              <button key={l} className="text-xs text-emerald-700/50 hover:text-emerald-700 transition-colors font-medium">{l}</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
