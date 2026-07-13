-- El webhook de WhatsApp (backend/src/routes/webhooksWhatsapp.js) hace
-- "select, y si no existe, insert" para autocrear el contacto y la
-- conversación de un mensaje entrante. Sin un constraint único de respaldo,
-- dos requests casi simultáneas de Twilio (reintento, o dos mensajes muy
-- seguidos del mismo número nuevo) pueden pasar el "no existe" antes de que
-- el primer insert confirme, duplicando el contacto y/o la conversación.
--
-- `contacts.phone` es nullable — el constraint único de Postgres ignora los
-- NULL por diseño, así que esto no afecta a los contactos sin teléfono.
alter table contacts
  add constraint contacts_tenant_phone_unique unique (tenant_id, phone);

-- Un contacto puede tener conversaciones cerradas antiguas; el constraint
-- solo aplica a la conversación "abierta" (debe haber como mucho una por
-- contacto+canal a la vez).
create unique index conversations_tenant_channel_contact_open_unique
  on conversations (tenant_id, channel_id, contact_id)
  where status = 'abierta';
