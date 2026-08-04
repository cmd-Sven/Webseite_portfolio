-- Bewerbungs-Zeitstempel für Kalender-Export / Follow-up
-- Beim Wechsel auf Status „Beworben“ wird applied_at gesetzt (Client und/oder Trigger).

alter table public.applications
  add column if not exists applied_at timestamptz;

comment on column public.applications.applied_at is
  'Zeitpunkt der Bewerbung (gesetzt beim Status Beworben)';

create or replace function public.set_applications_applied_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'Beworben'
     and (tg_op = 'INSERT' or old.status is distinct from 'Beworben') then
    new.applied_at := coalesce(new.applied_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists applications_set_applied_at on public.applications;
create trigger applications_set_applied_at
  before insert or update of status on public.applications
  for each row
  execute function public.set_applications_applied_at();
