-- CATI 초안: 설문이 열려 있는 동안만 누적한 초
alter table public.survey_response_drafts
  add column if not exists active_seconds integer;

alter table public.survey_response_drafts
  drop constraint if exists survey_response_drafts_active_seconds_nonneg;

alter table public.survey_response_drafts
  add constraint survey_response_drafts_active_seconds_nonneg
  check (active_seconds is null or active_seconds >= 0);

comment on column public.survey_response_drafts.active_seconds is '설문이 화면에 열려 있는 동안 누적한 초';
