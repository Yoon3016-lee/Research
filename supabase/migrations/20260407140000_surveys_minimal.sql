-- 최소 설문 테이블 (목업 필드와 대응)
-- Supabase Dashboard → SQL Editor에서 실행하거나, CLI로 `supabase db push` 등 적용

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  period_label text not null default '',
  response_count integer not null default 0,
  target_count integer not null default 0,
  status text not null default '예정',
  listed_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint surveys_status_check check (status in ('진행중', '예정', '종료')),
  constraint surveys_response_count_nonneg check (response_count >= 0),
  constraint surveys_target_count_nonneg check (target_count >= 0)
);

create index if not exists surveys_status_listed_idx
  on public.surveys (status, listed_public);

alter table public.surveys enable row level security;

-- 공개 사이트(anon): 노출 허용 + 진행중인 설문만 조회
create policy "public_read_ongoing_listed_surveys"
  on public.surveys
  for select
  to anon, authenticated
  using (listed_public = true and status = '진행중');

-- 관리자 전체 조회·수정은 service_role 키(서버 전용)로 수행 — RLS 우회
-- 이후 Auth 도입 시 authenticated용 정책을 추가하면 service_role 의존을 줄일 수 있음
