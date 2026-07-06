# research-a

Next.js(App Router) + TypeScript + Tailwind CSS 4 기반 **설문·리서치** 웹앱입니다.  
**공개(참여자) 영역**과 **관리자 영역**이 URL로 분리되어 있습니다.

## 로컬에서 확인

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 을 엽니다.

| 구분 | 경로 | 설명 |
|------|------|------|
| 메인 | `/` | 랜딩·안내 |
| 진행중 설문 | `/surveys` | Supabase `surveys` (공개·진행중·예정) |
| 서비스 | `/services` | 안내·데모 챗봇 |
| 관리자 로그인 | `/admin/login` | 이메일·비밀번호 |
| 관리자 회원가입 | `/admin/signup` | 가입키 + 이메일·비밀번호 |
| 관리자 홈 | `/admin` | 대시보드·요약 (로그인 필요) |
| 가입키 설정 | `/admin/settings` | 총관리자만 |
| 설문 관리 | `/admin/surveys` | Supabase 설문 목록·편집 |
| 새 설문 | `/admin/surveys/new` | 문항·유형·무응답 허용 등 작성 후 저장 |
| 이메일 | `/admin/emails` | 발송·캠페인(데모, 미연동) |
| 진행·업무 | `/admin/progress` | 설문 진행도·작업량·응답 분석 |

설문·직원 업무·응답 통계는 **Supabase**와 연동됩니다. 환경 변수가 없거나 Service Role 키가 없으면 설문 목록은 **빈 배열**로 표시됩니다. **이메일 발송**만 아직 UI 데모입니다.

## Supabase 연결 (최소: `surveys` 테이블)

### 1) 프로젝트에서 키 복사

1. [Supabase 대시보드](https://supabase.com/dashboard)에서 해당 프로젝트 열기  
2. **Project Settings → API**  
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`  
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (서버 전용, Git·클라이언트에 넣지 않음)

### 2) 로컬 `.env.local`

`.env.example`을 참고해 위 세 값을 채웁니다. `npm run dev` 재시작 후 적용됩니다.

### 3) DB 스키마·시드 적용

아래 SQL을 **순서대로** **Supabase → SQL Editor**에 붙여 넣고 실행합니다.

1. `supabase/migrations/20260407140000_surveys_minimal.sql` — 설문 `surveys`  
2. `supabase/migrations/20260407150000_admin_auth_profiles.sql` — `profiles`, `admin_settings`(기본 가입키 `please-change-me`)  
3. `supabase/migrations/20260407160000_survey_questions.sql` — 문항 `survey_questions`, 객관식 선택지 `survey_question_options`

관리자 회원가입은 **가입키**가 DB의 `admin_settings.signup_key`와 일치할 때만 진행됩니다. **첫 가입 계정**은 자동으로 **총관리자(`super_admin`)** 역할이 부여되고, 이후 가입자는 **직원(`employee`)**으로 들어갑니다. 역할 승급은 이후 UI·정책으로 확장하면 됩니다.

**Authentication → Providers → Email**에서 로컬 개발 시 **이메일 인증을 끄면** 바로 로그인까지 테스트하기 쉽습니다.

- 테이블 `public.surveys` 생성  
- RLS: 익명·로그인 사용자는 **`listed_public = true` 이고 `status = '진행중'`** 인 행만 `SELECT`  
- 관리자 화면 전체 목록은 **Service Role**로만 조회(서버 코드 `lib/supabase/admin.ts`)

### 4) 동작 확인

- **`/surveys`**: anon 정책에 맞는 진행중·예정 설문만 표시  
- **`/admin`**, **`/admin/surveys`**, **`/admin/progress`**: Service Role 키가 있으면 Supabase 데이터, 없으면 빈 목록

### 5) Vercel 배포 시

환경 변수에 동일 키를 등록합니다. **`SUPABASE_SERVICE_ROLE_KEY`는 서버에서만** 사용되도록, 클라이언트에 `NEXT_PUBLIC_` 접두사를 붙이지 마세요.

## 환경 변수

### 로컬 환경 파일 목록

| 파일 | 설명 |
|------|------|
| `.env.example` | 저장소에 포함되는 템플릿. 변수 이름·주석만 두고 값은 비웁니다. |
| `.env.local` | **로컬에서만** 쓰는 실제 값을 넣는 파일. Git에 커밋되지 않습니다. |

`.env.example`을 복사해 프로젝트 루트에 `.env.local`을 만든 뒤 값을 채우면 됩니다.

Cursor·VS Code에서 `.gitignore` 때문에 `.env.local`이 사이드바에 안 보일 수 있습니다. 이 저장소는 `.vscode/settings.json`에서 탐색기에 표시되도록 두었습니다 (`node_modules`, `.next`는 계속 숨김). 배포 시에는 Vercel(또는 호스팅) 환경 변수에 동일한 키를 등록합니다.

### 공개 사이트와 관리자 전용 도메인

같은 코드를 **공개용**·**관리자용** Vercel 프로젝트(또는 서브도메인) 두 곳에 올릴 수 있습니다.

| 변수 | 공개 도메인 배포 예시 | 관리자 전용 도메인 배포 예시 |
|------|------------------------|------------------------------|
| `NEXT_PUBLIC_SHOW_PUBLIC_ADMIN_LINK` | `false` (헤더·푸터에 관리자 링크 숨김) | 생략 또는 `true` (내부용으로 `/admin` 링크 유지 가능) |
| `NEXT_PUBLIC_ADMIN_SITE_URL` | (선택) 숨긴 대신 직원용으로 외부 링크만 쓸 때 `https://admin.example.com` | 비우면 기본 `/admin` |

로컬 개발에서는 변수를 비워 두면 기존처럼 오른쪽 상단 **관리자** → `/admin` 으로 이동합니다.
