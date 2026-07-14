-- =====================================================================
-- 0005_seed_settings.sql — Configurações padrão do sistema (schema links)
-- =====================================================================

insert into links.system_settings (key, value) values
  ('timezone', '"America/Sao_Paulo"'::jsonb),
  ('default_country_code', '"55"'::jsonb),
  ('unique_click_window_hours', '24'::jsonb),
  ('rate_limits', '{"redirect":60,"lead":10,"impression":120,"event":120,"test":30}'::jsonb)
on conflict (key) do nothing;
