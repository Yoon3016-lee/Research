-- 설문별 전화 조사용 응답 스크립트(직원 메뉴얼)
alter table public.surveys
  add column if not exists response_script text not null default '';

comment on column public.surveys.response_script is
  '직원이 설문 입력 시 참고하는 전화 조사·응답 가이드(스크립트 확인 팝업)';

-- PostgREST 스키마 캐시 갱신
notify pgrst, 'reload schema';
