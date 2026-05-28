import { NO_REPEAT_MAX_LENGTH, normalizeNoRepeatAnswer } from '@/features/games/no-repeat';

export type SubmitNoRepeatErrorCode =
  | 'PARTICIPANT_NOT_IN_ROOM'
  | 'ROUND_NOT_FOUND'
  | 'ROUND_NOT_CURRENT'
  | 'ROUND_NOT_NO_REPEAT'
  | 'ROUND_NOT_ACCEPTING_SUBMISSIONS'
  | 'EMPTY_TEXT'
  | 'TEXT_TOO_LONG';

export type SubmitNoRepeatResult =
  | { ok: true; alreadySubmitted: boolean; normalizedText: string }
  | { ok: false; code: SubmitNoRepeatErrorCode };

export type SubmitNoRepeatDeps = {
  getContext(input: { roomId: string; matchId: string; roundId: string; actorParticipantId: string }): Promise<{
    participantExists: boolean;
    match: { id: string; current_round_id: string | null } | null;
    round: { id: string; status: 'waiting' | 'question' | 'locked' | 'reveal' | 'finished'; game_type: string } | null;
  }>;
  insertSubmission(input: {
    roundId: string;
    matchId: string;
    roomId: string;
    participantId: string;
    rawText: string;
    normalizedText: string;
    now: string;
  }): Promise<{ inserted: boolean }>;
};

export async function submitNoRepeatAnswer(
  deps: SubmitNoRepeatDeps,
  input: { roomId: string; matchId: string; roundId: string; actorParticipantId: string; text: string; now?: string },
): Promise<SubmitNoRepeatResult> {
  const now = input.now ?? new Date().toISOString();
  const context = await deps.getContext(input);

  if (!context.participantExists) return { ok: false, code: 'PARTICIPANT_NOT_IN_ROOM' };
  if (!context.match || !context.round) return { ok: false, code: 'ROUND_NOT_FOUND' };
  if (context.match.current_round_id !== context.round.id) return { ok: false, code: 'ROUND_NOT_CURRENT' };
  if (context.round.game_type !== 'dont_repeat') return { ok: false, code: 'ROUND_NOT_NO_REPEAT' };
  if (context.round.status !== 'question') return { ok: false, code: 'ROUND_NOT_ACCEPTING_SUBMISSIONS' };

  const normalizedText = normalizeNoRepeatAnswer(input.text);
  if (!normalizedText) return { ok: false, code: 'EMPTY_TEXT' };
  if (normalizedText.length > NO_REPEAT_MAX_LENGTH) return { ok: false, code: 'TEXT_TOO_LONG' };

  const inserted = await deps.insertSubmission({
    roundId: input.roundId,
    matchId: input.matchId,
    roomId: input.roomId,
    participantId: input.actorParticipantId,
    rawText: input.text,
    normalizedText,
    now,
  });

  return { ok: true, alreadySubmitted: !inserted.inserted, normalizedText };
}
