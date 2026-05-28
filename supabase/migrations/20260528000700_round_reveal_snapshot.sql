alter table public.rounds
  add column if not exists reveal_snapshot jsonb;
