import { useState } from "react";

export default function WhatsApp() {
  const [connected, setConnected] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Business</h1>
        <p className="text-gray-500 text-sm mt-1">Integración con WhatsApp Business API para captación automática</p>
      </div>

      {!connected ? (
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-3xl">💬</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Conectar WhatsApp Business</h2>
                <p className="text-gray-500 text-sm">Configura tu cuenta de WhatsApp Business API</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-gray-900">Pasos de configuración:</h3>
              {[
                { step: "1", title: "Crea una cuenta en Meta for Developers", desc: "Accede a developers.facebook.com y crea una aplicación Business" },
                { step: "2", title: "Configura WhatsApp Business API", desc: "Añade el producto WhatsApp a tu aplicación de Meta" },
                { step: "3", title: "Obtén tus credenciales", desc: "Copia el Token de acceso y el ID de teléfono de tu número" },
                { step: "4", title: "Configura el webhook", desc: "Introduce la URL de webhook en tu configuración de Meta" },
              ].map(item => (
                <div key={item.step} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Token de acceso de WhatsApp</label>
                <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" placeholder="EAAxx..." />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">ID de número de teléfono</label>
                <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" placeholder="1234567890" />
              </div>
              <button
                onClick={() => setConnected(true)}
                className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Conectar WhatsApp Business
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">✅</div>
              <div>
                <p className="font-semibold text-green-900">WhatsApp Business conectado</p>
                <p className="text-green-700 text-sm">Tu número está activo y recibiendo mensajes</p>
              </div>
            </div>
            <button
              onClick={() => setConnected(false)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Desconectar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: "Mensajes recibidos hoy", value: "0", icon: "📨" },
              { label: "Conversaciones activas", value: "0", icon: "💬" },
              { label: "Cotizaciones enviadas", value: "0", icon: "📋" },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                </div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Flujos de conversación</h2>
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🔄</div>
              <p className="text-gray-500">No hay flujos configurados</p>
              <p className="text-gray-400 text-sm mt-1">Crea flujos de conversación automáticos para tus clientes</p>
              <button className="mt-4 bg-gradient-to-r from-teal-500 to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
                Crear flujo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
