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
