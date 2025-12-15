# Supabase Storage RLS 정책 설정 가이드

이미지 업로드 기능을 사용하려면 Supabase Storage에 RLS 정책을 설정해야 합니다.

## 문제
"new row violates row-level security policy" 오류가 발생하는 경우, Storage 버킷에 RLS 정책이 설정되지 않았기 때문입니다.

## 해결 방법

### 1. Supabase 대시보드 접속
1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택 (ResearchDataBase)

### 2. Storage 메뉴로 이동
1. 왼쪽 사이드바에서 **Storage** 클릭
2. `survey-images` 버킷이 있는지 확인 (없으면 생성)

### 3. RLS 정책 설정
1. `survey-images` 버킷 클릭
2. **Policies** 탭 클릭
3. **New Policy** 버튼 클릭

#### 정책 1: 공개 읽기 (Public Read)
- **Policy name**: `Public Access for survey-images`
- **Allowed operation**: `SELECT`
- **Policy definition**: 
  ```sql
  bucket_id = 'survey-images'
  ```
- **Save** 클릭

#### 정책 2: 업로드 허용 (Insert)
- **Policy name**: `Allow upload to survey-images`
- **Allowed operation**: `INSERT`
- **Policy definition**:
  ```sql
  bucket_id = 'survey-images'
  ```
- **Save** 클릭

#### 정책 3: 업데이트 허용 (Update)
- **Policy name**: `Allow update survey-images`
- **Allowed operation**: `UPDATE`
- **Policy definition**:
  ```sql
  bucket_id = 'survey-images'
  ```
- **Save** 클릭

#### 정책 4: 삭제 허용 (Delete)
- **Policy name**: `Allow delete survey-images`
- **Allowed operation**: `DELETE`
- **Policy definition**:
  ```sql
  bucket_id = 'survey-images'
  ```
- **Save** 클릭

### 4. 또는 SQL Editor에서 직접 실행

Supabase 대시보드 > SQL Editor에서 다음 SQL을 실행:

```sql
-- Storage RLS 정책: 모든 사용자가 읽기 가능
CREATE POLICY "Public Access for survey-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'survey-images');

-- Storage RLS 정책: 업로드 허용
CREATE POLICY "Allow upload to survey-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'survey-images');

-- Storage RLS 정책: 업데이트 허용
CREATE POLICY "Allow update survey-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'survey-images');

-- Storage RLS 정책: 삭제 허용
CREATE POLICY "Allow delete survey-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'survey-images');
```

## 참고
- 서비스 롤 키를 사용하는 경우에도 Storage API는 RLS 정책을 따릅니다.
- Public 버킷으로 설정되어 있어도 RLS 정책은 필요합니다.
- 정책 설정 후 이미지 업로드가 정상적으로 작동합니다.

