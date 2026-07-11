-- Bucket de Storage para fotos de propiedades (RF-04). El bucket
-- "property-images" ya fue creado como público (lectura pública, para que
-- las URLs de `property_images.url` sirvan directo en <img src>) vía la API
-- de administración de Supabase. Esta migración solo agrega las políticas de
-- `storage.objects` para permitir que un usuario autenticado suba/edite/borre
-- objetos, mientras el primer segmento de la ruta coincida con su propio
-- tenant_id — convención de ruta: `${tenant_id}/${property_id}/${archivo}`.

create policy tenant_isolation_property_images_insert
  on storage.objects for insert
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

create policy tenant_isolation_property_images_update
  on storage.objects for update
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

create policy tenant_isolation_property_images_delete
  on storage.objects for delete
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );
