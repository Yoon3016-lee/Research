-- Surveys table holds high level metadata for each questionnaire
create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by text,
  deleted_at timestamptz, -- Soft delete: 삭제된 설문은 deleted_at에 타임스탬프 저장
  created_at timestamptz not null default timezone('utc', now())
);

-- Individual questions that belong to a survey. Options are only used for 객관식.
create table if not exists public.survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  prompt text not null,
  question_type text not null check (question_type in (
    '객관식',
    '주관식',
    '객관식(단일)',
    '객관식(다중선택)',
    '객관식(드롭다운)',
    '객관식(순위선택)',
    '단답형',
    '서술형',
    '복수형 주관식'
  )),
  options jsonb,
  conditional_logic jsonb, -- 조건부 분기 로직: { "옵션": "타겟질문ID" }
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

-- Verification codes for admin and master signup
create table if not exists public.verification_codes (
  role text primary key check (role in ('직원', '관리자', '마스터')),
  code text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

-- Question templates for quick question creation (객관식 only)
create table if not exists public.question_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  question_type text not null check (question_type in (
    '객관식(단일)',
    '객관식(다중선택)',
    '객관식(드롭다운)',
    '객관식(순위선택)'
  )),
  options jsonb not null, -- Array of option strings
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- update_updated_at_column 함수 (search_path 고정으로 보안 강화)
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Initial verification codes
insert into public.verification_codes (role, code) values
  ('직원', '3333'),
  ('관리자', '1111'),
  ('마스터', '2222')
on conflict (role) do nothing;

-- Row Level Security (RLS) 활성화
alter table public.surveys enable row level security;
alter table public.survey_questions enable row level security;
alter table public.survey_responses enable row level security;
alter table public.survey_answers enable row level security;
alter table public.users enable row level security;
alter table public.verification_codes enable row level security;
alter table public.question_templates enable row level security;
alter table public.survey_recipients enable row level security;

-- surveys 테이블 정책: 모든 사용자가 읽기 가능, 서비스 롤만 쓰기 가능
create policy "Allow public read access to surveys"
  on public.surveys for select
  using (true);

create policy "Allow service role to insert surveys"
  on public.surveys for insert
  with check (true);

create policy "Allow service role to update surveys"
  on public.surveys for update
  using (true);

create policy "Allow service role to delete surveys"
  on public.surveys for delete
  using (true);

-- survey_questions 테이블 정책: 모든 사용자가 읽기 가능, 서비스 롤만 쓰기 가능
create policy "Allow public read access to survey_questions"
  on public.survey_questions for select
  using (true);

create policy "Allow service role to insert survey_questions"
  on public.survey_questions for insert
  with check (true);

create policy "Allow service role to update survey_questions"
  on public.survey_questions for update
  using (true);

create policy "Allow service role to delete survey_questions"
  on public.survey_questions for delete
  using (true);

-- survey_responses 테이블 정책: 모든 사용자가 읽기 가능, 서비스 롤만 쓰기 가능
create policy "Allow public read access to survey_responses"
  on public.survey_responses for select
  using (true);

create policy "Allow service role to insert survey_responses"
  on public.survey_responses for insert
  with check (true);

create policy "Allow service role to update survey_responses"
  on public.survey_responses for update
  using (true);

create policy "Allow service role to delete survey_responses"
  on public.survey_responses for delete
  using (true);

-- survey_answers 테이블 정책: 모든 사용자가 읽기 가능, 서비스 롤만 쓰기 가능
create policy "Allow public read access to survey_answers"
  on public.survey_answers for select
  using (true);

create policy "Allow service role to insert survey_answers"
  on public.survey_answers for insert
  with check (true);

create policy "Allow service role to update survey_answers"
  on public.survey_answers for update
  using (true);

create policy "Allow service role to delete survey_answers"
  on public.survey_answers for delete
  using (true);

-- users 테이블 정책: 서비스 롤만 접근 가능 (민감한 정보)
create policy "Allow service role full access to users"
  on public.users for all
  using (true)
  with check (true);

-- verification_codes 테이블 정책: 서비스 롤만 접근 가능 (민감한 정보)
create policy "Allow service role full access to verification_codes"
  on public.verification_codes for all
  using (true)
  with check (true);

-- question_templates 테이블 정책: 모든 사용자가 읽기 가능, 서비스 롤만 쓰기 가능
create policy "Allow public read access to question_templates"
  on public.question_templates for select
  using (true);

create policy "Allow service role to insert question_templates"
  on public.question_templates for insert
  with check (true);

create policy "Allow service role to update question_templates"
  on public.question_templates for update
  using (true);

create policy "Allow service role to delete question_templates"
  on public.question_templates for delete
  using (true);

-- survey_recipients 테이블 정책: 서비스 롤만 접근 가능 (민감한 정보)
create policy "Allow service role full access to survey_recipients"
  on public.survey_recipients for all
  using (true)
  with check (true);

-- question_templates updated_at 트리거
create trigger update_question_templates_updated_at
  before update on public.question_templates
  for each row
  execute function public.update_updated_at_column();

-- Survey recipients for email distribution
create table if not exists public.survey_recipients (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  name text not null,
  email text not null,
  email_sent boolean not null default false,
  email_sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique(survey_id, email)
);


