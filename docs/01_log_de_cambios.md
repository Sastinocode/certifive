# CERTIFIVE — Log de Cambios

> Generado a partir de `git log` (271 commits totales originalmente; actualizado a mano el 2026-07-07)  
> Rama: main | HEAD: `2bc57f8` (2026-07-07)

---

## Formato

`Fecha | Hash | Área | Cambio | Estado`

---

## Julio 2026 — Sprint de hardening (Bloques A/B/C, `TASKS_SONNET5.md`)

| Fecha | Hash | Área | Cambio | Estado |
|-------|------|------|--------|--------|
| 2026-07-07 | `2bc57f8` | Docs | Checklist manual de smoke test E2E (`docs/04_smoke_test_manual.md`) | Aplicado |
| 2026-07-07 | `b763a02` | Auth / Infra | Elimina `express-session`/`connect-pg-simple`/`memorystore` sin uso real + `SESSION_SECRET` | Aplicado |
| 2026-07-07 | `c29d150` | Admin | Panel admin: nº certificaciones por usuario, adopta `KpiCard`/`StatusBadge`/`SearchInput` | Aplicado |
| 2026-07-07 | `9e8d006` | Observabilidad | Sentry frontend (`@sentry/react`, pinned a v8) — backend ya existía | Aplicado |
| 2026-07-07 | `551f7f5` | Tests | 20 tests de flujos públicos por token (`public-flows.test.ts`) | Aplicado |
| 2026-07-07 | `0e970af` | Tests / Stripe | 14 tests de pagos/suscripción; 403→402 `subscription_required`; elimina alias muerto `/api/stripe/webhook` en `subscription.ts` | Aplicado |
| 2026-07-07 | `f079ef8` | Suscripción | **Fix crítico**: `checkSubscription` devolvía 401 en flujos públicos por token (solicitud/presupuesto/pago/CEE/técnico) y en el stream SSE de notificaciones | Aplicado |
| 2026-07-07 | `3cae439` | Stripe | Webhook de suscripción: secrets vía `config.ts`, logging de eventos | Aplicado |
| 2026-07-07 | `5343f6e` | Formularios | Decisión documentada sobre los 3 formularios de certificación (`docs/03_formularios_decision.md`) | Aplicado |
| 2026-07-07 | `785179c` | TypeScript | Elimina `@ts-nocheck` de las últimas 4 páginas — 0 restantes en el repo | Aplicado |
| 2026-07-07 | `7ba45bb` | TypeScript | Elimina `@ts-nocheck` de libs y componentes | Aplicado |
| 2026-07-07 | `7b9ce80` | TypeScript | Elimina `@ts-nocheck` de `email.ts`, `sse.ts`, `vite.ts` | Aplicado |
| 2026-07-07 | `580826d` | Limpieza | Elimina scripts de un solo uso y artefactos timestamp de vite/vitest | Aplicado |

> Detalle completo de cada tarea (qué se encontró, qué se cambió y por qué) en
> `docs/00_estado_actual.md` → sección "Sprint 2026-07-07 — Hardening".

---

## Mayo 2026 (desarrollo intensivo — últimos 30 commits relevantes)

| Fecha | Hash | Área | Cambio | Estado |
|-------|------|------|--------|--------|
| 2026-05-15 | `232daff` | UI / Branding | Limita altura de logo en navbar (36px) y footer (32px) | Aplicado |
| 2026-05-14 | `1035b7f` | Build / Infra | Corrige casing del import Login en App.tsx para Linux (case-sensitive FS) | Aplicado |
| 2026-05-14 | `cbd5a5c` | Seguridad | Añade Helmet, rate limiting (5 logins/15min, 3 registros/hora), verificación de email obligatoria, páginas legales (Privacy, Terms) | Aplicado |
| 2026-05-14 | `d5ab89a` | Diseño | Añade `design_handoff_certifive/` — design tokens, referencia HTML, assets | Aplicado |
| 2026-05-14 | `8ad4549` | Landing | Refresh visual — parallax, reveals, 5 pasos, testimonios, logo PNG, nav carets | Aplicado |
| 2026-05-14 | `07071bf` | Auth | Corrige error 500 en registro y añade validación de fuerza de contraseña | Aplicado |
| 2026-05-14 | `21d1b31` | Auth / UI | Alinea páginas Register y Login al nuevo diseño visual unificado | Aplicado |
| 2026-05-14 | `a7ba871` | UI / Stripe | Rediseño sidebar oscuro + sistema completo de suscripciones Stripe | Aplicado |
| 2026-05-14 | `ea86861` | Branding | Actualiza branding Login a verde Certifive (#1FA94B) | Aplicado |
| 2026-05-14 | `f2119ce` | Copy | Cambia trial de 14 a 7 días en toda la landing | Aplicado |
| 2026-05-14 | `132e7c3` | Landing / Catastro | Demo interactiva con 6 pestañas en hero + proxy API Catastro en servidor | Aplicado |
| 2026-05-14 | `07e47b2` | Export | Exportación de datos para CE3X en PDF y Excel — Modo A y Modo B | Aplicado |
| 2026-05-14 | `841c49c` | Modo A | Ficha técnica de visita — envolvente, huecos, instalaciones, fotos, medidas de mejora | Aplicado |
| 2026-05-14 | `5a0a25f` | Modo B | Corrige workflowStatus del formulario técnico + botón revisión | Aplicado |
| 2026-05-14 | `e271a2f` | Infra / Modo B | Migra uploads a Cloudinary + activa rutas modulares + formulario técnico guiado (Modo B) | Aplicado |
| 2026-05-14 | `aad7660` | Build | Instala cloudinary, corrige casing imports, excluye dead code de tsconfig | Aplicado |
| 2026-05-14 | `236b9d3` | Auth | Página de registro funcional conectada al backend | Aplicado |
| 2026-05-13 | `9849340` | Landing | Rediseño landing — paleta verde, logo, 5 pasos, FAQ, testimonios | Aplicado |
| 2026-05-13 | `14fcfa7` | Infra | Nueva landing page + **subida inicial del código fuente completo al repo** | Aplicado |
| 2026-05-12 | `d070bbc` | Auth | Elimina botones demo + cambia trial de 14 a 7 días | Aplicado |
| 2026-05-09 | `44bcdff` | Stripe | Añade gestión de suscripción en settings y API backend | Aplicado |
| 2026-05-09 | `841cffa` | Workflow | Proceso guiado de 3 pasos para envío de certificados a clientes | Aplicado |
| 2026-05-09 | `1960334` | Export | Generación de descargas de certificado en múltiples formatos (frontend) | Aplicado |
| 2026-05-09 | `f125e26` | Pagos | Gestión de pagos en certificados y settings | Aplicado |
| 2026-05-09 | `baac488` | Público | Nuevas páginas públicas + gestión de links para clientes | Aplicado |
| 2026-05-08 | `228e995` | Presupuestos | Mejoras en herramientas de presupuesto y settings de usuario | Aplicado |
| 2026-05-08 | `a9d7b72` | Formularios | Actualiza formularios y navegación para usar el proceso de certificación mejorado | Aplicado |
| 2026-05-08 | `6546fc9` | UX | Mejora la UX del formulario de certificación + subida de fotos | Aplicado |

---

## Antes de Mayo 2026 (commits más antiguos — base del proyecto)

| Fecha aprox. | Área | Cambio |
|--------------|------|--------|
| Mayo 2026 early | Infra | Publicación inicial en Railway (`Published your App`) |
| Mayo 2026 early | Auth | Prevenir login demo automático en nuevas visitas |
| Mayo 2026 early | Auth | Suscripción demo no persiste entre sesiones |
| Mayo 2026 early | Mobile | Optimización landing para móvil y navegación |
| Anterior | Core | Implementación inicial: expedientes, tarifas, facturas, WhatsApp, notificaciones |

---

## Notas del Log

- El proyecto tiene 271 commits en total. El código fuente completo fue subido al repo el **2026-05-13** (commit `14fcfa7`). Los commits anteriores son del entorno Replit y no contienen el código fuente real.
- La mayor parte del desarrollo ocurrió el **2026-05-14** (más de 20 commits en un solo día — sesión intensiva de construcción con Claude).
- El código en producción (Railway) puede no estar sincronizado con HEAD si el último push no incluyó `dist/`.

---

## Migraciones de Base de Datos

| Migración | Archivo | Contenido |
|-----------|---------|-----------|
| 0000 | `0000_complete_wrecking_crew.sql` | Esquema inicial completo |
| 0001 | `0001_dapper_luminals.sql` | Expansión de usuarios y certifications |
| 0002 | `0002_aromatic_red_shift.sql` | Tablas de comunicación y notificaciones |
| 0003 | `0003_legal_the_stranger.sql` | Tokens de workflow (solicitud, presupuesto, pago, CEE, técnico) |
| 0004 | `0004_plain_pet_avengers.sql` | Ajustes finales de esquema |

> **Nota**: Existe también `_migrate4.ts` en la raíz del proyecto — script ad-hoc de migración manual, vestigio de iteración rápida. No forma parte del sistema oficial de migraciones.

