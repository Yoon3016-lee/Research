-- 설문 문항·객관식 선택지
-- surveys 마이그레이션 이후 실행

create table if not exists public.survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete cascade,
  order_index int not null,
  prompt text not null,
  question_type text not null,
  allow_skip boolean not null default false,
  max_selections int null,
  text_line_count int null,
  created_at timestamptz not null default now(),
  constraint survey_questions_type_check check (
    question_type in ('mc_single', 'mc_multi', 'text_single', 'text_multi')
  ),
  constraint survey_questions_max_sel check (
    max_selections is null or max_selections >= 1
  ),
  constraint survey_questions_text_lines check (
    text_line_count is null or text_line_count >= 1
  )
);

create index if not exists survey_questions_survey_order_idx
  on public.survey_questions (survey_id, order_index);

create table if not exists public.survey_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.survey_questions (id) on delete cascade,
  order_index int not null,
  label text not null
);

create index if not exists survey_question_options_q_idx
  on public.survey_question_options (question_id, order_index);

alter table public.survey_questions enable row level security;
alter table public.survey_question_options enable row level security;

-- 응답 화면용: 진행중·공개 설문의 문항·선택지만 읽기
create policy "read_questions_public_survey"
  on public.survey_questions for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.surveys s
      where s.id = survey_questions.survey_id
        and s.listed_public = true
        and s.status = '진행중'
    )
  );

create policy "read_options_public_survey"
  on public.survey_question_options for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.survey_questions q
      join public.surveys s on s.id = q.survey_id
      where q.id = survey_question_options.question_id
        and s.listed_public = true
        and s.status = '진행중'
    )
  );

comment on column public.survey_questions.max_selections is '객관식 다중: 최대 선택 개수';
comment on column public.survey_questions.text_line_count is '주관식 다중: 답변 입력 줄 개수';
