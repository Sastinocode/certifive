import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import { 
  CreditCard, 
  DollarSign, 
  BarChart3, 
  Globe, 
  Shield, 
  Wallet,
  CheckCircle,
  ExternalLink,
  Settings,
  AlertCircle,
  Zap
} from "lucide-react";

export default function StripeIntegration() {
  const [stripeKeys, setStripeKeys] = useState({
    publishableKey: "",
    secretKey: "",
    webhookSecret: ""
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const benefits = [
    {
      icon: CreditCard,
      title: "Automatiza el cobro de las suscripciones",
      description: "Cobra automáticamente a tus clientes mediante tarjeta o domiciliación"
    },
    {
      icon: Globe,
      title: "Facilita el acceso a tus servicios",
      description: "Permite a tus clientes pagar a través de la tienda en la app de forma segura"
    },
    {
      icon: BarChart3,
      title: "Controla todos los detalles de facturación",
      description: "Obtén informes detallados para la evolución de tu negocio"
    },
    {
      icon: DollarSign,
      title: "Comercializa tus servicios globalmente",
      description: "Acepta pagos de cualquier lugar del mundo con múltiples divisas"
    },
    {
      icon: Shield,
      title: "Pasarela de pagos segura",
      description: "Protección avanzada contra fraudes y cumplimiento PCI DSS"
    },
    {
      icon: Wallet,
      title: "Comisiones competitivas",
      description: "Aprovecha las tarifas ventajosas y transparentes de Stripe"
    }
  ];

  const handleSaveConfiguration = async () => {
    if (!stripeKeys.publishableKey || !stripeKeys.secretKey) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, completa al menos las claves pública y secreta",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Aquí iría la llamada a la API para guardar las claves de Stripe
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulación
      
      setIsConfigured(true);
      toast({
        title: "Configuración guardada",
        description: "Tu integración con Stripe ha sido configurada correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar selectedTab="stripe" onTabChange={() => {}} />
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Automatiza los pagos de tus servicios, las facturas y la contabilidad
            </h1>
            
            {!isConfigured ? (
              <Button 
                className="btn-certifive text-white px-8 py-3 rounded-full text-lg font-medium"
                onClick={() => document.getElementById('configuration-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Crea ya tu cuenta de pagos
              </Button>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <Badge className="bg-green-100 text-green-800 px-4 py-2 text-lg">
                  Stripe Configurado
                </Badge>
              </div>
            )}
          </div>

          {/* Benefits Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-8">
              Descubre todos los beneficios
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-teal-100 to-blue-100 rounded-lg flex items-center justify-center">
                        <benefit.icon className="w-8 h-8 text-teal-600" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Configuration Section */}
          <div id="configuration-section" className="space-y-6">
            <Card className="border-2 border-teal-200">
              <CardHeader>
                <div className="flex items-center">
                  <Settings className="w-6 h-6 text-teal-600 mr-3" />
                  <CardTitle className="text-xl">Configuración de Stripe</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isConfigured && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 mb-1">
                          ¿Cómo obtener las claves de Stripe?
                        </p>
                        <ol className="text-blue-800 space-y-1 list-decimal list-inside">
                          <li>Visita <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" className="underline">dashboard.stripe.com</a> para crear tu cuenta</li>
                          <li>Ve a "Desarrolladores" → "Claves API"</li>
                          <li>Copia tu "Clave publicable" y "Clave secreta"</li>
                          <li>Para webhooks, ve a "Desarrolladores" → "Webhooks"</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="publishableKey" className="text-sm font-medium">
                      Clave Publicable *
                    </Label>
                    <Input
                      id="publishableKey"
                      type="password"
                      placeholder="pk_live_..."
                      value={stripeKeys.publishableKey}
                      onChange={(e) => setStripeKeys(prev => ({ ...prev, publishableKey: e.target.value }))}
                      className="mt-1"
                      disabled={isConfigured}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Esta clave es segura para usar en tu frontend
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="secretKey" className="text-sm font-medium">
                      Clave Secreta *
                    </Label>
                    <Input
                      id="secretKey"
                      type="password"
                      placeholder="sk_live_..."
                      value={stripeKeys.secretKey}
                      onChange={(e) => setStripeKeys(prev => ({ ...prev, secretKey: e.target.value }))}
                      className="mt-1"
                      disabled={isConfigured}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Mantenida segura en el servidor
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="webhookSecret" className="text-sm font-medium">
                    Secreto del Webhook (Opcional)
                  </Label>
                  <Input
                    id="webhookSecret"
                    type="password"
                    placeholder="whsec_..."
                    value={stripeKeys.webhookSecret}
                    onChange={(e) => setStripeKeys(prev => ({ ...prev, webhookSecret: e.target.value }))}
                    className="mt-1"
                    disabled={isConfigured}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para verificar eventos de webhook de Stripe
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-teal-600" />
                    <span className="font-medium">Estado de la integración</span>
                  </div>
                  <Badge className={isConfigured ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {isConfigured ? "Configurado" : "Pendiente"}
                  </Badge>
                </div>

                {!isConfigured && (
                  <Button 
                    onClick={handleSaveConfiguration}
                    disabled={isLoading || !stripeKeys.publishableKey || !stripeKeys.secretKey}
                    className="btn-certifive w-full"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Configurando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Guardar Configuración
                      </>
                    )}
                  </Button>
                )}

                {isConfigured && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-green-900">
                          ¡Configuración completada!
                        </p>
                        <p className="text-sm text-green-700">
                          Tu integración con Stripe está activa y lista para procesar pagos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información adicional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Shield className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Seguridad</h4>
                    <p className="text-sm text-gray-600">Cumplimiento PCI DSS nivel 1</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <BarChart3 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Comisiones</h4>
                    <p className="text-sm text-gray-600">2.9% + 0.25€ por transacción</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Globe className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Cobertura</h4>
                    <p className="text-sm text-gray-600">Más de 40 países</p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    ¿Necesitas ayuda con la configuración?
                  </p>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver documentación de Stripe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}