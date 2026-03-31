export default function Marketing() {
  const platforms = [
    { name: "Facebook Ads", icon: "📘", desc: "Campañas publicitarias en Facebook e Instagram" },
    { name: "Google Ads", icon: "🔍", desc: "Anuncios de búsqueda y display en Google" },
    { name: "Instagram", icon: "📸", desc: "Contenido visual y stories para captación" },
    { name: "TikTok Ads", icon: "🎵", desc: "Vídeos cortos para nueva audiencia" },
    { name: "LinkedIn", icon: "💼", desc: "Marketing B2B para empresas y promotores" },
    { name: "YouTube", icon: "▶️", desc: "Vídeos educativos sobre eficiencia energética" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">Próximamente</span>
        </div>
        <p className="text-gray-500 text-sm">Integración con plataformas publicitarias para captación de clientes</p>
      </div>

      <div className="bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200 rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center text-2xl">📣</div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Plataforma de Marketing Digital</h2>
            <p className="text-gray-600 text-sm">Conecta tus campañas publicitarias directamente con CERTIFIVE</p>
          </div>
        </div>
        <p className="text-gray-600 mb-4">
          Próximamente podrás gestionar todas tus campañas de marketing desde un solo lugar, 
          con analytics integrado, seguimiento de ROI y automatización de captación de clientes.
        </p>
        <button className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          Notificarme cuando esté disponible
        </button>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Integraciones disponibles próximamente</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {platforms.map(p => (
          <div key={p.name} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm opacity-75 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{p.icon}</span>
              <span className="font-semibold text-gray-900">{p.name}</span>
            </div>
            <p className="text-gray-500 text-sm mb-4">{p.desc}</p>
            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-medium">Próximamente</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: "📊", title: "Analytics integrado", desc: "Dashboard unificado con métricas de todas las plataformas" },
          { icon: "🎯", title: "Seguimiento de conversiones", desc: "Rastrea desde el anuncio hasta el certificado firmado" },
          { icon: "🤖", title: "Automatización inteligente", desc: "IA para optimizar tus campañas automáticamente" },
        ].map(feat => (
          <div key={feat.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="text-3xl mb-3">{feat.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-2">{feat.title}</h3>
            <p className="text-gray-500 text-sm">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
