-- CATI 중도 중단 저장 (표본별 진행 중 응답 초안)
-- 조사원이 설문 도중 중단하면 현재까지의 답변을 저장하고, 나중에 이어서 진행

create table if not exists public.survey_response_drafts (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete cascade,
  sample_id uuid not null references public.survey_samples (id) on delete cascade,
  answers jsonb not null default '[]'::jsonb,
  active_question_id uuid,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint survey_response_drafts_sample_unique unique (sample_id)
);

create index if not exists survey_response_drafts_survey_idx
  on public.survey_response_drafts (survey_id);

comment on table public.survey_response_drafts is 'CATI 표본별 진행 중 응답 초안 (중도 중단 → 이어서 진행)';

alter table public.survey_response_drafts enable row level security;

-- 읽기·쓰기는 service_role(서버 액션) 경유
