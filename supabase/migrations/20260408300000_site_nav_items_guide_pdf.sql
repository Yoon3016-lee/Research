-- 상단 탭 하위 메뉴별 안내 PDF (상단 배너처럼 해당 페이지 상단에 표시)
alter table public.site_nav_items
  add column if not exists guide_pdf_url text,
  add column if not exists guide_pdf_path text;

comment on column public.site_nav_items.guide_pdf_url is '하위 메뉴 페이지 상단에 표시할 안내 PDF 공개 URL';
comment on column public.site_nav_items.guide_pdf_path is '안내 PDF의 Storage 경로 (교체·삭제 정리용)';
