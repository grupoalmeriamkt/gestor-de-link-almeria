-- =====================================================================
-- rollback_public.sql — Remove os objetos que a versão ANTIGA criou no
-- schema public, para migrarmos ao schema dedicado `links`.
--
-- ⚠️ RODE O `diagnostico.sql` ANTES e confira:
--   * Se em auth.users existir SOMENTE o trigger 'trg_auth_user_created',
--     é seguro rodar tudo abaixo.
--   * Se aparecer OUTRO trigger, ou se as funções handle_new_user /
--     set_updated_at / is_admin / is_staff / current_user_role já existiam
--     para o outro app, NÃO rode a seção B — me avise antes.
--
-- As tabelas estão vazias (recém-criadas), então não há perda de dados.
-- =====================================================================

begin;

-- (A) Trigger que eu criei em auth.users — sempre seguro remover.
drop trigger if exists trg_auth_user_created on auth.users;

-- (A) Minhas tabelas (CASCADE remove FKs, índices e triggers ligados a elas).
drop table if exists
  public.audit_logs,
  public.conversions,
  public.test_runs,
  public.leads,
  public.events,
  public.clicks,
  public.sessions,
  public.link_versions,
  public.tracked_links,
  public.placements,
  public.campaigns,
  public.partners,
  public.system_settings,
  public.profiles
cascade;

-- (A) Meus tipos enum (só existem porque o CREATE TYPE não deu conflito,
--     ou seja, o outro app não os usava).
drop type if exists public.lead_status;
drop type if exists public.redirect_mode;
drop type if exists public.destination_type;
drop type if exists public.entity_status;
drop type if exists public.user_role;

-- (B) Funções — SOMENTE se o diagnóstico confirmar que eram minhas.
--     Comente/descomente conforme o resultado do diagnóstico.
drop function if exists public.handle_new_user();
drop function if exists public.current_user_role();
drop function if exists public.is_admin();
drop function if exists public.is_staff();
-- set_updated_at é um nome genérico; só remova se tiver certeza que era meu:
-- drop function if exists public.set_updated_at();

commit;

-- Depois disto, rode `migrations/_all_in_one.sql` (versão schema `links`).
