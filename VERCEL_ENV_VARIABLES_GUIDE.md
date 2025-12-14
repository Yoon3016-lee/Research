# Vercel 환경변수 설정 가이드

`.env.local` 파일에 설정한 환경변수를 Vercel에 적용하는 방법입니다.

## 설정 방법

### 1단계: Vercel 대시보드 접속

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. 프로젝트 목록에서 **설문조사 프로젝트** 선택

### 2단계: 환경변수 설정 페이지로 이동

1. 프로젝트 페이지 상단 메뉴에서 **Settings** 클릭
2. 왼쪽 사이드바에서 **Environment Variables** 클릭

또는 직접 링크:
- 프로젝트 URL: `https://vercel.com/[your-username]/[project-name]/settings/environment-variables`

### 3단계: 환경변수 추가

각 환경변수를 하나씩 추가합니다:

#### Supabase 관련 변수

1. **`NEXT_PUBLIC_SUPABASE_URL`**
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: Supabase 프로젝트의 URL (예: `https://xxxxx.supabase.co`)
   - Environment: **Production**, **Preview**, **Development** 모두 선택

2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: Supabase 프로젝트의 Anon Key
   - Environment: **Production**, **Preview**, **Development** 모두 선택

3. **`SUPABASE_SERVICE_ROLE_KEY`**
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Supabase 프로젝트의 Service Role Key (⚠️ 민감 정보)
   - Environment: **Production**, **Preview**, **Development** 모두 선택

#### 이메일 관련 변수

4. **`EMAIL_HOST`**
   - Key: `EMAIL_HOST`
   - Value: `smtp.gmail.com` (Gmail 사용 시)
   - Environment: **Production**, **Preview**, **Development** 모두 선택

5. **`EMAIL_PORT`**
   - Key: `EMAIL_PORT`
   - Value: `587` (Gmail 사용 시)
   - Environment: **Production**, **Preview**, **Development** 모두 선택

6. **`EMAIL_USER`**
   - Key: `EMAIL_USER`
   - Value: 이메일 주소 (예: `your-email@gmail.com`)
   - Environment: **Production**, **Preview**, **Development** 모두 선택

7. **`EMAIL_PASSWORD`**
   - Key: `EMAIL_PASSWORD`
   - Value: Gmail 앱 비밀번호 (16자리, 공백 없이)
   - Environment: **Production**, **Preview**, **Development** 모두 선택

8. **`EMAIL_FROM`**
   - Key: `EMAIL_FROM`
   - Value: 발신자 이메일 주소 (보통 `EMAIL_USER`와 동일)
   - Environment: **Production**, **Preview**, **Development** 모두 선택

#### 기타 변수

9. **`NEXT_PUBLIC_BASE_URL`**
   - Key: `NEXT_PUBLIC_BASE_URL`
   - Value: 배포된 사이트 URL (예: `https://your-project.vercel.app`)
   - Environment: **Production**, **Preview**, **Development** 모두 선택

### 4단계: 환경변수 추가 방법

각 환경변수마다:

1. **Key** 입력란에 변수 이름 입력 (예: `EMAIL_HOST`)
2. **Value** 입력란에 값 입력 (예: `smtp.gmail.com`)
3. **Environment** 체크박스 선택:
   - ✅ **Production** (프로덕션 배포용)
   - ✅ **Preview** (프리뷰 배포용)
   - ✅ **Development** (개발용, 선택사항)
4. **Save** 버튼 클릭

### 5단계: 재배포

환경변수를 추가한 후:

1. 프로젝트 페이지로 돌아가기
2. **Deployments** 탭 클릭
3. 최신 배포의 **⋯** (점 3개) 메뉴 클릭
4. **Redeploy** 선택
   - 또는 새 커밋을 푸시하면 자동으로 재배포됩니다

## 환경변수 확인 방법

### Vercel 대시보드에서 확인

1. **Settings** → **Environment Variables** 페이지에서 모든 변수 확인 가능
2. 값은 마스킹되어 표시됩니다 (보안상 이유)

### 배포 로그에서 확인

환경변수가 제대로 로드되었는지 확인:

1. **Deployments** 탭 → 최신 배포 클릭
2. **Build Logs** 또는 **Function Logs** 확인
3. 환경변수 관련 오류가 없는지 확인

## 주의사항

### ⚠️ 보안

- **`SUPABASE_SERVICE_ROLE_KEY`**와 **`EMAIL_PASSWORD`**는 민감한 정보입니다
- Vercel에서는 값이 마스킹되어 표시되지만, 절대 공유하지 마세요
- 환경변수는 암호화되어 저장됩니다

### ✅ 환경별 설정

- **Production**: 실제 사용자에게 제공되는 프로덕션 환경
- **Preview**: Pull Request나 브랜치별 프리뷰 환경
- **Development**: 로컬 개발 환경 (선택사항)

대부분의 경우 **Production**과 **Preview**만 선택하면 됩니다.

### 🔄 변경 사항 반영

환경변수를 추가/수정한 후에는 **반드시 재배포**해야 변경사항이 적용됩니다.

## 빠른 체크리스트

다음 환경변수가 모두 설정되었는지 확인하세요:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `EMAIL_HOST`
- [ ] `EMAIL_PORT`
- [ ] `EMAIL_USER`
- [ ] `EMAIL_PASSWORD` (Gmail 앱 비밀번호)
- [ ] `EMAIL_FROM`
- [ ] `NEXT_PUBLIC_BASE_URL`

## 문제 해결

### 환경변수가 적용되지 않는 경우

1. **재배포 확인**: 환경변수 추가 후 재배포했는지 확인
2. **환경 선택 확인**: Production/Preview 환경이 선택되었는지 확인
3. **변수 이름 확인**: 대소문자, 언더스코어(`_`) 정확히 입력했는지 확인
4. **값 확인**: 공백이나 특수문자가 잘못 입력되지 않았는지 확인

### 이메일 발송이 실패하는 경우

1. `EMAIL_PASSWORD`가 Gmail 앱 비밀번호인지 확인 (일반 비밀번호 아님)
2. `NEXT_PUBLIC_BASE_URL`이 올바른 배포 URL인지 확인
3. Vercel 함수 로그에서 상세 오류 확인

## 참고 링크

- [Vercel 환경변수 문서](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel 대시보드](https://vercel.com/dashboard)

