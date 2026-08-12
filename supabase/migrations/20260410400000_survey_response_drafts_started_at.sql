-- CATI 초안에 설문 시작 시각을 보존 (중도 중단 후에도 소요 시간 유지)
alter table public.survey_response_drafts
  add column if not exists started_at timestamptz;

comment on column public.survey_response_drafts.started_at is '해당 표본 설문을 처음 연 시각';
