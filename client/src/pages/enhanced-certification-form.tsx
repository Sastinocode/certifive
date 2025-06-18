import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Home, User, Building, Wind, Zap, Camera, FileText } from "lucide-react";
import { z } from "zod";

// Enhanced form schema based on official CEE document
const enhancedCertificationSchema = z.object({
  propertyAddress: z.string().min(10, "La dirección debe tener al menos 10 caracteres"),
  ownerName: z.string().min(2, "Nombre requerido"),
  ownerDni: z.string().min(8, "DNI/NIE requerido"),
  cadastralRef: z.string().min(14, "Referencia catastral requerida"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  buildingFloors: z.number().min(1, "Mínimo 1 planta"),
  propertyFloors: z.number().min(1, "Mínimo 1 planta"),
  rooms: z.number().min(1, "Mínimo 1 habitación"),
  facadeNorthwest: z.boolean().default(false),
  facadeSoutheast: z.boolean().default(false),
  facadeEast: z.boolean().default(false),
  facadeWest: z.boolean().default(false),
  windowsNorthwest: z.string().optional(),
  windowsSoutheast: z.string().optional(),
  windowsEast: z.string().optional(),
  windowsWest: z.string().optional(),
  windowType: z.string().optional(),
  windowMaterial: z.string().optional(),
  windowColor: z.string().optional(),
  glassType: z.string().optional(),
  windowLocation: z.string().optional(),
  hasShutters: z.boolean().default(false),
  shutterType: z.string().optional(),
  roofType: z.string().optional(),
  airConditioningType: z.string().optional(),
  airConditioningRooms: z.string().optional(),
  heatingType: z.string().optional(),
  heatingDescription: z.string().optional(),
  waterHeaterType: z.string().optional(),
  waterHeaterCapacity: z.number().optional(),
  photos: z.array(z.string()).optional(),
});

type EnhancedCertificationForm = z.infer<typeof enhancedCertificationSchema>;

const FORM_STEPS = [
  { id: 1, title: "Datos de la Propiedad", icon: Home },
  { id: 2, title: "Datos del Titular", icon: User },
  { id: 3, title: "Estructura del Edificio", icon: Building },
  { id: 4, title: "Orientación y Ventanas", icon: Wind },
  { id: 5, title: "Instalaciones Energéticas", icon: Zap },
  { id: 6, title: "Fotografías", icon: Camera },
];

export default function EnhancedCertificationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  
  const form = useForm<EnhancedCertificationForm>({
    resolver: zodResolver(enhancedCertificationSchema),
    defaultValues: {
      propertyAddress: "",
      ownerName: "",
      ownerDni: "",
      cadastralRef: "",
      phone: "",
      email: "",
      buildingFloors: 1,
      propertyFloors: 1,
      rooms: 1,
      facadeNorthwest: false,
      facadeSoutheast: false,
      facadeEast: false,
      facadeWest: false,
      windowsNorthwest: "",
      windowsSoutheast: "",
      windowsEast: "",
      windowsWest: "",
      windowType: "",
      windowMaterial: "",
      windowColor: "",
      glassType: "",
      windowLocation: "",
      hasShutters: false,
      shutterType: "",
      roofType: "",
      airConditioningType: "",
      airConditioningRooms: "",
      heatingType: "",
      heatingDescription: "",
      waterHeaterType: "",
      waterHeaterCapacity: undefined,
      photos: [],
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InsertCertification) => {
      return apiRequest("POST", "/api/certifications", data);
    },
    onSuccess: () => {
      toast({
        title: "Solicitud Enviada",
        description: "Su solicitud de certificación energética ha sido enviada correctamente.",
      });
      form.reset();
      setCurrentStep(1);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al enviar la solicitud. Inténtelo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid && currentStep < FORM_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (data: InsertCertification) => {
    submitMutation.mutate(data);
  };

  const getFieldsForStep = (step: number): (keyof InsertCertification)[] => {
    switch (step) {
      case 1: return ["propertyAddress"];
      case 2: return ["ownerName", "ownerDni", "cadastralRef"];
      case 3: return ["buildingFloors", "propertyFloors", "rooms"];
      case 4: return [];
      case 5: return [];
      case 6: return [];
      default: return [];
    }
  };

  const progress = (currentStep / FORM_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">
              Formulario para Certificación Energética (CEE)
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Complete todos los datos siguiendo el formulario oficial CEE
            </p>
          </CardHeader>
        </Card>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {FORM_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${isActive ? 'bg-primary text-white' : 
                      isCompleted ? 'bg-green-500 text-white' : 
                      'bg-gray-200 text-gray-600'}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {index < FORM_STEPS.length - 1 && (
                    <div className={`w-16 h-0.5 ml-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="w-full" />
          <p className="text-center text-sm text-gray-600 mt-2">
            Paso {currentStep} de {FORM_STEPS.length}: {FORM_STEPS[currentStep - 1].title}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Step 1: Property Data */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Datos de la Propiedad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="propertyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Propiedad (Dirección Completa) *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ej: PUERTO LATINO 1; BLOQUE 2, PUERTO 4, DUPLEX 7; PUERTO TOMAS MAESTRE. LA MANGA DEL MAR MENOR. 30380 SAN JAVIER"
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 2: Owner Data */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Datos del Titular
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="ownerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo del Titular *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: MICHAEL HERBERT HINKINS" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="ownerDni"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>DNI/NIE *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: X-1166555-H" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="cadastralRef"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referencia Catastral *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: 9299801XG9799N0075RX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: 968564112" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: info@ejemplo.es" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Building Structure */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Estructura del Edificio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="buildingFloors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nº de Plantas Habitables del Edificio</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              placeholder="Sin contar sótano"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="propertyFloors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plantas de la Vivienda</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              placeholder="Plantas que corresponden a la vivienda"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
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
                          <FormLabel>Nº de Habitaciones (Estancias)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Facade Orientation and Windows */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wind className="w-5 h-5" />
                    Orientación de Fachadas y Ventanas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">Orientación de las Fachadas</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="facadeNorthwest"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Noroeste</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="facadeSoutheast"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Sureste</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="facadeEast"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Este</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="facadeWest"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Oeste</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Ventanas por Orientación</h4>
                      
                      <FormField
                        control={form.control}
                        name="windowsNorthwest"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ventanas Noroeste</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Ej: Salón-Comedor: 2 puertas correderas, Dormitorio principal: 1 puerta corredera"
                                {...field}
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="windowsSoutheast"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ventanas Sureste</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Ej: Cocina comedor: 2 ventanas, Baño 2º Planta: 1 ventana pequeña"
                                {...field}
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Detalles de Ventanas</h4>
                      
                      <FormField
                        control={form.control}
                        name="windowType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Ventana</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="rectangular">Rectangular</SelectItem>
                                <SelectItem value="cuadrada">Cuadrada</SelectItem>
                                <SelectItem value="redonda">Redonda</SelectItem>
                                <SelectItem value="corredera">Rectangular Corredera</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="windowMaterial"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Material de Ventanas</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar material" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="aluminio">Aluminio</SelectItem>
                                <SelectItem value="pvc">PVC</SelectItem>
                                <SelectItem value="madera">Madera</SelectItem>
                                <SelectItem value="mixto">Mixto</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Anterior
              </Button>
              
              {currentStep < FORM_STEPS.length ? (
                <Button type="button" onClick={handleNext}>
                  Siguiente
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={submitMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitMutation.isPending ? "Enviando..." : "Enviar Solicitud"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}