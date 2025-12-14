# Gmail 앱 비밀번호 설정 가이드

Gmail을 이메일 발송 서버로 사용하려면 **앱 비밀번호(Application-specific password)**를 사용해야 합니다.

## 문제 상황

다음 오류가 발생하는 경우:
```
Invalid login: 534-5.7.9 Application-specific password required
```

이는 Gmail이 일반 비밀번호 대신 앱 비밀번호를 요구하고 있다는 의미입니다.

## 해결 방법

### 1단계: 2단계 인증 활성화

1. [Google 계정 설정](https://myaccount.google.com/)으로 이동
2. 왼쪽 메뉴에서 **보안** 클릭
3. **Google에 로그인** 섹션에서 **2단계 인증** 확인
   - 이미 활성화되어 있다면 다음 단계로 진행
   - 활성화되지 않았다면 **2단계 인증** 클릭하여 활성화

### 2단계: 앱 비밀번호 생성

1. Google 계정 설정의 **보안** 페이지로 이동
2. **Google에 로그인** 섹션에서 **앱 비밀번호** 클릭
   - 또는 직접 링크: https://myaccount.google.com/apppasswords
3. **앱 선택** 드롭다운에서 **메일** 선택
4. **기기 선택** 드롭다운에서 **기타(맞춤 이름)** 선택
5. 이름 입력 (예: "설문조사 시스템")
6. **생성** 버튼 클릭
7. **16자리 앱 비밀번호**가 표시됩니다 (예: `abcd efgh ijkl mnop`)
   - 공백 없이 복사하세요: `abcdefghijklmnop`

### 3단계: 환경변수 설정

생성된 앱 비밀번호를 `.env.local` 파일에 설정합니다:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop  # 여기에 앱 비밀번호 입력 (공백 없이)
EMAIL_FROM=your-email@gmail.com
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

**중요:**
- `EMAIL_PASSWORD`에는 **일반 Gmail 비밀번호가 아닌 앱 비밀번호**를 입력해야 합니다
- 앱 비밀번호는 공백 없이 16자리입니다
- 앱 비밀번호는 한 번만 표시되므로 안전하게 보관하세요

### 4단계: Vercel 배포 시 환경변수 설정

Vercel에 배포하는 경우:

1. Vercel 대시보드 → 프로젝트 선택 → **Settings** → **Environment Variables**
2. 다음 환경변수 추가:
   - `EMAIL_HOST`: `smtp.gmail.com`
   - `EMAIL_PORT`: `587`
   - `EMAIL_USER`: `your-email@gmail.com`
   - `EMAIL_PASSWORD`: `앱 비밀번호 (16자리, 공백 없이)`
   - `EMAIL_FROM`: `your-email@gmail.com`
   - `NEXT_PUBLIC_BASE_URL`: `https://your-domain.com`

## 보안 주의사항

- 앱 비밀번호는 일반 비밀번호처럼 안전하게 보관하세요
- `.env.local` 파일은 `.gitignore`에 포함되어 있어야 합니다
- 앱 비밀번호가 유출되면 즉시 Google 계정에서 삭제하고 새로 생성하세요

## 문제 해결

### "앱 비밀번호" 옵션이 보이지 않는 경우

- 2단계 인증이 활성화되어 있는지 확인
- Google Workspace 계정의 경우 관리자가 앱 비밀번호를 비활성화했을 수 있습니다

### 여전히 인증 오류가 발생하는 경우

1. 앱 비밀번호를 다시 생성해보세요
2. `.env.local` 파일의 `EMAIL_PASSWORD`가 정확한지 확인 (공백 없이)
3. Vercel에 배포한 경우 환경변수가 올바르게 설정되었는지 확인
4. 서버를 재시작하세요 (`npm run dev` 또는 Vercel 재배포)

## 참고 링크

- [Google 앱 비밀번호 도움말](https://support.google.com/accounts/answer/185833)
- [Gmail SMTP 설정](https://support.google.com/mail/answer/7126229)

