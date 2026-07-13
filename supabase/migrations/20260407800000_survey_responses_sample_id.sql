-- CATI: 설문 응답 ↔ 표본 연결
alter table public.survey_responses
  add column if not exists sample_id uuid references public.survey_samples (id) on delete set null;

create index if not exists survey_responses_sample_idx
  on public.survey_responses (sample_id)
  where (sample_id is not null);

comment on column public.survey_responses.sample_id is 'CATI 표본(survey_samples) 연결 — 조사원 UID 적용 시';
