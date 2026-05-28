import { describe, expect, it } from 'vitest';
import { submitWouldYouRatherChoice, type SubmitWyrDeps } from '@/features/rooms/submit-wyr';

function deps(overrides?: Partial<SubmitWyrDeps>): SubmitWyrDeps {
  return {
    async getContext() {
      return {
        participantExists: true,
        match: { id: 'm1', current_round_id: 'r1' },
        round: { id: 'r1', status: 'question', game_type: 'would_you_rather', prompt_id: 'p1' },
        prompt: { options: ['A', 'B'] },
      };
    },
    async insertSubmission() {
      return { inserted: true };
    },
    ...overrides,
  };
}

describe('submit would you rather choice', () => {
  it('acepta submit válido durante question', async () => {
    const result = await submitWouldYouRatherChoice(deps(), {
      roomId: 'room-1',
      matchId: 'm1',
      roundId: 'r1',
      actorParticipantId: 'p1',
      choiceKey: 'A',
    });

    expect(result).toEqual({ ok: true, alreadySubmitted: false });
  });

  it('falla fuera de estado permitido', async () => {
    const result = await submitWouldYouRatherChoice(
      deps({ async getContext() { return { participantExists: true, match: { id: 'm1', current_round_id: 'r1' }, round: { id: 'r1', status: 'locked', game_type: 'would_you_rather', prompt_id: 'p1' }, prompt: { options: ['A', 'B'] } }; } }),
      { roomId: 'room-1', matchId: 'm1', roundId: 'r1', actorParticipantId: 'p1', choiceKey: 'A' },
    );

    expect(result).toEqual({ ok: false, code: 'ROUND_NOT_ACCEPTING_SUBMISSIONS' });
  });

  it('falla si participante no pertenece a sala', async () => {
    const result = await submitWouldYouRatherChoice(
      deps({ async getContext() { return { participantExists: false, match: null, round: null, prompt: null }; } }),
      { roomId: 'room-1', matchId: 'm1', roundId: 'r1', actorParticipantId: 'x', choiceKey: 'A' },
    );

    expect(result).toEqual({ ok: false, code: 'PARTICIPANT_NOT_IN_ROOM' });
  });

  it('falla si opción es inválida', async () => {
    const result = await submitWouldYouRatherChoice(deps(), {
      roomId: 'room-1',
      matchId: 'm1',
      roundId: 'r1',
      actorParticipantId: 'p1',
      choiceKey: 'X',
    });

    expect(result).toEqual({ ok: false, code: 'INVALID_CHOICE' });
  });

  it('no duplica submission por reintento (primer submit gana)', async () => {
    const result = await submitWouldYouRatherChoice(
      deps({ async insertSubmission() { return { inserted: false }; } }),
      { roomId: 'room-1', matchId: 'm1', roundId: 'r1', actorParticipantId: 'p1', choiceKey: 'A' },
    );

    expect(result).toEqual({ ok: true, alreadySubmitted: true });
  });
});
