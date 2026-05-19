-- 배너 표시 위치: popup(팝업) | top(상단 띠 배너)

alter table public.site_banners
  add column if not exists placement text not null default 'popup';

alter table public.site_banners
  drop constraint if exists site_banners_placement_check;

alter table public.site_banners
  add constraint site_banners_placement_check
  check (placement in ('popup', 'top'));

create index if not exists site_banners_placement_sort_idx
  on public.site_banners (placement, is_active, sort_order);
