export type SubmitMostLikelyErrorCode =
  | 'PARTICIPANT_NOT_IN_ROOM'
  | 'ROUND_NOT_FOUND'
  | 'ROUND_NOT_CURRENT'
  | 'ROUND_NOT_MOST_LIKELY'
  | 'ROUND_NOT_ACCEPTING_SUBMISSIONS'
  | 'TARGET_NOT_IN_MATCH';

export type SubmitMostLikelyResult =
  | { ok: true; alreadySubmitted: boolean }
  | { ok: false; code: SubmitMostLikelyErrorCode };

export type SubmitMostLikelyDeps = {
  getContext(input: { roomId: string; matchId: string; roundId: string; actorParticipantId: string; targetParticipantId: string }): Promise<{
    participantExists: boolean;
    targetExistsInMatch: boolean;
    match: { id: string; current_round_id: string | null } | null;
    round: { id: string; status: 'waiting' | 'question' | 'locked' | 'reveal' | 'finished'; game_type: string } | null;
  }>;
  insertSubmission(input: {
    roundId: string;
    matchId: string;
    roomId: string;
    participantId: string;
    targetParticipantId: string;
    now: string;
  }): Promise<{ inserted: boolean }>;
};

export async function submitMostLikelyVote(
  deps: SubmitMostLikelyDeps,
  input: { roomId: string; matchId: string; roundId: string; actorParticipantId: string; targetParticipantId: string; now?: string },
): Promise<SubmitMostLikelyResult> {
  const now = input.now ?? new Date().toISOString();
  const context = await deps.getContext(input);

  if (!context.participantExists) return { ok: false, code: 'PARTICIPANT_NOT_IN_ROOM' };
  if (!context.match || !context.round) return { ok: false, code: 'ROUND_NOT_FOUND' };
  if (context.match.current_round_id !== context.round.id) return { ok: false, code: 'ROUND_NOT_CURRENT' };
  if (context.round.game_type !== 'most_likely_to') return { ok: false, code: 'ROUND_NOT_MOST_LIKELY' };
  if (context.round.status !== 'question') return { ok: false, code: 'ROUND_NOT_ACCEPTING_SUBMISSIONS' };
  if (!context.targetExistsInMatch) return { ok: false, code: 'TARGET_NOT_IN_MATCH' };

  const inserted = await deps.insertSubmission({
    roundId: input.roundId,
    matchId: input.matchId,
    roomId: input.roomId,
    participantId: input.actorParticipantId,
    targetParticipantId: input.targetParticipantId,
    now,
  });

  return { ok: true, alreadySubmitted: !inserted.inserted };
}
