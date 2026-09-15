-- 객관식 보기 자동완성 템플릿 (설문 관리에서 CRUD, 문항 편집기에서 불러오기)
create table if not exists public.survey_option_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  options jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint survey_option_templates_title_nonempty check (char_length(trim(title)) > 0),
  constraint survey_option_templates_options_is_array check (jsonb_typeof(options) = 'array')
);

create index if not exists survey_option_templates_sort_idx
  on public.survey_option_templates (sort_order, created_at);

comment on table public.survey_option_templates is
  '객관식(단일·다중·순위 등) 보기 자동완성용 템플릿. 관리자가 저장·문항 편집기에서 불러옴';

alter table public.survey_option_templates enable row level security;
