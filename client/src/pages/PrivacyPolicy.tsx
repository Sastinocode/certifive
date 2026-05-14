import { useLocation } from "wouter";

export default function PrivacyPolicy() {
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
        <h1 style={{ fontSize: 34, fontWeight: 800, color: "#0F172A", marginBottom: 8, letterSpacing: "-.03em" }}>Política de Privacidad</h1>
        <p style={{ fontSize: 14, color: "#64748B", marginBottom: 40 }}>Última actualización: 14 de mayo de 2026</p>

        {[
          {
            title: "1. Responsable del tratamiento",
            body: `El responsable del tratamiento de los datos personales recogidos a través de Certifive es:\n\n**Certifive** (en adelante, «Certifive» o «nosotros»)\nEmail de contacto: privacidad@certifive.es\n\nEn cumplimiento del Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), Certifive se compromete a tratar sus datos con transparencia, legitimidad y seguridad.`,
          },
          {
            title: "2. Datos que recogemos",
            body: `Recogemos los siguientes datos personales:\n\n- **Datos de registro**: nombre y apellidos, dirección de correo electrónico, contraseña (almacenada con hash bcrypt), número de teléfono.\n- **Datos profesionales**: número de habilitación profesional, empresa, número de identificación fiscal (NIF/DNI), IBAN para facturación.\n- **Datos de uso**: expedientes, certificados, clientes, facturas y demás contenido que introduzcas en la plataforma.\n- **Datos técnicos**: dirección IP, tipo de navegador, sistema operativo, timestamps de acceso.\n- **Datos de pago**: gestionados directamente por Stripe (no almacenamos datos de tarjeta).`,
          },
          {
            title: "3. Base legal del tratamiento",
            body: `El tratamiento de tus datos se basa en:\n\n- **Ejecución de un contrato** (art. 6.1.b RGPD): para prestarte el servicio de Certifive una vez registrado.\n- **Consentimiento** (art. 6.1.a RGPD): para el envío de comunicaciones comerciales opcionales.\n- **Interés legítimo** (art. 6.1.f RGPD): para la seguridad de la plataforma, prevención del fraude y mejora del servicio.\n- **Obligación legal** (art. 6.1.c RGPD): para el cumplimiento de obligaciones fiscales y de facturación.`,
          },
          {
            title: "4. Finalidades del tratamiento",
            body: `Tus datos se utilizan para:\n\n- Crear y gestionar tu cuenta de usuario.\n- Prestarte los servicios de gestión de certificados energéticos.\n- Procesar pagos y emitir facturas.\n- Enviarte comunicaciones transaccionales (verificación de email, confirmaciones, avisos de expediente).\n- Mejorar la plataforma y detectar problemas técnicos.\n- Cumplir con las obligaciones legales aplicables.`,
          },
          {
            title: "5. Conservación de datos",
            body: `Conservamos tus datos durante el tiempo en que seas usuario activo de Certifive. Una vez eliminada tu cuenta:\n\n- Los datos de la cuenta se eliminan en un plazo de 30 días.\n- Los datos fiscales y de facturación se conservan durante 5 años en cumplimiento de la normativa tributaria española.\n- Los registros de seguridad se conservan durante 12 meses.`,
          },
          {
            title: "6. Destinatarios de los datos",
            body: `Tus datos pueden ser compartidos con los siguientes encargados del tratamiento:\n\n- **Stripe Inc.** — Procesamiento de pagos (con sede en EE. UU.; sujeto a cláusulas contractuales tipo de la UE).\n- **SendGrid (Twilio)** — Envío de emails transaccionales.\n- **Cloudinary** — Almacenamiento de imágenes (logo, firma).\n- **Neon / PostgreSQL** — Base de datos.\n\nNo vendemos ni cedemos tus datos a terceros con fines comerciales.`,
          },
          {
            title: "7. Tus derechos",
            body: `De acuerdo con el RGPD y la LOPDGDD, tienes derecho a:\n\n- **Acceso**: solicitar una copia de tus datos (disponible en Configuración → Exportar mis datos).\n- **Rectificación**: corregir datos inexactos o incompletos.\n- **Supresión («derecho al olvido»)**: solicitar la eliminación de tus datos cuando ya no sean necesarios.\n- **Portabilidad**: recibir tus datos en formato estructurado y legible por máquina.\n- **Oposición**: oponerte al tratamiento basado en interés legítimo.\n- **Limitación**: solicitar la restricción del tratamiento en determinadas circunstancias.\n\nPuedes ejercer estos derechos escribiendo a privacidad@certifive.es. También tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (aepd.es).`,
          },
          {
            title: "8. Delegado de Protección de Datos (DPO)",
            body: `Puedes contactar con nuestro Delegado de Protección de Datos en:\n\ndpo@certifive.es\n\nCertifive, Departamento de Privacidad\nEspaña`,
          },
          {
            title: "9. Seguridad",
            body: `Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos: cifrado en tránsito (HTTPS/TLS), hashing de contraseñas (bcrypt), control de acceso basado en roles, logs de actividad y límites de intentos de autenticación.`,
          },
          {
            title: "10. Cambios en esta política",
            body: `Podemos actualizar esta Política de Privacidad. Te notificaremos por email con 30 días de antelación ante cambios significativos. El uso continuado de la plataforma tras la notificación implica la aceptación de los cambios.`,
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>{section.title}</h2>
            <div style={{ fontSize: 15, color: "#334155", lineHeight: 1.75, whiteSpace: "pre-line" }}>
              {section.body.split("\n").map((line, i) => {
                if (line.startsWith("- **")) {
                  const match = line.match(/^- \*\*(.+?)\*\*(.*)$/);
                  if (match) return <p key={i} style={{ margin: "4px 0", paddingLeft: 16 }}>• <strong>{match[1]}</strong>{match[2]}</p>;
                }
                if (line.startsWith("- ")) return <p key={i} style={{ margin: "4px 0", paddingLeft: 16 }}>• {line.slice(2)}</p>;
                if (line.startsWith("**") && line.endsWith("**")) return <p key={i} style={{ margin: "8px 0", fontWeight: 700 }}>{line.replace(/\*\*/g, "")}</p>;
                if (line === "") return <br key={i} />;
                return <p key={i} style={{ margin: "4px 0" }}>{line}</p>;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
