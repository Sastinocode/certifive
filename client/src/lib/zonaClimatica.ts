/**
 * Zona climática según CTE DB-HE Apéndice B (Tabla B.1)
 * Mapeo de código postal (primeros 2 dígitos = provincia) → zona climática
 *
 * Zonas: A1 A2 A3 A4 B1 B2 B3 B4 C1 C2 C3 C4 D1 D2 D3 E1
 * La zona varía dentro de la misma provincia por altitud/municipio.
 * Esta tabla usa la zona de la capital de provincia como referencia.
 */

// cp2 = primeros 2 dígitos del código postal (provincia)
const ZONA_POR_PROVINCIA: Record<string, string> = {
  "01": "D1", // Álava / Araba (Vitoria-Gasteiz)
  "02": "D3", // Albacete
  "03": "B4", // Alicante
  "04": "A4", // Almería
  "05": "E1", // Ávila
  "06": "C4", // Badajoz
  "07": "B3", // Baleares (Palma)
  "08": "C2", // Barcelona
  "09": "D1", // Burgos
  "10": "C4", // Cáceres
  "11": "A3", // Cádiz
  "12": "B3", // Castellón
  "13": "D3", // Ciudad Real
  "14": "C4", // Córdoba
  "15": "C1", // A Coruña
  "16": "D3", // Cuenca
  "17": "C2", // Girona
  "18": "C3", // Granada
  "19": "D2", // Guadalajara
  "20": "C1", // Gipuzkoa (San Sebastián)
  "21": "B4", // Huelva
  "22": "D3", // Huesca
  "23": "C4", // Jaén
  "24": "D1", // León
  "25": "D3", // Lleida
  "26": "D2", // La Rioja (Logroño)
  "27": "C1", // Lugo
  "28": "D3", // Madrid
  "29": "A3", // Málaga
  "30": "B3", // Murcia
  "31": "D1", // Navarra (Pamplona)
  "32": "C1", // Ourense
  "34": "D1", // Palencia
  "35": "A3", // Las Palmas de Gran Canaria
  "36": "C1", // Pontevedra
  "37": "D1", // Salamanca
  "38": "A3", // Santa Cruz de Tenerife
  "40": "D2", // Segovia
  "41": "B4", // Sevilla
  "42": "E1", // Soria
  "43": "C2", // Tarragona
  "44": "D2", // Teruel
  "45": "D3", // Toledo
  "46": "B3", // Valencia
  "47": "D2", // Valladolid
  "48": "C1", // Bizkaia (Bilbao)
  "49": "D1", // Zamora
  "50": "D3", // Zaragoza
  "51": "A3", // Ceuta
  "52": "A3", // Melilla
};

/**
 * Devuelve la zona climática CTE (p.ej. "D3") dado un código postal español.
 * Retorna null si el CP no es válido o no se reconoce la provincia.
 */
export function getZonaClimatica(cp: string): string | null {
  if (!cp) return null;
  const clean = cp.trim().replace(/\D/g, "");
  if (clean.length < 2) return null;
  const prefix = clean.slice(0, 2);
  return ZONA_POR_PROVINCIA[prefix] ?? null;
}

/**
 * Devuelve el color de badge asociado a la zona climática.
 * Zonas A: cálido → naranja/rojo
 * Zonas B: templado cálido → amarillo
 * Zonas C: templado → verde
 * Zonas D: frío → azul
 * Zona E: muy frío → índigo
 */
export function zonaClimaticaColor(zona: string): string {
  if (!zona) return "bg-stone-100 text-stone-600";
  const letter = zona[0].toUpperCase();
  switch (letter) {
    case "A": return "bg-red-100 text-red-700";
    case "B": return "bg-orange-100 text-orange-700";
    case "C": return "bg-emerald-100 text-emerald-700";
    case "D": return "bg-blue-100 text-blue-700";
    case "E": return "bg-indigo-100 text-indigo-700";
    default:  return "bg-stone-100 text-stone-600";
  }
}
