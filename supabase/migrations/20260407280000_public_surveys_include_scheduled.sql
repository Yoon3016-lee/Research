-- 공개 목록: 진행중 + 예정(시작 전) 설문 조회 허용 (종료는 제외)

drop policy if exists "public_read_ongoing_listed_surveys" on public.surveys;

create policy "public_read_listed_active_surveys"
  on public.surveys
  for select
  to anon, authenticated
  using (listed_public = true and status in ('진행중', '예정'));
