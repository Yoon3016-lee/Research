-- 문항 표시 조건: 직원 전용 · 이전 문항 답변에 따른 분기
-- survey_questions 마이그레이션 이후 실행

alter table public.survey_questions
  add column if not exists staff_only boolean not null default false;

alter table public.survey_questions
  add column if not exists visibility_rules jsonb null;

comment on column public.survey_questions.staff_only is
  'true이면 로그인한 직원(employee 이상)에게만 문항 표시';

comment on column public.survey_questions.visibility_rules is
  '조건부 표시 규칙 JSON 배열. 예: [{"sourceOrderIndex":0,"optionIndex":1}] — 기준 문항의 N번째 보기(0-based) 선택 시 표시';
