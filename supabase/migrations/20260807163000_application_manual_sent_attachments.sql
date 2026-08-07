-- Manuelles „Versendet“: Flag + Anhänge (ohne KI-Docs)
-- applied_at bleibt Versanddatum; Follow-up = applied_at + 14 Tage (Client/.ics)

alter table public.applications
  add column if not exists sent_manually boolean not null default false;

comment on column public.applications.applied_at is
  'Versanddatum der Bewerbung (Status Beworben). Grundlage für Follow-up +14 Tage.';

comment on column public.applications.sent_manually is
  'True, wenn als manuell versendet markiert (ohne/mit optionalen Upload-Unterlagen).';

-- ---------------------------------------------------------------------------
-- application_attachments: optionale Unterlagen (Anschreiben/CV/PDF …)
-- Storage: Bucket ats-documents, Pfad {user_id}/applications/{application_id}/…
-- ---------------------------------------------------------------------------

create table if not exists public.application_attachments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  label text,
  created_at timestamptz not null default now(),
  constraint application_attachments_storage_path_key unique (storage_path),
  constraint application_attachments_file_name_check
    check (length(btrim(file_name)) > 0),
  constraint application_attachments_storage_path_check
    check (length(btrim(storage_path)) > 0)
);

comment on table public.application_attachments is
  'Hochgeladene Bewerbungsunterlagen (manuell versendet). Nur Admin schreibt; Monitor liest Admin-Rows.';

create index if not exists application_attachments_application_id_idx
  on public.application_attachments (application_id);

create index if not exists application_attachments_user_id_idx
  on public.application_attachments (user_id);

alter table public.application_attachments enable row level security;

drop policy if exists "application_attachments_select" on public.application_attachments;
create policy "application_attachments_select"
  on public.application_attachments
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (
      public.is_ats_monitor()
      and user_id in (select public.ats_admin_user_ids())
    )
  );

drop policy if exists "application_attachments_insert_admin" on public.application_attachments;
create policy "application_attachments_insert_admin"
  on public.application_attachments
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_ats_admin()
  );

drop policy if exists "application_attachments_update_admin" on public.application_attachments;
create policy "application_attachments_update_admin"
  on public.application_attachments
  for update
  to authenticated
  using (user_id = (select auth.uid()) and public.is_ats_admin())
  with check (user_id = (select auth.uid()) and public.is_ats_admin());

drop policy if exists "application_attachments_delete_admin" on public.application_attachments;
create policy "application_attachments_delete_admin"
  on public.application_attachments
  for delete
  to authenticated
  using (user_id = (select auth.uid()) and public.is_ats_admin());

-- Bucket: mehr MIME-Typen für manuelle Unterlagen (WBS bleibt PDF)
update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ]
where id = 'ats-documents';
