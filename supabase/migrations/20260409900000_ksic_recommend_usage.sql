-- 공개 홈 KSIC 비정형 후보 추론 체험 횟수
-- 로그인 회원(user_id) 또는 비로그인 방문자(visitor_key, 쿠키) 단위
create table if not exists public.ksic_recommend_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade,
  visitor_key text unique,
  use_count integer not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ksic_recommend_usage_count_check check (use_count >= 0),
  constraint ksic_recommend_usage_subject_check check (
    (user_id is not null and visitor_key is null)
    or (user_id is null and visitor_key is not null)
  )
);

create index if not exists ksic_recommend_usage_user_id_idx
  on public.ksic_recommend_usage (user_id)
  where user_id is not null;

create index if not exists ksic_recommend_usage_visitor_key_idx
  on public.ksic_recommend_usage (visitor_key)
  where visitor_key is not null;

comment on table public.ksic_recommend_usage is
  '공개 홈 KSIC 비정형 후보 추론 체험 횟수 (회원 또는 비로그인 방문자)';

alter table public.ksic_recommend_usage enable row level security;

drop policy if exists "ksic_recommend_usage_select_own" on public.ksic_recommend_usage;

-- 로그인한 본인 행만 조회 (방문자는 서비스 롤로만 조회)
create policy "ksic_recommend_usage_select_own"
  on public.ksic_recommend_usage
  for select
  to authenticated
  using (auth.uid() = user_id);
