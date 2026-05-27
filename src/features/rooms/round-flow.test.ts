import { describe, expect, it } from 'vitest';
import { canTransitionRound, transitionRound, type RoundFlowDeps } from '@/features/rooms/round-flow';

function deps(overrides?: Partial<RoundFlowDeps>): RoundFlowDeps {
  return {
    async getContext() {
      return {
        room: { status: 'in_game', host_participant_id: 'host-1' },
        match: { id: 'm1', status: 'in_progress', current_round_id: 'r1' },
        round: { id: 'r1', match_id: 'm1', status: 'question', round_order: 1 },
      };
    },
    async lockRoundWithSkips() { return true; },
    async updateRoundState() { return true; },
    async completeRoundAndAdvance() { return { nextRoundId: 'r2', matchFinished: false }; },
    ...overrides,
  };
}

describe('round flow', () => {
  it('permite solo transiciones válidas', () => {
    expect(canTransitionRound('question', 'locked')).toBe(true);
    expect(canTransitionRound('question', 'reveal')).toBe(false);
  });

  it('bloquea no-host', async () => {
    const result = await transitionRound(deps(), { roomId: 'room-1', matchId: 'm1', roundId: 'r1', actorParticipantId: 'guest-1', action: 'lock' });
    expect(result).toEqual({ ok: false, code: 'NOT_HOST' });
  });

  it('crea lock válido', async () => {
    const result = await transitionRound(deps(), { roomId: 'room-1', matchId: 'm1', roundId: 'r1', actorParticipantId: 'host-1', action: 'lock' });
    expect(result).toEqual({ ok: true });
  });

  it('bloquea salto inválido de question a finished', async () => {
    const result = await transitionRound(deps(), { roomId: 'room-1', matchId: 'm1', roundId: 'r1', actorParticipantId: 'host-1', action: 'advance' });
    expect(result).toEqual({ ok: false, code: 'INVALID_ROUND_STATE' });
  });

  it('no duplica skip en reintento cuando lock ya quedó aplicado', async () => {
    const result = await transitionRound(
      deps({
        async lockRoundWithSkips() { return false; },
      }),
      { roomId: 'room-1', matchId: 'm1', roundId: 'r1', actorParticipantId: 'host-1', action: 'lock' },
    );
    expect(result).toEqual({ ok: false, code: 'INVALID_ROUND_STATE' });
  });

  it('termina ronda 3 y finaliza match', async () => {
    const result = await transitionRound(
      deps({
        async getContext() {
          return {
            room: { status: 'in_game', host_participant_id: 'host-1' },
            match: { id: 'm1', status: 'in_progress', current_round_id: 'r3' },
            round: { id: 'r3', match_id: 'm1', status: 'reveal', round_order: 3 },
          };
        },
        async completeRoundAndAdvance() { return { nextRoundId: null, matchFinished: true }; },
      }),
      { roomId: 'room-1', matchId: 'm1', roundId: 'r3', actorParticipantId: 'host-1', action: 'advance' },
    );
    expect(result).toEqual({ ok: true, nextRoundId: null, matchFinished: true });
  });
});
