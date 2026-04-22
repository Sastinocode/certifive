/**
 * CERTIFIVE — Email service
 *
 * Uses SendGrid. If SENDGRID_API_KEY is missing, all sends are no-ops
 * (logged as warnings) so the app never crashes because of a missing key.
 *
 * FROM address: no-reply@certifive.es
 *
 * Emails implemented
 * ──────────────────
 * 1. sendWelcomeEmail          → certifier registers
 * 2. sendEmailVerification     → certifier verifies email
 * 3. sendPasswordResetEmail    → certifier forgot password
 * 4. sendFormLinkEmail         → owner receives link to fill the form
 * 5. sendOwnerConfirmationEmail→ owner receives receipt after submitting
 * 6. sendCertifierNotification → certifier notified when owner submits
 */

import sgMail from "@sendgrid/mail";

// ─── Config ──────────────────────────────────────────────────────────────────

const FROM_EMAIL = "no-reply@certifive.es";
const FROM_NAME  = "CERTIFIVE";
const APP_URL    = (process.env.APP_URL ?? "https://certifive.es").replace(/\/$/, "");

let ready = false;

export function initEmail(): void {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) {
    console.warn("[email] ⚠️  SENDGRID_API_KEY not set — all emails disabled");
    return;
  }
  sgMail.setApiKey(key);
  ready = true;
  console.log("[email] ✅ SendGrid ready (from: " + FROM_EMAIL + ")");
}

// ─── Core sender ─────────────────────────────────────────────────────────────

async function send(msg: sgMail.MailDataRequired): Promise<void> {
  if (!ready) {
    console.warn("[email] skip (not ready):", msg.subject);
    return;
  }
  try {
    await sgMail.send(msg);
    console.log("[email] sent:", msg.subject, "→", msg.to);
  } catch (err: any) {
    // Log but never throw — emails must not break the main request flow
    const detail = err?.response?.body?.errors ?? err?.message ?? err;
    console.error("[email] failed:", msg.subject, detail);
  }
}

// ─── Shared HTML helpers ──────────────────────────────────────────────────────

function htmlWrap(body: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>CERTIFIVE</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f0fdf4">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4">
    <tr><td align="center" style="padding:40px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">

        <!-- HEADER -->
        <tr><td style="background:#064e3b;border-radius:16px 16px 0 0;padding:32px 40px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="display:inline-block;background:rgba(255,255,255,.12);border-radius:10px;padding:8px 12px;font-size:13px;font-weight:bold;color:#fff;letter-spacing:.5px">
                  🌿 CERTIFIVE
                </span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- BODY -->
        <tr><td style="background:#ffffff;padding:40px 40px 32px">
          ${body}
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#f0fdf4;border-radius:0 0 16px 16px;padding:24px 40px;border-top:1px solid #d1fae5">
          <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6">
            Este email fue enviado automáticamente por <strong>CERTIFIVE</strong>.<br>
            Si no esperabas este mensaje, ignóralo.<br>
            <a href="${APP_URL}" style="color:#059669;text-decoration:none">certifive.es</a>
            &nbsp;·&nbsp;
            <a href="mailto:soporte@certifive.es" style="color:#059669;text-decoration:none">soporte@certifive.es</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#064e3b;line-height:1.2">${text}</h1>`;
}

function p(text: string, opts: { color?: string; size?: string } = {}): string {
  const color = opts.color ?? "#374151";
  const size  = opts.size  ?? "15px";
  return `<p style="margin:16px 0 0;font-size:${size};color:${color};line-height:1.65">${text}</p>`;
}

function btn(text: string, url: string, color = "#065f46"): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0">
    <tr><td style="background:${color};border-radius:10px">
      <a href="${url}" target="_blank"
         style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:.2px">${text}</a>
    </td></tr>
  </table>`;
}

function divider(): string {
  return `<hr style="margin:28px 0 0;border:none;border-top:1px solid #d1fae5">`;
}

function infoBlock(rows: Array<{ label: string; value: string }>): string {
  const cells = rows.map(r =>
    `<tr>
      <td style="padding:8px 12px 8px 0;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.6px;white-space:nowrap;vertical-align:top">${r.label}</td>
      <td style="padding:8px 0;font-size:14px;font-weight:600;color:#064e3b;vertical-align:top">${r.value}</td>
    </tr>`
  ).join("\n");
  return `<table role="presentation" cellpadding="0" cellspacing="0"
            style="margin:20px 0 0;background:#f0fdf4;border-radius:10px;padding:4px 16px;width:100%">
    ${cells}
  </table>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. BIENVENIDA (certifier registers)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  username: string;
}): Promise<void> {
  if (!params.to) return;
  const { to, name, username } = params;

  const body = `
    ${h1("¡Bienvenido a CERTIFIVE, " + (name || username) + "!")}
    ${p("Tu cuenta de certificador energético ya está activa. Desde ahora puedes gestionar todos tus certificados CEE desde un solo lugar.")}
    ${infoBlock([
      { label: "Usuario",   value: username },
      { label: "Acceso",    value: APP_URL },
    ])}
    ${btn("Ir a mi panel →", APP_URL)}
    ${divider()}
    ${p("¿Tienes alguna duda? Escríbenos a <a href='mailto:soporte@certifive.es' style='color:#059669'>soporte@certifive.es</a>", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "Bienvenido a CERTIFIVE — Tu cuenta está activa",
    html: htmlWrap(body, "Tu cuenta de certificador ya está lista."),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. VERIFICACIÓN DE EMAIL
// ─────────────────────────────────────────────────────────────────────────────
export async function sendEmailVerification(params: {
  to: string;
  name: string;
  verificationToken: string;
}): Promise<void> {
  if (!params.to) return;
  const { to, name, verificationToken } = params;
  const verifyUrl = `${APP_URL}/verify-email?token=${verificationToken}`;

  const body = `
    ${h1("Confirma tu dirección de email")}
    ${p("Hola " + (name || "certificador") + ", haz clic en el botón para verificar tu email y activar todas las funciones de tu cuenta.")}
    ${btn("Verificar email →", verifyUrl)}
    ${divider()}
    ${p("Este enlace caduca en <strong>24 horas</strong>. Si no creaste una cuenta en CERTIFIVE, ignora este email.", { color: "#6b7280", size: "13px" })}
    ${p("O copia este enlace en tu navegador:<br><span style='font-size:12px;color:#059669;word-break:break-all'>${verifyUrl}</span>", { color: "#6b7280", size: "13px" })}
  `.replace("${verifyUrl}", verifyUrl);

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "CERTIFIVE — Confirma tu email",
    html: htmlWrap(body, "Confirma tu dirección de email para activar tu cuenta."),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RECUPERACIÓN DE CONTRASEÑA
// ─────────────────────────────────────────────────────────────────────────────
export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetToken: string;
}): Promise<void> {
  if (!params.to) return;
  const { to, name, resetToken } = params;
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

  const body = `
    ${h1("Restablecer contraseña")}
    ${p("Hola " + (name || "") + ", recibimos una solicitud para restablecer la contraseña de tu cuenta CERTIFIVE.")}
    ${p("Haz clic en el botón para elegir una nueva contraseña:")}
    ${btn("Restablecer contraseña →", resetUrl, "#ea580c")}
    ${divider()}
    ${p("Este enlace <strong>caduca en 1 hora</strong>. Si no solicitaste el cambio, ignora este email — tu contraseña actual sigue siendo la misma.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "CERTIFIVE — Restablece tu contraseña",
    html: htmlWrap(body, "Solicitud de cambio de contraseña."),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. LINK DEL FORMULARIO → PROPIETARIO
// ─────────────────────────────────────────────────────────────────────────────
export async function sendFormLinkEmail(params: {
  to: string;
  ownerName: string;
  certifierName: string;
  certifierPhone?: string | null;
  certifierCompany?: string | null;
  formUrl: string;
  propertyAddress?: string | null;
}): Promise<void> {
  if (!params.to) return;
  const { to, ownerName, certifierName, certifierPhone, certifierCompany, formUrl, propertyAddress } = params;

  const infoRows: Array<{ label: string; value: string }> = [
    { label: "Certificador", value: certifierName },
  ];
  if (certifierCompany) infoRows.push({ label: "Empresa",     value: certifierCompany });
  if (certifierPhone)   infoRows.push({ label: "Teléfono",    value: certifierPhone });
  if (propertyAddress)  infoRows.push({ label: "Inmueble",    value: propertyAddress });

  const body = `
    ${h1("Necesitamos tus datos para el certificado energético")}
    ${p("Hola <strong>" + (ownerName || "") + "</strong>,")}
    ${p("<strong>" + certifierName + "</strong>" + (certifierCompany ? " de " + certifierCompany : "") + " necesita que rellenes un formulario con los datos de tu vivienda para poder tramitar el <strong>certificado de eficiencia energética (CEE)</strong>.")}
    ${p("Solo te llevará <strong>3–5 minutos</strong> y puedes hacerlo desde el móvil, sin crear ninguna cuenta.")}
    ${infoBlock(infoRows)}
    ${btn("Rellenar formulario →", formUrl, "#065f46")}
    ${divider()}
    ${p("El enlace es personal para ti. Si tienes alguna duda, contacta directamente con tu certificador.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: certifierName + " te pide datos para tu certificado energético",
    html: htmlWrap(body, "Rellena el formulario para tu certificado energético — solo 3 minutos."),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CONFIRMACIÓN AL PROPIETARIO (después de enviar el formulario)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendOwnerConfirmationEmail(params: {
  to: string;
  ownerName: string;
  certifierName: string;
  certifierPhone?: string | null;
  certifierEmail?: string | null;
  propertyAddress?: string | null;
}): Promise<void> {
  if (!params.to) return;
  const { to, ownerName, certifierName, certifierPhone, certifierEmail, propertyAddress } = params;

  const contactRows: Array<{ label: string; value: string }> = [
    { label: "Certificador", value: certifierName },
  ];
  if (certifierEmail) contactRows.push({ label: "Email",    value: certifierEmail });
  if (certifierPhone) contactRows.push({ label: "Teléfono", value: certifierPhone });
  if (propertyAddress) contactRows.push({ label: "Inmueble", value: propertyAddress });

  const body = `
    ${h1("¡Datos recibidos! Gracias, " + (ownerName || "") + ".")}
    ${p("Hemos recibido correctamente los datos de tu vivienda. Tu certificador los revisará y se pondrá en contacto contigo en breve.")}
    ${p("Puedes guardar este email como justificante de que enviaste tu información.")}
    ${infoBlock(contactRows)}
    ${divider()}
    ${p("¿Algo no está bien o quieres añadir información? Contacta directamente con tu certificador usando los datos de arriba.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "Hemos recibido tus datos — CERTIFIVE",
    html: htmlWrap(body, "Confirmación de recepción de datos para tu certificado energético."),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. NOTIFICACIÓN AL CERTIFICADOR (propietario completó el formulario)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendCertifierNotification(params: {
  to: string;
  certifierName: string;
  ownerName: string;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  propertyAddress?: string | null;
  certificationId: number;
}): Promise<void> {
  if (!params.to) return;
  const { to, certifierName, ownerName, ownerPhone, ownerEmail, propertyAddress, certificationId } = params;

  const certUrl = `${APP_URL}/certifications/${certificationId}`;

  const infoRows: Array<{ label: string; value: string }> = [
    { label: "Propietario",  value: ownerName },
  ];
  if (ownerEmail)         infoRows.push({ label: "Email",    value: ownerEmail });
  if (ownerPhone)         infoRows.push({ label: "Teléfono", value: ownerPhone });
  if (propertyAddress)    infoRows.push({ label: "Inmueble", value: propertyAddress });

  const body = `
    ${h1("✅ " + ownerName + " ha enviado sus datos")}
    ${p("Hola <strong>" + (certifierName || "") + "</strong>,")}
    ${p("El propietario ha completado el formulario con los datos de su vivienda. Ya tienes toda la información necesaria para continuar con la certificación.")}
    ${infoBlock(infoRows)}
    ${btn("Ver certificación →", certUrl)}
    ${divider()}
    ${p("Recuerda actualizar el estado de la certificación una vez que la hayas tramitado.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "✅ " + ownerName + " ha enviado los datos del formulario",
    html: htmlWrap(body, ownerName + " completó el formulario. Ya tienes sus datos."),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST EMAIL  (only for development / admin use)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendTestEmail(to: string): Promise<void> {
  const body = `
    ${h1("Email de prueba — todo funciona ✅")}
    ${p("Si recibes este email, la integración con SendGrid está correctamente configurada en CERTIFIVE.")}
    ${infoBlock([
      { label: "Remitente",  value: FROM_EMAIL },
      { label: "Fecha",      value: new Date().toLocaleString("es-ES") },
      { label: "Entorno",    value: process.env.NODE_ENV ?? "development" },
    ])}
    ${divider()}
    ${p("Puedes eliminar el endpoint de test antes de ir a producción.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "CERTIFIVE — Test de email funcionando ✅",
    html: htmlWrap(body, "Verificación de la integración con SendGrid."),
  });
}
