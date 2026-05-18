# CERTIFIVE — Errores Conocidos y Deuda Técnica

> Auditoría realizada: 2026-05-16  
> Severidad: CRÍTICO | ALTO | MEDIO | BAJO

---

## Errores Críticos (bugs que rompen funcionalidad clave)

---

### ERR-001: Rutas `/verify-email` y `/reset-password` no existen en el frontend

**Severidad**: CRÍTICO  
**Archivo**: `client/src/App.tsx`  
**Descripción**:  
Los emails de verificación de cuenta y de recuperación de contraseña generan URLs del tipo:
- `https://certifive.es/verify-email?token=...`
- `https://certifive.es/reset-password?token=...`

Ninguna de estas rutas está declarada en el router de `App.tsx`. El usuario que haga clic en el enlace aterrizará en la página 404 (`not-found.tsx`). El flujo de registro queda **completamente bloqueado** porque el login exige verificación de email.

**Impacto**: Ningún usuario nuevo puede registrarse y usar la aplicación.

**Solución**:
```tsx
// En App.tsx, añadir estas rutas:
import VerifyEmail from "@/pages/VerifyEmail";
import ResetPassword from "@/pages/ResetPassword";

// En el Switch:
<Route path="/verify-email" component={VerifyEmail} />
<Route path="/reset-password" component={ResetPassword} />
```
Luego crear `client/src/pages/VerifyEmail.tsx` que lea el query param `?token=` y llame a `POST /api/auth/verify-email` con ese token, mostrando éxito/error.  
Ídem para `ResetPassword.tsx` con `POST /api/auth/reset-password`.

---

### ERR-002: `req.userId` es `undefined` en ~21 handlers protegidos

**Severidad**: CRÍTICO  
**Archivos afectados**:
- `server/routes/auth.ts` (10 ocurrencias) — logo upload, firma, completeness, notifications prefs, security, GDPR export
- `server/routes/whatsapp.ts` (11 ocurrencias) — connect, disconnect, templates, send messages
- `server/routes/misc.ts` — financial-records

**Descripción**:  
El middleware `authenticate` setea `(req as any).user = { id, username, role, ... }` pero nunca setea `req.userId`. Los handlers que usan `req.userId` en lugar de `(req as any).user.id` pasan `undefined` a las queries de Drizzle. Resultado: las queries no encuentran registros, o peor, actualizan todos los registros sin filtro de usuario.

```typescript
// authenticate setea:
(req as any).user = user;  // objeto completo

// Pero estos handlers usan:
await db.update(users).set({...}).where(eq(users.id, req.userId)); // req.userId = undefined!
```

**Solución**: Búsqueda y reemplazo global de `req.userId` → `(req as any).user?.id` en todos los handlers protegidos. O mejor: añadir al middleware `authenticate`:
```typescript
(req as any).user = user;
(req as any).userId = user.id; // añadir esta línea
```

---

### ERR-003: Login por email no funciona (busca por username)

**Severidad**: ALTO  
**Archivo**: `server/routes/auth.ts` línea ~64

**Descripción**:  
El endpoint `POST /api/auth/login` acepta `email` en el body y lo usa como `lookup`, pero la query busca SOLO en la columna `username`:

```typescript
const [user] = await db.select().from(users)
  .where(eq(users.username, lookup))  // solo busca en username, nunca en email
  .limit(1);
```

Si el usuario intentó registrarse con su email como identificador (como sugiere el UI de Login que tiene campo "Email o usuario"), no encontrará su cuenta y verá "Email o usuario no registrado".

**Solución**: Usar `or()` en la query:
```typescript
import { or } from "drizzle-orm";
.where(or(eq(users.username, lookup), eq(users.email, lookup)))
```

---

## Errores Altos (afectan funcionalidades importantes)

---

### ERR-004: Cloudinary sin configurar crashea en uploads

**Severidad**: ALTO  
**Archivo**: `server/cloudinary.ts`, usado en `routes/auth.ts`, `routes/documents.ts`, `routes/visit-form.ts`, `routes/formulario-tecnico.ts`

**Descripción**:  
Si `CLOUDINARY_URL` y `CLOUDINARY_CLOUD_NAME` no están seteadas, el SDK de Cloudinary usa valores vacíos. Al intentar subir un archivo, el `upload_stream` falla con un error de Cloudinary que no está correctamente capturado en todos los handlers — puede crashear la petición.

**Solución**: 
1. Configurar las variables en Railway.  
2. Añadir guard en `uploadToCloudinary`:
```typescript
export function uploadToCloudinary(...) {
  if (!process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_CLOUD_NAME) {
    return Promise.reject(new Error("Cloudinary no configurado. Añade CLOUDINARY_URL al entorno."));
  }
  // ...
}
```

---

### ERR-005: JWT_SECRET y SESSION_SECRET con valores por defecto inseguros

**Severidad**: ALTO  
**Archivos**: `server/auth.ts` línea 7, `server/index.ts` línea 47

**Descripción**:
```typescript
const JWT_SECRET = process.env.JWT_SECRET || "certifive-dev-secret-2024";
// y
secret: process.env.SESSION_SECRET || "certifive-session-secret-2024",
```

Si estas variables no se configuran en Railway, los JWTs son firmados con un secreto conocido públicamente (está en el código del repo). Un atacante puede forjar tokens válidos.

**Solución**: Añadir a Railway las variables `JWT_SECRET` y `SESSION_SECRET` con valores aleatorios de al menos 32 caracteres. Generar con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

---

### ERR-006: ENCRYPTION_KEY para WhatsApp con valor por defecto inseguro

**Severidad**: ALTO  
**Archivo**: `server/whatsapp.ts` línea ~9

**Descripción**:
```typescript
const RAW_KEY = process.env.ENCRYPTION_KEY ?? "certifive-default-key-change-me!!";
```
Las API keys de WhatsApp 360dialog de los certificadores se cifran con AES-256-CBC. Si `ENCRYPTION_KEY` no está seteada, el cifrado usa una clave conocida y las API keys quedan prácticamente en texto claro.

**Solución**: Setear `ENCRYPTION_KEY` en Railway con 32 caracteres aleatorios. **Importante**: si ya hay API keys cifradas en BD con la clave por defecto, habrá que re-cifrarlas tras el cambio.

---

## Errores Medios (afectan calidad y seguridad)

---

### ERR-007: Inyección SQL en misc.ts (waitlist count)

**Severidad**: MEDIO  
**Archivo**: `server/routes/misc.ts` líneas 30 y 40

**Descripción**:
```typescript
const [{ count }] = await db.execute(
  `SELECT COUNT(*)::int AS count FROM waitlist WHERE module = '${mod.replace(/'/g, "''")}'`
) as any;
```
Aunque el replace de comillas simples mitiga el ataque más obvio, la interpolación de strings en SQL es una mala práctica que puede tener bypasses. `mod` viene directamente de `req.params.module` (GET) o `req.body.module` (POST).

**Solución**:
```typescript
// Usar la API de Drizzle con parámetros:
const [result] = await db.select({ count: count(waitlist.id) })
  .from(waitlist)
  .where(eq(waitlist.module, mod));
```

---

### ERR-008: `server/routes.ts` (monolítico) es dead code activo en el repo

**Severidad**: MEDIO  
**Archivo**: `server/routes.ts` (~2000 líneas)

**Descripción**:  
Existe un archivo `server/routes.ts` monolítico con todas las rutas (la implementación original antes de la refactorización modular). Este archivo NO está importado desde `server/index.ts` — el server usa `server/routes/index.ts`. Sin embargo, `routes.ts` importa `payments` y `refreshTokens` desde el schema con nombres que generan errores de TypeScript (importaciones duplicadas).

El archivo confunde a cualquier lector del código e infla el tamaño del repo innecesariamente.

**Solución**: Eliminar `server/routes.ts` o moverlo a `archive/`.

---

### ERR-009: Páginas dead code en el frontend

**Severidad**: BAJO  
**Archivos**:
- `client/src/pages/properties-broken.tsx` — 685 líneas, no en el router
- `client/src/pages/certification-wizard-old.tsx` — no en el router
- `client/src/pages/reports-backup.tsx` — no en el router
- `client/src/pages/reports-collections.tsx` — no en el router
- `client/src/pages/CertifierLanding.tsx` — no en el router (perfil público del certificador)
- `client/src/pages/PublicForm.tsx` — puede ser dead code (existe `FormularioTecnicoPublico.tsx`)
- `client/src/pages/WhatsApp.tsx` — parece ser versión antigua de `whatsapp-management.tsx`

**Solución**: Auditar cuáles son realmente unused y eliminar o archivar.

---

### ERR-010: express-session configurada pero no usada para autenticación

**Severidad**: BAJO  
**Archivos**: `server/index.ts`, `server/replitAuth.ts`

**Descripción**:  
La aplicación tiene `express-session` configurada con `MemoryStore` (no `connect-pg-simple` como sugeriría la dependencia en package.json y la tabla `sessions` en el schema). El `MemoryStore` pierde todas las sesiones al reiniciar el proceso. El sistema de auth real usa JWT, por lo que la sesión de express no protege ninguna ruta. Es confusing overhead.

`replitAuth.ts` existe (autenticación OAuth de Replit) pero no está importado en ningún lugar activo.

**Solución**:
- Si no se va a usar express-session, eliminar su configuración de `server/index.ts`.
- Si se decide usar sesiones para algo, migrar a `connect-pg-simple` usando la tabla `sessions` ya definida en el schema.

---

### ERR-011: Resend-verification busca por username usando email como lookup

**Severidad**: MEDIO  
**Archivo**: `server/routes/auth.ts` línea ~217

**Descripción**:
```typescript
const [user] = await db.select().from(users)
  .where(eq(users.username, email.trim().toLowerCase())) // email como username
  .limit(1);
```
Este endpoint recibe un `email` y lo busca en la columna `username`. Solo funciona si el usuario tiene su email como nombre de usuario, lo cual no es garantizado.

**Solución**: Buscar por `users.email`:
```typescript
.where(eq(users.email, email.trim().toLowerCase()))
```

---

## Deuda Técnica

---

### DEUDA-001: 14 archivos con `// @ts-nocheck`

**Impacto**: La protección de TypeScript está desactivada en más de la mitad de los archivos del servidor. Los errores de tipo no se detectan en compilación.

**Archivos afectados**: `server/routes.ts`, `server/routes/auth.ts`, `server/routes/misc.ts`, `server/routes/payments.ts`, `server/routes/pricing.ts`, `server/routes/visit-form.ts`, `server/routes/export-ce3x.ts`, `server/email.ts`, `server/invoiceService.ts`, `server/reportGenerator.ts`, `server/backupService.ts`, `server/sse.ts`, `server/storage.ts`, `server/vite.ts`

**Acción recomendada**: Quitar `@ts-nocheck` gradualmente, empezando por los archivos de rutas principales, y corregir los errores de tipo subyacentes. Los errores de `req.userId` (ERR-002) son probablemente parte de lo que `@ts-nocheck` estaba silenciando.

---

### DEUDA-002: Módulos "Automatizaciones" y "Marketing" son stubs de waitlist

**Impacto**: Los usuarios navegan a `/automatizaciones` y `/marketing` esperando funcionalidad y solo ven una pantalla de lista de espera. Esto erosiona confianza si ya están suscritos.

**Acción recomendada**: Mientras no estén implementados, ocultar estas entradas del sidebar para usuarios activos, o mostrar un estado "próximamente" más honesto con fecha estimada.

---

### DEUDA-003: `_migrate4.ts` en la raíz del proyecto

**Impacto**: Archivo de migración ad-hoc en la raíz. Confunde la estructura del proyecto.

**Acción recomendada**: Mover a `migrations/archive/` o eliminar si ya se ejecutó.

---

### DEUDA-004: Dos sistemas de rutas coexisten

**Impacto**: `server/routes.ts` (monolítico, ~2000 líneas) y `server/routes/` (modular, activo). Solo el segundo está en uso pero el primero ocupa espacio y confunde.

---

### DEUDA-005: `SESSION_SECRET` usa fallback hardcoded

**Impacto**: En producción sin la variable configurada, las sesiones de express usan secreto conocido.

---

### DEUDA-006: Rate limiter en login usa IP, pero en Railway el proxy puede hacer que todas las IPs sean la misma

**Impacto**: El rate limiter de login (5 intentos/15min) puede bloquear a usuarios legítimos si `trust proxy` no está configurado en Express.

**Acción recomendada**: Añadir `app.set("trust proxy", 1)` antes del middleware de rate limiting cuando se despliega detrás de un proxy (Railway/Nginx).

---

### DEUDA-007: `CertifierLanding.tsx` — página de perfil público no rutada

**Impacto**: El componente existe (perfil público del certificador con slug único) y el schema tiene campo `publicSlug` en users, pero no hay ruta en `App.tsx` ni endpoint API para leerlo públicamente.

**Acción recomendada**: Añadir ruta `/c/:slug` en App.tsx y endpoint público GET `/api/public/certifier/:slug`.

---

## Resumen de Prioridades

| Prioridad | Error | Acción |
|-----------|-------|--------|
| 1 | ERR-001: `/verify-email` y `/reset-password` no rutados | Crear páginas + rutas — **bloquea el registro** |
| 2 | ERR-002: `req.userId` undefined | Reemplazar global + añadir alias en middleware |
| 3 | ERR-003: Login no busca por email | Cambiar query a `or(username, email)` |
| 4 | ERR-005: JWT_SECRET inseguro | Configurar var de entorno en Railway |
| 5 | ERR-006: ENCRYPTION_KEY inseguro | Configurar var de entorno en Railway |
| 6 | ERR-004: Cloudinary sin guard | Configurar vars + añadir guard |
| 7 | ERR-007: SQL injection waitlist | Migrar a query parametrizada Drizzle |
| 8 | DEUDA-001: @ts-nocheck masivo | Quitar gradualmente, empezar por routes/auth.ts |
| 9 | ERR-008: routes.ts dead code | Eliminar archivo |
| 10 | ERR-009: páginas dead code frontend | Auditar y limpiar |

