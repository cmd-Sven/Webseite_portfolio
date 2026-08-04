-- Interessante Unternehmen: Verzeichnis + Event-History + Sync
-- Quellen: manuell, job_pool/applications, company_suggestions (Monitor)

-- ---------------------------------------------------------------------------
-- 1) Helpers
-- ---------------------------------------------------------------------------

create or replace function public.normalize_company_name(raw text)
returns text
language sql
immutable
as $$
  select nullif(
    regexp_replace(
      lower(trim(coalesce(raw, ''))),
      '\s+',
      ' ',
      'g'
    ),
    ''
  );
$$;

comment on function public.normalize_company_name(text) is
  'Normalisiert Firmennamen für Deduplizierung (trim, lower, whitespace).';

-- ---------------------------------------------------------------------------
-- 2) interesting_companies
-- ---------------------------------------------------------------------------

create table if not exists public.interesting_companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  website_url text,
  normalized_name text not null,
  notes text,
  last_contact_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interesting_companies_name_check
    check (length(btrim(name)) > 0),
  constraint interesting_companies_user_normalized_key
    unique (user_id, normalized_name)
);

comment on table public.interesting_companies is
  'Unternehmens-Verzeichnis (Interessante Unternehmen) für den ATS-Admin.';

create index if not exists interesting_companies_user_id_idx
  on public.interesting_companies (user_id);

create index if not exists interesting_companies_last_contact_idx
  on public.interesting_companies (last_contact_at desc nulls last);

create index if not exists interesting_companies_name_idx
  on public.interesting_companies (name);

drop trigger if exists interesting_companies_set_updated_at on public.interesting_companies;
create trigger interesting_companies_set_updated_at
  before update on public.interesting_companies
  for each row
  execute function public.set_updated_at();

-- normalized_name vor Insert/Update setzen
create or replace function public.interesting_companies_set_normalized()
returns trigger
language plpgsql
as $$
begin
  new.normalized_name := public.normalize_company_name(new.name);
  if new.normalized_name is null then
    raise exception 'Firmenname fehlt oder ist leer';
  end if;
  new.name := btrim(new.name);
  if new.website_url is not null then
    new.website_url := nullif(btrim(new.website_url), '');
  end if;
  return new;
end;
$$;

drop trigger if exists interesting_companies_normalize on public.interesting_companies;
create trigger interesting_companies_normalize
  before insert or update of name, website_url
  on public.interesting_companies
  for each row
  execute function public.interesting_companies_set_normalized();

alter table public.interesting_companies enable row level security;

drop policy if exists "interesting_companies_select" on public.interesting_companies;
create policy "interesting_companies_select"
  on public.interesting_companies
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (
      public.is_ats_monitor()
      and user_id in (select public.ats_admin_user_ids())
    )
  );

drop policy if exists "interesting_companies_insert_admin" on public.interesting_companies;
create policy "interesting_companies_insert_admin"
  on public.interesting_companies
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_ats_admin()
  );

drop policy if exists "interesting_companies_update_admin" on public.interesting_companies;
create policy "interesting_companies_update_admin"
  on public.interesting_companies
  for update
  to authenticated
  using (public.is_ats_admin() and user_id = (select auth.uid()))
  with check (public.is_ats_admin() and user_id = (select auth.uid()));

drop policy if exists "interesting_companies_delete_admin" on public.interesting_companies;
create policy "interesting_companies_delete_admin"
  on public.interesting_companies
  for delete
  to authenticated
  using (public.is_ats_admin() and user_id = (select auth.uid()));

grant select, insert, update, delete on public.interesting_companies to authenticated;

-- ---------------------------------------------------------------------------
-- 3) company_events (History / Timeline)
-- ---------------------------------------------------------------------------

create table if not exists public.company_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.interesting_companies (id) on delete cascade,
  event_type text not null
    constraint company_events_type_check
    check (event_type in (
      'created_manual',
      'suggested',
      'pool_collected',
      'pool_planned',
      'pool_in_progress',
      'pool_done',
      'application_created',
      'application_sent',
      'feedback',
      'interview',
      'rejection',
      'note'
    )),
  ref_table text,
  ref_id uuid,
  payload jsonb not null default '{}'::jsonb,
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.company_events is
  'Timeline-Events für interesting_companies (Pool, Bewerbung, Vorschlag, Feedback).';

create index if not exists company_events_company_id_idx
  on public.company_events (company_id);

create index if not exists company_events_created_at_idx
  on public.company_events (created_at desc);

create index if not exists company_events_type_idx
  on public.company_events (event_type);

create index if not exists company_events_ref_idx
  on public.company_events (ref_table, ref_id)
  where ref_id is not null;

alter table public.company_events enable row level security;

drop policy if exists "company_events_select" on public.company_events;
create policy "company_events_select"
  on public.company_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.interesting_companies c
      where c.id = company_id
        and (
          c.user_id = (select auth.uid())
          or (
            public.is_ats_monitor()
            and c.user_id in (select public.ats_admin_user_ids())
          )
        )
    )
  );

drop policy if exists "company_events_insert_admin" on public.company_events;
create policy "company_events_insert_admin"
  on public.company_events
  for insert
  to authenticated
  with check (
    public.is_ats_admin()
    and exists (
      select 1
      from public.interesting_companies c
      where c.id = company_id
        and c.user_id = (select auth.uid())
    )
  );

-- Service/Trigger schreibt als owner via security definer — keine Monitor-Inserts nötig
drop policy if exists "company_events_delete_admin" on public.company_events;
create policy "company_events_delete_admin"
  on public.company_events
  for delete
  to authenticated
  using (
    public.is_ats_admin()
    and exists (
      select 1
      from public.interesting_companies c
      where c.id = company_id
        and c.user_id = (select auth.uid())
    )
  );

grant select, insert, delete on public.company_events to authenticated;

-- ---------------------------------------------------------------------------
-- 4) Upsert + Event (security definer für Trigger)
-- ---------------------------------------------------------------------------

create or replace function public.upsert_interesting_company(
  p_owner_id uuid,
  p_name text,
  p_website_url text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_norm text;
  v_id uuid;
  v_display text;
begin
  v_display := btrim(coalesce(p_name, ''));
  v_norm := public.normalize_company_name(v_display);
  if v_norm is null then
    return null;
  end if;

  insert into public.interesting_companies (
    user_id, name, website_url, normalized_name, notes, last_contact_at
  )
  values (
    p_owner_id,
    v_display,
    nullif(btrim(coalesce(p_website_url, '')), ''),
    v_norm,
    nullif(btrim(coalesce(p_notes, '')), ''),
    now()
  )
  on conflict (user_id, normalized_name) do update
    set
      name = excluded.name,
      website_url = coalesce(excluded.website_url, public.interesting_companies.website_url),
      notes = coalesce(public.interesting_companies.notes, excluded.notes),
      last_contact_at = greatest(
        coalesce(public.interesting_companies.last_contact_at, '-infinity'::timestamptz),
        now()
      ),
      updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.upsert_interesting_company(uuid, text, text, text) from public;
grant execute on function public.upsert_interesting_company(uuid, text, text, text) to authenticated;

create or replace function public.add_company_event(
  p_company_id uuid,
  p_event_type text,
  p_ref_table text default null,
  p_ref_id uuid default null,
  p_payload jsonb default '{}'::jsonb,
  p_note text default null,
  p_created_by uuid default null,
  p_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_company_id is null then
    return null;
  end if;

  -- Dedup gleiche Ref+Type (vermeidet Doppel-Events bei Updates)
  if p_ref_id is not null and p_ref_table is not null then
    select e.id into v_id
    from public.company_events e
    where e.company_id = p_company_id
      and e.event_type = p_event_type
      and e.ref_table = p_ref_table
      and e.ref_id = p_ref_id
    limit 1;

    if v_id is not null then
      update public.company_events
      set
        payload = coalesce(p_payload, payload),
        note = coalesce(nullif(btrim(coalesce(p_note, '')), ''), note)
      where id = v_id;

      update public.interesting_companies
      set
        last_contact_at = greatest(
          coalesce(last_contact_at, '-infinity'::timestamptz),
          coalesce(p_at, now())
        ),
        updated_at = now()
      where id = p_company_id;

      return v_id;
    end if;
  end if;

  insert into public.company_events (
    company_id, event_type, ref_table, ref_id, payload, note, created_by, created_at
  )
  values (
    p_company_id,
    p_event_type,
    p_ref_table,
    p_ref_id,
    coalesce(p_payload, '{}'::jsonb),
    nullif(btrim(coalesce(p_note, '')), ''),
    p_created_by,
    coalesce(p_at, now())
  )
  returning id into v_id;

  update public.interesting_companies
  set
    last_contact_at = greatest(
      coalesce(last_contact_at, '-infinity'::timestamptz),
      coalesce(p_at, now())
    ),
    updated_at = now()
  where id = p_company_id;

  return v_id;
end;
$$;

revoke all on function public.add_company_event(uuid, text, text, uuid, jsonb, text, uuid, timestamptz) from public;
grant execute on function public.add_company_event(uuid, text, text, uuid, jsonb, text, uuid, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- 5) Trigger: job_pool
-- ---------------------------------------------------------------------------

create or replace function public.sync_company_from_job_pool()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_event text;
  v_at timestamptz;
begin
  if tg_op = 'DELETE' then
    return old;
  end if;

  if public.normalize_company_name(new.company_name) is null then
    return new;
  end if;

  v_company_id := public.upsert_interesting_company(
    new.user_id,
    new.company_name,
    new.source_url,
    null
  );

  v_event := case new.status
    when 'gesammelt' then 'pool_collected'
    when 'geplant' then 'pool_planned'
    when 'in_arbeit' then 'pool_in_progress'
    when 'erledigt' then 'pool_done'
    else 'pool_collected'
  end;

  v_at := coalesce(new.updated_at, new.created_at, now());

  perform public.add_company_event(
    v_company_id,
    v_event,
    'job_pool',
    new.id,
    jsonb_build_object(
      'title', new.title,
      'status', new.status,
      'application_type', new.application_type,
      'source_url', new.source_url
    ),
    new.notes,
    new.user_id,
    v_at
  );

  return new;
end;
$$;

drop trigger if exists job_pool_sync_company on public.job_pool;
create trigger job_pool_sync_company
  after insert or update of company_name, status, source_url, title, notes
  on public.job_pool
  for each row
  execute function public.sync_company_from_job_pool();

-- ---------------------------------------------------------------------------
-- 6) Trigger: applications
-- ---------------------------------------------------------------------------

create or replace function public.sync_company_from_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_event text;
  v_at timestamptz;
begin
  if tg_op = 'DELETE' then
    return old;
  end if;

  if public.normalize_company_name(new.company_name) is null then
    return new;
  end if;

  v_company_id := public.upsert_interesting_company(
    new.user_id,
    new.company_name,
    null,
    null
  );

  -- Basis: Bewerbung angelegt
  perform public.add_company_event(
    v_company_id,
    'application_created',
    'applications',
    new.id,
    jsonb_build_object(
      'job_title', new.job_title,
      'status', new.status
    ),
    null,
    new.user_id,
    new.created_at
  );

  if new.status = 'Beworben' or new.applied_at is not null then
    perform public.add_company_event(
      v_company_id,
      'application_sent',
      'applications',
      new.id,
      jsonb_build_object(
        'job_title', new.job_title,
        'status', new.status,
        'applied_at', new.applied_at
      ),
      null,
      new.user_id,
      coalesce(new.applied_at, now())
    );
  end if;

  if new.status = 'Interview' then
    perform public.add_company_event(
      v_company_id,
      'interview',
      'applications',
      new.id,
      jsonb_build_object('job_title', new.job_title, 'status', new.status),
      new.feedback_notes,
      new.user_id,
      coalesce(new.feedback_at, now())
    );
  end if;

  if new.status = 'Absage' then
    perform public.add_company_event(
      v_company_id,
      'rejection',
      'applications',
      new.id,
      jsonb_build_object('job_title', new.job_title, 'status', new.status),
      new.feedback_notes,
      new.user_id,
      coalesce(new.feedback_at, now())
    );
  end if;

  if new.feedback_notes is not null and length(btrim(new.feedback_notes)) > 0 then
    perform public.add_company_event(
      v_company_id,
      'feedback',
      'applications',
      new.id,
      jsonb_build_object(
        'job_title', new.job_title,
        'status', new.status,
        'feedback_at', new.feedback_at
      ),
      new.feedback_notes,
      new.user_id,
      coalesce(new.feedback_at, now())
    );
  end if;

  return new;
end;
$$;

drop trigger if exists applications_sync_company on public.applications;
create trigger applications_sync_company
  after insert or update of company_name, status, applied_at, feedback_notes, feedback_at, job_title
  on public.applications
  for each row
  execute function public.sync_company_from_application();

-- ---------------------------------------------------------------------------
-- 7) Trigger: company_suggestions → Verzeichnis + Event
-- ---------------------------------------------------------------------------

create or replace function public.sync_company_from_suggestion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_company_id uuid;
begin
  -- Vorschläge gehören dem ATS-Admin (erster Admin-User)
  select id into v_owner
  from public.ats_admin_user_ids()
  limit 1;

  if v_owner is null then
    return new;
  end if;

  v_company_id := public.upsert_interesting_company(
    v_owner,
    new.company_name,
    new.company_url,
    new.notes
  );

  perform public.add_company_event(
    v_company_id,
    'suggested',
    'company_suggestions',
    new.id,
    jsonb_build_object(
      'company_url', new.company_url,
      'status', new.status,
      'suggested_by', new.suggested_by
    ),
    new.notes,
    new.suggested_by,
    new.created_at
  );

  return new;
end;
$$;

drop trigger if exists company_suggestions_sync_company on public.company_suggestions;
create trigger company_suggestions_sync_company
  after insert
  on public.company_suggestions
  for each row
  execute function public.sync_company_from_suggestion();

-- ---------------------------------------------------------------------------
-- 8) Backfill aus bestehenden Daten
-- ---------------------------------------------------------------------------

-- Pool
insert into public.interesting_companies (user_id, name, website_url, normalized_name, last_contact_at)
select distinct on (jp.user_id, public.normalize_company_name(jp.company_name))
  jp.user_id,
  btrim(jp.company_name),
  jp.source_url,
  public.normalize_company_name(jp.company_name),
  coalesce(jp.updated_at, jp.created_at)
from public.job_pool jp
where public.normalize_company_name(jp.company_name) is not null
order by jp.user_id, public.normalize_company_name(jp.company_name), jp.updated_at desc nulls last
on conflict (user_id, normalized_name) do update
  set
    website_url = coalesce(public.interesting_companies.website_url, excluded.website_url),
    last_contact_at = greatest(
      coalesce(public.interesting_companies.last_contact_at, '-infinity'::timestamptz),
      coalesce(excluded.last_contact_at, now())
    ),
    updated_at = now();

-- Applications
insert into public.interesting_companies (user_id, name, normalized_name, last_contact_at)
select distinct on (a.user_id, public.normalize_company_name(a.company_name))
  a.user_id,
  btrim(a.company_name),
  public.normalize_company_name(a.company_name),
  coalesce(a.applied_at, a.feedback_at, a.created_at)
from public.applications a
where public.normalize_company_name(a.company_name) is not null
order by a.user_id, public.normalize_company_name(a.company_name), a.created_at desc
on conflict (user_id, normalized_name) do update
  set
    last_contact_at = greatest(
      coalesce(public.interesting_companies.last_contact_at, '-infinity'::timestamptz),
      coalesce(excluded.last_contact_at, now())
    ),
    updated_at = now();

-- Events aus Pool (ein Event pro Pool-Row)
insert into public.company_events (company_id, event_type, ref_table, ref_id, payload, note, created_by, created_at)
select
  c.id,
  case jp.status
    when 'gesammelt' then 'pool_collected'
    when 'geplant' then 'pool_planned'
    when 'in_arbeit' then 'pool_in_progress'
    when 'erledigt' then 'pool_done'
    else 'pool_collected'
  end,
  'job_pool',
  jp.id,
  jsonb_build_object(
    'title', jp.title,
    'status', jp.status,
    'application_type', jp.application_type,
    'source_url', jp.source_url
  ),
  jp.notes,
  jp.user_id,
  coalesce(jp.updated_at, jp.created_at)
from public.job_pool jp
join public.interesting_companies c
  on c.user_id = jp.user_id
 and c.normalized_name = public.normalize_company_name(jp.company_name)
where not exists (
  select 1 from public.company_events e
  where e.ref_table = 'job_pool' and e.ref_id = jp.id
);

-- Events aus Applications
insert into public.company_events (company_id, event_type, ref_table, ref_id, payload, note, created_by, created_at)
select
  c.id,
  'application_created',
  'applications',
  a.id,
  jsonb_build_object('job_title', a.job_title, 'status', a.status),
  null,
  a.user_id,
  a.created_at
from public.applications a
join public.interesting_companies c
  on c.user_id = a.user_id
 and c.normalized_name = public.normalize_company_name(a.company_name)
where not exists (
  select 1 from public.company_events e
  where e.company_id = c.id
    and e.event_type = 'application_created'
    and e.ref_table = 'applications'
    and e.ref_id = a.id
);

insert into public.company_events (company_id, event_type, ref_table, ref_id, payload, created_by, created_at)
select
  c.id,
  'application_sent',
  'applications',
  a.id,
  jsonb_build_object('job_title', a.job_title, 'status', a.status, 'applied_at', a.applied_at),
  a.user_id,
  coalesce(a.applied_at, a.created_at)
from public.applications a
join public.interesting_companies c
  on c.user_id = a.user_id
 and c.normalized_name = public.normalize_company_name(a.company_name)
where (a.status = 'Beworben' or a.applied_at is not null)
  and not exists (
    select 1 from public.company_events e
    where e.company_id = c.id
      and e.event_type = 'application_sent'
      and e.ref_table = 'applications'
      and e.ref_id = a.id
  );

insert into public.company_events (company_id, event_type, ref_table, ref_id, payload, note, created_by, created_at)
select
  c.id,
  'interview',
  'applications',
  a.id,
  jsonb_build_object('job_title', a.job_title, 'status', a.status),
  a.feedback_notes,
  a.user_id,
  coalesce(a.feedback_at, a.created_at)
from public.applications a
join public.interesting_companies c
  on c.user_id = a.user_id
 and c.normalized_name = public.normalize_company_name(a.company_name)
where a.status = 'Interview'
  and not exists (
    select 1 from public.company_events e
    where e.company_id = c.id
      and e.event_type = 'interview'
      and e.ref_table = 'applications'
      and e.ref_id = a.id
  );

insert into public.company_events (company_id, event_type, ref_table, ref_id, payload, note, created_by, created_at)
select
  c.id,
  'rejection',
  'applications',
  a.id,
  jsonb_build_object('job_title', a.job_title, 'status', a.status),
  a.feedback_notes,
  a.user_id,
  coalesce(a.feedback_at, a.created_at)
from public.applications a
join public.interesting_companies c
  on c.user_id = a.user_id
 and c.normalized_name = public.normalize_company_name(a.company_name)
where a.status = 'Absage'
  and not exists (
    select 1 from public.company_events e
    where e.company_id = c.id
      and e.event_type = 'rejection'
      and e.ref_table = 'applications'
      and e.ref_id = a.id
  );

insert into public.company_events (company_id, event_type, ref_table, ref_id, payload, note, created_by, created_at)
select
  c.id,
  'feedback',
  'applications',
  a.id,
  jsonb_build_object('job_title', a.job_title, 'status', a.status, 'feedback_at', a.feedback_at),
  a.feedback_notes,
  a.user_id,
  coalesce(a.feedback_at, a.created_at)
from public.applications a
join public.interesting_companies c
  on c.user_id = a.user_id
 and c.normalized_name = public.normalize_company_name(a.company_name)
where a.feedback_notes is not null
  and length(btrim(a.feedback_notes)) > 0
  and not exists (
    select 1 from public.company_events e
    where e.company_id = c.id
      and e.event_type = 'feedback'
      and e.ref_table = 'applications'
      and e.ref_id = a.id
  );

-- Bestehende company_suggestions (falls Tabelle schon da)
do $$
declare
  v_admin uuid;
begin
  if to_regclass('public.company_suggestions') is not null then
    select x into v_admin from public.ats_admin_user_ids() as x limit 1;
    if v_admin is null then
      return;
    end if;

    insert into public.interesting_companies (user_id, name, website_url, normalized_name, notes, last_contact_at)
    select
      v_admin,
      btrim(cs.company_name),
      cs.company_url,
      public.normalize_company_name(cs.company_name),
      cs.notes,
      cs.created_at
    from public.company_suggestions cs
    where public.normalize_company_name(cs.company_name) is not null
    on conflict (user_id, normalized_name) do update
      set
        website_url = coalesce(public.interesting_companies.website_url, excluded.website_url),
        notes = coalesce(public.interesting_companies.notes, excluded.notes),
        last_contact_at = greatest(
          coalesce(public.interesting_companies.last_contact_at, '-infinity'::timestamptz),
          coalesce(excluded.last_contact_at, now())
        ),
        updated_at = now();

    insert into public.company_events (company_id, event_type, ref_table, ref_id, payload, note, created_by, created_at)
    select
      c.id,
      'suggested',
      'company_suggestions',
      cs.id,
      jsonb_build_object(
        'company_url', cs.company_url,
        'status', cs.status,
        'suggested_by', cs.suggested_by
      ),
      cs.notes,
      cs.suggested_by,
      cs.created_at
    from public.company_suggestions cs
    join public.interesting_companies c
      on c.user_id = v_admin
     and c.normalized_name = public.normalize_company_name(cs.company_name)
    where not exists (
      select 1 from public.company_events e
      where e.ref_table = 'company_suggestions' and e.ref_id = cs.id
    );
  end if;
end $$;
