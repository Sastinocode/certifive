# CERTIFIVE — Estado Actual del Proyecto

> Auditoría inicial: 2026-05-16 · Última actualización: 2026-05-29  
> Commit HEAD actual: `a7e8bd1`
>
> **Cambios aplicados desde la auditoría inicial** → ver sección [Historial de mejoras](#historial-de-mejoras)

---

## Stack Técnico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime servidor | Node.js + Express | express 4.x |
| Lenguaje | TypeScript | 5.6.3 |
| ORM | Drizzle ORM | 0.45.2 |
| Base de datos | PostgreSQL (Railway) | via `pg` + `@neondatabase/serverless` |
| Autenticación | JWT (jsonwebtoken) + bcryptjs | tokens 7d / 30d |
| Frontend | React 18 + Vite | vite 5.x |
| Router frontend | Wouter | 3.3.x |
| Estado servidor | TanStack Query | 5.x |
| UI components | shadcn/ui (Radix UI) + Tailwind CSS | tailwind 3.x |
| Pagos | Stripe | stripe 18.x |
| Email | SendGrid (@sendgrid/mail) | 8.x |
| Uploads | Cloudinary | 2.x |
| WhatsApp | 360dialog REST API | custom client |
| PDF/Export | jsPDF + XLSX + docx | varios |
| Animaciones | Framer Motion | 11.x |
| Seguridad servidor | Helmet + express-rate-limit | 8.x / 8.x |
| Build tool servidor | esbuild | 0.25.x |
| Dev transpiler | tsx | 4.x |
| Notificaciones RT | SSE (Server-Sent Events) | nativo |

---

## Arquitectura del Proyecto

```
certifive/
├── client/src/           → SPA React (Vite)
│   ├── pages/            → 40+ páginas
│   ├── components/       → Layout, wizards, drawers
│   ├── contexts/         → AuthContext (JWT)
│   ├── hooks/            → useAuth, useNotifications, useOnboarding...
│   └── lib/              → queryClient, utils, exportCE3X, zonaClimatica
├── server/               → Express API
│   ├── routes/           → 16 módulos de rutas
│   ├── auth.ts           → JWT + bcrypt
│   ├── email.ts          → SendGrid (18 plantillas)
│   ├── whatsapp.ts       → 360dialog (AES-256-CBC)
│   ├── notifications.ts  → dispatcher WhatsApp/Email
│   ├── cloudinary.ts     → Upload/delete helpers
│   └── sse.ts            → Server-Sent Events
├── shared/schema.ts      → 16 tablas Drizzle
└── migrations/           → 5 migraciones SQL
```

---

## Modelos de Datos (tablas Drizzle)

| Tabla | Descripción | Estado |
|-------|-------------|--------|
| `users` | Certificadores (profesionales). Incluye Stripe, WhatsApp, configuración de pagos, firma, logo. | Funcional |
| `refresh_tokens` | Tokens de refresco JWT (rotate-on-use) | Funcional |
| `folders` | Carpetas de expedientes por cliente | Funcional |
| `certifications` | Expediente CEE central — contiene TODOS los tokens de workflow (solicitud, presupuesto, CEE, técnico, pago) | Funcional |
| `form_responses` | Snapshot inmutable de cada envío del propietario | Funcional |
| `documentos` | Archivos subidos (Cloudinary) — facturas, planos, certificados | Funcional |
| `pricing_rates` | Tarifas del certificador por tipo de inmueble + tramos por área + recargos provincia | Funcional |
| `quote_requests` | Presupuestos enviados a clientes | Funcional |
| `invoices` | Facturas emitidas | Funcional |
| `payments` | Transacciones Stripe + manuales (bizum/transferencia/efectivo) | Funcional |
| `sessions` | Legacy — pensada para un store de express-session que nunca se llegó a usar | Sin uso (C2): mantenida en schema solo por seguridad, no se lee/escribe |
| `plantillas_whatsapp` | 8 plantillas de mensaje personalizadas por certificador | Funcional |
| `mensajes_comunicacion` | Audit log de todos los mensajes enviados | Funcional |
| `notificaciones` | Notificaciones in-app para el certificador | Funcional |
| `beta_leads` | Registros desde la landing page | Funcional |
| `waitlist` | Lista de espera para módulos futuros (automatizaciones, marketing) | Funcional |
| `envelope_elements` | Elementos envolvente (fachadas, cubiertas, suelos) — Modo A | Funcional |
| `openings` | Huecos (ventanas, puertas) — Modo A | Funcional |
| `installations` | Instalaciones (calefacción, ACS, refrigeración) — Modo A | Funcional |
| `improvement_measures` | Medidas de mejora energética | Funcional |
| `visit_photos` | Fotos de visita técnica (Cloudinary) | Funcional |

---

## Rutas API (resumen por módulo)

### Auth (`/api/auth/*`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login username/password + JWT + refresh token |
| POST | `/api/auth/register` | Registro con verificación de email |
| POST | `/api/auth/refresh` | Rotar refresh token |
| POST | `/api/auth/logout` | Revocar refresh token |
| POST | `/api/auth/verify-email` | Verificar token de email |
| POST | `/api/auth/resend-verification` | Reenviar verificación |
| POST | `/api/auth/forgot-password` | Reset password (JWT stateless 1h) |
| POST | `/api/auth/reset-password` | Establecer nueva contraseña |
| POST | `/api/auth/demo` | Acceso demo sin registro |
| GET | `/api/auth/user` | Perfil del usuario autenticado |
| PUT | `/api/auth/user` | Actualizar datos personales |
| POST | `/api/auth/user/logo` | Subir logo (Cloudinary) |
| POST | `/api/auth/user/firma` | Subir firma (Cloudinary) |
| PATCH | `/api/auth/onboarding/complete` | Marcar onboarding completado |
| GET | `/api/auth/user/completeness` | % completitud de perfil |
| PUT | `/api/auth/user/notifications` | Preferencias de notificación |
| PUT | `/api/auth/user/security` | Cambiar contraseña + timezone |
| GET | `/api/auth/user/export` | Exportar datos GDPR |

### Certificaciones (`/api/certifications/*`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/certifications` | Lista (con filtros search/status/archived) |
| GET | `/api/certifications/recent` | Últimas 10 |
| GET | `/api/certifications/pending` | Pendientes (no finalizadas) |
| GET | `/api/certifications/:id` | Detalle |
| POST | `/api/certifications` | Crear |
| PUT | `/api/certifications/:id` | Actualizar |
| POST | `/api/certifications/:id/archive` | Archivar (crea carpeta si no existe) |
| DELETE | `/api/certifications/:id` | Eliminar |

### Formularios públicos (`/api/form/*`, `/api/solicitud/*`, etc.)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/certifications/:id/generate-link` | Generar enlace formulario propietario |
| GET | `/api/form/:token` | Cargar formulario (público) |
| POST | `/api/form/:token/open` | Marcar como abierto |
| POST | `/api/form/:token/submit` | Enviar formulario del propietario |
| POST | `/api/certifications/:id/send-solicitud` | Enviar link de solicitud/tasación |
| GET | `/api/solicitud/:token` | Cargar solicitud (público) |
| POST | `/api/solicitud/:token/submit` | Enviar solicitud |
| POST | `/api/certifications/:id/send-presupuesto` | Enviar presupuesto |
| GET | `/api/presupuesto/:token` | Ver presupuesto (público) |
| POST | `/api/presupuesto/:token/accept` | Aceptar presupuesto |
| POST | `/api/presupuesto/:token/request-modification` | Solicitar modificación |
| POST | `/api/certifications/:id/send-cee-form` | Enviar formulario CEE |
| GET | `/api/formulario-cee/:token` | Cargar CEE form (público) |
| POST | `/api/formulario-cee/:token/submit` | Enviar CEE form + documentos |

### Formulario técnico guiado (`/api/formulario-tecnico/*`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/certifications/:id/generate-formulario-tecnico` | Generar token Modo B |
| GET | `/api/formulario-tecnico/:token` | Cargar formulario (público) |
| POST | `/api/formulario-tecnico/:token/save` | Guardar progreso |
| POST | `/api/formulario-tecnico/:token/submit` | Enviar con fotos |
| PUT | `/api/certifications/:id/tecnico-review` | Revisar formulario técnico |

### Ficha de visita Modo A (`/api/certifications/:id/visit-data`, etc.)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/certifications/:id/visit-data` | Datos completos de visita |
| POST | `/api/certifications/:id/envelope` | Añadir elemento envolvente |
| PUT | `/api/envelope/:id` | Actualizar elemento |
| DELETE | `/api/envelope/:id` | Eliminar elemento |
| POST | `/api/certifications/:id/openings` | Añadir hueco |
| PUT | `/api/openings/:id` / DELETE | CRUD huecos |
| POST | `/api/certifications/:id/installations` | Añadir instalación |
| PUT | `/api/installations/:id` / DELETE | CRUD instalaciones |
| POST | `/api/certifications/:id/measures` | Añadir medida de mejora |
| PUT | `/api/measures/:id` / DELETE | CRUD medidas |
| POST | `/api/certifications/:id/photos` | Subir foto de visita (Cloudinary) |
| DELETE | `/api/photos/:id` | Eliminar foto |

### Export CE3X
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/certifications/:id/export-data` | Datos para exportar a CE3X |

### Pagos (`/api/pay/*`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/pay/:token` | Info de pago (público) |
| POST | `/api/pay/:token/stripe-intent` | Crear PaymentIntent Stripe |
| POST | `/api/pay/:token/manual` | Notificar pago manual |
| POST | `/api/certifications/:id/payments/:paymentId/confirm` | Confirmar pago manual |
| GET | `/api/certifications/:id/payments` | Historial de pagos |

### Suscripción Stripe (`/api/subscription/*`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/subscription` | Estado de suscripción |
| POST | `/api/subscription/portal` | Abrir Stripe Customer Portal |
| POST | `/api/subscription/checkout` | Crear sesión de checkout |
| POST | `/api/subscription/cancel` | Cancelar suscripción |
| POST | `/api/subscription/webhook` | Webhook Stripe |

### WhatsApp (`/api/whatsapp/*`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/whatsapp/status` | Estado de conexión |
| POST | `/api/whatsapp/connect` | Conectar API key 360dialog |
| DELETE | `/api/whatsapp/disconnect` | Desconectar |
| GET | `/api/whatsapp/templates` | 8 plantillas (default o custom) |
| PUT | `/api/whatsapp/templates/:tipo` | Actualizar plantilla |
| DELETE | `/api/whatsapp/templates/:tipo` | Resetear a default |
| POST | `/api/whatsapp/send/:certId` | Enviar mensaje tipo 1-8 |
| POST | `/api/whatsapp/send-manual/:certId` | Enviar mensaje libre |
| GET | `/api/whatsapp/history/:certId` | Historial de mensajes |
| POST | `/api/whatsapp/retry/:mensajeId` | Reintentar mensaje fallido |

### Facturas, Precios, Carpetas, Documentos, Notificaciones, Misc
- CRUD completo de facturas: `/api/invoices`
- CRUD tarifas: `/api/pricing`
- CRUD carpetas: `/api/folders`
- CRUD documentos: `/api/certifications/:id/documentos`
- Notificaciones in-app: `/api/notifications`, `/api/notifications/stream` (SSE)
- Catastro proxy: `/api/catastro/*`
- Stats: `/api/stats`
- Waitlist: `/api/waitlist`
- Beta leads: `/api/beta-lead`
- Health: `/api/health`

---

## Páginas Frontend (rutas Wouter)

| Ruta | Componente | Estado |
|------|-----------|--------|
| `/` | Dashboard (auth) / Landing (público) | Funcional |
| `/login` | Login | Funcional |
| `/register` | Register | Funcional |
| `/solicitar-demo` | DemoRequest | Funcional |
| `/certificacion/:id?` | CertificationWizard | Funcional |
| `/certificados` | Certificates | Funcional |
| `/certificados/nuevo` | EnhancedCertificationForm | Funcional |
| `/formulario-cee` | EnhancedCertificationForm | Funcional |
| `/certificacion-request/:id` | ViewCertificationRequest | Funcional |
| `/propiedades` | Properties | Funcional |
| `/tarifas` | Pricing | Funcional |
| `/informes` | Reports | Funcional |
| `/marketing` | Marketing | **Stub — solo waitlist** |
| `/automatizaciones` | Automations | **Stub — solo waitlist** |
| `/whatsapp` | WhatsAppManagement | Funcional |
| `/whatsapp-flow-editor` | WhatsAppFlowEditor | Funcional |
| `/configuracion` | Settings | Funcional |
| `/stripe` | StripeIntegration | Funcional |
| `/revision-tecnica/:id` | TecnicoFormReview | Funcional |
| `/visita/:id` | VisitForm | Funcional |
| `/demo-flujo` | WorkflowDemo | Demo interactivo |
| `/presupuesto/:token` | PublicPresupuesto | Funcional |
| `/solicitud/:token` | PublicSolicitud | Funcional |
| `/formulario-cee/:token` | PublicCEEForm | Funcional |
| `/formulario-tecnico/:token` | FormularioTecnicoPublico | Funcional |
| `/pay/:token` | PublicPayment | Funcional |
| `/cotizacion/:uniqueLink` | PublicQuote | Funcional |
| `/certificacion-cliente/:uniqueLink` | CertificationForm | Funcional |
| `/generador-tarifas` | PublicTariffGenerator | Funcional |
| `/success` | PaymentSuccess | Funcional |
| `/cancel` | PaymentCancel | Funcional |
| `/renovar-suscripcion` | RenovarSuscripcion | Funcional |
| `/privacy` | PrivacyPolicy | Funcional |
| `/terms` | TermsOfService | Funcional |
| `/verify-email` | VerifyEmail | Funcional (añadido) |
| `/reset-password` | ResetPassword | Funcional (añadido) |

---

## Autenticación

El sistema usa **JWT sin estado** (no express-session para proteger rutas API):
- Login → devuelve `token` (7d / 30d) + `refreshToken` (30d / 60d)
- El middleware `authenticate` lee el token desde `Authorization: Bearer` o cookie `token`
- Tokens de refresco almacenados en tabla `refresh_tokens` con rotación automática (rotate-on-use)
- Demo user: se crea automáticamente en BD sin contraseña
- Email verification: obligatoria para acceder (bloquea en login)
- Password reset: JWT stateless de 1h (no almacenado en BD)

**Actualizado (Bloque C — C2, julio 2026)**: `express-session`, `connect-pg-simple` y `memorystore`
eran residuo sin uso real (ningún handler leía/escribía `req.session`) y se han eliminado por
completo: import y `app.use(session(...))` en `server/index.ts`, la dependencia de `package.json`,
la creación de la tabla `session` (singular) en `startup-migration.ts`, y `SESSION_SECRET` de
`config.ts`/`.env.example`. No existía `replitAuth.ts` en el repo (ya se había retirado antes).
La tabla Drizzle `sessions` (plural, en `shared/schema.ts`) se mantiene intacta — nunca se
creó ni se usó realmente (nombre distinto al de connect-pg-simple), pero se deja documentada
como legacy en vez de borrarla, para no arriesgar una tabla que pudiera existir en producción.

---

## Integraciones Externas

| Integración | Estado | Notas |
|-------------|--------|-------|
| **Stripe Subscriptions** | Parcial | Price IDs no configurados en .env. Webhook funcional. Portal funcional si STRIPE_SECRET_KEY está. |
| **Stripe Payments** | Parcial | PaymentIntents funcional para pagos de clientes. Sin STRIPE_SECRET_KEY es no-op. |
| **SendGrid** | Parcial | 18 templates de email implementados. Requiere SENDGRID_API_KEY. Sin clave, no-op (no bloquea). |
| **Cloudinary** | Parcial | Uploads de logos, firmas, documentos, fotos de visita. Requiere CLOUDINARY_URL o las 3 vars separadas. Sin configurar crashea en upload. |
| **WhatsApp 360dialog** | Parcial | Conectar/desconectar funcional. API key cifrada AES-256-CBC. Requiere cuenta 360dialog por certificador. |
| **Catastro (API pública España)** | Funcional | Proxy inverso en `/api/catastro`. Parseo XML con fast-xml-parser. Cache 24h en memoria. |
| **Railway (DB)** | Funcional | PostgreSQL en Railway. SSL detectado automáticamente. |

---

## Variables de Entorno Necesarias

| Variable | Obligatoria | Estado en .env | Descripción |
|----------|-------------|----------------|-------------|
| `DATABASE_URL` | SÍ | Configurada (Railway) | Conexión PostgreSQL |
| `JWT_SECRET` | SÍ | Placeholder genérico | **Cambiar en producción** |
| `STRIPE_SECRET_KEY` | Para pagos | Placeholder | Secret key Stripe |
| `STRIPE_WEBHOOK_SECRET` | Para webhooks | Placeholder | Signing secret webhook |
| `STRIPE_PRICE_BASICO` | Para suscripciones | Placeholder | Price ID plan básico |
| `STRIPE_PRICE_PROFESIONAL` | Para suscripciones | Placeholder | Price ID plan profesional |
| `STRIPE_PRICE_EMPRESA` | Para suscripciones | Placeholder | Price ID plan empresa |
| `STRIPE_PRICE_PAY_PER_USE` | Para suscripciones | Placeholder | Price ID pay-per-use |
| `VITE_STRIPE_PUBLIC_KEY` | Para frontend | Placeholder | Public key Stripe |
| `SENDGRID_API_KEY` | Para emails | Placeholder | API key SendGrid |
| `CLOUDINARY_URL` | Para uploads | No presente | URL completa Cloudinary |
| `CLOUDINARY_CLOUD_NAME` | Para uploads | No presente | Alternativa a CLOUDINARY_URL |
| `CLOUDINARY_API_KEY` | Para uploads | No presente | Alternativa a CLOUDINARY_URL |
| `CLOUDINARY_API_SECRET` | Para uploads | No presente | Alternativa a CLOUDINARY_URL |
| `ENCRYPTION_KEY` | Para WhatsApp | No presente | Clave AES-256 (32 chars) — hay default inseguro |
| `APP_URL` | Para emails | No presente | URL pública del app (links en emails) |
| `PORT` | No (default 5000) | No presente | Puerto del servidor |

---

## Estado de Funcionalidades

| Módulo | Estado | Notas |
|--------|--------|-------|
| Registro y login | Funcional | Verificación de email obligatoria |
| Dashboard | Funcional | Stats, actividad reciente, notificaciones |
| Gestión de expedientes CEE | Funcional | CRUD completo, archivado, filtros |
| Workflow cliente (5 pasos) | Funcional | Solicitud → Presupuesto → Pago → CEE Form → Certificado |
| Formulario técnico guiado (Modo B) | Funcional | Propietario recoge datos técnicos con fotos |
| Ficha de visita técnica (Modo A) | Funcional | Envolvente, huecos, instalaciones, fotos |
| Export CE3X | Funcional | Datos en JSON para CE3X — PDF/Excel en frontend |
| Gestión de documentos | Funcional | Upload/download Cloudinary, revisión, rechazo |
| Facturas | Funcional | CRUD, numeración automática, estados |
| Tarifas | Funcional | Por tipo + tramos área + recargo provincia |
| WhatsApp 360dialog | Funcional | Conexión, 8 templates, envío, historial |
| Notificaciones in-app | Funcional | SSE real-time, unread count, bell |
| Suscripciones Stripe | Parcial | UI completa; falta configurar Price IDs reales |
| Pagos clientes Stripe | Parcial | Lógica completa; falta STRIPE_SECRET_KEY real |
| Email SendGrid | Parcial | 18 templates; falta SENDGRID_API_KEY real |
| Cloudinary uploads | Parcial | Código completo; falta CLOUDINARY_URL real |
| Informes | Funcional | Gráficos Recharts, colecciones, backup views |
| Propiedades | Funcional | Gestión inmuebles, búsqueda catastro |
| Onboarding | Funcional | Modal guided, % completitud perfil |
| Automatizaciones | Stub | Solo waitlist — módulo no implementado |
| Marketing | Stub | Solo waitlist — módulo no implementado |
| Página pública del certificador | Parcial | `CertifierLanding.tsx` existe pero no está en el router |
| `/verify-email` (frontend) | ✅ Funcional | Componente `VerifyEmail` añadido al router |
| `/reset-password` (frontend) | ✅ Funcional | Componente `ResetPassword` añadido al router |

---

## Riesgos Principales

1. ~~**CRÍTICO — Links de email van a 404**~~ ✅ **CORREGIDO** (`commit 3eef0cc` / App.tsx): Las rutas `/verify-email` y `/reset-password` fueron añadidas al router con sus componentes correspondientes.

2. **CRÍTICO — JWT_SECRET genérico en producción**: `certifive-dev-secret-2024` está en el código como fallback. Si no se setea `JWT_SECRET` en Railway, los tokens son predecibles.

3. ~~**BUG — `req.userId` vs `req.user.id`**~~ ✅ **CORREGIDO** (`commit 5362e2e`): Se creó `server/types/express.d.ts` con la augmentación global de Express Request. Se reemplazaron 64 ocurrencias de `(req as any).user.id` → `req.user!.id` en 18 archivos de rutas. Se eliminó `// @ts-nocheck` de `export-ce3x.ts`. TypeScript pasa con 0 errores.

4. **ALTO — Cloudinary no configurado**: Sin `CLOUDINARY_URL`, cualquier upload (documentos, fotos de visita, logo, firma) falla con error no controlado que puede crashear el handler.

5. **ALTO — Stripe en modo placeholder**: Todos los pagos de suscripción y los pagos de clientes están en modo no-operativo hasta configurar las keys reales.

6. ✅ **CORREGIDO (`c469edc`) — SQL injection en misc.ts**: Reemplazadas queries SQL con interpolación de strings por `db.select({ value: count() }).from(waitlist).where(eq(...))` — completamente parametrizado con Drizzle ORM.

7. ~~**MEDIO — SESSION_SECRET no seteada**~~ ✅ **CORREGIDO (Bloque C — C2)**: `express-session` no tenía ningún uso real (auth es JWT vía `Authorization: Bearer`) y se eliminó por completo junto con `SESSION_SECRET`. Ya no aplica.

8. ✅ **YA ELIMINADO — `server/routes.ts` (monolítico)**: Archivo de 2000+ líneas ya no existe en el repositorio.

9. ✅ **YA ELIMINADO — Archivos dead code en frontend**: `properties-broken.tsx`, `certification-wizard-old.tsx`, `reports-backup.tsx`, `reports-collections.tsx` ya no existen en el repositorio.

10. ~~**BAJO — Login no busca por email**~~ ✅ **FALSO POSITIVO**: La auditoría inicial fue incorrecta. El código ya usa `or(eq(users.username, lookup), eq(users.email, lookup))` — acepta tanto username como email desde el inicio.

---

## Historial de mejoras

### Sprint 2026-05-16 → 2026-05-29

| Commit | Descripción |
|--------|-------------|
| `255994c` | **chore**: upgrade drizzle-orm `0.39.3 → 0.45.2` (security + API correcta) |
| `bd5f265` | **feat**: consentimiento RGPD en todos los formularios públicos (LOPDGDD art. 6.1.a) |
| `1a971c6` | **fix**: `id` en `AuthContext` siempre es `number` (elimina ambigüedad `string\|number`) |
| `5362e2e` | **refactor**: eliminar `// @ts-nocheck` + tipar `req.user` en todo el servidor — 64 ocurrencias de `(req as any).user.id` → `req.user!.id` en 18 ficheros — TypeScript: 0 errores |
| `3eef0cc` | **test**: tests mínimos de API — vitest + supertest — 10 tests en 4 suites (health, login, cert, CE3X) |
| `c469edc` | **fix**: SQL injection en waitlist — count parametrizado con Drizzle ORM |
| `9e36095` | **refactor**: onboarding simplificado a pantalla única (nombre, empresa, teléfono, DNI) — de 689 → 172 líneas |
| `a7e8bd1` | **docs**: estado_actual actualizado — onboarding y SQL injection marcados como resueltos |

### Pendiente (backlog técnico)

| Prioridad | Tarea |
|-----------|-------|
| CRÍTICO | Setear `JWT_SECRET` real en Railway (nunca usar el fallback de código) |
| ALTO | Configurar Cloudinary (`CLOUDINARY_URL`) — sin esto los uploads crashean |
| ALTO | Configurar Stripe Price IDs reales — suscripciones no operativas |
| ALTO | Configurar `SENDGRID_API_KEY` real — sin esto no se envía ningún email |
| ~~MEDIO~~ | ~~Eliminar `server/routes.ts`~~ → ✅ Ya eliminado del repo |
| ~~MEDIO~~ | ~~Eliminar páginas dead code frontend~~ → ✅ Ya eliminado del repo |
| ~~BAJO~~ | ~~Parametrizar query SQL en `misc.ts`~~ → ✅ `c469edc` |
| BAJO | Test CE3X real — generar XML e importar en software CE3X para validar |
| ~~BAJO~~ | ~~Simplificar flujo de onboarding~~ → ✅ `9e36095` |
