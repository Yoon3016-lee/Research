-- 조사·서비스 문의 (공개 폼 제출 → 관리자 처리)

create table if not exists public.site_inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_type text not null check (inquiry_type in ('survey', 'service')),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  name text not null,
  organization text,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  admin_note text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_inquiries_name_nonempty check (char_length(trim(name)) > 0),
  constraint site_inquiries_email_nonempty check (char_length(trim(email)) > 0),
  constraint site_inquiries_subject_nonempty check (char_length(trim(subject)) > 0),
  constraint site_inquiries_message_nonempty check (char_length(trim(message)) > 0)
);

create index if not exists site_inquiries_submitted_idx
  on public.site_inquiries (submitted_at desc);

create index if not exists site_inquiries_status_idx
  on public.site_inquiries (status, submitted_at desc);

create index if not exists site_inquiries_type_idx
  on public.site_inquiries (inquiry_type, submitted_at desc);

alter table public.site_inquiries enable row level security;

comment on table public.site_inquiries is '조사·서비스 문의 (공개 /inquiry 폼 제출, service_role만 쓰기)';
