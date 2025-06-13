import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Shield, FileText, Users, TrendingUp, MessageSquare } from "lucide-react";

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">EnergyPro España</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate("/login")}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                Iniciar Sesión
              </Button>
              <Button 
                onClick={() => navigate("/registro")}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
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
            <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">para Profesionales</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Simplifica el proceso de certificación energética con automatización completa. 
            Desde WhatsApp hasta entrega final, todo integrado en una sola plataforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/registro")} 
              size="lg" 
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg px-8 py-3"
            >
              Empezar Gratis
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/solicitar-demo")} 
              size="lg" 
              className="border-green-200 text-green-700 hover:bg-green-50 text-lg px-8 py-3"
            >
              Solicitar Demo
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
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Formulario Simplificado</h4>
                <p className="text-gray-600 text-sm">
                  Recopila datos de viviendas de forma intuitiva con validación automática
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-success" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Cálculo Automático</h4>
                <p className="text-gray-600 text-sm">
                  Algoritmos basados en normativa española para cálculos precisos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-6 h-6 text-warning" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Gestión de Documentos</h4>
                <p className="text-gray-600 text-sm">
                  Subida de fotos y generación automática de certificados oficiales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Dashboard Profesional</h4>
                <p className="text-gray-600 text-sm">
                  Gestiona múltiples certificaciones y genera informes detallados
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Proceso en 3 Pasos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                1
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Datos Generales</h4>
              <p className="text-gray-600">
                Información básica del titular y características generales de la vivienda
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                2
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Detalles de Vivienda</h4>
              <p className="text-gray-600">
                Orientación, ventanas, cubiertas y elementos constructivos relevantes
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                3
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Instalaciones</h4>
              <p className="text-gray-600">
                Sistemas de climatización, calefacción, ACS y documentación fotográfica
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            ¿Listo para certificar de forma profesional?
          </h3>
          <p className="text-blue-100 mb-8 text-lg">
            Únete a los profesionales que confían en CertificoEnergia
          </p>
          <Button 
            onClick={handleLogin} 
            size="lg" 
            variant="secondary" 
            className="bg-white text-primary hover:bg-gray-100"
          >
            Comenzar Ahora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold">CertificoEnergia</span>
          </div>
          <p className="text-gray-400">
            © 2024 CertificoEnergia. Plataforma profesional de certificación energética.
          </p>
        </div>
      </footer>
    </div>
  );
}
