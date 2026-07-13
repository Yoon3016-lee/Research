-- 직원 개인 설정: 설문 진행 방식 (페이지 넘김 / 스크롤)
alter table public.profiles
  add column if not exists survey_view_mode text not null default 'paged';

alter table public.profiles
  drop constraint if exists profiles_survey_view_mode_check;

alter table public.profiles
  add constraint profiles_survey_view_mode_check
  check (survey_view_mode in ('paged', 'scroll'));

comment on column public.profiles.survey_view_mode is '설문 진행 방식: paged(페이지 넘김) | scroll(스크롤)';
