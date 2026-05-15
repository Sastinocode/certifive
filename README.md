# CERTIFIVE — Plataforma de Certificación Energética CEE

> Gestión completa del flujo de certificación energética en España: formularios de propietario, presupuestos, pagos y facturas en una sola plataforma.

---

## Índice

1. [Stack tecnológico](#stack-tecnológico)
2. [Setup local](#setup-local)
3. [Variables de entorno](#variables-de-entorno)
4. [Estructura de carpetas](#estructura-de-carpetas)
5. [Autenticación](#autenticación)
6. [Sistema de pagos](#sistema-de-pagos)
7. [Añadir una ruta en el backend](#añadir-una-ruta-en-el-backend)
8. [Añadir una página en el frontend](#añadir-una-página-en-el-frontend)
9. [Sistema de notificaciones (SSE)](#sistema-de-notificaciones-sse)
10. [Deploy en Replit](#deploy-en-replit)
11. [Troubleshooting](#troubleshooting)

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | React 18 + Vite | 18.3 / 5.4 |
| **Routing (frontend)** | Wouter | 3.3 |
| **Estado del servidor** | TanStack Query v5 | 5.60 |
| **Estilos** | Tailwind CSS 3.4 | 3.4 |
| **Componentes UI** | shadcn/ui (Radix) | — |
| **Animaciones** | Framer Motion | 11.x |
| **Backend** | Node.js + Express | 4.21 |
| **ORM** | Drizzle ORM | 0.39 |
| **Base de datos** | PostgreSQL (Neon serverless) | — |
| **Validación de esquemas** | Zod | 3.24 |
| **Autenticación** | JWT + bcryptjs | — |
| **Pagos** | Stripe | 18.x |
| **Email** | SendGrid (`@sendgrid/mail`) | 8.x |
| **Subida de archivos** | Multer | 2.x |
| **WhatsApp** | 360dialog API | — |
| **Lenguaje** | TypeScript 5.6 | 5.6 |

---

## Setup local

### Requisitos previos

- Node.js ≥ 20
- npm ≥ 10
- Acceso a una base de datos PostgreSQL (recomendado: cuenta gratuita en [Neon](https://neon.tech))

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-org/certifive.git
cd certifive

# 2. Instalar dependencias
npm install

# 3. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales

# 4. Crear las tablas en la base de datos
npm run db:push

# 5. Arrancar en modo desarrollo
npm run dev
```

El servidor arranca en `http://localhost:5000`. El frontend se sirve con Vite en modo HMR a través del mismo puerto (middleware mode).

### Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo (Express + Vite HMR) |
| `npm run build` | Genera el bundle de producción en `dist/` |
| `npm run db:push` | Sincroniza el esquema Drizzle con la BD (aplica migraciones) |
| `npm run db:studio` | Abre Drizzle Studio (UI de exploración de BD) |
| `npm run check` | Ejecuta el type-check de TypeScript |

---

## Variables de entorno

Crea un archivo `.env` en la raíz con estas variables:

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `DATABASE_URL` | ✅ | Connection string de PostgreSQL. Formato: `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | ✅ | Clave secreta para firmar los tokens JWT. Usa al menos 32 caracteres aleatorios. |
| `SESSION_SECRET` | ✅ | Clave secreta para las sesiones de Express. |
| `SENDGRID_API_KEY` | ✅ (emails) | API key de SendGrid. Sin ella, todos los emails son no-ops (la app no falla). |
| `STRIPE_SECRET_KEY` | ⚠️ (pagos) | Clave secreta de Stripe (`sk_live_...` o `sk_test_...`). |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ (pagos) | Secret del webhook de Stripe para validar eventos. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ⚠️ (pagos frontend) | Clave publicable de Stripe para el frontend (`pk_live_...`). |
| `APP_URL` | ⚠️ | URL pública de la app (ej. `https://certifive.es`). Usada en emails y links. |
| `ENCRYPTION_KEY` | ⚠️ (WhatsApp) | Clave de 32 chars para cifrar las API keys de WhatsApp con AES-256-CBC. |
| `NODE_ENV` | — | `development` o `production`. Controla HTTPS, logs y Vite HMR. |
| `PORT` | — | Puerto del servidor (por defecto `5000`). |

> **Nota de seguridad:** Nunca subas `.env` al repositorio. Añádelo a `.gitignore`.

---

## Estructura de carpetas

```
certifive/
├── client/                    # Frontend React + Vite
│   ├── public/
│   │   ├── manifest.json      # PWA manifest
│   │   ├── sw.js              # Service Worker (caché + offline)
│   │   └── icons/             # Iconos PWA (SVG)
│   ├── index.html             # Punto de entrada HTML (meta tags, viewport, PWA)
│   └── src/
│       ├── App.tsx            # Router SPA — despacha por window.location.pathname
│       ├── main.tsx           # Entry point React + registro del Service Worker
│       ├── components/
│       │   ├── Layout.tsx         # Shell principal (sidebar, header, nav)
│       │   ├── BottomNav.tsx      # Barra de navegación inferior (mobile)
│       │   ├── NotificationBell.tsx # Campana con dropdown de notificaciones
│       │   └── OnboardingFlow.tsx  # Wizard de onboarding para nuevos usuarios
│       ├── hooks/
│       │   ├── useAuth.ts         # Estado de autenticación + login/logout/register
│       │   ├── useIsMobile.ts     # Detecta si la ventana es < 1024px
│       │   └── useNotifications.ts# Fetch + SSE de notificaciones en tiempo real
│       ├── lib/
│       │   ├── queryClient.ts     # TanStack Query client con auto-refresh de JWT
│       │   └── utils.ts           # Helpers: formatDate, cn (classnames), etc.
│       └── pages/
│           ├── Landing.tsx        # Landing pública de captación beta
│           ├── Login.tsx          # Formulario de inicio de sesión
│           ├── Register.tsx       # Formulario de registro de certificador
│           ├── Dashboard.tsx      # Panel de control principal
│           ├── Certifications.tsx # Gestión de certificaciones
│           ├── Properties.tsx     # Carpetas de cliente / propiedades
│           ├── WhatsApp.tsx       # Integración WhatsApp Business
│           ├── Invoices.tsx       # Gestión de facturas
│           ├── Marketing.tsx      # Herramientas de marketing
│           ├── Settings.tsx       # Configuración del perfil y cuenta
│           ├── PublicForm.tsx     # Formulario público del propietario (/form/:token)
│           ├── PublicSolicitud.tsx# Formulario de solicitud (/solicitud/:token)
│           ├── PublicPresupuesto.tsx # Vista de presupuesto (/presupuesto/:token)
│           ├── PublicPayment.tsx  # Página de pago online (/pay/:token)
│           ├── PublicCEEForm.tsx  # Formulario CEE detallado (/formulario-cee/:token)
│           └── CertifierLanding.tsx # Página pública del certificador (/c/:slug)
│
├── server/                    # Backend Node.js + Express
│   ├── index.ts               # Entry point: Express app, middlewares, crons
│   ├── routes.ts              # Todas las rutas de la API (~2600 líneas)
│   ├── auth.ts                # JWT, bcrypt, middleware authenticate
│   ├── db.ts                  # Conexión Drizzle + Neon serverless
│   ├── email.ts               # Todas las funciones de envío de email (SendGrid)
│   ├── sse.ts                 # Server-Sent Events: subscribe() + publish()
│   ├── createNotification.ts  # Helper para crear notificaciones + SSE push
│   ├── notifications.ts       # Cron de recordatorios por WhatsApp/email
│   ├── digest.ts              # Cron de resumen diario (08:00 Madrid)
│   └── whatsapp.ts            # Integración 360dialog + templates + encrypt
│
├── shared/
│   └── schema.ts              # Tablas Drizzle (fuente de verdad del esquema BD)
│
├── drizzle.config.ts          # Configuración de Drizzle Kit
├── vite.config.ts             # Configuración de Vite
├── tailwind.config.ts         # Configuración de Tailwind
├── tsconfig.json              # TypeScript (proyecto raíz)
└── package.json
```

---

## Autenticación

Certifive usa un **sistema de triple capa**:

### 1. JWT de acceso (`token`)

- Se genera en login/registro y se almacena en `localStorage` como `"token"`.
- Contiene `{ id, username, role }` firmado con `JWT_SECRET`.
- Caduca en **7 días** (o 30 días con _remember me_).
- Se envía en el header `Authorization: Bearer <token>` en cada petición autenticada.

### 2. Refresh token

- Token opaco de 64 chars (nanoid) almacenado en `localStorage` como `"refreshToken"`.
- Persiste en la tabla `refresh_tokens` con fecha de expiración.
- Cuando el JWT caduca, `queryClient.ts` intenta un `POST /api/auth/refresh` automáticamente antes de redirigir al login.
- Al rotar, el token antiguo se elimina y se genera uno nuevo (rotación única).

### 3. Sesión de Express (para compatibilidad con Replit Auth)

- `express-session` configurado con `memorystore` en desarrollo y `connect-pg-simple` en producción.
- No se usa activamente en el flujo JWT, pero permite compatibilidad con futuras integraciones OAuth.

### Flujo de autenticación

```
Cliente                          Servidor
  │                                 │
  ├─ POST /api/auth/login ─────────►│  hashPassword + comparePasswords
  │◄─── { token, refreshToken } ───┤  generateToken + generateRefreshToken
  │                                 │
  ├─ GET /api/certifications ──────►│  authenticate middleware
  │  Authorization: Bearer <token>  │  └─ verifyToken(token) → { id, username, role }
  │◄─── [...] ─────────────────────┤
  │                                 │
  ├─ (token caducado)               │
  ├─ POST /api/auth/refresh ───────►│  rotateRefreshToken → nuevo token
  │◄─── { token, refreshToken } ───┤
  │                                 │
  ├─ POST /api/auth/logout ────────►│  revokeRefreshToken
  │◄─── { ok: true } ──────────────┤
```

### Rutas de autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Registro de nuevo certificador |
| `POST` | `/api/auth/login` | Login con username/password |
| `POST` | `/api/auth/demo` | Acceso con usuario de demo |
| `POST` | `/api/auth/refresh` | Rota el refresh token |
| `POST` | `/api/auth/logout` | Revoca el refresh token |
| `GET`  | `/api/auth/user` | Datos del usuario autenticado |
| `PUT`  | `/api/auth/user` | Actualizar perfil |
| `PATCH`| `/api/auth/onboarding/complete` | Marcar onboarding como completado |

---

## Sistema de pagos

### Flujo de cobro en 2 tramos

```
Presupuesto aceptado
       │
       ▼
  Tramo 1 (% configurable, por defecto 25%)
       │
       ├─── Stripe  ───────► Webhook stripe → confirma automáticamente
       ├─── Bizum   ───────► Cliente notifica → certificador confirma en panel
       ├─── Transfer ──────► Cliente notifica → certificador confirma en panel
       └─── Efectivo ──────► Cliente notifica → certificador confirma en panel
       │
       ▼
  Formulario CEE (si está bloqueado hasta pago 1)
       │
       ▼
  Tramo 2 (resto del precio)
       │
       ▼
  Certificado entregado (si está bloqueado hasta pago 2)
```

### Tablas relevantes

- **`payments`** — un registro por tramo por certificación. Campos clave:
  - `status`: `pending | processing | succeeded | failed | refunded`
  - `metodo`: `stripe | bizum | transferencia | efectivo`
  - `estadoConfirmacion`: `pendiente_confirmacion | confirmado | rechazado`
  - `tramo`: `1` o `2`

### Stripe Webhooks

El webhook escucha en `POST /api/stripe/webhook`. Eventos procesados:

| Evento | Acción |
|--------|--------|
| `payment_intent.succeeded` | Confirma el pago, avanza el workflow |
| `payment_intent.payment_failed` | Marca como fallido, notifica al certificador |

El webhook requiere validación con `STRIPE_WEBHOOK_SECRET` para evitar peticiones falsas.

### Métodos manuales

Para Bizum/Transferencia/Efectivo, el flujo es:
1. El cliente selecciona el método y confirma que va a pagar → se crea un `payment` con `estadoConfirmacion = 'pendiente_confirmacion'`.
2. Aparece en el panel del certificador en "Cobros pendientes".
3. El certificador confirma o rechaza manualmente (`PATCH /api/payments/:id/confirm` o `/reject`).

---

## Añadir una ruta en el backend

Todas las rutas están en `server/routes.ts`, dentro de la función `registerRoutes(app)`.

### Ejemplo: ruta autenticada

```typescript
// server/routes.ts  — dentro de registerRoutes(app)

app.get("/api/mis-datos", authenticate, async (req: any, res) => {
  try {
    const userId = (req as any).user.id;          // ID del usuario autenticado
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return res.status(404).json({ message: "No encontrado" });
    res.json({ ok: true, data: user });
  } catch (err) {
    console.error("[mis-datos]", err);
    res.status(500).json({ message: "Error del servidor" });
  }
});
```

### Ejemplo: ruta pública con validación Zod

```typescript
import { z } from "zod";

const CreateThingSchema = z.object({
  nombre: z.string().min(1),
  valor:  z.number().positive(),
});

app.post("/api/things", async (req, res) => {
  const parsed = CreateThingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.issues });

  const { nombre, valor } = parsed.data;
  // ... insertar en BD
  res.json({ ok: true });
});
```

### Reglas de nomenclatura

- Recursos colección: `/api/certifications` (GET = lista, POST = crear)
- Recurso individual: `/api/certifications/:id` (GET = detalle, PUT = actualizar, DELETE = borrar)
- Acciones: `/api/certifications/:id/archive`, `/api/payments/:id/confirm`
- Autenticación: siempre usa el middleware `authenticate` en rutas privadas
- Errores: devuelve `{ message: string }` con código HTTP adecuado (400, 401, 403, 404, 500)

---

## Añadir una página en el frontend

### 1. Crear el componente de página

```typescript
// client/src/pages/MiPagina.tsx
import { useQuery } from "@tanstack/react-query";

export default function MiPagina() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/mi-endpoint"],
  });

  if (isLoading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-emerald-900">Mi Página</h1>
      {/* contenido */}
    </div>
  );
}
```

### 2. Si la página va en la navegación principal (dentro del Layout)

Edita `client/src/components/Layout.tsx`:

```typescript
// 1. Añade el import
import MiPagina from "../pages/MiPagina";

// 2. Añade el tipo de página
type Page = "dashboard" | "certifications" | ... | "mi-pagina";

// 3. Añade el item al array navItems
{ id: "mi-pagina", label: "Mi Página", icon: "star" }

// 4. Añade el case en renderPage()
case "mi-pagina": return <MiPagina />;
```

### 3. Si la página es pública (URL directa como /formulario/:token)

Edita `client/src/App.tsx`:

```typescript
// 1. Añade el import
import MiPublicPage from "./pages/MiPublicPage";

// 2. Añade la detección de ruta en App()
const miPageMatch = path.match(/^\/mi-ruta\/([A-Za-z0-9_-]+)$/);
if (miPageMatch) {
  return (
    <QueryClientProvider client={queryClient}>
      <MiPublicPage token={miPageMatch[1]} />
    </QueryClientProvider>
  );
}
```

### 4. Hacer fetch de datos desde la página

TanStack Query está configurado con autenticación automática. Simplemente usa `queryKey` con la ruta de la API:

```typescript
// GET con autenticación automática (Bearer token)
const { data } = useQuery({ queryKey: ["/api/certifications"] });

// GET con parámetros
const { data } = useQuery({ queryKey: [`/api/certifications/${id}`] });

// POST / PUT / DELETE usa apiRequest
import { apiRequest } from "../lib/queryClient";
const mutation = useMutation({
  mutationFn: (body) => apiRequest("POST", "/api/certifications", body),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/certifications"] }),
});
```

---

## Sistema de notificaciones (SSE)

### Arquitectura

```
Evento (ej. propietario paga)
       │
       ▼
createNotification(opts)          ← server/createNotification.ts
       ├─ INSERT notificaciones    (persiste en BD)
       └─ publish(userId, "notification", data)
              │
              ▼
         server/sse.ts
         connections.get(userId).forEach(res => res.write(...))
              │
              ▼
         Cliente (useNotifications.ts)
         EventSource → queryClient.invalidateQueries(["/api/notifications"])
              │
              ▼
         NotificationBell se actualiza sin polling
```

### Endpoints SSE

| Ruta | Descripción |
|------|-------------|
| `GET /api/notifications/stream?token=<jwt>` | Conexión SSE persistente. Token por query param porque `EventSource` no permite headers personalizados. |
| `GET /api/notifications` | Últimas 20 notificaciones del usuario |
| `GET /api/activity` | Últimas 10 notificaciones de las últimas 24 h |
| `PATCH /api/notifications/:id/read` | Marcar una como leída |
| `PATCH /api/notifications/read-all` | Marcar todas como leídas |

### Crear una notificación desde el servidor

```typescript
import { createNotification } from "./createNotification";

await createNotification({
  userId:          user.id,
  certificationId: cert.id,       // opcional
  tipo:            "pago_recibido",
  mensaje:         `Pago recibido de ${ownerName} — ${amount} €`,
  metadata:        { amount, tramo },
});
```

**Tipos disponibles:** `solicitud_completada` · `presupuesto_aceptado` · `pago_recibido` · `pago_fallido` · `cee_completado` · `recordatorio_formulario`

---

## Deploy en Replit

### 1. Configurar Secrets (variables de entorno)

En Replit, ve a **Tools → Secrets** y añade todas las variables de la [tabla de variables de entorno](#variables-de-entorno).

### 2. Configurar el Run command

En `.replit` o en **Settings → Run command**:

```bash
npm run build && node dist/server/index.js
```

O en modo desarrollo:

```bash
npm run dev
```

### 3. Base de datos

Certifive usa **Neon PostgreSQL** (serverless, compatible con Replit). Crea una base de datos en [neon.tech](https://neon.tech) y copia el connection string en `DATABASE_URL`.

Ejecuta `npm run db:push` desde la consola de Replit para crear las tablas la primera vez.

### 4. Domain y HTTPS

Replit proporciona HTTPS automáticamente. Configura `APP_URL` con la URL pública de Replit (ej. `https://certifive.tu-usuario.repl.co`).

### 5. Consideraciones de Replit

- **SSE e idle timeout**: el servidor envía un heartbeat SSE cada 25 s para evitar que Replit cierre conexiones inactivas.
- **File uploads**: Multer guarda archivos en `uploads/` dentro del contenedor. En Replit estos archivos **no persisten entre reinicios**. Para producción, integra un servicio de almacenamiento como Cloudflare R2 o AWS S3.
- **Service Worker**: El SW usa `Cache-first` para assets estáticos. Al hacer deploy actualiza el SW incrementando la versión del cache en `sw.js`.

---

## Troubleshooting

### ❌ `DATABASE_URL` not set — usando SQLite fallback

**Causa**: La variable de entorno no está configurada.  
**Solución**: Añade `DATABASE_URL` con el connection string de Neon PostgreSQL.

---

### ❌ Los emails no se envían

**Causa**: `SENDGRID_API_KEY` no está configurado o la clave es inválida.  
**Diagnóstico**:
```bash
# El servidor logueará:
[email] ⚠️  SENDGRID_API_KEY not set — all emails disabled
```
**Solución**: Configura la variable y verifica que el dominio remitente (`certifive.es`) esté autenticado en SendGrid.

---

### ❌ Error 401 en todas las peticiones autenticadas

**Causa**: El JWT ha caducado y el refresh token también, o `JWT_SECRET` cambió entre deploys.  
**Solución**:
1. El usuario debe volver a hacer login.
2. Si el problema es sistemático, verifica que `JWT_SECRET` sea consistente entre reinicios (usa Secrets de Replit, no hardcodees).

---

### ❌ Stripe webhook devuelve 400 "No signature"

**Causa**: `STRIPE_WEBHOOK_SECRET` no está configurado o no coincide con el webhook en el dashboard de Stripe.  
**Solución**:
1. Ve a Stripe Dashboard → Developers → Webhooks.
2. Copia el "Signing secret" del webhook endpoint.
3. Ponlo en `STRIPE_WEBHOOK_SECRET`.

---

### ❌ Las notificaciones SSE no llegan en tiempo real

**Causa**: Proxy o balanceador de carga que bufferiza la respuesta.  
**Diagnóstico**: Verifica el header `X-Accel-Buffering: no` en la respuesta del stream.  
**Solución**: El servidor ya lo envía. Si usas Nginx delante, añade en el `location` del proxy:
```nginx
proxy_buffering off;
proxy_cache off;
proxy_read_timeout 3600s;
```

---

### ❌ `npm run db:push` falla con "relation already exists"

**Causa**: Tablas ya existentes con incompatibilidades de esquema.  
**Solución**:
```bash
# Ver el SQL que se va a ejecutar antes de aplicarlo
npm run db:push -- --verbose

# Si hay conflicto, resetear la BD (¡SOLO en desarrollo!)
# Conectar a la BD y ejecutar: DROP SCHEMA public CASCADE; CREATE SCHEMA public;
# Luego: npm run db:push
```

---

### ❌ Los archivos subidos (logos, firmas) desaparecen tras reinicio en Replit

**Causa**: El sistema de archivos de Replit es efímero.  
**Solución temporal**: Los archivos se guardan en `uploads/` localmente.  
**Solución definitiva**: Migrara almacenamiento en la nube (Cloudflare R2, Supabase Storage, o AWS S3) y actualizar los endpoints `POST /api/auth/user/logo` y `/firma` para subir a la nube en lugar de disco local.

---

### ❌ "Error al crear sesión" en Login

**Causa**: `SESSION_SECRET` no configurado o la tabla de sesiones no existe.  
**Solución**:
1. Configura `SESSION_SECRET`.
2. Ejecuta `npm run db:push` para crear la tabla `sessions`.

---

### ❌ WhatsApp: "API key inválida"

**Causa**: La API key de 360dialog no está configurada o `ENCRYPTION_KEY` no coincide con el que se usó para cifrarla.  
**Diagnóstico**: El error viene de `server/whatsapp.ts → validateApiKey()`.  
**Solución**: Reconfigura la clave de WhatsApp desde Ajustes → WhatsApp. Si `ENCRYPTION_KEY` cambió, habrá que volver a cifrarla.

---

## Convenciones de código

### Backend (Express + Drizzle)

```typescript
// ✅ Siempre desestructura el userId del middleware
const userId = (req as any).user.id;

// ✅ Usa .limit(1) + desestructuración para obtener un solo registro
const [cert] = await db.select().from(certifications).where(eq(certifications.id, id)).limit(1);
if (!cert) return res.status(404).json({ message: "No encontrado" });

// ✅ Envuelve en try/catch y devuelve mensaje de error consistente
try {
  // ...
} catch (err) {
  console.error("[ruta]", err);
  res.status(500).json({ message: "Error del servidor" });
}

// ✅ Usa "as any" al hacer .set() con campos opcionales para evitar errores de tipo
await db.update(users).set({ name: "foo", updatedAt: new Date() } as any).where(eq(users.id, userId));
```

### Frontend (React + TanStack Query)

```typescript
// ✅ Los queryKeys siempre son la URL de la API
const { data } = useQuery({ queryKey: ["/api/certifications"] });

// ✅ Invalida queries relacionadas en onSuccess de mutations
const mutation = useMutation({
  mutationFn: (body) => apiRequest("POST", "/api/certifications", body),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
  },
});

// ✅ Inputs con font-size 16px para evitar zoom en iOS
<input style={{ fontSize: "16px" }} ... />

// ✅ Botones táctiles con min-height 44px
<button className="... min-h-[44px]" ...>

// ✅ Clases del esquema de color Certifive
// Primario:    bg-emerald-700, text-emerald-900, border-emerald-100
// Acento:      text-orange-600, bg-orange-100
// Fondos:      bg-emerald-50, bg-white
// Peligro:     text-red-600, border-red-200
```

---

## Licencia

Proyecto privado — © 2025 CERTIFIVE. Todos los derechos reservados.
