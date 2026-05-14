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

// ── GET /api/catastro/rc/:rc — alias for the frontend component ───────────────
router.get("/rc/:rc", async (req, res) => {
  // Re-use the lookup logic by forwarding internally
  const rc = (req.params.rc as string)?.trim().toUpperCase().replace(/[\s-]/g, "");
  if (!rc || rc.length < 14) {
    return res.json({ results: [] });
  }
  const cached = cache.get(rc);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json({ results: [{ rc, ...cached.data }] });
  }
  const url = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC=${encodeURIComponent(rc)}`;
  try {
    const response = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/xml, application/xml, */*" }, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return res.json({ results: [] });
    const xmlText = await response.text();
    if (xmlText.trim().startsWith("<html") || xmlText.trim().startsWith("<!DOCTYPE")) return res.json({ results: [] });
    const parsed = parser.parse(xmlText);
    const root: any = parsed?.["consulta_dnp"] ?? parsed?.["consulta_dnprcResult"];
    if (!root) return res.json({ results: [] });
    const errNode = first(root?.["lerr"]?.["err"]) ?? root?.["err"];
    if (str(errNode?.["cod"]) && str(errNode?.["cod"]) !== "0") return res.json({ results: [] });
    const bico = first(Array.isArray(root?.["bico"]) ? root?.["bico"] : [root?.["bico"]]);
    const bi: any = first(Array.isArray(bico?.["bi"]) ? bico?.["bi"] : [bico?.["bi"]]) ?? bico;
    const locs: any = bi?.["locs"] ?? bi?.["loc"];
    const locsFirst: any = first(Array.isArray(locs) ? locs : [locs]) ?? locs;
    const lous = str(locsFirst?.["lous"]) || str(bi?.["lous"]);
    const dm: any = locsFirst?.["dm"];
    const municipio = str(dm?.["nm"]) || str(locsFirst?.["nm"]);
    const provincia = str(dm?.["np"]) || str(locsFirst?.["np"]);
    const cp = str(locsFirst?.["dp"]) || str(locsFirst?.["ldt"]?.["dp"]);
    const dt: any = bi?.["dt"] ?? bi?.["debi"];
    const dtFirst: any = first(Array.isArray(dt) ? dt : [dt]) ?? dt;
    const anoConst = str(dtFirst?.["ant"]);
    const superficie = str(dtFirst?.["sco"]) || str(dtFirst?.["sfc"]) || str(dtFirst?.["stl"]);
    const uso = str(dtFirst?.["luso"]) || str(dtFirst?.["uso"]);
    const data: CatastroData = {
      address: lous || undefined,
      city: municipio || undefined,
      postalCode: cp || undefined,
      province: provincia || undefined,
      constructionYear: anoConst || undefined,
      totalArea: superficie ? String(Math.round(parseFloat(superficie) || 0)) || superficie : undefined,
      propertyType: uso ? mapUso(uso) : undefined,
    };
    cache.set(rc, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return res.json({ results: [{ rc, ...data }] });
  } catch {
    return res.json({ results: [] });
  }
});

// ── GET /api/catastro/search — address-based search ──────────────────────────
router.get("/search", async (req, res) => {
  const via      = (req.query.via      as string | undefined)?.trim() ?? "";
  const numero   = (req.query.numero   as string | undefined)?.trim() ?? "";
  const municipio= (req.query.municipio as string | undefined)?.trim() ?? "";
  const provincia= (req.query.provincia as string | undefined)?.trim() ?? "";

  if (!via || !municipio) {
    return res.json({ results: [], error: "Se requiere al menos la calle y el municipio" });
  }

  const url = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=${encodeURIComponent(provincia)}&Municipio=${encodeURIComponent(municipio)}&SiglaVia=&NombreVia=${encodeURIComponent(via)}&TipoNum=NUM&NumeroVia=${encodeURIComponent(numero)}&PlantaBaja=&Escalera=&Planta=&Puerta=&CodPostal=`;

  let xmlText: string;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": UA, "Accept": "text/xml, application/xml, */*" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return res.json({ results: [] });
    xmlText = await response.text();
    if (xmlText.trim().startsWith("<html") || xmlText.trim().startsWith("<!DOCTYPE")) {
      return res.json({ results: [], error: "La API del Catastro devolvió un error inesperado" });
    }
  } catch (err: any) {
    const msg = err?.name === "AbortError" ? "Timeout conectando con el Catastro" : "No se pudo conectar con el Catastro";
    return res.json({ results: [], error: msg });
  }

  let parsed: any;
  try { parsed = parser.parse(xmlText); }
  catch { return res.json({ results: [], error: "Respuesta XML inválida del Catastro" }); }

  // The address search uses Consulta_DNPRC — response root is consulta_dnprcResult
  const root: any =
    parsed?.["consulta_dnprc"] ??
    parsed?.["consulta_dnprcResult"] ??
    parsed?.["consulta_dnp"];

  if (!root) {
    console.error("[catastro/search] unknown root keys:", Object.keys(parsed ?? {}));
    return res.json({ results: [] });
  }

  // Error check
  const errNode = first(root?.["lerr"]?.["err"]) ?? root?.["err"];
  const errorCod = str(errNode?.["cod"]);
  if (errorCod && errorCod !== "0") {
    return res.json({ results: [], error: `Catastro: ${str(errNode?.["des"]) || "sin resultados"} (cod ${errorCod})` });
  }

  // Results array: root.lrcdnp.rcdnp (may be object or array)
  const lrcdnp: any = root?.["lrcdnp"];
  const rcdnpRaw  = lrcdnp?.["rcdnp"] ?? root?.["rcdnp"];
  const rcdnpArr: any[] = Array.isArray(rcdnpRaw) ? rcdnpRaw : rcdnpRaw ? [rcdnpRaw] : [];

  if (rcdnpArr.length === 0) return res.json({ results: [] });

  // For each result build a basic record; then enrich first 5 with detail call
  const basicResults = rcdnpArr.slice(0, 10).map((item: any) => {
    const bico = item?.["bico"] ?? item;
    const rcObj = bico?.["rc"];
    const rc = str(rcObj?.["pc1"]) + str(rcObj?.["pc2"]) + str(rcObj?.["car"]) + str(rcObj?.["cc1"]) + str(rcObj?.["cc2"]);
    const dir = bico?.["dt"]?.["locs"]?.["lous"]?.["lourb"]?.["dir"]
             ?? bico?.["dt"]?.["locs"]?.["lous"]?.["lourb"]
             ?? item?.["dt"]?.["locs"]?.["lous"]?.["lourb"]?.["dir"]
             ?? {};
    const nv  = str(dir?.["nv"])  || str(item?.["ldt"]);
    const pnp = str(dir?.["pnp"]) || str(dir?.["dnp"]);
    const dm  = bico?.["dt"]?.["locs"]?.["lous"]?.["lourb"]?.["dm"]
             ?? item?.["dt"]?.["locs"]?.["lous"]?.["lourb"]?.["dm"]
             ?? {};
    const muni = str(dm?.["nm"]) || str(item?.["dt"]?.["np"]);
    const prov = str(dm?.["np"]) || str(item?.["dt"]?.["locs"]?.["np"]);
    const ldt  = str(item?.["ldt"]) || str(bico?.["ldt"]);
    const addr = nv ? (pnp ? `${nv} ${pnp}` : nv) : "";
    return { rc: rc.replace(/\s+/g, ""), address: addr || undefined, municipio: muni || undefined, provincia: prov || undefined, tipo: ldt || undefined };
  }).filter(r => r.rc.length >= 14);

  // Enrich up to 5 results with detail (year + area) — fire & forget errors
  const enriched = await Promise.allSettled(
    basicResults.slice(0, 5).map(async (r) => {
      if (!r.rc) return r;
      const cached = cache.get(r.rc);
      if (cached && cached.expiresAt > Date.now()) {
        return { ...r, anyoConstruccion: cached.data.constructionYear ? parseInt(cached.data.constructionYear) : undefined, superficieM2: cached.data.totalArea ? parseFloat(cached.data.totalArea) : undefined };
      }
      try {
        const detailUrl = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC=${encodeURIComponent(r.rc)}`;
        const dr = await fetch(detailUrl, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(6_000) });
        if (!dr.ok) return r;
        const dXml = await dr.text();
        if (dXml.trim().startsWith("<html")) return r;
        const dp = parser.parse(dXml);
        const droot: any = dp?.["consulta_dnp"] ?? dp?.["consulta_dnprcResult"];
        const dbico = first(Array.isArray(droot?.["bico"]) ? droot?.["bico"] : [droot?.["bico"]]);
        const dbi: any = first(Array.isArray(dbico?.["bi"]) ? dbico?.["bi"] : [dbico?.["bi"]]) ?? dbico;
        const ddt: any = first(Array.isArray(dbi?.["dt"]) ? dbi?.["dt"] : [dbi?.["dt"]]) ?? dbi?.["debi"];
        const ant = str(ddt?.["ant"]);
        const sfc = str(ddt?.["sco"]) || str(ddt?.["sfc"]) || str(ddt?.["stl"]);
        const uso = str(ddt?.["luso"]) || str(ddt?.["uso"]);
        const cacheData: CatastroData = {
          constructionYear: ant || undefined,
          totalArea: sfc ? String(Math.round(parseFloat(sfc))) : undefined,
          propertyType: uso ? mapUso(uso) : undefined,
        };
        cache.set(r.rc, { data: cacheData, expiresAt: Date.now() + CACHE_TTL_MS });
        return {
          ...r,
          tipo: uso ? mapUso(uso) : r.tipo,
          anyoConstruccion: ant ? parseInt(ant) : undefined,
          superficieM2: sfc ? Math.round(parseFloat(sfc)) : undefined,
        };
      } catch {
        return r;
      }
    })
  );

  const results = [
    ...enriched.map(e => e.status === "fulfilled" ? e.value : null).filter(Boolean),
    ...basicResults.slice(5),
  ];

  return res.json({ results });
});

export default router;
