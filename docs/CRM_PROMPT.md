# Prompt para Claude Code — Construcción del CRM Inmobiliario

> **Cómo usar este archivo:** colócalo en la raíz del repo junto con `crm_schema.sql`
> y el contenido ya descomprimido de `soft-ui-dashboard-react-crm-base.zip` (el
> frontend ya limpiado). Luego dile a Claude Code: *"Lee CRM_PROMPT.md y
> constrúyeme el proyecto siguiendo esas instrucciones, empezando por la Fase 0"*.
> Este documento es autosuficiente: contiene todo el contexto de negocio,
> arquitectura, modelo de datos y decisiones ya tomadas para no tener que
> repetirlas en el chat.

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

> **Actualización (2026-07-10):** el frontend original (Soft UI Dashboard
> React + MUI) fue reemplazado por decisión explícita del dueño del proyecto
> por **MaterialM (React + Tailwind, versión gratuita de WrapPixel)**. La
> carpeta `soft-ui-dashboard-react/` ya no existe en el repo; el frontend
> vive ahora en `frontend/`. El resto de las decisiones de esta tabla
> (backend, base de datos, mensajería) no cambiaron.

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite, template **MaterialM** (versión gratuita de WrapPixel: `wrappixel/materialm-react-tailwind-free`), en `frontend/` | Sistema de diseño: **Tailwind CSS 4** + primitivos **shadcn/ui** (`src/components/ui/*`) + iconos **Iconify** (set `solar:*`, componente `<Icon icon="solar:..." />`). **No introduzcas otra librería de UI ni cambies el sistema de diseño existente.** Todo componente nuevo se construye componiendo los primitivos de `src/components/ui/`, `src/components/shared/` (`CardBox`, etc.) y los layouts de `src/layouts/full/`. **Importante:** el dashboard "CRM" del demo público de MaterialM (`materialm-react-tailwind-main.netlify.app/dashboards/crm`) es una vista **exclusiva de la versión Pro de pago** — no está en el código fuente disponible. El Dashboard de este proyecto (`src/views/dashboards/Dashboard.tsx`) es una construcción propia con la misma estética Material Design 3, usando componentes de la versión gratuita, con KPIs reales conectados a Supabase (no es un calco del demo). |
| Backend | Node.js + Express, en `backend/` | Capa de lógica de negocio, validación multi-tenant de segunda capa, webhooks de Twilio, integración de pagos. |
| Base de datos / Auth / Storage | Supabase (Postgres) | El esquema completo ya existe en `crm_schema.sql` — aplícalo tal cual contra el proyecto Supabase antes de escribir ninguna query. No lo regeneres desde cero. |
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

**No lo regeneres.** El archivo `crm_schema.sql` en la raíz del repo ya
contiene, listo para aplicar en el SQL Editor de Supabase:

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

Antes de escribir cualquier query, lee el archivo completo para entender los
nombres exactos de columnas y relaciones.

---

## 5. Pantallas a construir

El frontend vive en `frontend/src/views/`. Cada pantalla usa el layout
`FullLayout` (sidebar + header, en `src/layouts/full/`) vía las rutas
protegidas definidas en `src/routes/Router.tsx` (envueltas en
`ProtectedRoute`, que exige sesión de Supabase). El menú del sidebar está en
`src/layouts/full/sidebar/Sidebaritems.ts`.

| Pantalla | Carpeta | Estado / Qué debe hacer |
|---|---|---|
| Dashboard | `views/dashboards/Dashboard.tsx` | **Ya construido con datos reales**: 4 KPIs (leads últimos 7 días, propiedades activas, negociaciones abiertas, actividades pendientes), tabla de negociaciones por etapa y línea de tiempo de próximas actividades — todo consultado directo a Supabase filtrado por `tenant_id`. |
| Contactos | `views/contacts/Contacts.tsx` | Placeholder ("Próximamente"). Construir: listado con `Table` de `src/components/ui/table.tsx`, columnas nombre/teléfono/tipo/origen/agente, filtros, vista de detalle con historial. |
| Propiedades | `views/properties/Properties.tsx` | Placeholder. Construir: listado con fotos, filtros por estatus/tipo/sector/agente, formulario con carga a Supabase Storage, detalle con galería. |
| Negociaciones | `views/deals/Deals.tsx` | Placeholder. Construir: vista kanban por `pipeline_stages`, tarjetas arrastrables. El trigger de la base de datos ya registra el historial de cambio de etapa — no dupliques esa lógica en el frontend. |
| Mensajes (bandeja unificada) | `views/inbox/Inbox.tsx` | Placeholder. Construir: lista de conversaciones por `last_message_at`, filtrable por canal/agente, vista de conversación tipo chat, tiempo real vía Supabase Realtime. |
| Perfil | `views/profile/Profile.tsx` | **Ya construido**: muestra nombre, email, agencia y rol reales del usuario autenticado (vía `useAuth()`). |
| Facturación | `views/billing/Billing.tsx` | **Ya construido**: muestra plan y estado reales desde la tabla `subscriptions`. Falta RF-12 (restringir acciones si la suscripción está vencida). |
| Autenticación | `views/auth/login/Login.tsx` y `views/auth/register/Register.tsx` (+ `authforms/AuthLogin.tsx`, `authforms/AuthRegister.tsx`) | **Ya construido**: login real y signup con flujo "crear agencia nueva" (llama a `create_tenant_with_owner` vía backend, con manejo de confirmación de email pendiente). El flujo de "aceptar invitación" (RF-02) aún no existe — constrúyelo como parte de esa tarea. |

**No agregues páginas fuera de esta lista sin que se te pida.** El template
trae muchísimas vistas de demostración (`ui-components`, `charts`, `apps`,
etc.) que son exclusivas de la versión Pro de pago — ya fueron eliminadas de
este repo intencionalmente (código y entradas del sidebar). No las vuelvas a
agregar ni reintroduzcas el marketing de WrapPixel (topbar, links "Get Pro",
"Check Pro Template") que también se eliminó.

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

1. **No te salgas del sistema de diseño MaterialM (Tailwind + shadcn).** Todo
   componente nuevo se construye combinando los primitivos ya existentes en
   `frontend/src/components/ui/`, `frontend/src/components/shared/` y los
   componentes de `frontend/src/layouts/full/`. No instales librerías de UI
   alternativas (ni siquiera "solo para un componente"), y no uses
   componentes de la versión Pro de MaterialM (no están en este repo).
2. Sigue el patrón de layout ya establecido: cada pantalla protegida cuelga
   de `FullLayout` (sidebar + header) vía las rutas en `src/routes/Router.tsx`.
3. Todo el texto de la interfaz debe estar en **español**.
4. Los nombres de tablas/columnas en el código (variables, tipos) pueden
   estar en inglés si es más natural para el código, pero cualquier texto
   visible al usuario va en español.

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

**Fase 0 — Setup ✅ completa**
1. ✅ Aplicar `crm_schema.sql` en un proyecto Supabase nuevo.
2. ✅ Configurar variables de entorno (ver sección 12) en frontend y backend.
3. ✅ Conectar el frontend a Supabase Auth (login/signup reales, incluyendo
   creación de tenant vía `create_tenant_with_owner` y manejo del caso de
   confirmación de email pendiente).

**Fase 1 — CRUD interno (un solo tenant real)**
4. Contactos, Propiedades, Actividades — CRUD completo.
5. Negociaciones — vista kanban conectada a `pipeline_stages` y `deals`.

**Fase 2 — Multi-tenant real + mensajería**
6. Flujo de invitación de agentes (RF-02).
7. Conexión de WhatsApp por tenant vía Twilio + webhook + bandeja unificada.
8. Integración de pagos (Stripe) y estados de `subscriptions`.

**Fase 3 — Pulido**
9. ✅ Dashboard con KPIs reales — se adelantó durante la migración del
   frontend a MaterialM (ver sección 5).
10. Manejo de errores, estados de carga, validaciones de formularios en toda
    la app.

Empieza siempre confirmando en qué fase estás antes de escribir código, y no
avances a la siguiente fase sin que la anterior esté funcional.

---

## 12. Variables de entorno necesarias (dejar como placeholders documentados)

```
# Frontend (frontend/.env — Vite exige el prefijo VITE_, no REACT_APP_)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=               # URL del backend Node.js

# Backend (backend/.env)
PORT=                            # 4000 puede estar ocupado por otra app local; usar 4001 si aplica
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

---

*Este prompt refleja el estado del proyecto documentado en `CRM_Inmobiliario_ERS.md`
(v0.3). Si hay una contradicción entre ambos documentos, este prompt prioriza
lo accionable para desarrollo; el ERS tiene el razonamiento completo detrás de
cada decisión (modelo de negocio, simulación de costos de Twilio vs.
360dialog, registro de riesgos, casos de uso adicionales).*
