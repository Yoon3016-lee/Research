-- 모든 설문에서 함께 볼 수 있는 공용 응답 스크립트
create table if not exists public.shared_response_scripts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shared_response_scripts_title_nonempty check (char_length(trim(title)) > 0)
);

create index if not exists shared_response_scripts_sort_idx
  on public.shared_response_scripts (sort_order, created_at);

alter table public.shared_response_scripts enable row level security;

-- 조회·수정은 서버(Service Role) 전용. 직원 팝업·관리자 화면 모두 서버에서 로드합니다.
