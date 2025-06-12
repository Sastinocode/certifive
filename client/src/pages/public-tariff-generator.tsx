import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Calculator, Euro, Clock, ArrowRight, Zap, Leaf, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Stripe setup - only initialize if keys are available
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const quoteFormSchema = z.object({
  clientName: z.string().min(1, "Nombre requerido"),
  clientEmail: z.string().email("Email válido requerido"),
  clientPhone: z.string().min(9, "Teléfono requerido"),
  propertyType: z.string().min(1, "Tipo de propiedad requerido"),
  address: z.string().min(1, "Dirección requerida"),
  floors: z.number().min(1, "Número de plantas requerido"),
  rooms: z.number().min(1, "Número de habitaciones requerido"),
  area: z.string().min(1, "Área requerida"),
  buildYear: z.number().min(1900, "Año de construcción válido requerido"),
  additionalInfo: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteFormSchema>;

interface PricingRate {
  id: number;
  propertyType: string;
  basePrice: string;
  advancePercentage: number;
  deliveryDays: number;
  description: string | null;
  isActive: boolean;
}

function PaymentForm({ quote, onSuccess }: { quote: any; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        toast({
          title: "Error en el pago",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Process payment with backend
      const response = await apiRequest("POST", "/api/process-payment", {
        paymentMethodId: paymentMethod.id,
        quoteId: quote.id,
        amount: parseFloat(quote.advanceAmount) * 100, // Convert to cents
      });

      if (response.ok) {
        toast({
          title: "¡Pago Exitoso!",
          description: "Hemos recibido tu pago. Te contactaremos pronto para programar la certificación.",
        });
        onSuccess();
      } else {
        toast({
          title: "Error en el pago",
          description: "Hubo un problema procesando tu pago. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error inesperado. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg bg-gray-50">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        size="lg"
      >
        {isProcessing ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Procesando...
          </div>
        ) : (
          <div className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Pagar {quote.advanceAmount}€ (Adelanto)
          </div>
        )}
      </Button>
    </form>
  );
}

export default function PublicTariffGenerator() {
  const [step, setStep] = useState<'form' | 'quote' | 'payment' | 'success'>('form');
  const [pricingRates, setPricingRates] = useState<PricingRate[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
  });

  useEffect(() => {
    // Load public pricing rates
    const loadPricingRates = async () => {
      try {
        const response = await fetch('/api/public/pricing-rates');
        if (response.ok) {
          const rates = await response.json();
          setPricingRates(rates.filter((rate: PricingRate) => rate.isActive));
        }
      } catch (error) {
        console.error('Error loading pricing rates:', error);
      }
    };

    loadPricingRates();
  }, []);

  const onSubmit = async (data: QuoteFormData) => {
    setIsLoading(true);
    
    try {
      // Find matching pricing rate
      const matchingRate = pricingRates.find(rate => 
        rate.propertyType.toLowerCase() === data.propertyType.toLowerCase()
      );

      if (!matchingRate) {
        toast({
          title: "Error",
          description: "No se encontraron tarifas para este tipo de propiedad.",
          variant: "destructive",
        });
        return;
      }

      // Calculate pricing
      const basePrice = parseFloat(matchingRate.basePrice);
      const advanceAmount = (basePrice * matchingRate.advancePercentage) / 100;

      // Create quote request
      const response = await apiRequest("POST", "/api/public/quote-request", {
        ...data,
        basePrice: basePrice.toString(),
        advanceAmount: advanceAmount.toString(),
        deliveryDays: matchingRate.deliveryDays,
      });

      if (response.ok) {
        const result = await response.json();
        setQuote({
          ...result,
          basePrice: basePrice.toString(),
          advanceAmount: advanceAmount.toString(),
          deliveryDays: matchingRate.deliveryDays,
          pricingRate: matchingRate,
        });
        setStep('quote');
      } else {
        toast({
          title: "Error",
          description: "Error al generar el presupuesto. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error inesperado. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="glass-card p-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                ¡Pago Confirmado!
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Hemos recibido tu pago correctamente. Nos pondremos en contacto contigo en las próximas 24 horas para programar la visita de certificación.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-medium">
                  📧 Recibirás un email de confirmación con todos los detalles
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Generador de Presupuestos CEE
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Obtén tu presupuesto de certificación energética al instante
          </p>
          
          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-3 bg-white/60 backdrop-blur-sm rounded-lg p-4">
              <Zap className="w-6 h-6 text-yellow-500" />
              <span className="font-medium text-gray-700">Proceso Rápido</span>
            </div>
            <div className="flex items-center justify-center space-x-3 bg-white/60 backdrop-blur-sm rounded-lg p-4">
              <Leaf className="w-6 h-6 text-green-500" />
              <span className="font-medium text-gray-700">Certificado Oficial</span>
            </div>
            <div className="flex items-center justify-center space-x-3 bg-white/60 backdrop-blur-sm rounded-lg p-4">
              <Shield className="w-6 h-6 text-blue-500" />
              <span className="font-medium text-gray-700">Pago Seguro</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {step === 'form' && (
            <div className="glass-card p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Datos de tu Propiedad
                </h2>
                <p className="text-gray-600">
                  Completa la información para generar tu presupuesto personalizado
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Tu nombre completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="clientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="tu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="clientPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="600 123 456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="propertyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Propiedad</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona el tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="vivienda">Vivienda</SelectItem>
                              <SelectItem value="local">Local Comercial</SelectItem>
                              <SelectItem value="oficina">Oficina</SelectItem>
                              <SelectItem value="nave">Nave Industrial</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Dirección Completa</FormLabel>
                          <FormControl>
                            <Input placeholder="Calle, número, ciudad, código postal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="floors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Plantas</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="1" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Habitaciones</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="2" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Superficie (m²)</FormLabel>
                          <FormControl>
                            <Input placeholder="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="buildYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Año de Construcción</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="2000" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="additionalInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Información Adicional (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Cualquier detalle adicional que consideres relevante..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      size="lg"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generando...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Calculator className="w-5 h-5 mr-2" />
                          Generar Presupuesto
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {step === 'quote' && quote && (
            <div className="space-y-8">
              {/* Quote Summary */}
              <div className="glass-card p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Tu Presupuesto de Certificación Energética
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="energy-card p-6 text-center">
                    <Euro className="w-8 h-8 text-green-600 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-gray-900">{quote.basePrice}€</div>
                    <div className="text-sm text-gray-600">Precio Total</div>
                  </div>
                  
                  <div className="energy-card p-6 text-center">
                    <Calculator className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-gray-900">{quote.advanceAmount}€</div>
                    <div className="text-sm text-gray-600">Adelanto (50%)</div>
                  </div>
                  
                  <div className="energy-card p-6 text-center">
                    <Clock className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-gray-900">{quote.deliveryDays}</div>
                    <div className="text-sm text-gray-600">Días de entrega</div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">¿Qué incluye tu certificación?</h3>
                  <ul className="text-blue-800 space-y-1">
                    <li>✓ Visita técnica al inmueble</li>
                    <li>✓ Toma de medidas y fotografías</li>
                    <li>✓ Cálculo de eficiencia energética</li>
                    <li>✓ Certificado oficial registrado</li>
                    <li>✓ Registro en organismos oficiales</li>
                  </ul>
                </div>

                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('form')}
                  >
                    Volver a Editar
                  </Button>
                  <Button 
                    onClick={() => setStep('payment')}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    size="lg"
                  >
                    Continuar al Pago
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 'payment' && quote && (
            <div className="glass-card p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Confirmar Pago del Adelanto
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Resumen del Pedido</h3>
                  <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                    <div className="flex justify-between">
                      <span>Certificación Energética</span>
                      <span>{quote.basePrice}€</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Adelanto (50%)</span>
                      <span>{quote.advanceAmount}€</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Restante (a pagar al finalizar)</span>
                      <span>{(parseFloat(quote.basePrice) - parseFloat(quote.advanceAmount)).toFixed(2)}€</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total a pagar ahora</span>
                      <span>{quote.advanceAmount}€</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Datos de Pago</h3>
                  {stripePromise ? (
                    <Elements stripe={stripePromise}>
                      <PaymentForm 
                        quote={quote} 
                        onSuccess={() => setStep('success')} 
                      />
                    </Elements>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <Shield className="w-6 h-6 text-orange-600 mr-3" />
                        <h4 className="font-semibold text-orange-900">Configuración de Pagos Pendiente</h4>
                      </div>
                      <p className="text-orange-800 mb-4">
                        El sistema de pagos está siendo configurado. Por favor, contacta directamente para procesar tu solicitud.
                      </p>
                      <Button 
                        onClick={() => setStep('success')}
                        className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700"
                      >
                        Continuar sin Pago Online
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}