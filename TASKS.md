# CERTIFIVE — Task List (Claude Code)

> **Instrucción para el agente:** Lee este archivo al inicio. Ejecuta cada tarea [ ] en orden.
> Tras completar cada tarea: marca [x], guarda TASKS.md, y continúa con la siguiente.
> No te detengas entre tareas. Si una falla, anota el error bajo la tarea y continúa con la siguiente.

---

## BLOQUE A — Refactors visuales (4 páginas)

### [x] A1 — Ajustes
**Lee:** `design_handoff_panel_interno/reference/ajustes.html` + `client/src/pages/settings.tsx`
**Haz:** Refactoriza settings.tsx copiando EXACTAMENTE las clases Tailwind del HTML.
Mantén toda la lógica. Usa SectionCard para agrupar secciones.
**Commit:** `npx tsc --noEmit && git add client/src/pages/settings.tsx && git commit -m "refactor(ajustes): faithful port from handoff HTML" && git push`

---

### [x] A2 — Informes
**Lee:** `design_handoff_panel_interno/reference/informes.html` + `client/src/pages/reports.tsx`
**Haz:** Refactoriza la capa visual de reports.tsx copiando las clases Tailwind del HTML.
⚠️ reports.tsx tiene 1361 líneas y el HTML solo 344. Mantén TODA la lógica de
generación PDF/Excel/Word (jspdf, xlsx, docx) — solo actualiza la capa visual.
**Commit:** `npx tsc --noEmit && git add client/src/pages/reports.tsx && git commit -m "refactor(informes): faithful port from handoff HTML" && git push`

---

### [x] A3 — WhatsApp
**Lee:** `design_handoff_panel_interno/reference/whatsapp.html` + `client/src/pages/whatsapp.tsx`
**Haz:** Refactoriza whatsapp.tsx copiando las clases Tailwind del HTML.
Mantén toda la lógica de conexión 360dialog y validación de API key.
**Commit:** `npx tsc --noEmit && git add client/src/pages/whatsapp.tsx && git commit -m "refactor(whatsapp): faithful port from handoff HTML" && git push`

---

### [x] A4 — Certificados
**Lee:** `design_handoff_panel_interno/reference/certificados.html` + `client/src/pages/certificates.tsx`
**Haz:** Refactoriza certificates.tsx copiando las clases Tailwind del HTML.
Usa StatusBadge y EnergyChip donde corresponda. Mantén toda la lógica.
**Commit:** `npx tsc --noEmit && git add client/src/pages/certificates.tsx && git commit -m "refactor(certificados): faithful port from handoff HTML" && git push`

---

## BLOQUE B — Calidad de código

### [x] B1 — Eliminar @ts-nocheck
**Lee:** `client/src/components/certificates/CertificateManagement.tsx` (línea 1 tiene `// @ts-nocheck`)
**Haz:**
1. Elimina `// @ts-nocheck` de la línea 1
2. Ejecuta `npx tsc --noEmit` para ver todos los errores
3. Corrige TODOS los errores TypeScript:
   - Añade tipos explícitos a parámetros sin tipo
   - Crea interfaces para objetos sin tipado
   - Usa `unknown` + type guards en lugar de `any`
   - Aplica optional chaining `?.` para null/undefined
4. NO cambies la lógica de negocio, solo añade tipos
5. Itera `npx tsc --noEmit` hasta 0 errores
**Commit:** `git add client/src/components/certificates/CertificateManagement.tsx && git commit -m "fix(typescript): remove @ts-nocheck from CertificateManagement" && git push`

---

### [x] B2 — Recordatorios caducidad certificado
**Lee:** `shared/schema.ts` + `server/digest.ts` + `server/email.ts` + `server/index.ts`
**Haz (en este orden):**

**1. Schema** — añade en la tabla `certifications` (después de `deliveryStatus`):
```typescript
caducidadAt: timestamp("caducidad_at"),
```

**2. Migración** — ejecuta `npx drizzle-kit generate` para generar la migración automáticamente.
Si falla, crea `migrations/XXXX_add_caducidad_at.sql`:
```sql
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS caducidad_at TIMESTAMP;
```
(XXXX = número siguiente al último migration existente)

**3. Email** — añade al final de `server/email.ts`:
```typescript
export async function sendCertificadoExpiryEmail(params: {
  to: string; ownerName: string; certifierName: string;
  propertyAddress: string | null; caducidadAt: Date; diasRestantes: number;
}): Promise<void>
```
Template HTML en español. Asunto: "Tu certificado energético caduca en X días".
Botón CTA: "Contactar con mi certificador". Mismo estilo que las otras funciones del archivo.

**4. Cron** — crea `server/expiry-cron.ts` nuevo:
- Función exportada: `startExpiryCron()`
- Patrón IDÉNTICO a `digest.ts` (setInterval 60s, check hora Madrid, lastSentDate)
- Hora de disparo: 09:00 Europe/Madrid, una vez al día
- Consulta: `certifications WHERE caducidad_at IS NOT NULL AND status = 'Finalizado'`
- Envía aviso a **30 días** y a **10 días** antes de `caducidadAt`
- Para cada cert: obtén el user (certificador) y usa `ownerEmail` de la cert
- Llama `sendCertificadoExpiryEmail()` para cada propietario afectado
- Log del número de avisos enviados

**5. Registro** — en `server/index.ts`:
```typescript
import { startExpiryCron } from "./expiry-cron";
// junto a startReminderCron() y startDigestCron():
startExpiryCron();
```

**6. Mock en tests** — en `server/tests/setup.ts` añade:
```typescript
vi.mock("../expiry-cron", () => ({ startExpiryCron: vi.fn() }));
```

**Commit:** `npx tsc --noEmit && git add shared/schema.ts server/email.ts server/expiry-cron.ts server/index.ts server/tests/setup.ts && git commit -m "feat(p1-c): certificate expiry reminders 30d and 10d" && git push`
(Añade también el archivo de migración generado si existe)

---

## BLOQUE C — Documentación

### [x] C1 — Documentación para junior devs
**Lee:** `package.json` + `server/config.ts`
**Haz:** Crea DOS archivos:

**`CONTRIBUTING.md`** (raíz del proyecto) en español. Secciones:
- Visión del producto (qué es, qué NO es, flujo del certificador)
- Stack técnico (tabla tecnología → versión → uso)
- Prerequisitos (Node 20+, npm, variables .env)
- Configuración local (git clone → npm install → .env.example → npm run dev)
- Estructura de carpetas (árbol comentado)
- Flujo git (feature/xxx → PR → merge main → Railway auto-despliega)
- Convenciones de código (naming, estructura, TypeScript, schema+migración)
- Componentes UI disponibles (KpiCard, StatusBadge, EnergyChip, SectionCard, FilterChip, SearchInput)
- Comandos útiles (npm run dev, npm run build, npx tsc --noEmit, npx drizzle-kit generate)
- Lo que NO debes hacer (React Router, multer a disco, @ts-nocheck, push directo a main)

**`.env.example`** (raíz del proyecto) con comentarios:
```
# Base de datos
DATABASE_URL=postgresql://user:password@host/certifive?sslmode=require

# Auth
JWT_SECRET=genera-64-bytes-hex-con-openssl-rand-hex-64
SESSION_SECRET=genera-64-bytes-hex-con-openssl-rand-hex-64
ENCRYPTION_KEY=exactamente-32-caracteres-aqui!!

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=000000000000000
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
STRIPE_SUBSCRIPTION_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_BASICO=price_xxxx
STRIPE_PRICE_PRO=price_xxxx
STRIPE_PRICE_PROFESIONAL=price_xxxx
STRIPE_PRICE_EMPRESA=price_xxxx
STRIPE_PRICE_ENTERPRISE=price_xxxx
STRIPE_PRICE_PAY_PER_USE=price_xxxx

# App
PORT=5000
APP_URL=http://localhost:5000
LOG_LEVEL=debug
```

**Commit:** `git add CONTRIBUTING.md .env.example && git commit -m "docs(p2): CONTRIBUTING.md and .env.example for junior devs" && git push`

---

## Estado final esperado

- [x] A1 — settings.tsx refactorizado
- [x] A2 — reports.tsx refactorizado
- [x] A3 — whatsapp.tsx refactorizado
- [x] A4 — certificates.tsx refactorizado
- [x] B1 — @ts-nocheck eliminado
- [x] B2 — Cron de caducidad implementado
- [x] C1 — Documentación creada
