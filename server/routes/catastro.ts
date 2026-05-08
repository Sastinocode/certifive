import { Router } from "express";
import { XMLParser } from "fast-xml-parser";

const router = Router();

// ── In-memory cache: RC → { data, expiresAt } ───────────────────────────────
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

const cache = new Map<string, { data: CatastroData; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Browser-compatible User-Agent (required by Catastro API) ─────────────────
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ── XML parser instance ──────────────────────────────────────────────────────
const parser = new XMLParser({
  ignoreAttributes:    false,
  attributeNamePrefix: "@_",
  textNodeName:        "#text",
  ignoreDeclaration:   true,
  trimValues:          true,
  parseTagValue:       true,
  parseAttributeValue: false,
  isArray: (name) =>
    ["bi", "bico", "locs", "err"].includes(name),
});

// ── USO catastral → tipo de inmueble ────────────────────────────────────────
function mapUso(uso: string): string {
  const u = (uso || "").toUpperCase().trim();
  if (u === "V" || u.startsWith("VP"))   return "Piso / Apartamento";
  if (u === "I")                          return "Nave industrial";
  if (u === "C")                          return "Local comercial";
  if (u === "O" || u === "OF")            return "Oficinas";
  if (u === "E")                          return "Edificio de viviendas";
  if (u === "R" || u === "CH")            return "Vivienda unifamiliar";
  if (u === "A")                          return "Almacén";
  if (u === "G")                          return "Garaje";
  if (u === "J")                          return "Industrial";
  if (u === "P" || u === "AP")            return "Aparcamiento";
  return uso; // return raw if unmapped
}

// ── Safe string from parsed XML value ───────────────────────────────────────
function str(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    const o = val as Record<string, unknown>;
    if (o["#text"] != null) return str(o["#text"]);
    // Sometimes value is wrapped in an object from fast-xml-parser
    const keys = Object.keys(o);
    if (keys.length === 1) return str(o[keys[0]]);
  }
  return "";
}

// ── Unwrap array-or-single ───────────────────────────────────────────────────
function first<T>(v: T | T[] | undefined): T | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

// ── GET /api/catastro/lookup?rc=<referencia_catastral> ───────────────────────
router.get("/lookup", async (req, res) => {
  const rc = (req.query.rc as string | undefined)?.trim().toUpperCase().replace(/[\s-]/g, "");

  if (!rc || rc.length < 14) {
    return res.status(400).json({ error: "Referencia catastral no válida (mínimo 14 caracteres)" });
  }

  // Serve from cache if still fresh
  const cached = cache.get(rc);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json({ ok: true, data: cached.data, source: "cache" });
  }

  // Build URL – leave Provincia & Municipio empty for RC lookup
  const url = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC=${encodeURIComponent(rc)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let xmlText: string;
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": UA,
        "Accept": "text/xml, application/xml, */*",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({ error: `Catastro devolvió HTTP ${response.status}` });
    }

    xmlText = await response.text();

    // Detect HTML fallback (API sometimes returns error page)
    if (xmlText.trim().startsWith("<html") || xmlText.trim().startsWith("<!DOCTYPE")) {
      return res.status(502).json({ error: "La API del Catastro devolvió un error inesperado. Inténtalo más tarde." });
    }
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === "AbortError") {
      return res.status(504).json({ error: "La API del Catastro tardó demasiado (timeout 10s)" });
    }
    return res.status(502).json({ error: "No se pudo conectar con la API del Catastro" });
  }

  // Parse XML
  let parsed: any;
  try {
    parsed = parser.parse(xmlText);
  } catch {
    return res.status(502).json({ error: "Respuesta del Catastro no es XML válido" });
  }

  // Navigate the response tree – the REST endpoint returns <consulta_dnp>
  // Supports both the REST root and legacy SOAP paths
  const root: any =
    parsed?.["consulta_dnp"] ??
    parsed?.["consulta_dnprcResult"] ??
    parsed?.["ns1:consulta_dnprcResult"] ??
    parsed?.["soap:Envelope"]?.["soap:Body"]?.["consulta_dnprcResult"];

  if (!root) {
    console.error("[catastro] Unexpected XML root. Keys:", Object.keys(parsed ?? {}));
    return res.status(404).json({ error: "Referencia catastral no encontrada o respuesta inesperada del Catastro" });
  }

  // ── Error codes from Catastro ────────────────────────────────────────────
  const errNode = first(root?.["lerr"]?.["err"]) ?? root?.["err"];
  const errorCod = str(errNode?.["cod"]);
  if (errorCod && errorCod !== "0") {
    const errorDesc = str(errNode?.["des"]) || "RC no encontrada";
    const friendly: Record<string, string> = {
      "1":  "Error en el sistema del Catastro",
      "4":  "La referencia catastral no tiene el formato correcto",
      "5":  "No existe ningún inmueble con esa referencia catastral",
      "21": "Parámetros incompletos",
      "43": "La referencia catastral no existe",
    };
    return res.status(404).json({ error: friendly[errorCod] ?? `Catastro: ${errorDesc} (cod ${errorCod})` });
  }

  // ── Navigate bico > bi ───────────────────────────────────────────────────
  const bicoRaw = root?.["bico"];
  const bico = first(Array.isArray(bicoRaw) ? bicoRaw : [bicoRaw]);
  const biRaw = bico?.["bi"];
  const bi: any = first(Array.isArray(biRaw) ? biRaw : [biRaw]) ?? bico;

  // ── Location ──────────────────────────────────────────────────────────────
  // Path: bi.locs  (the API may return "locs" or "lous" directly)
  const locs: any = bi?.["locs"] ?? bi?.["loc"];
  const locsFirst: any = first(Array.isArray(locs) ? locs : [locs]) ?? locs;

  // Full address string (lous = localización textual del inmueble)
  const lous = str(locsFirst?.["lous"]) || str(bi?.["lous"]);

  // Municipality details (dm)
  const dm: any = locsFirst?.["dm"] ?? locsFirst?.["ldt"]?.["dm"];
  const municipio = str(dm?.["nm"]) || str(locsFirst?.["nm"]);
  const provincia  = str(dm?.["np"]) || str(locsFirst?.["np"]);
  const comunidad  = str(dm?.["nca"]) || str(locsFirst?.["nca"]);
  const cp         = str(locsFirst?.["dp"]) || str(locsFirst?.["ldt"]?.["dp"]);

  // Fallback paths used by older API versions
  const ldt: any = locsFirst?.["ldt"];
  const municipioFallback = str(ldt?.["nm"]);
  const provinciaFallback  = str(ldt?.["np"]);
  const comunidadFallback  = str(ldt?.["nca"]);
  const cpFallback         = str(ldt?.["dp"]);
  const lousFallback       = str(ldt?.["lous"]);

  // ── Technical data ────────────────────────────────────────────────────────
  // Path: bi.dt or bi.debi (data técnica del inmueble)
  const dt: any = bi?.["dt"] ?? bi?.["debi"];
  const dtFirst: any = first(Array.isArray(dt) ? dt : [dt]) ?? dt;

  const anoConst  = str(dtFirst?.["ant"]);
  const superficie = str(dtFirst?.["sco"]) || str(dtFirst?.["sfc"]) || str(dtFirst?.["stl"]) || str(dtFirst?.["scons"]);
  const uso        = str(dtFirst?.["luso"]) || str(dtFirst?.["uso"]);

  const data: CatastroData = {
    address:           lous || lousFallback || undefined,
    city:              municipio || municipioFallback || undefined,
    postalCode:        cp || cpFallback || undefined,
    province:          provincia || provinciaFallback || undefined,
    comunidadAutonoma: comunidad || comunidadFallback || undefined,
    constructionYear:  anoConst || undefined,
    totalArea:         superficie ? String(Math.round(parseFloat(superficie) || 0)) || superficie : undefined,
    propertyType:      uso ? mapUso(uso) : undefined,
  };

  // Remove undefined keys
  (Object.keys(data) as (keyof CatastroData)[]).forEach(k => {
    if (data[k] === undefined || data[k] === "") delete data[k];
  });

  // Always store in cache (even partial data)
  cache.set(rc, { data, expiresAt: Date.now() + CACHE_TTL_MS });

  // Return whatever we found — let the client decide what to do with partial data
  const hasAnyData = Object.keys(data).length > 0;
  if (!hasAnyData) {
    return res.status(404).json({ error: "No se encontraron datos para esta referencia catastral" });
  }

  return res.json({ ok: true, data, source: "api" });
});

export default router;
