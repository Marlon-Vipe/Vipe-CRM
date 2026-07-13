-- RF-12: restringir la creación de nuevos registros cuando la suscripción
-- del tenant está vencida, sin ocultar ni borrar nada existente.
--
-- `tenants.status` ('activo' | 'suspendido') es el campo simple que ya lee
-- el frontend (AuthContext) para mostrar el estado de la cuenta; el webhook
-- de facturación (backend/src/routes/webhooksBilling.js) lo mantiene en
-- sincronía con `subscriptions.status` (el detalle rico: trial/activa/
-- vencida/cancelada) cada vez que el proveedor de pagos notifica un cambio.
--
-- Solo se restringe la creación desde el frontend (requests autenticados vía
-- PostgREST, donde Supabase setea `request.jwt.claims`). Los inserts que
-- hace el backend con la service_role key (ej. autocreación de contactos por
-- un mensaje de WhatsApp entrante) no pasan por PostgREST y no quedan
-- bloqueados — perder leads entrantes por falta de pago sería peor que
-- bloquear la creación manual desde la UI.
create or replace function block_insert_if_tenant_suspended()
returns trigger
language plpgsql
as $$
declare
  tenant_status text;
begin
  if current_setting('request.jwt.claims', true) is null then
    return new;
  end if;

  select status into tenant_status from tenants where id = new.tenant_id;

  if tenant_status = 'suspendido' then
    raise exception 'La suscripción de tu agencia está vencida. Ponla al día para poder crear nuevos registros.';
  end if;

  return new;
end;
$$;

create trigger trg_contacts_block_if_suspended
  before insert on contacts
  for each row execute function block_insert_if_tenant_suspended();

create trigger trg_properties_block_if_suspended
  before insert on properties
  for each row execute function block_insert_if_tenant_suspended();

create trigger trg_deals_block_if_suspended
  before insert on deals
  for each row execute function block_insert_if_tenant_suspended();
