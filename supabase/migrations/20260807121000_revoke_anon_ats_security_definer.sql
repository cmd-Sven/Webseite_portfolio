-- ATS SECURITY DEFINER: Anon-EXECUTE entziehen + AuthZ in Write-RPCs
-- Problem: Default/PUBLIC-Grants ließen anon upsert_interesting_company / add_company_event
-- und ats_admin_user_ids ohne Login aufrufen (RLS-Bypass via definer).

-- ---------------------------------------------------------------------------
-- 1) EXECUTE: PUBLIC + anon hart entziehen; nur authenticated wo nötig
-- ---------------------------------------------------------------------------

revoke all on function public.ats_jwt_role() from public, anon;
revoke all on function public.is_ats_admin() from public, anon;
revoke all on function public.is_ats_monitor() from public, anon;
revoke all on function public.ats_admin_user_ids() from public, anon;
grant execute on function public.ats_jwt_role() to authenticated;
grant execute on function public.is_ats_admin() to authenticated;
grant execute on function public.is_ats_monitor() to authenticated;
grant execute on function public.ats_admin_user_ids() to authenticated;

revoke all on function public.upsert_interesting_company(uuid, text, text, text) from public, anon;
grant execute on function public.upsert_interesting_company(uuid, text, text, text) to authenticated;

revoke all on function public.add_company_event(uuid, text, text, uuid, jsonb, text, uuid, timestamptz) from public, anon;
grant execute on function public.add_company_event(uuid, text, text, uuid, jsonb, text, uuid, timestamptz) to authenticated;

-- Trigger-only: nicht als RPC für Clients
revoke all on function public.job_pool_monitor_write_guard() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) AuthZ in Write-RPCs (Defense-in-Depth, auch für authenticated)
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
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Nicht authentifiziert';
  end if;

  if p_owner_id is null then
    raise exception 'owner_id fehlt';
  end if;

  -- Nur eigene Rows, Admin, oder Monitor → Admin-Owner (wie Job-Pool)
  if not (
    p_owner_id = v_uid
    or public.is_ats_admin()
    or (
      public.is_ats_monitor()
      and p_owner_id in (select public.ats_admin_user_ids())
    )
  ) then
    raise exception 'Kein Schreibrecht für diesen Owner';
  end if;

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
  v_uid uuid := auth.uid();
  v_owner uuid;
begin
  if v_uid is null then
    raise exception 'Nicht authentifiziert';
  end if;

  if p_company_id is null then
    return null;
  end if;

  select c.user_id into v_owner
  from public.interesting_companies c
  where c.id = p_company_id;

  if v_owner is null then
    raise exception 'Unternehmen nicht gefunden';
  end if;

  if not (
    v_owner = v_uid
    or public.is_ats_admin()
    or (
      public.is_ats_monitor()
      and v_owner in (select public.ats_admin_user_ids())
    )
  ) then
    raise exception 'Kein Schreibrecht für dieses Unternehmen';
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
    coalesce(p_created_by, v_uid),
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

revoke all on function public.upsert_interesting_company(uuid, text, text, text) from public, anon;
grant execute on function public.upsert_interesting_company(uuid, text, text, text) to authenticated;

revoke all on function public.add_company_event(uuid, text, text, uuid, jsonb, text, uuid, timestamptz) from public, anon;
grant execute on function public.add_company_event(uuid, text, text, uuid, jsonb, text, uuid, timestamptz) to authenticated;
