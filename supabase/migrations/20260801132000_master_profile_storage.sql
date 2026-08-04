-- Private bucket for ATS master profile assets (CV PDF, photo, signature)
-- Paths: {auth.uid()}/cv.pdf | photo.* | signature.*

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'master-profile',
  'master-profile',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- SELECT: own folder only
drop policy if exists "master_profile_storage_select_own" on storage.objects;
create policy "master_profile_storage_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'master-profile'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- INSERT: own folder only
drop policy if exists "master_profile_storage_insert_own" on storage.objects;
create policy "master_profile_storage_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'master-profile'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- UPDATE: own folder (needed for upsert)
drop policy if exists "master_profile_storage_update_own" on storage.objects;
create policy "master_profile_storage_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'master-profile'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'master-profile'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- DELETE: own folder
drop policy if exists "master_profile_storage_delete_own" on storage.objects;
create policy "master_profile_storage_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'master-profile'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
