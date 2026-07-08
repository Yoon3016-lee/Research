-- 홈페이지 이름 글꼴 선택

alter table public.site_settings
  add column if not exists site_name_font text not null default 'source-serif-4';

comment on column public.site_settings.site_name_font is
  '홈페이지 이름 표시 글꼴 키 (lib/site-name-fonts.ts SITE_NAME_FONT_KEYS)';
