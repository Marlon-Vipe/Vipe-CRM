# Prompt para Claude Code — Construcción del CRM Inmobiliario

> **Cómo usar este archivo:** colócalo en la raíz del repo junto con `crm_schema.sql`
> y el contenido ya descomprimido de `crm-frontend-ubold.zip` (el frontend ya
> adaptado sobre el template UBold comprado en ThemeForest). Luego dile a
> Claude Code: *"Lee CRM_PROMPT.md y constrúyeme el proyecto siguiendo esas
> instrucciones, empezando por la Fase 0"*. Este documento es autosuficiente:
> contiene todo el contexto de negocio, arquitectura, modelo de datos y
> decisiones ya tomadas para no tener que repetirlas en el chat.

---

## 0. Contexto de esta ejecución: migración de frontend, backend existente

**Importante — lee esto antes que cualquier otra sección.** Este NO es un
proyecto desde cero. Ya existe un repositorio con:

- Un **backend Node.js/Express funcional**, construido en una iteración
  anterior de este mismo proyecto (siguiendo una versión previa de este
  prompt, cuando el frontend todavía era Soft UI Dashboard React).
- Un **frontend anterior** (Soft UI Dashboard React, MUI) que se está
  **reemplazando por completo** por el nuevo frontend UBold ya incluido en
  `crm-frontend-ubold.zip`.

La tarea de esta ejecución es: **sustituir solo el frontend, dejando el
backend intacto salvo que algo sea estrictamente necesario adaptar.**

### Pasos obligatorios antes de escribir código

1. **Inspecciona el backend existente primero.** Lee sus rutas/controladores
   reales (probablemente en algo como `src/routes/`, `src/controllers/`, o
   equivalente) y documenta mentalmente el contrato de API real: qué
   endpoints existen, qué parámetros esperan, qué forma tiene cada respuesta
   JSON. Ese contrato real es la **fuente de verdad** — no asumas que
   coincide exactamente con lo descrito en la sección 6 de este prompt; esa
   sección describe la intención funcional, no necesariamente los nombres
   exactos de endpoints que se implementaron.
2. **No reescribas ni reestructures el backend** (rutas, controladores,
   modelos, nombres de tablas) solo por prolijidad o porque "se ve distinto"
   a como lo describe este prompt. Backend estable > backend prolijo.
3. **Conecta el nuevo frontend al backend tal como existe.** Si el backend
   expone `/api/contacts`, el frontend nuevo consume `/api/contacts` — no
   inventes un endpoint paralelo ni le pidas al backend que cambie su forma
   de responder solo para que combine mejor con el nuevo frontend, salvo que
   sea genuinamente imposible construir la pantalla sin ese cambio.
4. **Adapta el backend solo cuando haga falta de verdad**, por ejemplo:
   - El nuevo frontend necesita un dato que el backend no devuelve todavía
     (ej. un campo nuevo en la respuesta de propiedades).
   - Falta un endpoint completo que el frontend anterior no necesitaba pero
     el nuevo sí (ej. el backend puede no tener aún el webhook de Twilio si
     esa parte no se había construido).
   En esos casos, el cambio debe ser **aditivo** (agregar campo/endpoint),
   no un reemplazo de lo que ya funciona.
5. Si encuentras una contradicción real entre lo que el backend ya hace y lo
   que dice este prompt (por ejemplo, el backend ya resolvió
   multi-tenancy de una forma distinta a `current_tenant_id()`), **detente y
   pregunta antes de asumir cuál versión es la correcta** en vez de
   sobrescribir silenciosamente.

El resto de este documento (secciones 1 en adelante) describe la intención
completa del producto — úsalo como contexto de negocio y como referencia
para las partes que sí falten construir (frontend nuevo, y cualquier
endpoint de backend genuinamente ausente), no como una plantilla que haya
que aplicar de cero encima de lo ya construido.

---

## 1. Rol y objetivo

Vas a construir un **CRM Inmobiliario SaaS multi-tenant**. El producto:

1. Lo usarán primero dos personas (el dueño del proyecto y su socio, agente
   inmobiliario) para su propia agencia.
2. Está diseñado desde el día 1 para venderse por suscripción a **otras
   agencias inmobiliarias** — cada agencia es un "tenant" aislado.
3. Su diferenciador principal es **una bandeja unificada de WhatsApp/Instagram/
   Facebook** conectada a cada agencia, porque WhatsApp es el canal principal
   de comunicación con clientes en este mercado.

No tomes decisiones de arquitectura por tu cuenta que contradigan lo que ya
está decidido en este documento (stack, multi-tenancy, proveedor de
mensajería) — esas decisiones ya se evaluaron con alternativas y trade-offs
reales. Sí puedes (y debes) tomar decisiones de implementación de bajo nivel
que no estén especificadas aquí.

---

## 2. Stack tecnológico (decidido, no renegociable)

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | React + TypeScript, compilado con **Vite**, template **UBold** de Coderthemes (Bootstrap 5.3 + `react-bootstrap`), ya incluido y adaptado en este repo | **No introduzcas otra librería de UI ni cambies el sistema de diseño existente.** Todo componente nuevo se construye componiendo los componentes de `react-bootstrap` (`Card`, `Button`, `Badge`, `FormControl`, etc.) y los wrappers propios del template en `src/components/wrappers/` (`Icon`, `SimpleBar`) y `src/components/` (`PageBreadcrumb`, etc.). No instales Material UI, Ant Design, ni Tailwind. |
| Backend | Node.js + Express — **ya existe en este repo**, construido en una iteración anterior | No lo reescribas ni reestructures; ver sección 0. Capa de lógica de negocio, validación multi-tenant de segunda capa, webhooks de Twilio, integración de pagos. |
| Base de datos / Auth / Storage | Supabase (Postgres) — **proyecto ya existe y ya tiene datos/schema aplicado** | `crm_schema.sql` documenta el diseño original; el estado real puede haber evolucionado (ver sección 4). No crear un proyecto Supabase nuevo ni reaplicar el schema a ciegas. |
| Mensajería WhatsApp | **Twilio** (decisión tomada tras comparar contra 360dialog; ver sección 8) | No propongas otro BSP salvo que se te pida explícitamente. |
| Hosting previsto (no lo configures ahora, solo ten en cuenta la restricción) | Frontend en Vercel, backend en Railway | El frontend debe poder compilar como sitio estático (`npm run build`) sin depender de un servidor Node en el mismo proceso. |

---

## 3. Arquitectura multi-tenant (obligatoria, no opcional)

- Estrategia: **schema compartido + columna `tenant_id` en cada tabla +
  Row-Level Security (RLS)** de Postgres. Ya implementada en
  `crm_schema.sql`.
- **Regla de oro:** ninguna query del backend puede confiar únicamente en
  RLS. El backend usa la `service_role` key de Supabase (que **no** está
  sujeta a RLS), así que **toda** query del backend debe filtrar
  explícitamente por `tenant_id` en el código, además de que RLS proteja el
  acceso directo desde el frontend.
- Cada usuario autenticado pertenece a un tenant a través de la tabla
  `memberships` (ver esquema). La función `current_tenant_id()` ya existe en
  la base de datos para usarse en políticas RLS — no la dupliques con lógica
  distinta en el backend, pero sí replica la validación de tenant en cada
  endpoint.
- Roles dentro de un tenant: `owner`, `admin`, `agent` (enum
  `membership_role`). El owner/admin gestiona usuarios y facturación; el
  agente gestiona sus propios contactos/propiedades (o todos, según
  configuración futura — para el MVP, todos los agentes ven todo dentro de su
  tenant).

---

## 4. Modelo de datos

**No lo regeneres.** El archivo `crm_schema.sql` en la raíz del repo
documenta el diseño original:

- Tipos (`enums`) para estados de propiedades, contactos, actividades,
  canales, mensajes, etc.
- Tablas: `tenants`, `memberships`, `pipeline_stages`, `contacts`,
  `properties`, `property_images`, `deals`, `deal_stage_history`,
  `activities`, `documents`, `channels`, `conversations`, `messages`,
  `subscriptions`.
- Políticas RLS de aislamiento por tenant en cada tabla.
- Triggers: `updated_at` automático, historial de cambios de etapa del
  pipeline, actualización de `last_message_at` en conversaciones al llegar un
  mensaje.
- Función RPC `create_tenant_with_owner(p_tenant_name, p_user_id)` — el
  backend debe llamarla al completar el signup de una **nueva** agencia (no
  la uses para invitar agentes a una agencia existente, eso es un flujo
  distinto).

**Como el backend ya existe, el esquema real en Supabase puede haber
evolucionado respecto a este archivo** (columnas agregadas, ajustes durante
el desarrollo inicial). Antes de escribir cualquier query desde el nuevo
frontend, verifica el esquema real —vía el backend existente o el dashboard
de Supabase— en vez de asumir que `crm_schema.sql` es 100% fiel al estado
actual de la base de datos.

---

## 5. Pantallas a construir

El frontend ya trae, en `src/views/admin/apps/crm-inmobiliario/`, las
carpetas `contacts`, `properties`, `deals` e `inbox` con contenido real
**adaptado de las apps de ejemplo que trae UBold** (no son placeholders
vacíos — ya tienen diseño y datos de ejemplo funcionando). Tu trabajo es
reemplazar esos datos estáticos (`components/data.ts` en cada carpeta) por
datos reales de Supabase, manteniendo los componentes visuales tal cual
están.

| Pantalla | Carpeta | Origen en UBold | Qué falta hacer |
|---|---|---|---|
| Dashboard | `views/admin/dashboard/ecommerce` (sin mover, ruta `/dashboard`) | Dashboard de ecommerce del StarterKit | Reemplazar los datos de ejemplo por KPIs reales: leads nuevos (últimos 7 días), propiedades activas, negociaciones por etapa, próximas actividades pendientes. |
| Contactos | `views/admin/apps/crm-inmobiliario/contacts` | `apps/crm/contacts` (grid de tarjetas) | El grid y las tarjetas ya están resueltos — solo reemplazar `components/data.ts` por datos reales de la tabla `contacts` (nombre, teléfono, tipo, origen, agente asignado). Agregar vista de detalle con historial de actividades y conversaciones asociadas (no existe todavía, construirla). |
| Propiedades | `views/admin/apps/crm-inmobiliario/properties` | `apps/ecommerce/products/products-grid`, ya adaptada a campos inmobiliarios (`PropertyCard.tsx`, filtros de tipo/estatus/sector) | Reemplazar `components/data.ts` (10 propiedades de ejemplo) por datos reales de la tabla `properties`. Construir el formulario de creación/edición con carga de imágenes a Supabase Storage — usar `apps/ecommerce/products/product-add` de UBold como referencia de patrón (no está copiado en este repo, está en el paquete `Admin/TS` original si lo necesitas revisar). |
| Negociaciones | `views/admin/apps/crm-inmobiliario/deals` | `apps/crm/pipeline` (kanban con `@hello-pangea/dnd`), copiada tal cual | El tablero, drag-and-drop y tarjetas ya funcionan visualmente. Reemplazar `components/data.ts` por `pipeline_stages` + `deals` reales. Al soltar una tarjeta en otra columna, hacer el `UPDATE` de `deals.stage_id` — el trigger de la base de datos ya registra el historial, no lo dupliques en el frontend. |
| Mensajes (bandeja unificada) | `views/admin/apps/crm-inmobiliario/inbox` | `apps/chat`, copiada tal cual | La UI de chat (lista de conversaciones + panel de mensajes) ya existe. Reemplazar `components/data.ts` por `conversations`/`messages` reales, ordenados por `last_message_at`, con suscripción a Supabase Realtime para actualizarse sin recargar. |
| Perfil / Facturación | Aún no migradas a este repo | — | Construir desde cero reutilizando `react-bootstrap` (`Card`, `Tabs`, `Form`) — no existe una vista de referencia ya copiada para esto, a diferencia de las demás pantallas. |
| Autenticación | `views/auth/basic/sign-in` y `sign-up` (StarterKit, sin modificar) | — | El hook `src/hooks/useAuth.ts` actual es un **mock** (usuario fijo `admin@example.com` / `password`, guardado en `sessionStorage`). Reemplázalo por Supabase Auth real. El `sign-up` debe distinguir dos flujos: "crear una agencia nueva" (llama a `create_tenant_with_owner`) vs. "aceptar una invitación" (se une a un tenant existente vía un token de invitación — este segundo flujo aún no tiene backend, constrúyelo como parte de RF-02). |

**Rutas ya configuradas** en `src/routes/index.tsx`: `/dashboard`,
`/crm/contactos`, `/crm/propiedades`, `/crm/negociaciones`, `/crm/mensajes`,
más las de auth y error ya existentes en el StarterKit. El menú lateral
(`src/layouts/components/data.ts`) ya tiene las entradas correspondientes
bajo el grupo "CRM Inmobiliario".

**No agregues páginas fuera de esta lista sin que se te pida.** Las páginas
de demostración del template (variantes de layout, íconos, página vacía) ya
fueron eliminadas intencionalmente del proyecto — no las vuelvas a agregar.
El skin visual activo es **`flat`** (definido en
`src/context/useLayoutContext.tsx`, campo `INIT_STATE.skin`) — no lo cambies
sin que se te pida.

---

## 6. Requisitos funcionales (implementar en este orden de prioridad)

**Cuentas y acceso**
- RF-01: signup crea tenant + owner + pipeline por defecto (vía
  `create_tenant_with_owner`).
- RF-02: invitar agentes por email (flujo de invitación con token, aún por
  construir en el backend).
- RF-03: aislamiento estricto de datos por tenant (RLS + validación en
  backend).

**Propiedades**
- RF-04: CRUD de propiedades con fotos.
- RF-05: filtros por estatus, tipo, sector, agente asignado.

**Contactos**
- RF-06: CRUD de contactos.
- RF-07: asignación de contacto a agente.

**Pipeline**
- RF-08: mover negociaciones entre etapas configurables.
- RF-09: historial de cambios de etapa (ya resuelto por trigger de base de
  datos — solo hay que mostrarlo en la UI).

**Actividades**
- RF-10: tareas/actividades ligadas a contacto o negociación.

**Facturación SaaS**
- RF-11: mostrar plan y estado de pago del tenant.
- RF-12: restringir funciones si la suscripción está vencida (bloquear
  creación de nuevos registros, nunca ocultar ni borrar los existentes).

**Mensajería (WhatsApp vía Twilio, Instagram, Facebook)**
- RF-13: cada agencia conecta su propia cuenta de WhatsApp Business vía
  Twilio.
- RF-14: bandeja unificada de conversaciones por agente y por agencia.
- RF-15: vincular automáticamente cada conversación entrante a un contacto
  existente (por teléfono, normalizado a formato internacional) o crear uno
  nuevo con `source='whatsapp'`.
- RF-16: al expirar la ventana de servicio de 24 horas, forzar el uso de una
  plantilla aprobada en vez de un mensaje libre.

---

## 7. Casos de uso de referencia (flujos exactos a implementar)

**Lead entra por WhatsApp por primera vez (RF-15):**
1. Twilio recibe el mensaje entrante y lo reenvía al webhook del backend
   (`POST /webhooks/whatsapp`).
2. El backend identifica el `tenant_id` según el número de Twilio que
   recibió el mensaje (columna `channels.external_id`).
3. Busca un `contact` con ese teléfono en ese tenant. Si no existe, lo crea
   con `source='whatsapp'`.
4. Busca una `conversation` abierta para ese `contact` + `channel`. Si no
   existe, la crea.
5. Inserta el `message` (dirección `entrante`). El trigger de la base de
   datos actualiza `conversations.last_message_at` automáticamente — no lo
   dupliques en el backend.
6. El frontend, suscrito por Supabase Realtime a la tabla `messages` filtrada
   por su `tenant_id`, refleja el mensaje nuevo sin recargar la página.

**Mover una negociación de etapa (RF-08/RF-09):**
1. El agente arrastra la tarjeta del kanban a otra columna.
2. El frontend hace un `UPDATE` sobre `deals.stage_id`.
3. El trigger `log_deal_stage_change` inserta automáticamente el registro en
   `deal_stage_history` — el frontend no debe insertar ahí directamente.

---

## 8. Integración de mensajería — detalles de Twilio

- Proveedor decidido: **Twilio** (WhatsApp Business Platform vía Twilio, no
  directo con Meta, no 360dialog). Razón: con el volumen esperado por agencia
  en las primeras fases, el costo variable de Twilio ($0.005/mensaje + tarifa
  de plantilla de Meta) resulta más barato que la cuota fija mensual de
  360dialog; el punto de equilibrio está alrededor de ~9,800 mensajes/mes por
  número, volumen que una agencia individual no alcanza en el corto plazo.
- Cada agencia (tenant) necesita su propio **Sender/número de WhatsApp**
  dentro de la cuenta de Twilio del proyecto. Modela esto en la tabla
  `channels` (ya existe): `channels.external_id` guarda el Sender SID de
  Twilio.
- El campo `channels.provider` ya tiene `'bsp_twilio'` como valor por
  defecto, pero es un campo de texto libre — no lo conviertas a un enum
  cerrado, para no tener que rediseñar el esquema si en el futuro se agrega
  otro proveedor para agencias de alto volumen.
- El backend necesita endpoints para: conectar un número (flujo de
  onboarding del canal), recibir webhooks entrantes, y enviar mensajes
  (texto libre dentro de la ventana de 24h, o plantilla fuera de ella).
- No implementes todavía el flujo completo de "Embedded Signup"/Tech
  Provider — ese registro se hace fuera del código, directamente en la
  consola de Twilio/Meta. Para desarrollo, usa el sandbox de WhatsApp de
  Twilio.

---

## 9. Reglas de diseño (estrictas)

1. **No te salgas del sistema de diseño de UBold (Bootstrap 5).** Todo
   componente nuevo se construye combinando los componentes ya existentes en
   `src/components/` (incluyendo `src/components/wrappers/`) y reutilizando
   el patrón de las vistas ya adaptadas en
   `src/views/admin/apps/crm-inmobiliario/`. No instales librerías de UI
   alternativas (ni siquiera "solo para un componente") — nada de Material
   UI, Ant Design, Tailwind, ni CSS-in-JS.
2. Sigue el patrón de layout ya establecido: cada pantalla vive dentro de
   `MainLayout` (ver `src/routes/index.tsx`), con `PageBreadcrumb` al inicio
   de cada página, igual que las vistas ya adaptadas.
3. Todo el texto de la interfaz debe estar en **español**.
4. Los nombres de tablas/columnas en el código (variables, tipos) pueden
   estar en inglés si es más natural para el código, pero cualquier texto
   visible al usuario va en español.
5. Los íconos se usan a través del wrapper `Icon` (`src/components/wrappers/Icon.tsx`),
   que antepone el prefijo `lucide:` automáticamente — usa nombres de
   [Lucide](https://lucide.dev/icons) en minúsculas con guiones (ej.
   `icon="bed-double"`, no `icon="lucide:bed-double"`).

---

## 10. Qué NO construir todavía (fuera de alcance del MVP)

No implementes nada de lo siguiente salvo que se te pida explícitamente:

- Chatbot o respuestas automáticas con IA en WhatsApp.
- Integraciones con portales inmobiliarios externos (Supercasas, Encuentra24,
  etc.).
- Aplicación móvil nativa (solo web responsive).
- Reportes/analítica avanzada más allá de los KPIs básicos del dashboard.
- Soporte multi-idioma (interfaz solo en español).
- Firma electrónica de documentos.
- Conversión automática de múltiples monedas en reportes.
- El flujo completo de Tech Provider/Embedded Signup de Meta (eso se
  resuelve fuera del código).

---

## 11. Orden de trabajo sugerido

**Fase 0 — Migración (backend ya existe, frontend es nuevo)**
1. Inspeccionar el backend existente: rutas reales, forma de las respuestas,
   cómo maneja auth/tenant hoy (ver sección 0).
2. Reemplazar la carpeta del frontend anterior (Soft UI) por el contenido de
   `crm-frontend-ubold.zip`.
3. Configurar variables de entorno del nuevo frontend (sección 12) para que
   apunten al backend y proyecto Supabase **ya existentes** (no crear un
   proyecto Supabase nuevo).
4. Conectar `useAuth.ts` (hoy un mock) al flujo de auth real que el backend
   ya expone — no reinventar el flujo de login si el backend ya tiene uno
   funcionando.
5. Verificar que cada una de las 4 pantallas migradas (Contactos,
   Propiedades, Negociaciones, Mensajes) pueda al menos listar datos reales
   del backend existente antes de seguir. Si algún endpoint que la pantalla
   necesita no existe todavía, créalo de forma aditiva (sección 0, paso 4).

**Fase 1 — Paridad funcional completa**
6. Contactos, Propiedades, Actividades — CRUD completo conectado al backend
   real (crear/editar/eliminar, no solo listar).
7. Negociaciones — confirmar que mover una tarjeta en el kanban persiste el
   cambio de etapa contra el endpoint real de `deals`.

**Fase 2 — Lo que falte del backend (si aplica)**
8. Si el backend anterior no llegó a construir el flujo de invitación de
   agentes (RF-02), la conexión de WhatsApp vía Twilio (sección 8), o la
   integración de Stripe, constrúyelos ahora — de forma aditiva, sin tocar
   lo que ya funciona.

**Fase 3 — Pulido**
9. Dashboard con KPIs reales.
10. Manejo de errores, estados de carga, validaciones de formularios en toda
    la app.

Empieza siempre confirmando en qué fase estás antes de escribir código, y no
avances a la siguiente fase sin que la anterior esté funcional. Si en algún
punto no es obvio si algo "ya existe en el backend" o "hay que construirlo
desde cero", verifica primero — no lo des por hecho en ninguna dirección.

---

## 12. Variables de entorno necesarias (dejar como placeholders documentados)

Este proyecto usa **Vite**, no Create React App: las variables de entorno del
frontend se acceden con `import.meta.env.VITE_*`, no con `process.env.REACT_APP_*`,
y van en un archivo `.env` en la raíz de `crm-frontend/`.

```
# Frontend
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=               # URL del backend Node.js

# Backend
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=       # Nunca exponer al frontend
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=          # o Sender SID, según el flujo de Twilio usado
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## 13. Definición de "hecho" (Definition of Done) para cada tarea

Antes de dar por terminada cualquier tarea de este prompt, verifica que:

- [ ] El código compila (`npm run build` en el frontend, arranque limpio del
      backend).
- [ ] Ninguna query del backend omite el filtro de `tenant_id`.
- [ ] La pantalla nueva usa exclusivamente componentes ya existentes del
      template (no se agregaron dependencias de UI nuevas).
- [ ] Los textos visibles están en español.
- [ ] Si la tarea toca la tabla `deals`, no se duplica en el frontend la
      inserción en `deal_stage_history` (ya la hace el trigger).
- [ ] Si la tarea toca mensajería, el número/canal usado es Twilio, no otro
      proveedor.
- [ ] No se modificó ni eliminó ningún endpoint, ruta o respuesta del
      backend existente que otra parte del sistema ya consumía — cualquier
      cambio de backend fue aditivo (sección 0).

---

*Este prompt refleja el estado del proyecto documentado en `CRM_Inmobiliario_ERS.md`
(v0.4). Si hay una contradicción entre ambos documentos, este prompt prioriza
lo accionable para desarrollo; el ERS tiene el razonamiento completo detrás de
cada decisión (modelo de negocio, simulación de costos de Twilio vs.
360dialog, registro de riesgos, casos de uso adicionales, y el motivo del
cambio de frontend de Soft UI Dashboard React a UBold).*
