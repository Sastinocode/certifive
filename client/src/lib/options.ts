// ── Shared option types ────────────────────────────────────────────────────────

export interface OptionSimple { value: string; label: string; sublabel?: string; }
export interface OptionEmoji  { value: string; emoji: string; label: string; sublabel?: string; }
export interface ReformaTipo  { tipo: string; emoji: string; label: string; }
export interface VentanaOpt   { value: string; emoji: string; sublabel?: string; }
export interface PropertyType { value: string; emoji: string; }

// ── Option constants ───────────────────────────────────────────────────────────

export const CERRAMIENTO_OPTS: string[] = [
  "Ladrillo", "Hormigón", "Piedra natural", "Madera", "Panel sándwich", "No sé",
];

export const VENTANAS_OPTS: VentanaOpt[] = [
  { value: "Simple acristalamiento",  emoji: "🪟", sublabel: "1 luna — más antiguo, peor aislamiento" },
  { value: "Doble acristalamiento",   emoji: "🪟", sublabel: "2 lunas — el más habitual" },
  { value: "Triple acristalamiento",  emoji: "🪟", sublabel: "3 lunas — alta eficiencia" },
  { value: "No sé",                   emoji: "🤷", sublabel: "El técnico lo confirmará en la visita" },
];

export const MARCOS_OPTS: OptionSimple[] = [
  { value: "aluminio_sin_rpt", label: "Aluminio sin RPT",          sublabel: "Sin rotura de puente térmico — el más antiguo" },
  { value: "aluminio_con_rpt", label: "Aluminio con RPT",          sublabel: "Con rotura de puente térmico — más eficiente" },
  { value: "pvc",              label: "PVC",                       sublabel: "Plástico — buena aislación térmica" },
  { value: "madera",           label: "Madera",                    sublabel: "Natural — buena aislación" },
  { value: "mixto",            label: "Mixto (madera + aluminio)" },
  { value: "no_se",            label: "No lo sé",                  sublabel: "El técnico lo verificará en la visita" },
];

export const PERSIANA_TIPOS: OptionSimple[] = [
  { value: "lamas_plastico",  label: "Lamas de plástico (PVC)" },
  { value: "lamas_metalico",  label: "Lamas metálicas" },
  { value: "lamas_madera",    label: "Lamas de madera" },
  { value: "enrollable_otro", label: "Otro tipo de cierre" },
];

export const CALEFACCION_SISTEMAS: OptionEmoji[] = [
  { value: "caldera_gas_natural",   emoji: "🔵", label: "Caldera de gas natural" },
  { value: "caldera_gasoleo",       emoji: "🛢️", label: "Caldera de gasóleo" },
  { value: "caldera_propano",       emoji: "🟠", label: "Caldera de propano / butano" },
  { value: "radiadores_electricos", emoji: "⚡", label: "Radiadores eléctricos" },
  { value: "suelo_radiante_agua",   emoji: "🌡️", label: "Suelo radiante (agua)" },
  { value: "suelo_radiante_elec",   emoji: "⚡", label: "Suelo radiante (eléctrico)" },
  { value: "bomba_calor",           emoji: "🔄", label: "Bomba de calor / aerotermia" },
  { value: "chimenea_biomasa",      emoji: "🪵", label: "Chimenea o estufa de leña / pellets" },
  { value: "fancoil",               emoji: "💨", label: "Fan-coil (agua caliente-fría)" },
];

export const ACS_SISTEMAS: OptionEmoji[] = [
  { value: "termo_electrico",       emoji: "⚡", label: "Termo eléctrico" },
  { value: "calentador_gas_nat",    emoji: "🔵", label: "Calentador de gas natural" },
  { value: "calentador_butano",     emoji: "🟠", label: "Calentador de butano / propano" },
  { value: "caldera_mixta_gas",     emoji: "🔥", label: "Caldera mixta de gas natural" },
  { value: "caldera_mixta_gasoleo", emoji: "🛢️", label: "Caldera mixta de gasóleo" },
  { value: "bomba_calor_acs",       emoji: "🌿", label: "Bomba de calor para ACS (aerotermia)" },
  { value: "solar_termica",         emoji: "☀️", label: "Solar térmica (placas solares)" },
];

export const AIRE_TIPOS: string[] = [
  "Split individual", "Multi-split", "Cassette", "Conductos centralizado", "VRV/VRF", "No sé",
];

export const ILUMINACION_TIPOS: string[] = [
  "LED (predominante)", "Fluorescente", "Halógena / Incandescente", "Mixta",
];

export const REFORMA_TIPOS: ReformaTipo[] = [
  { tipo: "fachada",     emoji: "🧱", label: "Fachada (aislamiento exterior, revestimiento…)" },
  { tipo: "cubierta",    emoji: "🏠", label: "Tejado o cubierta" },
  { tipo: "ventanas",    emoji: "🪟", label: "Ventanas o puertas exteriores" },
  { tipo: "calefaccion", emoji: "🔥", label: "Calefacción (caldera, suelo radiante, bomba de calor…)" },
  { tipo: "acs",         emoji: "🚿", label: "Agua caliente (termo, calentador…)" },
  { tipo: "aire",        emoji: "❄️", label: "Aire acondicionado" },
  { tipo: "electrica",   emoji: "⚡", label: "Instalación eléctrica o solar" },
];

export const REFORMA_PERIODOS: string[] = [
  "Antes de 2000", "2000–2010", "2011–2020", "2021 o más reciente",
];

export const PROPERTY_TYPES: PropertyType[] = [
  { value: "Vivienda unifamiliar",   emoji: "🏠" },
  { value: "Piso/Apartamento",       emoji: "🏢" },
  { value: "Adosado",                emoji: "🏘️" },
  { value: "Local comercial",        emoji: "🏪" },
  { value: "Oficinas",               emoji: "🖥️" },
  { value: "Nave industrial",        emoji: "🏭" },
  { value: "Edificio de viviendas",  emoji: "🏗️" },
];
