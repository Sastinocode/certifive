import { useLocation } from "wouter";

export default function TermsOfService() {
  const [, navigate] = useLocation();

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter',system-ui,sans-serif", color: "#0F172A" }}>
      {/* Nav */}
      <div style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E5E7EB", background: "white" }}>
        <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }} onClick={() => navigate("/")}>
          <svg width="130" height="32" viewBox="0 0 140 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 17L6 28L22 28L22 17L14 9Z" fill="none" stroke="#1FA94B" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
            <rect x="9" y="22" width="2.5" height="6" rx="0.5" fill="#1FA94B"/>
            <rect x="13" y="19" width="2.5" height="9" rx="0.5" fill="#84CC16"/>
            <rect x="17" y="16" width="2.5" height="12" rx="0.5" fill="#F59E0B"/>
            <text x="30" y="26" fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fontSize="19" fill="#0F172A">certifive</text>
          </svg>
        </div>
        <button onClick={() => navigate("/")} style={{ fontSize: 14, color: "#475569", background: "none", border: "none", cursor: "pointer" }}>
          ← Volver al inicio
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: "#0F172A", marginBottom: 8, letterSpacing: "-.03em" }}>Términos de Servicio</h1>
        <p style={{ fontSize: 14, color: "#64748B", marginBottom: 40 }}>Última actualización: 14 de mayo de 2026</p>

        {[
          {
            title: "1. Descripción del servicio",
            body: `Certifive es una plataforma de gestión para profesionales de la certificación energética en España. Permite gestionar expedientes, clientes, cuestionarios, certificados PDF, cobros y comunicaciones con propietarios.\n\nCertifive es una herramienta de gestión y flujo de trabajo. El certificado de eficiencia energética oficial debe generarse con un Documento Reconocido por el Ministerio (CE3X, HULC, CYPETHERM u otro homologado) y registrarse ante el organismo competente de la Comunidad Autónoma. Certifive no sustituye este proceso oficial.`,
          },
          {
            title: "2. Aceptación de los términos",
            body: `Al registrarte en Certifive y utilizar el servicio, aceptas estos Términos de Servicio y nuestra Política de Privacidad. Si no estás de acuerdo con algún término, no debes utilizar el servicio.\n\nDebes ser mayor de 18 años y profesional habilitado o con capacidad legal para ejercer como técnico certificador en España para utilizar Certifive.`,
          },
          {
            title: "3. Planes, precios y facturación",
            body: `Certifive ofrece los siguientes planes:\n\n- **Básico** — Hasta 10 certificados/mes.\n- **Profesional** — Hasta 50 certificados/mes. Incluye WhatsApp, cobros y facturación legal.\n- **Empresa** — Certificados ilimitados, hasta 5 técnicos, IA y API.\n- **Pay-per-use** — 3 € por certificado, sin cuota mensual.\n\nTodos los planes incluyen 7 días de prueba gratuita sin necesidad de tarjeta de crédito. Los precios indicados son en euros e incluyen IVA salvo indicación contraria.\n\nLa facturación es mensual o anual según el plan elegido. El plan anual ofrece un descuento equivalente a 2 meses gratuitos.`,
          },
          {
            title: "4. Política de cancelación",
            body: `Puedes cancelar tu suscripción en cualquier momento desde Configuración → Suscripción. La cancelación es efectiva al final del período de facturación en curso; no se realizan reembolsos prorrateados por el período ya pagado.\n\nTras la cancelación, tu cuenta pasa a modo solo-lectura durante 30 días para que puedas exportar tus datos. Pasados 30 días, los datos se eliminan de forma permanente según nuestra Política de Privacidad.\n\nNo existe permanencia mínima en ningún plan.`,
          },
          {
            title: "5. Uso aceptable",
            body: `Te comprometes a no utilizar Certifive para:\n\n- Infringir derechos de terceros o la normativa aplicable.\n- Intentar acceder a cuentas o datos de otros usuarios.\n- Introducir datos falsos, fraudulentos o que vulneren la normativa de certificación energética.\n- Realizar actividades de spam, scraping o abuso de la API.\n- Cualquier uso que sobrecargue de forma injustificada la infraestructura del servicio.\n\nEl incumplimiento de estas condiciones puede resultar en la suspensión o cancelación inmediata de la cuenta.`,
          },
          {
            title: "6. Propiedad intelectual",
            body: `Certifive y todos sus componentes (código fuente, diseño, marca, logotipos, textos) son propiedad exclusiva de Certifive o de sus licenciantes. No se concede ninguna licencia implícita más allá del uso necesario para acceder al servicio.\n\nEl contenido que introduces en la plataforma (expedientes, datos de clientes, certificados) es de tu propiedad. Certifive accede a él únicamente para prestarte el servicio.`,
          },
          {
            title: "7. Limitación de responsabilidad",
            body: `Certifive se proporciona «tal como está» y «según disponibilidad». En la medida máxima permitida por la ley:\n\n- Certifive no garantiza que el servicio sea ininterrumpido, libre de errores ni que cumpla exactamente con tus requisitos específicos.\n- Certifive no es responsable de los errores en los certificados energéticos resultantes de datos incorrectos introducidos por el usuario.\n- La responsabilidad total de Certifive frente a ti no excederá el importe pagado por el servicio en los 3 meses anteriores al hecho causante.\n- Certifive no será responsable de daños indirectos, pérdida de beneficios, pérdida de datos ni daños consecuentes.`,
          },
          {
            title: "8. Disponibilidad del servicio",
            body: `Certifive se esfuerza por mantener una disponibilidad del 99,5% mensual. Las interrupciones programadas de mantenimiento se notificarán con al menos 24 horas de antelación. No se garantiza ningún SLA concreto en los planes Básico y Pay-per-use.`,
          },
          {
            title: "9. Modificaciones del servicio y de los términos",
            body: `Certifive puede modificar, suspender o discontinuar cualquier funcionalidad del servicio en cualquier momento. Los cambios en los precios se notificarán con al menos 30 días de antelación.\n\nLos cambios en los Términos de Servicio se notificarán por email. El uso continuado del servicio tras la notificación implica la aceptación de los nuevos términos.`,
          },
          {
            title: "10. Ley aplicable y resolución de conflictos",
            body: `Estos Términos se rigen por la legislación española y, en lo que le sea aplicable, por la normativa de la Unión Europea.\n\nCualquier controversia derivada de estos Términos se someterá, con renuncia expresa a cualquier otro fuero, a los Juzgados y Tribunales de España.\n\nPara reclamaciones de usuarios, puedes contactar en legal@certifive.es. En caso de conflicto no resuelto, puedes acudir a la plataforma de resolución en línea de litigios de la UE (ec.europa.eu/consumers/odr).`,
          },
          {
            title: "11. Contacto",
            body: `Para cualquier consulta sobre estos Términos:\n\nlegal@certifive.es\nCertifive — España`,
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>{section.title}</h2>
            <div style={{ fontSize: 15, color: "#334155", lineHeight: 1.75 }}>
              {section.body.split("\n").map((line, i) => {
                if (line.startsWith("- **")) {
                  const match = line.match(/^- \*\*(.+?)\*\*(.*)$/);
                  if (match) return <p key={i} style={{ margin: "4px 0", paddingLeft: 16 }}>• <strong>{match[1]}</strong>{match[2]}</p>;
                }
                if (line.startsWith("- ")) return <p key={i} style={{ margin: "4px 0", paddingLeft: 16 }}>• {line.slice(2)}</p>;
                if (line === "") return <br key={i} />;
                return <p key={i} style={{ margin: "6px 0" }}>{line}</p>;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
