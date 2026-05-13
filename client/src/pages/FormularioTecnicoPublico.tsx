import { useState, useEffect, useCallback, useRef } from "react";

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

interface FormState {
  // Block 1 — Basic data
  cadastralReference: string;
  constructionYear: string;
  totalArea: string;
  floor: string;
  totalFloors: string;

  // Block 2 — Facades
  numFachadas: number;
  fachadas: FachadaData[];

  // Block 3 — Windows
  numVentanas: number;
  ventanas: VentanaData[];
  tienePersianas: string; // "si" | "no" | "omitir"
  fotoPersianasId: number | null;
  fotoPersianasNombre: string | null;

  // Block 4 — Roof
  esUltimaPlanta: string; // "si" | "no"
  fotoCubiertaId: number | null;
  fotoCubiertaNombre: string | null;
  aislamientoCubierta: string;

  // Block 5 — Heating & ACS
  tipoCalefaccion: string;
  fotoCalefaccionId: number | null;
  fotoCalefaccionNombre: string | null;
  tipoACS: string;
  tieneAire: string; // "si" | "no"
  fotoAireIntId: number | null;
  fotoAireIntNombre: string | null;
  fotoAireExtId: number | null;
  fotoAireExtNombre: string | null;
  tipoAire: string;

  // Block 6 — General photos & notes
  fotosGeneralesIds: number[];
  fotosGeneralesNombres: string[];
  notas: string;
}

const defaultFormState = (): FormState => ({
  cadastralReference: "",
  constructionYear: "",
  totalArea: "",
  floor: "",
  totalFloors: "",
  numFachadas: 0,
  fachadas: [],
  numVentanas: 0,
  ventanas: [],
  tienePersianas: "",
  fotoPersianasId: null,
  fotoPersianasNombre: null,
  esUltimaPlanta: "",
  fotoCubiertaId: null,
  fotoCubiertaNombre: null,
  aislamientoCubierta: "",
  tipoCalefaccion: "",
  fotoCalefaccionId: null,
  fotoCalefaccionNombre: null,
  tipoACS: "",
  tieneAire: "",
  fotoAireIntId: null,
  fotoAireIntNombre: null,
  fotoAireExtId: null,
  fotoAireExtNombre: null,
  tipoAire: "",
  fotosGeneralesIds: [],
  fotosGeneralesNombres: [],
  notas: "",
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN ID — string-based state machine keys
// ─────────────────────────────────────────────────────────────────────────────
type ScreenId = string; // e.g. "welcome", "b1_catastro", "b2_foto_0", etc.

function buildScreenList(data: FormState): ScreenId[] {
  const screens: ScreenId[] = [
    "welcome",
    "b1_catastro",
    "b1_year",
    "b1_area",
    "b1_floor",
    "b1_totalfloors",
    "b2_intro",
    "b2_num",
  ];

  const nf = Math.max(1, data.numFachadas || 1);
  for (let i = 0; i < nf; i++) {
    screens.push(`b2_foto_${i}`, `b2_material_${i}`, `b2_aislamiento_${i}`);
  }

  screens.push("b3_intro", "b3_num");
  const nv = Math.max(1, data.numVentanas || 1);
  for (let i = 0; i < nv; i++) {
    screens.push(`b3_foto_${i}`, `b3_vidrio_${i}`, `b3_marco_${i}`);
  }
  screens.push("b3_persianas");

  screens.push("b4_check");
  if (data.esUltimaPlanta === "si") {
    screens.push("b4_foto", "b4_aislamiento");
  }

  screens.push("b5_intro", "b5_calefaccion");
  if (data.tipoCalefaccion && data.tipoCalefaccion !== "sin_calefaccion") {
    screens.push("b5_foto_cal");
  }
  screens.push("b5_acs", "b5_aire");
  if (data.tieneAire === "si") {
    screens.push("b5_foto_aire_int", "b5_foto_aire_ext", "b5_aire_tipo");
  }

  screens.push("b6_fotos", "b6_notas", "confirmation");
  return screens;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_KEY = (token: string) => `certifive_tecnico_${token}`;
const AUTOSAVE_INTERVAL_MS = 30_000;

const BLOCK_LABELS: Record<string, string> = {
  welcome: "",
  b1: "Datos del inmueble",
  b2: "Fachadas y paredes",
  b3: "Ventanas",
  b4: "Cubierta",
  b5: "Calefacción y agua",
  b6: "Fotos y notas",
  confirmation: "Confirmación",
};

function getBlockKey(screenId: ScreenId): string {
  if (screenId === "welcome") return "welcome";
  if (screenId === "confirmation") return "confirmation";
  const prefix = screenId.split("_")[0];
  return prefix;
}

const CALEFACCION_OPTS = [
  { value: "caldera_gas",        emoji: "🔵", label: "Caldera de gas",              sub: "Tubería de gas en cocina o cuarto técnico" },
  { value: "bomba_calor",        emoji: "🔄", label: "Bomba de calor / aerotermia", sub: "Unidad exterior similar al aire acondicionado" },
  { value: "radiadores_elec",    emoji: "⚡", label: "Radiadores eléctricos",        sub: "Enchufados a la pared o en el techo" },
  { value: "caldera_gasoleo",    emoji: "🛢️", label: "Caldera de gasóleo",           sub: "Depósito de combustible" },
  { value: "biomasa",            emoji: "🪵", label: "Biomasa o pellets",            sub: "Caldera con silo de pellets o leña" },
  { value: "solo_aire",          emoji: "❄️", label: "Solo aire acondicionado",      sub: "Frío y calor con splits" },
  { value: "sin_calefaccion",    emoji: "🚫", label: "No tengo calefacción",         sub: "" },
];

const ACS_OPTS = [
  { value: "misma_caldera",      emoji: "🔥", label: "La misma caldera (calefacción + ACS)" },
  { value: "solar_termica",      emoji: "☀️", label: "Placas solares en la azotea" },
  { value: "calentador_gas",     emoji: "🔵", label: "Calentador de gas independiente" },
  { value: "termo_electrico",    emoji: "⚡", label: "Termo eléctrico" },
  { value: "bomba_calor_acs",    emoji: "🌿", label: "Bomba de calor para ACS" },
  { value: "no_se",              emoji: "❓", label: "No lo sé" },
];

const MATERIAL_OPTS = [
  { value: "ladrillo_visto",     emoji: "🧱", label: "Ladrillo visto",              sub: "Ladrillo rojo sin recubrimiento" },
  { value: "ladrillo_enfoscado", emoji: "🏠", label: "Ladrillo con revoco",         sub: "Cemento, pintura o mortero por encima" },
  { value: "piedra",             emoji: "🪨", label: "Piedra",                      sub: "Natural o artificial" },
  { value: "hormigon",           emoji: "🔲", label: "Hormigón",                    sub: "Prefabricado o in situ" },
  { value: "no_se",              emoji: "❓", label: "No lo sé",                    sub: "El técnico lo verificará" },
];

const VIDRIO_OPTS = [
  { value: "simple",    emoji: "🪟",    label: "Vidrio simple",        sub: "Una sola capa — se nota el frío con la mano cerca" },
  { value: "doble",     emoji: "🪟🪟", label: "Doble vidrio (climalit)", sub: "Dos capas con cámara de aire entre ellas" },
  { value: "no_se",     emoji: "❓",    label: "No lo sé",              sub: "El técnico lo comprobará" },
];

const MARCO_OPTS = [
  { value: "aluminio_sin_rpt", emoji: "🔧",   label: "Aluminio sin RPT",         sub: "Frío al tacto en invierno, el más antiguo" },
  { value: "aluminio_con_rpt", emoji: "🔧❄️", label: "Aluminio con RPT",         sub: "Pone 'RPT' en el catálogo o es reciente" },
  { value: "madera",           emoji: "🪵",   label: "Madera",                   sub: "" },
  { value: "pvc",              emoji: "⬜",   label: "PVC (plástico blanco)",    sub: "" },
  { value: "no_se",            emoji: "❓",   label: "No lo sé",                 sub: "" },
];

const FLOOR_OPTS = [
  "Bajo (planta baja)", "1º", "2º", "3º", "4º", "5º o superior", "Ático",
  "Es una casa unifamiliar (no tiene pisos encima)",
];

// ─────────────────────────────────────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function OptionButton({
  selected, onClick, emoji, label, sub,
}: {
  selected: boolean;
  onClick: () => void;
  emoji?: string;
  label: string;
  sub?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "14px 16px",
        marginBottom: 10,
        borderRadius: 12,
        border: selected ? "2px solid #0D7C66" : "2px solid #e2e8f0",
        background: selected ? "#f0faf7" : "#fff",
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 12,
        transition: "all 0.15s",
      }}
    >
      {emoji && (
        <span style={{ fontSize: 22, minWidth: 28, textAlign: "center" }}>{emoji}</span>
      )}
      <span>
        <span style={{ display: "block", fontWeight: 600, color: "#1a202c", fontSize: 15 }}>
          {label}
        </span>
        {sub && (
          <span style={{ display: "block", fontSize: 13, color: "#718096", marginTop: 2 }}>
            {sub}
          </span>
        )}
      </span>
      {selected && (
        <span style={{ marginLeft: "auto", color: "#0D7C66", fontSize: 20 }}>✓</span>
      )}
    </button>
  );
}

function PhotoUploadButton({
  label, uploaded, uploading, onChange, hint,
}: {
  label: string;
  uploaded: boolean;
  uploading: boolean;
  onChange: (file: File) => void;
  hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div style={{ marginBottom: 16 }}>
      {hint && (
        <p style={{ fontSize: 13, color: "#718096", marginBottom: 8, lineHeight: 1.5 }}>{hint}</p>
      )}
      <button
        onClick={() => ref.current?.click()}
        disabled={uploading}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: 12,
          border: uploaded ? "2px solid #0D7C66" : "2px dashed #cbd5e0",
          background: uploaded ? "#f0faf7" : "#f7fafc",
          cursor: uploading ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontSize: 15,
          color: uploaded ? "#0D7C66" : "#4a5568",
          fontWeight: 600,
        }}
      >
        {uploading ? (
          <>⏳ Subiendo foto...</>
        ) : uploaded ? (
          <>✅ {label} — foto subida</>
        ) : (
          <>📷 {label}</>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
          e.target.value = ""; // reset so same file can be re-selected
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface Props { token: string; }

export default function FormularioTecnicoPublico({ token }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [certId, setCertId] = useState<number | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [certifier, setCertifier] = useState<{ name: string; company: string | null } | null>(null);

  const [formData, setFormData] = useState<FormState>(defaultFormState());
  const [currentScreenIdx, setCurrentScreenIdx] = useState(0);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  // The list of screens is computed from formData dynamically
  const screens = buildScreenList(formData);
  const currentScreen = screens[currentScreenIdx] ?? "welcome";
  const totalScreens = screens.length;
  const progress = Math.round(((currentScreenIdx) / (totalScreens - 1)) * 100);

  // ── Load initial data ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/formulario-tecnico/${token}`);
        if (!res.ok) throw new Error("Enlace inválido o expirado");
        const data = await res.json();

        if (data.completed) {
          setSubmitted(true);
          setLoading(false);
          return;
        }

        setCertId(data.certId);
        setCertifier(data.certifier);
        setOwnerName(data.prefill?.ownerName ?? "");

        // Restore saved progress: server first, then localStorage
        const localKey = STORAGE_KEY(token);
        const localSaved = localStorage.getItem(localKey);
        if (data.savedData) {
          setFormData({ ...defaultFormState(), ...data.savedData });
        } else if (localSaved) {
          try {
            setFormData({ ...defaultFormState(), ...JSON.parse(localSaved) });
          } catch { /* ignore corrupt local storage */ }
        } else if (data.prefill) {
          setFormData((prev) => ({
            ...prev,
            cadastralReference: data.prefill.cadastralReference ?? "",
            constructionYear: data.prefill.constructionYear ? String(data.prefill.constructionYear) : "",
            totalArea: data.prefill.totalArea ? String(data.prefill.totalArea) : "",
          }));
        }

        // Mark as opened
        fetch(`/api/formulario-tecnico/${token}/open`, { method: "POST" }).catch(() => {});
        setLoading(false);
      } catch (err: any) {
        setError(err.message ?? "Error al cargar el formulario");
        setLoading(false);
      }
    }
    load();
  }, [token]);

  // ── Autosave to localStorage + server ────────────────────────────────────
  const saveProgress = useCallback(() => {
    localStorage.setItem(STORAGE_KEY(token), JSON.stringify(formData));
    fetch(`/api/formulario-tecnico/${token}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    }).catch(() => {});
  }, [token, formData]);

  // Autosave every 30s
  useEffect(() => {
    const id = setInterval(saveProgress, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [saveProgress]);

  // Autosave to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY(token), JSON.stringify(formData));
  }, [token, formData]);

  // ── Photo upload ──────────────────────────────────────────────────────────
  async function uploadPhoto(
    file: File,
    categoria: string,
    onSuccess: (id: number, nombre: string) => void
  ) {
    if (!certId) return;
    setUploadingKey(categoria);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("categoria", categoria);
      const res = await fetch(
        `/api/formulario-tecnico/${token}/upload/${certId}`,
        { method: "POST", body: fd }
      );
      if (!res.ok) throw new Error("Error al subir la foto");
      const data = await res.json();
      onSuccess(data.id, data.nombre);
    } catch {
      alert("No se pudo subir la foto. Por favor, inténtalo de nuevo.");
    } finally {
      setUploadingKey(null);
    }
  }

  // ── Update helpers ────────────────────────────────────────────────────────
  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function updateFachada(idx: number, partial: Partial<FachadaData>) {
    setFormData((prev) => {
      const fachadas = [...prev.fachadas];
      fachadas[idx] = { ...fachadas[idx], ...partial };
      return { ...prev, fachadas };
    });
  }

  function updateVentana(idx: number, partial: Partial<VentanaData>) {
    setFormData((prev) => {
      const ventanas = [...prev.ventanas];
      ventanas[idx] = { ...ventanas[idx], ...partial };
      return { ...prev, ventanas };
    });
  }

  // When numFachadas changes, sync the array length
  function setNumFachadas(n: number) {
    setFormData((prev) => {
      const fachadas = Array.from({ length: n }, (_, i) =>
        prev.fachadas[i] ?? { fotoId: null, fotoNombre: null, material: "", aislamiento: "" }
      );
      return { ...prev, numFachadas: n, fachadas };
    });
  }

  function setNumVentanas(n: number) {
    setFormData((prev) => {
      const ventanas = Array.from({ length: n }, (_, i) =>
        prev.ventanas[i] ?? { fotoId: null, fotoNombre: null, tipoVidrio: "", tipoMarco: "" }
      );
      return { ...prev, numVentanas: n, ventanas };
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  function goNext() {
    // Rebuild screen list with current data before advancing
    const updatedScreens = buildScreenList(formData);
    setCurrentScreenIdx((prev) => Math.min(prev + 1, updatedScreens.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setCurrentScreenIdx((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Final submit ──────────────────────────────────────────────────────────
  async function handleSubmit() {
    try {
      const res = await fetch(`/api/formulario-tecnico/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Error al enviar");
      localStorage.removeItem(STORAGE_KEY(token));
      setSubmitted(true);
    } catch {
      alert("No se pudo enviar el formulario. Por favor, inténtalo de nuevo.");
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER STATES
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} />
        <p style={{ color: "#0D7C66", marginTop: 16, fontWeight: 600 }}>Cargando formulario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centered}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
        <h2 style={{ color: "#e53e3e", marginBottom: 8 }}>Enlace no válido</h2>
        <p style={{ color: "#718096", maxWidth: 320, textAlign: "center" }}>{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={styles.centered}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🙌</div>
        <h2 style={{ color: "#0D7C66", marginBottom: 12 }}>¡Todo listo!</h2>
        <p style={{ color: "#4a5568", maxWidth: 360, textAlign: "center", lineHeight: 1.6 }}>
          Has completado la información que necesitamos.{" "}
          {certifier?.name ?? "Tu certificador"} revisará los datos y te contactará si
          necesita algo más.
        </p>
        <p style={{ color: "#718096", fontSize: 14, marginTop: 24 }}>Muchas gracias por tu tiempo.</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCREEN RENDERER
  // ─────────────────────────────────────────────────────────────────────────
  const blockKey = getBlockKey(currentScreen);
  const blockLabel = BLOCK_LABELS[blockKey] ?? BLOCK_LABELS[blockKey.slice(0, 2)] ?? "";

  function renderScreen() {
    // ── WELCOME ─────────────────────────────────────────────────────────────
    if (currentScreen === "welcome") {
      return (
        <div>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🏠</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1a202c", marginBottom: 12 }}>
              Hola{ownerName ? `, ${ownerName.split(" ")[0]}` : ""}
            </h2>
            <p style={{ color: "#4a5568", lineHeight: 1.7, fontSize: 15 }}>
              <strong>{certifier?.name ?? "Tu certificador"}</strong> necesita que
              recojas algunos datos de tu vivienda para realizar la certificación
              energética.
            </p>
          </div>
          <div style={styles.infoBox}>
            <p style={{ margin: 0, color: "#2d3748", lineHeight: 1.6, fontSize: 14 }}>
              ⏱️ <strong>Tiempo estimado: 20–30 minutos</strong>
              <br />
              No necesitas saber de construcción — te explicamos todo paso a paso.
              <br />
              Puedes salir y volver cuando quieras: tus datos se guardan automáticamente.
            </p>
          </div>
          <button style={styles.btnPrimary} onClick={goNext}>
            ¡Empezamos! →
          </button>
        </div>
      );
    }

    // ── BLOCK 1 — CATASTRAL REFERENCE ────────────────────────────────────────
    if (currentScreen === "b1_catastro") {
      return (
        <div>
          <h3 style={styles.question}>¿Cuál es la referencia catastral de tu vivienda?</h3>
          <div style={styles.helperBox}>
            <p style={{ margin: 0, fontSize: 14, color: "#4a5568", lineHeight: 1.6 }}>
              💡 La encontrarás en el <strong>recibo del IBI</strong>, en la{" "}
              <strong>escritura</strong> o buscando tu dirección en{" "}
              <a
                href="https://www.sedecatastro.gob.es"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#0D7C66" }}
              >
                sedecatastro.gob.es
              </a>
              <br />
              Ejemplo: <code>1234567AB1234A0001AB</code>
            </p>
          </div>
          <input
            style={styles.input}
            type="text"
            placeholder="Referencia catastral (opcional)"
            value={formData.cadastralReference}
            onChange={(e) => updateField("cadastralReference", e.target.value)}
          />
          <button
            style={{ ...styles.btnSecondary, marginTop: 8 }}
            onClick={goNext}
          >
            No la tengo / Continuar sin ella →
          </button>
        </div>
      );
    }

    // ── BLOCK 1 — YEAR ───────────────────────────────────────────────────────
    if (currentScreen === "b1_year") {
      const yearRanges = [
        "Antes de 1940",
        "1940–1960",
        "1961–1979",
        "1980–2007",
        "2008 o más reciente",
        "No lo sé",
      ];
      return (
        <div>
          <h3 style={styles.question}>¿Cuándo se construyó el edificio?</h3>
          <div style={styles.helperBox}>
            <p style={{ margin: 0, fontSize: 14, color: "#4a5568" }}>
              💡 Lo encontrarás en la <strong>escritura</strong> o preguntando a la
              comunidad de vecinos.
            </p>
          </div>
          {yearRanges.map((yr) => (
            <OptionButton
              key={yr}
              selected={formData.constructionYear === yr}
              onClick={() => updateField("constructionYear", yr)}
              label={yr}
            />
          ))}
        </div>
      );
    }

    // ── BLOCK 1 — AREA ───────────────────────────────────────────────────────
    if (currentScreen === "b1_area") {
      return (
        <div>
          <h3 style={styles.question}>¿Cuántos metros tiene tu vivienda?</h3>
          <div style={styles.helperBox}>
            <p style={{ margin: 0, fontSize: 14, color: "#4a5568", lineHeight: 1.6 }}>
              💡 Son los <strong>metros útiles</strong> (interior, sin paredes).
              Los encontrarás en la <strong>escritura</strong> o contrato de
              compraventa.
              <br />
              Si no estás seguro, haz una estimación aproximada.
            </p>
          </div>
          <input
            style={styles.input}
            type="number"
            placeholder="Metros cuadrados (ej: 85)"
            value={formData.totalArea}
            onChange={(e) => updateField("totalArea", e.target.value)}
          />
        </div>
      );
    }

    // ── BLOCK 1 — FLOOR ─────────────────────────────────────────────────────
    if (currentScreen === "b1_floor") {
      return (
        <div>
          <h3 style={styles.question}>¿En qué planta está tu vivienda?</h3>
          {FLOOR_OPTS.map((opt) => (
            <OptionButton
              key={opt}
              selected={formData.floor === opt}
              onClick={() => updateField("floor", opt)}
              label={opt}
            />
          ))}
        </div>
      );
    }

    // ── BLOCK 1 — TOTAL FLOORS ───────────────────────────────────────────────
    if (currentScreen === "b1_totalfloors") {
      const floorCounts = ["1", "2", "3", "4", "5", "6", "7 o más", "No lo sé"];
      return (
        <div>
          <h3 style={styles.question}>¿Cuántas plantas tiene el edificio en total?</h3>
          <p style={styles.helper}>Cuenta desde la planta baja hasta el último piso (sin contar el ático si hay).</p>
          {floorCounts.map((n) => (
            <OptionButton
              key={n}
              selected={formData.totalFloors === n}
              onClick={() => updateField("totalFloors", n)}
              label={n}
            />
          ))}
        </div>
      );
    }

    // ── BLOCK 2 — INTRO ──────────────────────────────────────────────────────
    if (currentScreen === "b2_intro") {
      return (
        <div>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🧱</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a202c", marginBottom: 12 }}>
              Bloque 2: Fachadas
            </h3>
          </div>
          <div style={styles.infoBox}>
            <p style={{ margin: 0, fontSize: 14, color: "#2d3748", lineHeight: 1.7 }}>
              Ahora vamos a hablar de las <strong>paredes exteriores</strong> de tu
              vivienda.
              <br />
              Solo las que tienen ventanas al exterior o que tocan con el aire libre —
              no las paredes interiores ni las que dan a pasillos o escaleras.
            </p>
          </div>
          <button style={styles.btnPrimary} onClick={goNext}>
            Continuar →
          </button>
        </div>
      );
    }

    // ── BLOCK 2 — NUM FACHADAS ───────────────────────────────────────────────
    if (currentScreen === "b2_num") {
      const opts = [
        { n: 1, label: "1 fachada", sub: "Mi vivienda solo tiene una pared exterior" },
        { n: 2, label: "2 fachadas", sub: "Dos paredes dan al exterior" },
        { n: 3, label: "3 fachadas", sub: "Tres paredes dan al exterior" },
        { n: 4, label: "4 fachadas", sub: "Las cuatro paredes son exteriores (unifamiliar o esquina)" },
      ];
      return (
        <div>
          <h3 style={styles.question}>¿Cuántas fachadas exteriores tiene tu vivienda?</h3>
          {opts.map(({ n, label, sub }) => (
            <OptionButton
              key={n}
              selected={formData.numFachadas === n}
              onClick={() => setNumFachadas(n)}
              label={label}
              sub={sub}
            />
          ))}
        </div>
      );
    }

    // ── BLOCK 2 — FACHADA FOTO ───────────────────────────────────────────────
    const b2FotoMatch = currentScreen.match(/^b2_foto_(\d+)$/);
    if (b2FotoMatch) {
      const idx = parseInt(b2FotoMatch[1]);
      const fachada = formData.fachadas[idx] ?? { fotoId: null, fotoNombre: null, material: "", aislamiento: "" };
      const total = formData.numFachadas;
      return (
        <div>
          <h3 style={styles.question}>
            Fachada {idx + 1} de {total}: haz una foto desde fuera
          </h3>
          <div style={styles.helperBox}>
            <p style={{ margin: 0, fontSize: 14, color: "#4a5568", lineHeight: 1.6 }}>
              📷 <strong>Cómo hacerla bien:</strong>
              <br />
              • Sal a la calle y hazla desde enfrente
              <br />
              • Que salga toda la pared de tu piso, no solo parte
              <br />
              • Si no puedes salir, desde una ventana de enfrente
            </p>
          </div>
          <PhotoUploadButton
            label={`Foto fachada ${idx + 1}`}
            uploaded={!!fachada.fotoId}
            uploading={uploadingKey === `b2_foto_${idx}`}
            hint=""
            onChange={(file) =>
              uploadPhoto(file, `foto_fachada_${idx}`, (id, nombre) =>
                updateFachada(idx, { fotoId: id, fotoNombre: nombre })
              )
            }
          />
          <button
            style={{ ...styles.btnSecondary, marginTop: 4 }}
            onClick={goNext}
          >
            No puedo hacer la foto / Continuar →
          </button>
        </div>
      );
    }

    // ── BLOCK 2 — FACHADA MATERIAL ───────────────────────────────────────────
    const b2MaterialMatch = currentScreen.match(/^b2_material_(\d+)$/);
    if (b2MaterialMatch) {
      const idx = parseInt(b2MaterialMatch[1]);
      const fachada = formData.fachadas[idx] ?? { fotoId: null, fotoNombre: null, material: "", aislamiento: "" };
      return (
        <div>
          <h3 style={styles.question}>
            Fachada {idx + 1}: ¿de qué material está hecha esa pared exterior?
          </h3>
          {MATERIAL_OPTS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={fachada.material === opt.value}
              onClick={() => updateFachada(idx, { material: opt.value })}
              emoji={opt.emoji}
              label={opt.label}
              sub={opt.sub}
            />
          ))}
        </div>
      );
    }

    // ── BLOCK 2 — FACHADA AISLAMIENTO ────────────────────────────────────────
    const b2AisMatch = currentScreen.match(/^b2_aislamiento_(\d+)$/);
    if (b2AisMatch) {
      const idx = parseInt(b2AisMatch[1]);
      const fachada = formData.fachadas[idx] ?? { fotoId: null, fotoNombre: null, material: "", aislamiento: "" };
      return (
        <div>
          <h3 style={styles.question}>
            Fachada {idx + 1}: ¿tiene aislamiento esa pared?
          </h3>
          <div style={styles.helperBox}>
            <p style={{ margin: 0, fontSize: 14, color: "#4a5568", lineHeight: 1.6 }}>
              💡 Si el edificio es <strong>anterior a 1980</strong>, probablemente no
              tiene. Si hubo una reforma de fachada o hay una cámara de aire visible,
              puede que sí.
            </p>
          </div>
          {[
            { value: "si", emoji: "✅", label: "Sí, tiene aislamiento", sub: "Espuma, lana de roca, poliestireno..." },
            { value: "no", emoji: "❌", label: "No tiene aislamiento", sub: "" },
            { value: "no_se", emoji: "❓", label: "No lo sé", sub: "El técnico lo estimará" },
          ].map((opt) => (
            <OptionButton
              key={opt.value}
              selected={fachada.aislamiento === opt.value}
              onClick={() => updateFachada(idx, { aislamiento: opt.value })}
              emoji={opt.emoji}
              label={opt.label}
              sub={opt.sub}
            />
          ))}
        </div>
      );
    }

    // ── BLOCK 3 — INTRO ──────────────────────────────────────────────────────
    if (currentScreen === "b3_intro") {
      return (
        <div>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🪟</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a202c", marginBottom: 12 }}>
              Bloque 3: Ventanas
            </h3>
          </div>
          <div style={styles.infoBox}>
            <p style={{ margin: 0, fontSize: 14, color: "#2d3748", lineHeight: 1.7 }}>
              Ahora vamos con las <strong>ventanas y puertas exteriores</strong>.
              <br />
              Incluye también las puertas que den directamente al exterior o a una
              terraza.
            </p>
          </div>
          <button style={styles.btnPrimary} onClick={goNext}>
            Continuar →
          </button>
        </div>
      );
    }

    // ── BLOCK 3 — NUM VENTANAS ───────────────────────────────────────────────
    if (currentScreen === "b3_num") {
      const opts = ["1", "2", "3", "4", "5", "6", "7 o más"];
      return (
        <div>
          <h3 style={styles.question}>¿Cuántas ventanas y puertas exteriores tiene tu vivienda?</h3>
          <p style={styles.helper}>Cuenta solo las que dan al exterior o a una terraza, no las interiores.</p>
          {opts.map((n) => (
            <OptionButton
              key={n}
              selected={formData.numVentanas === parseInt(n) || (n === "7 o más" && formData.numVentanas >= 7)}
              onClick={() => setNumVentanas(n === "7 o más" ? 7 : parseInt(n))}
              label={n}
            />
          ))}
        </div>
      );
    }

    // ── BLOCK 3 — VENTANA FOTO ───────────────────────────────────────────────
    const b3FotoMatch = currentScreen.match(/^b3_foto_(\d+)$/);
    if (b3FotoMatch) {
      const idx = parseInt(b3FotoMatch[1]);
      const ventana = formData.ventanas[idx] ?? { fotoId: null, fotoNombre: null, tipoVidrio: "", tipoMarco: "" };
      const total = formData.numVentanas;
      return (
        <div>
          <h3 style={styles.question}>
            Ventana {idx + 1} de {total}: foto desde dentro
          </h3>
          <div style={styles.helperBox}>
            <p style={{ margin: 0, fontSize: 14, color: "#4a5568", lineHeight: 1.6 }}>
              📷 <strong>Cómo hacerla bien:</strong>
              <br />
              • Desde dentro, mostrando el <strong>marco completo y el vidrio</strong>
              <br />
              • Que se vea si hay una o dos capas de vidrio (busca si hay una cámara
              de aire entre los cristales)
            </p>
          </div>
          <PhotoUploadButton
            label={`Foto ventana ${idx + 1}`}
            uploaded={!!ventana.fotoId}
            uploading={uploadingKey === `b3_foto_${idx}`}
            hint=""
            onChange={(file) =>
              uploadPhoto(file, `foto_ventana_${idx}`, (id, nombre) =>
                updateVentana(idx, { fotoId: id, fotoNombre: nombre })
              )
            }
          />
          <button style={{ ...styles.btnSecondary, marginTop: 4 }} onClick={goNext}>
            No puedo hacer la foto / Continuar →
          </button>
        </div>
      );
    }

    // ── BLOCK 3 — VENTANA VIDRIO ─────────────────────────────────────────────
    const b3VidMatch = currentScreen.match(/^b3_vidrio_(\d+)$/);
    if (b3VidMatch) {
      const idx = parseInt(b3VidMatch[1]);
      const ventana = formData.ventanas[idx] ?? { fotoId: null, fotoNombre: null, tipoVidrio: "", tipoMarco: "" };
      return (
        <div>
          <h3 style={styles.question}>
            Ventana {idx + 1}: ¿qué tipo de vidrio tiene?
          </h3>
          {VIDRIO_OPTS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={ventana.tipoVidrio === opt.value}
              onClick={() => updateVentana(idx, { tipoVidrio: opt.value })}
              emoji={opt.emoji}
              label={opt.label}
              sub={opt.sub}
            />
          ))}
        </div>
      );
    }

    // ── BLOCK 3 — VENTANA MARCO ──────────────────────────────────────────────
    const b3MarcoMatch = currentScreen.match(/^b3_marco_(\d+)$/);
    if (b3MarcoMatch) {
      const idx = parseInt(b3MarcoMatch[1]);
      const ventana = formData.ventanas[idx] ?? { fotoId: null, fotoNombre: null, tipoVidrio: "", tipoMarco: "" };
      return (
        <div>
          <h3 style={styles.question}>
            Ventana {idx + 1}: ¿de qué material es el marco?
          </h3>
          {MARCO_OPTS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={ventana.tipoMarco === opt.value}
              onClick={() => updateVentana(idx, { tipoMarco: opt.value })}
              emoji={opt.emoji}
              label={opt.label}
              sub={opt.sub}
            />
          ))}
        </div>
      );
    }

    // ── BLOCK 3 — PERSIANAS ──────────────────────────────────────────────────
    if (currentScreen === "b3_persianas") {
      return (
        <div>
          <h3 style={styles.question}>¿Tienes persianas, toldos o protecciones solares?</h3>
          {[
            { value: "si",      label: "Sí, tengo persianas o toldos" },
            { value: "no",      label: "No tengo" },
          ].map((opt) => (
            <OptionButton
              key={opt.value}
              selected={formData.tienePersianas === opt.value}
              onClick={() => updateField("tienePersianas", opt.value)}
              label={opt.label}
            />
          ))}
          {formData.tienePersianas === "si" && (
            <PhotoUploadButton
              label="Foto de las persianas"
              uploaded={!!formData.fotoPersianasId}
              uploading={uploadingKey === "b3_persianas"}
              hint="Opcional — haz una foto si puedes."
              onChange={(file) =>
                uploadPhoto(file, "foto_persianas", (id, nombre) => {
                  updateField("fotoPersianasId", id);
                  updateField("fotoPersianasNombre", nombre);
                })
              }
            />
          )}
        </div>
      );
    }

    // ── BLOCK 4 — CHECK LAST FLOOR ───────────────────────────────────────────
    if (currentScreen === "b4_check") {
      return (
        <div>
          <h3 style={styles.question}>¿Tu vivienda está en el último piso o es una casa?</h3>
          <p style={styles.helper}>Esto nos ayuda a entender si la cubierta afecta a tu vivienda.</p>
          {[
            { value: "si", label: "Sí, soy el último piso o es una casa unifamiliar" },
            { value: "no", label: "No, hay pisos encima del mío" },
          ].map((opt) => (
            <OptionButton
              key={opt.value}
              selected={formData.esUltimaPlanta === opt.value}
              onClick={() => updateField("esUltimaPlanta", opt.value)}
              label={opt.label}
            />
          ))}
        </div>
      );
    }

    // ── BLOCK 4 — ROOF PHOTO ─────────────────────────────────────────────────
    if (currentScreen === "b4_foto") {
      return (
        <div>
          <h3 style={styles.question}>Foto de la terraza o cubierta</h3>
          <PhotoUploadButton
            label="Foto de la cubierta/terraza"
            uploaded={!!formData.fotoCubiertaId}
            uploading={uploadingKey === "b4_foto"}
            hint="Si tienes acceso a la terraza o tejado, haz una foto general. Si no tienes acceso, continúa sin foto."
            onChange={(file) =>
              uploadPhoto(file, "foto_cubierta", (id, nombre) => {
                updateField("fotoCubiertaId", id);
                updateField("fotoCubiertaNombre", nombre);
              })
            }
          />
          <button style={{ ...styles.btnSecondary, marginTop: 4 }} onClick={goNext}>
            No tengo acceso / Continuar →
          </button>
        </div>
      );
    }

    // ── BLOCK 4 — ROOF INSULATION ────────────────────────────────────────────
    if (currentScreen === "b4_aislamiento") {
      return (
        <div>
          <h3 style={styles.question}>¿La cubierta o tejado tiene aislamiento?</h3>
          <div style={styles.helperBox}>
            <p style={{ margin: 0, fontSize: 14, color: "#4a5568", lineHeight: 1.6 }}>
              💡 En una <strong>azotea transitable</strong>, el aislamiento suele estar
              bajo el solado. En un <strong>tejado inclinado</strong>, suele estar bajo
              las tejas.
            </p>
          </div>
          {[
            { value: "si",    emoji: "✅", label: "Sí, tiene aislamiento" },
            { value: "no",    emoji: "❌", label: "No tiene o creo que no" },
            { value: "no_se", emoji: "❓", label: "No lo sé" },
          ].map((opt) => (
            <OptionButton
              key={opt.value}
              selected={formData.aislamientoCubierta === opt.value}
              onClick={() => updateField("aislamientoCubierta", opt.value)}
              emoji={opt.emoji}
              label={opt.label}
            />
          ))}
        </div>
      );
    }

    // ── BLOCK 5 — INTRO ──────────────────────────────────────────────────────
    if (currentScreen === "b5_intro") {
      return (
        <div>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🔥</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a202c", marginBottom: 12 }}>
              Bloque 5: Calefacción y agua caliente
            </h3>
          </div>
          <div style={styles.infoBox}>
            <p style={{ margin: 0, fontSize: 14, color: "#2d3748", lineHeight: 1.7 }}>
              Solo dinos lo que tienes — no hace falta que sepas las especificaciones
              técnicas.
            </p>
          </div>
          <button style={styles.btnPrimary} onClick={goNext}>
            Continuar →
          </button>
        </div>
      );
    }

    // ── BLOCK 5 — CALEFACCIÓN ────────────────────────────────────────────────
    if (currentScreen === "b5_calefaccion") {
      return (
        <div>
          <h3 style={styles.question}>¿Cómo calientas tu vivienda?</h3>
          {CALEFACCION_OPTS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={formData.tipoCalefaccion === opt.value}
              onClick={() => updateField("tipoCalefaccion", opt.value)}
              emoji={opt.emoji}
              label={opt.label}
              sub={opt.sub}
            />
          ))}
        </div>
      );
    }

    // ── BLOCK 5 — FOTO CALEFACCIÓN ───────────────────────────────────────────
    if (currentScreen === "b5_foto_cal") {
      return (
        <div>
          <h3 style={styles.question}>Foto del equipo de calefacción</h3>
          <PhotoUploadButton
            label="Foto de la caldera / equipo"
            uploaded={!!formData.fotoCalefaccionId}
            uploading={uploadingKey === "b5_foto_cal"}
            hint="Haz una foto del equipo. Que se vea la etiqueta o placa con el modelo. Si ves una pegatina con el año de instalación, ¡esa también!"
            onChange={(file) =>
              uploadPhoto(file, "foto_calefaccion", (id, nombre) => {
                updateField("fotoCalefaccionId", id);
                updateField("fotoCalefaccionNombre", nombre);
              })
            }
          />
          <button style={{ ...styles.btnSecondary, marginTop: 4 }} onClick={goNext}>
            No puedo / Continuar →
          </button>
        </div>
      );
    }

    // ── BLOCK 5 — ACS ────────────────────────────────────────────────────────
    if (currentScreen === "b5_acs") {
      return (
        <div>
          <h3 style={styles.question}>¿Cómo tienes el agua caliente?</h3>
          {ACS_OPTS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={formData.tipoACS === opt.value}
              onClick={() => updateField("tipoACS", opt.value)}
              emoji={opt.emoji}
              label={opt.label}
            />
          ))}
        </div>
      );
    }

    // ── BLOCK 5 — AIRE ───────────────────────────────────────────────────────
    if (currentScreen === "b5_aire") {
      return (
        <div>
          <h3 style={styles.question}>¿Tienes aire acondicionado?</h3>
          {[
            { value: "si", label: "Sí, tengo aire acondicionado" },
            { value: "no", label: "No tengo" },
          ].map((opt) => (
            <OptionButton
              key={opt.value}
              selected={formData.tieneAire === opt.value}
              onClick={() => updateField("tieneAire", opt.value)}
              label={opt.label}
            />
          ))}
        </div>
      );
    }

    // ── BLOCK 5 — FOTO AIRE INTERIOR ─────────────────────────────────────────
    if (currentScreen === "b5_foto_aire_int") {
      return (
        <div>
          <h3 style={styles.question}>Foto de la unidad interior del aire acondicionado</h3>
          <PhotoUploadButton
            label="Foto unidad interior"
            uploaded={!!formData.fotoAireIntId}
            uploading={uploadingKey === "b5_foto_aire_int"}
            hint="El aparato que tienes en la pared, dentro de casa. Que se vea la marca y modelo si es posible."
            onChange={(file) =>
              uploadPhoto(file, "foto_aire_interior", (id, nombre) => {
                updateField("fotoAireIntId", id);
                updateField("fotoAireIntNombre", nombre);
              })
            }
          />
          <button style={{ ...styles.btnSecondary, marginTop: 4 }} onClick={goNext}>
            Continuar →
          </button>
        </div>
      );
    }

    // ── BLOCK 5 — FOTO AIRE EXTERIOR ─────────────────────────────────────────
    if (currentScreen === "b5_foto_aire_ext") {
      return (
        <div>
          <h3 style={styles.question}>Foto de la unidad exterior del aire acondicionado</h3>
          <PhotoUploadButton
            label="Foto unidad exterior"
            uploaded={!!formData.fotoAireExtId}
            uploading={uploadingKey === "b5_foto_aire_ext"}
            hint="La caja que está en la terraza, en el exterior o en la fachada. Que se vea bien la etiqueta."
            onChange={(file) =>
              uploadPhoto(file, "foto_aire_exterior", (id, nombre) => {
                updateField("fotoAireExtId", id);
                updateField("fotoAireExtNombre", nombre);
              })
            }
          />
          <button style={{ ...styles.btnSecondary, marginTop: 4 }} onClick={goNext}>
            No tengo acceso / Continuar →
          </button>
        </div>
      );
    }

    // ── BLOCK 5 — TIPO AIRE ──────────────────────────────────────────────────
    if (currentScreen === "b5_aire_tipo") {
      return (
        <div>
          <h3 style={styles.question}>¿El aire acondicionado da solo frío o también calor?</h3>
          {[
            { value: "frio_solo",  label: "Solo frío" },
            { value: "frio_calor", label: "Frío y calor (bomba de calor)" },
            { value: "no_se",      label: "No lo sé" },
          ].map((opt) => (
            <OptionButton
              key={opt.value}
              selected={formData.tipoAire === opt.value}
              onClick={() => updateField("tipoAire", opt.value)}
              label={opt.label}
            />
          ))}
        </div>
      );
    }

    // ── BLOCK 6 — GENERAL PHOTOS ─────────────────────────────────────────────
    if (currentScreen === "b6_fotos") {
      const numUploaded = formData.fotosGeneralesIds.length;
      return (
        <div>
          <h3 style={styles.question}>Fotos generales del interior</h3>
          <div style={styles.helperBox}>
            <p style={{ margin: 0, fontSize: 14, color: "#4a5568", lineHeight: 1.6 }}>
              📷 Haz 3–4 fotos generales del interior:
              <br />
              sala de estar, dormitorio principal, cocina y baño.
              <br />
              Que se vean bien las <strong>paredes, el suelo y el techo</strong>.
            </p>
          </div>
          {numUploaded > 0 && (
            <div style={styles.successBadge}>
              ✅ {numUploaded} foto{numUploaded !== 1 ? "s" : ""} subida{numUploaded !== 1 ? "s" : ""}
            </div>
          )}
          <PhotoUploadButton
            label={numUploaded === 0 ? "Añadir foto general" : "Añadir otra foto"}
            uploaded={false}
            uploading={uploadingKey === "b6_fotos"}
            hint=""
            onChange={(file) =>
              uploadPhoto(file, "foto_general", (id, nombre) => {
                setFormData((prev) => ({
                  ...prev,
                  fotosGeneralesIds: [...prev.fotosGeneralesIds, id],
                  fotosGeneralesNombres: [...prev.fotosGeneralesNombres, nombre],
                }));
              })
            }
          />
        </div>
      );
    }

    // ── BLOCK 6 — NOTES ─────────────────────────────────────────────────────
    if (currentScreen === "b6_notas") {
      return (
        <div>
          <h3 style={styles.question}>¿Quieres añadir algún comentario?</h3>
          <p style={styles.helper}>
            Si hay algo que creas importante (reforma reciente, humedades, instalaciones especiales...) cuéntanoslo aquí.
          </p>
          <textarea
            style={{ ...styles.input, height: 140, resize: "vertical" }}
            placeholder="Escribe aquí tus comentarios (opcional)..."
            value={formData.notas}
            onChange={(e) => updateField("notas", e.target.value)}
          />
        </div>
      );
    }

    // ── CONFIRMATION ─────────────────────────────────────────────────────────
    if (currentScreen === "confirmation") {
      return (
        <div>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a202c", marginBottom: 12 }}>
              ¡Has completado el formulario!
            </h3>
          </div>
          <div style={styles.infoBox}>
            <p style={{ margin: 0, fontSize: 14, color: "#2d3748", lineHeight: 1.7 }}>
              Cuando pulses <strong>"Enviar información"</strong>, tus datos se
              enviarán a {certifier?.name ?? "tu certificador"}, que los revisará
              y te contactará si necesita algo más.
            </p>
          </div>
          <button style={styles.btnPrimary} onClick={handleSubmit}>
            Enviar información →
          </button>
          <button style={{ ...styles.btnSecondary, marginTop: 12 }} onClick={goBack}>
            ← Revisar respuestas
          </button>
        </div>
      );
    }

    return <div style={{ color: "#718096" }}>Pantalla no reconocida: {currentScreen}</div>;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const isWelcome = currentScreen === "welcome";
  const isConfirmation = currentScreen === "confirmation";
  const showNavButtons = !isWelcome && !isConfirmation && currentScreen !== "b2_intro" && currentScreen !== "b3_intro" && currentScreen !== "b5_intro";

  // Can the user go next without selecting anything?
  function canContinue(): boolean {
    // Required fields per screen
    if (currentScreen === "b1_year" && !formData.constructionYear) return false;
    if (currentScreen === "b1_floor" && !formData.floor) return false;
    if (currentScreen === "b1_totalfloors" && !formData.totalFloors) return false;
    if (currentScreen === "b2_num" && !formData.numFachadas) return false;
    if (currentScreen === "b3_num" && !formData.numVentanas) return false;
    if (currentScreen === "b4_check" && !formData.esUltimaPlanta) return false;
    if (currentScreen === "b5_calefaccion" && !formData.tipoCalefaccion) return false;
    if (currentScreen === "b5_acs" && !formData.tipoACS) return false;
    if (currentScreen === "b5_aire" && !formData.tieneAire) return false;
    const matMatch = currentScreen.match(/^b2_material_(\d+)$/);
    if (matMatch) {
      const idx = parseInt(matMatch[1]);
      if (!formData.fachadas[idx]?.material) return false;
    }
    return true;
  }

  return (
    <div style={styles.pageWrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>CERTIFIVE</div>
        {!isWelcome && (
          <div style={styles.progressWrapper}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={styles.progressLabel}>
                {blockLabel || BLOCK_LABELS[getBlockKey(currentScreen)] || ""}
              </span>
              <span style={styles.progressLabel}>{progress}%</span>
            </div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Content card */}
      <div style={styles.card}>
        {renderScreen()}

        {/* Bottom navigation */}
        {showNavButtons && (
          <div style={styles.navRow}>
            <button style={styles.btnBack} onClick={goBack}>
              ← Atrás
            </button>
            <button
              style={{
                ...styles.btnPrimary,
                flex: 1,
                opacity: canContinue() ? 1 : 0.5,
                cursor: canContinue() ? "pointer" : "not-allowed",
              }}
              onClick={canContinue() ? goNext : undefined}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        Tus datos se guardan automáticamente · Certifive
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const TEAL = "#0D7C66";

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    minHeight: "100vh",
    background: "#f7fafc",
    fontFamily: "'Inter', -apple-system, sans-serif",
    paddingBottom: 40,
  },
  header: {
    background: TEAL,
    padding: "16px 20px",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    color: "#fff",
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: "0.05em",
    marginBottom: 8,
  },
  progressWrapper: {
    width: "100%",
  },
  progressLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: 500,
  },
  progressBar: {
    height: 6,
    background: "rgba(255,255,255,0.25)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#fff",
    borderRadius: 3,
    transition: "width 0.4s ease",
  },
  card: {
    maxWidth: 560,
    margin: "24px auto",
    padding: "24px 20px",
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  question: {
    fontSize: 19,
    fontWeight: 700,
    color: "#1a202c",
    marginBottom: 16,
    lineHeight: 1.4,
  },
  helper: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 16,
    lineHeight: 1.6,
  },
  helperBox: {
    background: "#f0faf7",
    border: "1px solid #c6f6d5",
    borderRadius: 10,
    padding: "12px 14px",
    marginBottom: 16,
  },
  infoBox: {
    background: "#ebf8ff",
    border: "1px solid #bee3f8",
    borderRadius: 10,
    padding: "14px 16px",
    marginBottom: 24,
  },
  input: {
    width: "100%",
    padding: "14px",
    fontSize: 15,
    border: "2px solid #e2e8f0",
    borderRadius: 10,
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 12,
    fontFamily: "inherit",
  },
  btnPrimary: {
    display: "block",
    width: "100%",
    padding: "16px",
    background: TEAL,
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "center",
  },
  btnSecondary: {
    display: "block",
    width: "100%",
    padding: "14px",
    background: "transparent",
    color: "#718096",
    border: "2px solid #e2e8f0",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
  },
  btnBack: {
    padding: "14px 20px",
    background: "transparent",
    color: "#718096",
    border: "2px solid #e2e8f0",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginRight: 12,
  },
  navRow: {
    display: "flex",
    alignItems: "center",
    marginTop: 24,
    paddingTop: 16,
    borderTop: "1px solid #f0f0f0",
  },
  successBadge: {
    background: "#f0faf7",
    border: "1px solid #9ae6b4",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#276749",
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 12,
  },
  centered: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "3px solid #e2e8f0",
    borderTopColor: TEAL,
    animation: "spin 0.8s linear infinite",
  },
  footer: {
    textAlign: "center",
    color: "#a0aec0",
    fontSize: 12,
    marginTop: 8,
  },
};
