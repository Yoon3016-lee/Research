-- PRIME AX 공개 상단 메뉴 6구조
-- ABOUT / RESEARCH SERVICES / AI SOLUTIONS / PERFORMANCE / SURVEY PLAZA / PROJECT INQUIRY

-- 기존 탭 이름·순서 정리
update public.site_nav_groups
set label = 'ABOUT PRIME AX', sort_order = 0
where key = 'intro';

update public.site_nav_groups
set label = 'RESEARCH SERVICES', sort_order = 1
where key = 'service';

update public.site_nav_groups
set label = 'SURVEY PLAZA', sort_order = 4
where key = 'survey';

-- 문의하기 → PROJECT INQUIRY (이미 있으면 경우)
update public.site_nav_groups
set
  label = 'PROJECT INQUIRY ↗',
  href = case when trim(coalesce(href, '')) = '' then '/inquiry' else href end,
  sort_order = 5
where key = 'inquiry'
   or label in ('문의하기', 'PROJECT INQUIRY', 'PROJECT INQUIRY ↗');

-- 신규 탭
insert into public.site_nav_groups (key, label, sort_order, href)
values
  ('ai', 'AI SOLUTIONS', 2, ''),
  ('performance', 'PERFORMANCE', 3, ''),
  ('inquiry', 'PROJECT INQUIRY ↗', 5, '/inquiry')
on conflict (key) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  href = case
    when excluded.key = 'inquiry' and trim(coalesce(public.site_nav_groups.href, '')) = ''
      then excluded.href
    when excluded.key = 'inquiry'
      then public.site_nav_groups.href
    else public.site_nav_groups.href
  end;

-- 기술소개(/services)는 AI SOLUTIONS로 이동
update public.site_nav_items
set group_key = 'ai'
where group_key = 'service'
  and href in ('/services', '/services/');

-- 기본 하위 메뉴 (같은 href가 없을 때만 추가)
insert into public.site_nav_items (group_key, label, href, sort_order)
select 'intro', 'PRIME AX 소개', '/#why', 0
where not exists (
  select 1 from public.site_nav_items where group_key = 'intro' and href = '/#why'
);

insert into public.site_nav_items (group_key, label, href, sort_order)
select 'service', '리서치 서비스', '/#services', 0
where not exists (
  select 1 from public.site_nav_items where group_key = 'service' and href = '/#services'
);

insert into public.site_nav_items (group_key, label, href, sort_order)
select 'ai', '기술소개', '/services', 0
where not exists (
  select 1 from public.site_nav_items where group_key = 'ai' and href in ('/services', '/services/')
);

insert into public.site_nav_items (group_key, label, href, sort_order)
select 'ai', 'KSIC ENGINE', '/#engine', 1
where not exists (
  select 1 from public.site_nav_items where group_key = 'ai' and href = '/#engine'
);

insert into public.site_nav_items (group_key, label, href, sort_order)
select 'ai', 'AXI', '/#axi', 2
where not exists (
  select 1 from public.site_nav_items where group_key = 'ai' and href = '/#axi'
);

insert into public.site_nav_items (group_key, label, href, sort_order)
select 'performance', '수행 역량·실적', '/#proof', 0
where not exists (
  select 1 from public.site_nav_items where group_key = 'performance' and href = '/#proof'
);

insert into public.site_nav_items (group_key, label, href, sort_order)
select 'survey', '설문광장', '/surveys', 0
where not exists (
  select 1 from public.site_nav_items where group_key = 'survey' and href = '/surveys'
);

update public.site_nav_items
set label = '설문광장'
where group_key = 'survey'
  and href = '/surveys'
  and label in ('진행중 설문', '진행 중 설문');
