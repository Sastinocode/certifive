// @ts-nocheck
import { useState, useRef } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { exportCE3XPdf, exportCE3XExcel } from "@/lib/exportCE3X";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ChevronDown, ChevronUp, Trash2, Plus, Upload, FileText,
  Home, Square, Wrench, Camera, Lightbulb, CheckCircle2, BarChart2,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

const ORIENTACIONES = ["N", "NE", "E", "SE", "S", "SO", "O", "NO", "Horizontal"];
const METODOS = [
  { value: "por_defecto", label: "Por defecto CE3X" },
  { value: "estimado",    label: "Estimado" },
  { value: "conocido",    label: "Conocido" },
];
const TIPOS_ENVOLVENTE = ["Fachada", "Cubierta", "Suelo", "Medianería"];
const TIPOS_HUECO      = ["Ventana", "Puerta", "Lucernario"];
const SISTEMAS_INSTALACION = ["Calefacción", "Refrigeración", "ACS", "Iluminación"];
const TIPOS_EQUIPO: Record<string, string[]> = {
  "Calefacción":   ["Caldera gas", "Caldera gasoil", "Bomba de calor", "Radiadores eléctricos", "Biomasa", "Sin calefacción"],
  "Refrigeración": ["Bomba de calor", "Split", "No tiene"],
  "ACS":           ["Caldera gas", "Calentador gas", "Termo eléctrico", "Bomba calor", "Solar térmica", "Misma caldera calefacción"],
  "Iluminación":   ["Fluorescente", "LED", "Incandescente", "Mixta"],
};
const VECTORES_ENERGETICOS = ["Gas natural", "Gasóleo", "Electricidad", "Biomasa", "GLP", "Solar", "No aplica"];
const CATEGORIAS_FOTO = ["Fachada", "Cubierta", "Instalaciones", "Interior", "Detalle", "Otro"];
const TIPOS_MEDIDA = ["Envolvente", "Instalaciones", "Iluminación"];
const CALIFICACIONES = ["A", "B", "C", "D", "E", "F", "G", "No estimada"];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}
        {hint && <span className="ml-1 text-slate-400 font-normal normal-case tracking-normal">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white";
const selectCls = inputCls;
const textareaCls = inputCls + " resize-none";

function Select({ options, ...props }: { options: string[] | { value: string; label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={selectCls} {...props}>
      <option value="">— Selecciona —</option>
      {options.map((o) =>
        typeof o === "string"
          ? <option key={o} value={o.toLowerCase().replace(/\s+/g, "_").replace(/[áéíóúñ]/g, c => ({ á:"a",é:"e",í:"i",ó:"o",ú:"u",ñ:"n" }[c]||c))}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
      )}
    </select>
  );
}

function ItemRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return (
    <div className="flex items-start gap-2 bg-white border border-slate-100 rounded-lg px-3 py-2.5 text-sm group">
      <div className="flex-1 min-w-0">{children}</div>
      <button
        onClick={onDelete}
        className="text-slate-300 hover:text-red-500 transition-colors shrink-0 mt-0.5"
        title="Eliminar"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function Section({
  title, icon, count, open, onToggle, children,
}: {
  title: string; icon: React.ReactNode; count: number;
  open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="text-emerald-700">{icon}</span>
        <span className="flex-1 font-semibold text-slate-800 text-sm">{title}</span>
        {count > 0 && (
          <span className="flex items-center gap-1 text-emerald-700 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {count} {count === 1 ? "elemento" : "elementos"}
          </span>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 border-t border-slate-100 flex flex-col gap-4">{children}</div>}
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function VisitForm() {
  const [, params] = useRoute("/visita/:id");
  const certId = params?.id ?? "";
  const qc = useQueryClient();
  const { toast } = useToast();
  const queryKey = [`/api/certifications/${certId}/visit-data`];

  const { data, isLoading } = useQuery({ queryKey, enabled: !!certId });

  const [open, setOpen] = useState({ envelope: true, openings: false, installations: false, photos: false, measures: false });
  const toggle = (k: string) => setOpen(p => ({ ...p, [k]: !p[k] }));
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey });
  const ok = (msg: string) => toast({ title: msg });
  const err = (msg: string) => toast({ title: msg, variant: "destructive" });

  function useDel(url: string) {
    return useMutation({
      mutationFn: (id: number) => apiRequest("DELETE", `${url}/${id}`),
      onSuccess: () => { invalidate(); ok("Eliminado correctamente"); },
      onError: () => err("Error al eliminar"),
    });
  }

  const delEnvelope     = useDel("/api/envelope");
  const delOpening      = useDel("/api/openings");
  const delInstallation = useDel("/api/installations");
  const delMeasure      = useDel("/api/measures");
  const delPhoto        = useDel("/api/visit-photos");

  // ── Envelope form state ──
  const [envForm, setEnvForm] = useState({ tipo: "", nombre: "", orientacion: "", superficieM2: "", transmitanciaU: "", metodo: "por_defecto", descripcion: "" });
  const addEnvelope = useMutation({
    mutationFn: () => apiRequest("POST", `/api/certifications/${certId}/envelope`, {
      tipo: envForm.tipo, nombre: envForm.nombre,
      orientacion: envForm.orientacion || null,
      superficieM2: envForm.superficieM2 || null,
      transmitanciaU: envForm.transmitanciaU || null,
      metodo: envForm.metodo,
      descripcion: envForm.descripcion || null,
    }),
    onSuccess: () => {
      invalidate();
      setEnvForm({ tipo: "", nombre: "", orientacion: "", superficieM2: "", transmitanciaU: "", metodo: "por_defecto", descripcion: "" });
      ok("Elemento añadido");
    },
    onError: () => err("Error al añadir elemento"),
  });

  // ── Opening form state ──
  const [opForm, setOpForm] = useState({ tipo: "", envelopeElementId: "", orientacion: "", superficieM2: "", metodo: "por_defecto", descripcion: "" });
  const addOpening = useMutation({
    mutationFn: () => apiRequest("POST", `/api/certifications/${certId}/openings`, {
      tipo: opForm.tipo,
      envelopeElementId: opForm.envelopeElementId ? parseInt(opForm.envelopeElementId) : null,
      orientacion: opForm.orientacion || null,
      superficieM2: opForm.superficieM2 || null,
      metodo: opForm.metodo,
      descripcion: opForm.descripcion || null,
    }),
    onSuccess: () => {
      invalidate();
      setOpForm({ tipo: "", envelopeElementId: "", orientacion: "", superficieM2: "", metodo: "por_defecto", descripcion: "" });
      ok("Hueco añadido");
    },
    onError: () => err("Error al añadir hueco"),
  });

  // ── Installation form state ──
  const [instForm, setInstForm] = useState({ sistema: "", tipo: "", vectorEnergetico: "", rendimiento: "", potenciaKw: "", anyoInstalacion: "", notas: "" });
  const addInstallation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/certifications/${certId}/installations`, {
      sistema: instForm.sistema, tipo: instForm.tipo,
      vectorEnergetico: instForm.vectorEnergetico || null,
      rendimiento: instForm.rendimiento || null,
      potenciaKw: instForm.potenciaKw || null,
      anyoInstalacion: instForm.anyoInstalacion ? parseInt(instForm.anyoInstalacion) : null,
      notas: instForm.notas || null,
    }),
    onSuccess: () => {
      invalidate();
      setInstForm({ sistema: "", tipo: "", vectorEnergetico: "", rendimiento: "", potenciaKw: "", anyoInstalacion: "", notas: "" });
      ok("Instalación añadida");
    },
    onError: () => err("Error al añadir instalación"),
  });

  // ── Photo upload ──
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoForm, setPhotoForm] = useState({ categoria: "otro", descripcion: "" });
  const uploadPhoto = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("categoria", photoForm.categoria);
      fd.append("descripcion", photoForm.descripcion);
      return fetch(`/api/certifications/${certId}/visit-photos`, {
        method: "POST",
        credentials: "include",
        body: fd,
      }).then(r => { if (!r.ok) throw new Error(); return r.json(); });
    },
    onSuccess: () => {
      invalidate();
      setPhotoForm({ categoria: "otro", descripcion: "" });
      if (fileRef.current) fileRef.current.value = "";
      ok("Foto subida correctamente");
    },
    onError: () => err("Error al subir la foto"),
  });

  // ── Measure form state ──
  const [mForm, setMForm] = useState({ tipo: "", descripcion: "", elementoAfectado: "", costeEstimadoEur: "", ahorroEnergiaPct: "", mejoraCalificacionEsperada: "" });
  const addMeasure = useMutation({
    mutationFn: () => apiRequest("POST", `/api/certifications/${certId}/measures`, {
      tipo: mForm.tipo, descripcion: mForm.descripcion,
      elementoAfectado: mForm.elementoAfectado || null,
      costeEstimadoEur: mForm.costeEstimadoEur || null,
      ahorroEnergiaPct: mForm.ahorroEnergiaPct || null,
      mejoraCalificacionEsperada: mForm.mejoraCalificacionEsperada || null,
    }),
    onSuccess: () => {
      invalidate();
      setMForm({ tipo: "", descripcion: "", elementoAfectado: "", costeEstimadoEur: "", ahorroEnergiaPct: "", mejoraCalificacionEsperada: "" });
      ok("Medida añadida");
    },
    onError: () => err("Error al añadir medida"),
  });

  // ── CE3X export ──────────────────────────────────────────────────────────
  async function handleExport(format: "pdf" | "excel") {
    setExporting(true);
    setExportOpen(false);
    try {
      const exportData = await fetch(`/api/certifications/${certId}/export-data`, { credentials: "include" })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); });
      if (format === "pdf") exportCE3XPdf(exportData);
      else exportCE3XExcel(exportData);
    } catch {
      err("Error al generar el archivo. Inténtalo de nuevo.");
    } finally {
      setExporting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700" />
      </div>
    );
  }

  const cert        = data?.cert ?? {};
  const envelope    = data?.envelope ?? [];
  const openingList = data?.openings ?? [];
  const installList = data?.installations ?? [];
  const measures    = data?.measures ?? [];
  const photos      = data?.photos ?? [];

  const completedSections = [
    envelope.length > 0,
    openingList.length > 0,
    installList.length > 0,
    photos.length > 0,
    measures.length > 0,
  ].filter(Boolean).length;

  const fachadasDisp = envelope.filter(e => e.tipo === "fachada");

  return (
    <div className="min-h-screen bg-emerald-50 pb-28">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/certificados">
            <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-800 text-sm truncate">{cert.ownerName || "Ficha de visita"}</h1>
            <p className="text-xs text-slate-500 truncate">{cert.address || cert.propertyAddress || `Certificación #${certId}`}</p>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 text-xs shrink-0">
            {completedSections}/5 secciones
          </Badge>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 flex flex-col gap-4">

        {/* ══ SECCIÓN 1: Envolvente ══ */}
        <Section title="Envolvente Térmica" icon={<Home className="w-5 h-5" />} count={envelope.length} open={open.envelope} onToggle={() => toggle("envelope")}>
          {/* Lista */}
          {envelope.length > 0 && (
            <div className="flex flex-col gap-2">
              {envelope.map(el => (
                <ItemRow key={el.id} onDelete={() => delEnvelope.mutate(el.id)}>
                  <span className="font-medium text-slate-700">{el.nombre}</span>
                  <span className="text-slate-400 ml-2 text-xs capitalize">{el.tipo}</span>
                  {el.orientacion && <span className="text-slate-400 ml-2 text-xs">{el.orientacion}</span>}
                  {el.superficieM2 && <span className="text-slate-400 ml-2 text-xs">{el.superficieM2} m²</span>}
                  {el.transmitanciaU && <span className="text-slate-400 ml-2 text-xs">U={el.transmitanciaU}</span>}
                </ItemRow>
              ))}
            </div>
          )}

          {/* Form */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Nuevo elemento</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <Select options={TIPOS_ENVOLVENTE} value={envForm.tipo} onChange={e => setEnvForm(p => ({ ...p, tipo: e.target.value }))} />
              </Field>
              <Field label="Nombre">
                <input className={inputCls} placeholder="ej: Fachada norte" value={envForm.nombre} onChange={e => setEnvForm(p => ({ ...p, nombre: e.target.value }))} />
              </Field>
              <Field label="Orientación">
                <Select options={ORIENTACIONES} value={envForm.orientacion} onChange={e => setEnvForm(p => ({ ...p, orientacion: e.target.value }))} />
              </Field>
              <Field label="Superficie m²">
                <input type="number" className={inputCls} placeholder="0" value={envForm.superficieM2} onChange={e => setEnvForm(p => ({ ...p, superficieM2: e.target.value }))} />
              </Field>
              <Field label="Transmitancia U" hint="opcional">
                <input type="number" step="0.01" className={inputCls} placeholder="W/m²K" value={envForm.transmitanciaU} onChange={e => setEnvForm(p => ({ ...p, transmitanciaU: e.target.value }))} />
              </Field>
              <Field label="Método">
                <Select options={METODOS} value={envForm.metodo} onChange={e => setEnvForm(p => ({ ...p, metodo: e.target.value }))} />
              </Field>
            </div>
            <Field label="Descripción">
              <textarea rows={2} className={textareaCls} placeholder="Notas opcionales..." value={envForm.descripcion} onChange={e => setEnvForm(p => ({ ...p, descripcion: e.target.value }))} />
            </Field>
            <Button
              onClick={() => addEnvelope.mutate()}
              disabled={!envForm.tipo || !envForm.nombre || addEnvelope.isPending}
              className="bg-emerald-700 hover:bg-emerald-600 text-white self-end gap-1.5"
              size="sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir elemento
            </Button>
          </div>
        </Section>

        {/* ══ SECCIÓN 2: Huecos ══ */}
        <Section title="Huecos (Ventanas y Puertas)" icon={<Square className="w-5 h-5" />} count={openingList.length} open={open.openings} onToggle={() => toggle("openings")}>
          {openingList.length > 0 && (
            <div className="flex flex-col gap-2">
              {openingList.map(op => (
                <ItemRow key={op.id} onDelete={() => delOpening.mutate(op.id)}>
                  <span className="font-medium text-slate-700 capitalize">{op.tipo}</span>
                  {op.orientacion && <span className="text-slate-400 ml-2 text-xs">{op.orientacion}</span>}
                  {op.superficieM2 && <span className="text-slate-400 ml-2 text-xs">{op.superficieM2} m²</span>}
                </ItemRow>
              ))}
            </div>
          )}

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Nuevo hueco</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <Select options={TIPOS_HUECO} value={opForm.tipo} onChange={e => setOpForm(p => ({ ...p, tipo: e.target.value }))} />
              </Field>
              <Field label="Fachada asociada">
                <select className={selectCls} value={opForm.envelopeElementId} onChange={e => setOpForm(p => ({ ...p, envelopeElementId: e.target.value }))}>
                  <option value="">— Sin asignar —</option>
                  {fachadasDisp.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                </select>
              </Field>
              <Field label="Orientación">
                <Select options={ORIENTACIONES} value={opForm.orientacion} onChange={e => setOpForm(p => ({ ...p, orientacion: e.target.value }))} />
              </Field>
              <Field label="Superficie m²">
                <input type="number" className={inputCls} placeholder="0" value={opForm.superficieM2} onChange={e => setOpForm(p => ({ ...p, superficieM2: e.target.value }))} />
              </Field>
              <Field label="Método">
                <Select options={METODOS} value={opForm.metodo} onChange={e => setOpForm(p => ({ ...p, metodo: e.target.value }))} />
              </Field>
            </div>
            <Field label="Descripción">
              <textarea rows={2} className={textareaCls} placeholder="Notas opcionales..." value={opForm.descripcion} onChange={e => setOpForm(p => ({ ...p, descripcion: e.target.value }))} />
            </Field>
            <Button
              onClick={() => addOpening.mutate()}
              disabled={!opForm.tipo || addOpening.isPending}
              className="bg-emerald-700 hover:bg-emerald-600 text-white self-end gap-1.5"
              size="sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir hueco
            </Button>
          </div>
        </Section>

        {/* ══ SECCIÓN 3: Instalaciones ══ */}
        <Section title="Instalaciones" icon={<Wrench className="w-5 h-5" />} count={installList.length} open={open.installations} onToggle={() => toggle("installations")}>
          {installList.length > 0 && (
            <div className="flex flex-col gap-2">
              {installList.map(inst => (
                <ItemRow key={inst.id} onDelete={() => delInstallation.mutate(inst.id)}>
                  <span className="font-medium text-slate-700 capitalize">{inst.sistema}</span>
                  <span className="text-slate-400 ml-2 text-xs">{inst.tipo}</span>
                  {inst.vectorEnergetico && <span className="text-slate-400 ml-2 text-xs">{inst.vectorEnergetico}</span>}
                  {inst.anyoInstalacion && <span className="text-slate-400 ml-2 text-xs">{inst.anyoInstalacion}</span>}
                </ItemRow>
              ))}
            </div>
          )}

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Nueva instalación</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sistema">
                <Select
                  options={SISTEMAS_INSTALACION}
                  value={instForm.sistema}
                  onChange={e => setInstForm(p => ({ ...p, sistema: e.target.value, tipo: "" }))}
                />
              </Field>
              <Field label="Tipo de equipo">
                <select
                  className={selectCls}
                  value={instForm.tipo}
                  onChange={e => setInstForm(p => ({ ...p, tipo: e.target.value }))}
                  disabled={!instForm.sistema}
                >
                  <option value="">— Selecciona —</option>
                  {(TIPOS_EQUIPO[
                    SISTEMAS_INSTALACION.find(s =>
                      s.toLowerCase().replace(/[áéíóú]/g, c => ({ á:"a",é:"e",í:"i",ó:"o",ú:"u" }[c]||c)) === instForm.sistema
                    ) ?? ""
                  ] ?? []).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Vector energético">
                <Select options={VECTORES_ENERGETICOS} value={instForm.vectorEnergetico} onChange={e => setInstForm(p => ({ ...p, vectorEnergetico: e.target.value }))} />
              </Field>
              <Field label="Rendimiento %">
                <input type="number" className={inputCls} placeholder="%" value={instForm.rendimiento} onChange={e => setInstForm(p => ({ ...p, rendimiento: e.target.value }))} />
              </Field>
              <Field label="Potencia kW">
                <input type="number" className={inputCls} placeholder="kW" value={instForm.potenciaKw} onChange={e => setInstForm(p => ({ ...p, potenciaKw: e.target.value }))} />
              </Field>
              <Field label="Año instalación">
                <input type="number" className={inputCls} placeholder="ej: 2015" value={instForm.anyoInstalacion} onChange={e => setInstForm(p => ({ ...p, anyoInstalacion: e.target.value }))} />
              </Field>
            </div>
            <Field label="Notas">
              <textarea rows={2} className={textareaCls} placeholder="Observaciones..." value={instForm.notas} onChange={e => setInstForm(p => ({ ...p, notas: e.target.value }))} />
            </Field>
            <Button
              onClick={() => addInstallation.mutate()}
              disabled={!instForm.sistema || !instForm.tipo || addInstallation.isPending}
              className="bg-emerald-700 hover:bg-emerald-600 text-white self-end gap-1.5"
              size="sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir instalación
            </Button>
          </div>
        </Section>

        {/* ══ SECCIÓN 4: Fotos ══ */}
        <Section title="Fotos de la Visita" icon={<Camera className="w-5 h-5" />} count={photos.length} open={open.photos} onToggle={() => toggle("photos")}>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map(ph => (
                <div key={ph.id} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-square">
                  <img src={ph.url} alt={ph.descripcion || ph.categoria} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex flex-col justify-between p-1.5">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => delPhoto.mutate(ph.id)}
                        className="bg-red-500 text-white rounded-full p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {ph.categoria && (
                      <span className="self-start bg-black/60 text-white text-[10px] rounded px-1.5 py-0.5 capitalize opacity-0 group-hover:opacity-100 transition-opacity">
                        {ph.categoria}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" />Subir foto</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoría">
                <Select options={CATEGORIAS_FOTO} value={photoForm.categoria} onChange={e => setPhotoForm(p => ({ ...p, categoria: e.target.value }))} />
              </Field>
              <Field label="Descripción">
                <input className={inputCls} placeholder="Opcional" value={photoForm.descripcion} onChange={e => setPhotoForm(p => ({ ...p, descripcion: e.target.value }))} />
              </Field>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) uploadPhoto.mutate(file);
              }}
            />
            {uploadPhoto.isPending && <p className="text-xs text-emerald-600 animate-pulse">Subiendo foto...</p>}
          </div>
        </Section>

        {/* ══ SECCIÓN 5: Medidas de mejora ══ */}
        <Section title="Medidas de Mejora" icon={<Lightbulb className="w-5 h-5" />} count={measures.length} open={open.measures} onToggle={() => toggle("measures")}>
          {measures.length > 0 && (
            <div className="flex flex-col gap-2">
              {measures.map(m => (
                <ItemRow key={m.id} onDelete={() => delMeasure.mutate(m.id)}>
                  <span className="font-medium text-slate-700">{m.descripcion}</span>
                  <span className="text-slate-400 ml-2 text-xs capitalize">{m.tipo}</span>
                  {m.costeEstimadoEur && <span className="text-slate-400 ml-2 text-xs">{m.costeEstimadoEur}€</span>}
                  {m.ahorroEnergiaPct && <span className="text-slate-400 ml-2 text-xs">-{m.ahorroEnergiaPct}%</span>}
                  {m.mejoraCalificacionEsperada && (
                    <span className="ml-2 bg-emerald-100 text-emerald-700 text-xs font-bold px-1.5 py-0.5 rounded">{m.mejoraCalificacionEsperada}</span>
                  )}
                </ItemRow>
              ))}
            </div>
          )}

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Nueva medida</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <Select options={TIPOS_MEDIDA} value={mForm.tipo} onChange={e => setMForm(p => ({ ...p, tipo: e.target.value }))} />
              </Field>
              <Field label="Elemento afectado">
                <input className={inputCls} placeholder="ej: Fachada norte" value={mForm.elementoAfectado} onChange={e => setMForm(p => ({ ...p, elementoAfectado: e.target.value }))} />
              </Field>
              <Field label="Coste estimado €">
                <input type="number" className={inputCls} placeholder="€" value={mForm.costeEstimadoEur} onChange={e => setMForm(p => ({ ...p, costeEstimadoEur: e.target.value }))} />
              </Field>
              <Field label="Ahorro energía %">
                <input type="number" className={inputCls} placeholder="%" value={mForm.ahorroEnergiaPct} onChange={e => setMForm(p => ({ ...p, ahorroEnergiaPct: e.target.value }))} />
              </Field>
              <Field label="Mejora calificación esperada">
                <Select options={CALIFICACIONES} value={mForm.mejoraCalificacionEsperada} onChange={e => setMForm(p => ({ ...p, mejoraCalificacionEsperada: e.target.value }))} />
              </Field>
            </div>
            <Field label="Descripción">
              <textarea rows={2} className={textareaCls} placeholder="ej: Sustitución ventanas por doble vidrio" value={mForm.descripcion} onChange={e => setMForm(p => ({ ...p, descripcion: e.target.value }))} />
            </Field>
            <Button
              onClick={() => addMeasure.mutate()}
              disabled={!mForm.tipo || !mForm.descripcion || addMeasure.isPending}
              className="bg-emerald-700 hover:bg-emerald-600 text-white self-end gap-1.5"
              size="sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir medida
            </Button>
          </div>
        </Section>
      </main>

      {/* ── FAB: Exportar CE3X ── */}
      <div className="fixed bottom-6 right-4 flex flex-col items-end gap-2">
        {exportOpen && (
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden w-48">
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <FileText className="w-4 h-4 text-orange-600" />
              Exportar PDF
            </button>
            <div className="border-t border-slate-100" />
            <button
              onClick={() => handleExport("excel")}
              disabled={exporting}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <BarChart2 className="w-4 h-4 text-green-600" />
              Exportar Excel
            </button>
          </div>
        )}
        <Button
          onClick={() => setExportOpen(p => !p)}
          disabled={exporting}
          className="bg-orange-600 hover:bg-orange-500 text-white shadow-lg gap-2 rounded-full px-5"
        >
          <FileText className="w-4 h-4" />
          {exporting ? "Generando..." : "Exportar CE3X"}
        </Button>
      </div>
    </div>
  );
}
