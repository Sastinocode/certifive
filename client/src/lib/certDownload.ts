import { jsPDF } from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
} from "docx";
import * as XLSX from "xlsx";

export interface CertData {
  id: number;
  ownerName: string;
  ownerDni: string;
  propertyAddress: string;
  email: string | null;
  phone: string | null;
  cadastralRef: string;
  energyRating: string | null;
  status: string;
  createdAt: Date | string | null;
  rooms: number | null;
  facadeOrientation: string | null;
  heatingSystem: string | null;
  waterHeatingType: string | null;
  buildingFloors: number | null;
  propertyFloors: number | null;
  windowDetails: string | null;
  roofType: string | null;
  airConditioningSystem: string | null;
}

function fileDate(cert: CertData): string {
  const d = cert.createdAt ? new Date(cert.createdAt) : new Date();
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function safeRef(cert: CertData): string {
  return (cert.cadastralRef || `ID${cert.id}`).replace(/[^a-zA-Z0-9_-]/g, "_");
}

function fmt(v: string | number | null | undefined, fallback = "—"): string {
  if (v === null || v === undefined || v === "") return fallback;
  return String(v);
}

const STATUS_MAP: Record<string, string> = {
  nuevo: "Nuevo",
  pending: "Pendiente",
  draft: "Borrador",
  "en proceso": "En Proceso",
  completed: "Finalizado",
  finalizado: "Finalizado",
};

function statusLabel(s: string): string {
  return STATUS_MAP[s?.toLowerCase()] ?? s ?? "—";
}

function buildRows(cert: CertData): Array<[string, string]> {
  return [
    ["Referencia Catastral", fmt(cert.cadastralRef)],
    ["Propietario", fmt(cert.ownerName)],
    ["DNI / NIF", fmt(cert.ownerDni)],
    ["Dirección del inmueble", fmt(cert.propertyAddress)],
    ["Email", fmt(cert.email)],
    ["Teléfono", fmt(cert.phone)],
    ["Calificación energética", fmt(cert.energyRating)],
    ["Estado", statusLabel(cert.status)],
    ["Fecha de solicitud", cert.createdAt ? new Date(cert.createdAt).toLocaleDateString("es-ES") : "—"],
    ["Habitaciones", fmt(cert.rooms)],
    ["Plantas del edificio", fmt(cert.buildingFloors)],
    ["Plantas del inmueble", fmt(cert.propertyFloors)],
    ["Orientación fachada", fmt(cert.facadeOrientation)],
    ["Tipo de cubierta", fmt(cert.roofType)],
    ["Sistema de calefacción", fmt(cert.heatingSystem)],
    ["Sistema de agua caliente", fmt(cert.waterHeatingType)],
    ["Sistema de refrigeración", fmt(cert.airConditioningSystem)],
    ["Detalles de ventanas", fmt(cert.windowDetails)],
  ];
}

export function downloadPDF(cert: CertData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const rows = buildRows(cert);
  const dateStr = cert.createdAt ? new Date(cert.createdAt).toLocaleDateString("es-ES") : new Date().toLocaleDateString("es-ES");

  const TEAL = [13, 124, 102] as [number, number, number];
  const DARK = [15, 23, 42] as [number, number, number];
  const LIGHT_BG = [248, 250, 252] as [number, number, number];

  const W = 210;
  const ML = 14;
  const MR = W - ML;
  const CW = MR - ML;

  doc.setFillColor(...TEAL);
  doc.rect(0, 0, W, 38, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("CERTIFIVE", ML, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Certificación de Eficiencia Energética", ML, 23);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`CEE — ${cert.cadastralRef || `#${cert.id}`}`, ML, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generado: ${dateStr}`, MR, 32, { align: "right" });

  if (cert.energyRating) {
    const RATING_COLORS: Record<string, [number, number, number]> = {
      A: [0, 153, 68],
      B: [0, 166, 81],
      C: [121, 188, 0],
      D: [255, 239, 0],
      E: [255, 183, 0],
      F: [240, 90, 40],
      G: [218, 37, 29],
    };
    const rColor = RATING_COLORS[cert.energyRating.toUpperCase()] ?? [200, 200, 200];
    doc.setFillColor(...rColor);
    doc.roundedRect(MR - 18, 8, 16, 16, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(cert.energyRating.toUpperCase(), MR - 10, 20, { align: "center" });
  }

  let y = 50;
  const ROW_H = 9;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEAL);
  doc.text("Datos del Certificado de Eficiencia Energética", ML, y);
  y += 6;
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.5);
  doc.line(ML, y, MR, y);
  y += 6;

  rows.forEach(([label, value], i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    if (i % 2 === 0) {
      doc.setFillColor(...LIGHT_BG);
      doc.rect(ML, y - 5, CW, ROW_H, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text(label, ML + 2, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const maxW = CW - 75;
    const lines = doc.splitTextToSize(value, maxW);
    doc.text(lines, ML + 72, y);

    y += Math.max(ROW_H, lines.length * 4.5);
  });

  y += 10;
  doc.setFillColor(...TEAL);
  doc.rect(0, 285, W, 12, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text("CERTIFIVE — Plataforma de Gestión de Certificaciones Energéticas", W / 2, 292, { align: "center" });

  const filename = `CEE_${safeRef(cert)}_${fileDate(cert)}.pdf`;
  doc.save(filename);
}

export async function downloadWord(cert: CertData): Promise<void> {
  const rows = buildRows(cert);

  const TEAL_HEX = "0D7C66";

  const headerPara = new Paragraph({
    children: [
      new TextRun({ text: "CERTIFIVE", bold: true, size: 36, color: TEAL_HEX }),
      new TextRun({ text: " — Certificación de Eficiencia Energética", size: 24, color: "555555", break: 1 }),
    ],
    spacing: { after: 200 },
  });

  const titlePara = new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [
      new TextRun({
        text: `CEE — ${cert.cadastralRef || `#${cert.id}`}`,
        color: TEAL_HEX,
        bold: true,
        size: 28,
      }),
    ],
    spacing: { after: 300 },
  });

  const subtitlePara = new Paragraph({
    children: [
      new TextRun({
        text: `Fecha de solicitud: ${cert.createdAt ? new Date(cert.createdAt).toLocaleDateString("es-ES") : "—"}     Estado: ${statusLabel(cert.status)}`,
        size: 18,
        italics: true,
        color: "888888",
      }),
    ],
    spacing: { after: 400 },
  });

  const tableRows = rows.map(([label, value], i) =>
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18 })] })],
          width: { size: 35, type: WidthType.PERCENTAGE },
          shading: i % 2 === 0 ? { type: ShadingType.SOLID, color: "F0FAFA" } : undefined,
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: value, size: 18 })] })],
          width: { size: 65, type: WidthType.PERCENTAGE },
          shading: i % 2 === 0 ? { type: ShadingType.SOLID, color: "F0FAFA" } : undefined,
        }),
      ],
    })
  );

  const dataTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Campo", bold: true, color: "FFFFFF", size: 20 })] })],
            width: { size: 35, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: TEAL_HEX },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Valor", bold: true, color: "FFFFFF", size: 20 })] })],
            width: { size: 65, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: TEAL_HEX },
          }),
        ],
      }),
      ...tableRows,
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: TEAL_HEX },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: TEAL_HEX },
      left: { style: BorderStyle.SINGLE, size: 4, color: TEAL_HEX },
      right: { style: BorderStyle.SINGLE, size: 4, color: TEAL_HEX },
      insideH: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
      insideV: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
    },
  });

  const footerPara = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: "CERTIFIVE — Plataforma de Gestión de Certificaciones Energéticas",
        size: 14,
        color: TEAL_HEX,
        italics: true,
      }),
    ],
    spacing: { before: 600 },
  });

  const doc = new Document({
    sections: [
      {
        children: [headerPara, titlePara, subtitlePara, dataTable, footerPara],
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  const url = URL.createObjectURL(buffer);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CEE_${safeRef(cert)}_${fileDate(cert)}.docx`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function downloadExcel(cert: CertData): void {
  const rows = buildRows(cert);

  const wb = XLSX.utils.book_new();

  const headerData = [
    ["CERTIFIVE — Certificación de Eficiencia Energética", ""],
    [`CEE — ${cert.cadastralRef || `#${cert.id}`}`, ""],
    [`Generado: ${new Date().toLocaleDateString("es-ES")}`, ""],
    ["", ""],
    ["Campo", "Valor"],
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(headerData);

  ws["!cols"] = [{ wch: 35 }, { wch: 60 }];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Certificación CEE");

  const summaryData = [
    ["RESUMEN RÁPIDO", ""],
    ["", ""],
    ["Propietario", fmt(cert.ownerName)],
    ["DNI / NIF", fmt(cert.ownerDni)],
    ["Referencia Catastral", fmt(cert.cadastralRef)],
    ["Dirección", fmt(cert.propertyAddress)],
    ["Calificación Energética", fmt(cert.energyRating)],
    ["Estado", statusLabel(cert.status)],
    ["Fecha", cert.createdAt ? new Date(cert.createdAt).toLocaleDateString("es-ES") : "—"],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
  ws2["!cols"] = [{ wch: 28 }, { wch: 45 }];
  ws2["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  XLSX.utils.book_append_sheet(wb, ws2, "Resumen");

  const filename = `CEE_${safeRef(cert)}_${fileDate(cert)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
