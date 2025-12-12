# Vercel 환경변수 설정 가이드

## 필요한 환경변수

다음 3개의 환경변수를 Vercel에 설정해야 합니다:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`

## 현재 프로젝트 정보

- **프로젝트 ID**: `mvzyctaetrtgdbaroaou`
- **프로젝트 URL**: `https://mvzyctaetrtgdbaroaou.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12enljdGFldHJ0Z2RiYXJvYW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTI3ODcsImV4cCI6MjA3OTc4ODc4N30.3TVGzoiUu8r5oExVoqo_u3pZJJDLUraY32MpKTLQiJc`

## Vercel에 환경변수 설정하는 방법

### 방법 1: Vercel 대시보드에서 설정 (권장)

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard 에 로그인

2. **프로젝트 선택**
   - 배포된 프로젝트를 클릭

3. **Settings 메뉴로 이동**
   - 상단 메뉴에서 **Settings** 클릭

4. **Environment Variables 섹션**
   - 왼쪽 사이드바에서 **Environment Variables** 클릭

5. **환경변수 추가**
   다음 3개를 각각 추가:

   **첫 번째 환경변수:**
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://mvzyctaetrtgdbaroaou.supabase.co`
   - Environment: `Production`, `Preview`, `Development` 모두 선택
   - **Save** 클릭

   **두 번째 환경변수:**
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12enljdGFldHJ0Z2RiYXJvYW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTI3ODcsImV4cCI6MjA3OTc4ODc4N30.3TVGzoiUu8r5oExVoqo_u3pZJJDLUraY32MpKTLQiJc`
   - Environment: `Production`, `Preview`, `Development` 모두 선택
   - **Save** 클릭

   **세 번째 환경변수 (서비스 롤 키):**
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: (아래에서 확인 방법 참조)
   - Environment: `Production`, `Preview`, `Development` 모두 선택
   - ⚠️ **주의**: 이 키는 서버 전용이므로 클라이언트에 노출되지 않습니다
   - **Save** 클릭

6. **재배포**
   - 환경변수 추가 후 **Deployments** 탭으로 이동
   - 최신 배포의 **...** 메뉴에서 **Redeploy** 클릭
   - 또는 새 커밋을 푸시하면 자동으로 재배포됩니다

### 방법 2: Vercel CLI 사용

터미널에서 다음 명령어를 실행:

```bash
# Vercel CLI 설치 (없는 경우)
npm i -g vercel

# Vercel 로그인
vercel login

# 프로젝트 디렉토리에서 환경변수 추가
vercel env add NEXT_PUBLIC_SUPABASE_URL
# 프롬프트에 값 입력: https://mvzyctaetrtgdbaroaou.supabase.co
# Environment 선택: Production, Preview, Development 모두

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# 프롬프트에 값 입력: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12enljdGFldHJ0Z2RiYXJvYW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTI3ODcsImV4cCI6MjA3OTc4ODc4N30.3TVGzoiUu8r5oExVoqo_u3pZJJDLUraY32MpKTLQiJc

vercel env add SUPABASE_SERVICE_ROLE_KEY
# 프롬프트에 값 입력: (Supabase 대시보드에서 확인한 값)
```

## Supabase Service Role Key 확인 방법

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard/project/mvzyctaetrtgdbaroaou

2. **Settings 메뉴**
   - 왼쪽 사이드바에서 **Settings** (⚙️) 클릭

3. **API 섹션**
   - **API** 메뉴 클릭

4. **Service Role Key 확인**
   - **Project API keys** 섹션에서
   - **service_role** 키 찾기 (⚠️ 주의: 이 키는 비밀입니다!)
   - **Reveal** 버튼을 클릭하여 키 표시
   - 키를 복사

5. **Vercel에 추가**
   - 위의 방법으로 `SUPABASE_SERVICE_ROLE_KEY` 환경변수에 추가

## 환경변수 확인

설정 후 다음을 확인하세요:

1. **Vercel 대시보드**에서 환경변수가 올바르게 설정되었는지 확인
2. **재배포** 후 애플리케이션이 정상 작동하는지 확인
3. 브라우저 콘솔에서 에러가 없는지 확인

## 문제 해결

### "Supabase 서버 환경변수가 설정되지 않았습니다" 에러가 계속 발생하는 경우:

1. 환경변수 이름이 정확한지 확인 (대소문자 구분)
2. 모든 환경(Production, Preview, Development)에 설정되었는지 확인
3. 재배포를 실행했는지 확인
4. Vercel 대시보드의 **Settings > Environment Variables**에서 값이 올바른지 확인

### 로컬 개발 환경 설정

로컬에서도 동일한 환경변수를 `.env.local` 파일에 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mvzyctaetrtgdbaroaou.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12enljdGFldHJ0Z2RiYXJvYW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTI3ODcsImV4cCI6MjA3OTc4ODc4N30.3TVGzoiUu8r5oExVoqo_u3pZJJDLUraY32MpKTLQiJc
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

