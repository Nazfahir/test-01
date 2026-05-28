alter table public.rooms
  add column if not exists host_participant_id uuid null references public.room_participants(id) on delete set null;

create index if not exists rooms_host_participant_id_idx on public.rooms(host_participant_id);
