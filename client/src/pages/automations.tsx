import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Brain, 
  Calendar, 
  MessageSquare, 
  Mic, 
  FileText, 
  Clock,
  Zap,
  Users,
  Target,
  Settings,
  Lightbulb,
  Database,
  Headphones,
  Search,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Cpu,
  Network
} from "lucide-react";
import { SiOpenai, SiGoogle } from "react-icons/si";
import Sidebar from "@/components/layout/sidebar";
import { useState } from "react";

export default function Automations() {
  const [selectedTab, setSelectedTab] = useState("automations");

  const aiAgents = [
    {
      icon: Users,
      title: "Agente de Atención al Cliente",
      description: "IA especializada en resolver problemas de clientes de manera inmediata y personalizada",
      features: [
        "Respuestas automáticas 24/7",
        "Resolución de dudas técnicas",
        "Escalado inteligente a humanos",
        "Historial de conversaciones"
      ],
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Calendar,
      title: "Agente Personal de Gestión",
      description: "Asistente IA para organizar agenda, calendario y tareas administrativas",
      features: [
        "Programación automática de citas",
        "Recordatorios inteligentes",
        "Gestión de prioridades",
        "Sincronización multi-plataforma"
      ],
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Database,
      title: "Agente RAG (Retrieval-Augmented Generation)",
      description: "IA que accede a tu base de conocimientos para respuestas precisas y contextualizadas",
      features: [
        "Búsqueda en documentos técnicos",
        "Respuestas basadas en datos reales",
        "Aprendizaje continuo",
        "Verificación de fuentes"
      ],
      color: "from-green-500 to-teal-500"
    },
    {
      icon: BookOpen,
      title: "Agente de Información Técnica",
      description: "Especialista en proyectos técnicos de certificación energética y normativas",
      features: [
        "Consultas por voz o texto",
        "Interpretación de normativas",
        "Cálculos automáticos",
        "Documentación técnica"
      ],
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Mic,
      title: "Agente de Voz Interactivo",
      description: "Interfaz de voz natural para interactuar con todos los sistemas de manera conversacional",
      features: [
        "Reconocimiento de voz avanzado",
        "Síntesis de voz natural",
        "Comandos por voz",
        "Transcripción automática"
      ],
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: Target,
      title: "Agente de Optimización",
      description: "IA que analiza y mejora automáticamente los procesos de certificación",
      features: [
        "Análisis de eficiencia",
        "Sugerencias de mejora",
        "Automatización de tareas",
        "Reportes de rendimiento"
      ],
      color: "from-yellow-500 to-orange-500"
    }
  ];

  const automationFeatures = [
    {
      icon: Zap,
      title: "Automatización de Flujos",
      description: "Crea flujos de trabajo personalizados que se ejecutan automáticamente"
    },
    {
      icon: Brain,
      title: "IA Conversacional",
      description: "Interactúa naturalmente con todos los agentes mediante chat o voz"
    },
    {
      icon: Network,
      title: "Integración Completa",
      description: "Conecta todos los módulos de CERTIFIVE para automatización total"
    },
    {
      icon: Lightbulb,
      title: "Aprendizaje Adaptativo",
      description: "Los agentes aprenden de tus patrones para mejorar constantemente"
    },
    {
      icon: Clock,
      title: "Disponibilidad 24/7",
      description: "Agentes disponibles las 24 horas para asistencia continua"
    },
    {
      icon: Settings,
      title: "Configuración Avanzada",
      description: "Personaliza cada agente según tus necesidades específicas"
    }
  ];

  const voiceCapabilities = [
    "Consultas técnicas por voz",
    "Dictado de informes",
    "Comandos de navegación",
    "Respuestas en audio",
    "Transcripción automática",
    "Múltiples idiomas"
  ];

  const useCases = [
    {
      title: "Consulta Técnica Rápida",
      description: "\"¿Cuál es el coeficiente U para ventanas en zona climática D3?\"",
      agent: "Agente Técnico"
    },
    {
      title: "Programación de Cita",
      description: "\"Programa una visita para certificación el próximo martes\"",
      agent: "Agente Personal"
    },
    {
      title: "Resolución de Problemas",
      description: "\"El cliente no entiende por qué su calificación es E\"",
      agent: "Agente Cliente"
    },
    {
      title: "Búsqueda en Documentos",
      description: "\"Busca información sobre RITE en mis archivos\"",
      agent: "Agente RAG"
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Automatizaciones con IA</h1>
                <p className="text-gray-600">Agentes inteligentes personalizados para optimizar tu trabajo diario</p>
              </div>
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                Próximamente
              </Badge>
            </div>
          </div>

          {/* Status Card */}
          <Card className="mb-8 border-gradient-to-r from-purple-200 to-blue-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                Suite de Agentes IA en Desarrollo
              </CardTitle>
              <CardDescription className="text-base">
                Estamos desarrollando la primera suite de agentes de IA especializada en certificación energética. 
                Cada agente está diseñado para resolver necesidades específicas de tu trabajo diario con inteligencia artificial avanzada.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">6+</div>
                  <div className="text-sm text-gray-600">Agentes Especializados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">Voz</div>
                  <div className="text-sm text-gray-600">Interacción Natural</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">24/7</div>
                  <div className="text-sm text-gray-600">Disponibilidad</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">RAG</div>
                  <div className="text-sm text-gray-600">Base de Conocimiento</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Agents Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Agentes de IA Especializados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiAgents.map((agent, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 bg-gradient-to-r ${agent.color} rounded-lg`}>
                        <agent.icon className="w-6 h-6 text-white" />
                      </div>
                      {agent.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {agent.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {agent.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" className="w-full mt-4" disabled>
                      <Bot className="w-4 h-4 mr-2" />
                      Activar Próximamente
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Voice Interaction Highlight */}
          <Card className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Mic className="w-8 h-8 text-indigo-600" />
                Interacción por Voz Avanzada
              </CardTitle>
              <CardDescription className="text-base">
                Habla naturalmente con todos los agentes. Pregunta por voz, recibe respuestas en audio y controla toda la plataforma con comandos de voz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Capacidades de Voz</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {voiceCapabilities.map((capability, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <Headphones className="w-4 h-4 text-indigo-500" />
                        {capability}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-indigo-100">
                  <h4 className="font-semibold text-gray-900 mb-3">Ejemplos de Uso</h4>
                  <div className="space-y-3">
                    {useCases.map((useCase, idx) => (
                      <div key={idx} className="border-l-4 border-indigo-300 pl-3">
                        <div className="text-sm font-medium text-gray-700">{useCase.description}</div>
                        <div className="text-xs text-indigo-600">{useCase.agent}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Automation Features */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Características de Automatización</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {automationFeatures.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                        <feature.icon className="w-5 h-5 text-purple-600" />
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

          {/* Integration Partners */}
          <Card className="mb-8 bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Cpu className="w-8 h-8 text-blue-600" />
                Tecnología de IA Avanzada
              </CardTitle>
              <CardDescription className="text-base">
                Impulsado por los modelos de IA más avanzados para garantizar respuestas precisas y naturales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                  <SiOpenai className="w-8 h-8 text-green-600" />
                  <div>
                    <div className="font-semibold">OpenAI GPT-4</div>
                    <div className="text-sm text-gray-600">Procesamiento de lenguaje natural</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                  <SiGoogle className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="font-semibold">Google Cloud AI</div>
                    <div className="text-sm text-gray-600">Reconocimiento de voz</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                  <Cpu className="w-8 h-8 text-blue-700" />
                  <div>
                    <div className="font-semibold">Azure Cognitive</div>
                    <div className="text-sm text-gray-600">Análisis de documentos</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RAG System Highlight */}
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Database className="w-8 h-8 text-green-600" />
                Sistema RAG (Retrieval-Augmented Generation)
              </CardTitle>
              <CardDescription className="text-base">
                Agente especializado que accede a tu base de conocimientos personalizada para respuestas precisas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Fuentes de Información</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-500" />
                      Normativas técnicas españolas (CTE, RITE, etc.)
                    </li>
                    <li className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-green-500" />
                      Tu biblioteca de documentos técnicos
                    </li>
                    <li className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-green-500" />
                      Historial de certificaciones anteriores
                    </li>
                    <li className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-green-500" />
                      Base de datos de casos resueltos
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Capacidades Avanzadas</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-blue-500" />
                      Comprensión contextual profunda
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      Respuestas específicas al contexto
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Verificación automática de fuentes
                    </li>
                    <li className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-blue-500" />
                      Sugerencias proactivas
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="text-center bg-gradient-to-r from-purple-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <Bot className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">¿Listo para el futuro de la certificación energética?</h3>
              <p className="mb-6 opacity-90">
                Sé el primero en experimentar el poder de los agentes de IA especializados
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Notificarme cuando esté listo
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Ver demo de agentes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}