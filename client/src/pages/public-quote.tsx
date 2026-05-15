// @ts-nocheck
import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Home,
  Building,
  Store,
  Euro,
  Clock,
  CheckCircle,
  User,
  MapPin,
  Calendar,
  CreditCard,
  Shield
} from "lucide-react";

// Solo usar claves públicas de Stripe si están disponibles
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : Promise.resolve(null);

interface QuoteData {
  id: number;
  userId: string;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  propertyType: string | null;
  address: string | null;
  floors: number | null;
  rooms: number | null;
  area: string | null;
  buildYear: number | null;
  additionalInfo: string | null;
  basePrice: string | null;
  advanceAmount: string | null;
  deliveryDays: number | null;
  status: string;
}

const propertyTypes = [
  { value: "vivienda", label: "Vivienda Residencial", icon: Home, description: "Apartamento, piso o casa habitada como residencia principal" },
  { value: "local_comercial", label: "Local Comercial", icon: Store, description: "Tienda, oficina o local destinado a actividad comercial" },
  { value: "chalet", label: "Chalet/Casa Unifamiliar", icon: Building, description: "Casa independiente o adosada con jardín" },
  { value: "edificio_completo", label: "Edificio Completo", icon: Building, description: "Certificación de todo el edificio completo" },
];

function PaymentForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
    });

    if (error) {
      toast({
        title: "Error en el pago",
        description: error.message,
        variant: "destructive",
      });
    } else {
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isLoading} 
        className="w-full"
        size="lg"
      >
        {isLoading ? "Procesando pago..." : "Pagar Anticipo"}
      </Button>
    </form>
  );
}

export default function PublicQuote() {
  const { uniqueLink } = useParams<{ uniqueLink: string }>();
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "quote" | "payment" | "success">("form");
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    propertyType: "",
    address: "",
    floors: "",
    rooms: "",
    area: "",
    buildYear: "",
    additionalInfo: ""
  });
  const [clientSecret, setClientSecret] = useState("");

  const { data: quoteData, isLoading: quoteLoading } = useQuery({
    queryKey: [`/api/public/quotes/${uniqueLink}`],
    enabled: !!uniqueLink,
  });

  const submitFormMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/public/quotes/${uniqueLink}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Datos enviados",
        description: "Tu solicitud ha sido procesada. Te mostraremos el presupuesto.",
      });
      setStep("quote");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron enviar los datos. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/public/quotes/${uniqueLink}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setStep("payment");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo inicializar el pago.",
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.clientEmail || !formData.propertyType) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      ...formData,
      floors: formData.floors ? parseInt(formData.floors) : null,
      rooms: formData.rooms ? parseInt(formData.rooms) : null,
      area: formData.area ? parseFloat(formData.area) : null,
      buildYear: formData.buildYear ? parseInt(formData.buildYear) : null,
    };

    submitFormMutation.mutate(data);
  };

  const getPropertyTypeInfo = (type: string) => {
    return propertyTypes.find(pt => pt.value === type);
  };

  if (quoteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!quoteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Enlace no válido</h2>
            <p className="text-gray-600">El enlace de presupuesto no existe o ha expirado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Certificación Energética</h1>
          <p className="text-gray-600 mt-2">Solicita tu presupuesto personalizado</p>
        </div>

        {/* Step 1: Form */}
        {step === "form" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Datos de la Solicitud
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="clientName">Nombre completo *</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                      placeholder="Tu nombre y apellidos"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="clientEmail">Email *</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="clientPhone">Teléfono</Label>
                    <Input
                      id="clientPhone"
                      type="tel"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                      placeholder="968 123 456"
                    />
                  </div>

                  <div>
                    <Label htmlFor="propertyType">Tipo de propiedad *</Label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, propertyType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center">
                              <type.icon className="w-4 h-4 mr-2" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Dirección de la propiedad</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Calle, número, ciudad, código postal"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="floors">Plantas</Label>
                    <Input
                      id="floors"
                      type="number"
                      min="1"
                      value={formData.floors}
                      onChange={(e) => setFormData(prev => ({ ...prev, floors: e.target.value }))}
                      placeholder="2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="rooms">Habitaciones</Label>
                    <Input
                      id="rooms"
                      type="number"
                      min="1"
                      value={formData.rooms}
                      onChange={(e) => setFormData(prev => ({ ...prev, rooms: e.target.value }))}
                      placeholder="3"
                    />
                  </div>

                  <div>
                    <Label htmlFor="area">Superficie (m²)</Label>
                    <Input
                      id="area"
                      type="number"
                      min="1"
                      step="0.1"
                      value={formData.area}
                      onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                      placeholder="80"
                    />
                  </div>

                  <div>
                    <Label htmlFor="buildYear">Año construcción</Label>
                    <Input
                      id="buildYear"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.buildYear}
                      onChange={(e) => setFormData(prev => ({ ...prev, buildYear: e.target.value }))}
                      placeholder="1990"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="additionalInfo">Información adicional</Label>
                  <Textarea
                    id="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                    placeholder="Cualquier detalle adicional que pueda ser relevante..."
                    rows={3}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={submitFormMutation.isPending}
                >
                  {submitFormMutation.isPending ? "Enviando..." : "Solicitar Presupuesto"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Quote Display */}
        {step === "quote" && quoteData.basePrice && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Euro className="w-5 h-5 mr-2" />
                Tu Presupuesto Personalizado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getPropertyTypeInfo(quoteData.propertyType!)?.label}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {getPropertyTypeInfo(quoteData.propertyType!)?.description}
                    </p>
                  </div>
                  {(() => {
                    const typeInfo = getPropertyTypeInfo(quoteData.propertyType!);
                    if (typeInfo) {
                      const IconComponent = typeInfo.icon;
                      return <IconComponent className="w-8 h-8 text-primary" />;
                    }
                    return null;
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary">
                      {parseFloat(quoteData.basePrice).toFixed(2)}€
                    </div>
                    <div className="text-sm text-gray-600">Precio total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-green-600">
                      {parseFloat(quoteData.advanceAmount!).toFixed(2)}€
                    </div>
                    <div className="text-sm text-gray-600">Anticipo (50%)</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Entrega en {quoteData.deliveryDays} días
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Certificado oficial
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Condiciones del servicio:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500" />
                    Certificado energético oficial según normativa española
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500" />
                    Etiqueta energética en formato oficial
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500" />
                    Registro en base de datos autonómica
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500" />
                    Entrega en formato digital PDF
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500" />
                    Soporte técnico incluido
                  </li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={() => createPaymentMutation.mutate()}
                  className="flex-1"
                  size="lg"
                  disabled={createPaymentMutation.isPending}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {createPaymentMutation.isPending ? "Preparando pago..." : "Pagar Anticipo"}
                </Button>
                <Button variant="outline" onClick={() => setStep("form")}>
                  Modificar datos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Payment */}
        {step === "payment" && clientSecret && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Pago Seguro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-cyan-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-green-800 font-medium">Importe a pagar:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {parseFloat(quoteData.advanceAmount!).toFixed(2)}€
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Anticipo del 50%. El resto se abona al recibir el certificado.
                </p>
              </div>

              {stripePromise && (
                <Elements 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: { theme: 'stripe' }
                  }}
                >
                  <PaymentForm 
                    clientSecret={clientSecret}
                    onSuccess={() => setStep("success")}
                  />
                </Elements>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pago realizado con éxito!</h2>
              <p className="text-gray-600 mb-6">
                Hemos recibido tu anticipo y comenzaremos a procesar tu certificación energética.
                Te mantendremos informado del progreso por email.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Próximos pasos:</strong> Nuestro técnico se pondrá en contacto contigo 
                  para coordinar la visita y completar la certificación en {quoteData.deliveryDays} días.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}