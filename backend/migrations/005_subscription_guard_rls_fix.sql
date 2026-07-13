-- Corrige 004_subscription_guard.sql: el trigger original intentaba eximir
-- los inserts del backend (service_role) comprobando que
-- `request.jwt.claims` fuera null, asumiendo que ese cliente no pasa por
-- PostgREST. Eso es falso: `supabaseAdmin` (backend/src/lib/supabaseAdmin.js)
-- es un cliente supabase-js normal que sí pasa por PostgREST, solo que
-- autenticado con el JWT de service_role — PostgREST igual setea
-- `request.jwt.claims` para ese JWT, así que la condición nunca eximía nada
-- y el trigger bloqueaba también los inserts del backend (ej. la
-- autocreación de contactos por un mensaje de WhatsApp entrante, que
-- terminaba fallando en silencio para tenants suspendidos).
--
-- La forma correcta de expresar "solo restringe a usuarios finales, nunca al
-- backend" en Supabase es RLS, no un trigger: `service_role` tiene el
-- atributo BYPASSRLS a nivel de Postgres, así que cualquier política RLS
-- —sin importar cómo esté escrita— ya se salta automáticamente para el
-- backend. Se reemplaza el trigger por políticas RESTRICTIVE de INSERT
-- (se combinan con AND sobre las políticas PERMISSIVE existentes de
-- aislamiento por tenant, en vez de reemplazarlas).
drop trigger if exists trg_contacts_block_if_suspended on contacts;
drop trigger if exists trg_properties_block_if_suspended on properties;
drop trigger if exists trg_deals_block_if_suspended on deals;
drop function if exists block_insert_if_tenant_suspended();

create policy block_insert_if_tenant_suspended_contacts on contacts
  as restrictive
  for insert
  with check ((select status from tenants where id = tenant_id) <> 'suspendido');

create policy block_insert_if_tenant_suspended_properties on properties
  as restrictive
  for insert
  with check ((select status from tenants where id = tenant_id) <> 'suspendido');

create policy block_insert_if_tenant_suspended_deals on deals
  as restrictive
  for insert
  with check ((select status from tenants where id = tenant_id) <> 'suspendido');
