// @ts-nocheck
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Home, 
  Thermometer,
  Lightbulb,
  Wind,
  Droplets,
  Zap,
  Info,
  Clock
} from "lucide-react";

interface CertificationFormData {
  // Datos administrativos (from template)
  dni: string;
  fullName: string;
  cadastralRef: string;
  phone: string;
  email: string;
  
  // Datos de la propiedad (from template)
  habitableFloors: number; // Nº de plantas habitables (sin contar sótano)
  rooms: number; // Nº de habitaciones
  
  // Fachadas y ventanas (from template)
  facadeOrientation: string; // Orientación de fachadas y ventanas
  windowDetails: string; // Material, color, tipo vidrio, caja persiana
  
  // Estructura del edificio (from template)
  roofType: string; // Tipo cubierta (plana/inclinada)
  
  // Sistemas HVAC (from template)
  airConditioningSystem: string; // Equipos climatización
  heatingSystem: string; // Equipos calefacción (radiadores si/no)
  
  // Sistema de agua caliente (from template)
  waterHeatingType: string; // Eléctrico, gas natural, gas butano
  waterHeatingCapacity: number; // Capacidad en litros si eléctrico
  
  // Fotos requeridas
  photos: string[];
  
  // Información adicional
  observations: string;
}

const photoRequirements = [
  {
    id: "facade",
    title: "Fachada Principal",
    description: "Foto completa de la fachada principal del edificio desde la calle",
    icon: Home,
    required: true,
    tips: "Toma la foto desde una distancia que permita ver todo el edificio. Asegúrate de que esté bien iluminado."
  },
  {
    id: "windows",
    title: "Ventanas Exteriores",
    description: "Fotos detalladas de diferentes tipos de ventanas",
    icon: Camera,
    required: true,
    tips: "Fotografía al menos 3 ventanas diferentes, incluyendo marcos y cristales. Si hay contraventanas, inclúyelas."
  },
  {
    id: "heating",
    title: "Sistema de Calefacción",
    description: "Caldera, radiadores o sistema de climatización principal",
    icon: Thermometer,
    required: true,
    tips: "Incluye la etiqueta energética si está visible. Fotografía tanto la unidad exterior como interior si es aire acondicionado."
  },
  {
    id: "dhw",
    title: "Agua Caliente Sanitaria",
    description: "Calentador, termo eléctrico o sistema de ACS",
    icon: Droplets,
    required: true,
    tips: "Si es un termo, incluye la etiqueta energética. Si es gas, fotografía la caldera."
  },
  {
    id: "electrical",
    title: "Cuadro Eléctrico",
    description: "Panel eléctrico principal con etiquetas de potencia",
    icon: Zap,
    required: false,
    tips: "Asegúrate de que se puedan leer las etiquetas de potencia contratada."
  },
  {
    id: "interior",
    title: "Espacios Interiores",
    description: "Fotos representativas de salón, cocina y dormitorios",
    icon: Home,
    required: false,
    tips: "2-3 fotos de diferentes estancias para valorar el estado general."
  }
];

export default function CertificationForm() {
  const { uniqueLink } = useParams<{ uniqueLink: string }>();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedPhotos, setUploadedPhotos] = useState<{[key: string]: string[]}>({});
  const [formData, setFormData] = useState<Partial<CertificationFormData>>({});

  const { data: quoteData, isLoading } = useQuery({
    queryKey: [`/api/public/certification-form/${uniqueLink}`],
    enabled: !!uniqueLink,
  });

  const submitFormMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/public/certification-form/${uniqueLink}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Formulario enviado",
        description: "Hemos recibido toda la información. Comenzaremos tu certificación energética.",
      });
      setCurrentStep(5); // Success step
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar el formulario. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (photoType: string, files: FileList) => {
    // Aquí iría la lógica de subida de fotos
    // Por simplicidad, simularemos la subida
    const photoUrls = Array.from(files).map(file => URL.createObjectURL(file));
    setUploadedPhotos(prev => ({
      ...prev,
      [photoType]: [...(prev[photoType] || []), ...photoUrls]
    }));
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit form
      const finalData = {
        ...formData,
        photos: Object.values(uploadedPhotos).flat()
      };
      submitFormMutation.mutate(finalData);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return formData.fullName && formData.address && formData.cadastralRef;
      case 2:
        return formData.propertyType && formData.totalArea && formData.buildYear;
      case 3:
        return formData.heatingSystem && formData.dhwSystem;
      case 4:
        const requiredPhotos = photoRequirements.filter(p => p.required);
        return requiredPhotos.every(p => uploadedPhotos[p.id]?.length > 0);
      default:
        return false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formulario...</p>
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
            <p className="text-gray-600">El enlace del formulario no existe o ha expirado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Formulario de Certificación Energética</h1>
          <p className="text-gray-600 mt-2">
            Completa los datos de tu propiedad para generar el certificado energético oficial
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">
              Certificado listo en {quoteData.deliveryDays} días tras completar este formulario
            </span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-primary text-white' 
                    : isStepComplete(step) 
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {isStepComplete(step) ? <CheckCircle className="w-4 h-4" /> : step}
                </div>
                {step < 4 && (
                  <div className={`w-full h-1 mx-4 ${
                    step < currentStep ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Datos Generales</span>
            <span>Inmueble</span>
            <span>Instalaciones</span>
            <span>Fotografías</span>
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Datos Generales del Inmueble"}
              {currentStep === 2 && "Características del Inmueble"}
              {currentStep === 3 && "Instalaciones y Sistemas"}
              {currentStep === 4 && "Documentación Fotográfica"}
              {currentStep === 5 && "Formulario Completado"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="fullName">Nombre completo del propietario *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName || ""}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      placeholder="Nombre y apellidos"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dni">DNI/NIE *</Label>
                    <Input
                      id="dni"
                      value={formData.dni || ""}
                      onChange={(e) => handleInputChange("dni", e.target.value)}
                      placeholder="12345678A"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Dirección completa *</Label>
                  <Input
                    id="address"
                    value={formData.address || ""}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Calle, número, piso, puerta"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="postalCode">Código Postal</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode || ""}
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                      placeholder="30001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={formData.city || ""}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="Murcia"
                    />
                  </div>
                  <div>
                    <Label htmlFor="province">Provincia</Label>
                    <Input
                      id="province"
                      value={formData.province || ""}
                      onChange={(e) => handleInputChange("province", e.target.value)}
                      placeholder="Murcia"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cadastralRef">Referencia Catastral *</Label>
                  <Input
                    id="cadastralRef"
                    value={formData.cadastralRef || ""}
                    onChange={(e) => handleInputChange("cadastralRef", e.target.value)}
                    placeholder="1234567CS1234S0001WX"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    La puedes encontrar en tu recibo del IBI o en la web del Catastro
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="propertyType">Tipo de inmueble *</Label>
                    <Select 
                      value={formData.propertyType}
                      onValueChange={(value) => handleInputChange("propertyType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vivienda">Vivienda</SelectItem>
                        <SelectItem value="local">Local comercial</SelectItem>
                        <SelectItem value="oficina">Oficina</SelectItem>
                        <SelectItem value="edificio">Edificio completo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="buildYear">Año de construcción *</Label>
                    <Input
                      id="buildYear"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.buildYear || ""}
                      onChange={(e) => handleInputChange("buildYear", parseInt(e.target.value))}
                      placeholder="1990"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="totalArea">Superficie total (m²) *</Label>
                    <Input
                      id="totalArea"
                      type="number"
                      min="1"
                      step="0.1"
                      value={formData.totalArea || ""}
                      onChange={(e) => handleInputChange("totalArea", parseFloat(e.target.value))}
                      placeholder="80"
                    />
                  </div>
                  <div>
                    <Label htmlFor="heatedArea">Superficie climatizada (m²)</Label>
                    <Input
                      id="heatedArea"
                      type="number"
                      min="1"
                      step="0.1"
                      value={formData.heatedArea || ""}
                      onChange={(e) => handleInputChange("heatedArea", parseFloat(e.target.value))}
                      placeholder="75"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="floors">Plantas</Label>
                    <Input
                      id="floors"
                      type="number"
                      min="1"
                      value={formData.floors || ""}
                      onChange={(e) => handleInputChange("floors", parseInt(e.target.value))}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rooms">Habitaciones</Label>
                    <Input
                      id="rooms"
                      type="number"
                      min="1"
                      value={formData.rooms || ""}
                      onChange={(e) => handleInputChange("rooms", parseInt(e.target.value))}
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Baños</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min="1"
                      value={formData.bathrooms || ""}
                      onChange={(e) => handleInputChange("bathrooms", parseInt(e.target.value))}
                      placeholder="2"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="heatingSystem">Sistema de calefacción *</Label>
                    <Select 
                      value={formData.heatingSystem}
                      onValueChange={(value) => handleInputChange("heatingSystem", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gas_individual">Caldera individual gas</SelectItem>
                        <SelectItem value="gas_central">Calefacción central gas</SelectItem>
                        <SelectItem value="electrico">Eléctrico</SelectItem>
                        <SelectItem value="aire_acondicionado">Aire acondicionado</SelectItem>
                        <SelectItem value="biomasa">Biomasa</SelectItem>
                        <SelectItem value="sin_calefaccion">Sin calefacción</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="coolingSystem">Sistema de refrigeración</Label>
                    <Select 
                      value={formData.coolingSystem}
                      onValueChange={(value) => handleInputChange("coolingSystem", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aire_acondicionado">Aire acondicionado</SelectItem>
                        <SelectItem value="split">Split</SelectItem>
                        <SelectItem value="central">Sistema central</SelectItem>
                        <SelectItem value="ventiladores">Solo ventiladores</SelectItem>
                        <SelectItem value="sin_refrigeracion">Sin refrigeración</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="dhwSystem">Sistema de agua caliente sanitaria *</Label>
                  <Select 
                    value={formData.dhwSystem}
                    onValueChange={(value) => handleInputChange("dhwSystem", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caldera_gas">Caldera de gas</SelectItem>
                      <SelectItem value="termo_electrico">Termo eléctrico</SelectItem>
                      <SelectItem value="calentador_gas">Calentador de gas</SelectItem>
                      <SelectItem value="solar_termica">Solar térmica + apoyo</SelectItem>
                      <SelectItem value="bomba_calor">Bomba de calor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="renewableEnergy">Energías renovables</Label>
                  <Select 
                    value={formData.renewableEnergy}
                    onValueChange={(value) => handleInputChange("renewableEnergy", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ninguna">Ninguna</SelectItem>
                      <SelectItem value="solar_fotovoltaica">Solar fotovoltaica</SelectItem>
                      <SelectItem value="solar_termica">Solar térmica</SelectItem>
                      <SelectItem value="ambas">Solar fotovoltaica + térmica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-medium text-blue-900">Instrucciones para las fotografías</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Las fotos son fundamentales para una evaluación precisa. Sigue las indicaciones para cada tipo de fotografía.
                        Las fotos marcadas como obligatorias son imprescindibles para completar el certificado.
                      </p>
                    </div>
                  </div>
                </div>

                {photoRequirements.map((photo) => (
                  <Card key={photo.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <photo.icon className="w-6 h-6 text-primary mr-3" />
                          <div>
                            <h4 className="font-semibold text-gray-900 flex items-center">
                              {photo.title}
                              {photo.required && (
                                <Badge className="ml-2 bg-red-100 text-red-800 text-xs">Obligatorio</Badge>
                              )}
                            </h4>
                            <p className="text-sm text-gray-600">{photo.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            uploadedPhotos[photo.id]?.length > 0 ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {uploadedPhotos[photo.id]?.length || 0}
                          </div>
                          <div className="text-xs text-gray-500">fotos</div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 p-3 rounded-md mb-4">
                        <p className="text-sm text-yellow-800">
                          <strong>Consejo:</strong> {photo.tips}
                        </p>
                      </div>

                      <div className="flex items-center space-x-4">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          id={`upload-${photo.id}`}
                          onChange={(e) => e.target.files && handlePhotoUpload(photo.id, e.target.files)}
                        />
                        <label htmlFor={`upload-${photo.id}`}>
                          <Button variant="outline" className="cursor-pointer" asChild>
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              Subir fotos
                            </span>
                          </Button>
                        </label>
                        
                        {uploadedPhotos[photo.id]?.length > 0 && (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">
                              {uploadedPhotos[photo.id].length} foto{uploadedPhotos[photo.id].length > 1 ? 's' : ''} subida{uploadedPhotos[photo.id].length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Preview de fotos subidas */}
                      {uploadedPhotos[photo.id]?.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {uploadedPhotos[photo.id].slice(0, 3).map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`${photo.title} ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {currentStep === 5 && (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Formulario completado!</h2>
                <p className="text-gray-600 mb-6">
                  Hemos recibido toda la información necesaria para generar tu certificación energética.
                  Nuestro técnico comenzará el procesamiento inmediatamente.
                </p>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Tiempo estimado de entrega:</strong> {quoteData.deliveryDays} días laborables
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Te mantendremos informado del progreso por email y WhatsApp.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep < 5 && (
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handlePrevStep}
              disabled={currentStep === 1}
            >
              Anterior
            </Button>
            <Button 
              onClick={handleNextStep}
              disabled={!isStepComplete(currentStep) || submitFormMutation.isPending}
            >
              {currentStep === 4 
                ? (submitFormMutation.isPending ? "Enviando..." : "Finalizar")
                : "Siguiente"
              }
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}