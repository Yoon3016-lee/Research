# Supabase에서 데이터 확인하기

## Supabase 대시보드 접속

1. **Supabase 대시보드 로그인**
   - https://supabase.com/dashboard 접속
   - 로그인 후 프로젝트 선택: **ResearchDataBase** (`mvzyctaetrtgdbaroaou`)

## 저장된 설문지 확인 방법

### 1. 설문 목록 확인 (`surveys` 테이블)

1. 왼쪽 사이드바에서 **Table Editor** 클릭
2. `surveys` 테이블 선택
3. 확인 가능한 정보:
   - `id`: 설문 고유 ID
   - `title`: 설문 제목
   - `description`: 설문 설명
   - `created_by`: 생성자
   - `created_at`: 생성 일시

### 2. 설문 문항 확인 (`survey_questions` 테이블)

1. **Table Editor**에서 `survey_questions` 테이블 선택
2. 확인 가능한 정보:
   - `id`: 문항 고유 ID
   - `survey_id`: 설문 ID (어떤 설문에 속하는지)
   - `prompt`: 질문 내용
   - `question_type`: 질문 유형 ("객관식" 또는 "주관식")
   - `options`: 객관식 선택지 (JSON 형식)
   - `sort_order`: 문항 순서
   - `created_at`: 생성 일시

### 3. 설문 응답 확인 (`survey_responses` 테이블)

1. **Table Editor**에서 `survey_responses` 테이블 선택
2. 확인 가능한 정보:
   - `id`: 응답 고유 ID
   - `survey_id`: 설문 ID
   - `employee_id`: 응답한 직원 ID
   - `submitted_at`: 제출 일시

### 4. 설문 답변 상세 확인 (`survey_answers` 테이블)

1. **Table Editor**에서 `survey_answers` 테이블 선택
2. 확인 가능한 정보:
   - `id`: 답변 고유 ID
   - `response_id`: 응답 ID (어떤 응답에 속하는지)
   - `question_id`: 문항 ID
   - `answer_text`: 답변 내용
   - `created_at`: 생성 일시

### 5. SQL Editor로 통합 조회

**Table Editor** 대신 **SQL Editor**를 사용하면 더 편리하게 조회할 수 있습니다:

1. 왼쪽 사이드바에서 **SQL Editor** 클릭
2. **New query** 클릭
3. 아래 SQL 쿼리를 실행:

#### 모든 설문과 응답 수 조회
```sql
SELECT 
  s.id,
  s.title,
  s.created_at,
  COUNT(DISTINCT sr.id) as response_count
FROM surveys s
LEFT JOIN survey_responses sr ON s.id = sr.survey_id
GROUP BY s.id, s.title, s.created_at
ORDER BY s.created_at DESC;
```

#### 특정 설문의 모든 응답 상세 조회
```sql
SELECT 
  s.title as survey_title,
  sq.prompt as question,
  sq.question_type,
  sr.employee_id,
  sa.answer_text,
  sr.submitted_at
FROM survey_responses sr
JOIN surveys s ON sr.survey_id = s.id
JOIN survey_answers sa ON sr.id = sa.response_id
JOIN survey_questions sq ON sa.question_id = sq.id
WHERE s.id = '설문ID를여기에입력'
ORDER BY sr.submitted_at DESC, sq.sort_order;
```

#### 직원별 응답 통계
```sql
SELECT 
  sr.employee_id,
  COUNT(DISTINCT sr.survey_id) as surveys_answered,
  COUNT(sr.id) as total_responses
FROM survey_responses sr
GROUP BY sr.employee_id
ORDER BY total_responses DESC;
```

## 회원목록 확인 방법

### 1. Table Editor로 확인

1. 왼쪽 사이드바에서 **Table Editor** 클릭
2. `users` 테이블 선택
3. 확인 가능한 정보:
   - `id`: 사용자 ID
   - `password`: 비밀번호 (해시된 형태)
   - `role`: 역할 ("직원", "관리자", "마스터")
   - `created_at`: 가입 일시
   - `updated_at`: 수정 일시

### 2. SQL Editor로 통계 조회

#### 역할별 회원 수
```sql
SELECT 
  role,
  COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;
```

#### 전체 회원 목록
```sql
SELECT 
  id,
  role,
  created_at,
  updated_at
FROM users
ORDER BY created_at DESC;
```

#### 최근 가입한 회원
```sql
SELECT 
  id,
  role,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;
```

## 데이터 필터링 및 검색

### Table Editor에서 필터 사용

1. 테이블 상단의 **Filter** 버튼 클릭
2. 원하는 조건 추가:
   - 예: `role = '관리자'` (관리자만 보기)
   - 예: `created_at > '2024-01-01'` (특정 날짜 이후)
   - 예: `employee_id = 'emp-001'` (특정 직원의 응답만)

### 정렬 기능

- 각 컬럼 헤더를 클릭하면 오름차순/내림차순 정렬 가능
- 여러 컬럼 정렬: Shift 키를 누른 채로 컬럼 헤더 클릭

## 데이터 내보내기

1. 테이블 상단의 **Export** 버튼 클릭
2. 형식 선택: CSV, JSON, Excel
3. 다운로드하여 Excel이나 다른 도구로 분석 가능

## 실시간 데이터 모니터링

### Database → Replication

- 실시간으로 데이터 변경사항을 모니터링할 수 있습니다
- 특정 테이블의 변경 이벤트를 구독할 수 있습니다

## 주의사항

⚠️ **보안**: 
- `users` 테이블의 `password`는 평문으로 저장되어 있습니다 (실제 운영 환경에서는 해시화 필요)
- 민감한 데이터는 적절한 권한 관리가 필요합니다

⚠️ **데이터 수정**:
- Table Editor에서 직접 데이터를 수정/삭제할 수 있습니다
- 중요한 데이터는 백업 후 작업하세요

## 유용한 팁

1. **즐겨찾기 쿼리 저장**: SQL Editor에서 자주 사용하는 쿼리를 저장해두면 편리합니다
2. **뷰(View) 생성**: 자주 조회하는 복잡한 쿼리는 뷰로 만들어 재사용할 수 있습니다
3. **인덱스 확인**: Database → Indexes에서 성능 최적화를 위한 인덱스를 확인할 수 있습니다


