-- portfolio-public: Schreibzugriff nur für ATS-Admin (nicht jeder authenticated User)

drop policy if exists "portfolio_public_insert_cv" on storage.objects;
create policy "portfolio_public_insert_cv"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-public'
    and name = 'lebenslauf.pdf'
    and public.is_ats_admin()
  );

drop policy if exists "portfolio_public_update_cv" on storage.objects;
create policy "portfolio_public_update_cv"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'portfolio-public'
    and name = 'lebenslauf.pdf'
    and public.is_ats_admin()
  )
  with check (
    bucket_id = 'portfolio-public'
    and name = 'lebenslauf.pdf'
    and public.is_ats_admin()
  );

drop policy if exists "portfolio_public_delete_cv" on storage.objects;
create policy "portfolio_public_delete_cv"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'portfolio-public'
    and name = 'lebenslauf.pdf'
    and public.is_ats_admin()
  );
