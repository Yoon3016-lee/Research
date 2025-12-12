# 로컬 환경변수 설정 가이드

## 문제: "Invalid API key" 오류

이 오류는 `.env.local` 파일이 없거나 잘못된 API 키가 설정되어 있을 때 발생합니다.

## 해결 방법

### 1. `.env.local` 파일 생성

프로젝트 루트 디렉토리(`C:\Users\sy968\Desktop\research-a`)에 `.env.local` 파일을 생성하세요.

### 2. 다음 내용을 복사하여 붙여넣기

```env
NEXT_PUBLIC_SUPABASE_URL=https://mvzyctaetrtgdbaroaou.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12enljdGFldHJ0Z2RiYXJvYW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTI3ODcsImV4cCI6MjA3OTc4ODc4N30.3TVGzoiUu8r5oExVoqo_u3pZJJDLUraY32MpKTLQiJc

# 서비스 롤 키 (서버 전용)
# ⚠️ 아래 값을 Supabase 대시보드에서 가져와서 교체하세요:
# 1. https://supabase.com/dashboard/project/mvzyctaetrtgdbaroaou 접속
# 2. Settings > API 메뉴 클릭
# 3. "service_role" 키 옆의 "Reveal" 버튼 클릭
# 4. 복사한 키를 아래 값에 붙여넣기
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. SUPABASE_SERVICE_ROLE_KEY 가져오기

1. 브라우저에서 [Supabase 대시보드](https://supabase.com/dashboard/project/mvzyctaetrtgdbaroaou) 접속
2. 왼쪽 메뉴에서 **Settings** 클릭
3. **API** 메뉴 클릭
4. **service_role** 키 섹션에서 **Reveal** 버튼 클릭
5. 표시된 키를 복사
6. `.env.local` 파일의 `SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here` 부분을 복사한 키로 교체

예시:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12enljdGFldHJ0Z2RiYXJvYW91Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxMjc4NywiZXhwIjoyMDc5Nzg4Nzg3fQ.실제키값
```

### 4. Next.js 개발 서버 재시작

환경변수는 서버 시작 시에만 로드되므로, `.env.local` 파일을 수정한 후 **반드시 개발 서버를 재시작**해야 합니다.

1. 현재 실행 중인 `npm run dev` 프로세스를 중지 (Ctrl + C)
2. 다시 실행:
   ```bash
   npm run dev
   ```

### 5. 확인

브라우저에서 `http://localhost:3000`을 새로고침하면 오류가 사라져야 합니다.

## 주의사항

- `.env.local` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 **절대 클라이언트 코드에 노출하지 마세요**. 서버 전용입니다.
- 환경변수를 수정한 후에는 항상 개발 서버를 재시작해야 합니다.

