-- 이미 user_id PK 전용으로 099를 적용한 경우를 위한 마이그레이션
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ksic_recommend_usage'
      and column_name = 'user_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ksic_recommend_usage'
      and column_name = 'visitor_key'
  ) then
    alter table public.ksic_recommend_usage
      add column if not exists id uuid,
      add column if not exists visitor_key text;

    update public.ksic_recommend_usage
    set id = gen_random_uuid()
    where id is null;

    alter table public.ksic_recommend_usage
      alter column id set default gen_random_uuid(),
      alter column id set not null;

    -- 기존 PK(user_id) 제거 후 id PK
    alter table public.ksic_recommend_usage drop constraint if exists ksic_recommend_usage_pkey;
    alter table public.ksic_recommend_usage
      add constraint ksic_recommend_usage_pkey primary key (id);

    alter table public.ksic_recommend_usage
      alter column user_id drop not null;

    alter table public.ksic_recommend_usage
      drop constraint if exists ksic_recommend_usage_user_id_key;

    create unique index if not exists ksic_recommend_usage_user_id_key
      on public.ksic_recommend_usage (user_id)
      where user_id is not null;

    create unique index if not exists ksic_recommend_usage_visitor_key_key
      on public.ksic_recommend_usage (visitor_key)
      where visitor_key is not null;

    alter table public.ksic_recommend_usage
      drop constraint if exists ksic_recommend_usage_subject_check;

    alter table public.ksic_recommend_usage
      add constraint ksic_recommend_usage_subject_check check (
        (user_id is not null and visitor_key is null)
        or (user_id is null and visitor_key is not null)
      );

    comment on table public.ksic_recommend_usage is
      '공개 홈 KSIC 비정형 후보 추론 체험 횟수 (회원 또는 비로그인 방문자)';
  end if;
end $$;
