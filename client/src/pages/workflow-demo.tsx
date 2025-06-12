import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  Phone, 
  Link as LinkIcon, 
  CreditCard, 
  FileText, 
  CheckCircle, 
  ArrowRight,
  Play,
  Clock,
  DollarSign,
  Camera,
  Award,
  Smartphone,
  Euro
} from "lucide-react";

const demoSteps = [
  {
    id: 1,
    title: "Cliente contacta por WhatsApp",
    description: "Un cliente potencial envía un mensaje inicial solicitando información sobre certificación energética",
    icon: MessageCircle,
    status: "completed",
    details: {
      message: "Hola, necesito un certificado energético para mi piso en Murcia. ¿Cuánto cuesta?",
      phone: "+34 666 123 456",
      timestamp: "Hoy, 10:15"
    }
  },
  {
    id: 2,
    title: "Sistema envía enlace de presupuesto automático",
    description: "El bot responde instantáneamente con un enlace personalizado para obtener presupuesto",
    icon: LinkIcon,
    status: "completed",
    details: {
      message: "¡Hola! Te ayudo con tu certificado energético. Rellena este formulario para un presupuesto personalizado:",
      link: "https://tu-dominio.com/presupuesto/abc123",
      responseTime: "< 1 segundo"
    }
  },
  {
    id: 3,
    title: "Cliente completa formulario de presupuesto",
    description: "El cliente rellena sus datos y características de la propiedad para recibir precio exacto",
    icon: FileText,
    status: "completed",
    details: {
      propertyType: "Vivienda",
      area: "85 m²",
      location: "Murcia Centro",
      price: "120€",
      advance: "60€ (50%)",
      deliveryDays: 5
    }
  },
  {
    id: 4,
    title: "Pago del anticipo (50%)",
    description: "El cliente paga el 50% del anticipo mediante Stripe para confirmar el servicio",
    icon: CreditCard,
    status: "completed",
    details: {
      amount: "60€",
      method: "Tarjeta Visa **** 1234",
      timestamp: "Hoy, 10:22",
      status: "Confirmado"
    }
  },
  {
    id: 5,
    title: "Sistema envía formulario de certificación automático",
    description: "Tras confirmar el pago, se envía automáticamente el formulario detallado de certificación",
    icon: Smartphone,
    status: "in_progress",
    details: {
      message: "¡Pago confirmado! Ahora completa este formulario con los datos técnicos de tu propiedad:",
      formLink: "https://tu-dominio.com/certificacion-cliente/abc123",
      sections: ["Datos generales", "Características inmueble", "Instalaciones", "Fotografías"]
    }
  },
  {
    id: 6,
    title: "Cliente completa formulario con fotos",
    description: "El cliente sube todas las fotos requeridas y completa la información técnica detallada",
    icon: Camera,
    status: "pending",
    details: {
      requiredPhotos: [
        "Fachada principal",
        "Ventanas exteriores",
        "Sistema calefacción",
        "Agua caliente sanitaria"
      ],
      progress: "0/4 secciones"
    }
  },
  {
    id: 7,
    title: "Técnico procesa certificación",
    description: "El certificador revisa toda la información y genera el certificado energético oficial",
    icon: Award,
    status: "pending",
    details: {
      assignedTo: "Técnico certificador",
      estimatedTime: "3-5 días laborables",
      rating: "Pendiente de cálculo"
    }
  },
  {
    id: 8,
    title: "Entrega certificado y cobro final",
    description: "Se entrega el certificado oficial y se procesa el 50% restante del pago",
    icon: CheckCircle,
    status: "pending",
    details: {
      finalPayment: "60€",
      deliverables: ["Certificado PDF oficial", "Etiqueta energética", "Informe técnico"],
      registrationIncluded: true
    }
  }
];

const statusColors = {
  completed: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  pending: "bg-gray-100 text-gray-600"
};

const statusLabels = {
  completed: "Completado",
  in_progress: "En Proceso",
  pending: "Pendiente"
};

export default function WorkflowDemo() {
  const [selectedStep, setSelectedStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const playDemo = () => {
    setIsPlaying(true);
    // Simular progresión automática de pasos
    setTimeout(() => setIsPlaying(false), 3000);
  };

  const currentStep = demoSteps.find(step => step.id === selectedStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Flujo Automatizado WhatsApp Business
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Demostración completa del proceso automatizado de certificación energética
          </p>
          <Button 
            onClick={playDemo}
            disabled={isPlaying}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
          >
            <Play className="w-5 h-5 mr-2" />
            {isPlaying ? "Reproduciendo..." : "Ver Demostración Completa"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline de pasos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-600" />
                  Flujo de Trabajo Automatizado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {demoSteps.map((step, index) => (
                    <div key={step.id} className="flex items-start space-x-4">
                      {/* Step indicator */}
                      <div className="flex flex-col items-center">
                        <div 
                          className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                            selectedStep === step.id 
                              ? 'bg-blue-600 text-white ring-4 ring-blue-200' 
                              : step.status === 'completed'
                              ? 'bg-green-500 text-white'
                              : step.status === 'in_progress'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                          onClick={() => setSelectedStep(step.id)}
                        >
                          <step.icon className="w-5 h-5" />
                        </div>
                        {index < demoSteps.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                        )}
                      </div>

                      {/* Step content */}
                      <div 
                        className={`flex-1 cursor-pointer transition-all ${
                          selectedStep === step.id ? 'transform scale-105' : ''
                        }`}
                        onClick={() => setSelectedStep(step.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{step.title}</h3>
                          <Badge className={statusColors[step.status]}>
                            {statusLabels[step.status]}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalles del paso seleccionado */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  {currentStep && <currentStep.icon className="w-5 h-5 mr-2 text-blue-600" />}
                  Paso {selectedStep}: Detalles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentStep && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">{currentStep.title}</h4>
                      <p className="text-sm text-gray-600">{currentStep.description}</p>
                    </div>

                    <Separator />

                    {/* Detalles específicos por paso */}
                    {selectedStep === 1 && (
                      <div className="space-y-3">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center mb-2">
                            <MessageCircle className="w-4 h-4 text-green-600 mr-2" />
                            <span className="font-medium text-green-800">Mensaje recibido</span>
                          </div>
                          <p className="text-sm text-green-700">"{currentStep.details.message}"</p>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {currentStep.details.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          {currentStep.details.timestamp}
                        </div>
                      </div>
                    )}

                    {selectedStep === 2 && (
                      <div className="space-y-3">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center mb-2">
                            <MessageCircle className="w-4 h-4 text-blue-600 mr-2" />
                            <span className="font-medium text-blue-800">Respuesta automática</span>
                          </div>
                          <p className="text-sm text-blue-700 mb-2">"{currentStep.details.message}"</p>
                          <div className="bg-blue-100 p-2 rounded text-xs text-blue-800 break-all">
                            {currentStep.details.link}
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-green-600">
                          <Clock className="w-4 h-4 mr-2" />
                          Tiempo de respuesta: {currentStep.details.responseTime}
                        </div>
                      </div>
                    )}

                    {selectedStep === 3 && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Tipo:</span>
                            <p className="font-medium">{currentStep.details.propertyType}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Superficie:</span>
                            <p className="font-medium">{currentStep.details.area}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Ubicación:</span>
                            <p className="font-medium">{currentStep.details.location}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Entrega:</span>
                            <p className="font-medium">{currentStep.details.deliveryDays} días</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-green-800">Precio total:</span>
                            <span className="text-lg font-bold text-green-800">{currentStep.details.price}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-600">Anticipo (50%):</span>
                            <span className="font-medium text-green-700">{currentStep.details.advance}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedStep === 4 && (
                      <div className="space-y-3">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                            <span className="font-medium text-green-800">Pago confirmado</span>
                          </div>
                          <div className="space-y-1 text-sm text-green-700">
                            <p>Importe: {currentStep.details.amount}</p>
                            <p>Método: {currentStep.details.method}</p>
                            <p>Fecha: {currentStep.details.timestamp}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedStep === 5 && (
                      <div className="space-y-3">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Smartphone className="w-4 h-4 text-blue-600 mr-2" />
                            <span className="font-medium text-blue-800">Formulario enviado</span>
                          </div>
                          <p className="text-sm text-blue-700 mb-2">"{currentStep.details.message}"</p>
                          <div className="bg-blue-100 p-2 rounded text-xs text-blue-800 break-all">
                            {currentStep.details.formLink}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Secciones del formulario:</span>
                          <ul className="mt-1 text-sm space-y-1">
                            {currentStep.details.sections.map((section, idx) => (
                              <li key={idx} className="flex items-center">
                                <div className="w-2 h-2 bg-blue-300 rounded-full mr-2"></div>
                                {section}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {selectedStep === 6 && (
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-500">Fotos requeridas:</span>
                          <ul className="mt-2 space-y-2">
                            {currentStep.details.requiredPhotos.map((photo, idx) => (
                              <li key={idx} className="flex items-center text-sm">
                                <Camera className="w-4 h-4 text-gray-400 mr-2" />
                                {photo}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <span className="text-orange-800 font-medium">Progreso: {currentStep.details.progress}</span>
                        </div>
                      </div>
                    )}

                    {selectedStep === 7 && (
                      <div className="space-y-3">
                        <div className="text-sm space-y-2">
                          <div className="flex items-center">
                            <span className="text-gray-500 w-20">Asignado:</span>
                            <span className="font-medium">{currentStep.details.assignedTo}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-500 w-20">Tiempo:</span>
                            <span className="font-medium">{currentStep.details.estimatedTime}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-500 w-20">Calificación:</span>
                            <span className="font-medium">{currentStep.details.rating}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedStep === 8 && (
                      <div className="space-y-3">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-green-800">Pago final:</span>
                            <span className="text-lg font-bold text-green-800">{currentStep.details.finalPayment}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Entregables:</span>
                          <ul className="mt-1 text-sm space-y-1">
                            {currentStep.details.deliverables.map((item, idx) => (
                              <li key={idx} className="flex items-center">
                                <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                                {item}
                              </li>
                            ))}
                          </ul>
                          {currentStep.details.registrationIncluded && (
                            <div className="mt-2 bg-blue-50 p-2 rounded text-sm text-blue-800">
                              ✓ Registro oficial incluido
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Métricas del flujo */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Beneficios del Flujo Automatizado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Tiempo de Respuesta</h4>
                  <p className="text-2xl font-bold text-green-600">{"< 1"} seg</p>
                  <p className="text-sm text-gray-600">Respuesta automática instantánea</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Tasa de Conversión</h4>
                  <p className="text-2xl font-bold text-blue-600">+300%</p>
                  <p className="text-sm text-gray-600">Comparado con métodos tradicionales</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Automatización</h4>
                  <p className="text-2xl font-bold text-purple-600">80%</p>
                  <p className="text-sm text-gray-600">Del proceso completamente automatizado</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Satisfacción Cliente</h4>
                  <p className="text-2xl font-bold text-orange-600">95%</p>
                  <p className="text-sm text-gray-600">Proceso claro y transparente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}