# CERTIFIVE — Contexto del proyecto para Claude Code

## ¿Qué es Certifive?
Plataforma de gestión del negocio del certificador energético español.
**NO** genera certificados CEE. CE3X genera el PDF; Certifive gestiona clientes,
presupuestos, pagos, documentos y comunicaciones. El certificador sube el PDF de CE3X
y lo envía al cliente desde Certifive.

## Stack (NO usar alternativas no listadas aquí)
| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Routing | **Wouter** — NO React Router |
| Estado servidor | TanStack Query (`useQuery`, `useMutation`) |
| UI | shadcn/ui + Radix UI (New York style) |
| Estilos | Tailwind CSS |
| Backend | Node.js + Express |
| ORM | Drizzle ORM |
| Base de datos | PostgreSQL — Neon serverless |
| Auth | JWT + refresh token + 2FA email OTP |
| Email | SendGrid (`server/email.ts`) |
| WhatsApp | 360dialog API (`server/whatsapp.ts`) |
| Archivos | Cloudinary (`server/cloudinary.ts`) |
| Pagos | Stripe |
| Deploy | Railway (CI/CD desde GitHub main) |

## Design system — tokens CSS
```
--primary: 142 69% 36%   →  #1FA94B (verde)
sidebar:   bg-[#0f1f2e]
cards:     bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6
topbar:    h-16 bg-card/80 backdrop-blur-sm border-b border-border
```

## Componentes compartidos (importar desde `@/components/ui`)
```typescript
import { KpiCard, StatusBadge, EnergyChip, SectionCard, FilterChip, SearchInput } from "@/components/ui";
import Sidebar from "@/components/layout/sidebar";
import AppTopbar from "@/components/layout/AppTopbar";
```

## Design handoff (referencias HTML)
Ruta: `design_handoff_panel_interno/reference/`
Archivos: `ajustes.html`, `certificados.html`, `dashboard.html`, `expedientes.html`,
`facturacion.html`, `informes.html`, `inmuebles.html`, `whatsapp.html`

## Patrón de refactor visual (páginas ya hechas como ejemplo: properties.tsx, Certifications.tsx)
1. Leer HTML de referencia completo
2. Leer .tsx actual completo
3. Copiar EXACTAMENTE clases Tailwind del HTML
4. Mantener TODA la lógica (estados, queries, mutations, handlers)
5. Usar SectionCard para agrupar secciones en formularios/settings
6. `npx tsc --noEmit` → 0 errores antes de commit

## Patrón de cron (ver digest.ts y notifications.ts como referencia)
- `setInterval` cada 60 s — SIN librería externa
- Comprueba hora en Europe/Madrid con `Intl.DateTimeFormat`
- Guarda `lastSentDate` para no enviar más de una vez por día
- Exporta función `startXxxCron()` → se registra en `server/index.ts`

## Reglas CRÍTICAS — nunca violarlas
- **PROHIBIDO** leer archivos `.png` (rompe la sesión con error 400)
- **PROHIBIDO** arrancar el dev server (`npm run dev`, `npx vite`, etc.)
- **PROHIBIDO** usar `@ts-nocheck` o `any` sin justificación en comentario
- **PROHIBIDO** usar React Router (solo Wouter)
- **PROHIBIDO** subir archivos a disco local (solo Cloudinary)
- Siempre `npx tsc --noEmit` antes de commitear
- Un commit por tarea, mensaje en formato `type(scope): descripción`

## Variables de entorno disponibles
`DATABASE_URL`, `JWT_SECRET`, `SESSION_SECRET`, `ENCRYPTION_KEY`,
`SENDGRID_API_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
`CLOUDINARY_API_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`APP_URL`, `PORT`, `LOG_LEVEL`
