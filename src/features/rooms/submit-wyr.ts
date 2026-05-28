export type SubmitWyrErrorCode =
  | 'PARTICIPANT_NOT_IN_ROOM'
  | 'ROUND_NOT_FOUND'
  | 'ROUND_NOT_CURRENT'
  | 'ROUND_NOT_WYR'
  | 'ROUND_NOT_ACCEPTING_SUBMISSIONS'
  | 'PROMPT_OPTIONS_CORRUPTED'
  | 'INVALID_CHOICE';

export type SubmitWyrResult =
  | { ok: true; alreadySubmitted: boolean }
  | { ok: false; code: SubmitWyrErrorCode };

export type SubmitWyrDeps = {
  getContext(input: { roomId: string; matchId: string; roundId: string; actorParticipantId: string }): Promise<{
    participantExists: boolean;
    match: { id: string; current_round_id: string | null } | null;
    round: { id: string; status: 'waiting' | 'question' | 'locked' | 'reveal' | 'finished'; game_type: string; prompt_id: string | null } | null;
    prompt: { options: unknown } | null;
  }>;
  insertSubmission(input: { roundId: string; matchId: string; roomId: string; participantId: string; choiceKey: string; now: string }): Promise<{ inserted: boolean }>;
};

function isValidBinaryOptions(options: unknown): options is [string, string] {
  return Array.isArray(options)
    && options.length === 2
    && options.every((item) => typeof item === 'string' && item.trim().length > 0);
}

export async function submitWouldYouRatherChoice(
  deps: SubmitWyrDeps,
  input: { roomId: string; matchId: string; roundId: string; actorParticipantId: string; choiceKey: string; now?: string },
): Promise<SubmitWyrResult> {
  const now = input.now ?? new Date().toISOString();
  const context = await deps.getContext(input);

  if (!context.participantExists) return { ok: false, code: 'PARTICIPANT_NOT_IN_ROOM' };
  if (!context.match || !context.round) return { ok: false, code: 'ROUND_NOT_FOUND' };
  if (context.match.current_round_id !== context.round.id) return { ok: false, code: 'ROUND_NOT_CURRENT' };
  if (context.round.game_type !== 'would_you_rather') return { ok: false, code: 'ROUND_NOT_WYR' };
  if (context.round.status !== 'question') return { ok: false, code: 'ROUND_NOT_ACCEPTING_SUBMISSIONS' };

  const options = context.prompt?.options;
  if (!isValidBinaryOptions(options)) return { ok: false, code: 'PROMPT_OPTIONS_CORRUPTED' };
  if (!options.includes(input.choiceKey)) return { ok: false, code: 'INVALID_CHOICE' };

  const inserted = await deps.insertSubmission({
    roundId: input.roundId,
    matchId: input.matchId,
    roomId: input.roomId,
    participantId: input.actorParticipantId,
    choiceKey: input.choiceKey,
    now,
  });

  return { ok: true, alreadySubmitted: !inserted.inserted };
}
