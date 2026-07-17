-- Notificaciones reales de la campanita del topbar (antes era un array
-- estático de 7 items de plantilla). Se guardan a nivel de tenant, no por
-- usuario — coincide con el modelo del MVP donde todos los agentes ven todo
-- dentro de su agencia (sección 3 del prompt). El estado "leído" se resuelve
-- comparando `created_at` contra la marca de tiempo de la última vez que el
-- usuario abrió el dropdown (`profiles.notifications_seen_at`), en vez de
-- guardar una fila de estado de lectura por notificación y por usuario.
-- `body` es solo para contenido real que no tiene sentido traducir (ej. el
-- texto de un mensaje de WhatsApp, que son las palabras del cliente, no de
-- la interfaz). El resto del texto descriptivo ("Nuevo lead", "Se unió como
-- agente") se arma en el frontend vía i18n a partir de `type` + `metadata`,
-- para que no quede una notificación vieja en español cuando el usuario ve
-- la app en inglés.
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  type        text not null, -- 'new_message' | 'new_lead' | 'invitation_accepted'
  title       text not null,
  body        text,
  metadata    jsonb not null default '{}',
  link        text,
  created_at  timestamptz not null default now()
);

alter table notifications enable row level security;

create policy tenant_isolation_notifications on notifications
  for select using (tenant_id = current_tenant_id());

create index idx_notifications_tenant_created on notifications(tenant_id, created_at desc);

-- Para que la campanita del topbar se actualice sola sin recargar, igual que
-- messages/conversations (ver migración 010 y la lección de esa vez: sin
-- esto, Postgres nunca le avisa al navegador de un insert nuevo).
alter publication supabase_realtime add table notifications;

alter table profiles add column notifications_seen_at timestamptz;

-- Los agentes pueden actualizar su propia marca de "ya vi las notificaciones"
-- directo desde el frontend (no hace falta pasar por el backend para esto).
-- IMPORTANTE: Supabase le otorga a `authenticated` un GRANT UPDATE amplio
-- (todas las columnas) a cada tabla nueva por defecto vía
-- ALTER DEFAULT PRIVILEGES del proyecto — igual que pasó con el RPC
-- create_tenant_with_owner (ver migración 008). Sin el revoke/grant de
-- abajo, la política de RLS "id = auth.uid()" dejaría que un agente edite
-- CUALQUIER columna de su propia fila de `profiles`, incluyendo
-- `tenant_id`. Se revoca el UPDATE amplio y se otorga solo en la columna
-- que realmente debe ser editable desde el frontend.
revoke update on profiles from authenticated;
grant update (notifications_seen_at) on profiles to authenticated;

create policy self_update_notifications_seen_at on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());
