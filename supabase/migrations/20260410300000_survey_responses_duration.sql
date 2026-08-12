-- 설문 응답 소요 시간 (화면 열람 ~ 제출)
alter table public.survey_responses
  add column if not exists started_at timestamptz;

alter table public.survey_responses
  add column if not exists duration_seconds integer;

alter table public.survey_responses
  drop constraint if exists survey_responses_duration_seconds_nonneg;

alter table public.survey_responses
  add constraint survey_responses_duration_seconds_nonneg
  check (duration_seconds is null or duration_seconds >= 0);

comment on column public.survey_responses.started_at is '설문 화면을 처음 연 시각(클라이언트)';
comment on column public.survey_responses.duration_seconds is '열람 후 제출까지 경과 초';
