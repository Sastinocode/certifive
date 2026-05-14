// @ts-nocheck
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CE3XExportData {
  cert: {
    id: number;
    ownerName: string;
    ownerDni?: string;
    propertyAddress: string;
    cadastralRef?: string;
    rooms?: number;
    buildingFloors?: number;
    propertyFloors?: number;
    roofType?: string;
    heatingSystem?: string;
    waterHeatingType?: string;
    airConditioningSystem?: string;
    facadeOrientation?: string;
    windowDetails?: string;
    energyRating?: string;
    createdAt?: string;
  };
  certifier: {
    name?: string;
    firstName?: string;
    company?: string;
    licenseNumber?: string;
    email?: string;
    phone?: string;
    province?: string;
  };
  envelope?: Array<{
    tipo: string;
    nombre: string;
    orientacion?: string;
    superficieM2?: string;
    transmitanciaU?: string;
    metodo?: string;
    descripcion?: string;
  }>;
  openings?: Array<{
    tipo: string;
    orientacion?: string;
    superficieM2?: string;
    transmitanciaUMarco?: string;
    transmitanciaUVidrio?: string;
    factorSolar?: string;
    metodo?: string;
    descripcion?: string;
  }>;
  installations?: Array<{
    sistema: string;
    tipo: string;
    vectorEnergetico?: string;
    rendimiento?: string;
    potenciaKw?: string;
    anyoInstalacion?: number;
    notas?: string;
  }>;
  measures?: Array<{
    tipo: string;
    descripcion: string;
    elementoAfectado?: string;
    costeEstimadoEur?: string;
    ahorroEnergiaPct?: string;
    mejoraCalificacionEsperada?: string;
  }>;
  tecnicoFormData?: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DARK_GREEN: [number, number, number] = [6, 78, 59];    // emerald-900
const MID_GREEN:  [number, number, number] = [13, 124, 102]; // emerald-700
const LIGHT_GREEN:[number, number, number] = [209, 250, 229]; // emerald-100
const SLATE:      [number, number, number] = [71, 85, 105];
const DARK:       [number, number, number] = [15, 23, 42];
const LIGHT_BG:   [number, number, number] = [249, 250, 251];

function fmt(v: any, fallback = "—"): string {
  if (v === null || v === undefined || v === "") return fallback;
  return String(v);
}

function fileDate(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function safeRef(data: CE3XExportData): string {
  return (data.cert.cadastralRef || `ID${data.cert.id}`).replace(/[^a-zA-Z0-9_-]/g, "_");
}

function certifierName(c: CE3XExportData["certifier"]): string {
  return c.name || c.firstName || "—";
}

const SISTEMA_CE3X: Record<string, string> = {
  calefaccion:   "Generadores de calor",
  refrigeracion: "Generadores de frío",
  acs:           "Instalaciones de ACS",
  iluminacion:   "Iluminación",
};

const TIPO_CE3X_ENVOLVENTE: Record<string, string> = {
  fachada:    "Fachada",
  cubierta:   "Cubierta",
  suelo:      "Suelo",
  medianeria: "Partición interior",
};

const TIPO_CE3X_HUECO: Record<string, string> = {
  ventana:    "Hueco",
  puerta:     "Puerta",
  lucernario: "Lucernario",
};

// ─────────────────────────────────────────────────────────────────────────────
// Extract rows from tecnicoFormData (Modo B) when Modo A data is missing
// ─────────────────────────────────────────────────────────────────────────────

function extractEnvelopeFromModoB(fd: any): Array<any> {
  if (!fd) return [];
  const rows: any[] = [];
  const numFachadas = fd.numFachadas ?? 0;
  for (let i = 0; i < numFachadas; i++) {
    const f = fd.fachadas?.[i];
    if (!f) continue;
    rows.push({
      nombre: `Fachada ${i + 1}`,
      tipo: "Fachada",
      orientacion: "—",
      superficieM2: "—",
      transmitanciaU: "—",
      metodo: "Por defecto CE3X",
      descripcion: `Material: ${f.material || "—"} · Aislamiento: ${f.aislamiento || "—"} [Fuente: formulario propietario]`,
    });
  }
  if (fd.esUltimaPlanta === "si") {
    rows.push({
      nombre: "Cubierta",
      tipo: "Cubierta",
      orientacion: "Horizontal",
      superficieM2: "—",
      transmitanciaU: "—",
      metodo: "Por defecto CE3X",
      descripcion: `Aislamiento: ${fd.aislamientoCubierta || "—"} [Fuente: formulario propietario]`,
    });
  }
  return rows;
}

function extractOpeningsFromModoB(fd: any): Array<any> {
  if (!fd) return [];
  const rows: any[] = [];
  const numVentanas = fd.numVentanas ?? 0;
  for (let i = 0; i < numVentanas; i++) {
    const v = fd.ventanas?.[i];
    if (!v) continue;
    rows.push({
      tipo: "Hueco",
      orientacion: "—",
      superficieM2: "—",
      transmitanciaUMarco: "—",
      transmitanciaUVidrio: "—",
      factorSolar: "—",
      metodo: "Por defecto CE3X",
      descripcion: `Vidrio: ${v.tipoVidrio || "—"} · Marco: ${v.tipoMarco || "—"} [Fuente: formulario propietario]`,
    });
  }
  return rows;
}

function extractInstallationsFromModoB(fd: any): Array<any> {
  if (!fd) return [];
  const rows: any[] = [];
  if (fd.tipoCalefaccion && fd.tipoCalefaccion !== "no_calefaccion") {
    rows.push({
      sistema: "Generadores de calor",
      tipo: fd.tipoCalefaccion,
      vectorEnergetico: "—",
      rendimiento: "—",
      potenciaKw: "—",
      anyoInstalacion: "—",
      notas: "[Fuente: formulario propietario]",
    });
  }
  if (fd.tipoACS) {
    rows.push({
      sistema: "Instalaciones de ACS",
      tipo: fd.tipoACS,
      vectorEnergetico: "—",
      rendimiento: "—",
      potenciaKw: "—",
      anyoInstalacion: "—",
      notas: "[Fuente: formulario propietario]",
    });
  }
  if (fd.tieneAire === "si" && fd.tipoAire) {
    rows.push({
      sistema: "Generadores de frío",
      tipo: fd.tipoAire,
      vectorEnergetico: "—",
      rendimiento: "—",
      potenciaKw: "—",
      anyoInstalacion: "—",
      notas: "[Fuente: formulario propietario]",
    });
  }
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF helper: draw a table
// ─────────────────────────────────────────────────────────────────────────────

function drawTable(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  startY: number,
  colWidths: number[],
  marginL = 14,
): number {
  const ROW_H = 8;
  const HEADER_H = 9;
  let y = startY;

  // Header row
  doc.setFillColor(...MID_GREEN);
  doc.rect(marginL, y, colWidths.reduce((a, b) => a + b, 0), HEADER_H, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  let x = marginL;
  headers.forEach((h, i) => {
    doc.text(h, x + 2, y + 6);
    x += colWidths[i];
  });
  y += HEADER_H;

  // Data rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  rows.forEach((row, ri) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    if (ri % 2 === 0) {
      doc.setFillColor(...LIGHT_BG);
      doc.rect(marginL, y, colWidths.reduce((a, b) => a + b, 0), ROW_H, "F");
    }
    doc.setTextColor(...DARK);
    x = marginL;
    row.forEach((cell, ci) => {
      const maxW = colWidths[ci] - 4;
      const lines = doc.splitTextToSize(cell, maxW);
      doc.text(lines[0], x + 2, y + 5.5);
      x += colWidths[ci];
    });
    y += ROW_H;
  });

  return y + 4;
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const W = 210;
  const Y = 289;
  doc.setFillColor(...DARK_GREEN);
  doc.rect(0, Y - 2, W, 12, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text("Generado por Certifive · certifive.es", 14, Y + 4);
  doc.text(new Date().toLocaleDateString("es-ES"), W / 2, Y + 4, { align: "center" });
  doc.text(`Página ${pageNum} de ${totalPages}`, W - 14, Y + 4, { align: "right" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(5.5);
  doc.setTextColor(180, 220, 200);
  doc.text(
    "Este documento es un apoyo para la introducción de datos en CE3X. No sustituye al certificado oficial.",
    W / 2, Y + 8, { align: "center" }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// exportCE3XPdf
// ─────────────────────────────────────────────────────────────────────────────

export function exportCE3XPdf(data: CE3XExportData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const ML = 14;
  const MR = W - ML;

  const fd = data.tecnicoFormData;
  const envelopeRows = (data.envelope && data.envelope.length > 0)
    ? data.envelope
    : extractEnvelopeFromModoB(fd);
  const openingRows = (data.openings && data.openings.length > 0)
    ? data.openings
    : extractOpeningsFromModoB(fd);
  const installRows = (data.installations && data.installations.length > 0)
    ? data.installations
    : extractInstallationsFromModoB(fd);
  const measureRows = data.measures ?? [];

  // ── PAGE 1 ────────────────────────────────────────────────────────────────

  // Header band
  doc.setFillColor(...DARK_GREEN);
  doc.rect(0, 0, W, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("CERTIFIVE", ML, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(180, 220, 200);
  doc.text("Datos listos para CE3X", MR, 15, { align: "right" });
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Ref. Catastral: ${fmt(data.cert.cadastralRef)} · Generado: ${new Date().toLocaleDateString("es-ES")}`,
    ML, 24
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(data.cert.ownerName || "—", MR, 24, { align: "right" });

  let y = 42;

  // ── SECCIÓN 1: Técnico ────────────────────────────────────────────────────
  doc.setFillColor(...LIGHT_BG);
  doc.rect(ML, y - 2, MR - ML, 36, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MID_GREEN);
  doc.text("TÉCNICO CERTIFICADOR", ML + 3, y + 4);

  const c = data.certifier;
  const techRows: [string, string][] = [
    ["Nombre completo",   certifierName(c)],
    ["Empresa",           fmt(c.company)],
    ["NIF / Licencia",    fmt(c.licenseNumber)],
    ["Email",             fmt(c.email)],
    ["Teléfono",          fmt(c.phone)],
    ["Provincia",         fmt(c.province)],
  ];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  let ty = y + 11;
  techRows.forEach(([lbl, val]) => {
    doc.setFont("helvetica", "bold");
    doc.text(lbl + ":", ML + 3, ty);
    doc.setFont("helvetica", "normal");
    doc.text(val, ML + 50, ty);
    ty += 5;
  });
  y += 42;

  // ── SECCIÓN 2: Inmueble ───────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MID_GREEN);
  doc.text("DATOS DEL INMUEBLE", ML, y);
  doc.setDrawColor(...MID_GREEN);
  doc.setLineWidth(0.4);
  doc.line(ML, y + 2, MR, y + 2);
  y += 6;

  const inmuebleRows: string[][] = [
    ["Nombre del inmueble",       fmt(data.cert.propertyAddress)],
    ["Referencia catastral",      fmt(data.cert.cadastralRef)],
    ["Dirección",                 fmt(data.cert.propertyAddress)],
    ["Número de plantas totales", fmt(data.cert.buildingFloors)],
    ["Planta del inmueble",       fmt(data.cert.propertyFloors)],
    ["Habitaciones",              fmt(data.cert.rooms)],
    ["Tipo de cubierta",          fmt(data.cert.roofType)],
    ["Orientación fachada ppal.", fmt(data.cert.facadeOrientation)],
    ["Ventanas",                  fmt(data.cert.windowDetails)],
    ["Calificación energética",   fmt(data.cert.energyRating)],
  ];

  y = drawTable(doc, ["Campo CE3X", "Valor"], inmuebleRows, y, [80, 116], ML);
  y += 4;

  // ── SECCIÓN 3: Envolvente ─────────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MID_GREEN);
  doc.text("ENVOLVENTE TÉRMICA", ML, y);
  doc.line(ML, y + 2, MR, y + 2);
  y += 6;

  if (envelopeRows.length > 0) {
    const envTableRows = envelopeRows.map(el => [
      el.nombre ?? "—",
      TIPO_CE3X_ENVOLVENTE[el.tipo?.toLowerCase()] ?? el.tipo ?? "—",
      fmt(el.orientacion),
      fmt(el.superficieM2),
      fmt(el.transmitanciaU),
      el.metodo === "por_defecto" ? "CE3X por defecto" : (el.metodo ?? "—"),
    ]);
    y = drawTable(doc,
      ["Elemento", "Tipo CE3X", "Orient.", "Sup. m²", "U (W/m²K)", "Método"],
      envTableRows, y, [42, 32, 18, 18, 20, 52], ML);
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    doc.text("Sin datos de envolvente registrados.", ML, y + 5);
    y += 12;
  }
  y += 4;

  // ── SECCIÓN 4: Huecos ─────────────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MID_GREEN);
  doc.text("HUECOS (VENTANAS Y PUERTAS)", ML, y);
  doc.line(ML, y + 2, MR, y + 2);
  y += 6;

  if (openingRows.length > 0) {
    const opTableRows = openingRows.map(op => [
      TIPO_CE3X_HUECO[op.tipo?.toLowerCase()] ?? op.tipo ?? "—",
      fmt(op.orientacion),
      fmt(op.superficieM2),
      fmt(op.transmitanciaUMarco),
      fmt(op.transmitanciaUVidrio),
      fmt(op.factorSolar),
      op.metodo === "por_defecto" ? "CE3X por defecto" : (op.metodo ?? "—"),
    ]);
    y = drawTable(doc,
      ["Tipo CE3X", "Orient.", "Sup. m²", "U Marco", "U Vidrio", "F. Solar", "Método"],
      opTableRows, y, [25, 16, 18, 18, 18, 18, 69], ML);
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    doc.text("Sin huecos registrados.", ML, y + 5);
    y += 12;
  }
  y += 4;

  // ── SECCIÓN 5: Instalaciones ───────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MID_GREEN);
  doc.text("INSTALACIONES", ML, y);
  doc.line(ML, y + 2, MR, y + 2);
  y += 6;

  if (installRows.length > 0) {
    const instTableRows = installRows.map(inst => [
      SISTEMA_CE3X[inst.sistema?.toLowerCase()] ?? inst.sistema ?? "—",
      fmt(inst.tipo),
      fmt(inst.vectorEnergetico),
      fmt(inst.rendimiento),
      fmt(inst.potenciaKw),
      fmt(inst.anyoInstalacion),
    ]);
    y = drawTable(doc,
      ["Sistema CE3X", "Tipo equipo", "Vector energético", "Rendim.", "kW", "Año"],
      instTableRows, y, [38, 38, 38, 18, 14, 36], ML);
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    doc.text("Sin instalaciones registradas.", ML, y + 5);
    y += 12;
  }
  y += 4;

  // ── SECCIÓN 6: Medidas de mejora ──────────────────────────────────────────
  if (measureRows.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...MID_GREEN);
    doc.text("MEDIDAS DE MEJORA", ML, y);
    doc.line(ML, y + 2, MR, y + 2);
    y += 6;

    const mTableRows = measureRows.map(m => [
      m.tipo ?? "—",
      m.descripcion ?? "—",
      fmt(m.elementoAfectado),
      fmt(m.costeEstimadoEur),
      fmt(m.ahorroEnergiaPct),
      fmt(m.mejoraCalificacionEsperada),
    ]);
    drawTable(doc,
      ["Tipo", "Descripción", "Elemento afectado", "Coste €", "Ahorro %", "Mejora calif."],
      mTableRows, y, [22, 54, 36, 18, 18, 34], ML);
  }

  // ── Footers ───────────────────────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    addFooter(doc, i, total);
  }

  doc.save(`CE3X_${safeRef(data)}_${fileDate()}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// exportCE3XExcel
// ─────────────────────────────────────────────────────────────────────────────

function makeHeaderStyle() {
  return { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "064E3B" } } };
}

function sheetWithHeaders(headers: string[], rows: any[][]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  // Auto column width
  const colWidths = headers.map((h, i) => {
    const maxLen = rows.reduce((acc, row) => Math.max(acc, String(row[i] ?? "").length), h.length);
    return { wch: Math.min(maxLen + 2, 50) };
  });
  ws["!cols"] = colWidths;
  return ws;
}

export function exportCE3XExcel(data: CE3XExportData): void {
  const wb = XLSX.utils.book_new();
  const fd = data.tecnicoFormData;

  const envelopeData = (data.envelope && data.envelope.length > 0)
    ? data.envelope
    : extractEnvelopeFromModoB(fd);
  const openingData = (data.openings && data.openings.length > 0)
    ? data.openings
    : extractOpeningsFromModoB(fd);
  const installData = (data.installations && data.installations.length > 0)
    ? data.installations
    : extractInstallationsFromModoB(fd);
  const measureData = data.measures ?? [];

  const c = data.certifier;

  // ── PESTAÑA 1: Inmueble y Técnico ─────────────────────────────────────────
  const tab1Rows: any[][] = [
    // Técnico
    ["TÉCNICO CERTIFICADOR", ""],
    ["Nombre completo",    certifierName(c)],
    ["Empresa",           fmt(c.company)],
    ["NIF / Licencia",    fmt(c.licenseNumber)],
    ["Email",             fmt(c.email)],
    ["Teléfono",          fmt(c.phone)],
    ["Provincia",         fmt(c.province)],
    ["", ""],
    // Inmueble
    ["INMUEBLE", ""],
    ["Nombre del inmueble",        fmt(data.cert.propertyAddress)],
    ["Referencia catastral",       fmt(data.cert.cadastralRef)],
    ["Dirección",                  fmt(data.cert.propertyAddress)],
    ["Número de plantas totales",  fmt(data.cert.buildingFloors)],
    ["Planta del inmueble",        fmt(data.cert.propertyFloors)],
    ["Habitaciones",               fmt(data.cert.rooms)],
    ["Tipo de cubierta",           fmt(data.cert.roofType)],
    ["Orientación fachada ppal.",  fmt(data.cert.facadeOrientation)],
    ["Ventanas",                   fmt(data.cert.windowDetails)],
    ["Calificación energética",    fmt(data.cert.energyRating)],
    ["Fecha solicitud",            data.cert.createdAt ? new Date(data.cert.createdAt).toLocaleDateString("es-ES") : "—"],
    ["", ""],
    ["Nota", "Este documento es un apoyo para la introducción de datos en CE3X. No sustituye al certificado oficial."],
  ];
  const ws1 = sheetWithHeaders(["Campo CE3X", "Valor"], tab1Rows);
  XLSX.utils.book_append_sheet(wb, ws1, "Inmueble y Técnico");

  // ── PESTAÑA 2: Envolvente ─────────────────────────────────────────────────
  const envHeaders = ["Elemento", "Tipo CE3X", "Orientación", "Superficie m²", "Transmitancia U", "Método", "Descripción"];
  const envRows = envelopeData.map(el => [
    el.nombre ?? "—",
    TIPO_CE3X_ENVOLVENTE[el.tipo?.toLowerCase()] ?? el.tipo ?? "—",
    fmt(el.orientacion),
    fmt(el.superficieM2),
    fmt(el.transmitanciaU),
    el.metodo === "por_defecto" ? "CE3X por defecto" : fmt(el.metodo),
    fmt(el.descripcion),
  ]);
  XLSX.utils.book_append_sheet(wb, sheetWithHeaders(envHeaders, envRows), "Envolvente");

  // ── PESTAÑA 3: Huecos ─────────────────────────────────────────────────────
  const opHeaders = ["Tipo CE3X", "Fachada asociada", "Orientación", "Superficie m²", "U Marco", "U Vidrio", "Factor Solar", "Permeabilidad", "Método"];
  const opRows = openingData.map(op => [
    TIPO_CE3X_HUECO[op.tipo?.toLowerCase()] ?? op.tipo ?? "—",
    "—",
    fmt(op.orientacion),
    fmt(op.superficieM2),
    fmt(op.transmitanciaUMarco),
    fmt(op.transmitanciaUVidrio),
    fmt(op.factorSolar),
    "—",
    op.metodo === "por_defecto" ? "CE3X por defecto" : fmt(op.metodo),
  ]);
  XLSX.utils.book_append_sheet(wb, sheetWithHeaders(opHeaders, opRows), "Huecos");

  // ── PESTAÑA 4: Instalaciones ──────────────────────────────────────────────
  const instHeaders = ["Sistema CE3X", "Tipo equipo", "Vector energético", "Rendimiento (%)", "Potencia (kW)", "Año instalación", "Notas"];
  const instRows = installData.map(inst => [
    SISTEMA_CE3X[inst.sistema?.toLowerCase()] ?? inst.sistema ?? "—",
    fmt(inst.tipo),
    fmt(inst.vectorEnergetico),
    fmt(inst.rendimiento),
    fmt(inst.potenciaKw),
    fmt(inst.anyoInstalacion),
    fmt(inst.notas),
  ]);
  XLSX.utils.book_append_sheet(wb, sheetWithHeaders(instHeaders, instRows), "Instalaciones");

  // ── PESTAÑA 5: Medidas de mejora ──────────────────────────────────────────
  const mHeaders = ["Tipo", "Descripción", "Elemento afectado", "Coste estimado (€)", "Ahorro energía (%)", "Mejora calificación esperada"];
  const mRows = measureData.map(m => [
    m.tipo ?? "—",
    m.descripcion ?? "—",
    fmt(m.elementoAfectado),
    fmt(m.costeEstimadoEur),
    fmt(m.ahorroEnergiaPct),
    fmt(m.mejoraCalificacionEsperada),
  ]);
  XLSX.utils.book_append_sheet(wb, sheetWithHeaders(mHeaders, mRows), "Medidas de mejora");

  XLSX.writeFile(wb, `CE3X_${safeRef(data)}_${fileDate()}.xlsx`);
}
