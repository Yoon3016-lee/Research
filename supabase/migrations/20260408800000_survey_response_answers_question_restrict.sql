-- 문항 삭제 시 응답 답변이 조용히 함께 지워지지 않도록 막습니다.
-- (이전: ON DELETE CASCADE → 설문 수정 시 문항 전체 삭제하면 답변 전량 유실)

alter table public.survey_response_answers
  drop constraint if exists survey_response_answers_question_id_fkey;

alter table public.survey_response_answers
  add constraint survey_response_answers_question_id_fkey
  foreign key (question_id)
  references public.survey_questions (id)
  on delete restrict;
