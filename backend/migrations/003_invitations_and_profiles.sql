-- RF-02: invitar agentes por email.
--
-- `profiles`: perfil público mínimo por usuario (nombre/email visibles
-- dentro del propio tenant). Necesaria porque `auth.users` no está expuesto
-- vía PostgREST — sin esto no hay forma de mostrar quién es cada agente en
-- la UI. La llena el backend (service_role) en los dos puntos donde ya se
-- crea una membership: /auth/complete-signup y /invitations/:token/accept.
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  full_name   text,
  email       text not null,
  created_at  timestamptz not null default now()
);

alter table profiles enable row level security;

create policy tenant_isolation_profiles on profiles
  for select using (tenant_id = current_tenant_id());

comment on table profiles is 'Perfil público mínimo (nombre/email) por usuario, poblado por el backend al crear su membership. Solo lectura desde el frontend.';

-- `invitations`: token de invitación a un tenant existente, con rol
-- predefinido. El frontend (owner/admin) crea/lista/revoca directo contra
-- Supabase, protegido por current_user_role(). La validación pública del
-- token y su aceptación pasan por el backend (service_role) porque un
-- usuario que todavía no tiene membership no tiene current_tenant_id().
create table invitations (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  email        text not null,
  role         membership_role not null default 'agent',
  token        uuid not null unique default gen_random_uuid(),
  invited_by   uuid references auth.users(id),
  expires_at   timestamptz not null default (now() + interval '7 days'),
  accepted_at  timestamptz,
  created_at   timestamptz not null default now()
);

alter table invitations enable row level security;

create policy tenant_isolation_invitations on invitations
  for all using (tenant_id = current_tenant_id() and current_user_role() in ('owner', 'admin'))
  with check (tenant_id = current_tenant_id() and current_user_role() in ('owner', 'admin'));

create index idx_invitations_tenant on invitations(tenant_id);
create index idx_invitations_token on invitations(token);
