-- CATI 전체 설문 공통(기본) 컨택 결과 선택지
-- 개별 설문에 저장된 선택지가 없으면 이 전역 선택지를 사용하고,
-- 전역도 비어 있으면 앱 내장 기본 선택지(11종)를 사용한다.

create table if not exists public.cati_contact_options_global (
  id uuid primary key default gen_random_uuid(),
  position integer not null,
  label text not null,
  is_success boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cati_contact_options_global_position_positive check (position > 0),
  constraint cati_contact_options_global_label_not_blank check (length(btrim(label)) > 0),
  constraint cati_contact_options_global_position_unique unique (position)
);

comment on table public.cati_contact_options_global is 'CATI 전체 설문 공통 컨택 결과 선택지 (설문별 설정이 없을 때 기본값)';

alter table public.cati_contact_options_global enable row level security;

-- 읽기·쓰기는 service_role(서버 액션) 경유
