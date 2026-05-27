alter table public.matches
  add column if not exists current_round_id uuid null references public.rounds(id) on delete set null;

create index if not exists matches_current_round_id_idx on public.matches(current_round_id);
