import { describe, expect, it } from 'vitest';
import { buildMatchCurrencyGrants, buildRoundCurrencyGrants } from '@/features/currency/currencyScoring';

describe('currencyScoring', () => {
  it('excludes skipped from round-specific bonuses', () => {
    const grants = buildRoundCurrencyGrants({
      matchId: 'm1',
      roundId: 'r1',
      gameType: 'would_you_rather',
      submissions: [
        { participantId: 'p1', status: 'submitted', choiceKey: 'A' },
        { participantId: 'p2', status: 'submitted', choiceKey: 'A' },
        { participantId: 'p3', status: 'skipped' },
      ],
    });
    expect(grants.some((g) => g.participantId === 'p3')).toBe(false);
    expect(grants.filter((g) => g.sourceType === 'same_choice_bonus')).toHaveLength(2);
  });

  it('allows auto-vote and grants received_vote_bonus', () => {
    const grants = buildRoundCurrencyGrants({
      matchId: 'm1',
      roundId: 'r2',
      gameType: 'most_likely_to',
      submissions: [{ participantId: 'p1', status: 'submitted', value: { target_participant_id: 'p1' } }],
    });
    expect(grants.some((g) => g.sourceType === 'received_vote_bonus' && g.participantId === 'p1')).toBe(true);
  });

  it('returns deterministic source ids for retries', () => {
    const a = buildRoundCurrencyGrants({
      matchId: 'm1',
      roundId: 'r3',
      gameType: 'dont_repeat',
      submissions: [{ participantId: 'p1', status: 'submitted', value: { normalized_text: 'pizza' } }],
    }).map((g) => g.sourceId).sort();

    const b = buildRoundCurrencyGrants({
      matchId: 'm1',
      roundId: 'r3',
      gameType: 'dont_repeat',
      submissions: [{ participantId: 'p1', status: 'submitted', value: { normalized_text: 'pizza' } }],
    }).map((g) => g.sourceId).sort();

    expect(a).toEqual(b);
  });

  it('builds match completion grants for each eligible participant', () => {
    const grants = buildMatchCurrencyGrants({ matchId: 'm9', eligibleParticipantIds: ['p1', 'p2'] });
    expect(grants).toHaveLength(4);
  });
});
