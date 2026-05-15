# Auditoria tecnica profunda de Certifive

Fecha de auditoria: 2026-05-15  
Repositorio: `https://github.com/Sastinocode/certifive.git`  
Rama auditada: `main`  
Commit auditado: `d112c76575f38386dc16358ed5453e42440595a6`

## Resumen ejecutivo

Certifive es una aplicacion web full-stack ya avanzada, con producto funcional para gestion de certificaciones energeticas, formularios publicos, presupuestos, pagos, notificaciones, documentos, visitas tecnicas, WhatsApp y facturacion. La base es recuperable y contiene piezas valiosas, pero antes de llevarla a produccion conviene hacer una limpieza tecnica seria.

Las prioridades son:

1. Corregir seguridad y configuracion: secretos por defecto, almacenamiento de tokens, webhook Stripe y rutas duplicadas.
2. Alinear base de datos, schema Drizzle y migraciones.
3. Eliminar codigo legacy y restos de Replit/artifacts que confunden el sistema real.
4. Reducir acoplamiento y tamano de frontend/backend, especialmente paginas grandes, emails, formularios y rutas publicas.

## Stack real detectado

- Frontend: React 18, Vite, TypeScript, Wouter, TanStack Query, Tailwind CSS, shadcn/ui, Radix UI, lucide-react, framer-motion, Recharts.
- Backend: Express 4, TypeScript ejecutado con `tsx` en desarrollo y empaquetado con `esbuild` para produccion.
- Base de datos: PostgreSQL via `pg` y Drizzle ORM. La documentacion menciona Neon como proveedor recomendado.
- Auth: JWT propio con refresh tokens persistidos en PostgreSQL, bcrypt, recuperacion por JWT de corta duracion, usuario demo, y restos de Express Session/Replit Auth.
- Integraciones: Stripe, SendGrid, Cloudinary, 360dialog WhatsApp, Catastro, SSE, cron de recordatorios/digest.
- Build/deploy: Vite para frontend, esbuild para backend, config Replit/Nixpacks.

Scripts relevantes:

- `npm run dev`: arranca `tsx server/index.ts`.
- `npm run build`: `vite build` + bundle server con `esbuild`.
- `npm run start`: ejecuta `dist/index.js`.
- `npm run check`: TypeScript.
- `npm run db:push`: Drizzle push.

## Estructura de carpetas

- `client/`: SPA React. Contiene paginas, componentes, hooks, contextos y assets publicos.
- `client/src/App.tsx`: mapa de rutas cliente con rutas publicas, privadas, legales y de pagos.
- `client/src/components/ui/`: base shadcn/Radix reutilizable.
- `client/src/pages/`: muchas paginas de producto, algunas activas y otras claramente legacy o experimentales.
- `server/`: backend Express, servicios y modulos historicos.
- `server/routes/`: API modular activa. `server/index.ts` importa `./routes/index`.
- `server/routes.ts`: archivo monolitico legacy muy grande, no conectado al arranque actual.
- `shared/schema.ts`: schema Drizzle y tipos compartidos.
- `migrations/`: migraciones Drizzle historicas.
- `attached_assets/`: capturas, documentos, HTMLs y otros adjuntos historicos.
- `design_handoff_certifive/`: handoff visual y assets de diseno.
- `artifacts/`: restos generados/mockup.

## Paginas existentes

El router principal registra rutas publicas como:

- `/`
- `/login`
- `/register`
- `/solicitar-demo`
- `/verify-email`
- `/presupuesto/:token`
- `/cotizacion/:uniqueLink`
- `/solicitud/:token`
- `/formulario-cee/:token`
- `/formulario-tecnico/:token`
- `/pay/:token`
- `/certificacion-cliente/:uniqueLink`
- `/generador-tarifas`
- `/privacy`
- `/terms`
- `/success`
- `/cancel`
- `/renovar-suscripcion`

Rutas autenticadas:

- `/certificacion/:id?`
- `/certificados/nuevo`
- `/certificacion-request/:id`
- `/formulario-cee`
- `/whatsapp`
- `/whatsapp-flow-editor`
- `/demo-flujo`
- `/certificados`
- `/propiedades`
- `/tarifas`
- `/informes`
- `/marketing`
- `/automatizaciones`
- `/stripe`
- `/configuracion`
- `/settings`
- `/revision-tecnica/:id`
- `/visita/:id`

Paginas sospechosas o legacy:

- `certification-wizard-old.tsx`
- `properties-broken.tsx`
- `reports-backup.tsx`
- `reports-collections.tsx`
- `workflow-demo.tsx`
- `WhatsApp.tsx` frente a `whatsapp-management.tsx`
- `PublicForm.tsx` frente a flujos publicos nuevos
- `CertifierLanding.tsx`, aparentemente no enlazada en `App.tsx`

## Componentes reutilizables

Reutilizables:

- Componentes base de `client/src/components/ui`.
- `Layout`, `BottomNav`, `Sidebar`, `ProfileMenu`, si se mantiene el modelo actual de navegacion.
- `CatastroSearch`, con tests y endurecimiento de errores.
- Componentes de certificacion por pasos.
- Hooks de notificaciones/onboarding tras unificar auth.

Duplicados o a revisar:

- `client/src/components/NotificationBell.tsx`
- `client/src/components/notifications/NotificationBell.tsx`
- `useAuth.ts` y `AuthContext.tsx`, ambos gestionan auth en paralelo.
- Componentes de certificados y carpetas que apuntan a endpoints posiblemente obsoletos.

## Base de datos

Tablas definidas en `shared/schema.ts`:

- `users`
- `refresh_tokens`
- `folders`
- `certifications`
- `form_responses`
- `documentos`
- `pricing_rates`
- `quote_requests`
- `invoices`
- `payments`
- `sessions`
- `plantillas_whatsapp`
- `mensajes_comunicacion`
- `notificaciones`
- `beta_leads`
- `waitlist`
- `envelope_elements`
- `openings`
- `installations`
- `improvement_measures`
- `visit_photos`

Problema principal: las migraciones historicas no reflejan todo el schema actual. El snapshot `0004` incluye tablas como `expenses`, `whatsapp_conversations` y `whatsapp_messages`, mientras que el schema actual define otras tablas nuevas no presentes en esas migraciones. Esto indica drift entre schema, migraciones y codigo.

Riesgo adicional: `server/storage.ts` tiene `@ts-nocheck` e importa simbolos que ya no existen en `shared/schema.ts`, como `collections`, `demoRequests`, `uploadedCertificates`, `whatsappFlowTemplates` y tipos antiguos. No parece formar parte del flujo principal activo, pero si se reconecta romperia o generaria errores.

## Autenticacion y autorizacion

Flujo activo:

- Login/register en `/api/auth/login` y `/api/auth/register`.
- JWT firmado con `JWT_SECRET`.
- Refresh tokens en tabla `refresh_tokens`.
- Middleware `authenticate` lee `Authorization: Bearer` o cookie `token`.
- Recuperacion de password con JWT de proposito `password_reset`.
- Verificacion email con `emailVerificationToken`.
- Usuario demo via `/api/auth/demo`.

Riesgos:

- `JWT_SECRET` tiene fallback hardcodeado.
- `SESSION_SECRET` tiene fallback hardcodeado.
- Los tokens se guardan en `localStorage`.
- Hay claves inconsistentes en cliente: `token`, `authToken`, `auth_token`.
- Existe `replitAuth.ts` con Passport/OpenID y Express Session, pero el arranque actual usa JWT propio.
- El email de reset enlaza a `/reset-password`, pero no hay ruta frontend registrada para esa pantalla.

## Integraciones actuales

### Stripe

Hay pagos publicos por certificacion y suscripciones.

Riesgos:

- `/api/stripe/webhook` se registra en `payments.ts` y tambien en `subscription.ts`.
- `payments.ts` se registra antes que `subscription.ts`, por lo que puede capturar eventos que deberian ir al handler de suscripciones.
- `express.json()` se monta antes que las rutas, lo cual puede romper la validacion de firma si no se conserva raw body.
- El frontend usa dos convenciones de clave publica: `VITE_STRIPE_PUBLIC_KEY` y `window.__STRIPE_PK__`.

### SendGrid

`server/email.ts` centraliza emails. Si `SENDGRID_API_KEY` falta, opera como no-op. Hay mojibake/encoding roto en varios textos y `@ts-nocheck`.

### Cloudinary

Existe wrapper centralizado en `server/cloudinary.ts`. Las rutas modulares nuevas usan `multer.memoryStorage()` y suben a Cloudinary. El legacy `server/routes.ts` usa almacenamiento local en `uploads/`.

### WhatsApp 360dialog

`server/whatsapp.ts` implementa cifrado de API key, validacion, envio de texto/documentos y plantillas. Riesgo: `ENCRYPTION_KEY` tiene fallback hardcodeado.

### Catastro

`server/routes/catastro.ts` consulta endpoints SOAP/XML de Catastro con `fast-xml-parser`. Es una pieza util pero conviene cubrir con tests y timeouts.

### SSE y cron

SSE se usa para notificaciones. Hay cron de recordatorios y digest diario. Revisar que no haya multiples instancias ejecutando cron en despliegues horizontales.

## Errores y deuda tecnica

Hallazgos validados por build/check:

- `npm run check`: pasa.
- `npm run build`: pasa.
- Build warning: bundle principal minificado de 2.7 MB, gzip 777 KB.
- Build warning: `client/src/pages/dashboard.tsx` tiene atributo `className` duplicado.
- Build warning: `server/email.ts` tiene expresion con `??` que siempre devuelve el operando izquierdo por precedencia.
- `npm audit`: 30 vulnerabilidades, con 2 criticas, 11 altas, 14 moderadas y 3 bajas.

Deuda destacada:

- `server/routes.ts` monolitico y duplicado.
- Muchos archivos grandes: `Landing.tsx`, `Certifications.tsx`, `PublicCEEForm.tsx`, `FormularioTecnicoPublico.tsx`, `reports.tsx`, `settings.tsx`, `email.ts`, `public-forms.ts`.
- Uso extendido de `@ts-nocheck`.
- Migraciones desalineadas.
- Codigo Replit/historico mezclado con runtime actual.
- Assets y documentos historicos versionados junto al codigo.
- Rutas financieras activas simulan `collections` encima de `payments`, mientras existen restos antiguos que intentan usar una tabla `collections`.

## Matriz de decision

### Reutilizar

- UI base shadcn/Radix en `client/src/components/ui`.
- Rutas modulares en `server/routes/*`, como base del backend activo.
- `shared/schema.ts` como punto de partida funcional, tras reconciliar migraciones.
- Cloudinary wrapper y rutas nuevas con `memoryStorage`.
- Catastro proxy, tras endurecer errores/timeouts.
- Plantillas WhatsApp y modelo de mensajes, si el producto mantiene 360dialog.
- Landing/assets finales, si pasan revision de producto y no son solo handoff.

### Refactorizar

- Auth completa: `AuthContext`, `useAuth`, `queryClient`, nombres de token y storage.
- Stripe: webhooks, pagos publicos y suscripciones.
- Emails: quitar `@ts-nocheck`, arreglar encoding, centralizar rutas y templates.
- Formularios publicos: extraer validacion, tipos y componentes comunes.
- Notificaciones: unificar campana, SSE y token.
- Finanzas: decidir si `collections` es entidad propia o alias de `payments`.
- Build frontend: code splitting por paginas pesadas.
- Migraciones: generar una historia coherente o baseline nueva.

### Rehacer

- Estrategia de secrets/config sin fallbacks inseguros.
- Pantalla y flujo frontend de reset password.
- Webhook Stripe con raw body y un unico entrypoint.
- Capa de persistencia vieja (`storage.ts`) si se necesita de verdad.
- Report/invoice services viejos si se quieren recuperar, porque dependen de schema obsoleto.
- Pruebas automatizadas minimas de auth, pagos, formularios publicos y documentos.

### Eliminar o archivar

- `server/routes.ts`, si se confirma que no se usa.
- `properties-broken.tsx`.
- `reports-backup.tsx`.
- `certification-wizard-old.tsx`.
- `artifacts/`.
- Assets duplicados o historicos de `attached_assets/`.
- Replit Auth y dependencias asociadas si no forman parte del producto final.
- Codigo `@ts-nocheck` que no este conectado al runtime actual.

## Plan recomendado

1. Seguridad inmediata:
   - Quitar fallbacks de secretos.
   - Unificar token keys en cliente.
   - Anadir ruta frontend de reset password.
   - Arreglar webhook Stripe.

2. Base de datos:
   - Comparar DB real con `shared/schema.ts`.
   - Decidir baseline de migraciones.
   - Eliminar referencias a tablas antiguas o reintroducirlas formalmente.

3. Limpieza de runtime:
   - Confirmar endpoints activos.
   - Eliminar `server/routes.ts` y paginas legacy.
   - Quitar `@ts-nocheck` por modulos.

4. Producto y mantenibilidad:
   - Dividir paginas grandes.
   - Crear tests de flujos criticos.
   - Reducir bundle con lazy loading.

## Verificacion ejecutada

- `git rev-parse HEAD`: `d112c76575f38386dc16358ed5453e42440595a6`.
- `npm.cmd ci`: completado.
- `npm.cmd run check`: completado sin errores.
- `npm.cmd run build`: completado con warnings.
- `npm.cmd audit --json`: completado; 30 vulnerabilidades.

No se ejecuto `db:push` ni pruebas contra una base real porque requiere `DATABASE_URL` y mutaria una base de datos.
