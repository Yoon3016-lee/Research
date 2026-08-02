-- 안내(글/그림/영상) · 연락처(라벨+입력) 문항 유형

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
      'star_rating',
      'info_media',
      'contact_fields'
    )
  );

alter table public.survey_questions
  add column if not exists info_body text,
  add column if not exists media_url text,
  add column if not exists media_path text,
  add column if not exists media_type text;

alter table public.survey_questions
  drop constraint if exists survey_questions_media_type_check;

alter table public.survey_questions
  add constraint survey_questions_media_type_check
  check (media_type is null or media_type in ('image', 'video'));

comment on column public.survey_questions.question_type is
  'mc_single|mc_multi|text_single|text_multi|likert_7|dropdown|rank|likert_multi|star_rating|info_media|contact_fields';
comment on column public.survey_questions.info_body is 'info_media: 안내 본문(텍스트)';
comment on column public.survey_questions.media_url is 'info_media: 그림/영상 공개 URL';
comment on column public.survey_questions.media_path is 'info_media: Storage 경로(교체·삭제용)';
comment on column public.survey_questions.media_type is 'info_media: image | video';
