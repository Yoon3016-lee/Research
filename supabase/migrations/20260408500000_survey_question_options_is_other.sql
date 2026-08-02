-- 객관식 보기의 「기타」 여부 (선택 시 자유 텍스트 입력)
alter table public.survey_question_options
  add column if not exists is_other boolean not null default false;

comment on column public.survey_question_options.is_other is
  'true면 기타 보기 — 응답 시 otherText 자유 입력 허용';

-- 문항당 기타 보기는 최대 1개
create unique index if not exists survey_question_options_one_other_idx
  on public.survey_question_options (question_id)
  where (is_other = true);
