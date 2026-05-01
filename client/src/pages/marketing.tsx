import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3, 
  Zap, 
  Calendar,
  Facebook,
  Instagram,
  Chrome,
  Play,
  Eye,
  MousePointer,
  Heart,
  MessageSquare,
  Share2,
  ExternalLink
} from "lucide-react";
import { SiFacebook, SiInstagram, SiTiktok, SiGoogle, SiGoogleads, SiLinkedin, SiYoutube } from "react-icons/si";
import Sidebar from "@/components/layout/sidebar";
import { useState } from "react";

export default function Marketing() {
  const [selectedTab, setSelectedTab] = useState("marketing");

  const platformFeatures = [
    {
      icon: SiFacebook,
      platform: "Facebook Ads",
      description: "Conecta con Meta Business Manager para gestionar campañas publicitarias dirigidas a propietarios locales interesados en certificación energética",
      features: ["Audiencias segmentadas por ubicación", "Campañas automatizadas", "Métricas de conversión", "Gestión de presupuesto"]
    },
    {
      icon: SiInstagram,
      platform: "Instagram Marketing",
      description: "Promociona tus servicios con contenido visual atractivo y historias que muestren antes/después de certificaciones",
      features: ["Stories automatizadas", "Posts programados", "Hashtags optimizados", "Engagement tracking"]
    },
    {
      icon: SiTiktok,
      platform: "TikTok Ads",
      description: "Llega a una audiencia más joven con videos cortos educativos sobre eficiencia energética y certificaciones",
      features: ["Video ads creativos", "Targeting por intereses", "Campañas de awareness", "Métricas de visualización"]
    },
    {
      icon: SiGoogleads,
      platform: "Google Ads",
      description: "Aparece en las búsquedas locales cuando propietarios buscan 'certificado energético' en tu zona",
      features: ["Palabras clave locales", "Extensiones de ubicación", "Llamadas directas", "ROI tracking"]
    },
    {
      icon: SiLinkedin,
      platform: "LinkedIn Business",
      description: "Conecta con administradores de fincas, arquitectos y profesionales del sector inmobiliario",
      features: ["Network profesional", "Contenido B2B", "Lead generation", "Partnerships"]
    },
    {
      icon: SiYoutube,
      platform: "YouTube Marketing",
      description: "Crea contenido educativo sobre certificación energética y posiciónate como experto del sector",
      features: ["Tutoriales técnicos", "Casos de éxito", "SEO optimizado", "Monetización"]
    }
  ];

  const analyticsFeatures = [
    {
      icon: Eye,
      title: "Visualización Unificada",
      description: "Dashboard centralizado con métricas de todas las plataformas publicitarias"
    },
    {
      icon: Users,
      title: "Captación de Clientes",
      description: "Tracking completo del customer journey desde la primera interacción hasta la conversión"
    },
    {
      icon: MousePointer,
      title: "Engagement Analysis",
      description: "Análisis profundo de interacciones, clics, y comportamiento de usuarios"
    },
    {
      icon: Target,
      title: "Optimización Automática",
      description: "IA que optimiza automáticamente tus campañas basándose en performance"
    },
    {
      icon: BarChart3,
      title: "ROI Inteligente",
      description: "Calcula el retorno de inversión real incluyendo el valor lifetime del cliente"
    },
    {
      icon: Share2,
      title: "Cross-Platform Sync",
      description: "Sincronización automática de audiencias y campañas entre plataformas"
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing Digital</h1>
                <p className="text-gray-600">Conecta con plataformas publicitarias y analiza el rendimiento de tus campañas</p>
              </div>
              <Badge variant="secondary" className="bg-gradient-to-r from-teal-100 to-blue-100 text-teal-700 px-4 py-2">
                <Calendar className="w-4 h-4 mr-2" />
                Próximamente
              </Badge>
            </div>
          </div>

          {/* Status Card */}
          <Card className="mb-8 border-gradient-to-r from-teal-200 to-blue-200">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-blue-50">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                Módulo de Marketing en Desarrollo
              </CardTitle>
              <CardDescription className="text-base">
                Estamos construyendo la suite de marketing más completa para certificadores energéticos. 
                Conecta todas tus plataformas publicitarias en un solo lugar y maximiza tu captación de clientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600 mb-1">6+</div>
                  <div className="text-sm text-gray-600">Plataformas Integradas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">360°</div>
                  <div className="text-sm text-gray-600">Vista Completa</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">AI</div>
                  <div className="text-sm text-gray-600">Optimización Automática</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Integrations */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Integraciones Publicitarias</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platformFeatures.map((platform, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <platform.icon className="w-8 h-8 text-blue-600" />
                      {platform.platform}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {platform.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {platform.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" className="w-full mt-4" disabled>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Conectar Próximamente
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Analytics & Insights */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Analytics & Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyticsFeatures.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-teal-100 to-blue-100 rounded-lg">
                        <feature.icon className="w-5 h-5 text-teal-600" />
                      </div>
                      {feature.title}
                    </CardTitle>
                    <CardDescription>
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Google Integration Highlight */}
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <SiGoogle className="w-8 h-8 text-blue-600" />
                Google Marketing Platform
              </CardTitle>
              <CardDescription className="text-base">
                Integración completa con el ecosistema de Google para maximizar tu visibilidad online
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Google Ads & Analytics</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      Palabras clave locales optimizadas
                    </li>
                    <li className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-green-500" />
                      Métricas de conversión en tiempo real
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-500" />
                      Audiencias similares automáticas
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Google My Business</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-500" />
                      Visibilidad en búsquedas locales
                    </li>
                    <li className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-blue-500" />
                      Gestión de reseñas automática
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      Reservas online integradas
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="text-center bg-gradient-to-r from-teal-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <Zap className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">¿Quieres ser el primero en probarlo?</h3>
              <p className="mb-6 opacity-90">
                Únete a nuestra lista de espera y recibe acceso anticipado al módulo de Marketing
              </p>
              <Button variant="secondary" className="bg-white text-teal-600 hover:bg-gray-100">
                <MessageSquare className="w-4 h-4 mr-2" />
                Notificarme cuando esté listo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}