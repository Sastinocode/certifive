// @ts-nocheck
/**
 * CERTIFIVE â€” Email service
 *
 * Uses SendGrid. If SENDGRID_API_KEY is missing, all sends are no-ops
 * (logged as warnings) so the app never crashes because of a missing key.
 *
 * FROM address: no-reply@certifive.es
 *
 * Emails implemented
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * 1. sendWelcomeEmail          â†’ certifier registers
 * 2. sendEmailVerification     â†’ certifier verifies email
 * 3. sendPasswordResetEmail    â†’ certifier forgot password
 * 4. sendFormLinkEmail         â†’ owner receives link to fill the form
 * 5. sendOwnerConfirmationEmailâ†’ owner receives receipt after submitting
 * 6. sendCertifierNotification â†’ certifier notified when owner submits
 */

import sgMail from "@sendgrid/mail";

// â”€â”€â”€ Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const FROM_EMAIL = process.env.FROM_EMAIL ?? "no-reply@certifive.es";
const FROM_NAME  = "CERTIFIVE";
const APP_URL    = (process.env.APP_URL ?? "https://certifive.es").replace(/\/$/, "");

let ready = false;

export function initEmail(): void {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) {
    console.warn("[email] âš ï¸  SENDGRID_API_KEY not set â€” all emails disabled");
    return;
  }
  sgMail.setApiKey(key);
  ready = true;
  console.log("[email] âœ… SendGrid ready (from: " + FROM_EMAIL + ")");
}

// â”€â”€â”€ Core sender â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function send(msg: sgMail.MailDataRequired): Promise<void> {
  if (!ready) {
    console.warn("[email] skip (not ready):", msg.subject);
    return;
  }
  try {
    await sgMail.send(msg);
    console.log("[email] sent:", msg.subject, "â†’", msg.to);
  } catch (err: any) {
    // Log but never throw â€” emails must not break the main request flow
    const detail = err?.response?.body?.errors ?? err?.message ?? err;
    console.error("[email] failed:", msg.subject, detail);
  }
}

// â”€â”€â”€ Shared HTML helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f0fdf4">${preheader}&nbsp;â€Œ&nbsp;â€Œ&nbsp;â€Œ&nbsp;â€Œ&nbsp;â€Œ&nbsp;â€Œ&nbsp;â€Œ</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4">
    <tr><td align="center" style="padding:40px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">

        <!-- HEADER -->
        <tr><td style="background:#064e3b;border-radius:16px 16px 0 0;padding:32px 40px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="display:inline-block;background:rgba(255,255,255,.12);border-radius:10px;padding:8px 12px;font-size:13px;font-weight:bold;color:#fff;letter-spacing:.5px">
                  ðŸŒ¿ CERTIFIVE
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
            Este email fue enviado automÃ¡ticamente por <strong>CERTIFIVE</strong>.<br>
            Si no esperabas este mensaje, ignÃ³ralo.<br>
            <a href="${APP_URL}" style="color:#059669;text-decoration:none">certifive.es</a>
            &nbsp;Â·&nbsp;
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 1. BIENVENIDA (certifier registers)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  username: string;
}): Promise<void> {
  if (!params.to) return;
  const { to, name, username } = params;

  const body = `
    ${h1("Â¡Bienvenido a CERTIFIVE, " + (name || username) + "!")}
    ${p("Tu cuenta de certificador energÃ©tico ya estÃ¡ activa. Desde ahora puedes gestionar todos tus certificados CEE desde un solo lugar.")}
    ${infoBlock([
      { label: "Usuario",   value: username },
      { label: "Acceso",    value: APP_URL },
    ])}
    ${btn("Ir a mi panel â†’", APP_URL)}
    ${divider()}
    ${p("Â¿Tienes alguna duda? EscrÃ­benos a <a href='mailto:soporte@certifive.es' style='color:#059669'>soporte@certifive.es</a>", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "Bienvenido a CERTIFIVE â€” Tu cuenta estÃ¡ activa",
    html: htmlWrap(body, "Tu cuenta de certificador ya estÃ¡ lista."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 2. VERIFICACIÃ“N DE EMAIL
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendEmailVerification(params: {
  to: string;
  name: string;
  verificationToken: string;
}): Promise<void> {
  if (!params.to) return;
  const { to, name, verificationToken } = params;
  const verifyUrl = `${APP_URL}/verify-email?token=${verificationToken}`;

  const body = `
    ${h1("Confirma tu direcciÃ³n de email")}
    ${p("Hola " + (name || "certificador") + ", haz clic en el botÃ³n para verificar tu email y activar todas las funciones de tu cuenta.")}
    ${btn("Verificar email â†’", verifyUrl)}
    ${divider()}
    ${p("Este enlace caduca en <strong>24 horas</strong>. Si no creaste una cuenta en CERTIFIVE, ignora este email.", { color: "#6b7280", size: "13px" })}
    ${p("O copia este enlace en tu navegador:<br><span style='font-size:12px;color:#059669;word-break:break-all'>${verifyUrl}</span>", { color: "#6b7280", size: "13px" })}
  `.replace("${verifyUrl}", verifyUrl);

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "CERTIFIVE â€” Confirma tu email",
    html: htmlWrap(body, "Confirma tu direcciÃ³n de email para activar tu cuenta."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 3. RECUPERACIÃ“N DE CONTRASEÃ‘A
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetToken: string;
}): Promise<void> {
  if (!params.to) return;
  const { to, name, resetToken } = params;
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

  const body = `
    ${h1("Restablecer contraseÃ±a")}
    ${p("Hola " + (name || "") + ", recibimos una solicitud para restablecer la contraseÃ±a de tu cuenta CERTIFIVE.")}
    ${p("Haz clic en el botÃ³n para elegir una nueva contraseÃ±a:")}
    ${btn("Restablecer contraseÃ±a â†’", resetUrl, "#ea580c")}
    ${divider()}
    ${p("Este enlace <strong>caduca en 1 hora</strong>. Si no solicitaste el cambio, ignora este email â€” tu contraseÃ±a actual sigue siendo la misma.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "CERTIFIVE â€” Restablece tu contraseÃ±a",
    html: htmlWrap(body, "Solicitud de cambio de contraseÃ±a."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 4. LINK DEL FORMULARIO â†’ PROPIETARIO
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  if (certifierPhone)   infoRows.push({ label: "TelÃ©fono",    value: certifierPhone });
  if (propertyAddress)  infoRows.push({ label: "Inmueble",    value: propertyAddress });

  const body = `
    ${h1("Necesitamos tus datos para el certificado energÃ©tico")}
    ${p("Hola <strong>" + (ownerName || "") + "</strong>,")}
    ${p("<strong>" + certifierName + "</strong>" + (certifierCompany ? " de " + certifierCompany : "") + " necesita que rellenes un formulario con los datos de tu vivienda para poder tramitar el <strong>certificado de eficiencia energÃ©tica (CEE)</strong>.")}
    ${p("Solo te llevarÃ¡ <strong>3â€“5 minutos</strong> y puedes hacerlo desde el mÃ³vil, sin crear ninguna cuenta.")}
    ${infoBlock(infoRows)}
    ${btn("Rellenar formulario â†’", formUrl, "#065f46")}
    ${divider()}
    ${p("El enlace es personal para ti. Si tienes alguna duda, contacta directamente con tu certificador.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: certifierName + " te pide datos para tu certificado energÃ©tico",
    html: htmlWrap(body, "Rellena el formulario para tu certificado energÃ©tico â€” solo 3 minutos."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 5. CONFIRMACIÃ“N AL PROPIETARIO (despuÃ©s de enviar el formulario)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  if (certifierPhone) contactRows.push({ label: "TelÃ©fono", value: certifierPhone });
  if (propertyAddress) contactRows.push({ label: "Inmueble", value: propertyAddress });

  const body = `
    ${h1("Â¡Datos recibidos! Gracias, " + (ownerName || "") + ".")}
    ${p("Hemos recibido correctamente los datos de tu vivienda. Tu certificador los revisarÃ¡ y se pondrÃ¡ en contacto contigo en breve.")}
    ${p("Puedes guardar este email como justificante de que enviaste tu informaciÃ³n.")}
    ${infoBlock(contactRows)}
    ${divider()}
    ${p("Â¿Algo no estÃ¡ bien o quieres aÃ±adir informaciÃ³n? Contacta directamente con tu certificador usando los datos de arriba.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "Hemos recibido tus datos â€” CERTIFIVE",
    html: htmlWrap(body, "ConfirmaciÃ³n de recepciÃ³n de datos para tu certificado energÃ©tico."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 6. NOTIFICACIÃ“N AL CERTIFICADOR (propietario completÃ³ el formulario)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  if (ownerPhone)         infoRows.push({ label: "TelÃ©fono", value: ownerPhone });
  if (propertyAddress)    infoRows.push({ label: "Inmueble", value: propertyAddress });

  const body = `
    ${h1("âœ… " + ownerName + " ha enviado sus datos")}
    ${p("Hola <strong>" + (certifierName || "") + "</strong>,")}
    ${p("El propietario ha completado el formulario con los datos de su vivienda. Ya tienes toda la informaciÃ³n necesaria para continuar con la certificaciÃ³n.")}
    ${infoBlock(infoRows)}
    ${btn("Ver certificaciÃ³n â†’", certUrl)}
    ${divider()}
    ${p("Recuerda actualizar el estado de la certificaciÃ³n una vez que la hayas tramitado.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "âœ… " + ownerName + " ha enviado los datos del formulario",
    html: htmlWrap(body, ownerName + " completÃ³ el formulario. Ya tienes sus datos."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 7. SOLICITUD DE TASACIÃ“N â†’ PROPIETARIO  (/solicitud/[token])
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendSolicitudLinkEmail(params: {
  to: string;
  ownerName: string;
  certifierName: string;
  certifierPhone?: string | null;
  certifierCompany?: string | null;
  solicitudUrl: string;
  propertyAddress?: string | null;
}): Promise<void> {
  if (!params.to) return;
  const { to, ownerName, certifierName, certifierPhone, certifierCompany, solicitudUrl, propertyAddress } = params;

  const rows: Array<{ label: string; value: string }> = [
    { label: "Certificador", value: certifierName },
  ];
  if (certifierCompany) rows.push({ label: "Empresa", value: certifierCompany });
  if (certifierPhone) rows.push({ label: "TelÃ©fono", value: certifierPhone });
  if (propertyAddress) rows.push({ label: "Inmueble", value: propertyAddress });

  const body = `
    ${h1("Te enviamos el formulario de solicitud")}
    ${p("Hola <strong>" + (ownerName || "") + "</strong>,")}
    ${p("<strong>" + certifierName + "</strong> necesita que rellenes unos datos bÃ¡sicos sobre tu inmueble para preparar el <strong>presupuesto de tu certificado energÃ©tico (CEE)</strong>.")}
    ${p("Solo te llevarÃ¡ <strong>2 minutos</strong>. Sin crear cuenta, desde el mÃ³vil.")}
    ${infoBlock(rows)}
    ${btn("Rellenar solicitud â†’", solicitudUrl, "#065f46")}
    ${divider()}
    ${p("El enlace es personal para ti. Caduca en 30 dÃ­as.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: certifierName + " â€” Solicitud de tasaciÃ³n para tu certificado energÃ©tico",
    html: htmlWrap(body, "Rellena el formulario de tasaciÃ³n para recibir tu presupuesto."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 8. NUEVA SOLICITUD ENTRANTE â†’ CERTIFICADOR  (VÃ­a B â€” landing pÃºblica)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendNuevaSolicitudEmail(params: {
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
  const certUrl = `${APP_URL}`;

  const rows: Array<{ label: string; value: string }> = [
    { label: "Propietario", value: ownerName },
  ];
  if (ownerEmail) rows.push({ label: "Email", value: ownerEmail });
  if (ownerPhone) rows.push({ label: "TelÃ©fono", value: ownerPhone });
  if (propertyAddress) rows.push({ label: "Inmueble", value: propertyAddress });

  const body = `
    ${h1("ðŸ“‹ Nueva solicitud de tasaciÃ³n")}
    ${p("Hola <strong>" + (certifierName || "") + "</strong>,")}
    ${p("Has recibido una nueva solicitud de tasaciÃ³n a travÃ©s de tu pÃ¡gina pÃºblica. El propietario ha rellenado sus datos y estÃ¡ esperando tu presupuesto.")}
    ${infoBlock(rows)}
    ${btn("Ver en el panel â†’", certUrl)}
    ${divider()}
    ${p("Accede al panel para revisar los detalles y enviarle el presupuesto.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "ðŸ“‹ Nueva solicitud de " + ownerName,
    html: htmlWrap(body, "Nueva solicitud de tasaciÃ³n pendiente de presupuesto."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 9. PRESUPUESTO â†’ PROPIETARIO  (/presupuesto/[token])
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendPresupuestoEmail(params: {
  to: string;
  ownerName: string;
  certifierName: string;
  certifierCompany?: string | null;
  presupuestoUrl: string;
  propertyAddress?: string | null;
  amount: number;
  plazoEntregaDias?: number | null;
}): Promise<void> {
  if (!params.to) return;
  const { to, ownerName, certifierName, certifierCompany, presupuestoUrl, propertyAddress, amount, plazoEntregaDias } = params;

  const rows: Array<{ label: string; value: string }> = [
    { label: "Certificador", value: certifierName },
  ];
  if (certifierCompany) rows.push({ label: "Empresa", value: certifierCompany });
  if (propertyAddress) rows.push({ label: "Inmueble", value: propertyAddress });
  rows.push({ label: "Importe", value: amount.toFixed(2) + " â‚¬ (IVA incluido)" });
  if (plazoEntregaDias) rows.push({ label: "Plazo estimado", value: plazoEntregaDias + " dÃ­as laborables" });

  const body = `
    ${h1("Tu presupuesto estÃ¡ listo")}
    ${p("Hola <strong>" + (ownerName || "") + "</strong>,")}
    ${p("<strong>" + certifierName + "</strong>" + (certifierCompany ? " de " + certifierCompany : "") + " ha preparado tu presupuesto para el certificado de eficiencia energÃ©tica.")}
    ${p("RevÃ­salo y, si todo es correcto, acÃ©ptalo para iniciar el proceso.")}
    ${infoBlock(rows)}
    ${btn("Ver presupuesto â†’", presupuestoUrl, "#065f46")}
    ${divider()}
    ${p("El presupuesto es vÃ¡lido durante 30 dÃ­as. Si tienes dudas, contacta directamente con tu certificador.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: certifierName + " â€” Tu presupuesto para el certificado energÃ©tico",
    html: htmlWrap(body, "Tu presupuesto para el certificado energÃ©tico estÃ¡ listo."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 10. PRESUPUESTO ACEPTADO â†’ CERTIFICADOR
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendPresupuestoAceptadoEmail(params: {
  to: string;
  certifierName: string;
  ownerName: string;
  propertyAddress?: string | null;
  amount: number;
  certificationId: number;
}): Promise<void> {
  if (!params.to) return;
  const { to, certifierName, ownerName, propertyAddress, amount, certificationId } = params;

  const rows: Array<{ label: string; value: string }> = [
    { label: "Propietario", value: ownerName },
    { label: "Importe aceptado", value: amount.toFixed(2) + " â‚¬" },
  ];
  if (propertyAddress) rows.push({ label: "Inmueble", value: propertyAddress });

  const body = `
    ${h1("âœ… Presupuesto aceptado")}
    ${p("Hola <strong>" + (certifierName || "") + "</strong>,")}
    ${p("<strong>" + ownerName + "</strong> ha aceptado el presupuesto y estÃ¡ listo para proceder al pago.")}
    ${infoBlock(rows)}
    ${btn("Ver en el panel â†’", APP_URL)}
    ${divider()}
    ${p("Se ha enviado al cliente el enlace de pago automÃ¡ticamente.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "âœ… " + ownerName + " ha aceptado el presupuesto",
    html: htmlWrap(body, ownerName + " aceptÃ³ el presupuesto. El pago estÃ¡ en curso."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 11. SOLICITUD DE MODIFICACIÃ“N DEL PRESUPUESTO â†’ CERTIFICADOR
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendModificacionPresupuestoEmail(params: {
  to: string;
  certifierName: string;
  ownerName: string;
  motivo: string;
  certificationId: number;
}): Promise<void> {
  if (!params.to) return;
  const { to, certifierName, ownerName, motivo } = params;

  const body = `
    ${h1("âœï¸ Solicitud de modificaciÃ³n del presupuesto")}
    ${p("Hola <strong>" + (certifierName || "") + "</strong>,")}
    ${p("<strong>" + ownerName + "</strong> ha solicitado una modificaciÃ³n en el presupuesto con el siguiente motivo:")}
    <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0">
      <p style="margin:0;font-size:14px;color:#92400e;line-height:1.6">"${motivo}"</p>
    </div>
    ${btn("Ver en el panel â†’", APP_URL, "#ea580c")}
    ${divider()}
    ${p("Contacta con el cliente para aclarar los detalles y envÃ­ale un presupuesto revisado.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "âœï¸ " + ownerName + " solicita modificar el presupuesto",
    html: htmlWrap(body, ownerName + " quiere modificar el presupuesto."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 12. ENLACE DE PAGO â†’ PROPIETARIO  (/pay/[token])
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendPaymentLinkEmail(params: {
  to: string;
  ownerName: string;
  certifierName: string;
  paymentUrl: string;
  amount: number;
  tramo: 1 | 2;
  propertyAddress?: string | null;
}): Promise<void> {
  if (!params.to) return;
  const { to, ownerName, certifierName, paymentUrl, amount, tramo, propertyAddress } = params;

  const tramoLabel = tramo === 1 ? "Primer pago (inicio del servicio)" : "Segundo pago (entrega del certificado)";
  const rows: Array<{ label: string; value: string }> = [
    { label: "Concepto", value: tramoLabel },
    { label: "Importe", value: amount.toFixed(2) + " â‚¬ (IVA incluido)" },
  ];
  if (propertyAddress) rows.push({ label: "Inmueble", value: propertyAddress });

  const body = `
    ${h1(tramo === 1 ? "Realiza el primer pago" : "Realiza el pago final")}
    ${p("Hola <strong>" + (ownerName || "") + "</strong>,")}
    ${p(tramo === 1
      ? "Para dar inicio a tu certificado energÃ©tico, necesitamos que realices el <strong>primer pago</strong>."
      : "Tu certificado energÃ©tico estÃ¡ listo. Realiza el <strong>pago final</strong> para recibirlo."
    )}
    ${infoBlock(rows)}
    ${btn("Pagar ahora â†’", paymentUrl, "#065f46")}
    ${divider()}
    ${p("Aceptamos tarjeta, Bizum, transferencia bancaria y efectivo. Elige el mÃ©todo que prefieras.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: certifierName + " â€” " + (tramo === 1 ? "Realiza el primer pago" : "Pago final para recibir tu certificado"),
    html: htmlWrap(body, "Realiza tu pago para continuar con el certificado energÃ©tico."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 13. CONFIRMACIÃ“N DE PAGO â†’ PROPIETARIO
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendPagoConfirmadoEmail(params: {
  to: string;
  ownerName: string;
  certifierName: string;
  amount: number;
  tramo: 1 | 2;
  ceeFormUrl?: string | null;
}): Promise<void> {
  if (!params.to) return;
  const { to, ownerName, certifierName, amount, tramo, ceeFormUrl } = params;

  const nextStep = tramo === 1
    ? (ceeFormUrl
        ? `${btn("Rellenar formulario CEE â†’", ceeFormUrl, "#065f46")}<p style="font-size:14px;color:#374151;margin:16px 0 0">El siguiente paso es rellenar el formulario detallado de tu vivienda para que el certificador pueda redactar el certificado.</p>`
        : `<p style="font-size:14px;color:#374151;margin:16px 0 0">Tu certificador se pondrÃ¡ en contacto contigo para indicarte los prÃ³ximos pasos.</p>`)
    : `<p style="font-size:14px;color:#374151;margin:16px 0 0">RecibirÃ¡s tu certificado energÃ©tico en breve.</p>`;

  const body = `
    ${h1("âœ… Pago confirmado â€” Gracias, " + (ownerName || "") + ".")}
    ${p("Hemos recibido tu pago correctamente.")}
    ${infoBlock([
      { label: "Concepto", value: tramo === 1 ? "Primer pago (inicio del servicio)" : "Pago final" },
      { label: "Importe", value: amount.toFixed(2) + " â‚¬" },
      { label: "Certificador", value: certifierName },
    ])}
    ${nextStep}
    ${divider()}
    ${p("Guarda este email como justificante de pago.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "âœ… Pago confirmado â€” " + amount.toFixed(2) + " â‚¬",
    html: htmlWrap(body, "Tu pago ha sido confirmado correctamente."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 14. PAGO MANUAL PENDIENTE â†’ CERTIFICADOR
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendPagoManualPendienteEmail(params: {
  to: string;
  certifierName: string;
  ownerName: string;
  metodo: string;
  amount: number;
  tramo: 1 | 2;
}): Promise<void> {
  if (!params.to) return;
  const { to, certifierName, ownerName, metodo, amount, tramo } = params;

  const metodosLabel: Record<string, string> = {
    bizum: "Bizum",
    transferencia: "Transferencia bancaria",
    efectivo: "Efectivo",
  };

  const body = `
    ${h1("ðŸ’³ Pago pendiente de confirmaciÃ³n")}
    ${p("Hola <strong>" + (certifierName || "") + "</strong>,")}
    ${p("<strong>" + ownerName + "</strong> ha notificado que va a realizar el pago del tramo " + tramo + " por <strong>" + metodosLabel[metodo] ?? metodo + "</strong>.")}
    ${infoBlock([
      { label: "Propietario", value: ownerName },
      { label: "Importe", value: amount.toFixed(2) + " â‚¬" },
      { label: "MÃ©todo", value: metodosLabel[metodo] ?? metodo },
      { label: "Tramo", value: "Pago " + tramo + " de 2" },
    ])}
    ${btn("Confirmar pago â†’", APP_URL)}
    ${divider()}
    ${p("Accede al panel y confirma el pago una vez lo hayas recibido. Esto desbloquearÃ¡ el siguiente paso para el cliente.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "ðŸ’³ " + ownerName + " â€” pago pendiente de confirmar (" + amount.toFixed(2) + " â‚¬)",
    html: htmlWrap(body, "Pago pendiente de confirmaciÃ³n."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 15. ENLACE FORMULARIO CEE â†’ PROPIETARIO  (/formulario-cee/[token])
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendCEEFormLinkEmail(params: {
  to: string;
  ownerName: string;
  certifierName: string;
  ceeFormUrl: string;
  propertyAddress?: string | null;
}): Promise<void> {
  if (!params.to) return;
  const { to, ownerName, certifierName, ceeFormUrl, propertyAddress } = params;

  const rows: Array<{ label: string; value: string }> = [
    { label: "Certificador", value: certifierName },
  ];
  if (propertyAddress) rows.push({ label: "Inmueble", value: propertyAddress });

  const body = `
    ${h1("Siguiente paso: Formulario detallado")}
    ${p("Hola <strong>" + (ownerName || "") + "</strong>,")}
    ${p("Tu pago ha sido confirmado. El siguiente paso es que rellenes el formulario detallado de tu vivienda para que <strong>" + certifierName + "</strong> pueda redactar el certificado energÃ©tico oficial.")}
    ${p("El formulario tiene 8 pasos y tarda aproximadamente <strong>10â€“15 minutos</strong>. Puedes guardarlo y continuar mÃ¡s tarde.")}
    ${infoBlock(rows)}
    ${btn("Rellenar formulario CEE â†’", ceeFormUrl, "#065f46")}
    ${divider()}
    ${p("NecesitarÃ¡s tener a mano las facturas de luz y gas de los Ãºltimos 12 meses si es posible.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: certifierName + " â€” Rellena el formulario detallado de tu vivienda",
    html: htmlWrap(body, "Rellena el formulario detallado para tu certificado energÃ©tico."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 16. DOCUMENTOS RECIBIDOS â†’ CERTIFICADOR  (propietario completÃ³ formulario CEE)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendDocumentosRecibidosEmail(params: {
  to: string;
  certifierName: string;
  ownerName: string;
  ownerPhone?: string | null;
  propertyAddress?: string | null;
  numDocumentos: number;
  certificationId: number;
}): Promise<void> {
  if (!params.to) return;
  const { to, certifierName, ownerName, ownerPhone, propertyAddress, numDocumentos } = params;

  const rows: Array<{ label: string; value: string }> = [
    { label: "Propietario", value: ownerName },
    { label: "Documentos", value: numDocumentos + " archivos adjuntos" },
  ];
  if (ownerPhone) rows.push({ label: "TelÃ©fono", value: ownerPhone });
  if (propertyAddress) rows.push({ label: "Inmueble", value: propertyAddress });

  const body = `
    ${h1("ðŸ“ Formulario CEE completado")}
    ${p("Hola <strong>" + (certifierName || "") + "</strong>,")}
    ${p("<strong>" + ownerName + "</strong> ha completado el formulario detallado de su vivienda y ha adjuntado la documentaciÃ³n necesaria.")}
    ${infoBlock(rows)}
    ${btn("Ver documentos â†’", APP_URL)}
    ${divider()}
    ${p("Revisa la documentaciÃ³n y actualiza el estado de la certificaciÃ³n.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "ðŸ“ " + ownerName + " ha enviado la documentaciÃ³n CEE",
    html: htmlWrap(body, ownerName + " completÃ³ el formulario CEE y adjuntÃ³ documentos."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 17. DOCUMENTO RECHAZADO â†’ PROPIETARIO  (certifier requests re-upload)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendDocumentoRechazadoEmail(params: {
  to: string;
  ownerName: string;
  certifierName: string;
  tipoDoc: string;
  motivo: string;
  ceeFormUrl: string;
}): Promise<void> {
  if (!params.to) return;
  const { to, ownerName, certifierName, tipoDoc, motivo, ceeFormUrl } = params;

  const body = `
    ${h1("ðŸ“Ž Necesitamos un documento actualizado")}
    ${p("Hola <strong>" + (ownerName || "") + "</strong>,")}
    ${p("<strong>" + certifierName + "</strong> ha revisado los documentos que enviaste y necesita que reemplaces el siguiente documento:")}
    <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.5px">Documento</p>
      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#92400e">${tipoDoc}</p>
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.5px">Motivo</p>
      <p style="margin:0;font-size:14px;color:#92400e">"${motivo}"</p>
    </div>
    ${btn("Subir documento â†’", ceeFormUrl, "#ea580c")}
    ${divider()}
    ${p("Si tienes alguna duda, contacta directamente con tu certificador.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: certifierName + " â€” Necesita que reemplaces un documento",
    html: htmlWrap(body, "Un documento necesita ser reemplazado."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// 18. BETA LEAD CONFIRMATION  (landing page registration)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendBetaLeadConfirmation(params: {
  to: string;
  nombre: string;
}): Promise<void> {
  if (!params.to) return;
  const { to, nombre } = params;

  const body = `
    ${h1("Â¡Ya estÃ¡s en la lista beta, " + (nombre || "certificador") + "! ðŸŽ‰")}
    ${p("Gracias por apuntarte al programa beta de CERTIFIVE. Eres de los primeros en dar el paso.")}
    ${p("Te avisaremos en cuanto tu acceso estÃ© listo. Mientras tanto, si tienes preguntas puedes escribirnos directamente.")}
    ${infoBlock([
      { label: "Email",   value: to },
      { label: "Estado",  value: "En lista de espera beta" },
    ])}
    ${btn("Conocer mÃ¡s sobre Certifive â†’", APP_URL)}
    ${divider()}
    ${p("Â¿Tienes alguna duda? EscrÃ­benos a <a href='mailto:hola@certifive.es' style='color:#059669'>hola@certifive.es</a>", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "Â¡Bienvenido a la beta de CERTIFIVE! ðŸŒ¿",
    html: htmlWrap(body, "Tu plaza en la beta de Certifive estÃ¡ reservada."),
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TEST EMAIL  (only for development / admin use)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendTestEmail(to: string): Promise<void> {
  const body = `
    ${h1("Email de prueba â€” todo funciona âœ…")}
    ${p("Si recibes este email, la integraciÃ³n con SendGrid estÃ¡ correctamente configurada en CERTIFIVE.")}
    ${infoBlock([
      { label: "Remitente",  value: FROM_EMAIL },
      { label: "Fecha",      value: new Date().toLocaleString("es-ES") },
      { label: "Entorno",    value: process.env.NODE_ENV ?? "development" },
    ])}
    ${divider()}
    ${p("Puedes eliminar el endpoint de test antes de ir a producciÃ³n.", { color: "#6b7280", size: "13px" })}
  `;

  await send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: "CERTIFIVE â€” Test de email funcionando âœ…",
    html: htmlWrap(body, "VerificaciÃ³n de la integraciÃ³n con SendGrid."),
  });
}
