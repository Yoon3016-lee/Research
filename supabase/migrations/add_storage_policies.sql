-- Storage 버킷 생성 (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'survey-images',
  'survey-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS 정책: 모든 사용자가 읽기 가능
DROP POLICY IF EXISTS "Public Access for survey-images" ON storage.objects;
CREATE POLICY "Public Access for survey-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'survey-images');

-- Storage RLS 정책: 업로드 허용 (서비스 롤은 RLS를 우회하지만, 정책이 없으면 실패할 수 있음)
DROP POLICY IF EXISTS "Allow upload to survey-images" ON storage.objects;
CREATE POLICY "Allow upload to survey-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'survey-images');

-- Storage RLS 정책: 업데이트 허용
DROP POLICY IF EXISTS "Allow update survey-images" ON storage.objects;
CREATE POLICY "Allow update survey-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'survey-images');

-- Storage RLS 정책: 삭제 허용
DROP POLICY IF EXISTS "Allow delete survey-images" ON storage.objects;
CREATE POLICY "Allow delete survey-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'survey-images');

