import { describe, expect, it } from 'vitest';
import { buildMostLikelyReveal, buildNoRepeatReveal, buildRoundReveal, buildWouldYouRatherReveal } from '@/features/rooms/reveal';

const participants = [
  { id: 'p1', display_name: 'Ana' },
  { id: 'p2', display_name: 'Beto' },
  { id: 'p3', display_name: 'Cami' },
];

describe('reveal builders', () => {
  it('builds would_you_rather reveal excluding skips', () => {
    const reveal = buildWouldYouRatherReveal({
      participants,
      options: ['A', 'B'],
      submissions: [
        { participant_id: 'p1', status: 'submitted', submission_type: 'choice', choice_key: 'A' },
        { participant_id: 'p2', status: 'submitted', submission_type: 'choice', choice_key: 'A' },
        { participant_id: 'p3', status: 'skipped', submission_type: 'skip' },
      ],
    });

    expect(reveal.totals).toEqual({ submitted: 2, skipped: 1 });
    expect(reveal.by_option[0].count).toBe(2);
    expect(reveal.matches.has_consensus).toBe(true);
  });

  it('builds most_likely allowing self vote', () => {
    const reveal = buildMostLikelyReveal({
      participants,
      submissions: [
        { participant_id: 'p1', status: 'submitted', submission_type: 'vote', value: { target_participant_id: 'p1' } },
        { participant_id: 'p2', status: 'submitted', submission_type: 'vote', value: { target_participant_id: 'p1' } },
        { participant_id: 'p3', status: 'skipped', submission_type: 'skip' },
      ],
    });

    expect(reveal.totals).toEqual({ submitted: 2, skipped: 1 });
    expect(reveal.top_voted[0]).toMatchObject({ target_participant_id: 'p1', votes: 2 });
  });

  it('builds no_repeat with unique and repeated groups', () => {
    const reveal = buildNoRepeatReveal({
      participants,
      submissions: [
        { participant_id: 'p1', status: 'submitted', submission_type: 'text_answer', value: { raw_text: 'Perro', normalized_text: 'perro' } },
        { participant_id: 'p2', status: 'submitted', submission_type: 'text_answer', value: { raw_text: 'perró', normalized_text: 'perro' } },
        { participant_id: 'p3', status: 'submitted', submission_type: 'text_answer', value: { raw_text: 'gato', normalized_text: 'gato' } },
      ],
    });

    expect(reveal.unique_answers).toHaveLength(1);
    expect(reveal.repeated_groups).toHaveLength(1);
    expect(reveal.repeated_groups[0].entries).toHaveLength(2);
  });

  it('dispatcher returns stable payload and is deterministic for same input', () => {
    const input = {
      gameType: 'most_likely_to' as const,
      participants,
      submissions: [
        { participant_id: 'p1', status: 'submitted' as const, submission_type: 'vote' as const, value: { target_participant_id: 'p2' } },
      ],
    };

    const first = buildRoundReveal(input);
    const second = buildRoundReveal(input);
    expect(first).toEqual(second);
  });
});
