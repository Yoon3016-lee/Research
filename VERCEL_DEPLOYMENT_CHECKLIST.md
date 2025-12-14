# Vercel 배포 전 체크리스트

## ✅ 빌드 확인 완료
- [x] `npm run build` 성공적으로 완료
- [x] 타입 오류 없음
- [x] ESLint 경고 없음

## 📋 배포 전 필수 확인 사항

### 1. 환경변수 설정 (Vercel 대시보드)

다음 환경변수들이 모두 설정되어 있는지 확인하세요:

#### Supabase 관련 (3개)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anon Key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key

#### 이메일 관련 (5개)
- [ ] `EMAIL_HOST` - `smtp.gmail.com` (Gmail 사용 시)
- [ ] `EMAIL_PORT` - `587` (Gmail 사용 시)
- [ ] `EMAIL_USER` - 이메일 주소
- [ ] `EMAIL_PASSWORD` - Gmail 앱 비밀번호 (16자리, 공백 없이)
- [ ] `EMAIL_FROM` - 발신자 이메일 주소

#### 기타 (1개)
- [ ] `NEXT_PUBLIC_BASE_URL` - 배포된 사이트 URL (예: `https://your-project.vercel.app`)

**설정 방법**: Vercel 대시보드 → 프로젝트 → Settings → Environment Variables

### 2. Git 저장소 확인

- [ ] 모든 변경사항이 커밋되어 있는지 확인
- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인 (민감 정보 보호)
- [ ] 불필요한 파일이 커밋되지 않았는지 확인

### 3. Vercel 프로젝트 설정

- [ ] Vercel에 프로젝트가 연결되어 있는지 확인
- [ ] 빌드 명령어: `npm run build` (기본값)
- [ ] 출력 디렉토리: `.next` (기본값)
- [ ] Node.js 버전: 20.x (권장)

### 4. 데이터베이스 확인

- [ ] Supabase 프로젝트가 활성화되어 있는지 확인
- [ ] 필요한 테이블이 모두 생성되어 있는지 확인:
  - `users`
  - `surveys`
  - `survey_questions`
  - `survey_responses`
  - `survey_answers`
  - `verification_codes`
  - `question_templates`
  - `survey_recipients`
- [ ] RLS (Row Level Security) 정책이 올바르게 설정되어 있는지 확인

### 5. 이메일 설정 확인

- [ ] Gmail 앱 비밀번호가 생성되어 있는지 확인
- [ ] `EMAIL_PASSWORD`에 앱 비밀번호가 설정되어 있는지 확인 (일반 비밀번호 아님)
- [ ] `NEXT_PUBLIC_BASE_URL`이 올바른 배포 URL인지 확인

## 🚀 배포 절차

1. **Git에 푸시**
   ```bash
   git add .
   git commit -m "배포 준비 완료"
   git push origin main
   ```

2. **Vercel 자동 배포 확인**
   - Vercel이 자동으로 배포를 시작합니다
   - 대시보드에서 배포 상태를 확인하세요

3. **배포 후 확인**
   - [ ] 사이트가 정상적으로 로드되는지 확인
   - [ ] 로그인 기능이 작동하는지 확인
   - [ ] 설문 생성 기능이 작동하는지 확인
   - [ ] 이메일 발송 기능이 작동하는지 확인 (테스트)

## 🔍 배포 후 문제 해결

### 환경변수 오류
- Vercel 대시보드에서 환경변수가 올바르게 설정되었는지 확인
- 환경변수 추가 후 **재배포** 필요

### 데이터베이스 연결 오류
- Supabase 프로젝트가 활성화되어 있는지 확인
- API 키가 올바른지 확인
- RLS 정책이 올바르게 설정되어 있는지 확인

### 이메일 발송 오류
- Gmail 앱 비밀번호가 올바른지 확인
- `NEXT_PUBLIC_BASE_URL`이 올바른지 확인
- Vercel 함수 로그에서 상세 오류 확인

## 📝 참고 문서

- [Vercel 환경변수 설정 가이드](./VERCEL_ENV_VARIABLES_GUIDE.md)
- [Gmail 앱 비밀번호 설정 가이드](./GMAIL_APP_PASSWORD_GUIDE.md)

