-- 표본 업로드 시 선택한 추가 열(CATI UID 적용 화면에 표시)
alter table public.survey_sample_batches
  add column if not exists extra_columns jsonb not null default '[]'::jsonb;

comment on column public.survey_sample_batches.extra_columns is
  'Excel 열 문자 배열. CATI 표본 조사에서 UID 적용 시 함께 표시할 추가 열.';
