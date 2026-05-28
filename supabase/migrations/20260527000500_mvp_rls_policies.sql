-- MVP RLS baseline for Orbitas.
-- Goal: prevent cross-room data leaks and client-side unsafe writes.

-- Helper predicates ---------------------------------------------------------
create or replace function public.is_room_member(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_participants rp
    where rp.room_id = target_room_id
      and rp.left_at is null
      and rp.user_id = auth.uid()
  );
$$;

create or replace function public.is_participant_owner(target_participant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_participants rp
    where rp.id = target_participant_id
      and rp.left_at is null
      and rp.user_id = auth.uid()
  );
$$;

create or replace function public.is_room_host(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rooms r
    join public.room_participants host_rp on host_rp.id = r.host_participant_id
    where r.id = target_room_id
      and host_rp.left_at is null
      and host_rp.user_id = auth.uid()
  );
$$;

revoke all on function public.is_room_member(uuid) from public;
revoke all on function public.is_participant_owner(uuid) from public;
revoke all on function public.is_room_host(uuid) from public;
grant execute on function public.is_room_member(uuid) to authenticated;
grant execute on function public.is_participant_owner(uuid) to authenticated;
grant execute on function public.is_room_host(uuid) to authenticated;

-- Enable RLS ---------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.guest_sessions enable row level security;
alter table public.rooms enable row level security;
alter table public.room_participants enable row level security;
alter table public.matches enable row level security;
alter table public.rounds enable row level security;
alter table public.round_submissions enable row level security;
alter table public.relationship_events enable row level security;
alter table public.relationship_summaries enable row level security;
alter table public.currency_transactions enable row level security;

-- Profiles -----------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Guest sessions ------------------------------------------------------------
drop policy if exists guest_sessions_service_role_only on public.guest_sessions;

create policy guest_sessions_service_role_only
  on public.guest_sessions
  for all
  to authenticated
  using (false)
  with check (false);

-- Rooms --------------------------------------------------------------------
drop policy if exists rooms_select_member on public.rooms;

create policy rooms_select_member
  on public.rooms
  for select
  to authenticated
  using (public.is_room_member(id));

-- Room participants ---------------------------------------------------------
drop policy if exists room_participants_select_member on public.room_participants;
drop policy if exists room_participants_insert_self_user on public.room_participants;
drop policy if exists room_participants_update_self_presence on public.room_participants;

create policy room_participants_select_member
  on public.room_participants
  for select
  to authenticated
  using (public.is_room_member(room_id));

create policy room_participants_insert_self_user
  on public.room_participants
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and guest_session_id is null
    and public.is_room_member(room_id)
  );

create policy room_participants_update_self_presence
  on public.room_participants
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Matches ------------------------------------------------------------------
drop policy if exists matches_select_member on public.matches;

create policy matches_select_member
  on public.matches
  for select
  to authenticated
  using (public.is_room_member(room_id));

-- Rounds -------------------------------------------------------------------
drop policy if exists rounds_select_member on public.rounds;

create policy rounds_select_member
  on public.rounds
  for select
  to authenticated
  using (public.is_room_member(room_id));

-- Round submissions ---------------------------------------------------------
drop policy if exists round_submissions_select_member on public.round_submissions;
drop policy if exists round_submissions_insert_own_participant on public.round_submissions;

create policy round_submissions_select_member
  on public.round_submissions
  for select
  to authenticated
  using (public.is_room_member(room_id));

create policy round_submissions_insert_own_participant
  on public.round_submissions
  for insert
  to authenticated
  with check (
    public.is_room_member(room_id)
    and public.is_participant_owner(participant_id)
  );

-- Relationship events -------------------------------------------------------
drop policy if exists relationship_events_select_member on public.relationship_events;

create policy relationship_events_select_member
  on public.relationship_events
  for select
  to authenticated
  using (public.is_room_member(room_id));

-- Relationship summaries ----------------------------------------------------
drop policy if exists relationship_summaries_select_owned_participant on public.relationship_summaries;

create policy relationship_summaries_select_owned_participant
  on public.relationship_summaries
  for select
  to authenticated
  using (
    public.is_participant_owner(participant_a_id)
    or public.is_participant_owner(participant_b_id)
  );

-- Currency transactions -----------------------------------------------------
drop policy if exists currency_transactions_select_own on public.currency_transactions;

create policy currency_transactions_select_own
  on public.currency_transactions
  for select
  to authenticated
  using (user_id = auth.uid());
