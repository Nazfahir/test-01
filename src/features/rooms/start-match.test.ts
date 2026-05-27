import { describe, expect, it } from 'vitest';
import { startMatch, type RoundGameType, type StartMatchDeps } from '@/features/rooms/start-match';

function buildDeps(overrides?: Partial<StartMatchDeps>): StartMatchDeps {
  const room = { id: 'room-1', room_code: 'ABCDE', status: 'lobby' as const, selected_mode: 'soft' as const, min_players: 3, max_players: 8, host_participant_id: 'host-1' };
  return {
    async findRoom() { return room; },
    async countActiveParticipants() { return 4; },
    async findActiveMatch() { return null; },
    async takePrompts() {
      return [
        { id: 'p1', game_type: 'would_you_rather' as RoundGameType },
        { id: 'p2', game_type: 'most_likely_to' as RoundGameType },
        { id: 'p3', game_type: 'dont_repeat' as RoundGameType },
      ];
    },
    async createMatchWithRounds() {
      return {
        match: { id: 'm1', room_id: 'room-1', status: 'in_progress' as const },
        rounds: [
          { id: 'r1', round_order: 1, game_type: 'would_you_rather' as RoundGameType, status: 'question' as const },
          { id: 'r2', round_order: 2, game_type: 'most_likely_to' as RoundGameType, status: 'waiting' as const },
          { id: 'r3', round_order: 3, game_type: 'dont_repeat' as RoundGameType, status: 'waiting' as const },
        ],
        currentRoundId: 'r1',
      };
    },
    ...overrides,
  };
}

describe('startMatch use case', () => {
  it('crea exactamente 1 match y 3 rounds en orden MVP', async () => {
    let createCalls = 0;
    const deps = buildDeps({
      async createMatchWithRounds(input) {
        createCalls += 1;
        expect(input.promptsByType).toEqual({ would_you_rather: 'p1', most_likely_to: 'p2', dont_repeat: 'p3' });
        return {
          match: { id: 'm1', room_id: 'room-1', status: 'in_progress' },
          rounds: [
            { id: 'r1', round_order: 1, game_type: 'would_you_rather', status: 'question' },
            { id: 'r2', round_order: 2, game_type: 'most_likely_to', status: 'waiting' },
            { id: 'r3', round_order: 3, game_type: 'dont_repeat', status: 'waiting' },
          ],
          currentRoundId: 'r1',
        };
      },
    });

    const result = await startMatch(deps, { roomCode: 'ABCDE', actorParticipantId: 'host-1' });

    expect(result.ok).toBe(true);
    expect(createCalls).toBe(1);
  });

  it('falla con 2 jugadores y con >8', async () => {
    const low = await startMatch(buildDeps({ async countActiveParticipants() { return 2; } }), { roomCode: 'ABCDE', actorParticipantId: 'host-1' });
    const high = await startMatch(buildDeps({ async countActiveParticipants() { return 9; } }), { roomCode: 'ABCDE', actorParticipantId: 'host-1' });

    expect(low).toEqual({ ok: false, code: 'INVALID_PLAYER_COUNT' });
    expect(high).toEqual({ ok: false, code: 'INVALID_PLAYER_COUNT' });
  });

  it('falla si no host', async () => {
    const result = await startMatch(buildDeps(), { roomCode: 'ABCDE', actorParticipantId: 'guest-2' });
    expect(result).toEqual({ ok: false, code: 'NOT_HOST' });
  });

  it('falla si falta algún prompt del modo', async () => {
    const result = await startMatch(
      buildDeps({
        async takePrompts() {
          return [{ id: 'p1', game_type: 'would_you_rather' }, { id: 'p2', game_type: 'most_likely_to' }];
        },
      }),
      { roomCode: 'ABCDE', actorParticipantId: 'host-1' },
    );

    expect(result).toEqual({ ok: false, code: 'PROMPTS_UNAVAILABLE' });
  });

  it('no duplica partida ante reintento inmediato', async () => {
    const result = await startMatch(
      buildDeps({
        async findActiveMatch() {
          return { id: 'm1', currentRoundId: 'r1' };
        },
      }),
      { roomCode: 'ABCDE', actorParticipantId: 'host-1' },
    );

    expect(result).toEqual({ ok: true, roomCode: 'ABCDE', matchId: 'm1', currentRoundId: 'r1', alreadyStarted: true });
  });
});
