-- 설문 응답 제출자(직원 / 게스트) 추적

alter table public.survey_responses
  add column if not exists respondent_user_id uuid references auth.users (id) on delete set null,
  add column if not exists respondent_kind text not null default 'guest';

alter table public.survey_responses
  drop constraint if exists survey_responses_respondent_kind_check;

alter table public.survey_responses
  add constraint survey_responses_respondent_kind_check
  check (respondent_kind in ('staff', 'guest'));

create index if not exists survey_responses_workload_idx
  on public.survey_responses (survey_id, respondent_kind, respondent_user_id);

comment on column public.survey_responses.respondent_user_id is '로그인 제출자. 비로그인 게스트는 null';
comment on column public.survey_responses.respondent_kind is 'staff=직원·관리자 역할, guest=게스트·비로그인';
