-- 설문 버전(응답 있는 설문 수정 시 새 설문 생성 + 기존 종료)

alter table public.surveys
  add column if not exists root_survey_id uuid references public.surveys (id) on delete set null,
  add column if not exists supersedes_survey_id uuid references public.surveys (id) on delete set null,
  add column if not exists successor_survey_id uuid references public.surveys (id) on delete set null;

create index if not exists surveys_root_survey_idx
  on public.surveys (root_survey_id)
  where (root_survey_id is not null);

create index if not exists surveys_supersedes_idx
  on public.surveys (supersedes_survey_id)
  where (supersedes_survey_id is not null);

comment on column public.surveys.root_survey_id is '버전 계열 최초 설문 ID';
comment on column public.surveys.supersedes_survey_id is '이 설문이 대체한 이전 버전 ID';
comment on column public.surveys.successor_survey_id is '이 설문을 대체한 새 버전 ID (참여 URL 리다이렉트용)';
