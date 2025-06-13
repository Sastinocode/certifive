import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageCircle, 
  Plus,
  Edit,
  Trash2,
  Save,
  Settings,
  HelpCircle,
  CreditCard,
  Phone,
  Clock,
  Link,
  Bot,
  ArrowLeft,
  CheckCircle
} from "lucide-react";

interface WhatsAppFlowTemplate {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  welcomeMessage: string;
  budgetCalculatorMessage: string | null;
  budgetCalculatorLink: string | null;
  faqResponses: Array<{ question: string; answer: string }> | null;
  serviceDescription: string | null;
  servicePolicies: string | null;
  deliveryTimeInfo: string | null;
  paymentMethods: string | null;
  paymentPolicies: string | null;
  paymentLinks: Array<{ name: string; url: string; description: string }> | null;
  contactInfo: string | null;
  schedulingInfo: string | null;
  workingHours: string | null;
  fallbackMessage: string | null;
  endConversationMessage: string | null;
  triggerKeywords: Array<string> | null;
  createdAt: string;
  updatedAt: string;
}

export default function WhatsAppFlowEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppFlowTemplate | null>(null);

  // Fetch flow templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/whatsapp/flow-templates"],
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/whatsapp/flow-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/flow-templates"] });
      setShowCreateForm(false);
      toast({
        title: "Plantilla creada",
        description: "El flujo conversacional se ha creado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la plantilla de flujo",
        variant: "destructive",
      });
    },
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PATCH", `/api/whatsapp/flow-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/flow-templates"] });
      setEditingTemplate(null);
      toast({
        title: "Plantilla actualizada",
        description: "El flujo conversacional se ha actualizado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la plantilla",
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/whatsapp/flow-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/flow-templates"] });
      toast({
        title: "Plantilla eliminada",
        description: "El flujo conversacional se ha eliminado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la plantilla",
        variant: "destructive",
      });
    },
  });

  const FlowTemplateForm = ({ 
    initialData, 
    onSubmit, 
    onCancel, 
    isLoading 
  }: {
    initialData?: Partial<WhatsAppFlowTemplate>;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isLoading: boolean;
  }) => {
    const [formData, setFormData] = useState({
      name: initialData?.name || "",
      description: initialData?.description || "",
      isActive: initialData?.isActive ?? true,
      welcomeMessage: initialData?.welcomeMessage || "¡Hola! Bienvenido/a a nuestro servicio de certificación energética. ¿En qué puedo ayudarte?",
      budgetCalculatorMessage: initialData?.budgetCalculatorMessage || "Puedes calcular el presupuesto de tu certificación energética usando nuestro calculador:",
      budgetCalculatorLink: initialData?.budgetCalculatorLink || "",
      faqResponses: initialData?.faqResponses || [{ question: "", answer: "" }],
      serviceDescription: initialData?.serviceDescription || "",
      servicePolicies: initialData?.servicePolicies || "",
      deliveryTimeInfo: initialData?.deliveryTimeInfo || "",
      paymentMethods: initialData?.paymentMethods || "",
      paymentPolicies: initialData?.paymentPolicies || "",
      paymentLinks: initialData?.paymentLinks || [{ name: "", url: "", description: "" }],
      contactInfo: initialData?.contactInfo || "",
      schedulingInfo: initialData?.schedulingInfo || "",
      workingHours: initialData?.workingHours || "",
      fallbackMessage: initialData?.fallbackMessage || "Lo siento, no he entendido tu consulta. ¿Podrías reformularla?",
      endConversationMessage: initialData?.endConversationMessage || "Gracias por contactarnos. ¡Que tengas un buen día!",
      triggerKeywords: initialData?.triggerKeywords || ["presupuesto", "precio", "información", "contacto"],
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    const addFAQ = () => {
      setFormData({
        ...formData,
        faqResponses: [...formData.faqResponses, { question: "", answer: "" }]
      });
    };

    const removeFAQ = (index: number) => {
      const newFAQs = formData.faqResponses.filter((_, i) => i !== index);
      setFormData({ ...formData, faqResponses: newFAQs });
    };

    const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
      const newFAQs = [...formData.faqResponses];
      newFAQs[index][field] = value;
      setFormData({ ...formData, faqResponses: newFAQs });
    };

    const addPaymentLink = () => {
      setFormData({
        ...formData,
        paymentLinks: [...formData.paymentLinks, { name: "", url: "", description: "" }]
      });
    };

    const removePaymentLink = (index: number) => {
      const newLinks = formData.paymentLinks.filter((_, i) => i !== index);
      setFormData({ ...formData, paymentLinks: newLinks });
    };

    const updatePaymentLink = (index: number, field: 'name' | 'url' | 'description', value: string) => {
      const newLinks = [...formData.paymentLinks];
      newLinks[index][field] = value;
      setFormData({ ...formData, paymentLinks: newLinks });
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {initialData ? "Editar Flujo Conversacional" : "Nuevo Flujo Conversacional"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="messages">Mensajes</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
                <TabsTrigger value="payments">Pagos</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre de la Plantilla</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Flujo Principal"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descripción del flujo"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Plantilla activa</Label>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuración del Servicio
                  </h3>
                  
                  <div>
                    <Label htmlFor="serviceDescription">Descripción del Servicio</Label>
                    <Textarea
                      id="serviceDescription"
                      value={formData.serviceDescription}
                      onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
                      placeholder="Describe tu servicio de certificación energética..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="servicePolicies">Políticas del Servicio</Label>
                    <Textarea
                      id="servicePolicies"
                      value={formData.servicePolicies}
                      onChange={(e) => setFormData({ ...formData, servicePolicies: e.target.value })}
                      placeholder="Políticas, términos y condiciones..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deliveryTimeInfo">Información de Entrega</Label>
                      <Textarea
                        id="deliveryTimeInfo"
                        value={formData.deliveryTimeInfo}
                        onChange={(e) => setFormData({ ...formData, deliveryTimeInfo: e.target.value })}
                        placeholder="Tiempos de entrega, proceso..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="workingHours">Horarios de Atención</Label>
                      <Textarea
                        id="workingHours"
                        value={formData.workingHours}
                        onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                        placeholder="Lunes a Viernes 9:00-18:00..."
                        rows={2}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="contactInfo">Información de Contacto</Label>
                    <Textarea
                      id="contactInfo"
                      value={formData.contactInfo}
                      onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                      placeholder="Teléfono, email, dirección..."
                      rows={2}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="messages" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Mensajes Automáticos
                  </h3>
                  
                  <div>
                    <Label htmlFor="welcomeMessage">Mensaje de Bienvenida</Label>
                    <Textarea
                      id="welcomeMessage"
                      value={formData.welcomeMessage}
                      onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                      placeholder="Mensaje inicial cuando un cliente escribe"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="budgetCalculatorMessage">Mensaje del Calculador de Presupuestos</Label>
                    <Textarea
                      id="budgetCalculatorMessage"
                      value={formData.budgetCalculatorMessage}
                      onChange={(e) => setFormData({ ...formData, budgetCalculatorMessage: e.target.value })}
                      placeholder="Mensaje que acompaña al enlace del calculador"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="budgetCalculatorLink">Enlace del Calculador</Label>
                    <Input
                      id="budgetCalculatorLink"
                      value={formData.budgetCalculatorLink}
                      onChange={(e) => setFormData({ ...formData, budgetCalculatorLink: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="fallbackMessage">Mensaje de No Entendido</Label>
                    <Textarea
                      id="fallbackMessage"
                      value={formData.fallbackMessage}
                      onChange={(e) => setFormData({ ...formData, fallbackMessage: e.target.value })}
                      placeholder="Cuando el bot no entiende la consulta"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="endConversationMessage">Mensaje de Despedida</Label>
                    <Textarea
                      id="endConversationMessage"
                      value={formData.endConversationMessage}
                      onChange={(e) => setFormData({ ...formData, endConversationMessage: e.target.value })}
                      placeholder="Mensaje para finalizar la conversación"
                      rows={2}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="faq" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <HelpCircle className="h-5 w-5" />
                      Preguntas Frecuentes
                    </h3>
                    <Button type="button" onClick={addFAQ} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar FAQ
                    </Button>
                  </div>

                  {formData.faqResponses.map((faq, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Pregunta {index + 1}</Label>
                          {formData.faqResponses.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeFAQ(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Input
                          value={faq.question}
                          onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                          placeholder="¿Cuánto cuesta una certificación?"
                        />
                        <Textarea
                          value={faq.answer}
                          onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                          placeholder="Respuesta automática..."
                          rows={3}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <CreditCard className="h-5 w-5" />
                      Información de Pagos
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="paymentMethods">Métodos de Pago</Label>
                        <Textarea
                          id="paymentMethods"
                          value={formData.paymentMethods}
                          onChange={(e) => setFormData({ ...formData, paymentMethods: e.target.value })}
                          placeholder="Transferencia, tarjeta, efectivo..."
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label htmlFor="paymentPolicies">Políticas de Pago</Label>
                        <Textarea
                          id="paymentPolicies"
                          value={formData.paymentPolicies}
                          onChange={(e) => setFormData({ ...formData, paymentPolicies: e.target.value })}
                          placeholder="Adelanto, plazos de pago..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-semibold flex items-center gap-2">
                        <Link className="h-4 w-4" />
                        Enlaces de Pago
                      </h4>
                      <Button type="button" onClick={addPaymentLink} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar Enlace
                      </Button>
                    </div>

                    {formData.paymentLinks.map((link, index) => (
                      <Card key={index} className="p-4 mb-3">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Enlace de Pago {index + 1}</Label>
                            {formData.paymentLinks.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removePaymentLink(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label>Nombre</Label>
                              <Input
                                value={link.name}
                                onChange={(e) => updatePaymentLink(index, 'name', e.target.value)}
                                placeholder="Pago con Bizum"
                              />
                            </div>
                            <div>
                              <Label>URL</Label>
                              <Input
                                value={link.url}
                                onChange={(e) => updatePaymentLink(index, 'url', e.target.value)}
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Descripción</Label>
                            <Input
                              value={link.description}
                              onChange={(e) => updatePaymentLink(index, 'description', e.target.value)}
                              placeholder="Pago rápido y seguro"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Guardando..." : initialData ? "Actualizar" : "Crear Plantilla"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-green-900/20 dark:to-blue-900/20">
        <Sidebar selectedTab="whatsapp" onTabChange={() => {}} />
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (showCreateForm || editingTemplate) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-green-900/20 dark:to-blue-900/20">
        <Sidebar selectedTab="whatsapp" onTabChange={() => {}} />
        <div className="flex-1 p-8">
          <FlowTemplateForm
            initialData={editingTemplate || undefined}
            onSubmit={(data) => {
              if (editingTemplate) {
                updateMutation.mutate({ id: editingTemplate.id, data });
              } else {
                createMutation.mutate(data);
              }
            }}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingTemplate(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-green-900/20 dark:to-blue-900/20">
      <Sidebar selectedTab="whatsapp" onTabChange={() => {}} />
      <div className="flex-1 p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Flujos Conversacionales WhatsApp
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Crea y personaliza respuestas automáticas para optimizar tu atención al cliente
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Flujo
          </Button>
        </div>

        {templates.length > 0 ? (
          <div className="grid gap-6">
            {templates.map((template: WhatsAppFlowTemplate) => (
              <Card key={template.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        {template.name}
                      </CardTitle>
                      {template.isActive && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {template.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        Mensaje de Bienvenida
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                        {template.welcomeMessage}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        <HelpCircle className="h-4 w-4" />
                        FAQs Configuradas
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {template.faqResponses?.length || 0} preguntas frecuentes
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        <Link className="h-4 w-4" />
                        Enlaces de Pago
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {template.paymentLinks?.length || 0} enlaces configurados
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No hay flujos conversacionales
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Crea tu primer flujo conversacional para automatizar las respuestas de WhatsApp
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Flujo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}