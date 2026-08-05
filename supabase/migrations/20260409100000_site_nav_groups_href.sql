-- 상단 탭을 드롭다운 없이 바로 이동할 수 있는 링크
alter table public.site_nav_groups
  add column if not exists href text not null default '';

comment on column public.site_nav_groups.href is
  '비어 있지 않으면 상단 탭 클릭 시 해당 경로로 이동 (드롭다운 없음). 예: /inquiry?type=survey';

-- 이미 추가된 「문의하기」 탭이 있으면 기본 문의 페이지로 연결
update public.site_nav_groups
set href = '/inquiry?type=survey'
where label = '문의하기'
  and trim(href) = '';
