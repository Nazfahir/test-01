import { describe, expect, it } from 'vitest';
import { submitNoRepeatAnswer, type SubmitNoRepeatDeps } from '@/features/rooms/submit-no-repeat';

function deps(overrides?: Partial<SubmitNoRepeatDeps>): SubmitNoRepeatDeps {
  return {
    async getContext() {
      return {
        participantExists: true,
        match: { id: 'm1', current_round_id: 'r1' },
        round: { id: 'r1', status: 'question', game_type: 'dont_repeat' },
      };
    },
    async insertSubmission() {
      return { inserted: true };
    },
    ...overrides,
  };
}

describe('submit no repeat answer', () => {
  it('acepta submit válido y guarda raw/normalized', async () => {
    let payload: unknown;
    const result = await submitNoRepeatAnswer(
      deps({ async insertSubmission(input) { payload = input; return { inserted: true }; } }),
      { roomId: 'room-1', matchId: 'm1', roundId: 'r1', actorParticipantId: 'p1', text: '  La   CANCIÓN  ' },
    );

    expect(result).toEqual({ ok: true, alreadySubmitted: false, normalizedText: 'cancion' });
    expect(payload).toMatchObject({ rawText: '  La   CANCIÓN  ', normalizedText: 'cancion' });
  });

  it('rechaza vacío tras normalización', async () => {
    const result = await submitNoRepeatAnswer(deps(), {
      roomId: 'room-1', matchId: 'm1', roundId: 'r1', actorParticipantId: 'p1', text: ' los la el ',
    });
    expect(result).toEqual({ ok: false, code: 'EMPTY_TEXT' });
  });

  it('solo permite en ronda/estado correctos', async () => {
    const wrongType = await submitNoRepeatAnswer(
      deps({ async getContext() { return { participantExists: true, match: { id: 'm1', current_round_id: 'r1' }, round: { id: 'r1', status: 'question', game_type: 'most_likely_to' } }; } }),
      { roomId: 'room-1', matchId: 'm1', roundId: 'r1', actorParticipantId: 'p1', text: 'hola' },
    );
    expect(wrongType).toEqual({ ok: false, code: 'ROUND_NOT_NO_REPEAT' });

    const wrongStatus = await submitNoRepeatAnswer(
      deps({ async getContext() { return { participantExists: true, match: { id: 'm1', current_round_id: 'r1' }, round: { id: 'r1', status: 'locked', game_type: 'dont_repeat' } }; } }),
      { roomId: 'room-1', matchId: 'm1', roundId: 'r1', actorParticipantId: 'p1', text: 'hola' },
    );
    expect(wrongStatus).toEqual({ ok: false, code: 'ROUND_NOT_ACCEPTING_SUBMISSIONS' });
  });

  it('no duplica submission por retries', async () => {
    const result = await submitNoRepeatAnswer(
      deps({ async insertSubmission() { return { inserted: false }; } }),
      { roomId: 'room-1', matchId: 'm1', roundId: 'r1', actorParticipantId: 'p1', text: 'hola' },
    );
    expect(result).toEqual({ ok: true, alreadySubmitted: true, normalizedText: 'hola' });
  });
});
