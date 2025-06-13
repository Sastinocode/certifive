import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import Sidebar from "@/components/layout/sidebar";
import { 
  MessageCircle, 
  Send,
  Settings
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

export default function WhatsAppManagement() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("whatsapp");
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [whatsappConfig, setWhatsappConfig] = useState({
    token: "",
    phoneNumberId: "",
    webhookSecret: ""
  });

  // Conversation state mappings
  const conversationStateLabels = {
    initial: "Inicial",
    quote_sent: "Presupuesto Enviado",
    quote_viewed: "Presupuesto Visto",
    paid: "Pagado",
    certification_form_sent: "Formulario Enviado",
    certification_form_completed: "Formulario Completado",
    in_progress: "En Proceso",
    completed: "Completado"
  };

  const conversationStateColors = {
    initial: "bg-gray-100 text-gray-800",
    quote_sent: "bg-blue-100 text-blue-800",
    quote_viewed: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    certification_form_sent: "bg-purple-100 text-purple-800",
    certification_form_completed: "bg-indigo-100 text-indigo-800",
    in_progress: "bg-orange-100 text-orange-800",
    completed: "bg-emerald-100 text-emerald-800"
  };

  // Fetch conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["/api/whatsapp/conversations"],
  });

  // Fetch quote requests
  const { data: quoteRequests = [] } = useQuery({
    queryKey: ["/api/quote-requests"],
  });

  // Fetch WhatsApp status
  const { data: whatsappStatus = {} } = useQuery({
    queryKey: ["/api/whatsapp/status"],
  });



  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { phone: string; message: string }) => {
      return await apiRequest("POST", "/api/whatsapp/send-message", data);
    },
    onSuccess: () => {
      setMessageText("");
      toast({
        title: "Mensaje enviado",
        description: "El mensaje se envió correctamente",
      });
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
      setShowConfigDialog(false);
      toast({
        title: "Configuración guardada",
        description: "La configuración de WhatsApp se guardó correctamente",
      });
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
    return (quoteRequests as QuoteRequest[])?.find((q: QuoteRequest) => 
      q.clientPhone === conversation.clientPhone
    );
  };

  return (
    <div className="flex h-screen">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden backdrop-blur-md bg-white/70 border-b border-white/30 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Clientes WhatsApp</h1>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="flex h-full">
            {/* Sidebar - Conversations List */}
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
                    (whatsappStatus as any)?.integrationActive ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={(whatsappStatus as any)?.integrationActive ? 'text-green-700' : 'text-red-700'}>
                    {(whatsappStatus as any)?.integrationActive ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
                  </span>
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {loadingConversations ? (
                  <div className="p-4 text-center text-gray-500">Cargando conversaciones...</div>
                ) : conversations?.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay conversaciones</p>
                    <p className="text-xs mt-1">Los clientes aparecerán aquí cuando escriban</p>
                  </div>
                ) : (
                  conversations?.map((conversation: WhatsAppConversation) => {
                    const quote = getQuoteForConversation(conversation);
                    return (
                      <div
                        key={conversation.id}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                          selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <MessageCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {conversation.clientName || conversation.clientPhone}
                              </p>
                              <p className="text-sm text-gray-500">{conversation.clientPhone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">
                              {formatDate(conversation.lastMessageAt)}
                            </p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              conversationStateColors[conversation.conversationState as keyof typeof conversationStateColors] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {conversationStateLabels[conversation.conversationState as keyof typeof conversationStateLabels] || conversation.conversationState}
                            </span>
                          </div>
                        </div>
                        
                        {quote && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <p className="text-gray-600">
                              Presupuesto: {quote.basePrice ? `${quote.basePrice}€` : 'Pendiente'}
                            </p>
                            <p className="text-gray-500 text-xs">
                              Estado: {quote.status}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Main Content Area - Chat Interface */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {selectedConversation.clientName || selectedConversation.clientPhone}
                          </h3>
                          <p className="text-sm text-gray-500">{selectedConversation.clientPhone}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        conversationStateColors[selectedConversation.conversationState as keyof typeof conversationStateColors] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {conversationStateLabels[selectedConversation.conversationState as keyof typeof conversationStateLabels] || selectedConversation.conversationState}
                      </span>
                    </div>
                  </div>

                  {/* Chat Messages Area */}
                  <div className="flex-1 bg-gray-50 p-4">
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Historial de mensajes</p>
                      <p className="text-xs mt-1">Los mensajes aparecerán aquí próximamente</p>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="bg-white border-t border-gray-200 p-4">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Escribe tu mensaje..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="flex-1"
                        rows={3}
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
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-500">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Gestión de WhatsApp</h3>
                    <p>Selecciona una conversación para comenzar a chatear</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar WhatsApp Business</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="token">Token de Acceso</Label>
              <Input
                id="token"
                value={whatsappConfig.token}
                onChange={(e) => setWhatsappConfig(prev => ({ ...prev, token: e.target.value }))}
                placeholder="Tu token de WhatsApp Business"
                type="password"
              />
            </div>
            <div>
              <Label htmlFor="phoneNumberId">ID del Número de Teléfono</Label>
              <Input
                id="phoneNumberId"
                value={whatsappConfig.phoneNumberId}
                onChange={(e) => setWhatsappConfig(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                placeholder="ID de tu número de WhatsApp"
              />
            </div>
            <div>
              <Label htmlFor="webhookSecret">Webhook Secret</Label>
              <Input
                id="webhookSecret"
                value={whatsappConfig.webhookSecret}
                onChange={(e) => setWhatsappConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                placeholder="Secreto del webhook"
                type="password"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => configureWhatsAppMutation.mutate(whatsappConfig)}
                disabled={configureWhatsAppMutation.isPending}
              >
                {configureWhatsAppMutation.isPending ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}