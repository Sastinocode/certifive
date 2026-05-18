# CERTIFIVE — Log de Cambios

> Generado a partir de `git log` (271 commits totales)  
> Rama: main | HEAD: `232daff` (2026-05-15)

---

## Formato

`Fecha | Hash | Área | Cambio | Estado`

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

