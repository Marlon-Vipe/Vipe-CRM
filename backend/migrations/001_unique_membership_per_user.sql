-- Evita que un usuario termine con más de un tenant/membership por una
-- condición de carrera en el signup (RF-01). Coherente con el modelo actual
-- documentado en crm_schema.sql: "un usuario pertenece a un tenant".
-- Si en el futuro se soporta multi-tenant por usuario (RF-02 lo podría requerir
-- para invitaciones cross-tenant), esta restricción habría que revisarla.

alter table memberships
  add constraint memberships_user_id_unique unique (user_id);
