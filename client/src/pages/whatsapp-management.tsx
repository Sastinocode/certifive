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

  // Handle authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Sesión expirada",
        description: "Redirigiendo al login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["/api/whatsapp/conversations"],
  });

  // Fetch WhatsApp status
  const { data: whatsappStatus } = useQuery({
    queryKey: ["/api/whatsapp/status"],
  });

  // Fetch quote requests for context
  const { data: quoteRequests = [] } = useQuery({
    queryKey: ["/api/quote-requests"],
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
              whatsappStatus?.integrationActive ? 'bg-green-500' : 'bg-red-500'
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
                  className="bg-green-600 hover:bg-green-700"
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
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleCreateAndSendQuote}
                  disabled={createQuoteLinkMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {createQuoteLinkMutation.isPending ? "Creando..." : "Crear Nuevo Presupuesto"}
                </Button>
                <Button 
                  onClick={() => window.location.href = '/whatsapp-flow-editor'}
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Configurar Flujo Conversacional
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-green-600" />
              Configurar WhatsApp Business
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="businessToken">Token de Acceso Permanente</Label>
              <Input
                id="businessToken"
                type="password"
                placeholder="EAAG..."
                value={whatsappConfig.businessToken}
                onChange={(e) => setWhatsappConfig(prev => ({ ...prev, businessToken: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Obténlo desde la configuración de tu aplicación en Meta Developers
              </p>
            </div>
            
            <div>
              <Label htmlFor="phoneNumberId">ID del Número de Teléfono</Label>
              <Input
                id="phoneNumberId"
                placeholder="1234567890123456"
                value={whatsappConfig.phoneNumberId}
                onChange={(e) => setWhatsappConfig(prev => ({ ...prev, phoneNumberId: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="businessAccountId">ID de Cuenta Business</Label>
              <Input
                id="businessAccountId"
                placeholder="1234567890123456"
                value={whatsappConfig.businessAccountId}
                onChange={(e) => setWhatsappConfig(prev => ({ ...prev, businessAccountId: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="webhookVerifyToken">Token de Verificación Webhook</Label>
              <Input
                id="webhookVerifyToken"
                placeholder="tu_token_secreto"
                value={whatsappConfig.webhookVerifyToken}
                onChange={(e) => setWhatsappConfig(prev => ({ ...prev, webhookVerifyToken: e.target.value }))}
              />
            </div>

            <div className="bg-yellow-50 p-3 rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Configurar Webhook</p>
                  <p className="mt-1">URL: <code className="bg-yellow-100 px-1 rounded">https://tu-dominio.com/api/webhooks/whatsapp</code></p>
                  <p className="mt-1">Token de verificación: usar el mismo token configurado arriba</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="integrationActive"
                checked={whatsappConfig.integrationActive}
                onChange={(e) => setWhatsappConfig(prev => ({ ...prev, integrationActive: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="integrationActive">Activar integración WhatsApp</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => configureWhatsAppMutation.mutate(whatsappConfig)}
                disabled={configureWhatsAppMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {configureWhatsAppMutation.isPending ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}