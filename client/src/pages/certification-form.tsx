// @ts-nocheck
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Camera, Upload, CheckCircle, Home, Thermometer,
  Droplets, Zap, Info, Clock,
} from "lucide-react";

interface CertificationFormData {
  dni: string;
  fullName: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  cadastralRef: string;
  propertyType: string;
  totalArea: number;
  heatedArea: number;
  buildYear: number;
  floors: number;
  rooms: number;
  bathrooms: number;
  heatingSystem: string;
  coolingSystem: string;
  dhwSystem: string;
  renewableEnergy: string;
  photos: string[];
  observations: string;
}

const photoRequirements = [
  {
    id: "facade",
    title: "Fachada principal",
    description: "Foto completa de la fachada principal desde la calle",
    icon: Home,
    required: true,
    tips: "Toma la foto desde una distancia que permita ver todo el edificio. Asegurate de que este bien iluminado.",
  },
  {
    id: "windows",
    title: "Ventanas exteriores",
    description: "Fotos detalladas de diferentes tipos de ventanas",
    icon: Camera,
    required: true,
    tips: "Fotografía al menos 3 ventanas diferentes, incluyendo marcos y cristales.",
  },
  {
    id: "heating",
    title: "Sistema de calefaccion",
    description: "Caldera, radiadores o sistema de climatizacion principal",
    icon: Thermometer,
    required: true,
    tips: "Incluye la etiqueta energetica si esta visible.",
  },
  {
    id: "dhw",
    title: "Agua caliente sanitaria",
    description: "Calentador, termo electrico o sistema de ACS",
    icon: Droplets,
    required: true,
    tips: "Si es un termo, incluye la etiqueta energetica. Si es gas, fotografía la caldera.",
  },
  {
    id: "electrical",
    title: "Cuadro electrico",
    description: "Panel electrico principal con etiquetas de potencia",
    icon: Zap,
    required: false,
    tips: "Asegurate de que se puedan leer las etiquetas de potencia contratada.",
  },
  {
    id: "interior",
    title: "Espacios interiores",
    description: "Fotos representativas de salon, cocina y dormitorios",
    icon: Home,
    required: false,
    tips: "2-3 fotos de diferentes estancias para valorar el estado general.",
  },
];

const stepLabels = ["Datos generales", "Inmueble", "Instalaciones", "Fotografias"];

export default function CertificationForm() {
  const { uniqueLink } = useParams<{ uniqueLink: string }>();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedPhotos, setUploadedPhotos] = useState<{ [key: string]: string[] }>({});
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
        description: "Hemos recibido toda la informacion. Comenzaremos tu certificacion energetica.",
      });
      setCurrentStep(5);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar el formulario. Intentalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (photoType: string, files: FileList) => {
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setUploadedPhotos((prev) => ({ ...prev, [photoType]: [...(prev[photoType] || []), ...urls] }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      submitFormMutation.mutate({ ...formData, photos: Object.values(uploadedPhotos).flat() });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1: return !!(formData.fullName && formData.address && formData.cadastralRef);
      case 2: return !!(formData.propertyType && formData.totalArea && formData.buildYear);
      case 3: return !!(formData.heatingSystem && formData.dhwSystem);
      case 4:
        return photoRequirements
          .filter((p) => p.required)
          .every((p) => (uploadedPhotos[p.id]?.length ?? 0) > 0);
      default: return false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Cargando formulario…</p>
        </div>
      </div>
    );
  }

  if (!quoteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card border border-border rounded-2xl p-8 text-center w-full max-w-sm shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-2">Enlace no valido</h2>
          <p className="text-sm text-muted-foreground">El enlace del formulario no existe o ha expirado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Home className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Formulario de certificacion energetica
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Completa los datos de tu propiedad para generar el certificado energetico oficial
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            <Clock className="w-4 h-4" />
            <span>Certificado listo en {quoteData.deliveryDays} dias tras completar este formulario</span>
          </div>
        </div>

        {/* Progress steps */}
        <div className="mb-8">
          <div className="flex items-center">
            {[1, 2, 3, 4].map((step, i) => (
              <div key={step} className={i < 3 ? "flex-1 flex items-center" : "flex items-center"}>
                <div
                  className={[
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all",
                    isStepComplete(step) && step !== currentStep
                      ? "bg-primary text-primary-foreground"
                      : step === currentStep
                      ? "bg-primary/10 text-primary ring-2 ring-primary/30"
                      : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {isStepComplete(step) && step !== currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step
                  )}
                </div>
                {i < 3 && (
                  <div
                    className={[
                      "flex-1 h-0.5 mx-2 transition-all",
                      step < currentStep ? "bg-primary" : "bg-border",
                    ].join(" ")}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {stepLabels.map((label, i) => (
              <span
                key={i}
                className={[
                  "text-[11px] font-semibold",
                  i + 1 === currentStep ? "text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Main card */}
        <div className="bg-card border border-border rounded-2xl shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              {currentStep === 1 && "Datos generales del inmueble"}
              {currentStep === 2 && "Caracteristicas del inmueble"}
              {currentStep === 3 && "Instalaciones y sistemas"}
              {currentStep === 4 && "Documentacion fotografica"}
              {currentStep === 5 && "Formulario completado"}
            </h2>
          </div>

          <div className="p-6">

            {/* ── Step 1: Datos generales ── */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Nombre completo" required>
                    <Input
                      value={formData.fullName || ""}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      placeholder="Nombre y apellidos"
                    />
                  </Field>
                  <Field label="DNI / NIE" required>
                    <Input
                      value={formData.dni || ""}
                      onChange={(e) => handleInputChange("dni", e.target.value)}
                      placeholder="12345678A"
                      className="font-mono"
                    />
                  </Field>
                </div>

                <Field label="Direccion completa" required>
                  <Input
                    value={formData.address || ""}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Calle, numero, piso, puerta"
                  />
                </Field>

                <div className="grid grid-cols-3 gap-4">
                  <Field label="Codigo postal">
                    <Input
                      value={formData.postalCode || ""}
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                      placeholder="30001"
                    />
                  </Field>
                  <Field label="Ciudad">
                    <Input
                      value={formData.city || ""}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="Madrid"
                    />
                  </Field>
                  <Field label="Provincia">
                    <Input
                      value={formData.province || ""}
                      onChange={(e) => handleInputChange("province", e.target.value)}
                      placeholder="Madrid"
                    />
                  </Field>
                </div>

                <Field
                  label="Referencia catastral"
                  required
                  hint="20 caracteres alfanumericos. La encuentras en el recibo del IBI o en la web del Catastro."
                >
                  <Input
                    value={formData.cadastralRef || ""}
                    onChange={(e) => handleInputChange("cadastralRef", e.target.value)}
                    placeholder="1234567CS1234S0001WX"
                    className="font-mono"
                  />
                </Field>
              </div>
            )}

            {/* ── Step 2: Inmueble ── */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Tipo de inmueble" required>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(v) => handleInputChange("propertyType", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vivienda">Vivienda</SelectItem>
                        <SelectItem value="local">Local comercial</SelectItem>
                        <SelectItem value="oficina">Oficina</SelectItem>
                        <SelectItem value="edificio">Edificio completo</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Ano de construccion" required>
                    <Input
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.buildYear || ""}
                      onChange={(e) => handleInputChange("buildYear", parseInt(e.target.value))}
                      placeholder="1990"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Superficie total (m²)" required>
                    <Input
                      type="number"
                      min="1"
                      step="0.1"
                      value={formData.totalArea || ""}
                      onChange={(e) => handleInputChange("totalArea", parseFloat(e.target.value))}
                      placeholder="80"
                    />
                  </Field>
                  <Field label="Superficie climatizada (m²)">
                    <Input
                      type="number"
                      min="1"
                      step="0.1"
                      value={formData.heatedArea || ""}
                      onChange={(e) => handleInputChange("heatedArea", parseFloat(e.target.value))}
                      placeholder="75"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Field label="Plantas">
                    <Input
                      type="number"
                      min="1"
                      value={formData.floors || ""}
                      onChange={(e) => handleInputChange("floors", parseInt(e.target.value))}
                      placeholder="1"
                    />
                  </Field>
                  <Field label="Habitaciones">
                    <Input
                      type="number"
                      min="1"
                      value={formData.rooms || ""}
                      onChange={(e) => handleInputChange("rooms", parseInt(e.target.value))}
                      placeholder="3"
                    />
                  </Field>
                  <Field label="Banos">
                    <Input
                      type="number"
                      min="1"
                      value={formData.bathrooms || ""}
                      onChange={(e) => handleInputChange("bathrooms", parseInt(e.target.value))}
                      placeholder="2"
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* ── Step 3: Instalaciones ── */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Sistema de calefaccion" required>
                    <Select
                      value={formData.heatingSystem}
                      onValueChange={(v) => handleInputChange("heatingSystem", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gas_individual">Caldera individual gas</SelectItem>
                        <SelectItem value="gas_central">Calefaccion central gas</SelectItem>
                        <SelectItem value="electrico">Electrico</SelectItem>
                        <SelectItem value="aire_acondicionado">Aire acondicionado</SelectItem>
                        <SelectItem value="biomasa">Biomasa</SelectItem>
                        <SelectItem value="sin_calefaccion">Sin calefaccion</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Sistema de refrigeracion">
                    <Select
                      value={formData.coolingSystem}
                      onValueChange={(v) => handleInputChange("coolingSystem", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aire_acondicionado">Aire acondicionado</SelectItem>
                        <SelectItem value="split">Split</SelectItem>
                        <SelectItem value="central">Sistema central</SelectItem>
                        <SelectItem value="ventiladores">Solo ventiladores</SelectItem>
                        <SelectItem value="sin_refrigeracion">Sin refrigeracion</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field label="Sistema de agua caliente sanitaria" required>
                  <Select
                    value={formData.dhwSystem}
                    onValueChange={(v) => handleInputChange("dhwSystem", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caldera_gas">Caldera de gas</SelectItem>
                      <SelectItem value="termo_electrico">Termo electrico</SelectItem>
                      <SelectItem value="calentador_gas">Calentador de gas</SelectItem>
                      <SelectItem value="solar_termica">Solar termica + apoyo</SelectItem>
                      <SelectItem value="bomba_calor">Bomba de calor</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Energias renovables">
                  <Select
                    value={formData.renewableEnergy}
                    onValueChange={(v) => handleInputChange("renewableEnergy", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ninguna">Ninguna</SelectItem>
                      <SelectItem value="solar_fotovoltaica">Solar fotovoltaica</SelectItem>
                      <SelectItem value="solar_termica">Solar termica</SelectItem>
                      <SelectItem value="ambas">Solar fotovoltaica + termica</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )}

            {/* ── Step 4: Fotografias ── */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/6 border border-primary/15">
                  <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Instrucciones para las fotografias</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Las fotos son fundamentales para una evaluacion precisa. Las marcadas como obligatorias
                      son imprescindibles para completar el certificado.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {photoRequirements.map((photo) => {
                    const uploaded = uploadedPhotos[photo.id] || [];
                    const done = uploaded.length > 0;
                    return (
                      <div
                        key={photo.id}
                        className={[
                          "rounded-xl border p-4 transition-colors",
                          done ? "border-primary/25 bg-primary/3" : "border-border bg-card",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={[
                                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                                done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                              ].join(" ")}
                            >
                              <photo.icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-foreground">{photo.title}</p>
                                {photo.required && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                    Obligatorio
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{photo.description}</p>
                            </div>
                          </div>
                          {done && (
                            <div className="flex items-center gap-1 text-primary text-xs font-semibold flex-shrink-0">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {uploaded.length} foto{uploaded.length > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 mb-3 leading-relaxed">
                          {photo.tips}
                        </p>

                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          id={"upload-" + photo.id}
                          onChange={(e) =>
                            e.target.files && handlePhotoUpload(photo.id, e.target.files)
                          }
                        />
                        <label htmlFor={"upload-" + photo.id}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full h-8 px-3 text-xs font-semibold cursor-pointer border-border"
                            asChild
                          >
                            <span>
                              <Upload className="w-3.5 h-3.5 mr-1.5" />
                              Subir fotos
                            </span>
                          </Button>
                        </label>

                        {uploaded.length > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {uploaded.slice(0, 3).map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt={photo.title + " " + (i + 1)}
                                className="w-full h-20 object-cover rounded-lg border border-border"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Step 5: Exito ── */}
            {currentStep === 5 && (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Formulario completado</h2>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-sm mx-auto">
                  Hemos recibido toda la informacion necesaria. Nuestro tecnico comenzara el procesamiento inmediatamente.
                </p>
                <div className="inline-block bg-primary/8 border border-primary/15 rounded-xl px-5 py-3 text-left">
                  <p className="text-xs font-semibold text-foreground">
                    Tiempo estimado: {quoteData.deliveryDays} dias laborables
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Te mantendremos informado por email y WhatsApp.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Navigation buttons */}
        {currentStep < 5 && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="rounded-full h-9 px-4 text-xs font-semibold border-border"
            >
              Anterior
            </Button>
            <Button
              onClick={handleNext}
              disabled={!isStepComplete(currentStep) || submitFormMutation.isPending}
              className="rounded-full h-9 px-5 text-xs font-semibold"
            >
              {currentStep === 4
                ? submitFormMutation.isPending
                  ? "Enviando…"
                  : "Finalizar"
                : "Siguiente →"}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1.5">
        {label}
        {required && <span className="text-primary ml-0.5 font-bold">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{hint}</p>}
    </div>
  );
}
