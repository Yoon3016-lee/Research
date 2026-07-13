-- 하위 메뉴 안내 자료의 미디어 종류 (image | pdf)
-- 기존 guide_pdf_url/guide_pdf_path 컬럼은 이미지·PDF 공용으로 사용
alter table public.site_nav_items
  add column if not exists guide_media_type text;

update public.site_nav_items
  set guide_media_type = 'pdf'
  where guide_pdf_url is not null and guide_media_type is null;

alter table public.site_nav_items
  drop constraint if exists site_nav_items_guide_media_type_check;

alter table public.site_nav_items
  add constraint site_nav_items_guide_media_type_check
  check (guide_media_type is null or guide_media_type in ('image', 'pdf'));

comment on column public.site_nav_items.guide_media_type is '안내 자료 종류: image | pdf';
