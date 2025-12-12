## 프로젝트 개요

Next.js(App Router) 기반 설문조사 리서치 웹앱입니다. 현재 버전은 Supabase를 정식 데이터 계층으로 사용하도록 구성되어 있으며, 설문·문항·응답이 모두 Supabase 테이블에 저장됩니다.

## 로컬 개발

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 UI를 확인하세요.

## Supabase 연동

✅ **데이터베이스 스키마가 이미 생성되었습니다!**

현재 사용 중인 프로젝트: **ResearchDataBase** (`mvzyctaetrtgdbaroaou`)

생성된 테이블:
- `users` - 사용자 인증 및 역할 관리
- `surveys` - 설문조사 메타데이터
- `survey_questions` - 설문 문항
- `survey_responses` - 설문 응답 헤더
- `survey_answers` - 문항별 답변

초기 시드 사용자 데이터도 삽입되었습니다:
- `emp-001` / `pass1234` (직원)
- `mgr-001` / `admin123` (관리자)
- `mst-001` / `master123` (마스터)

### 환경변수 설정

`.env.local` 파일을 생성하고 다음 값을 입력하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mvzyctaetrtgdbaroaou.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12enljdGFldHJ0Z2RiYXJvYW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTI3ODcsImV4cCI6MjA3OTc4ODc4N30.3TVGzoiUu8r5oExVoqo_u3pZJJDLUraY32MpKTLQiJc

# 서비스 롤 키 (서버 전용)
# Supabase 대시보드 > Settings > API > service_role key에서 확인
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ **중요**: `SUPABASE_SERVICE_ROLE_KEY`는 Supabase 대시보드에서 직접 가져와야 합니다. Vercel 배포 시에도 동일한 키를 환경변수로 등록하세요. 이 키는 **서버 전용**이므로 클라이언트에 노출하지 마세요.

### Vercel 배포 시 환경변수 설정

Vercel에 배포한 경우 다음 환경변수를 설정해야 합니다:

1. **Vercel 대시보드** → 프로젝트 선택 → **Settings** → **Environment Variables**
2. 다음 3개 환경변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://mvzyctaetrtgdbaroaou.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12enljdGFldHJ0Z2RiYXJvYW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTI3ODcsImV4cCI6MjA3OTc4ODc4N30.3TVGzoiUu8r5oExVoqo_u3pZJJDLUraY32MpKTLQiJc`
   - `SUPABASE_SERVICE_ROLE_KEY`: (Supabase 대시보드 > Settings > API > service_role key)

3. **모든 환경** (Production, Preview, Development)에 설정
4. 환경변수 추가 후 **재배포** 필요

자세한 설정 방법은 `VERCEL_ENV_SETUP.md` 파일을 참조하세요.

## 주요 디렉터리

- `app/page.tsx` : 역할 기반 UI + 설문 CRUD + 응답 제출 클라이언트 로직
- `app/api/surveys/route.ts` : 설문 조회/생성 API (GET/POST)
- `app/api/responses/route.ts` : 응답 저장 API (POST)
- `app/api/auth/login/route.ts` : 로그인 API (POST)
- `app/api/auth/signup/route.ts` : 회원가입 API (POST)
- `lib/supabase/*` : 브라우저/서버용 Supabase 클라이언트와 DB 타입
- `supabase/schema.sql` : DB 스키마 정의 (이미 적용됨)

## 추천 워크플로

1. `.env.local` 설정 후 `npm run dev`
2. 회원가입 → 로그인 → 설문 생성 → 응답 제출
3. 관리자/마스터 뷰에서 실시간 응답 집계 확인

필요 시 `lib/supabase/types.ts`를 Supabase CLI(`supabase gen types typescript ...`)로 재생성하면 Prisma/TypeScript 타입을 최신 스키마에 맞출 수 있습니다.
