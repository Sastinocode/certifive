// @ts-nocheck
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import PhotoUpload, { type PhotoItem } from "@/components/ui/photo-upload";
import {
  Home, User, Building2, Wind, Zap, Camera,
  ChevronLeft, ChevronRight, CheckCircle2, Send, ArrowLeft,
  MapPin, IdCard, Phone, Mail, Layers, AlignLeft, Thermometer,
  Flame, Droplets, LayoutGrid, Search, AlertCircle, CalendarDays,
  Maximize2, Tag, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

// ── Catastro types ───────────────────────────────────────────────────────────
type CatastroStatus = "idle" | "loading" | "success" | "error";
interface CatastroData {
  address?:          string;
  city?:             string;
  postalCode?:       string;
  province?:         string;
  comunidadAutonoma?: string;
  constructionYear?: string;
  totalArea?:        string;
  propertyType?:     string;
}

const schema = z.object({
  propertyAddress:      z.string().min(10, "Mínimo 10 caracteres"),
  ownerName:            z.string().min(2, "Nombre requerido"),
  ownerDni:             z.string().min(8, "DNI/NIE requerido"),
  cadastralRef:         z.string().min(14, "Referencia catastral requerida"),
  phone:                z.string().optional(),
  email:                z.string().email("Email inválido").optional().or(z.literal("")),
  buildingFloors:       z.number().min(1, "Mínimo 1 planta"),
  propertyFloors:       z.number().min(1, "Mínimo 1 planta"),
  rooms:                z.number().min(1, "Mínimo 1 habitación"),
  facadeNorthwest:      z.boolean().default(false),
  facadeSoutheast:      z.boolean().default(false),
  facadeEast:           z.boolean().default(false),
  facadeWest:           z.boolean().default(false),
  windowsNorthwest:     z.string().optional(),
  windowsSoutheast:     z.string().optional(),
  windowsEast:          z.string().optional(),
  windowsWest:          z.string().optional(),
  windowType:           z.string().optional(),
  windowMaterial:       z.string().optional(),
  windowColor:          z.string().optional(),
  glassType:            z.string().optional(),
  windowLocation:       z.string().optional(),
  hasShutters:          z.boolean().default(false),
  shutterType:          z.string().optional(),
  roofType:             z.string().optional(),
  airConditioningType:  z.string().optional(),
  airConditioningRooms: z.string().optional(),
  heatingType:          z.string().optional(),
  heatingDescription:   z.string().optional(),
  waterHeaterType:      z.string().optional(),
  waterHeaterCapacity:  z.number().optional(),
  photos:               z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof schema>;

const STEPS = [
  { id: 1, title: "Propiedad",      shortTitle: "Propiedad",  icon: Home },
  { id: 2, title: "Titular",        shortTitle: "Titular",    icon: User },
  { id: 3, title: "Estructura",     shortTitle: "Estructura", icon: Building2 },
  { id: 4, title: "Ventanas",       shortTitle: "Ventanas",   icon: Wind },
  { id: 5, title: "Instalaciones",  shortTitle: "Instalac.",  icon: Zap },
  { id: 6, title: "Fotografías",    shortTitle: "Fotos",      icon: Camera },
];

const STEP_FIELDS: Record<number, (keyof FormValues)[]> = {
  1: ["cadastralRef", "propertyAddress"],
  2: ["ownerName", "ownerDni"],
  3: ["buildingFloors", "propertyFloors", "rooms"],
  4: [],
  5: [],
  6: [],
};

// ── Slide variants ──────────────────────────────────────────────────────────
const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ── Field wrapper ───────────────────────────────────────────────────────────
function FieldGroup({ icon: Icon, children }: { icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      {Icon && (
        <div className="mt-[30px] flex-shrink-0 w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-teal-700" />
        </div>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ── Section card ─────────────────────────────────────────────────────────────
function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm space-y-5">
      {title && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>}
      {children}
    </div>
  );
}

export default function EnhancedCertificationForm() {
  const [step, setStep]               = useState(1);
  const [dir, setDir]                 = useState(1);
  const [photos, setPhotos]           = useState<PhotoItem[]>([]);
  const [catastroStatus, setCatastroStatus] = useState<CatastroStatus>("idle");
  const [catastroData, setCatastroData]     = useState<CatastroData | null>(null);
  const [catastroError, setCatastroError]   = useState<string>("");
  const [autofilled, setAutofilled]         = useState(false);
  const [, navigate]                  = useLocation();
  const { toast }                     = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      propertyAddress: "", ownerName: "", ownerDni: "", cadastralRef: "",
      phone: "", email: "",
      buildingFloors: 1, propertyFloors: 1, rooms: 1,
      facadeNorthwest: false, facadeSoutheast: false, facadeEast: false, facadeWest: false,
      windowsNorthwest: "", windowsSoutheast: "", windowsEast: "", windowsWest: "",
      windowType: "", windowMaterial: "", windowColor: "", glassType: "", windowLocation: "",
      hasShutters: false, shutterType: "",
      roofType: "", airConditioningType: "", airConditioningRooms: "",
      heatingType: "", heatingDescription: "", waterHeaterType: "",
      waterHeaterCapacity: undefined, photos: [],
    },
  });

  // ── Catastro lookup ─────────────────────────────────────────────────────────
  const lookupCatastro = async () => {
    const rc = form.getValues("cadastralRef")?.trim().toUpperCase().replace(/[\s-]/g, "");
    if (!rc || rc.length < 14) {
      setCatastroError("Introduce al menos 14 caracteres de la referencia catastral");
      return;
    }
    setCatastroStatus("loading");
    setCatastroError("");
    setCatastroData(null);
    setAutofilled(false);
    try {
      const res = await fetch(`/api/catastro/lookup?rc=${encodeURIComponent(rc)}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setCatastroStatus("error");
        setCatastroError(json.error ?? "Error consultando el Catastro");
        return;
      }
      const data: CatastroData = json.data;
      setCatastroData(data);
      setCatastroStatus("success");
      // Autofill address if we got one and address is currently empty
      if (data.address) {
        const parts: string[] = [data.address];
        if (data.city)       parts.push(data.city);
        if (data.postalCode) parts.push(data.postalCode);
        if (data.province)   parts.push(data.province);
        const combined = [...new Set(parts)].join(", ");
        const current = form.getValues("propertyAddress") ?? "";
        if (!current.trim() || current.length < 5) {
          form.setValue("propertyAddress", combined, { shouldValidate: true });
          setAutofilled(true);
        }
      }
      toast({ title: "Catastro consultado ✓", description: "Datos del inmueble obtenidos correctamente." });
    } catch {
      setCatastroStatus("error");
      setCatastroError("No se pudo conectar con el Catastro. Comprueba tu conexión.");
    }
  };

  const mutation = useMutation({
    mutationFn: (data: FormValues) => apiRequest("POST", "/api/certifications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      toast({ title: "Solicitud enviada", description: "La certificación se ha registrado correctamente." });
      navigate("/certificados");
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo enviar. Inténtalo de nuevo.", variant: "destructive" });
    },
  });

  const go = async (next: number) => {
    if (next > step) {
      const fields = STEP_FIELDS[step];
      if (fields.length) {
        const ok = await form.trigger(fields);
        if (!ok) return;
      }
    }
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const onSubmit = (data: FormValues) => {
    const photoUrls = photos.map((p) => p.dataUrl);
    mutation.mutate({ ...data, photos: photoUrls });
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/certificados")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex-1">
            <h1 className="text-base font-semibold text-slate-800">Formulario CEE</h1>
            <p className="text-xs text-slate-500">Paso {step} de {STEPS.length} — {STEPS[step - 1].title}</p>
          </div>
        </div>

        {/* Progress track */}
        <div className="max-w-2xl mx-auto px-4 pb-4">
          {/* Step pills */}
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done    = step > s.id;
              const active  = step === s.id;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => { if (done) go(s.id); }}
                    disabled={!done}
                    className={[
                      "flex flex-col items-center gap-1 group transition-all",
                      done ? "cursor-pointer" : "cursor-default",
                    ].join(" ")}
                  >
                    <div className={[
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-xs font-bold",
                      done   ? "bg-teal-600 text-white shadow-sm shadow-teal-200"
                             : active ? "bg-teal-600 text-white ring-2 ring-teal-200"
                             : "bg-slate-100 text-slate-400",
                    ].join(" ")}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={[
                      "text-[10px] font-medium hidden sm:block transition-colors",
                      active ? "text-teal-700" : done ? "text-teal-600" : "text-slate-400",
                    ].join(" ")}>
                      {s.shortTitle}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden bg-slate-100">
                      <div
                        className="h-full bg-teal-500 transition-all duration-500 ease-out"
                        style={{ width: step > s.id ? "100%" : "0%" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Thin progress bar */}
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"
              animate={{ width: `${progress === 0 ? 8 : progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* ── Form body ── */}
      <div className="max-w-2xl mx-auto px-4 py-8 pb-28">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-5"
              >

                {/* ── PASO 1: Propiedad ── */}
                {step === 1 && (
                  <>
                    <StepHeading icon={Home} title="Datos de la Propiedad" subtitle="Introduce la referencia catastral para autocompletar los datos del inmueble" />

                    {/* RC field + lookup button */}
                    <Section title="Referencia Catastral">
                      <FieldGroup icon={LayoutGrid}>
                        <FormField
                          control={form.control}
                          name="cadastralRef"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Referencia Catastral *</FormLabel>
                              <FormControl>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Ej: 9299801XG9799N0075RX"
                                    className="font-mono flex-1"
                                    data-testid="input-cadastral-ref"
                                    {...field}
                                    onChange={e => {
                                      field.onChange(e);
                                      // Reset catastro if user edits RC
                                      if (catastroStatus !== "idle") {
                                        setCatastroStatus("idle");
                                        setCatastroData(null);
                                        setCatastroError("");
                                        setAutofilled(false);
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    data-testid="button-catastro-lookup"
                                    className={[
                                      "shrink-0 gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50 transition-colors",
                                      catastroStatus === "success" ? "border-teal-400 bg-teal-50" : "",
                                    ].join(" ")}
                                    disabled={catastroStatus === "loading" || (field.value?.length ?? 0) < 14}
                                    onClick={lookupCatastro}
                                  >
                                    {catastroStatus === "loading" ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : catastroStatus === "success" ? (
                                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                                    ) : (
                                      <Search className="w-4 h-4" />
                                    )}
                                    <span className="hidden sm:inline">
                                      {catastroStatus === "loading" ? "Consultando…" : catastroStatus === "success" ? "Consultado" : "Consultar Catastro"}
                                    </span>
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                              {(field.value?.length ?? 0) >= 14 && catastroStatus === "idle" && (
                                <p className="text-xs text-slate-400 mt-1">Pulsa "Consultar Catastro" para autocompletar los datos del inmueble</p>
                              )}
                            </FormItem>
                          )}
                        />
                      </FieldGroup>

                      {/* Error state */}
                      <AnimatePresence>
                        {catastroStatus === "error" && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
                            data-testid="catastro-error"
                          >
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-red-700">No se pudo obtener datos del Catastro</p>
                              <p className="text-xs text-red-600 mt-0.5">{catastroError}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Success data cards */}
                      <AnimatePresence>
                        {catastroStatus === "success" && catastroData && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="space-y-3"
                            data-testid="catastro-data"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-teal-600" />
                              <p className="text-sm font-semibold text-teal-700">Datos obtenidos del Catastro</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {catastroData.constructionYear && (
                                <div className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-center" data-testid="catastro-year">
                                  <CalendarDays className="w-4 h-4 text-teal-500 mx-auto mb-1" />
                                  <p className="text-xs text-slate-500">Año construcción</p>
                                  <p className="text-sm font-bold text-slate-800">{catastroData.constructionYear}</p>
                                </div>
                              )}
                              {catastroData.totalArea && (
                                <div className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-center" data-testid="catastro-area">
                                  <Maximize2 className="w-4 h-4 text-teal-500 mx-auto mb-1" />
                                  <p className="text-xs text-slate-500">Superficie</p>
                                  <p className="text-sm font-bold text-slate-800">{catastroData.totalArea} m²</p>
                                </div>
                              )}
                              {catastroData.propertyType && (
                                <div className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-center" data-testid="catastro-type">
                                  <Tag className="w-4 h-4 text-teal-500 mx-auto mb-1" />
                                  <p className="text-xs text-slate-500">Tipo de inmueble</p>
                                  <p className="text-sm font-bold text-slate-800 leading-tight">{catastroData.propertyType}</p>
                                </div>
                              )}
                            </div>
                            {catastroData.city && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {[catastroData.city, catastroData.province, catastroData.postalCode].filter(Boolean).join(" · ")}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Section>

                    {/* Address field (autofilled) */}
                    <Section title="Dirección del Inmueble">
                      <FieldGroup icon={MapPin}>
                        <FormField
                          control={form.control}
                          name="propertyAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Dirección Completa *
                                {autofilled && (
                                  <span className="text-[10px] font-semibold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">
                                    Autocompletado ✓
                                  </span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Ej: PUERTO LATINO 1; BLOQUE 2, PUERTA 4, DÚPLEX 7; LA MANGA DEL MAR MENOR. 30380 SAN JAVIER"
                                  rows={4}
                                  data-testid="input-property-address"
                                  className={["resize-none transition-colors", autofilled ? "border-teal-300 bg-teal-50/40" : ""].join(" ")}
                                  {...field}
                                  onChange={e => { field.onChange(e); setAutofilled(false); }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </FieldGroup>
                    </Section>
                  </>
                )}

                {/* ── PASO 2: Titular ── */}
                {step === 2 && (
                  <>
                    <StepHeading icon={User} title="Datos del Titular" subtitle="Información personal del propietario del inmueble" />
                    <Section title="Identificación">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FieldGroup icon={User}>
                          <FormField control={form.control} name="ownerName" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre Completo *</FormLabel>
                              <FormControl><Input placeholder="Ej: MICHAEL HERBERT HINKINS" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </FieldGroup>
                        <FieldGroup icon={IdCard}>
                          <FormField control={form.control} name="ownerDni" render={({ field }) => (
                            <FormItem>
                              <FormLabel>DNI / NIE *</FormLabel>
                              <FormControl><Input placeholder="Ej: X-1166555-H" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </FieldGroup>
                      </div>
                    </Section>

                    <Section title="Contacto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FieldGroup icon={Phone}>
                          <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teléfono</FormLabel>
                              <FormControl><Input placeholder="Ej: 968 56 41 12" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </FieldGroup>
                        <FieldGroup icon={Mail}>
                          <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl><Input placeholder="info@ejemplo.es" type="email" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </FieldGroup>
                      </div>
                    </Section>
                  </>
                )}

                {/* ── PASO 3: Estructura ── */}
                {step === 3 && (
                  <>
                    <StepHeading icon={Building2} title="Estructura del Edificio" subtitle="Características físicas del inmueble" />
                    <Section>
                      <div className="grid grid-cols-3 gap-4">
                        <FieldGroup icon={Layers}>
                          <FormField control={form.control} name="buildingFloors" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Plantas Edificio</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" placeholder="Ej: 4" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </FieldGroup>
                        <FieldGroup icon={Layers}>
                          <FormField control={form.control} name="propertyFloors" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Plantas Vivienda</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" placeholder="Ej: 1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </FieldGroup>
                        <FieldGroup icon={Building2}>
                          <FormField control={form.control} name="rooms" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Habitaciones</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" placeholder="Ej: 3" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </FieldGroup>
                      </div>
                    </Section>
                  </>
                )}

                {/* ── PASO 4: Ventanas ── */}
                {step === 4 && (
                  <>
                    <StepHeading icon={Wind} title="Orientación y Ventanas" subtitle="Fachadas expuestas y carpintería del inmueble" />

                    <Section title="Orientación de las fachadas">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { name: "facadeNorthwest" as const, label: "Noroeste", emoji: "↖" },
                          { name: "facadeSoutheast" as const, label: "Sureste",  emoji: "↘" },
                          { name: "facadeEast"      as const, label: "Este",     emoji: "→" },
                          { name: "facadeWest"      as const, label: "Oeste",    emoji: "←" },
                        ].map(({ name, label, emoji }) => (
                          <FormField key={name} control={form.control} name={name} render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <label className={[
                                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium",
                                  field.value
                                    ? "border-teal-500 bg-teal-50 text-teal-700"
                                    : "border-slate-200 text-slate-500 hover:border-slate-300",
                                ].join(" ")}>
                                  <Checkbox
                                    checked={field.value || false}
                                    onCheckedChange={field.onChange}
                                    className="sr-only"
                                  />
                                  <span className="text-xl">{emoji}</span>
                                  {label}
                                </label>
                              </FormControl>
                            </FormItem>
                          )} />
                        ))}
                      </div>
                    </Section>

                    <Section title="Ventanas por orientación">
                      <div className="space-y-4">
                        {[
                          { name: "windowsNorthwest" as const, label: "Noroeste", placeholder: "Salón-Comedor: 2 puertas correderas, Dorm. principal: 1 puerta" },
                          { name: "windowsSoutheast" as const, label: "Sureste",  placeholder: "Cocina: 2 ventanas, Baño 2ª Planta: 1 ventana pequeña" },
                          { name: "windowsEast"      as const, label: "Este",     placeholder: "Pasillo: 1 ventana pequeña" },
                          { name: "windowsWest"      as const, label: "Oeste",    placeholder: "Dorm. 2ª Planta: ventana corredera a terraza" },
                        ].map(({ name, label, placeholder }) => (
                          <FormField key={name} control={form.control} name={name} render={({ field }) => (
                            <FormItem>
                              <FormLabel>{label}</FormLabel>
                              <FormControl>
                                <Textarea placeholder={placeholder} rows={2} className="resize-none" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )} />
                        ))}
                      </div>
                    </Section>

                    <Section title="Detalles de carpintería">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField control={form.control} name="windowType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de ventana</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="rectangular">Rectangular</SelectItem>
                                <SelectItem value="cuadrada">Cuadrada</SelectItem>
                                <SelectItem value="redonda">Redonda</SelectItem>
                                <SelectItem value="corredera">Corredera</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="windowMaterial" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Material del marco</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="aluminio">Aluminio</SelectItem>
                                <SelectItem value="pvc">PVC</SelectItem>
                                <SelectItem value="madera">Madera</SelectItem>
                                <SelectItem value="mixto">Mixto</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="windowColor" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color del material</FormLabel>
                            <FormControl><Input placeholder="Ej: MARRÓN, BLANCO" value={field.value || ""} onChange={field.onChange} /></FormControl>
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="glassType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de vidrio</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="simple">Simple</SelectItem>
                                <SelectItem value="doble">Doble acristalamiento</SelectItem>
                                <SelectItem value="triple">Triple acristalamiento</SelectItem>
                                <SelectItem value="bajo_emisivo">Bajo emisivo</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="windowLocation" render={({ field }) => (
                        <FormItem>
                          <FormLabel>¿A dónde dan las ventanas?</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Ej: AL PUERTO / CARRETERA DETRÁS DEL PUERTO" rows={2} className="resize-none" value={field.value || ""} onChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="hasShutters" render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <label className={[
                              "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                              field.value ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-slate-300",
                            ].join(" ")}>
                              <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                              <span className="text-sm font-medium text-slate-700">El inmueble tiene persianas o contraventanas</span>
                            </label>
                          </FormControl>
                        </FormItem>
                      )} />

                      {form.watch("hasShutters") && (
                        <FormField control={form.control} name="shutterType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de persiana</FormLabel>
                            <FormControl><Input placeholder="Ej: Contraventanas mallorquinas de madera" value={field.value || ""} onChange={field.onChange} /></FormControl>
                          </FormItem>
                        )} />
                      )}
                    </Section>
                  </>
                )}

                {/* ── PASO 5: Instalaciones ── */}
                {step === 5 && (
                  <>
                    <StepHeading icon={Zap} title="Instalaciones Energéticas" subtitle="Sistemas de climatización, calefacción y agua caliente" />

                    <Section title="Cubierta">
                      <FieldGroup icon={Layers}>
                        <FormField control={form.control} name="roofType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de cubierta</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="plana">Plana</SelectItem>
                                <SelectItem value="inclinada">Inclinada</SelectItem>
                                <SelectItem value="mixta">Mixta</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldGroup>
                    </Section>

                    <Section title="Climatización">
                      <FieldGroup icon={Wind}>
                        <FormField control={form.control} name="airConditioningType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sistema de climatización</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="split">Split individual</SelectItem>
                                <SelectItem value="conductos">Por conductos</SelectItem>
                                <SelectItem value="central">Sistema central</SelectItem>
                                <SelectItem value="no">Sin climatización</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </FieldGroup>
                      <FieldGroup icon={AlignLeft}>
                        <FormField control={form.control} name="airConditioningRooms" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estancias climatizadas</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Ej: A/A en cocina, comedor, salón y dormitorio principal" rows={2} className="resize-none" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )} />
                      </FieldGroup>
                    </Section>

                    <Section title="Calefacción">
                      <FieldGroup icon={Flame}>
                        <FormField control={form.control} name="heatingType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sistema de calefacción</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="radiadores">Radiadores</SelectItem>
                                <SelectItem value="suelo_radiante">Suelo radiante</SelectItem>
                                <SelectItem value="chimenea">Chimenea</SelectItem>
                                <SelectItem value="bomba_calor">Bomba de calor</SelectItem>
                                <SelectItem value="electrico">Eléctrico</SelectItem>
                                <SelectItem value="no">Sin calefacción</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </FieldGroup>
                      <FieldGroup icon={AlignLeft}>
                        <FormField control={form.control} name="heatingDescription" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Ej: Chimenea abierta con simulador de fuego eléctrico" rows={2} className="resize-none" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )} />
                      </FieldGroup>
                    </Section>

                    <Section title="Agua caliente sanitaria">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FieldGroup icon={Droplets}>
                          <FormField control={form.control} name="waterHeaterType" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de calentador</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="gas_ciudad">Gas ciudad</SelectItem>
                                  <SelectItem value="gas_butano">Gas butano</SelectItem>
                                  <SelectItem value="electrico">Eléctrico</SelectItem>
                                  <SelectItem value="bomba_calor">Bomba de calor</SelectItem>
                                  <SelectItem value="solar">Solar</SelectItem>
                                  <SelectItem value="no">Sin agua caliente</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                        </FieldGroup>

                        {["electrico", "bomba_calor"].includes(form.watch("waterHeaterType") ?? "") && (
                          <FieldGroup icon={Thermometer}>
                            <FormField control={form.control} name="waterHeaterCapacity" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Capacidad (litros)</FormLabel>
                                <FormControl>
                                  <Input type="number" min="1" placeholder="Ej: 80" value={field.value || ""} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
                              </FormItem>
                            )} />
                          </FieldGroup>
                        )}
                      </div>
                    </Section>
                  </>
                )}

                {/* ── PASO 6: Fotografías ── */}
                {step === 6 && (
                  <>
                    <StepHeading icon={Camera} title="Fotografías del Inmueble" subtitle="Añade fotos de las zonas clave para el certificado" />

                    <div className="space-y-4">
                      <PhotoSection
                        title="Fachada principal"
                        hint="Vista frontal exterior del edificio"
                        photos={photos.filter(p => p.id.startsWith("fachada-"))}
                        prefix="fachada-"
                        allPhotos={photos}
                        onChange={setPhotos}
                      />
                      <PhotoSection
                        title="Instalaciones (HVAC / calefacción)"
                        hint="Equipos de climatización, calefacción y calentador"
                        photos={photos.filter(p => p.id.startsWith("inst-"))}
                        prefix="inst-"
                        allPhotos={photos}
                        onChange={setPhotos}
                      />
                      <PhotoSection
                        title="Ventanas y carpintería"
                        hint="Detalle de los marcos, vidrios y persianas"
                        photos={photos.filter(p => p.id.startsWith("ventanas-"))}
                        prefix="ventanas-"
                        allPhotos={photos}
                        onChange={setPhotos}
                      />
                      <PhotoSection
                        title="Otras fotografías"
                        hint="Cubierta, patio, zonas comunes u otros elementos relevantes"
                        photos={photos.filter(p => p.id.startsWith("otros-"))}
                        prefix="otros-"
                        allPhotos={photos}
                        onChange={setPhotos}
                      />
                    </div>

                    {photos.length > 0 && (
                      <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                        <p className="text-sm text-teal-700">
                          <span className="font-semibold">{photos.length} foto{photos.length !== 1 ? "s" : ""}</span> añadida{photos.length !== 1 ? "s" : ""} al formulario
                        </p>
                      </div>
                    )}
                  </>
                )}

              </motion.div>
            </AnimatePresence>
          </form>
        </Form>
      </div>

      {/* ── Sticky footer navigation ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-lg z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => go(step - 1)}
            disabled={step === 1}
            className="flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>

          <span className="text-xs text-slate-400 font-medium">{step} / {STEPS.length}</span>

          {step < STEPS.length ? (
            <Button
              type="button"
              onClick={() => go(step + 1)}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
            >
              {mutation.isPending ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {mutation.isPending ? "Enviando…" : "Enviar solicitud"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper: Step heading ─────────────────────────────────────────────────────
function StepHeading({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 mb-1">
      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-teal-700" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

// ── Helper: Named photo section ──────────────────────────────────────────────
function PhotoSection({
  title, hint, photos, prefix, allPhotos, onChange,
}: {
  title: string; hint: string;
  photos: PhotoItem[]; prefix: string;
  allPhotos: PhotoItem[]; onChange: (p: PhotoItem[]) => void;
}) {
  const handleChange = (updated: PhotoItem[]) => {
    const prefixed = updated.map((p) =>
      p.id.startsWith(prefix) ? p : { ...p, id: prefix + p.id }
    );
    const others = allPhotos.filter((p) => !p.id.startsWith(prefix));
    onChange([...others, ...prefixed]);
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-700 mb-0.5">{title}</p>
      <p className="text-xs text-slate-400 mb-4">{hint}</p>
      <PhotoUpload
        photos={photos}
        onChange={handleChange}
        maxPhotos={6}
      />
    </div>
  );
}
