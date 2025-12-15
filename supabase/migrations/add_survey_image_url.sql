-- Add image_url column to surveys table
alter table public.surveys
add column if not exists image_url text;

