-- Public bucket for portfolio landing-page CV (no login required)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-public',
  'portfolio-public',
  true,
  10485760,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Authenticated write: only fixed portfolio CV object
drop policy if exists "portfolio_public_insert_cv" on storage.objects;
create policy "portfolio_public_insert_cv"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-public'
    and name = 'lebenslauf.pdf'
  );

drop policy if exists "portfolio_public_update_cv" on storage.objects;
create policy "portfolio_public_update_cv"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'portfolio-public'
    and name = 'lebenslauf.pdf'
  )
  with check (
    bucket_id = 'portfolio-public'
    and name = 'lebenslauf.pdf'
  );

drop policy if exists "portfolio_public_delete_cv" on storage.objects;
create policy "portfolio_public_delete_cv"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'portfolio-public'
    and name = 'lebenslauf.pdf'
  );

-- Public read (explicit for anon + authenticated)
drop policy if exists "portfolio_public_select_cv" on storage.objects;
create policy "portfolio_public_select_cv"
  on storage.objects
  for select
  to public
  using (
    bucket_id = 'portfolio-public'
    and name = 'lebenslauf.pdf'
  );
