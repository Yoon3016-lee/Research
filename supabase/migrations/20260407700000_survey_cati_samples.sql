-- CATI 표본(엑셀) 업로드 — 버전별 배치 + 행 단위 표본
-- 기존 배치는 보존, 새 업로드는 version_number 증가 + is_active 전환

create table if not exists public.survey_sample_batches (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete cascade,
  version_number integer not null,
  original_filename text not null,
  uid_column text not null,
  phone_column text not null,
  outcome_column text not null,
  column_headers jsonb not null default '[]'::jsonb,
  row_count integer not null default 0,
  uploaded_by uuid references public.profiles (id) on delete set null,
  status text not null default 'uploading',
  is_active boolean not null default false,
  error_message text,
  created_at timestamptz not null default now(),
  constraint survey_sample_batches_version_positive check (version_number > 0),
  constraint survey_sample_batches_row_count_nonneg check (row_count >= 0),
  constraint survey_sample_batches_status_check check (
    status in ('uploading', 'ready', 'failed')
  ),
  constraint survey_sample_batches_survey_version_unique unique (survey_id, version_number)
);

create index if not exists survey_sample_batches_survey_created_idx
  on public.survey_sample_batches (survey_id, created_at desc);

-- 설문당 동시 업로드 1건 (uploading 상태 중복 방지)
create unique index if not exists survey_sample_batches_one_uploading_idx
  on public.survey_sample_batches (survey_id)
  where (status = 'uploading');

create table if not exists public.survey_samples (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.survey_sample_batches (id) on delete cascade,
  survey_id uuid not null references public.surveys (id) on delete cascade,
  row_index integer not null,
  uid text not null,
  phone text not null default '',
  row_data jsonb not null default '{}'::jsonb,
  outcome_value text,
  outcome_updated_at timestamptz,
  outcome_updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint survey_samples_row_index_positive check (row_index > 0),
  constraint survey_samples_batch_uid_unique unique (batch_id, uid)
);

create index if not exists survey_samples_batch_idx
  on public.survey_samples (batch_id, row_index);

create index if not exists survey_samples_survey_uid_idx
  on public.survey_samples (survey_id, uid);

create index if not exists survey_samples_batch_outcome_idx
  on public.survey_samples (batch_id)
  where (outcome_value is not null);

alter table public.survey_sample_batches enable row level security;
alter table public.survey_samples enable row level security;

-- 읽기·쓰기는 service_role(서버 액션) 경유
