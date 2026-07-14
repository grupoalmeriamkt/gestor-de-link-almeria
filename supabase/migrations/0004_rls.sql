-- =====================================================================
-- 0004_rls.sql — Row Level Security (schema links)
-- =====================================================================
-- O fluxo público roda no servidor com SERVICE ROLE (ignora RLS).
-- Usuários autenticados (staff) enxergam o painel conforme o role.
-- Sem policy para um comando => negado por padrão (RLS habilitado).

alter table links.profiles enable row level security;
alter table links.partners enable row level security;
alter table links.campaigns enable row level security;
alter table links.placements enable row level security;
alter table links.tracked_links enable row level security;
alter table links.link_versions enable row level security;
alter table links.sessions enable row level security;
alter table links.clicks enable row level security;
alter table links.events enable row level security;
alter table links.leads enable row level security;
alter table links.test_runs enable row level security;
alter table links.conversions enable row level security;
alter table links.audit_logs enable row level security;
alter table links.system_settings enable row level security;

-- ---------- profiles ----------
create policy profiles_select_self_or_admin on links.profiles for select to authenticated
  using (id = auth.uid() or links.is_admin());
create policy profiles_admin_all on links.profiles for all to authenticated
  using (links.is_admin()) with check (links.is_admin());

-- ---------- partners ----------
create policy partners_read on links.partners for select to authenticated using (links.is_staff());
create policy partners_write on links.partners for all to authenticated
  using (links.current_user_role() in ('admin','operator'))
  with check (links.current_user_role() in ('admin','operator'));

-- ---------- campaigns ----------
create policy campaigns_read on links.campaigns for select to authenticated using (links.is_staff());
create policy campaigns_write on links.campaigns for all to authenticated
  using (links.current_user_role() in ('admin','operator'))
  with check (links.current_user_role() in ('admin','operator'));

-- ---------- placements ----------
create policy placements_read on links.placements for select to authenticated using (links.is_staff());
create policy placements_write on links.placements for all to authenticated
  using (links.current_user_role() in ('admin','operator'))
  with check (links.current_user_role() in ('admin','operator'));

-- ---------- tracked_links ----------
create policy links_read on links.tracked_links for select to authenticated using (links.is_staff());
create policy links_write on links.tracked_links for all to authenticated
  using (links.current_user_role() in ('admin','operator'))
  with check (links.current_user_role() in ('admin','operator'));

-- ---------- link_versions ----------
create policy versions_read on links.link_versions for select to authenticated using (links.is_staff());
create policy versions_write on links.link_versions for all to authenticated
  using (links.current_user_role() in ('admin','operator'))
  with check (links.current_user_role() in ('admin','operator'));

-- ---------- sessions / clicks / events (somente leitura no painel) ----------
create policy sessions_read on links.sessions for select to authenticated using (links.is_staff());
create policy clicks_read on links.clicks for select to authenticated using (links.is_staff());
create policy events_read on links.events for select to authenticated using (links.is_staff());

-- ---------- leads ----------
create policy leads_read on links.leads for select to authenticated using (links.is_staff());
create policy leads_write on links.leads for all to authenticated
  using (links.current_user_role() in ('admin','operator'))
  with check (links.current_user_role() in ('admin','operator'));

-- ---------- test_runs ----------
create policy test_runs_read on links.test_runs for select to authenticated using (links.is_staff());
create policy test_runs_write on links.test_runs for all to authenticated
  using (links.current_user_role() in ('admin','operator'))
  with check (links.current_user_role() in ('admin','operator'));

-- ---------- conversions ----------
create policy conversions_read on links.conversions for select to authenticated using (links.is_staff());
create policy conversions_write on links.conversions for all to authenticated
  using (links.current_user_role() in ('admin','operator'))
  with check (links.current_user_role() in ('admin','operator'));

-- ---------- audit_logs (somente leitura; escrita via service role) ----------
create policy audit_read on links.audit_logs for select to authenticated using (links.is_admin());

-- ---------- system_settings ----------
create policy settings_read on links.system_settings for select to authenticated using (links.is_staff());
create policy settings_write on links.system_settings for all to authenticated
  using (links.is_admin()) with check (links.is_admin());
