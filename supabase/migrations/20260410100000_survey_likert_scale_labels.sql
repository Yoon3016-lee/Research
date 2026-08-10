-- likert_7 · likert_multi: 척도 크기(max_selections) 및 점수별 라벨
alter table public.survey_questions
  add column if not exists likert_scale_labels jsonb default null;

comment on column public.survey_questions.likert_scale_labels is
  'likert_7·likert_multi: 척도 점수별 라벨 JSON 배열 (index 0 = 1점). max_selections = 척도 크기(기본 5)';

comment on column public.survey_questions.max_selections is
  'mc_multi: 최대 선택 · rank: 순위 개수 · likert_7/likert_multi: 척도 크기(2~10, 기본 5)';
