-- RF-16: fuera de la ventana de servicio de 24h de WhatsApp, no se puede
-- mandar texto libre — hay que usar una plantilla ya aprobada por Meta vía
-- Twilio Content API (contentSid + contentVariables). Esta tabla guarda el
-- catálogo de plantillas que cada agencia ya registró/aprobó en su consola
-- de Twilio, para poder elegirlas desde el inbox sin tener que ir a buscar
-- el Content SID cada vez.
create table whatsapp_templates (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references tenants(id) on delete cascade,
  name               text not null,
  twilio_content_sid text not null,
  variable_labels    text[] not null default '{}',
  created_at        timestamptz not null default now()
);

alter table whatsapp_templates enable row level security;

create policy tenant_isolation_whatsapp_templates on whatsapp_templates
  for all using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create index idx_whatsapp_templates_tenant on whatsapp_templates(tenant_id);
