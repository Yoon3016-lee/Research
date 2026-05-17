-- 설문 응답(제출 1건) · 문항별 답변
-- survey_questions 마이그레이션 이후 실행

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete cascade,
  submitted_at timestamptz not null default now()
);

create index if not exists survey_responses_survey_idx
  on public.survey_responses (survey_id, submitted_at desc);

create table if not exists public.survey_response_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.survey_responses (id) on delete cascade,
  question_id uuid not null references public.survey_questions (id) on delete cascade,
  answer jsonb not null,
  constraint survey_response_answers_unique unique (response_id, question_id)
);

create index if not exists survey_response_answers_response_idx
  on public.survey_response_answers (response_id);

alter table public.survey_responses enable row level security;
alter table public.survey_response_answers enable row level security;

-- 공개 응답은 서버(service_role)에서만 INSERT. anon 직접 쓰기 정책 없음.

comment on table public.survey_responses is '설문 1회 제출(참여자)';
comment on table public.survey_response_answers is '제출별 문항 답변(JSON)';
