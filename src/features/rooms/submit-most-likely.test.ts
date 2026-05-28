import { describe, expect, it } from 'vitest';
import { submitMostLikelyVote, type SubmitMostLikelyDeps } from '@/features/rooms/submit-most-likely';

function deps(overrides?: Partial<SubmitMostLikelyDeps>): SubmitMostLikelyDeps {
  return {
    async getContext() {
      return {
        participantExists: true,
        targetExistsInMatch: true,
        match: { id: 'm1', current_round_id: 'r1' },
        round: { id: 'r1', status: 'question', game_type: 'most_likely_to' },
      };
    },
    async insertSubmission() {
      return { inserted: true };
    },
    ...overrides,
  };
}

describe('submit most likely vote', () => {
  it('acepta submit válido durante question', async () => {
    const result = await submitMostLikelyVote(deps(), {
      roomId: 'room-1',
      matchId: 'm1',
      roundId: 'r1',
      actorParticipantId: 'p1',
      targetParticipantId: 'p2',
    });

    expect(result).toEqual({ ok: true, alreadySubmitted: false });
  });

  it('falla si ronda no es most_likely', async () => {
    const result = await submitMostLikelyVote(
      deps({ async getContext() { return { participantExists: true, targetExistsInMatch: true, match: { id: 'm1', current_round_id: 'r1' }, round: { id: 'r1', status: 'question', game_type: 'would_you_rather' } }; } }),
      { roomId: 'room-1', matchId: 'm1', roundId: 'r1', actorParticipantId: 'p1', targetParticipantId: 'p2' },
    );

    expect(result).toEqual({ ok: false, code: 'ROUND_NOT_MOST_LIKELY' });
  });

  it('falla si target no pertenece a la sala/match', async () => {
    const result = await submitMostLikelyVote(
      deps({ async getContext() { return { participantExists: true, targetExistsInMatch: false, match: { id: 'm1', current_round_id: 'r1' }, round: { id: 'r1', status: 'question', game_type: 'most_likely_to' } }; } }),
      { roomId: 'room-1', matchId: 'm1', roundId: 'r1', actorParticipantId: 'p1', targetParticipantId: 'external' },
    );

    expect(result).toEqual({ ok: false, code: 'TARGET_NOT_IN_MATCH' });
  });

  it('permite auto-voto', async () => {
    const result = await submitMostLikelyVote(deps(), {
      roomId: 'room-1',
      matchId: 'm1',
      roundId: 'r1',
      actorParticipantId: 'p1',
      targetParticipantId: 'p1',
    });

    expect(result).toEqual({ ok: true, alreadySubmitted: false });
  });

  it('no duplica submission por reintento (primer submit gana)', async () => {
    const result = await submitMostLikelyVote(
      deps({ async insertSubmission() { return { inserted: false }; } }),
      { roomId: 'room-1', matchId: 'm1', roundId: 'r1', actorParticipantId: 'p1', targetParticipantId: 'p2' },
    );

    expect(result).toEqual({ ok: true, alreadySubmitted: true });
  });
});
