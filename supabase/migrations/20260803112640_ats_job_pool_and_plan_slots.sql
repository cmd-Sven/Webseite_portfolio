-- Personal ATS: Stellen-Pool + Wochen-/Tagesplanung
--
-- Status-Trennung (bewusst getrennt von applications.status):
--   applications:  'Gefunden' | 'In Bearbeitung' | 'Beworben' | 'Interview' | 'Absage'
--   job_pool:      'gesammelt' | 'geplant' | 'in_arbeit' | 'erledigt'
-- Wenn aus dem Pool eine Bewerbung erzeugt wird → application_id setzen
-- und Pool-Status typischerweise auf 'in_arbeit' / 'erledigt' heben (UI-Phase).
--
-- Folgephasen (nicht Teil dieser Migration):
--   1) Pool-UI (regulär + initiativ inkl. WBS-Upload)
--   2) Planungs-UI (Kalender / Tag-Slots)
--   3) KI-Generierung Fall A (regulär) / Fall B (Initiativ)

-- ---------------------------------------------------------------------------
-- 1) job_pool
-- ---------------------------------------------------------------------------

create table if not exists public.job_pool (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  application_type text not null default 'regular'
    constraint job_pool_application_type_check
    check (application_type in ('regular', 'initiative')),
  title text,
  company_name text not null default '',
  status text not null default 'gesammelt'
    constraint job_pool_status_check
    check (status in ('gesammelt', 'geplant', 'in_arbeit', 'erledigt')),
  source_url text,
  links jsonb not null default '[]'::jsonb,
  notes text,
  job_description text,
  -- Initiativ-spezifisch
  company_info text,
  target_notes text,
  -- Storage-Pfad im Bucket ats-documents, z. B. {user_id}/wbs/{job_pool_id}.pdf
  wbs_certificate_path text,
  application_id uuid references public.applications (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_pool_regular_title_check
    check (
      application_type <> 'regular'
      or (title is not null and length(btrim(title)) > 0)
    )
);

comment on table public.job_pool is
  'Stellen-Pool vor der Bewerbung: regulär (Anzeige) oder initiativ. Status unabhängig von applications.status.';

comment on column public.job_pool.application_type is
  '''regular'' = Stellenanzeige; ''initiative'' = Initiativbewerbung (title optional).';

comment on column public.job_pool.status is
  'Pool-Lifecycle: gesammelt → geplant → in_arbeit → erledigt. Nicht identisch mit applications.status.';

comment on column public.job_pool.application_id is
  'Optionaler Link zur erzeugten Bewerbung in public.applications.';

comment on column public.job_pool.wbs_certificate_path is
  'Pfad im Bucket ats-documents: {user_id}/wbs/{job_pool_id}.pdf';

create index if not exists job_pool_user_id_idx
  on public.job_pool (user_id);

create index if not exists job_pool_status_idx
  on public.job_pool (status);

create index if not exists job_pool_application_type_idx
  on public.job_pool (application_type);

create index if not exists job_pool_created_at_idx
  on public.job_pool (created_at desc);

create index if not exists job_pool_application_id_idx
  on public.job_pool (application_id)
  where application_id is not null;

drop trigger if exists job_pool_set_updated_at on public.job_pool;
create trigger job_pool_set_updated_at
  before update on public.job_pool
  for each row
  execute function public.set_updated_at();

alter table public.job_pool enable row level security;

drop policy if exists "job_pool_select_own" on public.job_pool;
create policy "job_pool_select_own"
  on public.job_pool
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "job_pool_insert_own" on public.job_pool;
create policy "job_pool_insert_own"
  on public.job_pool
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "job_pool_update_own" on public.job_pool;
create policy "job_pool_update_own"
  on public.job_pool
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "job_pool_delete_own" on public.job_pool;
create policy "job_pool_delete_own"
  on public.job_pool
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 2) application_plan_slots (ein Slot = ein Kalendertag pro User)
-- ---------------------------------------------------------------------------

create table if not exists public.application_plan_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_date date not null,
  label text,
  job_pool_id uuid references public.job_pool (id) on delete set null,
  status text not null default 'offen'
    constraint application_plan_slots_status_check
    check (status in ('offen', 'zugewiesen', 'erledigt', 'uebersprungen')),
  notes text,
  created_at timestamptz not null default now(),
  constraint application_plan_slots_user_date_key unique (user_id, plan_date)
);

comment on table public.application_plan_slots is
  'Tagesplanung: pro User und plan_date höchstens ein Slot (unique). job_pool_id nullable bis zugewiesen.';

comment on column public.application_plan_slots.label is
  'Optionales UI-Label, z. B. ''Tag 1''.';

comment on column public.application_plan_slots.status is
  'Slot-Status (Planung), getrennt von job_pool.status und applications.status.';

create index if not exists application_plan_slots_user_id_idx
  on public.application_plan_slots (user_id);

create index if not exists application_plan_slots_plan_date_idx
  on public.application_plan_slots (plan_date);

create index if not exists application_plan_slots_job_pool_id_idx
  on public.application_plan_slots (job_pool_id)
  where job_pool_id is not null;

alter table public.application_plan_slots enable row level security;

drop policy if exists "application_plan_slots_select_own" on public.application_plan_slots;
create policy "application_plan_slots_select_own"
  on public.application_plan_slots
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "application_plan_slots_insert_own" on public.application_plan_slots;
create policy "application_plan_slots_insert_own"
  on public.application_plan_slots
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "application_plan_slots_update_own" on public.application_plan_slots;
create policy "application_plan_slots_update_own"
  on public.application_plan_slots
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "application_plan_slots_delete_own" on public.application_plan_slots;
create policy "application_plan_slots_delete_own"
  on public.application_plan_slots
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 3) Storage: ats-documents (WBS-PDFs u. a.)
--    Pfad: {auth.uid()}/wbs/{job_pool_id}.pdf
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ats-documents',
  'ats-documents',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "ats_documents_storage_select_own" on storage.objects;
create policy "ats_documents_storage_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'ats-documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "ats_documents_storage_insert_own" on storage.objects;
create policy "ats_documents_storage_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'ats-documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "ats_documents_storage_update_own" on storage.objects;
create policy "ats_documents_storage_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'ats-documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'ats-documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "ats_documents_storage_delete_own" on storage.objects;
create policy "ats_documents_storage_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'ats-documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
