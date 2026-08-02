-- 설문 문항 미디어(그림·영상) Storage 버킷
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'survey-question-media',
  'survey-question-media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 공개 읽기
drop policy if exists "survey_question_media_public_read" on storage.objects;
create policy "survey_question_media_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'survey-question-media');
