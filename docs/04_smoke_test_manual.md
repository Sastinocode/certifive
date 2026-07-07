# CERTIFIVE — Smoke Test Manual E2E

> Creado: 2026-07-07 (tarea C3, TASKS_SONNET5.md)
> Guion para ejecutar A MANO en producción (o staging) antes de cada release importante.
> No es un test automatizado — es el checklist que Sebas sigue navegando la app como un
> certificador real y como un cliente real (dos pestañas / una en incógnito).

## Antes de empezar

- Usa dos navegadores o una pestaña normal + una de incógnito: una sesión es "el certificador"
  (tú, logueado), la otra es "el cliente" (sin sesión, solo con los enlaces que te vayas generando).
- Si Stripe no está en modo live todavía, usa la tarjeta de test `4242 4242 4242 4242`, cualquier
  fecha futura y cualquier CVC — o salta directamente al pago manual (bizum/transferencia), que no
  depende de Stripe.
- Si algo falla, anota la URL exacta, la acción y la respuesta (o el error de consola) antes de
  seguir — no continúes el resto del checklist con datos rotos.

---

## 1 — Crear expediente (certificador)

| Paso | URL | Acción | Resultado esperado |
|---|---|---|---|
| 1.1 | `/login` | Inicia sesión con tu cuenta de certificador | Redirige al dashboard (`/`) |
| 1.2 | `/certificados` | Pulsa **"Nueva certificación"** | Se abre el modal/formulario de alta |
| 1.3 | `/certificados` | Rellena nombre del propietario + dirección mínima y guarda | Aparece una nueva fila en la lista de certificaciones con estado **Nuevo** |
| 1.4 | `/certificados` | Abre el expediente recién creado | Se abre el panel de detalle (`CertDetailPanel`) con los datos guardados |

---

## 2 — Enviar solicitud de tasación (certificador → cliente)

| Paso | URL | Acción | Resultado esperado |
|---|---|---|---|
| 2.1 | Panel de detalle del expediente | Pulsa **generar/enviar solicitud** | Se genera un enlace del tipo `https://<host>/solicitud/<token>` y aparece opción de copiar / enviar por WhatsApp |
| 2.2 | — | Copia el enlace | El expediente pasa a estado `solicitud_enviada` |

---

## 3 — El cliente rellena la solicitud (pestaña de cliente, sin sesión)

| Paso | URL | Acción | Resultado esperado |
|---|---|---|---|
| 3.1 | `/solicitud/<token>` | Abre el enlace copiado en 2.1 | Carga el formulario con los datos del certificador (nombre, plazo de entrega) — sin pedir login |
| 3.2 | `/solicitud/<token>` | Rellena tipo de propiedad, superficie, dirección y envía | Respuesta `200 { ok: true, estimatedPrice }`. El expediente pasa a `solicitud_completada` |
| 3.3 | `/solicitud/<token>` (recargar) | Vuelve a abrir el mismo enlace | Debe indicar que ya se completó (no debe permitir reenviar) |

---

## 4 — Generar y enviar presupuesto (certificador)

| Paso | URL | Acción | Resultado esperado |
|---|---|---|---|
| 4.1 | Panel de detalle del expediente | Verifica que ves el precio estimado calculado en el paso 3.2 | El precio aparece reflejado en el expediente |
| 4.2 | Panel de detalle del expediente | Pulsa **generar presupuesto**, confirma o ajusta el precio final y el plazo | Se genera `https://<host>/presupuesto/<token>` |
| 4.3 | — | Copia el enlace de presupuesto | El expediente pasa a `presupuesto_enviado` |

---

## 5 — El cliente acepta el presupuesto

| Paso | URL | Acción | Resultado esperado |
|---|---|---|---|
| 5.1 | `/presupuesto/<token>` | Abre el enlace | Ves el importe total, el desglose en 2 tramos (habitualmente 25%/75%) y los datos del certificador |
| 5.2 | `/presupuesto/<token>` | Pulsa **Aceptar presupuesto** | Respuesta `200 { ok: true, paymentToken }`. El expediente pasa a `presupuesto_aceptado` |
| 5.3 | `/presupuesto/<token>` | Pulsa Aceptar de nuevo (recarga y repite) | Debe responder igual sin duplicar el efecto (idempotente) — no debe crear un segundo cargo |

---

## 6 — Pagar el primer tramo (test)

| Paso | URL | Acción | Resultado esperado |
|---|---|---|---|
| 6.1 | `/pay/<paymentToken>` | Abre el enlace de pago devuelto en 5.2 | Ves el importe del **tramo 1** pendiente y los métodos de pago habilitados |
| 6.2a | `/pay/<paymentToken>` | Si Stripe está configurado: paga con la tarjeta de test `4242 4242 4242 4242` | El pago se confirma; el webhook marca `tramo1PaidAt` y genera automáticamente el enlace del formulario CEE |
| 6.2b | `/pay/<paymentToken>` | Si usas pago manual: elige Bizum/transferencia, indica "pagado" | Respuesta `200 { ok: true }`. El expediente pasa a `pago_1_pendiente` |
| 6.3 (solo si 6.2b) | Panel del certificador → Cobros pendientes | Confirma manualmente el pago recibido | El expediente pasa a `pago_1_confirmado` y se genera el enlace del formulario CEE (mismo efecto que 6.2a) |

---

## 7 — El cliente rellena el formulario técnico CEE

| Paso | URL | Acción | Resultado esperado |
|---|---|---|---|
| 7.1 | `/formulario-cee/<ceeToken>` | Abre el enlace generado en el paso 6 | Carga el formulario técnico guiado (estructura, ventanas, instalaciones, fotos) |
| 7.2 | `/formulario-cee/<ceeToken>` | Completa los datos y sube al menos una foto por sección obligatoria | El envío se confirma; el expediente pasa a `formulario_cee_completado` (o equivalente) |

---

## 8 — El certificador revisa el formulario técnico

| Paso | URL | Acción | Resultado esperado |
|---|---|---|---|
| 8.1 | `/revision-tecnica/<id>` | Abre la revisión del expediente | Ves todos los datos y fotos enviados por el cliente en el paso 7 |
| 8.2 | `/revision-tecnica/<id>` | Aprueba o marca como revisado | El estado de revisión cambia y queda registrado quién y cuándo lo revisó |

---

## 9 — Subir el certificado energético final (PDF de CE3X)

| Paso | URL | Acción | Resultado esperado |
|---|---|---|---|
| 9.1 | `/certificados` → panel de detalle del expediente | Pulsa **"Subir certificado CEE"** y selecciona un PDF | El documento aparece listado en la sección de certificados del expediente |
| 9.2 | Panel de detalle del expediente | Pulsa **enviar por email** (o WhatsApp si está activo) al propietario | El cliente recibe el certificado en su email / WhatsApp |

---

## 10 — Verificación final del ciclo completo

| Paso | URL | Acción | Resultado esperado |
|---|---|---|---|
| 10.1 | `/certificados` | Localiza el expediente de esta prueba en la lista | Estado final: **Finalizado** (o el equivalente que corresponda tras la entrega) |
| 10.2 | Panel de detalle del expediente | Revisa la pestaña de pagos | Se refleja el/los tramo(s) cobrados y el importe total coincide con el presupuesto aceptado |
| 10.3 | (opcional) Bandeja de notificaciones del certificador | Revisa la campana de notificaciones | Deben existir notificaciones para: solicitud completada, presupuesto aceptado, pago recibido |

---

## Qué hacer si algo falla a mitad del checklist

1. Anota en qué paso exacto falló (número de esta tabla) y la respuesta HTTP / mensaje de error.
2. Revisa la consola del navegador (Network + Console) en el paso que falló.
3. Si el fallo es en un enlace público (`/solicitud`, `/presupuesto`, `/pay`, `/formulario-cee`),
   confirma primero que no estás logueado en esa pestaña — estos flujos son sin sesión y no deben
   requerir autenticación (si ves un 401/403 ahí, es un regresión de `checkSubscription` — ver
   `server/subscription-guard.ts`).
4. No continúes el resto del checklist con el mismo expediente si un paso intermedio no dejó el
   estado esperado — crea un expediente nuevo para la siguiente ejecución en vez de arrastrar datos
   inconsistentes.
