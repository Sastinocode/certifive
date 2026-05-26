// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import {
  MessageCircle, Phone, Send, Settings, Plus,
  Euro, Calendar, Building, CreditCard, FileText,
  Search, Paperclip, Smile, CheckCircle, AlertTriangle,
  Mail, MapPin
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

const conversationStateLabels: Record<string, string> = {
  initial: "Inicial",
  quote_sent: "Presupuesto Enviado",
  quote_viewed: "Presupuesto Visto",
  paid: "Pagado",
  certification_form_sent: "Formulario Enviado",
  certification_form_completed: "Formulario Completado",
  in_progress: "En Proceso",
  completed: "Completado",
};

const conversationStateColors: Record<string, string> = {
  initial: "bg-muted text-muted-foreground",
  quote_sent: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
  quote_viewed: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  paid: "bg-primary/10 text-primary",
  certification_form_sent: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300",
  certification_form_completed: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300",
  in_progress: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  completed: "bg-primary/10 text-primary",
};

const CONV_FILTERS = [
  { value: "all", label: "Todas" },
  { value: "initial", label: "Nuevas" },
  { value: "quote_sent", label: "Presupuesto" },
  { value: "paid", label: "Pagadas" },
  { value: "completed", label: "Cerradas" },
];

const AVATAR_GRADIENTS = [
  "from-emerald-400 to-emerald-600",
  "from-violet-400 to-violet-600",
  "from-rose-400 to-rose-500",
  "from-blue-400 to-blue-600",
  "from-amber-400 to-amber-600",
  "from-teal-400 to-teal-600",
  "from-indigo-400 to-indigo-600",
  "from-slate-400 to-slate-600",
];

function avatarGradient(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

function initials(name: string) {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export default function WhatsAppManagement() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState("whatsapp");
  const [convSearch, setConvSearch] = useState("");
  const [convFilter, setConvFilter] = useState("all");
  const [whatsappConfig, setWhatsappConfig] = useState({
    businessToken: "",
    phoneNumberId: "",
    businessAccountId: "",
    webhookVerifyToken: "",
    integrationActive: false,
  });

  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["/api/whatsapp/conversations"],
    enabled: isAuthenticated && !isLoading,
  });

  const { data: whatsappStatus } = useQuery({
    queryKey: ["/api/whatsapp/status"],
    enabled: isAuthenticated && !isLoading,
  });

  const { data: quoteRequests = [] } = useQuery({
    queryKey: ["/api/quote-requests"],
    enabled: isAuthenticated && !isLoading,
  });

  const createQuoteLinkMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/quote-requests");
    },
    onSuccess: (data) => {
      toast({ title: "Enlace creado", description: `Nuevo enlace de presupuesto: ${data.uniqueLink}` });
      queryClient.invalidateQueries({ queryKey: ["/api/quote-requests"] });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear el enlace de presupuesto", variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { phone: string; message: string }) => {
      return await apiRequest("POST", "/api/whatsapp/send-message", data);
    },
    onSuccess: () => {
      toast({ title: "Mensaje enviado", description: "El mensaje se ha enviado correctamente" });
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/conversations"] });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo enviar el mensaje", variant: "destructive" });
    },
  });

  const configureWhatsAppMutation = useMutation({
    mutationFn: async (config: any) => {
      return await apiRequest("POST", "/api/whatsapp/configure", config);
    },
    onSuccess: () => {
      toast({ title: "Configuración guardada", description: "WhatsApp Business se ha configurado correctamente" });
      setShowConfigDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar la configuración", variant: "destructive" });
    },
  });

  const handleSendMessage = () => {
    if (!selectedConversation || !messageText.trim()) return;
    sendMessageMutation.mutate({ phone: selectedConversation.clientPhone, message: messageText });
  };

  const handleCreateAndSendQuote = () => {
    createQuoteLinkMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const getQuoteForConversation = (conversation: WhatsAppConversation) => {
    return quoteRequests.find((q: QuoteRequest) => q.clientPhone === conversation.clientPhone);
  };

  const allConvs: WhatsAppConversation[] = Array.isArray(conversations) ? conversations : [];

  const filteredConversations = allConvs.filter((c) => {
    const matchFilter = convFilter === "all" || c.conversationState === convFilter;
    const term = convSearch.toLowerCase();
    const matchSearch = !term || (c.clientName || "").toLowerCase().includes(term) || c.clientPhone.includes(term);
    return matchFilter && matchSearch;
  });

  const countByFilter = (f: string) =>
    f === "all" ? allConvs.length : allConvs.filter((c) => c.conversationState === f).length;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const selectedQuote = selectedConversation ? getQuoteForConversation(selectedConversation) : null;
  const selDisplayName = selectedConversation
    ? selectedConversation.clientName || selectedConversation.clientPhone
    : "";
  const selInitials = selDisplayName ? initials(selDisplayName) : "";
  const selGradient = selDisplayName ? avatarGradient(selDisplayName) : "";

  return (
    <div className="flex h-screen bg-background">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Page header */}
        <div className="px-6 py-3 border-b border-border bg-card flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-[#25D366] flex items-center justify-center text-white">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-card ${
                  whatsappStatus?.integrationActive ? "bg-primary" : "bg-red-500"
                }`}
              />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight">Buzón de WhatsApp</h1>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${whatsappStatus?.integrationActive ? "bg-primary" : "bg-red-500"}`} />
                {whatsappStatus?.integrationActive ? "Conectado" : "Desconectado"}
                {allConvs.length > 0 && ` · ${allConvs.length} conversaciones`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfigDialog(true)}
              className="h-9 px-3 rounded-full border border-border bg-card text-xs font-medium hover:bg-muted/40 inline-flex items-center gap-1.5 text-foreground"
            >
              <Settings className="w-3.5 h-3.5" />
              Configurar
            </button>
            <button
              onClick={handleCreateAndSendQuote}
              disabled={createQuoteLinkMutation.isPending}
              className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva conversación
            </button>
          </div>
        </div>

        {/* 3-column layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr_300px] overflow-hidden">

          {/* ── Conversations list ── */}
          <section className="bg-card border-r border-border flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border space-y-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={convSearch}
                  onChange={(e) => setConvSearch(e.target.value)}
                  placeholder="Buscar conversaciones…"
                  className="w-full h-9 pl-9 pr-3 bg-muted/40 border border-transparent rounded-full text-xs font-medium placeholder:text-muted-foreground focus:outline-none focus:bg-background focus:border-border text-foreground"
                />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {CONV_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setConvFilter(f.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium transition-all flex-shrink-0 ${
                      convFilter === f.value
                        ? "bg-foreground text-background border-foreground"
                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {f.label}
                    <span
                      className={`rounded-full px-1 text-[9px] font-bold ${
                        convFilter === f.value ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {countByFilter(f.value)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto" />
                </div>
              ) : !whatsappStatus?.integrationActive ? (
                <div className="m-4 rounded-2xl border border-border bg-muted/20 p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#25D366]/10 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-7 h-7 text-[#25D366]" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">Configura tu WhatsApp Business</h3>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    Conecta tu cuenta para recibir y gestionar conversaciones de clientes.
                  </p>
                  <div className="space-y-2 text-left mb-4">
                    {[
                      "Crea una aplicación en Meta for Developers",
                      "Obtén tu token de acceso y configuración de API",
                      "Configura los datos en el formulario",
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-xs text-muted-foreground">{step}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowConfigDialog(true)}
                    className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 w-full justify-center"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Configurar WhatsApp Business
                  </button>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 bg-muted/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Sin conversaciones</p>
                  <p className="text-xs text-muted-foreground">
                    {convSearch || convFilter !== "all"
                      ? "No hay resultados para los filtros aplicados."
                      : "Los clientes aparecerán aquí cuando escriban al número conectado."}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation: WhatsAppConversation) => {
                  const quote = getQuoteForConversation(conversation);
                  const displayName = conversation.clientName || conversation.clientPhone;
                  const isActive = selectedConversation?.id === conversation.id;
                  const stateColor = conversationStateColors[conversation.conversationState] || "bg-muted text-muted-foreground";
                  const stateLabel = conversationStateLabels[conversation.conversationState] || conversation.conversationState;
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`flex gap-3 px-4 py-3 border-b border-border cursor-pointer transition-colors ${
                        isActive
                          ? "bg-primary/[0.06] border-l-[3px] border-l-primary pl-[13px]"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(displayName)} flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0`}
                      >
                        {initials(displayName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                          <p className={`text-[10px] flex-shrink-0 font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                            {new Date(conversation.lastMessageAt).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">{conversation.clientPhone}</p>
                        <div className="flex items-center justify-between mt-1.5 gap-2">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${stateColor}`}>
                            {stateLabel}
                          </span>
                          {quote?.basePrice && (
                            <span className="text-[10px] font-semibold text-muted-foreground">{quote.basePrice}€</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* ── Chat window ── */}
          <section className="flex flex-col overflow-hidden bg-background">
            {selectedConversation ? (
              <>
                {/* Chat header */}
                <header className="px-5 py-3 border-b border-border bg-card flex items-center justify-between gap-3 flex-shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${selGradient} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}
                    >
                      {selInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{selDisplayName}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {selectedConversation.clientPhone}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 ${
                      conversationStateColors[selectedConversation.conversationState] || "bg-muted text-muted-foreground"
                    }`}
                  >
                    {conversationStateLabels[selectedConversation.conversationState] || selectedConversation.conversationState}
                  </span>
                </header>

                {/* Pinned quote context bar */}
                {selectedQuote && (
                  <div className="px-4 py-2 bg-primary/[0.04] dark:bg-primary/10 border-b border-border flex items-center justify-between gap-3 text-xs flex-shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <p className="truncate">
                        <span className="font-semibold text-foreground">{selectedQuote.propertyType || "Inmueble"}</span>
                        {selectedQuote.address && (
                          <span className="text-muted-foreground"> · {selectedQuote.address}</span>
                        )}
                        {selectedQuote.basePrice && (
                          <span className="text-muted-foreground"> · {selectedQuote.basePrice}€</span>
                        )}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                        conversationStateColors[selectedQuote.status] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {selectedQuote.status === "paid"
                        ? "Pagado"
                        : selectedQuote.status === "pending"
                        ? "Pendiente"
                        : selectedQuote.status}
                    </span>
                  </div>
                )}

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto bg-muted/20 px-4 py-6 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-muted/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">Historial de mensajes</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Los mensajes aparecerán aquí cuando se configuren los webhooks de WhatsApp Business
                    </p>
                  </div>
                </div>

                {/* Quick replies */}
                <div className="px-4 py-2.5 border-t border-border bg-card flex items-center gap-2 overflow-x-auto flex-shrink-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex-shrink-0">
                    Plantillas:
                  </p>
                  {["✓ Confirmo visita", "📧 Envío la factura", "📄 Mando el certificado"].map((tpl) => (
                    <button
                      key={tpl}
                      onClick={() => setMessageText(tpl)}
                      className="px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-foreground hover:bg-primary/5 hover:border-primary hover:text-primary transition-all flex-shrink-0"
                    >
                      {tpl}
                    </button>
                  ))}
                </div>

                {/* Composer */}
                <div className="px-4 py-3 border-t border-border bg-card flex items-end gap-2 flex-shrink-0">
                  <button className="w-10 h-10 rounded-full hover:bg-muted/40 inline-flex items-center justify-center text-muted-foreground flex-shrink-0">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 rounded-full hover:bg-muted/40 inline-flex items-center justify-center text-muted-foreground flex-shrink-0">
                    <Smile className="w-5 h-5" />
                  </button>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Escribe un mensaje…"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="min-h-[40px] max-h-32 resize-none bg-muted/40 border-border rounded-2xl text-sm placeholder:text-muted-foreground focus:bg-card"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    className="w-10 h-10 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center flex-shrink-0 hover:bg-primary/90 disabled:opacity-50 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-muted/10">
                <div className="text-center max-w-sm px-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#25D366]/10 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-[#25D366]" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">Gestión de Clientes WhatsApp</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Selecciona una conversación para ver los detalles del cliente y gestionar su proceso de certificación energética.
                  </p>
                  <button
                    onClick={() => window.location.href = "/whatsapp-flow-editor"}
                    className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Configurar Flujo Conversacional
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ── Customer panel ── */}
          <aside className="hidden lg:flex bg-card border-l border-border flex-col overflow-hidden">
            {selectedConversation ? (
              <>
                <div className="p-5 text-center border-b border-border flex-shrink-0">
                  <div
                    className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-xl font-bold text-white bg-gradient-to-br ${selGradient}`}
                  >
                    {selInitials}
                  </div>
                  <p className="text-base font-bold text-foreground mt-3 truncate">{selDisplayName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Desde{" "}
                    {new Date(selectedConversation.createdAt).toLocaleDateString("es-ES", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        conversationStateColors[selectedConversation.conversationState] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {conversationStateLabels[selectedConversation.conversationState] || selectedConversation.conversationState}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {/* Contact info */}
                  <div className="px-5 py-4 border-b border-border space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Contacto</p>
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <p className="text-xs text-foreground">{selectedConversation.clientPhone}</p>
                    </div>
                    {selectedQuote?.clientEmail && (
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-foreground truncate">{selectedQuote.clientEmail}</p>
                      </div>
                    )}
                    {selectedQuote?.address && (
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-foreground leading-relaxed">{selectedQuote.address}</p>
                      </div>
                    )}
                  </div>

                  {/* Quote details */}
                  {selectedQuote && (
                    <div className="px-5 py-4 border-b border-border">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Presupuesto
                      </p>
                      <div className="rounded-xl border border-border p-3 space-y-2.5">
                        {selectedQuote.propertyType && (
                          <div className="flex items-center gap-2.5">
                            <Building className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground">Tipo</p>
                              <p className="text-xs font-medium text-foreground">{selectedQuote.propertyType}</p>
                            </div>
                          </div>
                        )}
                        {selectedQuote.basePrice && (
                          <div className="flex items-center gap-2.5">
                            <Euro className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground">Precio base</p>
                              <p className="text-xs font-medium text-foreground">{selectedQuote.basePrice}€</p>
                            </div>
                          </div>
                        )}
                        {selectedQuote.deliveryDays && (
                          <div className="flex items-center gap-2.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground">Entrega</p>
                              <p className="text-xs font-medium text-foreground">{selectedQuote.deliveryDays} días</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5">
                          <CreditCard className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Estado</p>
                            <p className="text-xs font-medium text-foreground">
                              {selectedQuote.status === "paid"
                                ? "Pagado"
                                : selectedQuote.status === "pending"
                                ? "Pendiente"
                                : selectedQuote.status}
                            </p>
                          </div>
                        </div>
                        {selectedQuote.status === "paid" && (
                          <div className="flex items-center gap-1.5 text-primary pt-1 border-t border-border">
                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <p className="text-[11px] font-medium">
                              Pago confirmado el {formatDate(selectedQuote.paidAt || selectedQuote.createdAt)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Conversation history */}
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Historial
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Conversación iniciada el {formatDate(selectedConversation.createdAt)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="w-14 h-14 bg-muted/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">Sin selección</p>
                  <p className="text-xs text-muted-foreground">
                    Selecciona una conversación para ver los detalles del cliente
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* WhatsApp Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
              </div>
              Registrar WhatsApp Business
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Conecta tu cuenta de WhatsApp Business para automatizar conversaciones con clientes
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Setup instructions */}
            <div className="bg-muted/40 rounded-xl border border-border p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">
                  GUÍA
                </span>
                Pasos para configurar WhatsApp Business API
              </h4>
              <div className="space-y-3">
                {[
                  { title: "Crear aplicación en Meta for Developers", desc: "Ve a developers.facebook.com y crea una nueva app" },
                  { title: "Agregar producto WhatsApp Business", desc: 'En tu app, agrega el producto "WhatsApp Business API"' },
                  { title: "Obtener credenciales", desc: "Copia el token de acceso, Phone Number ID y Business Account ID" },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Config form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessToken" className="text-xs font-semibold text-foreground">
                  Token de Acceso Permanente *
                </Label>
                <Input
                  id="businessToken"
                  type="password"
                  placeholder="EAAG… (ejemplo: EAAGxxxxxxxxxxxx)"
                  value={whatsappConfig.businessToken}
                  onChange={(e) => setWhatsappConfig((prev) => ({ ...prev, businessToken: e.target.value }))}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Se encuentra en tu app de Meta → WhatsApp → Configuración → Tokens de acceso
                </p>
              </div>
              <div>
                <Label htmlFor="phoneNumberId" className="text-xs font-semibold text-foreground">
                  ID del Número de Teléfono *
                </Label>
                <Input
                  id="phoneNumberId"
                  placeholder="123456789012345 (15 dígitos)"
                  value={whatsappConfig.phoneNumberId}
                  onChange={(e) => setWhatsappConfig((prev) => ({ ...prev, phoneNumberId: e.target.value }))}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">ID numérico de tu número de WhatsApp Business</p>
              </div>
              <div>
                <Label htmlFor="businessAccountId" className="text-xs font-semibold text-foreground">
                  ID de Cuenta Business *
                </Label>
                <Input
                  id="businessAccountId"
                  placeholder="123456789012345 (15 dígitos)"
                  value={whatsappConfig.businessAccountId}
                  onChange={(e) => setWhatsappConfig((prev) => ({ ...prev, businessAccountId: e.target.value }))}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">Se encuentra en tu WhatsApp Business Account</p>
              </div>
              <div>
                <Label htmlFor="webhookVerifyToken" className="text-xs font-semibold text-foreground">
                  Token de Verificación Webhook *
                </Label>
                <Input
                  id="webhookVerifyToken"
                  placeholder="mi_token_secreto_123"
                  value={whatsappConfig.webhookVerifyToken}
                  onChange={(e) => setWhatsappConfig((prev) => ({ ...prev, webhookVerifyToken: e.target.value }))}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">Crea un token personalizado para verificar tu webhook</p>
              </div>

              {/* Webhook info */}
              <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-amber-800 dark:text-amber-300 mb-2">Configuración del Webhook</p>
                    <div className="space-y-1 text-amber-700 dark:text-amber-400">
                      <p className="font-medium">URL del Webhook:</p>
                      <code className="bg-amber-100 dark:bg-amber-950/50 px-2 py-1 rounded text-[11px] block">
                        https://tu-dominio-replit.replit.app/api/webhooks/whatsapp
                      </code>
                      <p className="mt-2">Token de verificación: usar el mismo token configurado arriba</p>
                      <p className="text-[11px] mt-1">⚠️ Configura este webhook en tu aplicación de Meta for Developers</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activation toggle */}
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="integrationActive"
                    checked={whatsappConfig.integrationActive}
                    onChange={(e) => setWhatsappConfig((prev) => ({ ...prev, integrationActive: e.target.checked }))}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <Label htmlFor="integrationActive" className="text-sm font-medium text-foreground cursor-pointer">
                    Activar integración WhatsApp Business
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 ml-7">
                  Una vez activado, podrás recibir y enviar mensajes automáticamente
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setShowConfigDialog(false)}
                className="h-10 px-5 rounded-full text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => configureWhatsAppMutation.mutate(whatsappConfig)}
                disabled={
                  configureWhatsAppMutation.isPending ||
                  !whatsappConfig.businessToken ||
                  !whatsappConfig.phoneNumberId
                }
                className="h-10 px-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 shadow-sm"
              >
                {configureWhatsAppMutation.isPending ? "Configurando..." : "Conectar WhatsApp Business"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
