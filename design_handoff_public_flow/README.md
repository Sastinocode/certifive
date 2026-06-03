# Handoff: Flujo público de Certifive (CEE)

> **¿Por dónde empiezo?** Lee `IMPLEMENTATION_GUIDE.md` — es el plan de trabajo paso a paso para Claude Code.
> Este README es la **especificación de referencia** (sistema de diseño + detalle de cada pantalla).
> Las **capturas** de cada pantalla están en `screenshots/` (numeradas 1–8).

## Overview
Conjunto de **8 pantallas públicas** (cara al cliente final) para contratar un Certificado de Eficiencia Energética (CEE): desde el descubrimiento de precios hasta la solicitud, pago, confirmación y seguimiento del pedido, incluyendo el estado de error de pago.

Flujo completo:

```
pricing  ─►  PublicCEEForm (1)  ─►  FormularioTecnicoPublico (2)  ─►  PublicPresupuesto (3)  ─►  PublicPayment (4)
                                                                                                      │
                                                              ┌───────────────────────────────────────┤
                                                              ▼                                        ▼
                                                    PublicConfirmacion (éxito)            PublicPagoRechazado (error)
                                                              │
                                                              ▼
                                                    PublicSeguimiento (estado en vivo)
```

## About the Design Files
Los archivos de este paquete son **referencias de diseño hechas en HTML + Tailwind (CDN)** — prototipos que muestran el aspecto y comportamiento deseados, **no código de producción para copiar tal cual**.

La tarea es **recrear estos diseños en el entorno existente de tu proyecto** (parece ser React + Tailwind, según `client/src/` y `tailwind.config.ts`), reutilizando sus componentes, tokens y convenciones. Donde el prototipo usa clases utilitarias o un `<style>` con clases propias (`.fi`, `.choice`, `.btn-primary`, etc.), conviértelas a componentes/estilos reutilizables del proyecto.

## Fidelity
**Alta fidelidad (hi-fi).** Colores, tipografía, espaciados, radios, sombras e interacciones son finales. Recrear pixel-perfect usando las librerías y patrones del codebase. Los datos mostrados (nombres, importes, nº de pedido, fechas) son de ejemplo y deben venir del backend.

---

## Sistema de diseño compartido

Todas las páginas enlazan una hoja común: **`certifive-public.css`**. Conviértela en tokens + componentes del proyecto.

### Colores
| Token | Valor | Uso |
|---|---|---|
| primary | `hsl(142 69% 36%)` ≈ `#1FA94B` | Verde de marca: botones, acentos, estados activos |
| primary-dark | `hsl(142 69% 31%)` | Hover del botón primario |
| primary-soft | `hsl(142 60% 97%)` | Fondos suaves de selección, badges |
| ink | `#0f1f2e` | Texto principal |
| muted | `#5e6772` | Texto secundario |
| border | `#e4e6ea` | Bordes de inputs/tarjetas |
| border-soft | `#eef0f3` | Separadores internos (filas) |
| bg | `#fafbfc` | Fondo de página |
| amber (badge) | bg `#fef3e2` / texto `#9a6207` | Estados "pendiente / por confirmar" |
| error | bg `#fef2f2` / borde `#fecaca` / icono `#dc2626` | Estado de error/rechazo |

Chips de calificación energética (A–G):
`A #0a8a3f` · `B #4cae3a` · `C #9fd13a` · `D #f5d800 (texto #5a4d00)` · `E #f5a623` · `F #ef6c2a` · `G #e23b2e`

### Tipografía
- Familia: **Inter** (400, 500, 600, 700, 800), `-webkit-font-smoothing: antialiased`, `letter-spacing: -0.005em` en body; títulos `-0.02em`.
- Hero h1: ~2.0–2.5rem / 800. Section title: 1.7–2.3rem / 800. Card title (h2): 16–18px / 700. Body: 14.5–15px / 400. Eyebrow: 10–11px / 700, uppercase, `tracking-wider`. Hint: 12px / muted.

### Radios
- Inputs: `12px` · Tarjetas de selección: `14px` · Tarjetas grandes/contenedores: `24px` (`rounded-3xl`) · Píldoras/botones: `999px`.

### Sombras
- Tarjeta: `shadow-sm` de Tailwind. Hover de planes: `0 18px 40px rgba(15,31,46,.08)`. Botón primario: `0 1px 3px hsl(142 69% 36% / .3)`, hover `0 6px 14px hsl(142 69% 36% / .35)`.

### Layout
- Contenedor: `max-w-3xl` (formularios), `max-w-4xl` (presupuesto/pago/seguimiento), `max-w-6xl` (header/footer/pricing).
- Padding lateral: `20px` móvil (`px-5`), `32px` desktop (`px-8`).
- Rejilla típica formulario+rail: `lg:grid-cols-[1fr_260px]` (o `_300px`/`_330px`), `gap-8`.

### Componentes base (en `certifive-public.css`)
- **`.fi`** — input/select/textarea: alto 48px, borde 1.5px, radio 12px; focus = borde primary + anillo `0 0 0 4px primary/12%`. `select.fi` lleva chevron SVG embebido. `textarea.fi` min 110px.
- **`.label`** / **`.hint`** / `.label .opt` (sufijo "opcional" en gris).
- **`.btn-primary`** — píldora verde, alto 52px (variantes 42/46px vía estilo inline), icono + texto, hover sube 1px.
- **`.btn-ghost`** — píldora blanca, borde 1.5px.
- **`.choice`** — tarjeta de selección (icono 40px + título/subtítulo + radio `.dot`). **`.choice-v`** = variante vertical (icono arriba, dot absoluto arriba-derecha, texto debajo) **obligatoria en rejillas de 3 columnas estrechas** para que el texto no se solape con el radio.
- **`.choice-sm`** — chip de selección compacto (solo dot + texto).
- **`.check`** — checkbox 18px con check SVG embebido al `:checked`.
- **`.pill`** + `.pill-green / .pill-amber / .pill-slate` — badges de estado.
- **`.stepper`** — barra de pasos (bubble + label + segmentos), estados `.done` (verde+check) / `.active` (anillo) / pendiente.
- **`.sum-row`** / **`.line-item`** — filas de resumen/presupuesto (clave izquierda, valor derecha, separador `border-soft`).
- **`.trust-item`** + `.trust-ico`, **`.step-num`**, **`.erating`** (chip calificación).
- **`.reveal`** — animación de entrada. ⚠️ **Importante:** es **solo transform** (`translateY(14px) → 0`), NO toca opacity, para que el contenido nunca quede invisible si la animación no corre. Mantén ese criterio en el codebase (no animar opacity a 0 en contenido crítico).

### Selección (JS)
Los grupos `.choice` / `.choice-sm` son radios de selección única: al hacer click se quita `.selected` de los hermanos y se añade al pulsado. En React esto es estado controlado (`useState` con el valor elegido).

---

## Pantallas

### 1. pricing.html — Precios
- **Propósito:** entrada de marketing; el cliente elige tipo de inmueble y va a la solicitud.
- **Layout:** hero centrado (`max-w-3xl`) + rejilla de 3 planes (`md:grid-cols-3`) + sección de add-ons (3 tarjetas) + FAQ (`<details>`) + CTA final.
- **Planes:** Vivienda (129 €, destacado "Recomendado" no), Local/Oficina (169 €, **featured** con borde verde y badge "Más completo"), Edificio completo ("A medida"). Cada plan: icono, título, descripción, precio grande (42px/800), lista de features con check verde, botón (ghost o primary).
- **Add-ons:** Tramitación urgente +29 €, Plan de mejora +19 €, Copia compulsada +15 €.
- **FAQ:** acordeón nativo `<details class="faq">`; chevron rota al abrir.
- **CTA:** todos los botones "Solicitar" → `PublicCEEForm.html`.

### 2. PublicCEEForm.html — Solicitud (paso 1)
- **Propósito:** captar contacto + datos básicos del inmueble.
- **Layout:** stepper (paso 1 activo) → hero → `lg:grid-cols-[1fr_260px]`: formulario (izq) + rail "Así de fácil" + precio orientativo (der).
- **Campos:** nombre, email, teléfono (+hint); tipo de inmueble (3× `.choice.choice-v`: Vivienda/Local/Oficina); ciudad/CP (input con icono pin), superficie (input number con sufijo "m²"); finalidad (3× `.choice-sm`: Vender/Alquilar/Trámite); checkbox RGPD.
- **CTA:** "Continuar" → `formulario-tecnico.html`.

### 3. formulario-tecnico.html (FormularioTecnicoPublico) — Datos técnicos (paso 2)
- **Propósito:** recoger datos técnicos del inmueble para el certificado.
- **Layout:** stepper (1 done, 2 activo) → 4 tarjetas de sección + rail con resumen de la solicitud y nota tranquilizadora.
- **Secciones:** Dirección (dirección, CP, municipio, ref. catastral); Características (año, superficie útil, planta `select`, situación `.choice-sm`, orientación `.choice-sm`); Instalaciones (calefacción/ACS/refrigeración/ventanas en `select`, mejoras en checkboxes múltiples); Documentación (dropzone de archivos + textarea notas).
- **CTA:** "Atrás" → PublicCEEForm; "Ver mi presupuesto" → `PublicPresupuesto.html`.

### 4. PublicPresupuesto.html — Presupuesto (paso 3)
- **Propósito:** mostrar presupuesto cerrado y aceptarlo.
- **Layout:** stepper (1-2 done, 3 activo) → `lg:grid-cols-[1fr_330px]`: detalle (izq) + resumen sticky con total y CTA (der).
- **Detalle:** cabecera del presupuesto (nº, fecha, badge "Recomendado") + datos clave (inmueble/superficie/ubicación/finalidad); "Qué incluye" (4× `.line-item` con icono + "incluido"); calificación estimada (fila de chips A–E, la "C" resaltada).
- **Resumen:** `.sum-row` (concepto + registro + urgente), total grande (33px/800) con precio tachado al lado.
- **CTA:** "Aceptar y pagar" → `PublicPayment.html`; "Revisar datos" → formulario-tecnico. Badge amber "Válido 14 días".

### 5. PublicPayment.html — Pago (paso 4)
- **Propósito:** cobro seguro.
- **Layout:** stepper (1-3 done, 4 activo) → `lg:grid-cols-[1fr_330px]`: formulario (izq) + resumen del pedido sticky (der).
- **Formulario:** método de pago (3× `.choice.choice-v`: Tarjeta/PayPal/Transferencia — al elegir, muestra/oculta `#card-fields`); campos de tarjeta (número con marcas Visa/MC, caducidad, CVC, titular); facturación (nombre, NIF, dirección, CP, checkbox "factura empresa"); checkbox términos.
- **Resumen:** subtotal, registro, IVA 21%, descuento web (en verde), total; botón "Pagar 129 €"; sellos de confianza (SSL, devolución, RGPD) + "Procesado por Stripe".
- **Comportamiento:** `submit` → `window.location = 'PublicConfirmacion.html'` (en el codebase: éxito real → confirmación; rechazo → `PublicPagoRechazado.html`).

### 6. PublicConfirmacion.html — Éxito
- **Propósito:** confirmar pago y explicar próximos pasos.
- **Layout:** hero con check animado (círculo verde, `@keyframes pop` + trazo `draw` + anillo `ring`) + nº pedido e importe → tarjeta de cita (fecha tentativa, badge "Por confirmar", botones calendario/reprogramar) → "¿Qué pasa ahora?" (timeline corta `.tl` con estados done/current/pending) → resumen del pedido (con "Descargar resguardo") → bloque de ayuda WhatsApp → enlace a seguimiento.
- **Enlaces:** "Ver estado del pedido" y CTA final → `PublicSeguimiento.html`.

### 7. PublicSeguimiento.html — Seguimiento (estado en vivo)
- **Propósito:** estado del pedido tras el pago.
- **Layout:** hero con estado actual ("Certificado en redacción"), badge "Paso 3 de 4", entrega estimada y **barra de progreso** (70%) con etiquetas → `lg:grid-cols-[1fr_300px]`: timeline detallado vertical `.tl` (izq) + rail (der) con inmueble, calificación, descarga del PDF (deshabilitada hasta finalizar) y ayuda.
- **Timeline:** 2 pasos `done`, 1 `current` (con `ping` animado pulsante y caja de detalle verde), 1 `pending` (atenuado). Línea de relleno `.tl-fill` indica progreso.

### 8. PublicPagoRechazado.html — Pago rechazado (error)
- **Propósito:** error de pago, tranquilizar y permitir reintento.
- **Layout:** hero con icono X animado (`pop` + `shake`), mensaje "no se ha realizado ningún cargo", código del banco → tarjeta "Vuelve a intentarlo" (Reintentar / Usar otra tarjeta → PublicPayment) → "¿Por qué ha pasado esto?" (3 causas con icono) → recap "Tu solicitud sigue guardada" (badge amber) → ayuda WhatsApp → volver a precios.

---

## Interacciones y comportamiento
- **Navegación:** enlaces `<a href>` relativos entre pantallas (ver flujo arriba). En el codebase, mapear a rutas reales.
- **Selección de tarjetas:** click cambia `.selected` (single-select por grupo). → estado React.
- **Método de pago:** mostrar/ocultar campos de tarjeta según selección.
- **FAQ:** acordeón nativo `<details>` (un chevron que rota).
- **Stepper:** refleja el paso actual; bubbles completados muestran check.
- **Animaciones:** entrada `.reveal` (solo translate, 0.6s, ease-out-expo); check de éxito (pop+draw+ring); X de error (pop+shake); `ping` en el paso actual del seguimiento. Todas respetan `prefers-reduced-motion`.
- **Estados del backend a contemplar:** solicitud guardada (lead), presupuesto emitido/aceptado, pago ok/rechazado, visita por confirmar/confirmada/realizada, certificado en redacción/registrado/listo (PDF descargable).

## State / datos
Variables que el codebase necesitará alimentar: datos de contacto, datos del inmueble (tipo, m², ubicación, finalidad, año, instalaciones…), nº de presupuesto, desglose de importes (subtotal, tasa CCAA, IVA, descuento, total), método de pago, estado del pedido y timeline, fecha de visita, calificación energética estimada, URL del PDF final.

## Assets
- Sin imágenes propias: todos los iconos son **SVG inline** (estilo line, stroke 2–2.5, esquema Feather/Lucide). Sustituir por la librería de iconos del proyecto si la hay.
- Logo: cuadrado verde con la letra "C" (placeholder). Usar el logo real (`assets/logo-mark.png` / `logo-horizontal.png` ya en el proyecto).
- Fuente Inter vía Google Fonts.

## Files (en este paquete, carpeta `public/`)
- `pricing.html`
- `PublicCEEForm.html`
- `formulario-tecnico.html` (FormularioTecnicoPublico)
- `PublicPresupuesto.html`
- `PublicPayment.html`
- `PublicConfirmacion.html`
- `PublicSeguimiento.html`
- `PublicPagoRechazado.html`
- `certifive-public.css` (sistema compartido — empezar por aquí)
