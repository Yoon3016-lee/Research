-- ABOUT PRIME AX > 회사 소개: ZIP about-reference 보드 CMS 페이지

insert into public.site_pages (slug, title, body)
values (
  'company-intro',
  '회사 소개',
  '<!-- primeax:about-company -->'
)
on conflict (slug) do update
set
  title = excluded.title,
  body = case
    when trim(coalesce(public.site_pages.body, '')) = ''
      or public.site_pages.body like '%primeax:about-company%'
    then excluded.body
    else public.site_pages.body
  end;

insert into public.site_nav_items (group_key, label, href, sort_order, page_id)
select
  'intro',
  '회사 소개',
  '/p/company-intro',
  1,
  p.id
from public.site_pages p
where p.slug = 'company-intro'
  and not exists (
    select 1
    from public.site_nav_items
    where group_key = 'intro'
      and href = '/p/company-intro'
  );

-- 기존 "회사 소개" 메뉴가 다른 slug에 연결된 경우 page_id만 동기화
update public.site_nav_items i
set page_id = p.id
from public.site_pages p
where p.slug = 'company-intro'
  and i.group_key = 'intro'
  and i.label = '회사 소개'
  and i.href = '/p/company-intro'
  and (i.page_id is distinct from p.id);
