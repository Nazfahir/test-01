export type RoundStatus = 'waiting' | 'question' | 'locked' | 'reveal' | 'finished';
export type RoundFlowAction = 'lock' | 'reveal' | 'advance';

export type RoundFlowErrorCode =
  | 'NOT_HOST'
  | 'ROOM_NOT_IN_GAME'
  | 'MATCH_NOT_ACTIVE'
  | 'ROUND_NOT_CURRENT'
  | 'INVALID_ROUND_STATE'
  | 'ROUND_NOT_FOUND';

export type RoundFlowResult = { ok: true; nextRoundId?: string | null; matchFinished?: boolean } | { ok: false; code: RoundFlowErrorCode };

export const ROUND_TRANSITIONS: Record<RoundStatus, RoundStatus[]> = {
  waiting: ['question'],
  question: ['locked'],
  locked: ['reveal'],
  reveal: ['finished'],
  finished: [],
};

export function canTransitionRound(from: RoundStatus, to: RoundStatus): boolean {
  return ROUND_TRANSITIONS[from].includes(to);
}

export type RoundFlowDeps = {
  getContext(input: { roomId: string; matchId: string; roundId: string }): Promise<{
    room: { status: 'lobby' | 'in_game' | 'results' | 'closed' | 'expired'; host_participant_id: string | null } | null;
    match: { id: string; status: 'created' | 'in_progress' | 'finished' | 'cancelled'; current_round_id: string | null } | null;
    round: { id: string; match_id: string; status: RoundStatus; round_order: number } | null;
  }>;
  lockRoundWithSkips(input: { roomId: string; matchId: string; roundId: string; now: string }): Promise<boolean>;
  updateRoundState(input: { roundId: string; expectedStatus: RoundStatus; nextStatus: RoundStatus; now: string }): Promise<boolean>;
  completeRoundAndAdvance(input: { roomId: string; matchId: string; roundId: string; roundOrder: number; now: string }): Promise<{ nextRoundId: string | null; matchFinished: boolean } | null>;
};

export async function transitionRound(deps: RoundFlowDeps, input: { roomId: string; matchId: string; roundId: string; actorParticipantId: string; action: RoundFlowAction; now?: string }): Promise<RoundFlowResult> {
  const now = input.now ?? new Date().toISOString();
  const context = await deps.getContext({ roomId: input.roomId, matchId: input.matchId, roundId: input.roundId });
  if (!context.room || !context.match || !context.round) return { ok: false, code: 'ROUND_NOT_FOUND' };
  if (context.room.host_participant_id !== input.actorParticipantId) return { ok: false, code: 'NOT_HOST' };
  if (context.room.status !== 'in_game') return { ok: false, code: 'ROOM_NOT_IN_GAME' };
  if (!['created', 'in_progress'].includes(context.match.status)) return { ok: false, code: 'MATCH_NOT_ACTIVE' };
  if (context.match.current_round_id !== context.round.id) return { ok: false, code: 'ROUND_NOT_CURRENT' };

  if (input.action === 'lock') {
    if (!canTransitionRound(context.round.status, 'locked')) return { ok: false, code: 'INVALID_ROUND_STATE' };
    const ok = await deps.lockRoundWithSkips({ roomId: input.roomId, matchId: input.matchId, roundId: input.roundId, now });
    return ok ? { ok: true } : { ok: false, code: 'INVALID_ROUND_STATE' };
  }

  if (input.action === 'reveal') {
    if (!canTransitionRound(context.round.status, 'reveal')) return { ok: false, code: 'INVALID_ROUND_STATE' };
    const ok = await deps.updateRoundState({ roundId: input.roundId, expectedStatus: 'locked', nextStatus: 'reveal', now });
    return ok ? { ok: true } : { ok: false, code: 'INVALID_ROUND_STATE' };
  }

  if (!canTransitionRound(context.round.status, 'finished')) return { ok: false, code: 'INVALID_ROUND_STATE' };
  const advanced = await deps.completeRoundAndAdvance({ roomId: input.roomId, matchId: input.matchId, roundId: input.roundId, roundOrder: context.round.round_order, now });
  if (!advanced) return { ok: false, code: 'INVALID_ROUND_STATE' };
  return { ok: true, nextRoundId: advanced.nextRoundId, matchFinished: advanced.matchFinished };
}
