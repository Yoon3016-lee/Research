-- CATI 컨택 결과 선택지 (설문별 편집 가능)
-- 행이 없으면 앱에서 기본 선택지(11종)를 사용

create table if not exists public.survey_contact_options (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete cascade,
  position integer not null,
  label text not null,
  is_success boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint survey_contact_options_position_positive check (position > 0),
  constraint survey_contact_options_label_not_blank check (length(btrim(label)) > 0),
  constraint survey_contact_options_survey_position_unique unique (survey_id, position)
);

create index if not exists survey_contact_options_survey_idx
  on public.survey_contact_options (survey_id, position);

comment on table public.survey_contact_options is 'CATI 조사원 컨택 결과 선택지 (설문별). is_success=true면 선택 시 설문 진행';

alter table public.survey_contact_options enable row level security;

-- 읽기·쓰기는 service_role(서버 액션) 경유
