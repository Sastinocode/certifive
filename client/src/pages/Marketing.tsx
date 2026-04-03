export default function Marketing() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-emerald-900 tracking-tight">Marketing</h1>
        <p className="text-sm text-emerald-700/60 mt-1 font-medium">Herramientas de captación y fidelización de clientes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-emerald-800 rounded-2xl p-8 text-white overflow-hidden relative">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-emerald-200 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              Próximamente
            </span>
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Captación automatizada de clientes</h2>
            <p className="text-emerald-200 text-sm leading-relaxed mb-6">
              Lanza campañas de captación dirigidas a propietarios con certificados próximos a vencer. Automatiza el seguimiento y multiplica tus conversiones.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Email campaigns", "SMS marketing", "Landing pages", "Lead tracking"].map(f => (
                <span key={f} className="bg-white/10 text-emerald-200 text-xs px-3 py-1.5 rounded-full font-medium">{f}</span>
              ))}
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full" />
        </div>

        <div className="space-y-4">
          {[
            { icon: "campaign", title: "Campañas por email", desc: "Envía newsletters con plantillas profesionales.", color: "bg-orange-100 text-orange-700" },
            { icon: "person_add", title: "Gestión de leads", desc: "Captura oportunidades de negocio automáticamente.", color: "bg-violet-100 text-violet-700" },
            { icon: "insights", title: "Analíticas avanzadas", desc: "Métricas de conversión y rendimiento de campañas.", color: "bg-blue-100 text-blue-700" },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-2xl border border-emerald-100/60 shadow-[0_4px_16px_rgba(0,100,44,0.04)] p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-emerald-900 text-sm mb-1">{item.title}</p>
                  <p className="text-xs text-emerald-700/60 leading-relaxed">{item.desc}</p>
                  <span className="mt-2 inline-block text-[10px] font-bold uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Próximamente</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-emerald-100/60 shadow-[0_4px_24px_rgba(0,100,44,0.06)] p-8">
        <h2 className="text-lg font-bold text-emerald-900 mb-2">Notificaciones de disponibilidad</h2>
        <p className="text-sm text-emerald-700/60 mb-6">Sé el primero en acceder cuando el módulo de Marketing esté disponible.</p>
        <div className="flex gap-3 max-w-md">
          <input
            className="flex-1 bg-emerald-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
            placeholder="tu@email.com"
          />
          <button className="px-5 py-3 bg-emerald-800 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap">
            Avisarme
          </button>
        </div>
      </div>
    </div>
  );
}
