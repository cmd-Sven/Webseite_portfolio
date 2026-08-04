-- Monitor-Rolle (Caro) + Stellen-/Unternehmens-Vorschläge
-- Auth: app_metadata.role = 'admin' | 'monitor' (nie user_metadata)
-- Monitor: SELECT auf Admin-ATS-Daten; INSERT auf Suggestions
-- Admin: weiterhin Full CRUD auf eigene Rows + Suggestions-Inbox

-- ---------------------------------------------------------------------------
-- 1) Rollen-Helper (JWT app_metadata — security definer, festes search_path)
-- ---------------------------------------------------------------------------

create or replace function public.ats_jwt_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(nullif(trim(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')), ''));
$$;

comment on function public.ats_jwt_role() is
  'Liest app_metadata.role aus dem JWT (admin|monitor). Nicht aus user_metadata.';

create or replace function public.is_ats_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.ats_jwt_role() = 'admin', false);
$$;

create or replace function public.is_ats_monitor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.ats_jwt_role() = 'monitor', false);
$$;

-- ATS-Admin-User-IDs: Nutzer mit app_metadata.role = admin
-- (Fallback: designer@sven-sieber.de für bestehende Installationen)
create or replace function public.ats_admin_user_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from auth.users u
  where coalesce(u.raw_app_meta_data->>'role', '') = 'admin'
     or lower(u.email) = 'designer@sven-sieber.de';
$$;

revoke all on function public.ats_jwt_role() from public;
revoke all on function public.is_ats_admin() from public;
revoke all on function public.is_ats_monitor() from public;
revoke all on function public.ats_admin_user_ids() from public;

grant execute on function public.ats_jwt_role() to authenticated;
grant execute on function public.is_ats_admin() to authenticated;
grant execute on function public.is_ats_monitor() to authenticated;
grant execute on function public.ats_admin_user_ids() to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Admin-User: app_metadata.role = admin
-- ---------------------------------------------------------------------------

update auth.users
set
  raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', 'admin'),
  updated_at = now()
where lower(email) = 'designer@sven-sieber.de';

-- ---------------------------------------------------------------------------
-- 3) RLS: applications / job_pool — Monitor darf Admin-Rows lesen
-- ---------------------------------------------------------------------------

drop policy if exists "applications_select_own" on public.applications;
create policy "applications_select_own"
  on public.applications
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (
      public.is_ats_monitor()
      and user_id in (select public.ats_admin_user_ids())
    )
  );

drop policy if exists "job_pool_select_own" on public.job_pool;
create policy "job_pool_select_own"
  on public.job_pool
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (
      public.is_ats_monitor()
      and user_id in (select public.ats_admin_user_ids())
    )
  );

-- Schreib-Policies bleiben user_id = auth.uid() (Monitor kann nicht schreiben)

-- ---------------------------------------------------------------------------
-- 4) job_suggestions (Stellen-Vorschläge von Monitor → Admin-Inbox)
-- ---------------------------------------------------------------------------

create table if not exists public.job_suggestions (
  id uuid primary key default gen_random_uuid(),
  suggested_by uuid not null references auth.users (id) on delete cascade,
  title text not null,
  company_name text not null default '',
  source_url text,
  notes text,
  job_description_raw text,
  status text not null default 'neu'
    constraint job_suggestions_status_check
    check (status in ('neu', 'uebernommen', 'abgelehnt')),
  job_pool_id uuid references public.job_pool (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_suggestions_title_check
    check (length(btrim(title)) > 0)
);

comment on table public.job_suggestions is
  'Von Monitor-Usern vorgeschlagene Stellen; Admin übernimmt in job_pool.';

create index if not exists job_suggestions_suggested_by_idx
  on public.job_suggestions (suggested_by);

create index if not exists job_suggestions_status_idx
  on public.job_suggestions (status);

create index if not exists job_suggestions_created_at_idx
  on public.job_suggestions (created_at desc);

drop trigger if exists job_suggestions_set_updated_at on public.job_suggestions;
create trigger job_suggestions_set_updated_at
  before update on public.job_suggestions
  for each row
  execute function public.set_updated_at();

alter table public.job_suggestions enable row level security;

drop policy if exists "job_suggestions_select" on public.job_suggestions;
create policy "job_suggestions_select"
  on public.job_suggestions
  for select
  to authenticated
  using (
    suggested_by = (select auth.uid())
    or public.is_ats_admin()
  );

drop policy if exists "job_suggestions_insert_monitor" on public.job_suggestions;
create policy "job_suggestions_insert_monitor"
  on public.job_suggestions
  for insert
  to authenticated
  with check (
    suggested_by = (select auth.uid())
    and public.is_ats_monitor()
  );

drop policy if exists "job_suggestions_update_admin" on public.job_suggestions;
create policy "job_suggestions_update_admin"
  on public.job_suggestions
  for update
  to authenticated
  using (public.is_ats_admin())
  with check (public.is_ats_admin());

drop policy if exists "job_suggestions_delete_admin" on public.job_suggestions;
create policy "job_suggestions_delete_admin"
  on public.job_suggestions
  for delete
  to authenticated
  using (public.is_ats_admin());

grant select, insert, update, delete on public.job_suggestions to authenticated;

-- ---------------------------------------------------------------------------
-- 5) company_suggestions (Interessante Unternehmen — getrennt vom Pool)
-- ---------------------------------------------------------------------------

create table if not exists public.company_suggestions (
  id uuid primary key default gen_random_uuid(),
  suggested_by uuid not null references auth.users (id) on delete cascade,
  company_name text not null,
  company_url text not null,
  notes text,
  status text not null default 'neu'
    constraint company_suggestions_status_check
    check (status in ('neu', 'gesehen', 'archiviert')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_suggestions_name_check
    check (length(btrim(company_name)) > 0),
  constraint company_suggestions_url_check
    check (length(btrim(company_url)) > 0)
);

comment on table public.company_suggestions is
  'Von Monitor vorgeschlagene interessante Unternehmen (eigene Inbox, nicht job_pool).';

create index if not exists company_suggestions_suggested_by_idx
  on public.company_suggestions (suggested_by);

create index if not exists company_suggestions_status_idx
  on public.company_suggestions (status);

create index if not exists company_suggestions_created_at_idx
  on public.company_suggestions (created_at desc);

drop trigger if exists company_suggestions_set_updated_at on public.company_suggestions;
create trigger company_suggestions_set_updated_at
  before update on public.company_suggestions
  for each row
  execute function public.set_updated_at();

alter table public.company_suggestions enable row level security;

drop policy if exists "company_suggestions_select" on public.company_suggestions;
create policy "company_suggestions_select"
  on public.company_suggestions
  for select
  to authenticated
  using (
    suggested_by = (select auth.uid())
    or public.is_ats_admin()
  );

drop policy if exists "company_suggestions_insert_monitor" on public.company_suggestions;
create policy "company_suggestions_insert_monitor"
  on public.company_suggestions
  for insert
  to authenticated
  with check (
    suggested_by = (select auth.uid())
    and public.is_ats_monitor()
  );

drop policy if exists "company_suggestions_update_admin" on public.company_suggestions;
create policy "company_suggestions_update_admin"
  on public.company_suggestions
  for update
  to authenticated
  using (public.is_ats_admin())
  with check (public.is_ats_admin());

drop policy if exists "company_suggestions_delete_admin" on public.company_suggestions;
create policy "company_suggestions_delete_admin"
  on public.company_suggestions
  for delete
  to authenticated
  using (public.is_ats_admin());

grant select, insert, update, delete on public.company_suggestions to authenticated;
