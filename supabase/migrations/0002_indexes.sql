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
