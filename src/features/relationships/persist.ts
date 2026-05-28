import type { SupabaseClient } from '@supabase/supabase-js';
import { buildCompletedMatchEvents, buildRoundRelationshipEvents, type RelationshipRoundGameType, type ScoringParticipant } from '@/features/relationships/relationshipScoring';

type RoundSubmissionRow = { participant_id: string; status: 'submitted' | 'skipped' | 'invalid'; choice_key: string | null; value: unknown };
type ParticipantRow = { id: string; user_id: string | null };

async function persistEvents(
  supabase: SupabaseClient,
  input: { roomId: string; matchId: string; roundId: string | null; sourceGameType: RelationshipRoundGameType | 'match'; events: ReturnType<typeof buildRoundRelationshipEvents> },
) {
  const keys = input.events.map((e) => e.key);
  if (keys.length === 0) return;
  const { data: existing } = await supabase.from('relationship_events').select('metadata').eq('match_id', input.matchId).contains('metadata', {});
  const existingKeys = new Set(
    (existing ?? [])
      .map((row) => (row.metadata as { idempotency_key?: string } | null)?.idempotency_key)
      .filter((k): k is string => Boolean(k)),
  );
  const toInsert = input.events.filter((e) => !existingKeys.has(e.key));
  if (toInsert.length === 0) return;
  await supabase.from('relationship_events').insert(toInsert.map((e) => ({
    room_id: input.roomId,
    match_id: input.matchId,
    round_id: input.roundId,
    actor_participant_id: e.actorParticipantId,
    target_participant_id: e.targetParticipantId,
    event_type: e.eventType,
    points_delta: e.delta,
    metadata: { ...(e.metadata ?? {}), idempotency_key: e.key, source_game_type: input.sourceGameType },
  })));
}

export async function scoreRoundReveal(supabase: SupabaseClient, input: { roomId: string; matchId: string; roundId: string; gameType: RelationshipRoundGameType }) {
  const [submissionsRes, participantsRes] = await Promise.all([
    supabase.from('round_submissions').select('participant_id,status,choice_key,value').eq('round_id', input.roundId),
    supabase.from('room_participants').select('id').eq('room_id', input.roomId).is('left_at', null),
  ]);
  const events = buildRoundRelationshipEvents({
    roomId: input.roomId,
    matchId: input.matchId,
    roundId: input.roundId,
    gameType: input.gameType,
    submissions: (submissionsRes.data ?? []).map((s: RoundSubmissionRow) => ({ participantId: s.participant_id, status: s.status, choiceKey: s.choice_key, value: s.value })),
    activeParticipantIds: (participantsRes.data ?? []).map((p) => p.id),
  });
  await persistEvents(supabase, { roomId: input.roomId, matchId: input.matchId, roundId: input.roundId, sourceGameType: input.gameType, events });
}

export async function scoreMatchCompletion(supabase: SupabaseClient, input: { roomId: string; matchId: string }) {
  const { data: participants } = await supabase.from('room_participants').select('id,user_id').eq('room_id', input.roomId).is('left_at', null);
  const completedParticipants: ScoringParticipant[] = (participants ?? []).map((p: ParticipantRow) => ({ participantId: p.id, userId: p.user_id, completedMatch: true }));
  const events = buildCompletedMatchEvents({ matchId: input.matchId, participants: completedParticipants });
  await persistEvents(supabase, { roomId: input.roomId, matchId: input.matchId, roundId: null, sourceGameType: 'match', events });

  const registered = (participants ?? []).filter((p: ParticipantRow) => Boolean(p.user_id));
  for (let i = 0; i < registered.length; i += 1) {
    for (let j = i + 1; j < registered.length; j += 1) {
      const a = registered[i].id;
      const b = registered[j].id;
      const participantAId = a < b ? a : b;
      const participantBId = a < b ? b : a;
      await supabase.from('relationship_summaries').upsert({
        room_id: input.roomId,
        match_id: input.matchId,
        participant_a_id: participantAId,
        participant_b_id: participantBId,
        affinity_score: 0,
      }, { onConflict: 'match_id,participant_a_id,participant_b_id' });
    }
  }
}
