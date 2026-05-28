import { describe, expect, it } from 'vitest';
import { buildCompletedMatchEvents, buildRoundRelationshipEvents } from '@/features/relationships/relationshipScoring';

describe('relationshipScoring', () => {
  it('creates played_together pairs for 3-8 submitted participants', () => {
    for (let n = 3; n <= 8; n += 1) {
      const ids = Array.from({ length: n }, (_, i) => `p${i + 1}`);
      const events = buildRoundRelationshipEvents({
        roomId: 'r',
        matchId: 'm',
        roundId: `rd-${n}`,
        gameType: 'would_you_rather',
        activeParticipantIds: ids,
        submissions: ids.map((id) => ({ participantId: id, status: 'submitted' as const, choiceKey: 'A' })),
      });
      const played = events.filter((e) => e.eventType === 'played_together');
      expect(played).toHaveLength((n * (n - 1)) / 2);
    }
  });

  it('ignores skipped users for specific events', () => {
    const events = buildRoundRelationshipEvents({
      roomId: 'r', matchId: 'm', roundId: 'rd', gameType: 'would_you_rather', activeParticipantIds: ['p1', 'p2', 'p3'],
      submissions: [
        { participantId: 'p1', status: 'submitted', choiceKey: 'A' },
        { participantId: 'p2', status: 'submitted', choiceKey: 'A' },
        { participantId: 'p3', status: 'skipped' },
      ],
    });
    expect(events.filter((e) => e.eventType === 'same_choice')).toHaveLength(1);
    expect(events.some((e) => e.actorParticipantId === 'p3' || e.targetParticipantId === 'p3')).toBe(false);
  });

  it('allows self vote without invalid cross-pair links', () => {
    const events = buildRoundRelationshipEvents({
      roomId: 'r', matchId: 'm', roundId: 'rd', gameType: 'most_likely_to', activeParticipantIds: ['p1'],
      submissions: [{ participantId: 'p1', status: 'submitted', value: { target_participant_id: 'p1' } }],
    });
    expect(events.filter((e) => e.eventType === 'voted_for_player')).toHaveLength(1);
    expect(events.filter((e) => e.eventType === 'played_together')).toHaveLength(0);
  });

  it('builds same_choice and repeated_answer only for matching groups', () => {
    const same = buildRoundRelationshipEvents({
      roomId: 'r', matchId: 'm', roundId: 'rd1', gameType: 'would_you_rather', activeParticipantIds: ['p1', 'p2', 'p3'],
      submissions: [
        { participantId: 'p1', status: 'submitted', choiceKey: 'A' },
        { participantId: 'p2', status: 'submitted', choiceKey: 'A' },
        { participantId: 'p3', status: 'submitted', choiceKey: 'B' },
      ],
    });
    expect(same.filter((e) => e.eventType === 'same_choice')).toHaveLength(1);

    const repeated = buildRoundRelationshipEvents({
      roomId: 'r', matchId: 'm', roundId: 'rd2', gameType: 'dont_repeat', activeParticipantIds: ['p1', 'p2', 'p3'],
      submissions: [
        { participantId: 'p1', status: 'submitted', value: { normalized_text: 'pizza' } },
        { participantId: 'p2', status: 'submitted', value: { normalized_text: 'pizza' } },
        { participantId: 'p3', status: 'submitted', value: { normalized_text: 'taco' } },
      ],
    });
    expect(repeated.filter((e) => e.eventType === 'repeated_answer')).toHaveLength(1);
  });

  it('applies completed_match only to completed participants', () => {
    const events = buildCompletedMatchEvents({
      matchId: 'm1',
      participants: [
        { participantId: 'p1', userId: 'u1', completedMatch: true },
        { participantId: 'p2', userId: null, completedMatch: true },
        { participantId: 'p3', userId: 'u3', completedMatch: false },
      ],
    });
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('completed_match');
  });

  it('generates stable idempotency keys across retries', () => {
    const input = {
      roomId: 'r', matchId: 'm', roundId: 'rd', gameType: 'would_you_rather' as const, activeParticipantIds: ['p1', 'p2'],
      submissions: [
        { participantId: 'p1', status: 'submitted' as const, choiceKey: 'A' },
        { participantId: 'p2', status: 'submitted' as const, choiceKey: 'A' },
      ],
    };
    const a = buildRoundRelationshipEvents(input).map((e) => e.key).sort();
    const b = buildRoundRelationshipEvents(input).map((e) => e.key).sort();
    expect(a).toEqual(b);
  });
});
