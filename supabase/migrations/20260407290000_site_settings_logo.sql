-- 사이트 로고 (공개 헤더 · 관리자 홈페이지 설정)

alter table public.site_settings
  add column if not exists logo_url text,
  add column if not exists logo_storage_path text;
