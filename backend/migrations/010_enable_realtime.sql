-- El frontend ya está suscrito a cambios en `messages` vía Supabase Realtime
-- (frontend/src/views/admin/apps/crm-inmobiliario/inbox/components/useMessages.ts),
-- pero las tablas no se agregan a la publicación de Realtime por defecto al
-- crearlas — sin esto, Postgres nunca notifica al cliente de los inserts
-- nuevos y el usuario tiene que recargar la página para ver un mensaje que
-- acaba de llegar. Verificado en vivo: la suscripción se conecta
-- (status "SUBSCRIBED") pero nunca recibe el evento INSERT.
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;
