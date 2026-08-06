-- 설문 응답 백업: 제출 시 아카이브 + 설문 전체 스냅샷
-- 운영 테이블 CASCADE 삭제 시에도 복구용 데이터를 보존합니다.

create table if not exists public.survey_response_archives (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null,
  survey_id uuid not null,
  survey_slug text not null,
  survey_title text not null,
  archived_at timestamptz not null default now(),
  payload jsonb not null,
  constraint survey_response_archives_response_unique unique (response_id)
);

create index if not exists survey_response_archives_survey_idx
  on public.survey_response_archives (survey_id, archived_at desc);

create index if not exists survey_response_archives_slug_idx
  on public.survey_response_archives (survey_slug, archived_at desc);

comment on table public.survey_response_archives is
  '제출 직후 응답 스냅샷(운영 테이블 삭제 시 복구용). response_id는 FK 없이 보관';

create table if not exists public.survey_response_backups (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references public.surveys (id) on delete set null,
  survey_slug text not null,
  survey_title text not null,
  source text not null,
  label text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  response_count integer not null default 0,
  answer_row_count integer not null default 0,
  payload jsonb not null,
  constraint survey_response_backups_source_check
    check (source in ('manual', 'before_edit', 'auto_submit'))
);

create index if not exists survey_response_backups_survey_idx
  on public.survey_response_backups (survey_id, created_at desc);

create index if not exists survey_response_backups_slug_idx
  on public.survey_response_backups (survey_slug, created_at desc);

comment on table public.survey_response_backups is
  '설문 응답 전체 스냅샷(수동·설문 수정 전 자동 백업)';

alter table public.survey_response_archives enable row level security;
alter table public.survey_response_backups enable row level security;
