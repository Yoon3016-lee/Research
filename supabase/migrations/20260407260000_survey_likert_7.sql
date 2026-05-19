-- 리커트 1~7 척도 문항 유형

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
      'likert_7'
    )
  );

comment on column public.survey_questions.question_type is
  'mc_single|mc_multi|text_single|text_multi|likert_7 (1~7 척도, 선택적 양끝 라벨은 survey_question_options 0~1)';
