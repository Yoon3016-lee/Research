# DB 구조도

마이그레이션(`supabase/migrations`) 기준 ER 다이어그램입니다.

| 파일 | 내용 |
|------|------|
| `01-er-core-survey.png` | 설문·문항·보기·응답·표본(CATI) 코어 |
| `02-er-platform.png` | Auth · CMS · KSIC · Storage |

재생성: `node scripts/generate-db-diagrams.mjs`
