-- CMS 페이지 공개 숨김
alter table public.site_pages
  add column if not exists is_hidden boolean not null default false;

comment on column public.site_pages.is_hidden is
  'true면 공개 사이트 메뉴·/p/[slug]에서 숨김 (관리자에서는 계속 편집 가능)';
