-- 드롭다운 · 순위 선택 · 척도(다중) · 별점 평가

alter table public.survey_questions
  drop constraint if exists survey_questions_type_check;

alter table public.survey_questions
  add constraint survey_questions_type_check
  check (
    question_type in (
      'mc_single',
      'mc_multi',
      'text_single',
      'text_multi',
      'likert_7',
      'dropdown',
      'rank',
      'likert_multi',
      'star_rating'
    )
  );

comment on column public.survey_questions.question_type is
  'mc_single|mc_multi|text_single|text_multi|likert_7|dropdown|rank|likert_multi|star_rating';

comment on column public.survey_questions.max_selections is
  'mc_multi: 최대 선택 개수 · rank: 순위 개수(예: 3순위까지)';
