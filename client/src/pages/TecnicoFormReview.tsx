// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, CheckCircle2, AlertTriangle, XCircle,
  Home, Layers, AppWindow, Thermometer, Camera,
  MessageSquare, ClipboardCheck, Clock, Eye, X
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface FachadaData {
  fotoId: number | null;
  fotoNombre: string | null;
  material: string;
  aislamiento: string;
}

interface VentanaData {
  fotoId: number | null;
  fotoNombre: string | null;
  tipoVidrio: string;
  tipoMarco: string;
}

interface FormData {
  cadastralReference: string;
  constructionYear: string;
  totalArea: string;
  floor: string;
  totalFloors: string;
  numFachadas: number;
  fachadas: FachadaData[];
  numVentanas: number;
  ventanas: VentanaData[];
  tienePersianas: string;
  fotoPersianasId: number | null;
  esUltimaPlanta: string;
  fotoCubiertaId: number | null;
  aislamientoCubierta: string;
  tipoCalefaccion: string;
  fotoCalefaccionId: number | null;
  tipoACS: string;
  tieneAire: string;
  fotoAireIntId: number | null;
  fotoAireExtId: number | null;
  tipoAire: string;
  fotosGeneralesIds: number[];
  notas: string;
}

interface Photo {
  id: number;
  path: string;          // Cloudinary URL
  tipoDoc: string;
  nombreOriginal: string;
}

interface TecnicoFormData {
  tecnicoFormStatus: string;
  tecnicoFormData: FormData | null;
  tecnicoFormCompletedAt: string | null;
  tecnicoFormReviewStatus: string | null;
  tecnicoFormReviewNotes: string | null;
  photos: Photo[];
}

// ─────────────────────────────────────────────────────────────────────────────
// LABEL HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const MATERIAL_LABELS: Record<string, string> = {
  ladrillo_visto:      "Ladrillo visto",
  ladrillo_enfoscado:  "Ladrillo con enfoscado",
  piedra:              "Piedra",
  hormigon:            "Prefabricado de hormigón",
  no_se:               "No lo sabe",
};

const AISLAMIENTO_LABELS: Record<string, string> = {
  si:    "Sí, tiene aislamiento",
  no:    "Sin aislamiento",
  no_se: "No lo sabe",
};

const VIDRIO_LABELS: Record<string, string> = {
  vidrio_simple: "Vidrio simple (una capa)",
  doble_vidrio:  "Doble vidrio / climalit",
  no_se:         "No lo sabe",
};

const MARCO_LABELS: Record<string, string> = {
  aluminio_sin_rpt: "Aluminio sin RPT",
  aluminio_con_rpt: "Aluminio con RPT",
  madera:           "Madera",
  pvc:              "PVC",
  no_se:            "No lo sabe",
};

const CALEFACCION_LABELS: Record<string, string> = {
  caldera_gas:      "Caldera de gas",
  bomba_calor:      "Bomba de calor / aerotermia",
  electrico:        "Radiadores eléctricos",
  gasoleo:          "Caldera de gasóleo",
  biomasa:          "Biomasa / pellets",
  solo_aire:        "Solo aire acondicionado",
  no_calefaccion:   "Sin calefacción",
};

const ACS_LABELS: Record<string, string> = {
  misma_caldera:     "Misma caldera que calefacción",
  solar:             "Paneles solares térmicos",
  calentador_gas:    "Calentador de gas",
  termo_electrico:   "Termo eléctrico",
  bomba_calor_acs:   "Bomba de calor",
  no_se:             "No lo sabe",
};

const AIRE_LABELS: Record<string, string> = {
  frio_solo:  "Solo frío",
  frio_calor: "Frío y calor",
  no_se:      "No lo sabe",
};

const PLANTA_LABELS: Record<string, string> = {
  bajo:        "Planta baja",
  primero:     "1ª planta",
  segundo:     "2ª planta",
  tercero:     "3ª planta",
  cuarto:      "4ª planta",
  quinto:      "5ª planta",
  atico:       "Ático",
  unifamiliar: "Casa unifamiliar",
};

function label(map: Record<string, string>, val: string) {
  return map[val] ?? val ?? "—";
}

// ─────────────────────────────────────────────────────────────────────────────
// PHOTO THUMBNAIL
// ─────────────────────────────────────────────────────────────────────────────
function PhotoThumb({
  photoId,
  photos,
  caption,
}: {
  photoId: number | null;
  photos: Photo[];
  caption?: string;
}) {
  const [open, setOpen] = useState(false);
  const photo = photos.find((p) => p.id === photoId);
  if (!photo) return <span className="text-xs text-gray-400 italic">Sin foto</span>;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative rounded-lg overflow-hidden border border-emerald-100 hover:border-emerald-400 transition-all"
        style={{ width: 96, height: 72 }}
      >
        <img src={photo.path} alt={caption ?? "foto"} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
          <Eye className="text-white opacity-0 group-hover:opacity-100 w-5 h-5 transition-all" />
        </div>
      </button>
      {caption && <p className="text-xs text-gray-500 mt-1 text-center w-24">{caption}</p>}

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setOpen(false)}
          >
            <X className="w-7 h-7" />
          </button>
          <img
            src={photo.path}
            alt={caption ?? "foto"}
            className="max-w-full max-h-full rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA ROW
// ─────────────────────────────────────────────────────────────────────────────
function DataRow({ label: l, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{l}</span>
      <span className="text-sm font-medium text-gray-800">{value || "—"}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────
function ReviewBadge({ status }: { status: string | null }) {
  if (!status || status === "pendiente_revision")
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendiente revisión</Badge>;
  if (status === "validado")
    return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">✅ Validado</Badge>;
  if (status === "visita_complementaria")
    return <Badge className="bg-orange-100 text-orange-800 border-orange-200">⚠️ Visita complementaria</Badge>;
  if (status === "visita_completa")
    return <Badge className="bg-red-100 text-red-800 border-red-200">❌ Visita completa</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function TecnicoFormReview() {
  const [, params] = useRoute("/revision-tecnica/:id");
  const certId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();

  const [reviewNotes, setReviewNotes] = useState("");
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);

  // ── Fetch cert basic info ────────────────────────────────────────────────
  const { data: cert } = useQuery<any>({
    queryKey: [`/api/certifications/${certId}`],
    enabled: !!certId,
  });

  // ── Fetch tecnico form data ──────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery<TecnicoFormData>({
    queryKey: [`/api/certifications/${certId}/tecnico-form-data`],
    enabled: !!certId,
  });

  // ── Submit review ────────────────────────────────────────────────────────
  const reviewMutation = useMutation({
    mutationFn: (payload: { reviewStatus: string; reviewNotes: string }) =>
      apiRequest("POST", `/api/certifications/${certId}/tecnico-form-review`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/certifications/${certId}/tecnico-form-data`] });
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      toast({ title: "Revisión guardada", description: "El estado del expediente ha sido actualizado." });
      setSelectedDecision(null);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar la revisión.", variant: "destructive" });
    },
  });

  function handleSubmitReview() {
    if (!selectedDecision) return;
    reviewMutation.mutate({ reviewStatus: selectedDecision, reviewNotes });
  }

  // ── Loading / Error states ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-emerald-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700 mx-auto mb-3" />
            <p className="text-emerald-700 font-medium">Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex bg-emerald-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">No se pudieron cargar los datos.</p>
            <Link href="/certificados">
              <Button variant="ghost" className="mt-4">← Volver a certificaciones</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form not completed yet ───────────────────────────────────────────────
  if (data.tecnicoFormStatus !== "completado") {
    return (
      <div className="min-h-screen flex bg-emerald-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full text-center p-8">
            <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Formulario pendiente</h2>
            <p className="text-gray-500 text-sm mb-6">
              El propietario todavía no ha completado el formulario técnico guiado.
              Estado actual: <strong>{data.tecnicoFormStatus ?? "enviado"}</strong>
            </p>
            <Link href="/certificados">
              <Button variant="outline">← Volver a certificaciones</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const fd = data.tecnicoFormData;
  const photos = data.photos ?? [];
  const alreadyReviewed = !!data.tecnicoFormReviewStatus && data.tecnicoFormReviewStatus !== "pendiente_revision";

  return (
    <div className="min-h-screen flex bg-emerald-50">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">

          {/* ── HEADER ────────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between">
            <div>
              <Link href="/certificados">
                <button className="flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-900 mb-3">
                  <ArrowLeft className="w-4 h-4" /> Volver a certificaciones
                </button>
              </Link>
              <h1 className="text-2xl font-bold text-emerald-900">Revisión de datos técnicos</h1>
              {cert && (
                <p className="text-gray-500 text-sm mt-1">
                  {cert.address ?? cert.ownerName ?? `Certificación #${certId}`}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <ReviewBadge status={data.tecnicoFormReviewStatus} />
              {data.tecnicoFormCompletedAt && (
                <span className="text-xs text-gray-400">
                  Enviado: {new Date(data.tecnicoFormCompletedAt).toLocaleDateString("es-ES", {
                    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT: DATA BLOCKS ───────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* BLOCK 1 — Datos básicos */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-emerald-800">
                    <Home className="w-4 h-4" /> Datos básicos del inmueble
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fd ? (
                    <>
                      <DataRow label="Referencia catastral" value={fd.cadastralReference} />
                      <DataRow label="Año de construcción" value={fd.constructionYear} />
                      <DataRow label="Superficie útil" value={fd.totalArea ? `${fd.totalArea} m²` : null} />
                      <DataRow label="Planta de la vivienda" value={label(PLANTA_LABELS, fd.floor)} />
                      <DataRow label="Nº plantas del edificio" value={fd.totalFloors} />
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Sin datos</p>
                  )}
                </CardContent>
              </Card>

              {/* BLOCK 2 — Fachadas */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-emerald-800">
                    <Layers className="w-4 h-4" /> Fachadas exteriores
                    {fd && <Badge variant="outline" className="ml-auto text-xs">{fd.numFachadas} fachada{fd.numFachadas !== 1 ? "s" : ""}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fd && fd.fachadas?.length > 0 ? (
                    <div className="space-y-5">
                      {fd.fachadas.map((f, i) => (
                        <div key={i} className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3">
                            Fachada {i + 1}
                          </p>
                          <div className="flex items-start gap-4">
                            <PhotoThumb photoId={f.fotoId} photos={photos} caption="Foto fachada" />
                            <div className="flex-1">
                              <DataRow label="Material" value={label(MATERIAL_LABELS, f.material)} />
                              <DataRow label="Aislamiento" value={label(AISLAMIENTO_LABELS, f.aislamiento)} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Sin datos de fachadas</p>
                  )}
                </CardContent>
              </Card>

              {/* BLOCK 3 — Ventanas */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-emerald-800">
                    <AppWindow className="w-4 h-4" /> Ventanas y huecos
                    {fd && <Badge variant="outline" className="ml-auto text-xs">{fd.numVentanas} ventana{fd.numVentanas !== 1 ? "s" : ""}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fd && fd.ventanas?.length > 0 ? (
                    <div className="space-y-4">
                      {fd.ventanas.map((v, i) => (
                        <div key={i} className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3">
                            Ventana {i + 1}
                          </p>
                          <div className="flex items-start gap-4">
                            <PhotoThumb photoId={v.fotoId} photos={photos} caption="Foto ventana" />
                            <div className="flex-1">
                              <DataRow label="Tipo de vidrio" value={label(VIDRIO_LABELS, v.tipoVidrio)} />
                              <DataRow label="Marco" value={label(MARCO_LABELS, v.tipoMarco)} />
                            </div>
                          </div>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex items-center gap-4 pt-1">
                        <DataRow label="¿Tiene persianas?" value={fd.tienePersianas === "si" ? "Sí" : fd.tienePersianas === "no" ? "No" : "Omitido"} />
                        {fd.fotoPersianasId && (
                          <PhotoThumb photoId={fd.fotoPersianasId} photos={photos} caption="Persianas" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Sin datos de ventanas</p>
                  )}
                </CardContent>
              </Card>

              {/* BLOCK 4 — Cubierta */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-emerald-800">
                    <Home className="w-4 h-4 rotate-180" /> Cubierta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fd ? (
                    <div className="flex items-start gap-4">
                      {fd.esUltimaPlanta === "si" && fd.fotoCubiertaId && (
                        <PhotoThumb photoId={fd.fotoCubiertaId} photos={photos} caption="Cubierta" />
                      )}
                      <div className="flex-1">
                        <DataRow label="¿Es última planta / unifamiliar?" value={fd.esUltimaPlanta === "si" ? "Sí" : "No"} />
                        {fd.esUltimaPlanta === "si" && (
                          <DataRow label="Aislamiento cubierta" value={label(AISLAMIENTO_LABELS, fd.aislamientoCubierta)} />
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Sin datos</p>
                  )}
                </CardContent>
              </Card>

              {/* BLOCK 5 — Calefacción y ACS */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-emerald-800">
                    <Thermometer className="w-4 h-4" /> Calefacción, ACS y aire acondicionado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fd ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        {fd.fotoCalefaccionId && (
                          <PhotoThumb photoId={fd.fotoCalefaccionId} photos={photos} caption="Calefacción" />
                        )}
                        <div className="flex-1">
                          <DataRow label="Sistema de calefacción" value={label(CALEFACCION_LABELS, fd.tipoCalefaccion)} />
                          <DataRow label="Agua caliente (ACS)" value={label(ACS_LABELS, fd.tipoACS)} />
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-start gap-4">
                        {fd.tieneAire === "si" && (
                          <div className="flex gap-2">
                            {fd.fotoAireIntId && <PhotoThumb photoId={fd.fotoAireIntId} photos={photos} caption="Aire interior" />}
                            {fd.fotoAireExtId && <PhotoThumb photoId={fd.fotoAireExtId} photos={photos} caption="Aire exterior" />}
                          </div>
                        )}
                        <div className="flex-1">
                          <DataRow label="¿Tiene aire acondicionado?" value={fd.tieneAire === "si" ? "Sí" : "No"} />
                          {fd.tieneAire === "si" && (
                            <DataRow label="Tipo de aire" value={label(AIRE_LABELS, fd.tipoAire)} />
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Sin datos</p>
                  )}
                </CardContent>
              </Card>

              {/* BLOCK 6 — Fotos generales y notas */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-emerald-800">
                    <Camera className="w-4 h-4" /> Fotos generales y notas del propietario
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fd?.fotosGeneralesIds?.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {fd.fotosGeneralesIds.map((id) => (
                        <PhotoThumb key={id} photoId={id} photos={photos} caption="General" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Sin fotos generales</p>
                  )}
                  {fd?.notas && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Nota del propietario
                        </p>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">
                          {fd.notas}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* ── RIGHT: DECISION PANEL ────────────────────────────────────── */}
            <div className="space-y-4">
              <div className="sticky top-6 space-y-4">

                {/* Previous decision if already reviewed */}
                {alreadyReviewed && (
                  <Card className="border-emerald-200 bg-emerald-50">
                    <CardContent className="pt-4">
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <ClipboardCheck className="w-3 h-3" /> Revisión anterior
                      </p>
                      <ReviewBadge status={data.tecnicoFormReviewStatus} />
                      {data.tecnicoFormReviewNotes && (
                        <p className="text-sm text-gray-600 mt-2 bg-white rounded p-2 border border-emerald-100">
                          {data.tecnicoFormReviewNotes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Decision card */}
                <Card className="border-2 border-emerald-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-emerald-900">
                      {alreadyReviewed ? "Actualizar decisión" : "Tu decisión"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">

                    {/* Option 1 — Validado */}
                    <button
                      onClick={() => setSelectedDecision("validado")}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        selectedDecision === "validado"
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-100 hover:border-emerald-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${selectedDecision === "validado" ? "text-emerald-600" : "text-gray-300"}`} />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Datos validados</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Los datos son suficientes. No hace falta visita al inmueble.
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Option 2 — Visita complementaria */}
                    <button
                      onClick={() => setSelectedDecision("visita_complementaria")}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        selectedDecision === "visita_complementaria"
                          ? "border-orange-400 bg-orange-50"
                          : "border-gray-100 hover:border-orange-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${selectedDecision === "visita_complementaria" ? "text-orange-500" : "text-gray-300"}`} />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Visita rápida necesaria</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Hay puntos dudosos. Solo necesito verificar algunos detalles.
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Option 3 — Visita completa */}
                    <button
                      onClick={() => setSelectedDecision("visita_completa")}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        selectedDecision === "visita_completa"
                          ? "border-red-400 bg-red-50"
                          : "border-gray-100 hover:border-red-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <XCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${selectedDecision === "visita_completa" ? "text-red-500" : "text-gray-300"}`} />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Visita completa</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Los datos son insuficientes. Necesito ir al inmueble.
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Notes */}
                    <div className="pt-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
                        Notas internas (opcional)
                      </label>
                      <Textarea
                        placeholder="Ej: El cliente dice que el marco es PVC, pero en las fotos parece aluminio. Verificar en visita."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="text-sm min-h-[90px] resize-none"
                      />
                    </div>

                    <Button
                      onClick={handleSubmitReview}
                      disabled={!selectedDecision || reviewMutation.isPending}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      {reviewMutation.isPending ? "Guardando..." : "Guardar decisión"}
                    </Button>
                  </CardContent>
                </Card>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
