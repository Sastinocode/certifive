/**
 * CertDataDrawer — Panel lateral que muestra todos los datos técnicos del
 * formulario CEE completado por el propietario.
 *
 * Usado desde Certifications.tsx para dar al certificador una vista completa
 * de los datos recogidos antes de la visita.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";

// ── Label helpers ─────────────────────────────────────────────────────────────
const MARCO_LABELS: Record<string, string> = {
  aluminio_sin_rpt: "Aluminio sin RPT",
  aluminio_con_rpt: "Aluminio con RPT",
  pvc:              "PVC",
  madera:           "Madera",
  mixto:            "Mixto (madera + aluminio)",
  no_se:            "No especificado",
};
const PERSIANA_LABELS: Record<string, string> = {
  lamas_plastico:  "Lamas de plástico (PVC)",
  lamas_metalico:  "Lamas metálicas",
  lamas_madera:    "Lamas de madera",
  enrollable_otro: "Otro tipo de cierre",
};
const CALEFACCION_LABELS: Record<string, string> = {
  caldera_gas_natural:   "Caldera de gas natural",
  caldera_gasoleo:       "Caldera de gasóleo",
  caldera_propano:       "Caldera de propano / butano",
  radiadores_electricos: "Radiadores eléctricos",
  suelo_radiante_agua:   "Suelo radiante (agua)",
  suelo_radiante_elec:   "Suelo radiante (eléctrico)",
  bomba_calor:           "Bomba de calor / aerotermia",
  chimenea_biomasa:      "Chimenea o estufa de leña / pellets",
  fancoil:               "Fan-coil (agua caliente-fría)",
};
const ACS_LABELS: Record<string, string> = {
  termo_electrico:       "Termo eléctrico",
  calentador_gas_nat:    "Calentador de gas natural",
  calentador_butano:     "Calentador de butano / propano",
  caldera_mixta_gas:     "Caldera mixta de gas natural",
  caldera_mixta_gasoleo: "Caldera mixta de gasóleo",
  bomba_calor_acs:       "Bomba de calor para ACS (aerotermia)",
  solar_termica:         "Solar térmica (placas solares)",
};

const ZONA_COLOR: Record<string, string> = {
  A: "bg-red-100 text-red-700",
  B: "bg-orange-100 text-orange-700",
  C: "bg-emerald-100 text-emerald-700",
  D: "bg-blue-100 text-blue-700",
  E: "bg-indigo-100 text-indigo-700",
};

function lbl(map: Record<string, string>, v: string | undefined | null): string {
  if (!v) return "";
  return map[v] ?? v;
}

function Row({ label, value, dim }: { label: string; value?: string | number | null; dim?: boolean }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between items-start gap-4 py-1.5">
      <span className="text-xs text-stone-400 font-medium flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm font-semibold text-right max-w-[60%] ${dim ? "text-stone-400 font-normal italic" : "text-stone-800"}`}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-stone-50 border-b border-stone-100">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500">{title}</p>
      </div>
      <div className="px-5 py-3 divide-y divide-stone-50 space-y-0">{children}</div>
    </div>
  );
}

function Missing() {
  return <span className="text-stone-300 font-normal">— a verificar en visita</span>;
}

// ── ACS demand estimator (CTE DB-HE4) ────────────────────────────────────────
function estimarDemandaACS(numOcupantes: number): string {
  // CTE DB-HE Tabla 4.1: 28 l/día por persona a 60ºC (vivienda unifamiliar)
  const litrosDia = numOcupantes * 28;
  return `≈ ${litrosDia} l/día (CTE DB-HE4 a 60°C)`;
}

// ── Recogida de datos ─────────────────────────────────────────────────────────

interface CheckItem { label: string; ok: boolean; key: string }

function buildChecklist(cert: any): CheckItem[] {
  const cee = (cert?.formData as any)?.ceeDetallado ?? {};
  const constructivas = cee.constructivas ?? {};
  const calefaccion   = cee.calefaccion   ?? {};

  return [
    { key: "nombre",      label: "Nombre del propietario",          ok: !!cert.ownerName },
    { key: "email",       label: "Email de contacto",               ok: !!cert.ownerEmail },
    { key: "direccion",   label: "Dirección del inmueble",          ok: !!cert.address },
    { key: "catastro",    label: "Referencia catastral",            ok: !!cert.cadastralReference },
    { key: "tipo",        label: "Tipo de inmueble",                ok: !!cert.propertyType },
    { key: "provincia",   label: "Datos catastro (provincia, zona)", ok: !!cert.provinciaCatastro && !!cert.zonaClimatica },
    { key: "superficie",  label: "Superficie total (m²)",           ok: !!cert.superficieTotalCatastro },
    { key: "posicion",    label: "Posición en el edificio",         ok: cert.esUltimaPlanta != null && cert.tieneLocalDebajo != null },
    { key: "calefaccion", label: "Sistema de calefacción",          ok: !!cert.calefaccionTipoInstalacion },
    { key: "acs",         label: "Agua caliente sanitaria (ACS)",   ok: !!cert.acsTipoInstalacion },
    { key: "ocupantes",   label: "Nº de ocupantes",                 ok: cert.numOcupantes != null },
    { key: "ventanas",    label: "Tipo de ventanas / marcos",       ok: !!constructivas.tipoVentanas || !!constructivas.tipoMarcos },
    { key: "anio_cale",   label: "Año instalación calefacción",     ok: !!calefaccion.anioCalefaccion },
    { key: "anio_acs",    label: "Sistema ACS identificado",        ok: !!cert.acsSistema },
    { key: "cee_form",    label: "Formulario CEE completado",       ok: cert.ceeFormStatus === "completado" || cert.ceeFormStatus === "revisado" },
  ];
}

function RecogidaDatos({
  cert,
  certId,
  onEditRecogida,
  onVerFormulario,
}: {
  cert: any;
  certId: number;
  onEditRecogida?: () => void;
  onVerFormulario?: (url: string) => void;
}) {
  const [copied, setCopied]           = useState(false);
  const [revisando, setRevisando]     = useState(false);

  const checklist = buildChecklist(cert);
  const completados = checklist.filter(i => i.ok).length;
  const porcentaje  = Math.round((completados / checklist.length) * 100);

  const pendientes = checklist.filter(i => !i.ok);
  const recibidos  = checklist.filter(i => i.ok);

  const getStatusMeta = () => {
    if (cert.ceeFormStatus === "revisado")
      return { label: "Revisado", pill: "bg-indigo-100 text-indigo-700", bar: "bg-indigo-400" };
    if (porcentaje === 100)
      return { label: "Completado", pill: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" };
    if (porcentaje >= 50)
      return { label: "En progreso", pill: "bg-amber-100 text-amber-700", bar: "bg-amber-400" };
    return { label: "Pendiente", pill: "bg-stone-100 text-stone-500", bar: "bg-stone-300" };
  };
  const sm = getStatusMeta();

  const ceeUrl = cert.ceeToken
    ? `${window.location.origin}/formulario-cee/${cert.ceeToken}`
    : null;

  const handleCopy = async () => {
    if (!ceeUrl) return;
    try { await navigator.clipboard.writeText(ceeUrl); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleMarcarRevisado = async () => {
    if (revisando) return;
    setRevisando(true);
    try {
      await apiRequest("PUT", `/api/certifications/${certId}`, { ceeFormStatus: "revisado" });
      queryClient.invalidateQueries({ queryKey: [`/api/certifications/${certId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
    } catch { /* ignore */ } finally {
      setRevisando(false);
    }
  };

  const yaRevisado = cert.ceeFormStatus === "revisado";

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500">📥 Recogida de datos</p>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${sm.pill}`}>{sm.label}</span>
      </div>

      <div className="px-5 py-4 space-y-4">

        {/* Barra de progreso */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-stone-500 font-medium">Datos completados</span>
            <span className="text-sm font-bold text-stone-800">{porcentaje}%</span>
          </div>
          <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${sm.bar}`}
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <p className="text-[10px] text-stone-400 mt-1">
            {completados} de {checklist.length} campos · {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Datos recibidos */}
        {recibidos.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1.5">
              ✅ Datos recibidos ({recibidos.length})
            </p>
            <div className="grid grid-cols-1 gap-0.5">
              {recibidos.map(item => (
                <div key={item.key} className="flex items-center gap-2 py-0.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-emerald-600">✓</span>
                  </span>
                  <span className="text-xs text-stone-600">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Datos pendientes */}
        {pendientes.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1.5">
              ⏳ Pendiente de recibir ({pendientes.length})
            </p>
            <div className="grid grid-cols-1 gap-0.5">
              {pendientes.map(item => (
                <div key={item.key} className="flex items-center gap-2 py-0.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] text-stone-400">○</span>
                  </span>
                  <span className="text-xs text-stone-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-50">
          {/* Editar recogida */}
          <button
            onClick={onEditRecogida}
            disabled={!onEditRecogida}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-stone-50 border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            Editar recogida
          </button>

          {/* Ver formulario */}
          {ceeUrl ? (
            <button
              onClick={() => onVerFormulario ? onVerFormulario(ceeUrl) : window.open(ceeUrl, "_blank")}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-teal-50 border border-teal-100 text-teal-700 rounded-xl text-xs font-semibold hover:bg-teal-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">visibility</span>
              Ver formulario
            </button>
          ) : (
            <button
              disabled
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-stone-50 border border-stone-100 text-stone-300 rounded-xl text-xs font-semibold cursor-not-allowed"
              title="No hay formulario CEE generado aún"
            >
              <span className="material-symbols-outlined text-[14px]">visibility_off</span>
              Sin formulario
            </button>
          )}

          {/* Copiar enlace */}
          <button
            onClick={handleCopy}
            disabled={!ceeUrl}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 border rounded-xl text-xs font-semibold transition-all ${
              copied
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : ceeUrl
                ? "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100"
                : "bg-stone-50 border-stone-100 text-stone-300 cursor-not-allowed"
            }`}
            title={ceeUrl ? "Copiar enlace del formulario CEE" : "No hay enlace disponible aún"}
          >
            <span className="material-symbols-outlined text-[14px]">
              {copied ? "check_circle" : "content_copy"}
            </span>
            {copied ? "¡Copiado!" : "Copiar enlace"}
          </button>

          {/* Marcar como revisado */}
          <button
            onClick={handleMarcarRevisado}
            disabled={yaRevisado || revisando}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 border rounded-xl text-xs font-semibold transition-colors ${
              yaRevisado
                ? "bg-indigo-50 border-indigo-100 text-indigo-600 cursor-default"
                : "bg-white border-stone-200 text-stone-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700"
            } disabled:opacity-60`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {yaRevisado ? "verified" : revisando ? "hourglass_empty" : "task_alt"}
            </span>
            {yaRevisado ? "Revisado ✓" : revisando ? "Guardando…" : "Marcar revisado"}
          </button>
        </div>

        {/* Info si no hay token CEE */}
        {!ceeUrl && (
          <p className="text-[10px] text-stone-400 text-center italic">
            Genera el formulario CEE desde el menú del expediente para activar el enlace de recogida.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface Props {
  certId: number;
  onClose: () => void;
  onEditRecogida?: () => void;
  onVerFormulario?: (url: string) => void;
}

export default function CertDataDrawer({ certId, onClose, onEditRecogida, onVerFormulario }: Props) {
  const { data: cert, isLoading } = useQuery<any>({
    queryKey: [`/api/certifications/${certId}`],
    enabled: !!certId,
  });

  // ceeDetallado lives inside cert.formData.ceeDetallado
  const cee = (cert?.formData as any)?.ceeDetallado ?? {};
  const constructivas = cee.constructivas ?? {};
  const calefaccion   = cee.calefaccion ?? {};
  const acs           = cee.acs ?? {};
  const refrigeracion = cee.refrigeracion ?? {};
  const iluminacion   = cee.iluminacion ?? {};

  // New structured fields come directly on cert (saved to certifications columns)
  const reformas: Array<{ tipo: string; periodo: string }> = cert?.reformas ?? [];
  const ventanasDetalladas: any[] = cert?.ventanasDetalladas ?? [];

  const REFORMA_LABEL: Record<string, string> = {
    fachada: "🧱 Fachada",
    cubierta: "🏠 Tejado / cubierta",
    ventanas: "🪟 Ventanas / puertas",
    calefaccion: "🔥 Calefacción",
    acs: "🚿 Agua caliente",
    aire: "❄️ Aire acondicionado",
    electrica: "⚡ Inst. eléctrica / solar",
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-gradient-to-br from-emerald-50 to-stone-100 shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-white border-b border-stone-100 px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-stone-100 flex items-center justify-center transition-colors text-stone-500 flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-stone-900 truncate">
              Datos técnicos — {cert?.ownerName ?? "Cargando…"}
            </h2>
            <p className="text-xs text-stone-400 truncate">{cert?.address ?? ""}</p>
          </div>
          {cert?.ceeFormStatus === "revisado" && (
            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full flex-shrink-0">
              ✓ Revisado
            </span>
          )}
          {cert?.ceeFormStatus === "completado" && (
            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full flex-shrink-0">
              CEE completado
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && cert && (
            <>
              {/* ── Recogida de datos ──────────────────────────────────────── */}
              <RecogidaDatos
                cert={cert}
                certId={certId}
                onEditRecogida={onEditRecogida}
                onVerFormulario={onVerFormulario}
              />

              {/* ── Datos Catastro ─────────────────────────────────────────── */}
              {(cert.provinciaCatastro || cert.zonaClimatica || cert.superficieTotalCatastro) && (
                <Section title="📍 Datos del Catastro">
                  <Row label="Provincia" value={cert.provinciaCatastro} />
                  <Row label="Com. Autónoma" value={cert.comunidadAutonomaCatastro} />
                  <Row label="Superficie catastral" value={cert.superficieTotalCatastro ? `${cert.superficieTotalCatastro} m²` : null} />
                  {cert.zonaClimatica && (
                    <div className="flex justify-between items-center gap-4 py-1.5">
                      <span className="text-xs text-stone-400 font-medium">Zona climática CTE</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ZONA_COLOR[cert.zonaClimatica[0]] ?? "bg-stone-100 text-stone-600"}`}>
                        Zona {cert.zonaClimatica}
                      </span>
                    </div>
                  )}
                  {cert.datosCatastroActualizados && (
                    <Row label="Última consulta" value={new Date(cert.datosCatastroActualizados).toLocaleDateString("es-ES")} />
                  )}
                </Section>
              )}

              {/* ── Posición en el edificio ────────────────────────────────── */}
              {(cert.esUltimaPlanta != null || cert.tieneLocalDebajo != null) && (
                <Section title="🏗️ Posición en el edificio">
                  <div className="flex justify-between items-center gap-4 py-1.5">
                    <span className="text-xs text-stone-400 font-medium">Cubierta encima</span>
                    {cert.esUltimaPlanta == null
                      ? <Missing />
                      : <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cert.esUltimaPlanta ? "bg-orange-100 text-orange-700" : "bg-stone-100 text-stone-600"}`}>
                          {cert.esUltimaPlanta ? "Sí — afecta (última planta)" : "No — hay piso encima"}
                        </span>
                    }
                  </div>
                  <div className="flex justify-between items-center gap-4 py-1.5">
                    <span className="text-xs text-stone-400 font-medium">Suelo en contacto</span>
                    {cert.tieneLocalDebajo == null
                      ? <Missing />
                      : <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cert.tieneLocalDebajo ? "bg-orange-100 text-orange-700" : "bg-stone-100 text-stone-600"}`}>
                          {cert.tieneLocalDebajo ? "Sí — local/garaje/sótano debajo" : "No — hay piso debajo"}
                        </span>
                    }
                  </div>
                </Section>
              )}

              {/* ── Envolvente — Ventanas ──────────────────────────────────── */}
              <Section title="🪟 Envolvente — Ventanas y huecos">
                <Row label="Tipo de acristalamiento" value={constructivas.tipoVentanas || null} />
                <Row label="Marco"
                  value={lbl(MARCO_LABELS, constructivas.tipoMarcos) || undefined}
                />
                <Row label="Ancho ventana típica" value={cert?.formData?.anchoVentana ? `${cert.formData.anchoVentana} m` : null} />
                <Row label="Alto ventana típica"  value={cert?.formData?.altoVentana ? `${cert.formData.altoVentana} m` : null} />
                <Row label="Superficie ventana típica"
                  value={
                    cert?.formData?.anchoVentana && cert?.formData?.altoVentana
                      ? `${(parseFloat(cert.formData.anchoVentana) * parseFloat(cert.formData.altoVentana)).toFixed(2)} m²`
                      : null
                  }
                />
                <Row label="Persiana"
                  value={
                    constructivas.tienePersiana === "Sí"
                      ? lbl(PERSIANA_LABELS, constructivas.tipoPersiana) || "Sí"
                      : constructivas.tienePersiana === "No" ? "Sin persiana" : null
                  }
                />
                <Row label="% Superficie acristalada" value={constructivas.superficieAcristalada || null} />

                {/* Ventanas detalladas (si existen) */}
                {ventanasDetalladas.length > 0 && (
                  <div className="pt-3">
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Detalle por hueco</p>
                    <div className="overflow-x-auto rounded-xl border border-stone-100">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-stone-50 text-stone-400 font-semibold uppercase tracking-wider">
                          <tr>
                            <th className="px-3 py-2">Orientación</th>
                            <th className="px-3 py-2">Dimensiones</th>
                            <th className="px-3 py-2">m²</th>
                            <th className="px-3 py-2">Marco</th>
                            <th className="px-3 py-2">Vidrio</th>
                            <th className="px-3 py-2">Persiana</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                          {ventanasDetalladas.map((v: any, i: number) => (
                            <tr key={i} className="hover:bg-stone-50/50">
                              <td className="px-3 py-2 font-medium text-stone-700">{v.orientacion ?? <span className="text-stone-300">—</span>}</td>
                              <td className="px-3 py-2 text-stone-600">
                                {v.anchoM && v.altoM ? `${v.anchoM} × ${v.altoM} m` : <span className="text-stone-300">— a verificar</span>}
                              </td>
                              <td className="px-3 py-2 font-semibold text-stone-700">{v.superficieM2 ?? <span className="text-stone-300">—</span>}</td>
                              <td className="px-3 py-2 text-stone-600">{lbl(MARCO_LABELS, v.marcoTipo) || <span className="text-stone-300">—</span>}</td>
                              <td className="px-3 py-2 text-stone-600">{v.vidrio ?? <span className="text-stone-300">—</span>}</td>
                              <td className="px-3 py-2 text-stone-600">{v.persiana ? (lbl(PERSIANA_LABELS, v.persianaLamas) || "Sí") : "No"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <Row label="Cerramiento exterior" value={constructivas.cerramientoExterior || null} />
              </Section>

              {/* ── Reformas ───────────────────────────────────────────────── */}
              <Section title="🔨 Reformas recientes">
                {!cert.tieneReformas && reformas.length === 0 ? (
                  <p className="text-sm text-stone-400 italic py-1">Sin reformas declaradas</p>
                ) : (
                  <div className="space-y-1 py-1">
                    {reformas.map((r, i) => (
                      <div key={i} className="flex justify-between items-center gap-3 py-1">
                        <span className="text-sm text-stone-700">{REFORMA_LABEL[r.tipo] ?? r.tipo}</span>
                        <span className="text-xs font-medium text-stone-400 flex-shrink-0">{r.periodo || "—"}</span>
                      </div>
                    ))}
                    {reformas.length === 0 && (
                      <p className="text-sm text-stone-400 italic">Indica que sí hubo reformas pero sin detalle</p>
                    )}
                  </div>
                )}
              </Section>

              {/* ── Instalaciones ──────────────────────────────────────────── */}
              <Section title="🔥 Calefacción">
                <div className="flex justify-between items-center gap-4 py-1.5">
                  <span className="text-xs text-stone-400 font-medium">Tipo de instalación</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    cert.calefaccionTipoInstalacion === "comunitaria"
                      ? "bg-blue-100 text-blue-700"
                      : cert.calefaccionTipoInstalacion === "no_tiene"
                      ? "bg-stone-100 text-stone-500"
                      : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {cert.calefaccionTipoInstalacion === "individual" ? "Individual"
                      : cert.calefaccionTipoInstalacion === "comunitaria" ? "Comunitaria"
                      : cert.calefaccionTipoInstalacion === "no_tiene" ? "Sin calefacción"
                      : "— sin determinar"}
                  </span>
                </div>
                {cert.calefaccionSistema && (
                  <Row label="Sistema" value={lbl(CALEFACCION_LABELS, cert.calefaccionSistema)} />
                )}
                {calefaccion.anioCalefaccion && (
                  <Row label="Año instalación" value={calefaccion.anioCalefaccion} />
                )}
                {calefaccion.potenciaCalefaccion && (
                  <Row label="Potencia" value={`${calefaccion.potenciaCalefaccion} kW`} />
                )}
              </Section>

              <Section title="🚿 Agua Caliente Sanitaria (ACS)">
                <div className="flex justify-between items-center gap-4 py-1.5">
                  <span className="text-xs text-stone-400 font-medium">Tipo de instalación</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    cert.acsTipoInstalacion === "comunitaria"
                      ? "bg-blue-100 text-blue-700"
                      : cert.acsTipoInstalacion === "no_tiene"
                      ? "bg-stone-100 text-stone-500"
                      : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {cert.acsTipoInstalacion === "individual" ? "Individual"
                      : cert.acsTipoInstalacion === "comunitaria" ? "Comunitaria"
                      : cert.acsTipoInstalacion === "no_tiene" ? "Sin ACS"
                      : "— sin determinar"}
                  </span>
                </div>
                {cert.acsSistema && <Row label="Equipo" value={lbl(ACS_LABELS, cert.acsSistema)} />}
                {acs.tieneSolares === "Sí" && <Row label="Paneles solares" value={acs.numPaneles ? `${acs.numPaneles} paneles` : "Sí"} />}
                {cert.numOcupantes != null && (
                  <>
                    <Row label="Nº ocupantes" value={`${cert.numOcupantes} persona${cert.numOcupantes > 1 ? "s" : ""}`} />
                    <div className="flex justify-between items-center gap-4 py-1.5">
                      <span className="text-xs text-stone-400 font-medium">Demanda ACS estimada</span>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        {estimarDemandaACS(cert.numOcupantes)}
                      </span>
                    </div>
                  </>
                )}
              </Section>

              <Section title="❄️ Refrigeración">
                <Row label="Aire acondicionado"
                  value={refrigeracion.tieneAireAcondicionado === "Sí"
                    ? (refrigeracion.tipoAire || "Sí")
                    : refrigeracion.tieneAireAcondicionado === "No"
                    ? "No"
                    : null}
                />
                {refrigeracion.anioAire && <Row label="Año instalación" value={refrigeracion.anioAire} />}
              </Section>

              <Section title="💡 Iluminación">
                <Row label="Tipo predominante" value={iluminacion.tipoIluminacion || null} />
                <Row label="Control automático" value={iluminacion.controlIluminacion || null} />
              </Section>

              {/* ── Sin datos ──────────────────────────────────────────────── */}
              {(cert.ceeFormStatus !== "completado" && cert.ceeFormStatus !== "revisado") && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 flex items-start gap-3">
                  <span className="text-xl">⏳</span>
                  <div>
                    <p className="font-semibold">Formulario CEE pendiente</p>
                    <p className="text-xs mt-0.5 text-amber-700/80">
                      El propietario aún no ha completado el formulario detallado. Los datos mostrados son los básicos de la solicitud.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
