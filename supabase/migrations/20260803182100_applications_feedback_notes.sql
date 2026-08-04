-- Rückmeldung zur Bewerbung (E-Mail/Feedback manuell eintragen)

alter table public.applications
  add column if not exists feedback_notes text,
  add column if not exists feedback_at timestamptz;

comment on column public.applications.feedback_notes is
  'Manuell erfasste Rückmeldung (z. B. aus E-Mail): Interview, Absage, Notizen.';

comment on column public.applications.feedback_at is
  'Zeitpunkt, zu dem die Rückmeldung eingetragen wurde.';
