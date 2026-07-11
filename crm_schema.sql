-- ============================================================================
-- CRM Inmobiliario — Esquema de base de datos (Supabase / PostgreSQL)
-- ============================================================================
-- Estrategia multi-tenant: schema compartido + columna tenant_id + Row-Level
-- Security (RLS). Ver sección 4 y 5 del documento CRM_Inmobiliario_ERS.md.
--
-- Cómo leer este archivo:
--   1. Extensiones y tipos (enums)
--   2. Tablas núcleo del tenant (tenants, memberships)
--   3. Función helper para RLS (current_tenant_id)
--   4. Tablas de negocio (contacts, properties, deals, activities, documents)
--   5. Tablas de mensajería (channels, conversations, messages)
--   6. Tabla de facturación SaaS (subscriptions)
--   7. Políticas RLS aplicadas a cada tabla
--   8. Índices
-- ============================================================================


-- ============================================================================
-- 1. EXTENSIONES Y TIPOS
-- ============================================================================

create extension if not exists "pgcrypto";
-- Necesaria para gen_random_uuid(). Supabase suele traerla habilitada por defecto.

create type membership_role as enum ('owner', 'admin', 'agent');

create type property_type as enum ('venta', 'alquiler');
create type property_status as enum ('disponible', 'reservada', 'vendida', 'alquilada');

create type contact_type as enum ('comprador', 'vendedor', 'arrendatario');
create type contact_source as enum ('web', 'referido', 'portal', 'whatsapp', 'instagram', 'facebook', 'walk_in', 'otro');

create type activity_type as enum ('llamada', 'visita', 'email', 'whatsapp', 'tarea_general');
create type activity_status as enum ('pendiente', 'completada', 'cancelada');

create type channel_type as enum ('whatsapp', 'instagram', 'messenger');
create type channel_status as enum ('conectando', 'activo', 'desconectado', 'error');

create type conversation_status as enum ('abierta', 'cerrada');
create type message_direction as enum ('entrante', 'saliente');
create type message_type as enum ('texto', 'imagen', 'documento', 'plantilla', 'audio', 'ubicacion');
create type message_delivery_status as enum ('enviado', 'entregado', 'leido', 'fallido');

create type subscription_status as enum ('trial', 'activa', 'vencida', 'cancelada');


-- ============================================================================
-- 2. TABLAS NÚCLEO DEL TENANT
-- ============================================================================

create table tenants (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  plan         text not null default 'starter',   -- 'starter' | 'pro' | 'agencia' (ver sección 2 del ERS)
  status       text not null default 'activo',    -- 'activo' | 'suspendido'
  created_at  timestamptz not null default now()
);

comment on table tenants is 'Cada fila = una inmobiliaria cliente (unidad de facturación del SaaS).';

-- Vincula usuarios de Supabase Auth (auth.users) a un tenant y un rol.
create table memberships (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         membership_role not null default 'agent',
  created_at  timestamptz not null default now(),
  unique (tenant_id, user_id)
);

comment on table memberships is 'Relación usuario <-> tenant. Un usuario pertenece a un tenant (modelo simple; si en el futuro un usuario necesita pertenecer a varios tenants, esta tabla ya lo soporta sin cambios).';


-- ============================================================================
-- 3. FUNCIÓN HELPER PARA RLS
-- ============================================================================
-- SECURITY DEFINER: evita recursión infinita al consultar "memberships" desde
-- las políticas RLS de las demás tablas (si no, la política de "memberships"
-- se volvería a evaluar a sí misma).

create or replace function current_tenant_id()
returns uuid
language sql
security definer
stable
as $$
  select tenant_id
  from memberships
  where user_id = auth.uid()
  limit 1;
$$;

comment on function current_tenant_id() is 'Devuelve el tenant_id del usuario autenticado actual. Usada en todas las políticas RLS.';

create or replace function current_user_role()
returns membership_role
language sql
security definer
stable
as $$
  select role
  from memberships
  where user_id = auth.uid()
  limit 1;
$$;


-- ============================================================================
-- 4. TABLAS DE NEGOCIO
-- ============================================================================

create table pipeline_stages (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  name         text not null,
  sort_order   integer not null default 0,
  created_at  timestamptz not null default now()
);

comment on table pipeline_stages is 'Etapas del pipeline de negociación, personalizables por agencia (ej. Contacto inicial, Visita, Oferta, Cierre).';

create table contacts (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references tenants(id) on delete cascade,
  name               text not null,
  phone              text,
  email              text,
  type               contact_type,
  source             contact_source not null default 'otro',
  assigned_agent_id  uuid references auth.users(id),
  notes              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table properties (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references tenants(id) on delete cascade,
  title              text not null,
  type               property_type not null,
  status             property_status not null default 'disponible',
  price              numeric(14,2),
  currency           text not null default 'DOP',
  address            text,
  sector             text,
  city               text,
  bedrooms           integer,
  bathrooms          integer,
  area_m2            numeric(10,2),
  assigned_agent_id  uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table property_images (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  property_id   uuid not null references properties(id) on delete cascade,
  url           text not null,
  sort_order    integer not null default 0,
  created_at   timestamptz not null default now()
);

create table deals (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references tenants(id) on delete cascade,
  contact_id            uuid not null references contacts(id) on delete cascade,
  property_id           uuid references properties(id) on delete set null,
  stage_id              uuid not null references pipeline_stages(id),
  value_estimate        numeric(14,2),
  expected_close_date   date,
  assigned_agent_id     uuid references auth.users(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table deals is 'Negociación: vincula un contacto con una propiedad de interés y su avance en el pipeline.';

-- Historial de cambios de etapa, para auditoría del pipeline (RNF de sección 7.3 / RF-09 del ERS).
create table deal_stage_history (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  deal_id       uuid not null references deals(id) on delete cascade,
  from_stage_id uuid references pipeline_stages(id),
  to_stage_id   uuid not null references pipeline_stages(id),
  changed_by    uuid references auth.users(id),
  changed_at    timestamptz not null default now()
);

create table activities (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  deal_id       uuid references deals(id) on delete cascade,
  contact_id    uuid references contacts(id) on delete cascade,
  type          activity_type not null,
  status        activity_status not null default 'pendiente',
  due_at        timestamptz,
  assigned_to   uuid references auth.users(id),
  notes         text,
  created_at   timestamptz not null default now()
);

comment on table activities is 'Tarea o seguimiento ligado a un contacto y/o negociación (llamada, visita, recordatorio).';

create table documents (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  deal_id       uuid references deals(id) on delete cascade,
  name          text not null,
  storage_url   text not null,
  doc_type      text,   -- 'contrato' | 'cedula' | 'otro' (texto libre, no enum, para flexibilidad)
  uploaded_by   uuid references auth.users(id),
  created_at   timestamptz not null default now()
);


-- ============================================================================
-- 5. MENSAJERÍA OMNICANAL (Meta: WhatsApp / Instagram / Messenger)
-- ============================================================================

create table channels (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references tenants(id) on delete cascade,
  type               channel_type not null,
  provider           text not null default 'bsp_twilio',  -- campo abierto: no acopla el esquema a un solo BSP
  external_id        text,   -- Twilio Sender SID / phone_number_id / page_id, según el tipo
  status             channel_status not null default 'conectando',
  created_at        timestamptz not null default now(),
  unique (tenant_id, type, external_id)
);

create table conversations (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references tenants(id) on delete cascade,
  channel_id         uuid not null references channels(id) on delete cascade,
  contact_id         uuid references contacts(id) on delete set null,
  status             conversation_status not null default 'abierta',
  last_message_at    timestamptz,
  created_at        timestamptz not null default now()
);

comment on table conversations is 'Si un mensaje entrante no coincide con ningún contacto existente (por teléfono), la lógica de aplicación crea el contacto automáticamente (RF-15 del ERS) antes de insertar la conversación.';

create table messages (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references tenants(id) on delete cascade,
  conversation_id    uuid not null references conversations(id) on delete cascade,
  direction          message_direction not null,
  type               message_type not null default 'texto',
  content            text,
  template_name      text,   -- solo aplica si type = 'plantilla'
  sent_by            uuid references auth.users(id),  -- null si el mensaje fue enviado por un bot/automatización
  delivery_status    message_delivery_status,
  external_message_id text,  -- ID del mensaje devuelto por Twilio, útil para reconciliar estados de entrega vía webhook
  created_at        timestamptz not null default now()
);


-- ============================================================================
-- 6. FACTURACIÓN SAAS
-- ============================================================================

create table subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id) on delete cascade unique,
  plan                text not null default 'starter',
  status              subscription_status not null default 'trial',
  stripe_customer_id  text,
  stripe_subscription_id text,
  renews_at           timestamptz,
  created_at         timestamptz not null default now()
);


-- ============================================================================
-- 7. ROW-LEVEL SECURITY
-- ============================================================================
-- Patrón repetido en cada tabla de negocio: habilitar RLS y restringir toda
-- fila a que su tenant_id coincida con el tenant del usuario autenticado.
-- El backend Node.js debe replicar esta misma validación como segunda capa
-- (nunca confiar solo en RLS ni solo en el backend — ver sección 4.2 del ERS).

alter table tenants               enable row level security;
alter table memberships           enable row level security;
alter table pipeline_stages       enable row level security;
alter table contacts              enable row level security;
alter table properties            enable row level security;
alter table property_images       enable row level security;
alter table deals                 enable row level security;
alter table deal_stage_history    enable row level security;
alter table activities            enable row level security;
alter table documents             enable row level security;
alter table channels              enable row level security;
alter table conversations         enable row level security;
alter table messages              enable row level security;
alter table subscriptions         enable row level security;

-- tenants: un usuario solo ve el tenant al que pertenece.
create policy tenant_isolation_tenants on tenants
  for select using (id = current_tenant_id());

-- memberships: un usuario ve solo las membresías de su propio tenant.
create policy tenant_isolation_memberships on memberships
  for select using (tenant_id = current_tenant_id());

-- Política genérica (repetida por tabla porque Postgres no permite políticas
-- "globales" entre tablas): SELECT/INSERT/UPDATE/DELETE restringidos al tenant.

create policy tenant_isolation_pipeline_stages on pipeline_stages
  for all using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create policy tenant_isolation_contacts on contacts
  for all using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create policy tenant_isolation_properties on properties
  for all using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create policy tenant_isolation_property_images on property_images
  for all using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create policy tenant_isolation_deals on deals
  for all using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create policy tenant_isolation_deal_stage_history on deal_stage_history
  for all using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create policy tenant_isolation_activities on activities
  for all using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create policy tenant_isolation_documents on documents
  for all using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create policy tenant_isolation_channels on channels
  for all using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create policy tenant_isolation_conversations on conversations
  for all using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create policy tenant_isolation_messages on messages
  for all using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

-- subscriptions: solo el owner/admin de la agencia debería poder ver/editar
-- su facturación (no un agente cualquiera). Ejemplo de política con rol.
create policy tenant_isolation_subscriptions on subscriptions
  for select using (tenant_id = current_tenant_id());

create policy admin_manage_subscriptions on subscriptions
  for update using (
    tenant_id = current_tenant_id()
    and current_user_role() in ('owner', 'admin')
  )
  with check (
    tenant_id = current_tenant_id()
    and current_user_role() in ('owner', 'admin')
  );

-- Nota: el backend (con la service_role key de Supabase) no está sujeto a RLS
-- por diseño de Supabase — por eso la sección 4.2 del ERS insiste en que el
-- backend Node.js debe validar el tenant_id igualmente antes de escribir.


-- ============================================================================
-- 8. ÍNDICES
-- ============================================================================
-- tenant_id se indexa en cada tabla porque es el filtro más frecuente
-- (tanto por RLS como por las queries normales de la aplicación).

create index idx_memberships_tenant        on memberships(tenant_id);
create index idx_memberships_user          on memberships(user_id);

create index idx_pipeline_stages_tenant    on pipeline_stages(tenant_id);

create index idx_contacts_tenant           on contacts(tenant_id);
create index idx_contacts_phone            on contacts(tenant_id, phone);
create index idx_contacts_assigned_agent   on contacts(assigned_agent_id);

create index idx_properties_tenant         on properties(tenant_id);
create index idx_properties_status         on properties(tenant_id, status);
create index idx_properties_assigned_agent on properties(assigned_agent_id);

create index idx_property_images_property  on property_images(property_id);

create index idx_deals_tenant              on deals(tenant_id);
create index idx_deals_stage               on deals(tenant_id, stage_id);
create index idx_deals_contact             on deals(contact_id);
create index idx_deals_property            on deals(property_id);

create index idx_activities_tenant         on activities(tenant_id);
create index idx_activities_due            on activities(tenant_id, due_at) where status = 'pendiente';
create index idx_activities_assigned       on activities(assigned_to);

create index idx_documents_deal            on documents(deal_id);

create index idx_channels_tenant           on channels(tenant_id);

create index idx_conversations_tenant      on conversations(tenant_id);
create index idx_conversations_contact     on conversations(contact_id);
create index idx_conversations_channel     on conversations(channel_id);

create index idx_messages_conversation     on messages(conversation_id, created_at);
create index idx_messages_tenant           on messages(tenant_id);

create index idx_subscriptions_tenant      on subscriptions(tenant_id);


-- ============================================================================
-- 9. TRIGGERS Y AUTOMATIZACIONES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 9.1 Actualizar updated_at automáticamente
-- ----------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_contacts_updated_at
  before update on contacts
  for each row execute function set_updated_at();

create trigger trg_properties_updated_at
  before update on properties
  for each row execute function set_updated_at();

create trigger trg_deals_updated_at
  before update on deals
  for each row execute function set_updated_at();


-- ----------------------------------------------------------------------------
-- 9.2 Registrar historial de cambios de etapa del pipeline (RF-09 del ERS)
-- ----------------------------------------------------------------------------
-- Dos triggers: uno para la etapa inicial al crear la negociación, y otro
-- para cada cambio posterior de stage_id.

create or replace function log_deal_stage_initial()
returns trigger
language plpgsql
as $$
begin
  insert into deal_stage_history (tenant_id, deal_id, from_stage_id, to_stage_id, changed_by)
  values (new.tenant_id, new.id, null, new.stage_id, auth.uid());
  return new;
end;
$$;

create trigger trg_deals_stage_initial
  after insert on deals
  for each row execute function log_deal_stage_initial();

create or replace function log_deal_stage_change()
returns trigger
language plpgsql
as $$
begin
  if (new.stage_id is distinct from old.stage_id) then
    insert into deal_stage_history (tenant_id, deal_id, from_stage_id, to_stage_id, changed_by)
    values (new.tenant_id, new.id, old.stage_id, new.stage_id, auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_deals_stage_change
  after update on deals
  for each row execute function log_deal_stage_change();


-- ----------------------------------------------------------------------------
-- 9.3 Actualizar conversations.last_message_at al llegar un mensaje nuevo
-- ----------------------------------------------------------------------------
-- Reabre la conversación (status = 'abierta') cada vez que hay actividad
-- nueva, entrante o saliente, para que aparezca arriba en la bandeja unificada.

create or replace function update_conversation_on_new_message()
returns trigger
language plpgsql
as $$
begin
  update conversations
  set last_message_at = new.created_at,
      status = 'abierta'
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger trg_messages_update_conversation
  after insert on messages
  for each row execute function update_conversation_on_new_message();


-- ----------------------------------------------------------------------------
-- 9.4 Creación de un nuevo tenant en el signup (RF-01 del ERS)
-- ----------------------------------------------------------------------------
-- Se expone como función RPC (no como trigger ciego sobre auth.users), porque
-- el backend necesita distinguir entre "esta persona está creando una agencia
-- nueva" vs. "esta persona fue invitada a una agencia existente" — un trigger
-- automático en auth.users no puede hacer esa distinción por sí solo.
--
-- El backend Node.js llama a esta función justo después de que Supabase Auth
-- confirma el registro del usuario, solo en el flujo de "crear agencia nueva".
--
-- SECURITY DEFINER porque el usuario recién registrado todavía no tiene una
-- membership (y por lo tanto current_tenant_id() no serviría de nada aquí).

create or replace function create_tenant_with_owner(
  p_tenant_name text,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_tenant_id uuid;
begin
  insert into tenants (name, plan, status)
  values (p_tenant_name, 'starter', 'activo')
  returning id into v_tenant_id;

  insert into memberships (tenant_id, user_id, role)
  values (v_tenant_id, p_user_id, 'owner');

  -- Etapas de pipeline por defecto, editables luego desde la configuración de la agencia.
  insert into pipeline_stages (tenant_id, name, sort_order) values
    (v_tenant_id, 'Contacto inicial', 1),
    (v_tenant_id, 'Visita agendada', 2),
    (v_tenant_id, 'Oferta', 3),
    (v_tenant_id, 'Cierre', 4);

  insert into subscriptions (tenant_id, plan, status)
  values (v_tenant_id, 'starter', 'trial');

  return v_tenant_id;
end;
$$;

comment on function create_tenant_with_owner(text, uuid) is 'Crea un tenant nuevo con su owner, etapas de pipeline por defecto y suscripción en trial. Llamar desde el backend justo después del signup, solo cuando el usuario elige "crear agencia nueva".';


-- ============================================================================
-- FIN DEL ESQUEMA — v0.2
-- ============================================================================
-- Pendiente para una siguiente iteración:
--   - Función invite_member(tenant_id, email, role) para el flujo de
--     invitación de agentes (RF-02 del ERS) — requiere integrarse con el
--     envío de email desde el backend, no solo con SQL.
--   - Función/lógica para encontrar o crear un contacto automáticamente al
--     recibir un mensaje de un número no registrado (RF-15 del ERS) — vive
--     mejor en el backend Node.js que en un trigger, porque probablemente
--     necesite lógica adicional (normalizar formato de teléfono, etc.).
--   - Políticas RLS específicas para property_images y documents si se
--     requiere restringir por agente asignado, no solo por tenant.
-- ============================================================================

