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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-lg">C5</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">CERTIFIVE</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onShowLogin} className="text-white/80 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm">
            Iniciar sesión
          </button>
          <button onClick={onShowRegister} className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Registrarse
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></span>
          <span className="text-teal-400 text-sm font-medium">Plataforma CEE para profesionales</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
          CERTIFICA EN 5 MINUTOS.
          <span className="block bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
            MULTIPLICA TUS INGRESOS X5
          </span>
        </h1>

        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-12">
          La plataforma todo-en-uno para auditores energéticos en España. Automatiza tus certificaciones CEE y multiplica tu productividad.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <button onClick={onShowRegister} className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity shadow-xl">
            Comenzar gratis
          </button>
          <button onClick={handleDemo} disabled={loading} className="border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/5 transition-colors">
            {loading ? "Cargando..." : "▶ Probar Demo"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-20">
          {[
            { num: "1", title: "CONECTA", desc: "Registro profesional y configuración" },
            { num: "2", title: "EXPLORA", desc: "Dashboard con oportunidades" },
            { num: "3", title: "REVISA", desc: "Análisis automatizado de datos" },
            { num: "4", title: "TRAMITA", desc: "Procesado CEE con un clic" },
            { num: "5", title: "FACTURA", desc: "Facturación y asesoría instantánea" },
          ].map((step) => (
            <div key={step.num} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 font-black text-white text-xl">
                {step.num}
              </div>
              <div className="text-teal-400 font-bold text-sm mb-1">{step.title}</div>
              <div className="text-white/50 text-xs">{step.desc}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            { metric: "+400%", label: "Aumento de ingresos", sub: "Certificadores activos" },
            { metric: "85%", label: "Reducción de tiempo", sub: "En gestión administrativa" },
            { metric: "24h", label: "Entrega garantizada", sub: "De certificado al cliente" },
          ].map((stat) => (
            <div key={stat.metric} className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="text-4xl font-black bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent mb-2">{stat.metric}</div>
              <div className="text-white font-semibold mb-1">{stat.label}</div>
              <div className="text-white/40 text-sm">{stat.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "💬", title: "WhatsApp Business", desc: "Automatiza la captación de clientes con flujos inteligentes de WhatsApp" },
            { icon: "📋", title: "CEE Compliant", desc: "Formularios alineados con los estándares oficiales españoles de certificación" },
            { icon: "📄", title: "Informes automáticos", desc: "Generación automática de PDFs, Excel y Word con datos del certificado" },
          ].map((feat) => (
            <div key={feat.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
              <div className="text-3xl mb-3">{feat.icon}</div>
              <div className="text-white font-semibold mb-2">{feat.title}</div>
              <div className="text-white/50 text-sm">{feat.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-white/10 mt-20 px-8 py-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">C5</span>
          </div>
          <span className="text-white/60 font-medium">CERTIFIVE</span>
        </div>
        <p className="text-white/30 text-sm">© 2025 CERTIFIVE. Plataforma para certificadores energéticos profesionales en España.</p>
      </footer>
    </div>
  );
}
