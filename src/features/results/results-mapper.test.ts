import { describe, expect, it } from 'vitest';
import { buildCurrencySummary, buildRelationshipHighlights } from '@/features/results/results-mapper';

describe('buildRelationshipHighlights', () => {
  it('agrega pares y excluye self-events', () => {
    const rows = buildRelationshipHighlights(
      [
        { id: 'a', displayName: 'Ana', isGuest: false },
        { id: 'b', displayName: 'Beto', isGuest: true },
      ],
      [
        { actorParticipantId: 'a', targetParticipantId: 'b', pointsDelta: 2, eventType: 'same_choice' },
        { actorParticipantId: 'b', targetParticipantId: 'a', pointsDelta: 1, eventType: 'played_together' },
        { actorParticipantId: 'a', targetParticipantId: 'a', pointsDelta: 9, eventType: 'ignored' },
      ],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ pairLabel: 'Ana ✦ Beto', totalPoints: 3 });
  });
});

describe('buildCurrencySummary', () => {
  it('calcula total y desglose por fuente', () => {
    const summary = buildCurrencySummary([
      { sourceType: 'round_completed', amount: 5 },
      { sourceType: 'round_completed', amount: 5 },
      { sourceType: 'match_completed', amount: 20 },
    ]);

    expect(summary.total).toBe(30);
    expect(summary.breakdown).toEqual([
      { sourceType: 'match_completed', amount: 20 },
      { sourceType: 'round_completed', amount: 10 },
    ]);
  });
});
