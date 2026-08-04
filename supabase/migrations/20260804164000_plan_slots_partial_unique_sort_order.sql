-- Avoid collisions with erledigte/uebersprungene slots on the same day.
alter table public.application_plan_slots
  drop constraint if exists application_plan_slots_user_date_sort_key;

drop index if exists application_plan_slots_user_date_sort_active_uidx;

create unique index application_plan_slots_user_date_sort_active_uidx
  on public.application_plan_slots (user_id, plan_date, sort_order)
  where status in ('offen', 'zugewiesen');
