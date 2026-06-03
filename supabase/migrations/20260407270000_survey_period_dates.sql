-- 설문 기간: 시작·종료일 (상태는 앱에서 날짜 기준 자동 계산)

alter table public.surveys
  add column if not exists period_start date,
  add column if not exists period_end date;

comment on column public.surveys.period_start is '설문 시작일 (포함)';
comment on column public.surveys.period_end is '설문 종료일 (포함)';
comment on column public.surveys.period_label is '표시용 기간 문구 (앱에서 시작·종료일로 생성)';
