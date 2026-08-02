-- 보기 선택 시 조사 종료 (이후 문항 숨김 · 제출로 진행)
alter table public.survey_question_options
  add column if not exists ends_survey boolean not null default false;

comment on column public.survey_question_options.ends_survey is
  'true면 해당 보기 선택 시 이후 문항을 표시하지 않고 조사를 종료(제출)합니다. 객관식 단일·드롭다운용.';
