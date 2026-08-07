-- Monitor darf Svens Stellen-Pool befüllen und Job-Details bearbeiten.
-- Nicht erlaubt: application_type / application_id ändern (kein Initiativ-/Bewerbungs-Flow).

-- ---------------------------------------------------------------------------
-- 1) INSERT: Monitor legt Einträge im Admin-Pool an (user_id = Admin)
-- ---------------------------------------------------------------------------

drop policy if exists "job_pool_insert_monitor_admin_owner" on public.job_pool;
create policy "job_pool_insert_monitor_admin_owner"
  on public.job_pool
  for insert
  to authenticated
  with check (
    public.is_ats_monitor()
    and user_id in (select public.ats_admin_user_ids())
    and application_id is null
  );

-- ---------------------------------------------------------------------------
-- 2) UPDATE: Monitor darf Admin-Pool-Rows inhaltlich bearbeiten
-- ---------------------------------------------------------------------------

drop policy if exists "job_pool_update_monitor_admin_owner" on public.job_pool;
create policy "job_pool_update_monitor_admin_owner"
  on public.job_pool
  for update
  to authenticated
  using (
    public.is_ats_monitor()
    and user_id in (select public.ats_admin_user_ids())
  )
  with check (
    public.is_ats_monitor()
    and user_id in (select public.ats_admin_user_ids())
  );

-- ---------------------------------------------------------------------------
-- 3) Guard: application_type / application_id / user_id für Monitor unveränderlich
-- ---------------------------------------------------------------------------

create or replace function public.job_pool_monitor_write_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admin (eigene Rows) und Service-Rollen bleiben unberührt
  if not public.is_ats_monitor() or public.is_ats_admin() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id then
      raise exception 'Monitor darf den Pool-Besitzer nicht ändern';
    end if;
    if new.application_type is distinct from old.application_type then
      raise exception 'Monitor darf den Bewerbungstyp (Regulär/Initiativ) nicht ändern';
    end if;
    if new.application_id is distinct from old.application_id then
      raise exception 'Monitor darf keine Bewerbung verknüpfen oder lösen';
    end if;
  end if;

  if tg_op = 'INSERT' then
    if new.application_id is not null then
      raise exception 'Monitor darf keine Bewerbung beim Anlegen verknüpfen';
    end if;
  end if;

  return new;
end;
$$;

comment on function public.job_pool_monitor_write_guard() is
  'Verhindert, dass Monitor application_type/application_id/user_id am Job-Pool ändert.';

drop trigger if exists job_pool_monitor_write_guard on public.job_pool;
create trigger job_pool_monitor_write_guard
  before insert or update on public.job_pool
  for each row
  execute function public.job_pool_monitor_write_guard();

revoke all on function public.job_pool_monitor_write_guard() from public;
