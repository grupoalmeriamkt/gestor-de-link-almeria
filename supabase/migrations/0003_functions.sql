-- =====================================================================
-- 0003_functions.sql — Triggers e funções auxiliares (schema links)
-- =====================================================================
-- Sem trigger em auth.users: a criação de perfil é feita na camada da
-- aplicação (bootstrap no 1º login), para não interferir em outros apps
-- que compartilham o mesmo projeto/Auth.

create or replace function links.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_partners_updated before update on links.partners
  for each row execute function links.set_updated_at();
create trigger trg_campaigns_updated before update on links.campaigns
  for each row execute function links.set_updated_at();
create trigger trg_placements_updated before update on links.placements
  for each row execute function links.set_updated_at();
create trigger trg_tracked_links_updated before update on links.tracked_links
  for each row execute function links.set_updated_at();
create trigger trg_leads_updated before update on links.leads
  for each row execute function links.set_updated_at();
create trigger trg_profiles_updated before update on links.profiles
  for each row execute function links.set_updated_at();

-- Role do usuário autenticado (usado nas policies RLS).
create or replace function links.current_user_role()
returns links.user_role
language sql
stable
security definer
set search_path = links, public
as $$
  select role from links.profiles where id = auth.uid();
$$;

create or replace function links.is_admin()
returns boolean
language sql
stable
security definer
set search_path = links, public
as $$
  select coalesce((select role = 'admin' from links.profiles where id = auth.uid()), false);
$$;

create or replace function links.is_staff()
returns boolean
language sql
stable
security definer
set search_path = links, public
as $$
  select coalesce((select role in ('admin','operator','analyst') from links.profiles where id = auth.uid()), false);
$$;

grant execute on function links.current_user_role(), links.is_admin(), links.is_staff()
  to anon, authenticated, service_role;
