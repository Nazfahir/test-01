alter table public.guest_sessions
  add column if not exists converted_at timestamptz;
