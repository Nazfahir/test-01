export type CurrencySourceType =
  | 'round_completed'
  | 'match_completed'
  | 'same_choice_bonus'
  | 'unique_answer_bonus'
  | 'received_vote_bonus'
  | 'group_bonus';

export type CurrencyRoundGameType = 'would_you_rather' | 'most_likely_to' | 'dont_repeat';

export type CurrencyRoundSubmission = {
  participantId: string;
  status: 'submitted' | 'skipped' | 'invalid';
  choiceKey?: string | null;
  value?: unknown;
};

export type CurrencyGrantDraft = {
  participantId: string;
  amount: number;
  sourceType: CurrencySourceType;
  sourceId: string;
  roundId: string | null;
  metadata?: Record<string, unknown>;
};

export const CURRENCY_VALUES: Record<CurrencySourceType, number> = {
  round_completed: 5,
  match_completed: 20,
  same_choice_bonus: 2,
  unique_answer_bonus: 3,
  received_vote_bonus: 1,
  group_bonus: 5,
};

export function makeSourceId(input: { sourceType: CurrencySourceType; matchId: string; roundId?: string | null; participantId: string; voterParticipantId?: string }): string {
  const { sourceType, matchId, roundId, participantId, voterParticipantId } = input;
  if (sourceType === 'round_completed') return `round:${roundId}:participant:${participantId}`;
  if (sourceType === 'match_completed') return `match:${matchId}:participant:${participantId}`;
  if (sourceType === 'same_choice_bonus') return `round:${roundId}:participant:${participantId}:same_choice`;
  if (sourceType === 'unique_answer_bonus') return `round:${roundId}:participant:${participantId}:unique_answer`;
  if (sourceType === 'received_vote_bonus') return `round:${roundId}:target:${participantId}:vote:${voterParticipantId}`;
  return `match:${matchId}:participant:${participantId}:group_bonus`;
}

export function buildRoundCurrencyGrants(input: {
  matchId: string;
  roundId: string;
  gameType: CurrencyRoundGameType;
  submissions: CurrencyRoundSubmission[];
}): CurrencyGrantDraft[] {
  const submitted = input.submissions.filter((s) => s.status === 'submitted');
  const grants: CurrencyGrantDraft[] = [];

  for (const s of submitted) {
    grants.push({
      participantId: s.participantId,
      amount: CURRENCY_VALUES.round_completed,
      sourceType: 'round_completed',
      sourceId: makeSourceId({ sourceType: 'round_completed', matchId: input.matchId, roundId: input.roundId, participantId: s.participantId }),
      roundId: input.roundId,
    });
  }

  if (input.gameType === 'would_you_rather') {
    const byChoice = new Map<string, string[]>();
    for (const s of submitted) {
      if (!s.choiceKey) continue;
      byChoice.set(s.choiceKey, [...(byChoice.get(s.choiceKey) ?? []), s.participantId]);
    }
    const rewarded = new Set<string>();
    for (const ids of byChoice.values()) {
      if (ids.length < 2) continue;
      for (const participantId of ids) rewarded.add(participantId);
    }
    for (const participantId of rewarded) {
      grants.push({
        participantId,
        amount: CURRENCY_VALUES.same_choice_bonus,
        sourceType: 'same_choice_bonus',
        sourceId: makeSourceId({ sourceType: 'same_choice_bonus', matchId: input.matchId, roundId: input.roundId, participantId }),
        roundId: input.roundId,
      });
    }
  }

  if (input.gameType === 'dont_repeat') {
    const byNormalized = new Map<string, string[]>();
    for (const s of submitted) {
      const normalized = (s.value as { normalized_text?: string } | null)?.normalized_text;
      if (!normalized) continue;
      byNormalized.set(normalized, [...(byNormalized.get(normalized) ?? []), s.participantId]);
    }
    for (const ids of byNormalized.values()) {
      if (ids.length !== 1) continue;
      const participantId = ids[0];
      grants.push({
        participantId,
        amount: CURRENCY_VALUES.unique_answer_bonus,
        sourceType: 'unique_answer_bonus',
        sourceId: makeSourceId({ sourceType: 'unique_answer_bonus', matchId: input.matchId, roundId: input.roundId, participantId }),
        roundId: input.roundId,
      });
    }
  }

  if (input.gameType === 'most_likely_to') {
    for (const s of submitted) {
      const voterParticipantId = s.participantId;
      const target = (s.value as { target_participant_id?: string } | null)?.target_participant_id;
      if (!target) continue;
      grants.push({
        participantId: target,
        amount: CURRENCY_VALUES.received_vote_bonus,
        sourceType: 'received_vote_bonus',
        sourceId: makeSourceId({ sourceType: 'received_vote_bonus', matchId: input.matchId, roundId: input.roundId, participantId: target, voterParticipantId }),
        roundId: input.roundId,
        metadata: { voter_participant_id: voterParticipantId, auto_vote: voterParticipantId === target },
      });
    }
  }

  return grants;
}

export function buildMatchCurrencyGrants(input: { matchId: string; eligibleParticipantIds: string[] }): CurrencyGrantDraft[] {
  return input.eligibleParticipantIds.flatMap((participantId) => [
    {
      participantId,
      amount: CURRENCY_VALUES.match_completed,
      sourceType: 'match_completed' as const,
      sourceId: makeSourceId({ sourceType: 'match_completed', matchId: input.matchId, participantId }),
      roundId: null,
    },
    {
      participantId,
      amount: CURRENCY_VALUES.group_bonus,
      sourceType: 'group_bonus' as const,
      sourceId: makeSourceId({ sourceType: 'group_bonus', matchId: input.matchId, participantId }),
      roundId: null,
    },
  ]);
}
