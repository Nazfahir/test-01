create table if not exists public.guest_sessions (
  id uuid primary key,
  display_name text not null check (char_length(trim(display_name)) > 0),
  converted_user_id uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.room_participants
  add column if not exists guest_session_id uuid references public.guest_sessions(id),
  add column if not exists display_name text;

alter table public.room_participants
  drop constraint if exists room_participants_user_or_guest_check;

alter table public.room_participants
  add constraint room_participants_user_or_guest_check
  check (
    (user_id is not null and guest_session_id is null)
    or (user_id is null and guest_session_id is not null)
  );

create unique index if not exists room_participants_room_guest_unique
  on public.room_participants(room_id, guest_session_id)
  where guest_session_id is not null;
