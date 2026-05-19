-- 홈페이지 상단 배너 (관리자 등록 · 공개 조회는 서버 service role)

create table if not exists public.site_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  media_type text not null,
  file_url text not null,
  link_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_banners_media_type_check check (media_type in ('image', 'pdf')),
  constraint site_banners_file_url_nonempty check (char_length(trim(file_url)) > 0)
);

create index if not exists site_banners_active_sort_idx
  on public.site_banners (is_active, sort_order, created_at);

alter table public.site_banners enable row level security;
