-- 관리자 계정(profiles) · 가입키(admin_settings)
-- SQL Editor에서 기존 마이그레이션 이후 실행

-- ---------------------------------------------------------------------------
-- 직원·관리자 역할 (앱에서 동일 문자열 사용)
-- super_admin | sub_admin | team_lead | employee | guest
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'guest',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (
    role in (
      'super_admin',
      'sub_admin',
      'team_lead',
      'employee',
      'guest'
    )
  )
);

create index if not exists profiles_role_idx on public.profiles (role);

-- 단일 행 설정 (가입키)
create table if not exists public.admin_settings (
  id int primary key default 1,
  signup_key text not null,
  updated_at timestamptz not null default now(),
  constraint admin_settings_singleton check (id = 1)
);

insert into public.admin_settings (id, signup_key)
values (1, 'test1234')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

create or replace function public.is_super_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid ()
      and role = 'super_admin'
  );
$$;

-- 본인 프로필 조회 + 총관리자는 전체 조회
create policy "profiles_select_self_or_super"
  on public.profiles
  for select
  to authenticated
  using (
    id = auth.uid ()
    or public.is_super_admin ()
  );

-- 본인 이메일·역할은 이후 정책으로 좁힐 수 있음 (현재는 서버에서 service role로 갱신)
alter table public.admin_settings enable row level security;
-- anon/authenticated는 정책 없음 → 직접 조회 불가. 앱은 service_role로만 읽기/쓰기.

comment on table public.profiles is '관리자·직원 역할. Auth users와 1:1';
comment on table public.admin_settings is '관리자 회원가입용 비밀키(단일 행). 서버(service_role)에서만 접근 권장';
