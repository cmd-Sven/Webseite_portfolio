-- Personal ATS: Master-Profil + Bewerbungen
-- RLS: authentifizierte User dürfen nur eigene Rows lesen/schreiben

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.master_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint master_profile_user_id_key unique (user_id)
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company_name text not null default '',
  job_title text not null default '',
  job_description_raw text not null default '',
  status text not null default 'Gefunden'
    constraint applications_status_check
    check (status in ('Gefunden', 'In Bearbeitung', 'Beworben', 'Interview', 'Absage')),
  match_score integer,
  parsed_requirements jsonb,
  generated_cover_letter text,
  generated_cv_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists master_profile_user_id_idx
  on public.master_profile (user_id);

create index if not exists applications_user_id_idx
  on public.applications (user_id);

create index if not exists applications_status_idx
  on public.applications (status);

create index if not exists applications_created_at_idx
  on public.applications (created_at desc);

drop trigger if exists master_profile_set_updated_at on public.master_profile;
create trigger master_profile_set_updated_at
  before update on public.master_profile
  for each row
  execute function public.set_updated_at();

alter table public.master_profile enable row level security;
alter table public.applications enable row level security;

-- master_profile policies
drop policy if exists "master_profile_select_own" on public.master_profile;
create policy "master_profile_select_own"
  on public.master_profile
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "master_profile_insert_own" on public.master_profile;
create policy "master_profile_insert_own"
  on public.master_profile
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "master_profile_update_own" on public.master_profile;
create policy "master_profile_update_own"
  on public.master_profile
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "master_profile_delete_own" on public.master_profile;
create policy "master_profile_delete_own"
  on public.master_profile
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- applications policies
drop policy if exists "applications_select_own" on public.applications;
create policy "applications_select_own"
  on public.applications
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own"
  on public.applications
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "applications_update_own" on public.applications;
create policy "applications_update_own"
  on public.applications
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "applications_delete_own" on public.applications;
create policy "applications_delete_own"
  on public.applications
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
