-- Allow multiple application_plan_slots on the same plan_date.
-- Replaces unique(user_id, plan_date) with sort_order + unique(user_id, plan_date, sort_order).

alter table public.application_plan_slots
  drop constraint if exists application_plan_slots_user_date_key;

alter table public.application_plan_slots
  add column if not exists sort_order integer not null default 0;

-- Backfill stable order for existing rows (same day gets distinct sort_order).
with ranked as (
  select
    id,
    (row_number() over (
      partition by user_id, plan_date
      order by created_at asc, id asc
    ) - 1)::integer as rn
  from public.application_plan_slots
)
update public.application_plan_slots s
set sort_order = ranked.rn
from ranked
where s.id = ranked.id;

alter table public.application_plan_slots
  drop constraint if exists application_plan_slots_user_date_sort_key;

alter table public.application_plan_slots
  add constraint application_plan_slots_user_date_sort_key
  unique (user_id, plan_date, sort_order);

-- Prevent the same pool entry from being planned twice (when assigned).
create unique index if not exists application_plan_slots_user_pool_uidx
  on public.application_plan_slots (user_id, job_pool_id)
  where job_pool_id is not null;

comment on table public.application_plan_slots is
  'Tagesplanung: mehrere Slots pro User und plan_date erlaubt (sort_order). Unique (user_id, plan_date, sort_order).';

comment on column public.application_plan_slots.sort_order is
  'Reihenfolge am selben plan_date (0-basiert).';
