export default function Automatizaciones() {
  const agents = [
    {
      icon: "🤝",
      name: "Agente de Atención al Cliente",
      desc: "Responde automáticamente consultas de clientes sobre precios, plazos y proceso de certificación",
      tags: ["WhatsApp", "Email", "Chat"],
    },
    {
      icon: "📅",
      name: "Agente de Gestión Personal",
      desc: "Organiza tu agenda, visitas y plazos de entrega con integración de calendario",
      tags: ["Calendario", "Recordatorios"],
    },
    {
      icon: "🧠",
      name: "Agente RAG - Base de Conocimiento",
      desc: "Responde consultas técnicas basándose en normativas y documentos de certificación",
      tags: ["GPT-4", "Normativas"],
    },
    {
      icon: "🔧",
      name: "Agente Técnico Consultor",
      desc: "Asistencia técnica para proyectos con interacción por voz y texto",
      tags: ["Voz", "Texto", "OpenAI"],
    },
    {
      icon: "🎙️",
      name: "Agente de Voz Interactivo",
      desc: "Procesamiento de lenguaje natural para interacciones por voz con clientes",
      tags: ["Google Cloud AI", "NLP"],
    },
    {
      icon: "⚡",
      name: "Agente de Optimización",
      desc: "Analiza procesos y sugiere mejoras para aumentar tu productividad",
      tags: ["IA", "Análisis"],
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Automatizaciones</h1>
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">Próximamente</span>
        </div>
        <p className="text-gray-500 text-sm">Agentes de inteligencia artificial para automatizar tu trabajo</p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center text-2xl">🤖</div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Suite de Agentes IA</h2>
            <p className="text-gray-600 text-sm">6 agentes especializados para transformar tu negocio</p>
          </div>
        </div>
        <p className="text-gray-600 mb-4">
          Automatiza tareas repetitivas, mejora la atención al cliente y multiplica tu productividad 
          con agentes de inteligencia artificial integrados en tu flujo de trabajo.
        </p>
        <div className="flex gap-3">
          <button className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
            Solicitar acceso anticipado
          </button>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Agentes disponibles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {agents.map(agent => (
          <div key={agent.name} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">{agent.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-2">{agent.name}</h3>
            <p className="text-gray-500 text-sm mb-4">{agent.desc}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {agent.tags.map(tag => (
                <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">{tag}</span>
              ))}
            </div>
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">Próximamente</span>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tecnologías integradas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["OpenAI GPT-4", "Google Cloud AI", "WhatsApp Business API", "Síntesis de voz"].map(tech => (
            <div key={tech} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-gray-700">{tech}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
