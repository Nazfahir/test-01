alter table public.room_participants
  add column if not exists connection_status text not null default 'connected' check (connection_status in ('connected', 'disconnected')),
  add column if not exists last_seen_at timestamptz not null default now();

create index if not exists room_participants_room_status_idx
  on public.room_participants(room_id, connection_status, left_at);
