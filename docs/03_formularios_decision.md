# CERTIFIVE — Decisión sobre los 3 formularios de certificación

> Análisis realizado: 2026-07-07 (tarea A5, TASKS_SONNET5.md)
> **Actualización 2026-07-07**: Sebas confirmó y verificó personalmente que ni
> `/api/public/certification-form/:uniqueLink` ni `/api/public/quotes/:uniqueLink` existen en
> `server/routes`, y que nada en el backend genera `uniqueLink`. Ambos archivos (`certification-form.tsx`
> y `public-quote.tsx`) se han **eliminado**. Ver sección "Resolución" al final del documento.

## Resumen

Existen 3 componentes con nombre parecido que podrían parecer duplicados:

| Archivo | Ruta(s) | Audiencia | Estado |
|---|---|---|---|
| `enhanced-certification-form.tsx` | `/certificados/nuevo`, `/formulario-cee` | Certificador autenticado | ✅ Funcional — **canónico** |
| `certification-wizard.tsx` | `/certificacion/:id?` | Certificador autenticado | ✅ Funcional, más simple |
| ~~`certification-form.tsx`~~ | ~~`/certificacion-cliente/:uniqueLink`~~ | Cliente final (público, sin login) | ❌ **Eliminado** (2026-07-07) — endpoint backend inexistente, confirmado y verificado por Sebas |

**Decisión inicial (A5): NO se borra ninguno.** Los 3 tenían rutas activas registradas en `App.tsx`
con audiencias declaradas distintas (certificador vs. cliente final), por lo que no eran duplicados
funcionales en sentido estricto según el criterio de la tarea A5.

**Actualización 2026-07-07**: tras confirmar con Sebas que el endpoint jamás existió y que nada en
el backend genera `uniqueLink`, se eliminó `certification-form.tsx` y su ruta. Quedan 2 formularios
de certificación activos (ambos para el certificador autenticado, no para el cliente final).

---

## 1. `enhanced-certification-form.tsx` — canónico para el certificador

- 991 líneas. `react-hook-form` + `zod` para validación, wizard de 6 pasos (Propiedad, Titular, Estructura, Ventanas, Instalaciones, Fotografías), autocompletado por referencia catastral (`GET /api/catastro/lookup`, existe y funciona), subida de fotos con `PhotoUpload`, animaciones con Framer Motion.
- Envía `POST /api/certifications` (endpoint real, cubierto por tests en `server/tests/api.test.ts`).
- Enrutado en dos paths con el mismo componente: `/certificados/nuevo` y `/formulario-cee` (ambos protegidos por `isAuthenticated`).
- **Es la implementación más completa y la que se debe seguir usando/extendiendo** para el flujo interno de creación de certificaciones.

## 2. `certification-wizard.tsx` — alternativa interna más simple

- 209 líneas. Wizard de 3 pasos (Datos Generales, Detalles de Vivienda, Instalaciones) delegados a subcomponentes (`GeneralDataForm`, `HousingDetailsForm`, `InstallationsForm`).
- También envía `POST /api/certifications` (mismo endpoint real que el formulario enhanced).
- Enrutado en `/certificacion/:id?`. El parámetro `:id` sugiere soporte de edición, pero el componente **no carga datos existentes** (no hay `useQuery` por `id`) — si se navega con un id, solo cambia el título a "Editar Certificación" sin precargar el formulario. Esto es una limitación funcional preexistente, no se ha tocado (fuera de alcance de A5: no se cambia lógica de negocio).
- Es funcionalmente redundante con el formulario enhanced (mismo endpoint, mismo objetivo: crear una certificación), pero con menos campos y sin autocompletado catastral. Tiene su propia ruta activa (`/certificacion/:id?`), así que no se borra en esta tarea; se dejará constancia para una futura consolidación cuando se aborde específicamente el flujo de edición de certificaciones.

## 3. `certification-form.tsx` — formulario público roto (❌ ELIMINADO 2026-07-07)

- 676 líneas. Formulario de 4 pasos pensado para que el **cliente final** (sin cuenta) complete los datos de su propiedad a través de un enlace único: `/certificacion-cliente/:uniqueLink`.
- Hacía `GET`/`POST` contra `/api/public/certification-form/:uniqueLink`.
- **Ese endpoint no existía en el backend.** Se revisó todo `server/` (`grep -rn "certification-form" server/`) y no había ninguna ruta registrada con ese path. Un cliente real que abriera ese enlace habría cargado el formulario en estado de error permanente.
- El flujo público real y funcional para que el cliente complete datos técnicos ya existe y está implementado con tokens reales en `server/routes/public-forms.ts`: `GET/POST /api/formulario-cee/:token` (ruta `/formulario-cee/:token` → `CEEFormWrapper`), además de `/api/solicitud/:token` y `/api/presupuesto/:token`.
- **Conclusión confirmada por Sebas**: código legado de una versión anterior del flujo público, reemplazada por el sistema de tokens (`solicitud` → `presupuesto` → `formulario-cee`). Nada en el backend genera `uniqueLink`, así que la ruta era inalcanzable desde cualquier flujo activo.
- **Acción tomada**: eliminado `client/src/pages/certification-form.tsx`, su import y la ruta `/certificacion-cliente/:uniqueLink` en `App.tsx` (incluidas sus entradas en `SETUP_SKIP_PREFIXES`).

### Hallazgo relacionado — `public-quote.tsx` (❌ ELIMINADO 2026-07-07)

`client/src/pages/public-quote.tsx` (ruta `/cotizacion/:uniqueLink`) tenía el mismo problema: llamaba a `/api/public/quotes/:uniqueLink` y `/api/public/quotes/:uniqueLink/payment`, ninguno existía en el backend (`grep -rn "public/quotes" server/` → sin resultados). El flujo real de presupuesto ya funciona vía `/api/presupuesto/:token`. Compartía el mismo patrón de "página legada con endpoint fantasma" que `certification-form.tsx`. Eliminado junto con su import y la ruta `/cotizacion/:uniqueLink` (incluida su entrada en `SETUP_SKIP_PREFIXES`).

---

## Resolución (2026-07-07)

Sebas verificó personalmente que ambos endpoints (`/api/public/certification-form/:uniqueLink`,
`/api/public/quotes/:uniqueLink`) no existen en `server/routes` y que nada en el backend genera
`uniqueLink`. Con esa confirmación:

- Eliminados `client/src/pages/certification-form.tsx` y `client/src/pages/public-quote.tsx`.
- Eliminadas en `client/src/App.tsx`: las rutas `/certificacion-cliente/:uniqueLink` y
  `/cotizacion/:uniqueLink`, sus imports (`CertificationForm`, `PublicQuote`), y sus entradas
  `"/certificacion-cliente/"` / `"/cotizacion/"` en `SETUP_SKIP_PREFIXES`.
- Quedan **2 formularios de certificación activos**: `enhanced-certification-form.tsx` (canónico,
  `/certificados/nuevo` y `/formulario-cee`) y `certification-wizard.tsx` (más simple,
  `/certificacion/:id?`) — ambos para el certificador autenticado, ninguno duplicado con el otro
  en audiencia final aunque compartan el mismo endpoint de creación (`POST /api/certifications`).
  La redundancia entre estos dos queda anotada como backlog de una futura consolidación (ver nota
  en la sección 2), no se tocó en esta resolución.
