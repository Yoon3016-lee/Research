-- 예전 마이그레이션에 포함되던 데모 설문 시드 제거
-- SQL Editor에서 실행하거나, 신규 DB에는 적용 불필요

delete from public.surveys
where slug in ('sv-2026-q1', 'sv-brand', 'sv-hr', 'sv-pilot');
