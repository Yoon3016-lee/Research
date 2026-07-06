-- KSIC 외부 검증 스냅샷 (공공데이터포털 · 무역보험공사 업종등급목록 등)
create table if not exists public.ksic_external_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  revision smallint not null default 11,
  status text not null check (status in ('running', 'success', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_fetched integer not null default 0,
  records_upserted integer not null default 0,
  api_calls integer not null default 0,
  error_message text,
  diff_summary jsonb not null default '{}'::jsonb
);

create table if not exists public.ksic_external_codes (
  revision smallint not null default 11,
  source text not null default 'ksure_industry_level',
  code text not null,
  name_ko text not null default '',
  industry_level smallint,
  parent_code text,
  raw jsonb not null default '{}'::jsonb,
  sync_run_id uuid references public.ksic_external_sync_runs (id) on delete set null,
  synced_at timestamptz not null default now(),
  constraint ksic_external_codes_pkey primary key (revision, source, code)
);

create index if not exists ksic_external_codes_name_idx
  on public.ksic_external_codes (revision, source, name_ko);

create index if not exists ksic_external_sync_runs_started_idx
  on public.ksic_external_sync_runs (source, started_at desc);

alter table public.ksic_external_sync_runs enable row level security;
alter table public.ksic_external_codes enable row level security;
