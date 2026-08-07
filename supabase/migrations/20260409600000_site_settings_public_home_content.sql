-- 공개 홈페이지(PRIME AX 랜딩) 편집 가능한 본문 JSON

alter table public.site_settings
  add column if not exists public_home_content jsonb;

comment on column public.site_settings.public_home_content is
  '공개 홈(/) 랜딩 문구·연락처·섹션 표시 설정';
