import { Router } from "express";
import { XMLParser } from "fast-xml-parser";

const router = Router();

// ── In-memory cache: RC → { data, expiresAt } ───────────────────────────────
interface CatastroData {
  address?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  comunidadAutonoma?: string;
  constructionYear?: string;
  totalArea?: string;
  propertyType?: string;
}

const cache = new Map<string, { data: CatastroData; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── XML parser instance ──────────────────────────────────────────────────────
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  ignoreDeclaration: true,
  trimValues: true,
});

// ── USO catastral → tipo de inmueble ────────────────────────────────────────
function mapUso(uso: string): string {
  const u = (uso || "").toUpperCase().trim();
  if (u === "V" || u === "VPO") return "Piso/Apartamento";
  if (u === "I") return "Nave industrial";
  if (u === "C") return "Local comercial";
  if (u === "O" || u === "OF") return "Oficinas";
  if (u === "E") return "Edificio de viviendas";
  if (u === "R" || u === "CH") return "Vivienda unifamiliar";
  return "";
}

// ── Helper: safe string from parsed XML (may be string | object) ─────────────
function str(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    const o = val as Record<string, unknown>;
    if (o["#text"] != null) return str(o["#text"]);
  }
  return "";
}

// ── GET /api/catastro/lookup?rc=<referencia_catastral> ───────────────────────
router.get("/lookup", async (req, res) => {
  const rc = (req.query.rc as string | undefined)?.trim().toUpperCase();

  if (!rc || rc.length < 14) {
    return res.status(400).json({ error: "Referencia catastral no válida (mínimo 14 caracteres)" });
  }

  // Serve from cache if still fresh
  const cached = cache.get(rc);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json({ ok: true, data: cached.data, source: "cache" });
  }

  // Fetch from Catastro (backend only — avoids CORS from browser)
  const url = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC=${encodeURIComponent(rc)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  let xmlText: string;
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "Accept": "text/xml, application/xml" },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({ error: `Catastro devolvió HTTP ${response.status}` });
    }
    xmlText = await response.text();
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === "AbortError") {
      return res.status(504).json({ error: "La API del Catastro tardó demasiado (timeout 8s)" });
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

  // Navigate the response tree
  // Expected path: consulta_dnprcResult → bico → bi → ldt  (localización datos técnicos)
  //                                               bi → dt   (datos técnicos)
  const root =
    parsed?.["consulta_dnprcResult"] ??
    parsed?.["ns1:consulta_dnprcResult"] ??
    parsed?.["soap:Envelope"]?.["soap:Body"]?.["consulta_dnprcResult"];

  if (!root) {
    return res.status(404).json({ error: "Referencia catastral no encontrada o respuesta inesperada" });
  }

  // Error code from Catastro
  const errorCod = str(root?.["lerr"]?.["err"]?.["cod"]) || str(root?.["err"]?.["cod"]);
  if (errorCod && errorCod !== "0") {
    const errorDesc = str(root?.["lerr"]?.["err"]?.["des"]) || str(root?.["err"]?.["des"]) || "RC no encontrada";
    return res.status(404).json({ error: `Catastro: ${errorDesc}` });
  }

  // bico can be an array (multiple parcels); take first
  const bicoRaw = root?.["bico"];
  const bico = Array.isArray(bicoRaw) ? bicoRaw[0] : bicoRaw;
  const bi = bico?.["bi"] ?? bico;
  const biArray = Array.isArray(bi) ? bi[0] : bi;

  // Localización
  const locs = biArray?.["locs"] ?? biArray?.["loc"];
  const locFirst = Array.isArray(locs) ? locs[0] : locs;
  const ldt = locFirst?.["ldt"] ?? locFirst;

  // Dirección
  const ldts = str(ldt?.["ds"]?.["lorus"]) || str(ldt?.["lorus"]) || str(ldt);
  const via = str(ldt?.["locs"]?.["lorus"] ?? ldt?.["lorus"]);
  const numViaDt = str(ldt?.["locs"]?.["loint"]?.["pnp"] ?? ldt?.["loint"]?.["pnp"]);
  const cp = str(ldt?.["dp"]) || str(locFirst?.["dp"]);
  const municipio = str(ldt?.["nm"]) || str(locFirst?.["nm"]);
  const provincia = str(ldt?.["np"]) || str(locFirst?.["np"]);
  const comunidad = str(ldt?.["nca"]) || str(locFirst?.["nca"]);

  // Build address string
  let addressStr = str(ldt?.["ds"]?.["lorus"] ?? ldt?.["lorus"] ?? ldts);
  if (numViaDt) addressStr = `${addressStr} ${numViaDt}`.trim();
  const piso = str(ldt?.["loint"]?.["pt"]);
  const puerta = str(ldt?.["loint"]?.["pu"]);
  if (piso) addressStr = `${addressStr}, ${piso}${puerta ? ` ${puerta}` : ""}`.trim();

  // Datos técnicos
  const dt = biArray?.["debi"] ?? biArray?.["dt"];
  const dtFirst = Array.isArray(dt) ? dt[0] : dt;

  const anoConst = str(dtFirst?.["ant"]);
  const superficie = str(dtFirst?.["sfc"]) || str(dtFirst?.["stl"]) || str(dtFirst?.["scons"]);
  const uso = str(dtFirst?.["luso"]) || str(dtFirst?.["uso"]);

  const data: CatastroData = {
    address: addressStr || undefined,
    city: municipio || undefined,
    postalCode: cp || undefined,
    province: provincia || undefined,
    comunidadAutonoma: comunidad || undefined,
    constructionYear: anoConst || undefined,
    totalArea: superficie ? String(Math.round(parseFloat(superficie))) : undefined,
    propertyType: uso ? mapUso(uso) : undefined,
  };

  // Remove undefined keys
  Object.keys(data).forEach(k => {
    if ((data as any)[k] === undefined) delete (data as any)[k];
  });

  // Store in cache
  cache.set(rc, { data, expiresAt: Date.now() + CACHE_TTL_MS });

  return res.json({ ok: true, data, source: "api" });
});

export default router;
