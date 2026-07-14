-- ============ migrations/0001_schema.sql ============
-- =====================================================================
-- 0001_schema.sql — Schema dedicado "links": enums e tabelas
-- =====================================================================
-- Todo o gestor vive no schema `links`, isolado do `public` (que pode
-- hospedar outro app no mesmo projeto Supabase).

create schema if not exists links;

-- ---------- Enums ----------
create type links.user_role as enum ('admin', 'operator', 'analyst');
create type links.entity_status as enum ('active', 'paused', 'archived');
create type links.destination_type as enum ('whatsapp', 'external_url', 'internal_landing');
create type links.redirect_mode as enum ('direct', 'capture_simple', 'capture_complete', 'custom_landing');
create type links.lead_status as enum ('new', 'contacted', 'qualified', 'converted', 'lost', 'invalid', 'test');

-- ---------- profiles ----------
create table links.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role links.user_role not null default 'operator',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- partners ----------
create table links.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  contact_name text,
  contact_email text,
  contact_phone text,
  status links.entity_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- campaigns ----------
create table links.campaigns (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references links.partners(id) on delete restrict,
  name text not null,
  description text,
  objective text,
  budget numeric,
  status links.entity_status not null default 'active',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- placements ----------
create table links.placements (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references links.campaigns(id) on delete cascade,
  name text not null,
  partner_page text,
  position_name text,
  description text,
  dimensions text,
  reference_url text,
  status links.entity_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- tracked_links ----------
create table links.tracked_links (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  partner_id uuid references links.partners(id) on delete set null,
  campaign_id uuid references links.campaigns(id) on delete set null,
  placement_id uuid references links.placements(id) on delete set null,
  destination_type links.destination_type not null,
  redirect_mode links.redirect_mode not null,
  whatsapp_number text,
  whatsapp_message_template text,
  external_url text,
  capture_enabled boolean not null default false,
  capture_name boolean not null default true,
  capture_phone boolean not null default false,
  capture_email boolean not null default false,
  capture_interest boolean not null default false,
  name_required boolean not null default false,
  phone_required boolean not null default false,
  email_required boolean not null default false,
  interest_required boolean not null default false,
  landing_title text,
  landing_description text,
  button_text text,
  success_message text,
  privacy_text text,
  unavailable_title text,
  unavailable_description text,
  status links.entity_status not null default 'active',
  starts_at timestamptz,
  ends_at timestamptz,
  current_version integer not null default 1,
  created_by uuid references links.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- link_versions ----------
create table links.link_versions (
  id uuid primary key default gen_random_uuid(),
  tracked_link_id uuid not null references links.tracked_links(id) on delete cascade,
  version_number integer not null,
  whatsapp_number text,
  whatsapp_message_template text,
  destination_type links.destination_type,
  redirect_mode links.redirect_mode,
  external_url text,
  configuration_snapshot jsonb not null,
  created_by uuid references links.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tracked_link_id, version_number)
);

-- ---------- sessions ----------
create table links.sessions (
  id uuid primary key default gen_random_uuid(),
  session_token_hash text not null unique,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  metadata jsonb
);

-- ---------- clicks ----------
create table links.clicks (
  id uuid primary key default gen_random_uuid(),
  click_code text not null unique,
  tracked_link_id uuid not null references links.tracked_links(id) on delete cascade,
  link_version_id uuid references links.link_versions(id) on delete set null,
  session_id uuid references links.sessions(id) on delete set null,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  device_type text,
  browser text,
  operating_system text,
  country text,
  region text,
  city text,
  ip_hash text,
  user_agent text,
  is_bot boolean not null default false,
  is_test boolean not null default false,
  clicked_at timestamptz not null default now(),
  redirected_at timestamptz
);

-- ---------- events ----------
create table links.events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  tracked_link_id uuid references links.tracked_links(id) on delete cascade,
  click_id uuid references links.clicks(id) on delete set null,
  session_id uuid references links.sessions(id) on delete set null,
  metadata jsonb,
  is_test boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- leads ----------
create table links.leads (
  id uuid primary key default gen_random_uuid(),
  click_id uuid references links.clicks(id) on delete set null,
  tracked_link_id uuid not null references links.tracked_links(id) on delete cascade,
  name text,
  phone text,
  email text,
  interest text,
  consent boolean not null default false,
  status links.lead_status not null default 'new',
  notes text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- test_runs ----------
create table links.test_runs (
  id uuid primary key default gen_random_uuid(),
  tracked_link_id uuid not null references links.tracked_links(id) on delete cascade,
  created_by uuid references links.profiles(id) on delete set null,
  token_hash text,
  expires_at timestamptz,
  status text not null default 'pending',
  results jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ---------- conversions ----------
create table links.conversions (
  id uuid primary key default gen_random_uuid(),
  tracked_link_id uuid references links.tracked_links(id) on delete set null,
  click_id uuid references links.clicks(id) on delete set null,
  lead_id uuid references links.leads(id) on delete set null,
  conversion_type text,
  value numeric,
  currency text default 'BRL',
  metadata jsonb,
  is_test boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- audit_logs ----------
create table links.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references links.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  field_name text,
  old_value jsonb,
  new_value jsonb,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- ---------- system_settings ----------
create table links.system_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references links.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Permite que os papéis do Supabase acessem o schema (RLS ainda se aplica).
grant usage on schema links to anon, authenticated, service_role;
grant all on all tables in schema links to service_role;
grant select, insert, update, delete on all tables in schema links to authenticated;
alter default privileges in schema links grant all on tables to service_role;
alter default privileges in schema links grant select, insert, update, delete on tables to authenticated;

-- ============ migrations/0002_indexes.sql ============
-- =====================================================================
-- 0002_indexes.sql — Índices de performance (schema links)
-- =====================================================================

create index idx_tracked_links_slug on links.tracked_links (slug);
create index idx_tracked_links_partner on links.tracked_links (partner_id);
create index idx_tracked_links_campaign on links.tracked_links (campaign_id);
create index idx_tracked_links_placement on links.tracked_links (placement_id);
create index idx_tracked_links_status on links.tracked_links (status);

create index idx_link_versions_link on links.link_versions (tracked_link_id);

create index idx_campaigns_partner on links.campaigns (partner_id);
create index idx_placements_campaign on links.placements (campaign_id);

create index idx_clicks_code on links.clicks (click_code);
create index idx_clicks_link on links.clicks (tracked_link_id);
create index idx_clicks_version on links.clicks (link_version_id);
create index idx_clicks_session on links.clicks (session_id);
create index idx_clicks_clicked_at on links.clicks (clicked_at);
create index idx_clicks_is_test on links.clicks (is_test);
create index idx_clicks_is_bot on links.clicks (is_bot);
create index idx_clicks_utm_source on links.clicks (utm_source);
create index idx_clicks_utm_campaign on links.clicks (utm_campaign);

create index idx_events_name on links.events (event_name);
create index idx_events_link on links.events (tracked_link_id);
create index idx_events_click on links.events (click_id);
create index idx_events_created_at on links.events (created_at);
create index idx_events_is_test on links.events (is_test);

create index idx_leads_link on links.leads (tracked_link_id);
create index idx_leads_click on links.leads (click_id);
create index idx_leads_created_at on links.leads (created_at);
create index idx_leads_status on links.leads (status);

create index idx_audit_entity on links.audit_logs (entity_type, entity_id);
create index idx_audit_created_at on links.audit_logs (created_at);
create index idx_conversions_link on links.conversions (tracked_link_id);

-- ============ migrations/0003_functions.sql ============
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

-- ============ migrations/0004_rls.sql ============
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

-- ============ migrations/0005_seed_settings.sql ============
-- =====================================================================
-- 0005_seed_settings.sql — Configurações padrão do sistema (schema links)
-- =====================================================================

insert into links.system_settings (key, value) values
  ('timezone', '"America/Sao_Paulo"'::jsonb),
  ('default_country_code', '"55"'::jsonb),
  ('unique_click_window_hours', '24'::jsonb),
  ('rate_limits', '{"redirect":60,"lead":10,"impression":120,"event":120,"test":30}'::jsonb)
on conflict (key) do nothing;

