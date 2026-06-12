# Guía de Contribución — CERTIFIVE

Bienvenido al proyecto **CERTIFIVE**. Esta guía está diseñada para ayudarte a entender el producto, configurar tu entorno local y seguir nuestras convenciones de desarrollo.

---

## 🎯 Visión del producto

### ¿Qué es CERTIFIVE?
CERTIFIVE es una **plataforma de gestión** diseñada para **certificadores energéticos** en España. Permite gestionar el ciclo completo de un expediente de certificación energética (CEE):

1. **Captura de datos** — el certificador recoge información del inmueble (presencial o mediante formularios enviados al propietario)
2. **Generación externa** — el certificador usa **CE3X** u otra herramienta oficial para generar el PDF del certificado
3. **Gestión en CERTIFIVE** — organiza expedientes, gestiona cobros (Stripe, Bizum, transferencia, efectivo), envía PDFs por email/WhatsApp, registra en organismos oficiales
4. **Entrega al propietario** — el propietario recibe su certificado energético final

### ¿Qué NO es CERTIFIVE?
- **NO genera certificados energéticos** — solo gestiona el workflow. El certificador usa CE3X (software oficial del Ministerio) para calcular la calificación energética y generar el PDF.
- **NO es un software CAD** — no calcula transmitancias, no hace simulaciones energéticas.
- **NO reemplaza al certificador** — es una herramienta de productividad y gestión de negocio.

### Flujo típico de un certificador
1. Crea un expediente en CERTIFIVE con los datos del propietario
2. Envía un presupuesto personalizado al propietario (web pública con URL única)
3. El propietario paga el anticipo (tramo 1) mediante Stripe/Bizum/transferencia
4. El propietario rellena el formulario CEE (datos del inmueble) desde un enlace web
5. El certificador realiza la visita presencial y toma medidas
6. El certificador genera el certificado energético en **CE3X** (fuera de CERTIFIVE)
7. El certificador sube el PDF final a CERTIFIVE
8. El propietario paga el tramo 2 (opcional, según configuración)
9. CERTIFIVE envía el certificado final por email/WhatsApp al propietario
10. El certificador registra el certificado en el organismo autonómico (fuera de CERTIFIVE)

---

## 🛠 Stack técnico

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **Node.js** | 20+ | Runtime backend |
| **npm** | 9+ | Gestor de paquetes |
| **TypeScript** | 5.x | Lenguaje (frontend + backend) |
| **React** | 18.x | Framework frontend |
| **Vite** | 6.x | Build tool frontend |
| **Wouter** | 3.x | Routing (NO React Router) |
| **TanStack Query** | 5.x | Gestión de estado servidor (queries, mutations) |
| **shadcn/ui** | — | Sistema de componentes UI (Radix UI + Tailwind) |
| **Tailwind CSS** | 3.x | Estilos utilitarios |
| **Express** | 4.x | Framework backend |
| **Drizzle ORM** | 0.45+ | ORM para PostgreSQL |
| **PostgreSQL** | 15+ | Base de datos (Neon serverless) |
| **SendGrid** | 8.x | Envío de emails transaccionales |
| **Cloudinary** | 2.x | Almacenamiento de archivos (PDFs, imágenes) |
| **Stripe** | 7.x | Pagos y suscripciones SaaS |
| **Vitest** | 2.x | Testing |
| **Drizzle Kit** | — | Generador de migraciones SQL |

---

## 📋 Prerequisitos

Antes de empezar, asegúrate de tener instalado:

- **Node.js 20+** ([descarga](https://nodejs.org/))
- **npm 9+** (incluido con Node.js)
- **Git** ([descarga](https://git-scm.com/))
- Un editor de código (recomendamos [VS Code](https://code.visualstudio.com/))

También necesitarás:
- Acceso a las **variables de entorno** (`.env`) — solicítalo al equipo
- (Opcional) Una cuenta de Neon para desarrollo local

---

## 🚀 Configuración local

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-org/certifive.git
cd certifive
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copia el archivo de ejemplo y rellena las variables:
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales locales. Las variables **obligatorias** para arrancar en desarrollo son:
- `DATABASE_URL` — URL de conexión a PostgreSQL (solicita acceso a la base de datos de desarrollo)
- `JWT_SECRET` — cadena aleatoria de 64 caracteres
- `SESSION_SECRET` — cadena aleatoria de 64 caracteres
- `ENCRYPTION_KEY` — exactamente 32 caracteres (para cifrar API keys de WhatsApp)

Las integraciones externas (SendGrid, Cloudinary, Stripe) son **opcionales** en desarrollo — la app funciona sin ellas (los emails se omiten, los archivos se mockean, etc.).

### 4. Aplicar migraciones
```bash
npm run db:push
```

### 5. Arrancar el servidor de desarrollo
```bash
npm run dev
```

Esto arranca:
- **Backend** en `http://localhost:5000`
- **Frontend** en `http://localhost:5000` (Vite sirve desde `/` con proxy API)

Abre tu navegador en `http://localhost:5000` y deberías ver la pantalla de login.

---

## 📁 Estructura de carpetas

```
certifive/
├── client/                      # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/          # Componentes React reutilizables
│   │   │   ├── ui/              # Componentes UI de shadcn/ui (Button, Input, etc.)
│   │   │   ├── layout/          # Layout components (Sidebar, AppTopbar)
│   │   │   └── certificates/    # Componentes específicos de certificados
│   │   ├── pages/               # Páginas de la aplicación (Dashboard, Settings, etc.)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utilidades y configuración (queryClient, utils)
│   │   └── main.tsx             # Entry point del frontend
│   └── index.html               # HTML base (Vite)
│
├── server/                      # Backend (Express + TypeScript)
│   ├── routes/                  # Endpoints API REST (organizados por dominio)
│   ├── db.ts                    # Cliente de base de datos (Drizzle + Neon)
│   ├── email.ts                 # Servicio de emails (SendGrid)
│   ├── cloudinary.ts            # Servicio de almacenamiento (Cloudinary)
│   ├── whatsapp.ts              # Integración 360dialog API
│   ├── digest.ts                # Cron de resumen diario (08:00 Madrid)
│   ├── expiry-cron.ts           # Cron de recordatorios de caducidad (09:00 Madrid)
│   ├── notifications.ts         # Cron de recordatorios (cada hora)
│   ├── config.ts                # Carga y validación de variables de entorno
│   ├── logger.ts                # Logger con Pino
│   ├── index.ts                 # Entry point del servidor Express
│   └── tests/                   # Tests con Vitest
│
├── shared/                      # Código compartido frontend ↔ backend
│   └── schema.ts                # Esquema de base de datos (Drizzle ORM)
│
├── migrations/                  # Migraciones SQL generadas por Drizzle Kit
│   └── 0001_*.sql
│
├── design_handoff_panel_interno/  # Referencias de diseño HTML (handoff)
│   └── reference/               # HTMLs de referencia para refactors visuales
│
├── CLAUDE.md                    # Instrucciones para Claude Code
├── CONTRIBUTING.md              # Esta guía
├── TASKS.md                     # Lista de tareas pendientes
├── package.json                 # Dependencias y scripts npm
├── tsconfig.json                # Configuración TypeScript
├── tailwind.config.ts           # Configuración Tailwind CSS
├── vite.config.ts               # Configuración Vite
└── drizzle.config.ts            # Configuración Drizzle Kit
```

---

## 🌳 Flujo de trabajo con Git

### Ramas
- **`main`** — rama principal, siempre estable y desplegable
- **`feature/descripcion-corta`** — ramas de features (por ejemplo: `feature/payment-reminders`)
- **`fix/descripcion-corta`** — ramas de bugfixes (por ejemplo: `fix/email-validation`)

### Workflow
1. **Crea una rama** desde `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/mi-feature
   ```

2. **Haz commits** con mensajes descriptivos siguiendo [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git add .
   git commit -m "feat(certificados): add expiry reminder email"
   ```

   Prefijos comunes:
   - `feat(scope):` — nueva funcionalidad
   - `fix(scope):` — corrección de bug
   - `refactor(scope):` — refactor sin cambio de comportamiento
   - `docs(scope):` — documentación
   - `style(scope):` — formato, estilos (no lógica)
   - `test(scope):` — añadir o corregir tests
   - `chore(scope):` — tareas de mantenimiento (deps, config)

3. **Push** a GitHub:
   ```bash
   git push origin feature/mi-feature
   ```

4. **Crea una Pull Request** en GitHub hacia `main`
   - Describe qué hace tu PR
   - Añade screenshots si hay cambios visuales
   - Asegúrate de que `npx tsc --noEmit` pasa (0 errores TypeScript)

5. **Code review** — espera aprobación de al menos 1 reviewer

6. **Merge** — una vez aprobado, haz merge a `main` (preferiblemente "Squash and merge")

7. **Deploy automático** — Railway detecta el push a `main` y despliega automáticamente en producción

### ⚠️ Reglas importantes
- **NUNCA** hagas `git push --force` a `main`
- **NUNCA** hagas push directo a `main` sin PR (salvo emergencias coordinadas)
- Ejecuta **`npx tsc --noEmit`** antes de hacer commit para evitar errores TypeScript
- Ejecuta **`npm run test`** si has tocado backend (opcional pero recomendado)

---

## 📝 Convenciones de código

### Naming
- **Variables y funciones**: `camelCase` (ejemplo: `getUserData`, `isLoading`)
- **Componentes React**: `PascalCase` (ejemplo: `CertificateCard`, `StatusBadge`)
- **Archivos**: `kebab-case.tsx` para componentes, `camelCase.ts` para utilidades
- **Tablas de base de datos**: `snake_case` (ejemplo: `certifications`, `user_settings`)
- **Columnas de base de datos**: `snake_case` (ejemplo: `created_at`, `owner_email`)

### Estructura de componentes React
```tsx
// Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Types/Interfaces
interface MyComponentProps {
  title: string;
  onSave: () => void;
}

// Component
export function MyComponent({ title, onSave }: MyComponentProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(true);
    onSave();
  };

  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>Save</Button>
    </div>
  );
}
```

### TypeScript
- **Siempre tipado explícito** — evita `any` (usa `unknown` + type guards si es necesario)
- **Interfaces para objetos** — usa `interface` para shapes de datos, `type` para uniones/alias
- **Props tipadas** — todos los componentes React deben tener `interface XxxProps`
- **NO usar `@ts-nocheck`** — si necesitas omitir errores, usa `@ts-expect-error` con comentario explicativo

### Schema y migraciones (Drizzle ORM)
1. **Modifica `shared/schema.ts`** con la nueva columna/tabla
2. **Genera la migración** con `npx drizzle-kit generate`
3. **Revisa el SQL** generado en `migrations/` antes de commitear
4. **NO edites migraciones ya aplicadas** — crea una nueva migración si necesitas corregir algo

Ejemplo de añadir una columna:
```typescript
// En shared/schema.ts
export const certifications = pgTable("certifications", {
  // ... columnas existentes
  caducidadAt: timestamp("caducidad_at"),  // Nueva columna
});
```

Luego ejecuta:
```bash
npx drizzle-kit generate
```

Drizzle Kit generará `migrations/0007_xxx.sql` con el `ALTER TABLE` correspondiente.

---

## 🎨 Componentes UI disponibles

CERTIFIVE usa **shadcn/ui** (basado en Radix UI + Tailwind). Los componentes principales están en `client/src/components/ui/`:

### Componentes personalizados
Estos son **específicos de CERTIFIVE** y deben usarse en lugar de crear versiones propias:

- **`<KpiCard>`** — tarjeta para métricas (usada en Dashboard)
- **`<StatusBadge>`** — badge de estado con color automático (Nuevo, En Proceso, Finalizado, etc.)
- **`<EnergyChip>`** — chip de calificación energética (A-G) con colores oficiales EU
- **`<SectionCard>`** — tarjeta para agrupar secciones de formularios
- **`<FilterChip>`** — chip seleccionable para filtros (usado en tablas)
- **`<SearchInput>`** — input de búsqueda con icono de lupa

Ejemplo de uso:
```tsx
import { StatusBadge } from "@/components/ui/status-badge";
import { EnergyChip } from "@/components/ui/energy-chip";

<StatusBadge status="En Proceso" />
<EnergyChip rating="B" />
```

### Componentes shadcn/ui estándar
Importa desde `@/components/ui/`:
- `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioGroup`
- `Dialog`, `Sheet`, `Popover`, `DropdownMenu`, `Tooltip`
- `Table`, `Card`, `Badge`, `Avatar`, `Separator`
- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormMessage` (react-hook-form integrado)

Consulta [shadcn/ui docs](https://ui.shadcn.com/) para ver todos los componentes disponibles.

---

## ⚙️ Comandos útiles

```bash
# Desarrollo
npm run dev              # Arranca frontend + backend en modo desarrollo
npm run build            # Build de producción (frontend + backend)
npm start                # Arranca servidor de producción (tras npm run build)

# TypeScript
npx tsc --noEmit         # Verifica tipos sin generar archivos (ejecútalo antes de commitear)
npm run check            # Alias de npx tsc --noEmit

# Base de datos
npm run db:push          # Aplica migraciones a la base de datos
npx drizzle-kit generate # Genera nueva migración SQL desde schema.ts
npx drizzle-kit studio   # Abre Drizzle Studio (explorador visual de la BD)

# Tests
npm test                 # Ejecuta todos los tests (Vitest)
npm run test:watch       # Ejecuta tests en modo watch

# Linting y formato
# (Nota: no hay linter configurado aún — usa el formatter de tu editor)
```

---

## 🚫 Lo que NO debes hacer

### ❌ NO usar React Router
**Usamos Wouter**, no React Router. Importa desde `wouter`:
```tsx
import { Link, useLocation } from "wouter";  // ✅ Correcto
// import { Link } from "react-router-dom";  // ❌ No usar
```

### ❌ NO subir archivos a disco local con Multer
**Usamos Cloudinary** para archivos. El flujo es:
1. Frontend sube directamente a Cloudinary (upload preset unsigned o firmado)
2. Backend recibe la URL de Cloudinary y la guarda en la base de datos

**NO uses `multer` para guardar en `/tmp` o `/uploads`** — Railway reinicia el filesystem en cada deploy.

### ❌ NO usar `@ts-nocheck`
Si encuentras errores TypeScript difíciles de resolver:
1. **Primero** intenta tipar correctamente (añade interfaces, usa type guards)
2. Si es inevitable (por ejemplo, una librería sin tipos), usa `@ts-expect-error` en la línea específica con un comentario explicativo
3. **Nunca** uses `@ts-nocheck` en la primera línea del archivo

### ❌ NO hacer push directo a `main`
Siempre trabaja en una rama `feature/*` o `fix/*` y crea una Pull Request. El único momento aceptable para push directo a `main` es una emergencia de producción coordinada con el equipo.

### ❌ NO ignorar errores de TypeScript
Antes de commitear, ejecuta:
```bash
npx tsc --noEmit
```

Si hay errores, **corrígelos antes de hacer push**. Los errores TypeScript en `main` rompen el build de producción en Railway.

### ❌ NO hardcodear URLs de API
Usa rutas relativas (`/api/certifications`) o la variable de entorno `APP_URL` cuando necesites URLs absolutas (por ejemplo, en emails).

```tsx
// ✅ Correcto
fetch("/api/certifications");

// ❌ Incorrecto
fetch("http://localhost:5000/api/certifications");
```

---

## 🆘 ¿Necesitas ayuda?

- **Documentación del stack**: consulta CLAUDE.md para instrucciones específicas del proyecto
- **Dudas sobre el código**: abre una issue en GitHub o pregunta en el canal de Slack del equipo
- **Problemas de configuración local**: verifica que tu `.env` esté correctamente configurado y que la base de datos esté accesible

---

**¡Gracias por contribuir a CERTIFIVE!** 🌿
