-- CMS 페이지 본문용 이미지·PDF (공개 읽기, 업로드는 서버 Service Role)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-page-assets',
  'site-page-assets',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read site page assets" on storage.objects;
create policy "Public read site page assets"
  on storage.objects for select
  using (bucket_id = 'site-page-assets');
