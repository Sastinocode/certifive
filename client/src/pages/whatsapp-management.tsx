import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import { 
  MessageCircle, 
  Phone, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Send,
  Settings,
  Plus,
  Eye,
  Euro,
  Calendar,
  User,
  Building,
  Map,
  CreditCard,
  FileText,
  Zap
} from "lucide-react";

interface WhatsAppConversation {
  id: number;
  clientPhone: string;
  clientName?: string;
  conversationState: string;
  lastMessageAt: string;
  quoteRequestId?: number;
  createdAt: string;
}

interface QuoteRequest {
  id: number;
  uniqueLink: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  propertyType?: string;
  address?: string;
  basePrice?: string;
  advanceAmount?: string;
  deliveryDays?: number;
  status: string;
  createdAt: string;
  paidAt?: string;
}

const conversationStateLabels = {
  'initial': 'Inicial',
  'quote_sent': 'Presupuesto Enviado',
  'quote_viewed': 'Presupuesto Visto',
  'paid': 'Pagado',
  'certification_form_sent': 'Formulario Enviado',
  'certification_form_completed': 'Formulario Completado',
  'in_progress': 'En Proceso',
  'completed': 'Completado'
};

const conversationStateColors = {
  'initial': 'bg-gray-100 text-gray-800',
  'quote_sent': 'bg-blue-100 text-blue-800',
  'quote_viewed': 'bg-yellow-100 text-yellow-800',
  'paid': 'bg-green-100 text-green-800',
  'certification_form_sent': 'bg-purple-100 text-purple-800',
  'certification_form_completed': 'bg-indigo-100 text-indigo-800',
  'in_progress': 'bg-orange-100 text-orange-800',
  'completed': 'bg-emerald-100 text-emerald-800'
};

export default function WhatsAppManagement() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState("whatsapp");
  const [whatsappConfig, setWhatsappConfig] = useState({
    businessToken: "",
    phoneNumberId: "",
    businessAccountId: "",
    webhookVerifyToken: "",
    integrationActive: false
  });

  // Fetch conversations (only if authenticated)
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["/api/whatsapp/conversations"],
    enabled: isAuthenticated && !isLoading,
  });

  // Fetch WhatsApp status (only if authenticated)
  const { data: whatsappStatus } = useQuery({
    queryKey: ["/api/whatsapp/status"],
    enabled: isAuthenticated && !isLoading,
  });

  // Fetch quote requests for context (only if authenticated)
  const { data: quoteRequests = [] } = useQuery({
    queryKey: ["/api/quote-requests"],
    enabled: isAuthenticated && !isLoading,
  });

  // Create new quote link mutation
  const createQuoteLinkMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/quote-requests");
    },
    onSuccess: (data) => {
      toast({
        title: "Enlace creado",
        description: `Nuevo enlace de presupuesto: ${data.uniqueLink}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quote-requests"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el enlace de presupuesto",
        variant: "destructive",
      });
    },
  });

  // Send WhatsApp message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { phone: string; message: string }) => {
      return await apiRequest("POST", "/api/whatsapp/send-message", data);
    },
    onSuccess: () => {
      toast({
        title: "Mensaje enviado",
        description: "El mensaje se ha enviado correctamente",
      });
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/conversations"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    },
  });

  // Configure WhatsApp mutation
  const configureWhatsAppMutation = useMutation({
    mutationFn: async (config: any) => {
      return await apiRequest("POST", "/api/whatsapp/configure", config);
    },
    onSuccess: () => {
      toast({
        title: "Configuración guardada",
        description: "WhatsApp Business se ha configurado correctamente",
      });
      setShowConfigDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!selectedConversation || !messageText.trim()) return;
    
    sendMessageMutation.mutate({
      phone: selectedConversation.clientPhone,
      message: messageText
    });
  };

  const handleCreateAndSendQuote = () => {
    createQuoteLinkMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getQuoteForConversation = (conversation: WhatsAppConversation) => {
    return quoteRequests.find((q: QuoteRequest) => 
      q.clientPhone === conversation.clientPhone
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
      <div className="flex-1 flex bg-gray-50">
        {/* Conversations List */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Conversaciones WhatsApp</h2>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowConfigDialog(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* WhatsApp Status */}
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              whatsappStatus?.integrationActive ? 'bg-cyan-500' : 'bg-red-500'
            }`}></div>
            <span className={whatsappStatus?.integrationActive ? 'text-green-700' : 'text-red-700'}>
              {whatsappStatus?.integrationActive ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
            </span>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="p-4 text-center text-gray-500">Cargando conversaciones...</div>
          ) : !whatsappStatus?.integrationActive ? (
            <div className="p-6 text-center">
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 border border-teal-200">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-teal-500" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Configura tu WhatsApp Business
                </h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  Para recibir y gestionar conversaciones de clientes, necesitas conectar tu cuenta de WhatsApp Business.
                </p>
                <div className="space-y-3 text-left">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-teal-600 font-bold">1</span>
                    </div>
                    <p className="text-sm text-gray-700">Crea una aplicación en Meta for Developers</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-teal-600 font-bold">2</span>
                    </div>
                    <p className="text-sm text-gray-700">Obtén tu token de acceso y configuración de API</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-teal-600 font-bold">3</span>
                    </div>
                    <p className="text-sm text-gray-700">Configura los datos en el formulario</p>
                  </div>
                </div>
                <Button 
                  className="mt-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
                  onClick={() => setShowConfigDialog(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar WhatsApp Business
                </Button>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No hay conversaciones</p>
              <p className="text-xs mt-1">Los clientes aparecerán aquí cuando escriban</p>
            </div>
          ) : (
            conversations.map((conversation: WhatsAppConversation) => {
              const quote = getQuoteForConversation(conversation);
              return (
                <div
                  key={conversation.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {conversation.clientName || conversation.clientPhone}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {conversation.clientPhone}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge 
                          className={`text-xs ${
                            conversationStateColors[conversation.conversationState] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {conversationStateLabels[conversation.conversationState] || conversation.conversationState}
                        </Badge>
                        {quote && (
                          <Badge variant="outline" className="text-xs">
                            {quote.basePrice}€
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(conversation.lastMessageAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        </div>

        {/* Main Content - Conversation Details */}
        <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedConversation.clientName || selectedConversation.clientPhone}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedConversation.clientPhone}</p>
                </div>
                <Badge 
                  className={`${
                    conversationStateColors[selectedConversation.conversationState] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {conversationStateLabels[selectedConversation.conversationState] || selectedConversation.conversationState}
                </Badge>
              </div>
            </div>

            {/* Quote Information */}
            {(() => {
              const quote = getQuoteForConversation(selectedConversation);
              if (quote) {
                return (
                  <div className="bg-blue-50 border-b border-blue-200 p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-600">Tipo</p>
                          <p className="font-medium text-blue-900">{quote.propertyType || 'No especificado'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Euro className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-600">Precio</p>
                          <p className="font-medium text-blue-900">{quote.basePrice}€</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-600">Entrega</p>
                          <p className="font-medium text-blue-900">{quote.deliveryDays} días</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-600">Estado</p>
                          <p className="font-medium text-blue-900">
                            {quote.status === 'paid' ? 'Pagado' : 
                             quote.status === 'pending' ? 'Pendiente' : quote.status}
                          </p>
                        </div>
                      </div>
                    </div>
                    {quote.status === 'paid' && (
                      <div className="mt-3 flex items-center text-green-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">
                          Pago confirmado el {formatDate(quote.paidAt || quote.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            {/* Messages Area */}
            <div className="flex-1 p-4 bg-gray-50">
              <div className="text-center text-gray-500 mb-4">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Historial de mensajes</p>
                <p className="text-xs">Los mensajes aparecerán aquí cuando se configuren los webhooks</p>
              </div>
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex space-x-3">
                <Textarea
                  placeholder="Escribir mensaje..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  className="btn-certifive"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Gestión de Clientes WhatsApp
              </h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Selecciona una conversación para ver los detalles del cliente y gestionar su proceso de certificación energética.
              </p>
              <Button 
                onClick={() => window.location.href = '/whatsapp-flow-editor'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Configurar Flujo Conversacional
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-teal-600" />
              Registrar WhatsApp Business
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              Conecta tu cuenta de WhatsApp Business para automatizar conversaciones con clientes
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Setup Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded mr-2">GUÍA</span>
                Pasos para configurar WhatsApp Business API
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">1</span>
                  <div>
                    <p className="font-medium text-blue-900">Crear aplicación en Meta for Developers</p>
                    <p className="text-blue-700">Ve a <code className="bg-blue-100 px-1 rounded">developers.facebook.com</code> y crea una nueva app</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">2</span>
                  <div>
                    <p className="font-medium text-blue-900">Agregar producto WhatsApp Business</p>
                    <p className="text-blue-700">En tu app, agrega el producto "WhatsApp Business API"</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">3</span>
                  <div>
                    <p className="font-medium text-blue-900">Obtener credenciales</p>
                    <p className="text-blue-700">Copia el token de acceso, Phone Number ID y Business Account ID</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessToken" className="text-sm font-medium">
                  Token de Acceso Permanente *
                </Label>
                <Input
                  id="businessToken"
                  type="password"
                  placeholder="EAAG... (ejemplo: EAAGxxxxxxxxxxxx)"
                  value={whatsappConfig.businessToken}
                  onChange={(e) => setWhatsappConfig(prev => ({ ...prev, businessToken: e.target.value }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se encuentra en tu app de Meta → WhatsApp → Configuración → Tokens de acceso
                </p>
              </div>
              
              <div>
                <Label htmlFor="phoneNumberId" className="text-sm font-medium">
                  ID del Número de Teléfono *
                </Label>
                <Input
                  id="phoneNumberId"
                  placeholder="123456789012345 (15 dígitos)"
                  value={whatsappConfig.phoneNumberId}
                  onChange={(e) => setWhatsappConfig(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ID numérico de tu número de WhatsApp Business
                </p>
              </div>
              
              <div>
                <Label htmlFor="businessAccountId" className="text-sm font-medium">
                  ID de Cuenta Business *
                </Label>
                <Input
                  id="businessAccountId"
                  placeholder="123456789012345 (15 dígitos)"
                  value={whatsappConfig.businessAccountId}
                  onChange={(e) => setWhatsappConfig(prev => ({ ...prev, businessAccountId: e.target.value }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se encuentra en tu WhatsApp Business Account
                </p>
              </div>
              
              <div>
                <Label htmlFor="webhookVerifyToken" className="text-sm font-medium">
                  Token de Verificación Webhook *
                </Label>
                <Input
                  id="webhookVerifyToken"
                  placeholder="mi_token_secreto_123"
                  value={whatsappConfig.webhookVerifyToken}
                  onChange={(e) => setWhatsappConfig(prev => ({ ...prev, webhookVerifyToken: e.target.value }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Crea un token personalizado para verificar tu webhook
                </p>
              </div>

              {/* Webhook Configuration Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 mb-2">Configuración del Webhook</p>
                    <div className="space-y-1 text-amber-700">
                      <p><span className="font-medium">URL del Webhook:</span></p>
                      <code className="bg-amber-100 px-2 py-1 rounded text-xs block">
                        https://tu-dominio-replit.replit.app/api/webhooks/whatsapp
                      </code>
                      <p className="mt-2"><span className="font-medium">Token de verificación:</span> usar el mismo token configurado arriba</p>
                      <p className="text-xs mt-2">⚠️ Configura este webhook en tu aplicación de Meta for Developers</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activation Toggle */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="integrationActive"
                    checked={whatsappConfig.integrationActive}
                    onChange={(e) => setWhatsappConfig(prev => ({ ...prev, integrationActive: e.target.checked }))}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <Label htmlFor="integrationActive" className="text-sm font-medium">
                    Activar integración WhatsApp Business
                  </Label>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Una vez activado, podrás recibir y enviar mensajes automáticamente
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => configureWhatsAppMutation.mutate(whatsappConfig)}
                disabled={configureWhatsAppMutation.isPending || !whatsappConfig.businessToken || !whatsappConfig.phoneNumberId}
                className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
              >
                {configureWhatsAppMutation.isPending ? "Configurando..." : "Conectar WhatsApp Business"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}