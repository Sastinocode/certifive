import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Shield, FileText, Users, TrendingUp, MessageSquare, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const [, navigate] = useLocation();
  const { loginDemo } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent">CERTIFIVE</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate("/login")}
                className="border-teal-200 text-teal-700 hover:bg-teal-50"
              >
                Iniciar Sesión
              </Button>
              <Button 
                onClick={() => navigate("/registro")}
                className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
              >
                Registrarse
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Plataforma de Certificación Energética
            <span className="block bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent">para Profesionales</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Simplifica el proceso de certificación energética con automatización completa. 
            Desde WhatsApp hasta entrega final, todo integrado en una sola plataforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/registro")} 
              size="lg" 
              className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-lg px-8 py-3"
            >
              Empezar Gratis
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                loginDemo();
                navigate("/");
              }} 
              size="lg" 
              className="border-teal-200 text-teal-700 hover:bg-teal-50 text-lg px-8 py-3"
            >
              <Play className="w-5 h-5 mr-2" />
              Probar Demo
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/login")} 
              size="lg" 
              className="border-gray-200 text-gray-700 hover:bg-gray-50 text-lg px-8 py-3"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Automatización completa para certificadores energéticos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">WhatsApp Business</h4>
                <p className="text-gray-600 text-sm">Automatización completa desde la consulta hasta la entrega</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Gestión Financiera</h4>
                <p className="text-gray-600 text-sm">Facturación, cobros y reportes financieros automatizados</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Informes Técnicos</h4>
                <p className="text-gray-600 text-sm">PDF, Word y Excel optimizados para software oficial</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-teal-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Normativa CEE</h4>
                <p className="text-gray-600 text-sm">Cumplimiento total con regulaciones españolas</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            ¿Listo para automatizar tu negocio?
          </h3>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Únete a cientos de certificadores que ya han transformado su proceso de trabajo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/registro")}
              size="lg" 
              className="bg-white text-green-600 hover:bg-gray-50 text-lg px-8 py-3"
            >
              Crear Cuenta Gratis
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/solicitar-demo")}
              size="lg" 
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-3"
            >
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xl font-bold">EnergyPro España</h4>
          </div>
          <p className="text-gray-400">
            Plataforma de certificación energética para profesionales
          </p>
        </div>
      </footer>
    </div>
  );
}