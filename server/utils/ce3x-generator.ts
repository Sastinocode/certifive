/**
 * CE3X XML Generator
 *
 * Genera un fichero XML compatible con CE3X (versión 2.3+)
 * a partir de los datos almacenados en Certifive.
 *
 * Referencia: estructura DatosEnergeticos del IDAE / Ministerio MIVAU
 */

// ─── Tipos de entrada ────────────────────────────────────────────────────────

export interface CE3XCert {
  id: number;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  ownerDni?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  province?: string | null;
  comunidadAutonomaCatastro?: string | null;
  cadastralReference?: string | null;
  propertyType?: string | null;
  constructionYear?: number | null;
  totalArea?: string | null;
  superficieTotalCatastro?: number | null;
  numPlantas?: number | null;
  zonaClimatica?: string | null;
  esUltimaPlanta?: boolean | null;
  tieneLocalDebajo?: boolean | null;
  esEdificioNuevo?: boolean | null;
  energyRating?: string | null;
  numOcupantes?: number | null;
  calefaccionTipoInstalacion?: string | null;
  calefaccionSistema?: string | null;
  acsTipoInstalacion?: string | null;
  acsSistema?: string | null;
}

export interface CE3XCertifier {
  name?: string | null;
  firstName?: string | null;
  company?: string | null;
  licenseNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  province?: string | null;
}

export interface CE3XEnvelopeElement {
  id: number;
  tipo: string;
  nombre: string;
  orientacion?: string | null;
  superficieM2?: string | null;
  transmitanciaU?: string | null;
  metodo?: string | null;
}

export interface CE3XOpening {
  id: number;
  tipo: string;
  orientacion?: string | null;
  superficieM2?: string | null;
  transmitanciaUMarco?: string | null;
  transmitanciaUVidrio?: string | null;
  factorSolar?: string | null;
  metodo?: string | null;
}

export interface CE3XInstallation {
  id: number;
  sistema: string;
  tipo: string;
  vectorEnergetico?: string | null;
  rendimiento?: string | null;
  potenciaKw?: string | null;
  anyoInstalacion?: number | null;
  metodo?: string | null;
  notas?: string | null;
}

export interface CE3XMeasure {
  id: number;
  tipo: string;
  descripcion: string;
  elementoAfectado?: string | null;
  costeEstimadoEur?: string | null;
  ahorroEnergiaPct?: string | null;
  mejoraCalificacionEsperada?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esc(v: string | null | undefined): string {
  if (!v) return "";
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function num(v: string | number | null | undefined, decimals = 2): string {
  if (v == null || v === "") return "0";
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? "0" : n.toFixed(decimals);
}

/** Mapea tipo de inmueble Certifive → CE3X */
function mapTipoEdificio(t?: string | null): string {
  const map: Record<string, string> = {
    vivienda_unifamiliar: "ViviendaUnifamiliar",
    vivienda_bloque: "PisoEnBloque",
    piso:            "PisoEnBloque",
    local:           "LocalComercial",
    oficina:         "Oficina",
    hotel:           "Hotel",
    hospital:        "Hospital",
    educativo:       "CentroDocente",
  };
  return map[t?.toLowerCase() ?? ""] ?? "PisoEnBloque";
}

/** Mapea orientación Certifive → CE3X */
function mapOrientacion(o?: string | null): string {
  const map: Record<string, string> = {
    N: "Norte", NE: "Noreste", E: "Este", SE: "Sureste",
    S: "Sur", SO: "Suroeste", O: "Oeste", NO: "Noroeste",
    horizontal: "Horizontal",
  };
  return map[o ?? ""] ?? "Norte";
}

/** Mapea vector energético Certifive → CE3X */
function mapVector(v?: string | null): string {
  const map: Record<string, string> = {
    gas_natural:       "GasNatural",
    gasoil:            "Gasoleo",
    glp:               "GLP",
    electricidad:      "Electricidad",
    biomasa:           "BiomasaLocal",
    carbon:            "Carbon",
    red_distrito:      "RedDeDistrito",
    solar_termica:     "EnergíaSolarTermica",
    solar_fotovoltaica:"EnergíaSolarFotovoltaica",
  };
  return map[v?.toLowerCase() ?? ""] ?? "Electricidad";
}

/** Mapea sistema calefacción/ACS simple → tipo CE3X */
function mapSistemaCalef(s?: string | null): string {
  if (!s) return "CalderaConvencional";
  const sl = s.toLowerCase();
  if (sl.includes("bomba"))        return "BombaDeCalor";
  if (sl.includes("aerotermia"))   return "BombaDeCalor";
  if (sl.includes("caldera_cond")) return "CalderaDeCondensacion";
  if (sl.includes("caldera"))      return "CalderaConvencional";
  if (sl.includes("electrico") || sl.includes("electrica")) return "EfectoJoule";
  if (sl.includes("biomasa"))      return "CalderaDeCondensacion";
  if (sl.includes("suelo_rad"))    return "SueloRadiante";
  return "CalderaConvencional";
}

function mapSistemaACS(s?: string | null): string {
  if (!s) return "CalderaConvencional";
  const sl = s.toLowerCase();
  if (sl.includes("bomba"))      return "BombaDeCalor";
  if (sl.includes("solar"))      return "CalentadorSolar";
  if (sl.includes("electrico"))  return "EfectoJoule";
  if (sl.includes("caldera"))    return "CalderaConvencional";
  return "CalderaConvencional";
}

// ─── Constructor XML ──────────────────────────────────────────────────────────

export function generateCE3XString(
  cert: CE3XCert,
  certifier: CE3XCertifier,
  envelope: CE3XEnvelopeElement[],
  openings: CE3XOpening[],
  installations: CE3XInstallation[],
  measures: CE3XMeasure[],
): string {
  const superficie = num(cert.totalArea ?? cert.superficieTotalCatastro, 2);
  const tipoEdificio = mapTipoEdificio(cert.propertyType);
  const zonaClimatica = cert.zonaClimatica ?? "D3";
  const anyoConst = cert.constructionYear ?? 1980;
  const numPlantas = cert.numPlantas ?? 1;

  const certName = certifier.name ?? certifier.firstName
    ? `${certifier.firstName ?? ""} ${certifier.name ?? ""}`.trim()
    : "Certificador";

  // ── Envolvente ──────────────────────────────────────────────────────────────

  const fachadas = envelope.filter(e => e.tipo === "fachada");
  const cubiertas = envelope.filter(e => e.tipo === "cubierta");
  const suelos = envelope.filter(e => e.tipo === "suelo");
  const medianeras = envelope.filter(e => e.tipo === "medianeria");

  const fachadasXML = fachadas.map((f, i) => `
      <Fachada>
        <Nombre>${esc(f.nombre) || `Fachada_${i + 1}`}</Nombre>
        <Orientacion>${mapOrientacion(f.orientacion)}</Orientacion>
        <Superficie>${num(f.superficieM2)}</Superficie>
        <Transmitancia>${num(f.transmitanciaU)}</Transmitancia>
        <ModoDeObtencion>${f.metodo === "conocido" ? "Conocido" : "PorDefecto"}</ModoDeObtencion>
      </Fachada>`).join("");

  const cubiertasXML = cubiertas.map((c, i) => `
      <CubiertaOTecho>
        <Nombre>${esc(c.nombre) || `Cubierta_${i + 1}`}</Nombre>
        <Superficie>${num(c.superficieM2)}</Superficie>
        <Transmitancia>${num(c.transmitanciaU)}</Transmitancia>
        <ModoDeObtencion>${c.metodo === "conocido" ? "Conocido" : "PorDefecto"}</ModoDeObtencion>
      </CubiertaOTecho>`).join("");

  const suelosXML = suelos.map((s, i) => `
      <SuelooParticion>
        <Nombre>${esc(s.nombre) || `Suelo_${i + 1}`}</Nombre>
        <Superficie>${num(s.superficieM2)}</Superficie>
        <Transmitancia>${num(s.transmitanciaU)}</Transmitancia>
        <ModoDeObtencion>${s.metodo === "conocido" ? "Conocido" : "PorDefecto"}</ModoDeObtencion>
      </SuelooParticion>`).join("");

  const medianeriasXML = medianeras.map((m, i) => `
      <ParticionInterior>
        <Nombre>${esc(m.nombre) || `Medianeria_${i + 1}`}</Nombre>
        <Superficie>${num(m.superficieM2)}</Superficie>
        <Transmitancia>${num(m.transmitanciaU)}</Transmitancia>
        <ModoDeObtencion>${m.metodo === "conocido" ? "Conocido" : "PorDefecto"}</ModoDeObtencion>
      </ParticionInterior>`).join("");

  const huecosXML = openings.map((o, i) => `
      <HuecoOLucernario>
        <Nombre>${esc(o.tipo)}_${i + 1}</Nombre>
        <Tipo>${o.tipo === "lucernario" ? "Lucernario" : "Hueco"}</Tipo>
        <Orientacion>${mapOrientacion(o.orientacion)}</Orientacion>
        <Superficie>${num(o.superficieM2)}</Superficie>
        <TransmitanciaMarco>${num(o.transmitanciaUMarco)}</TransmitanciaMarco>
        <TransmitanciaVidrio>${num(o.transmitanciaUVidrio)}</TransmitanciaVidrio>
        <FactorSolarVidrio>${num(o.factorSolar)}</FactorSolarVidrio>
        <ModoDeObtencion>${o.metodo === "conocido" ? "Conocido" : "PorDefecto"}</ModoDeObtencion>
      </HuecoOLucernario>`).join("");

  // ── Instalaciones ───────────────────────────────────────────────────────────

  // Calefacción — puede venir de installations[] o del campo simple
  const instCalef = installations.filter(i => i.sistema === "calefaccion");
  const instRefrig = installations.filter(i => i.sistema === "refrigeracion");
  const instACS = installations.filter(i => i.sistema === "acs");
  const instIlum = installations.filter(i => i.sistema === "iluminacion");

  const hasCalef = instCalef.length > 0 || (cert.calefaccionTipoInstalacion && cert.calefaccionTipoInstalacion !== "no_tiene");
  const hasACS   = instACS.length > 0   || (cert.acsTipoInstalacion && cert.acsTipoInstalacion !== "no_tiene");

  const calefXML = hasCalef ? (instCalef.length > 0
    ? instCalef.map((c, i) => `
      <Calefaccion>
        <Nombre>${esc(c.tipo) || `Calefaccion_${i + 1}`}</Nombre>
        <Tipo>${mapSistemaCalef(c.tipo)}</Tipo>
        <VectorEnergetico>${mapVector(c.vectorEnergetico)}</VectorEnergetico>
        <RendimientoEstacional>${num(c.rendimiento)}</RendimientoEstacional>
        <ModoDeObtencion>${c.metodo === "conocido" ? "Conocido" : "PorDefecto"}</ModoDeObtencion>
      </Calefaccion>`).join("")
    : `
      <Calefaccion>
        <Nombre>Calefaccion_1</Nombre>
        <Tipo>${mapSistemaCalef(cert.calefaccionSistema)}</Tipo>
        <VectorEnergetico>GasNatural</VectorEnergetico>
        <RendimientoEstacional>0.80</RendimientoEstacional>
        <ModoDeObtencion>PorDefecto</ModoDeObtencion>
      </Calefaccion>`) : "";

  const refrigXML = instRefrig.map((r, i) => `
      <Refrigeracion>
        <Nombre>${esc(r.tipo) || `Refrigeracion_${i + 1}`}</Nombre>
        <Tipo>BombaDeCalor</Tipo>
        <VectorEnergetico>${mapVector(r.vectorEnergetico)}</VectorEnergetico>
        <RendimientoEstacional>${num(r.rendimiento)}</RendimientoEstacional>
        <ModoDeObtencion>${r.metodo === "conocido" ? "Conocido" : "PorDefecto"}</ModoDeObtencion>
      </Refrigeracion>`).join("");

  const acsXML = hasACS ? (instACS.length > 0
    ? instACS.map((a, i) => `
      <ACS>
        <Nombre>${esc(a.tipo) || `ACS_${i + 1}`}</Nombre>
        <Tipo>${mapSistemaACS(a.tipo)}</Tipo>
        <VectorEnergetico>${mapVector(a.vectorEnergetico)}</VectorEnergetico>
        <RendimientoEstacional>${num(a.rendimiento)}</RendimientoEstacional>
        <ModoDeObtencion>${a.metodo === "conocido" ? "Conocido" : "PorDefecto"}</ModoDeObtencion>
      </ACS>`).join("")
    : `
      <ACS>
        <Nombre>ACS_1</Nombre>
        <Tipo>${mapSistemaACS(cert.acsSistema)}</Tipo>
        <VectorEnergetico>GasNatural</VectorEnergetico>
        <RendimientoEstacional>0.75</RendimientoEstacional>
        <ModoDeObtencion>PorDefecto</ModoDeObtencion>
      </ACS>`) : "";

  const ilumXML = instIlum.length > 0
    ? `
    <InstalacionesIluminacion>
      ${instIlum.map((il, i) => `
      <InstalacionIluminacion>
        <Nombre>${esc(il.tipo) || `Iluminacion_${i + 1}`}</Nombre>
        <PotenciaInstalada>${num(il.potenciaKw, 1)}</PotenciaInstalada>
        <VEEI>5.0</VEEI>
        <ModoDeObtencion>PorDefecto</ModoDeObtencion>
      </InstalacionIluminacion>`).join("")}
    </InstalacionesIluminacion>` : "";

  // ── Medidas de mejora ───────────────────────────────────────────────────────

  const medidasXML = measures.length > 0 ? `
  <MedidasDeMejora>${measures.map((m, i) => `
    <Medida>
      <Nombre>Medida_${i + 1}</Nombre>
      <Tipo>${m.tipo === "envolvente" ? "Envolvente" : m.tipo === "iluminacion" ? "Iluminacion" : "Instalaciones"}</Tipo>
      <Descripcion>${esc(m.descripcion)}</Descripcion>
      ${m.elementoAfectado ? `<ElementoAfectado>${esc(m.elementoAfectado)}</ElementoAfectado>` : ""}
      ${m.costeEstimadoEur ? `<CosteEstimado>${num(m.costeEstimadoEur)}</CosteEstimado>` : ""}
      ${m.ahorroEnergiaPct ? `<AhorroEnergeticoAnual>${num(m.ahorroEnergiaPct)}</AhorroEnergeticoAnual>` : ""}
      ${m.mejoraCalificacionEsperada ? `<CalificacionEsperada>${esc(m.mejoraCalificacionEsperada)}</CalificacionEsperada>` : ""}
    </Medida>`).join("")}
  </MedidasDeMejora>` : "";

  // ── XML final ───────────────────────────────────────────────────────────────

  return `<?xml version="1.0" encoding="UTF-8"?>
<DatosEnergeticos>
  <Version>2.3</Version>
  <DatosGenerales>
    <NombreDelEdificio>${esc(cert.address) || "Inmueble"}</NombreDelEdificio>
    <Direccion>${esc(cert.address)}</Direccion>
    <Municipio>${esc(cert.city)}</Municipio>
    <CodigoPostal>${esc(cert.postalCode)}</CodigoPostal>
    <Provincia>${esc(cert.province)}</Provincia>
    <ComunidadAutonoma>${esc(cert.comunidadAutonomaCatastro)}</ComunidadAutonoma>
    <ZonaClimatica>${esc(zonaClimatica)}</ZonaClimatica>
    <AnioContruccion>${anyoConst}</AnioContruccion>
    <ReferenciaCatastral>${esc(cert.cadastralReference)}</ReferenciaCatastral>
    <TipoDeEdificio>${tipoEdificio}</TipoDeEdificio>
    <SuperficieHabitable>${superficie}</SuperficieHabitable>
    <NumeroDePlantasSobreRasante>${numPlantas}</NumeroDePlantasSobreRasante>
    <Sotano>No</Sotano>
    <Techado>${cert.esUltimaPlanta ? "Si" : "No"}</Techado>
    <PorSuelo>${cert.tieneLocalDebajo === false ? "Si" : "No"}</PorSuelo>
    <EdificioNuevo>${cert.esEdificioNuevo ? "Si" : "No"}</EdificioNuevo>
    <NombreDelPropietario>${esc(cert.ownerName)}</NombreDelPropietario>
    <NumOcupantes>${cert.numOcupantes ?? 0}</NumOcupantes>
  </DatosGenerales>
  <DatosDelCertificador>
    <Nombre>${esc(certName)}</Nombre>
    <Empresa>${esc(certifier.company)}</Empresa>
    <NIF>${""}</NIF>
    <NumColegiado>${esc(certifier.licenseNumber)}</NumColegiado>
    <Email>${esc(certifier.email)}</Email>
    <Telefono>${esc(certifier.phone)}</Telefono>
    <Provincia>${esc(certifier.province)}</Provincia>
  </DatosDelCertificador>
  <EnvolventeTermica>
    <Fachadas>${fachadasXML}</Fachadas>
    <CubiertasOTechos>${cubiertasXML}</CubiertasOTechos>
    <SuelosOParticiones>${suelosXML}${medianeriasXML}</SuelosOParticiones>
    <HuecosOLucernarios>${huecosXML}</HuecosOLucernarios>
  </EnvolventeTermica>
  <InstalacionesTermicas>
    <InstalacionesCalefaccion>${calefXML}</InstalacionesCalefaccion>
    <InstalacionesRefrigeracion>${refrigXML}</InstalacionesRefrigeracion>
    <InstalacionesACS>${acsXML}</InstalacionesACS>
  </InstalacionesTermicas>${ilumXML}
  <CalificacionEnergetica>
    <CalificacionGlobal>${esc(cert.energyRating) || "G"}</CalificacionGlobal>
    <CalificacionCalefaccion>${esc(cert.energyRating) || "G"}</CalificacionCalefaccion>
    <CalificacionRefrigeracion>${esc(cert.energyRating) || "G"}</CalificacionRefrigeracion>
    <CalificacionACS>${esc(cert.energyRating) || "G"}</CalificacionACS>
  </CalificacionEnergetica>${medidasXML}
</DatosEnergeticos>
`.trim();
}
