-- 공개 홈페이지: 사이트명 · 메뉴 그룹 · 하위 메뉴 · 선택적 콘텐츠 페이지

create table if not exists public.site_settings (
  id int primary key default 1,
  site_name text not null default '[ OO리서치 ]',
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1)
);

insert into public.site_settings (id, site_name)
values (1, '[ OO리서치 ]')
on conflict (id) do nothing;

create table if not exists public.site_nav_groups (
  key text primary key,
  label text not null,
  sort_order integer not null default 0
);

insert into public.site_nav_groups (key, label, sort_order)
values
  ('intro', '회사 소개', 0),
  ('survey', '설문 조사', 1),
  ('service', '서비스', 2)
on conflict (key) do nothing;

create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null default '',
  updated_at timestamptz not null default now(),
  constraint site_pages_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.site_nav_items (
  id uuid primary key default gen_random_uuid(),
  group_key text not null references public.site_nav_groups (key) on delete cascade,
  label text not null,
  href text not null default '/',
  sort_order integer not null default 0,
  page_id uuid references public.site_pages (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_nav_items_label_nonempty check (char_length(trim(label)) > 0)
);

create index if not exists site_nav_items_group_sort_idx
  on public.site_nav_items (group_key, sort_order);

-- 기본 하위 메뉴 (관리자에서 수정·삭제 가능)
insert into public.site_nav_items (group_key, label, href, sort_order)
select 'survey', '진행중 설문', '/surveys', 0
where not exists (
  select 1 from public.site_nav_items where group_key = 'survey' and href = '/surveys'
);

insert into public.site_nav_items (group_key, label, href, sort_order)
select 'service', '서비스 안내', '/services', 0
where not exists (
  select 1 from public.site_nav_items where group_key = 'service' and href = '/services'
);

alter table public.site_settings enable row level security;
alter table public.site_nav_groups enable row level security;
alter table public.site_nav_items enable row level security;
alter table public.site_pages enable row level security;

-- 공개 조회·관리자 수정은 Service Role(서버) 전용
