create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_seed text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid null references public.profiles(id) on delete set null,
  room_code text not null unique,
  status text not null default 'lobby' check (status in ('lobby', 'in_game', 'results', 'closed', 'expired')),
  selected_mode text null check (selected_mode in ('soft', 'party')),
  min_players int not null default 3 check (min_players >= 3),
  max_players int not null default 8 check (max_players <= 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  expires_at timestamptz
);

create table if not exists public.guest_sessions (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(trim(display_name)) > 0),
  converted_user_id uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid null references public.profiles(id) on delete set null,
  guest_session_id uuid null references public.guest_sessions(id) on delete set null,
  display_name text,
  is_host boolean not null default false,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint room_participants_user_or_guest_check
    check (
      (user_id is not null and guest_session_id is null)
      or (user_id is null and guest_session_id is not null)
    )
);

create unique index if not exists room_participants_room_user_unique
  on public.room_participants(room_id, user_id)
  where user_id is not null;

create unique index if not exists room_participants_room_guest_unique
  on public.room_participants(room_id, guest_session_id)
  where guest_session_id is not null;

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  game_type text not null check (game_type in ('would_you_rather', 'most_likely_to', 'dont_repeat')),
  mode text not null check (mode in ('soft', 'party')),
  content text not null check (char_length(trim(content)) > 0),
  locale text not null default 'es-AR',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  status text not null default 'created' check (status in ('created', 'in_progress', 'finished', 'cancelled')),
  selected_mode text not null check (selected_mode in ('soft', 'party')),
  rounds_count int not null default 3 check (rounds_count = 3),
  created_by_participant_id uuid null references public.room_participants(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  round_order int not null check (round_order between 1 and 3),
  game_type text not null check (game_type in ('would_you_rather', 'most_likely_to', 'dont_repeat')),
  prompt_id uuid null references public.prompts(id) on delete set null,
  status text not null default 'waiting' check (status in ('waiting', 'question', 'locked', 'reveal', 'finished')),
  started_at timestamptz,
  locked_at timestamptz,
  reveal_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, round_order)
);

create table if not exists public.round_submissions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  participant_id uuid not null references public.room_participants(id) on delete cascade,
  submission_type text not null check (submission_type in ('vote', 'text_answer', 'choice', 'skip')),
  status text not null default 'submitted' check (status in ('submitted', 'skipped', 'invalid')),
  target_participant_id uuid null references public.room_participants(id) on delete set null,
  answer_text text,
  choice_key text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (round_id, participant_id)
);

create table if not exists public.relationship_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  round_id uuid null references public.rounds(id) on delete set null,
  actor_participant_id uuid not null references public.room_participants(id) on delete cascade,
  target_participant_id uuid not null references public.room_participants(id) on delete cascade,
  event_type text not null,
  points_delta int not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.relationship_summaries (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  participant_a_id uuid not null references public.room_participants(id) on delete cascade,
  participant_b_id uuid not null references public.room_participants(id) on delete cascade,
  affinity_score int not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint participant_pair_order check (participant_a_id < participant_b_id),
  unique (match_id, participant_a_id, participant_b_id)
);

create table if not exists public.currency_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid null references public.rooms(id) on delete set null,
  match_id uuid null references public.matches(id) on delete set null,
  round_id uuid null references public.rounds(id) on delete set null,
  participant_id uuid null references public.room_participants(id) on delete set null,
  amount int not null,
  source_type text not null,
  source_id uuid not null,
  event_type text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, source_type, source_id)
);

create index if not exists rooms_status_created_at_idx on public.rooms(status, created_at desc);
create index if not exists rooms_expires_at_idx on public.rooms(expires_at);
create index if not exists room_participants_room_id_idx on public.room_participants(room_id);
create index if not exists matches_room_id_status_idx on public.matches(room_id, status);
create index if not exists rounds_match_id_round_order_idx on public.rounds(match_id, round_order);
create index if not exists rounds_room_id_status_idx on public.rounds(room_id, status);
create index if not exists round_submissions_round_id_idx on public.round_submissions(round_id);
create index if not exists round_submissions_match_id_idx on public.round_submissions(match_id);
create index if not exists round_submissions_participant_id_idx on public.round_submissions(participant_id);
create index if not exists relationship_events_room_id_idx on public.relationship_events(room_id);
create index if not exists relationship_events_match_id_idx on public.relationship_events(match_id);
create index if not exists relationship_events_round_id_idx on public.relationship_events(round_id);
create index if not exists relationship_summaries_match_id_idx on public.relationship_summaries(match_id);
create index if not exists currency_transactions_user_id_created_at_idx on public.currency_transactions(user_id, created_at desc);
create index if not exists currency_transactions_match_id_idx on public.currency_transactions(match_id);
