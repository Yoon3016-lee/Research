-- KSIC 제11차: 계층 마스터 + AI 설문 컨텍스트
create table if not exists public.ksic_codes (
  revision smallint not null default 11,
  sort_order integer not null default 0,
  code text not null,
  level_number smallint not null,
  level_name text not null,
  name_ko text not null,
  name_en text not null default '',
  parent_code text,
  parent_name_ko text not null default '',
  path_ko text not null default '',
  path_en text not null default '',
  major_code text not null default '',
  major_name_ko text not null default '',
  middle_code text not null default '',
  middle_name_ko text not null default '',
  minor_code text not null default '',
  minor_name_ko text not null default '',
  class_code text not null default '',
  class_name_ko text not null default '',
  detail_code text not null default '',
  detail_name_ko text not null default '',
  major_code_range text not null default '',
  definition text not null default '',
  examples text not null default '',
  exclusions text not null default '',
  example_count integer not null default 0,
  exclusion_count integer not null default 0,
  raw_description text not null default '',
  ancestor_context text not null default '',
  ai_context text not null default '',
  child_count integer not null default 0,
  has_description boolean not null default false,
  created_at timestamptz not null default now(),
  constraint ksic_codes_pkey primary key (revision, code),
  constraint ksic_codes_parent_fkey
    foreign key (revision, parent_code)
    references public.ksic_codes (revision, code)
    deferrable initially deferred
);

create index if not exists ksic_codes_revision_level_idx
  on public.ksic_codes (revision, level_number, code);

create index if not exists ksic_codes_name_ko_idx
  on public.ksic_codes (revision, name_ko);

create index if not exists ksic_codes_path_ko_idx
  on public.ksic_codes (revision, path_ko);

create table if not exists public.ksic_detail_ai (
  revision smallint not null default 11,
  detail_code text not null,
  detail_name_ko text not null,
  detail_name_en text not null default '',
  major_code text not null default '',
  major_name_ko text not null default '',
  middle_code text not null default '',
  middle_name_ko text not null default '',
  minor_code text not null default '',
  minor_name_ko text not null default '',
  class_code text not null default '',
  class_name_ko text not null default '',
  path_ko text not null default '',
  detail_definition text not null default '',
  detail_examples text not null default '',
  detail_exclusions text not null default '',
  ancestor_context text not null default '',
  ai_context_for_survey text not null default '',
  major_definition text not null default '',
  middle_definition text not null default '',
  minor_definition text not null default '',
  class_definition text not null default '',
  created_at timestamptz not null default now(),
  constraint ksic_detail_ai_pkey primary key (revision, detail_code),
  constraint ksic_detail_ai_code_fkey
    foreign key (revision, detail_code)
    references public.ksic_codes (revision, code)
    on delete cascade
);

create index if not exists ksic_detail_ai_name_idx
  on public.ksic_detail_ai (revision, detail_name_ko);

alter table public.ksic_codes enable row level security;
alter table public.ksic_detail_ai enable row level security;

-- Service Role(서버) 전용. 클라이언트 직접 조회 없음.
