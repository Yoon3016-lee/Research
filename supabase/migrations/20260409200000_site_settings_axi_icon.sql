-- AXI 플로팅 아이콘 이미지 (설문 참여 화면)
alter table public.site_settings
  add column if not exists axi_icon_url text,
  add column if not exists axi_icon_storage_path text;

comment on column public.site_settings.axi_icon_url is '설문 화면 AXI 플로팅 아이콘 공개 URL';
comment on column public.site_settings.axi_icon_storage_path is 'AXI 아이콘 Storage 경로';
