# Vipe CRM — CRM Inmobiliario SaaS

CRM multi-tenant para agencias inmobiliarias. Cada agencia (*tenant*) gestiona
sus propios contactos, propiedades y negociaciones, con una bandeja unificada
de mensajería (WhatsApp vía Twilio, en construcción) como diferenciador
principal.

El contexto de negocio completo, las decisiones de arquitectura y el plan de
trabajo detallado viven en [`docs/CRM_PROMPT.md`](docs/CRM_PROMPT.md) — este
README es un resumen operativo para arrancar el proyecto y ubicarse rápido.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript + Vite, template **UBold** (Bootstrap 5.3 + `react-bootstrap`) |
| Backend | Node.js + Express (CommonJS) |
| Base de datos / Auth / Storage | Supabase (Postgres + Row-Level Security + Supabase Auth + Supabase Storage) |
| Mensajería WhatsApp | Twilio (WhatsApp Business Platform) — pendiente de implementar |
| Pagos / suscripción | Stripe — pendiente de implementar |
| Hosting previsto | Frontend en Vercel, backend en Railway (sin configurar aún) |

No se usan librerías de UI alternativas (nada de Material UI, Ant Design,
Tailwind): todo componente nuevo se construye con `react-bootstrap` y los
wrappers del template en `frontend/src/components/`.

---

## Estructura del repo

```
.
├── frontend/                  React + Vite
│   └── src/views/admin/apps/crm-inmobiliario/
│       ├── contacts/          Contactos (listado, detalle, CRUD)
│       ├── properties/        Propiedades (listado, formulario con fotos)
│       ├── deals/              Negociaciones (kanban/pipeline, detalle)
│       ├── inbox/              Bandeja de mensajes (WhatsApp/IG/Messenger)
│       └── components/         Compartido entre pantallas (ActivityFormModal, etc.)
├── backend/                    Node.js + Express
│   ├── src/routes/             auth.js, invitations.js
│   ├── src/lib/                supabaseAdmin.js (cliente service_role), profiles.js
│   ├── src/middleware/         requireAuth.js
│   └── migrations/             SQL incremental sobre crm_schema.sql (ver abajo)
├── crm_schema.sql              Diseño original del esquema (tablas, enums, RLS, triggers)
└── docs/
    ├── CRM_PROMPT.md           Especificación funcional y de arquitectura completa
    └── CRM_Inmobiliario_ERS.md ERS con el razonamiento de negocio detrás de cada decisión
```

---

## Arquitectura multi-tenant

- Esquema compartido: cada tabla de negocio tiene `tenant_id` + políticas RLS
  de Postgres que aíslan los datos por agencia.
- El backend usa la `service_role` key de Supabase (no sujeta a RLS), así que
  **toda query del backend filtra explícitamente por `tenant_id`** además de
  la protección de RLS.
- El frontend consulta Supabase **directo** (vía `supabase-js` con la
  `anon` key) para contactos/propiedades/negociaciones/mensajes, protegido
  por RLS — el backend Express no media esas operaciones (ver sección
  "Estado del proyecto" para el porqué).
- Roles por tenant: `owner`, `admin`, `agent` (enum `membership_role`). Para
  el MVP, todos los agentes de un tenant ven todos los datos del tenant.
- Función `current_tenant_id()` (Postgres): resuelve el tenant del usuario
  autenticado a partir de `memberships`. Se usa en todas las políticas RLS.

---

## Modelo de datos

Definido en [`crm_schema.sql`](crm_schema.sql):

`tenants`, `memberships`, `pipeline_stages`, `contacts`, `properties`,
`property_images`, `deals`, `deal_stage_history`, `activities`, `documents`,
`channels`, `conversations`, `messages`, `subscriptions`, más `profiles` e
`invitations` (agregadas en `backend/migrations/003`).

Triggers relevantes: `updated_at` automático, historial de cambio de etapa
del pipeline (`deal_stage_history`, vía `log_deal_stage_change`) y
actualización de `conversations.last_message_at` al llegar un mensaje.

**El esquema real en Supabase puede no coincidir 100% con `crm_schema.sql`**
— las migraciones incrementales en `backend/migrations/` no se aplican
automáticamente (no hay Supabase CLI ni runner configurado en este repo).
Antes de asumir que algo existe en la base de datos, verifícalo en el
dashboard de Supabase (Table Editor / SQL Editor).

### Migraciones pendientes de aplicar manualmente

| Archivo | Qué hace |
|---|---|
| `001_unique_membership_per_user.sql` | Restricción única `memberships.user_id` (evita duplicados por condición de carrera en el signup) |
| `002_property_images_storage.sql` | Políticas RLS de `storage.objects` para el bucket `property-images` (insert/update/delete por tenant) |
| `003_invitations_and_profiles.sql` | Tablas `profiles` (perfil público mínimo por usuario) e `invitations` (invitación de agentes con token) |
| `004_subscription_guard.sql` | Trigger que bloquea `INSERT` en `contacts`/`properties`/`deals` cuando `tenants.status = 'suspendido'` (RF-12) |

Para aplicar una migración: Supabase Dashboard → **SQL Editor** → pegar el
contenido del archivo → **Run**.

**Verificado en 2026-07-12: las tablas `profiles` e `invitations` (migración
003) todavía NO existen en la base de datos real** — `PostgREST` responde
"Could not find the table". Esto significa que el flujo de invitaciones
(incluso las partes que ya estaban en el código antes de esta sesión, como
`GET /invitations/:token`) no puede funcionar todavía. Aplica **001, 002, 003
y 004 en orden** antes de probar cualquier cosa relacionada a invitaciones o
facturación.

---

## Cómo levantar el proyecto en local

### Requisitos
- Node.js 18+
- Un proyecto de Supabase ya creado (no lo crees de cero — usa el existente)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # completar con los valores reales
npm run dev             # http://localhost:4001
```

Variables de entorno (`backend/.env`):

```
PORT=4001
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=   # nunca exponer al frontend
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # completar con los valores reales
npm run dev             # http://localhost:5173
```

Variables de entorno (`frontend/.env`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=      # URL del backend, ej. http://localhost:4001
```

### Otros comandos útiles

```bash
npm run build    # frontend: build de producción (Vite)
npm run lint      # frontend: ESLint
```

---

## Pantallas y rutas (frontend)

| Ruta | Pantalla |
|---|---|
| `/dashboard` | Dashboard (KPIs — aún con datos de ejemplo del template, pendiente) |
| `/crm/contactos`, `/crm/contactos/:id` | Contactos — listado y detalle (actividades + conversaciones) |
| `/crm/propiedades`, `/crm/propiedades/nueva`, `/crm/propiedades/:id/editar` | Propiedades — listado y formulario con carga de fotos a Supabase Storage |
| `/crm/negociaciones`, `/crm/negociaciones/:id` | Negociaciones — kanban por etapa y detalle (historial de etapa + actividades) |
| `/crm/mensajes` | Bandeja unificada (lectura + Supabase Realtime; envío pendiente de Twilio) |
| `/equipo` | Gestión de equipo / invitación de agentes |
| `/auth/sign-in`, `/auth/sign-up` | Autenticación (Supabase Auth real) |

## Endpoints del backend

| Endpoint | Descripción |
|---|---|
| `GET /health` | Health check |
| `POST /auth/complete-signup` | Crea tenant + owner (`create_tenant_with_owner`) al completar el signup de una agencia nueva |
| `GET /invitations/:token` | Previsualización pública de una invitación |
| `POST /invitations/:token/accept` | Acepta una invitación y crea la membership |

El resto de las operaciones (contactos, propiedades, negociaciones,
actividades) se resuelven **directo desde el frontend contra Supabase**, no
a través de este backend — no hay endpoints REST para esos recursos.

---

## Estado del proyecto

Este proyecto sigue el plan de fases de [`docs/CRM_PROMPT.md`](docs/CRM_PROMPT.md#11-orden-de-trabajo-sugerido).

- ✅ **Fase 0 (migración de frontend)** — completa. Frontend UBold conectado
  a Supabase Auth real y al backend existente; las 4 pantallas migradas
  listan datos reales.
- ✅ **Fase 1 (paridad funcional)** — completa. CRUD real de contactos,
  propiedades (con fotos), negociaciones y etapas del pipeline; historial de
  etapa y actividades visibles en el detalle de cada negociación.
- ⏳ **Fase 2 (backend faltante)** — pendiente:
  - Invitación de agentes: el backend valida/acepta tokens, pero no hay
    endpoint que **cree** la invitación ni envío real de email — el flujo no
    está completo de punta a punta todavía.
  - **Twilio/WhatsApp**: no implementado (sin webhook, sin SDK, sin envío de
    mensajes). La UI de Mensajes ya tiene el punto de conexión listo.
  - **Stripe/Facturación**: no implementado (sin SDK, sin endpoints, sin
    vista de Perfil/Facturación en el frontend).
- ⏳ **Fase 3 (pulido)** — pendiente: Dashboard con KPIs reales (sigue con
  datos de ejemplo del template de ecommerce), manejo de errores/estados de
  carga más consistente en toda la app.

### Nota de arquitectura a tener en cuenta

El backend Express nunca llegó a exponer endpoints para
contactos/propiedades/negociaciones/actividades — el frontend los consulta
directo contra Supabase vía RLS. Funciona y respeta el aislamiento por
tenant, pero si en algún momento se necesita lógica de negocio server-side
(por ejemplo, bloquear creación de registros por suscripción vencida, RF-12),
esa lógica tendría que migrarse al backend en ese momento.

---

## Convenciones del proyecto

- Todo el texto visible en la interfaz va en **español**; nombres de
  variables/tablas pueden estar en inglés.
- Los íconos se usan vía el wrapper `Icon` (`frontend/src/components/wrappers/Icon.tsx`),
  con nombres de [Lucide](https://lucide.dev/icons) en minúsculas con
  guiones (ej. `icon="bed-double"`).
- Ninguna query del backend debe omitir el filtro explícito por `tenant_id`,
  incluso cuando RLS ya protege la tabla.
- Si una pantalla toca la tabla `deals`, no se debe duplicar en el frontend
  la inserción en `deal_stage_history` — el trigger de base de datos ya lo
  hace.
