-- =====================================================================
-- diagnostico.sql — Rode ISTO no SQL Editor e me mande o resultado.
-- Serve para saber se o outro app do projeto já usava funções/triggers
-- com os mesmos nomes ANTES de aplicarmos a versão public.
-- =====================================================================

-- 1) Triggers atualmente em auth.users (queremos ver se há algum ALÉM do
--    'trg_auth_user_created' que eu criei).
select 'auth_users_triggers' as info, tgname as nome
from pg_trigger
where tgrelid = 'auth.users'::regclass and not tgisinternal;

-- 2) Funções em public com nomes que eu (posso ter) sobrescrito.
select 'public_functions' as info,
       proname as nome,
       pg_get_function_identity_arguments(oid) as args
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('handle_new_user','set_updated_at','is_admin','is_staff','current_user_role');

-- 3) Confirma se o schema links ainda NÃO existe.
select 'schemas' as info, schema_name
from information_schema.schemata
where schema_name in ('links','public');
