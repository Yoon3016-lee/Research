-- 관리자 계정별 새 설문 초안 1개. 브라우저를 바꿔도 같은 계정으로 이어서 작성.
create table if not exists public.survey_create_drafts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  constraint survey_create_drafts_payload_is_object check (jsonb_typeof(payload) = 'object')
);

comment on table public.survey_create_drafts is
  '관리자 1명당 새 설문 작성 초안 1개. 정식 저장 시 삭제';

alter table public.survey_create_drafts enable row level security;
