export type RelationshipEventType =
  | 'played_together'
  | 'same_choice'
  | 'voted_for_player'
  | 'received_vote'
  | 'repeated_answer'
  | 'completed_match';

export type RelationshipRoundGameType = 'would_you_rather' | 'most_likely_to' | 'dont_repeat';

export type ScoringParticipant = {
  participantId: string;
  userId: string | null;
  completedMatch: boolean;
};

export type RoundSubmission = {
  participantId: string;
  status: 'submitted' | 'skipped' | 'invalid';
  choiceKey?: string | null;
  value?: unknown;
};

export type RelationshipEventDraft = {
  key: string;
  eventType: RelationshipEventType;
  actorParticipantId: string;
  targetParticipantId: string;
  delta: number;
  metadata?: Record<string, unknown>;
};

const DELTAS: Record<RelationshipEventType, number> = {
  played_together: 1,
  same_choice: 2,
  voted_for_player: 1,
  received_vote: 0,
  repeated_answer: 1,
  completed_match: 2,
};

function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function buildRoundRelationshipEvents(input: {
  roomId: string;
  matchId: string;
  roundId: string;
  gameType: RelationshipRoundGameType;
  submissions: RoundSubmission[];
  activeParticipantIds: string[];
}): RelationshipEventDraft[] {
  const events: RelationshipEventDraft[] = [];
  const submitted = input.submissions.filter((s) => s.status === 'submitted');
  const submittedIds = submitted.map((s) => s.participantId);

  for (let i = 0; i < submittedIds.length; i += 1) {
    for (let j = i + 1; j < submittedIds.length; j += 1) {
      const a = submittedIds[i];
      const b = submittedIds[j];
      events.push({
        key: `${input.roundId}:played:${pairKey(a, b)}`,
        eventType: 'played_together',
        actorParticipantId: a,
        targetParticipantId: b,
        delta: DELTAS.played_together,
      });
    }
  }

  if (input.gameType === 'would_you_rather') {
    const byChoice = new Map<string, string[]>();
    for (const s of submitted) {
      if (!s.choiceKey) continue;
      byChoice.set(s.choiceKey, [...(byChoice.get(s.choiceKey) ?? []), s.participantId]);
    }
    for (const [choiceKey, ids] of byChoice.entries()) {
      for (let i = 0; i < ids.length; i += 1) {
        for (let j = i + 1; j < ids.length; j += 1) {
          const a = ids[i];
          const b = ids[j];
          events.push({
            key: `${input.roundId}:same_choice:${choiceKey}:${pairKey(a, b)}`,
            eventType: 'same_choice',
            actorParticipantId: a,
            targetParticipantId: b,
            delta: DELTAS.same_choice,
          });
        }
      }
    }
  }

  if (input.gameType === 'most_likely_to') {
    for (const s of submitted) {
      const target = (s.value as { target_participant_id?: string } | null)?.target_participant_id;
      if (!target) continue;
      events.push({
        key: `${input.roundId}:vote:${s.participantId}:${target}`,
        eventType: 'voted_for_player',
        actorParticipantId: s.participantId,
        targetParticipantId: target,
        delta: DELTAS.voted_for_player,
      });
      events.push({
        key: `${input.roundId}:received:${s.participantId}:${target}`,
        eventType: 'received_vote',
        actorParticipantId: target,
        targetParticipantId: s.participantId,
        delta: DELTAS.received_vote,
      });
    }
  }

  if (input.gameType === 'dont_repeat') {
    const groups = new Map<string, string[]>();
    for (const s of submitted) {
      const normalized = (s.value as { normalized_text?: string } | null)?.normalized_text;
      if (!normalized) continue;
      groups.set(normalized, [...(groups.get(normalized) ?? []), s.participantId]);
    }
    for (const [normalized, ids] of groups.entries()) {
      if (ids.length < 2) continue;
      for (let i = 0; i < ids.length; i += 1) {
        for (let j = i + 1; j < ids.length; j += 1) {
          const a = ids[i];
          const b = ids[j];
          events.push({
            key: `${input.roundId}:repeated:${normalized}:${pairKey(a, b)}`,
            eventType: 'repeated_answer',
            actorParticipantId: a,
            targetParticipantId: b,
            delta: DELTAS.repeated_answer,
          });
        }
      }
    }
  }

  return events;
}

export function buildCompletedMatchEvents(input: { matchId: string; participants: ScoringParticipant[] }): RelationshipEventDraft[] {
  const completed = input.participants.filter((p) => p.completedMatch).map((p) => p.participantId);
  const events: RelationshipEventDraft[] = [];
  for (let i = 0; i < completed.length; i += 1) {
    for (let j = i + 1; j < completed.length; j += 1) {
      events.push({
        key: `${input.matchId}:completed:${pairKey(completed[i], completed[j])}`,
        eventType: 'completed_match',
        actorParticipantId: completed[i],
        targetParticipantId: completed[j],
        delta: DELTAS.completed_match,
      });
    }
  }
  return events;
}
