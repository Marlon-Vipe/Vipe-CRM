-- 007 no cerró el hueco: revocó EXECUTE de PUBLIC, pero Supabase le otorga a
-- cada función nueva en el schema public un GRANT EXECUTE EXPLÍCITO a los
-- roles `anon`/`authenticated`/`service_role` vía
-- `ALTER DEFAULT PRIVILEGES` configurado a nivel de proyecto — ese grant
-- explícito no se revoca solo con "FROM PUBLIC". Se confirmó en vivo:
-- después de aplicar 007, la misma request sin sesión (solo la anon key)
-- seguía pudiendo ejecutar create_tenant_with_owner.
--
-- Esta vez se revoca explícitamente de cada rol que tenía el grant directo.
revoke execute on function create_tenant_with_owner(text, uuid) from anon;
revoke execute on function create_tenant_with_owner(text, uuid) from authenticated;
revoke execute on function create_tenant_with_owner(text, uuid) from public;
grant execute on function create_tenant_with_owner(text, uuid) to service_role;
