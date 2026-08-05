-- 설문에 AI·수동 입력 KSIC(한국표준산업분류) 코드·명칭 저장
alter table public.surveys
  add column if not exists ksic_code text not null default '',
  add column if not exists ksic_name text not null default '';

comment on column public.surveys.ksic_code is '한국표준산업분류(KSIC) 코드';
comment on column public.surveys.ksic_name is 'KSIC 분류명';

create index if not exists surveys_ksic_code_idx
  on public.surveys (ksic_code)
  where ksic_code <> '';
