# Leaked Password Protection 활성화 가이드

## 개요

Supabase Auth는 HaveIBeenPwned.org와 연동하여 유출된 비밀번호를 사용하지 못하도록 하는 보안 기능을 제공합니다. 이 기능을 활성화하면 사용자가 유출된 비밀번호로 회원가입하거나 비밀번호를 변경할 수 없습니다.

## 활성화 방법

### 1. Supabase 대시보드 접속

1. 브라우저에서 [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택: **ResearchDataBase** (`mvzyctaetrtgdbaroaou`)

### 2. Auth 설정으로 이동

1. 왼쪽 사이드바에서 **Authentication** 클릭
2. 상단 탭에서 **Settings** 클릭
3. **Password** 섹션으로 스크롤

### 3. Leaked Password Protection 활성화

1. **Leaked Password Protection** 옵션 찾기
2. 토글 스위치를 **ON**으로 변경
3. 변경사항이 자동으로 저장됩니다

## 기능 설명

### 작동 방식

- 사용자가 비밀번호를 설정하거나 변경할 때
- Supabase가 HaveIBeenPwned.org API를 통해 비밀번호 검증
- 유출된 비밀번호인 경우 회원가입/변경 거부
- 사용자에게 보안 경고 메시지 표시

### 보안 효과

✅ **유출된 비밀번호 차단**: 공개적으로 유출된 비밀번호 사용 방지  
✅ **자동 검증**: 실시간으로 HaveIBeenPwned.org 데이터베이스 확인  
✅ **사용자 보호**: 약한 비밀번호로 인한 계정 탈취 위험 감소

## 참고사항

- 이 기능은 **무료로 제공**됩니다
- HaveIBeenPwned.org는 비밀번호의 해시값만 확인하므로 실제 비밀번호는 전송되지 않습니다
- API 호출은 Supabase 측에서 처리되므로 추가 설정이 필요 없습니다
- 활성화 후 즉시 적용됩니다

## 관련 문서

- [Supabase 공식 문서: Password Security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [HaveIBeenPwned.org](https://haveibeenpwned.com/)

## 확인 방법

설정 후 다음을 테스트할 수 있습니다:

1. 회원가입 페이지에서 유출된 비밀번호(예: `password123`, `12345678`) 사용 시도
2. "This password has been found in a data breach" 같은 오류 메시지 확인
3. 보안 어드바이저에서 경고가 사라졌는지 확인

