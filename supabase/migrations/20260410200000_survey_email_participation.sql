-- 이메일 형식 설문: participation_format, 초대 토큰, 발송 상태

alter table public.surveys
  add column if not exists participation_format text not null default 'site',
  add column if not exists samples_locked_at timestamptz;

alter table public.surveys
  drop constraint if exists surveys_participation_format_check;

alter table public.surveys
  add constraint surveys_participation_format_check
  check (participation_format in ('site', 'email'));

comment on column public.surveys.participation_format is 'site=공개 링크, email=초대 토큰 링크';
comment on column public.surveys.samples_locked_at is '이메일 본 발송 후 표본 재업로드 잠금 시각';

alter table public.survey_sample_batches
  add column if not exists email_column text,
  add column if not exists name_column text;

comment on column public.survey_sample_batches.email_column is '이메일 형식: 수신 이메일 열 (Excel 문자)';
comment on column public.survey_sample_batches.name_column is '이메일 형식: 머지용 이름 열 (선택)';

alter table public.survey_samples
  add column if not exists email text not null default '',
  add column if not exists invite_token text,
  add column if not exists send_status text not null default 'pending',
  add column if not exists send_error text,
  add column if not exists sent_at timestamptz;

alter table public.survey_samples
  drop constraint if exists survey_samples_send_status_check;

alter table public.survey_samples
  add constraint survey_samples_send_status_check
  check (send_status in ('pending', 'sent', 'failed'));

create unique index if not exists survey_samples_invite_token_unique
  on public.survey_samples (invite_token)
  where (invite_token is not null);

create unique index if not exists survey_responses_sample_id_unique
  on public.survey_responses (sample_id)
  where (sample_id is not null);

comment on column public.survey_samples.invite_token is '이메일 초대 URL용 불투명 토큰';
comment on column public.survey_samples.send_status is 'pending | sent | failed';

-- 이메일 발송 이력 (테스트/일괄)
create table if not exists public.survey_email_sends (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete cascade,
  batch_id uuid references public.survey_sample_batches (id) on delete set null,
  sample_id uuid references public.survey_samples (id) on delete set null,
  kind text not null check (kind in ('test', 'bulk')),
  recipient_email text not null,
  subject text not null default '',
  body text not null default '',
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error_message text,
  sent_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists survey_email_sends_survey_idx
  on public.survey_email_sends (survey_id, created_at desc);

alter table public.survey_email_sends enable row level security;
