import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Shield, FileText, Users, TrendingUp, MessageSquare, Play, ArrowRight, CheckCircle, BarChart3, Clock, DollarSign, UserPlus, Search, ClipboardCheck, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import certifiveLogo from "@assets/Logo_1750326352340.jpg";

export default function Landing() {
  const [, navigate] = useLocation();
  const { loginDemo } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={certifiveLogo} 
                alt="CERTIFIVE Logo" 
                className="w-10 h-10 rounded-lg object-cover"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent">CERTIFIVE</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/login")}
                className="text-gray-600 hover:text-teal-600"
              >
                Iniciar Sesión
              </Button>
              <Button 
                onClick={() => navigate("/registro")}
                className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white"
              >
                Registrarse
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-100 to-blue-100 rounded-full mb-8">
              <Clock className="w-4 h-4 text-teal-600 mr-2" />
              <span className="text-sm font-medium text-teal-700">Certificación Energética Profesional</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="block text-4xl md:text-5xl text-teal-600 mb-2">CERTIFICA EN 5 MINUTOS.</span>
              <span className="block bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent">
                MULTIPLICA TUS INGRESOS X5
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              La plataforma de automatización completa para certificadores energéticos. 
              Desde el primer contacto hasta la facturación, todo en una sola herramienta profesional.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                onClick={() => navigate("/registro")} 
                size="lg" 
                className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white text-lg px-8 py-4 h-auto shadow-lg hover:shadow-xl transition-all"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Empezar Gratis Ahora
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  loginDemo();
                  navigate("/");
                }} 
                size="lg" 
                className="border-2 border-teal-200 text-teal-700 hover:bg-teal-50 text-lg px-8 py-4 h-auto"
              >
                <Play className="w-5 h-5 mr-2" />
                Ver Demo en Vivo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>100% Cumplimiento CEE</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 text-blue-500 mr-2" />
                <span>Datos Seguros</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-teal-500 mr-2" />
                <span>Setup en 5 minutos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Step Process Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Tu proceso completo en <span className="text-teal-600">5 pasos</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Desde el registro hasta la facturación, todo automatizado para maximizar tu productividad
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
              {/* Step 1: CONECTA */}
              <div className="relative">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <UserPlus className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">CONECTA</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Regístrate como profesional certificador energético y configura tu perfil profesional
                  </p>
                </div>
                {/* Arrow */}
                <div className="hidden md:block absolute top-10 -right-6 text-teal-300">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </div>

              {/* Step 2: EXPLORA */}
              <div className="relative">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Search className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">EXPLORA</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Accede al dashboard de oportunidades y descubre nuevos proyectos de certificación
                  </p>
                </div>
                {/* Arrow */}
                <div className="hidden md:block absolute top-10 -right-6 text-blue-300">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </div>

              {/* Step 3: REVISA */}
              <div className="relative">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <BarChart3 className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">REVISA</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Analiza los datos automáticamente recopilados y verifica la información del inmueble
                  </p>
                </div>
                {/* Arrow */}
                <div className="hidden md:block absolute top-10 -right-6 text-purple-300">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </div>

              {/* Step 4: TRAMITA */}
              <div className="relative">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <ClipboardCheck className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">TRAMITA</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Recopila la información con un solo clic y tramita el CEE automáticamente
                  </p>
                </div>
                {/* Arrow */}
                <div className="hidden md:block absolute top-10 -right-6 text-orange-300">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </div>

              {/* Step 5: FACTURA */}
              <div className="relative">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <CreditCard className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    5
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">FACTURA</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Cobra instantáneamente por tu servicio, genera la factura y envía a la asesoría
                  </p>
                </div>
              </div>
            </div>

            {/* CTA after process */}
            <div className="text-center mt-16">
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  ¿Listo para multiplicar tus ingresos?
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Únete a los profesionales que ya están automatizando su proceso de certificación energética
                </p>
                <Button 
                  onClick={() => navigate("/registro")}
                  size="lg" 
                  className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white text-lg px-8 py-4 h-auto shadow-lg hover:shadow-xl transition-all"
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  Comenzar Ahora - Gratis
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Automatización completa para certificadores energéticos
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Todo lo que necesitas para gestionar tu negocio de certificación energética en una sola plataforma
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">WhatsApp Business</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Automatización completa desde la consulta hasta la entrega. Gestión de conversaciones y envío automático de presupuestos.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Gestión Financiera</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Facturación automática, cobros instantáneos y reportes financieros completos para tu asesoría fiscal.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Informes Técnicos</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Generación automática de certificados en PDF, Word y Excel optimizados para el software oficial.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Normativa CEE</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Cumplimiento total con la normativa española de certificación energética y actualizaciones automáticas.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Transforma tu negocio con <span className="text-teal-600">CERTIFIVE</span>
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mt-1">
                      <Clock className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Ahorra 5 horas por certificación</h3>
                      <p className="text-gray-600">Automatiza completamente el proceso desde la solicitud hasta la entrega del certificado.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mt-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Multiplica tus ingresos</h3>
                      <p className="text-gray-600">Gestiona 5 veces más proyectos con el mismo tiempo de trabajo gracias a la automatización.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Cero errores administrativos</h3>
                      <p className="text-gray-600">Formularios precargados y validación automática garantizan la precisión de los datos.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mt-1">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Experiencia cliente premium</h3>
                      <p className="text-gray-600">Comunicación fluida por WhatsApp y entregas instantáneas que impresionan a tus clientes.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl p-8 text-white shadow-2xl">
                  <h3 className="text-2xl font-bold mb-6">Resultados reales de nuestros usuarios</h3>
                  <div className="space-y-4">
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-3xl font-bold text-teal-100">+400%</div>
                      <div className="text-sm text-teal-100">Incremento promedio en ingresos</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-3xl font-bold text-blue-100">85%</div>
                      <div className="text-sm text-blue-100">Reducción en tiempo administrativo</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-3xl font-bold text-cyan-100">24h</div>
                      <div className="text-sm text-cyan-100">Tiempo promedio de entrega</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-500 to-blue-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-bold text-white mb-6">
              ¿Listo para multiplicar tus ingresos?
            </h2>
            <p className="text-xl text-teal-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Únete a los certificadores energéticos que han transformado su negocio con CERTIFIVE. 
              Comienza gratis y experimenta la diferencia en solo 5 minutos.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <Button 
                onClick={() => navigate("/registro")}
                size="lg" 
                className="bg-white text-teal-600 hover:bg-gray-50 text-xl px-10 py-5 h-auto shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                <UserPlus className="w-6 h-6 mr-3" />
                Empezar Gratis Ahora
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  loginDemo();
                  navigate("/");
                }}
                size="lg" 
                className="border-2 border-white text-white hover:bg-white/10 text-xl px-10 py-5 h-auto font-semibold"
              >
                <Play className="w-6 h-6 mr-3" />
                Probar Demo
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-teal-100">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="text-sm">Sin permanencia</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                <span className="text-sm">Datos seguros</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                <span className="text-sm">Setup inmediato</span>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span className="text-sm">Soporte 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <img 
                    src={certifiveLogo} 
                    alt="CERTIFIVE Logo" 
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <h4 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">CERTIFIVE</h4>
                </div>
                <p className="text-gray-400 leading-relaxed mb-4 max-w-md">
                  La plataforma de automatización completa para certificadores energéticos en España. 
                  Transforma tu negocio y multiplica tus ingresos con nuestra tecnología.
                </p>
                <div className="flex space-x-4">
                  <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="text-lg font-semibold mb-4 text-teal-400">Plataforma</h5>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-teal-400 transition-colors">WhatsApp Business</a></li>
                  <li><a href="#" className="hover:text-teal-400 transition-colors">Gestión Financiera</a></li>
                  <li><a href="#" className="hover:text-teal-400 transition-colors">Informes Técnicos</a></li>
                  <li><a href="#" className="hover:text-teal-400 transition-colors">Automatización</a></li>
                </ul>
              </div>
              
              <div>
                <h5 className="text-lg font-semibold mb-4 text-blue-400">Empresa</h5>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-blue-400 transition-colors">Sobre Nosotros</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">Contacto</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">Soporte</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">Términos y Condiciones</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 CERTIFIVE. Todos los derechos reservados. | Plataforma oficial para certificación energética en España.
              </p>
              <div className="flex items-center space-x-2 mt-4 md:mt-0">
                <span className="text-gray-400 text-sm">Cumplimiento CEE</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}