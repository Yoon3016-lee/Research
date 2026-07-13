-- 상위 탭(그룹) 단위 안내 배너 (소속 하위 메뉴 페이지 전체에 표시)
alter table public.site_nav_groups
  add column if not exists guide_pdf_url text,
  add column if not exists guide_pdf_path text,
  add column if not exists guide_media_type text;

alter table public.site_nav_groups
  drop constraint if exists site_nav_groups_guide_media_type_check;

alter table public.site_nav_groups
  add constraint site_nav_groups_guide_media_type_check
  check (guide_media_type is null or guide_media_type in ('image', 'pdf'));

comment on column public.site_nav_groups.guide_pdf_url is '상단 탭 안내 배너 공개 URL (소속 하위 페이지에 표시)';
comment on column public.site_nav_groups.guide_pdf_path is '안내 배너 Storage 경로 (교체·삭제 정리용)';
comment on column public.site_nav_groups.guide_media_type is '안내 배너 종류: image | pdf';
