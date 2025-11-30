-- Surveys table holds high level metadata for each questionnaire
create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Individual questions that belong to a survey. Options are only used for 객관식.
create table if not exists public.survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  prompt text not null,
  question_type text not null check (question_type in ('객관식', '주관식')),
  options jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

-- Response header per employee submission
create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  employee_id text not null,
  submitted_at timestamptz not null default timezone('utc', now())
);

-- Answers keyed per question
create table if not exists public.survey_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.survey_responses(id) on delete cascade,
  question_id uuid not null references public.survey_questions(id) on delete cascade,
  answer_text text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique(response_id, question_id)
);

-- Helpful indexes
create index if not exists idx_survey_questions_survey on public.survey_questions(survey_id);
create index if not exists idx_survey_responses_survey on public.survey_responses(survey_id);
create index if not exists idx_survey_answers_response on public.survey_answers(response_id);

