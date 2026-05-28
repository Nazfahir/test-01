export type RoundGameType = 'would_you_rather' | 'most_likely_to' | 'dont_repeat';

export type RevealSubmission = {
  participant_id: string;
  status: 'submitted' | 'skipped' | 'invalid';
  submission_type: 'choice' | 'vote' | 'text_answer' | 'skip';
  choice_key?: string | null;
  value?: unknown;
};

export type RevealParticipant = { id: string; display_name: string | null };

export type RevealSkippedEntry = { participant_id: string; display_name: string };

export type WouldYouRatherReveal = {
  game_type: 'would_you_rather';
  totals: { submitted: number; skipped: number };
  by_option: Array<{ option: string; count: number; participants: Array<{ participant_id: string; display_name: string }> }>;
  matches: { largest_group_size: number; has_consensus: boolean };
  skipped: RevealSkippedEntry[];
};

export type MostLikelyReveal = {
  game_type: 'most_likely_to';
  totals: { submitted: number; skipped: number };
  distribution: Array<{ target_participant_id: string; display_name: string; votes: number }>;
  top_voted: Array<{ target_participant_id: string; display_name: string; votes: number }>;
  skipped: RevealSkippedEntry[];
};

export type NoRepeatReveal = {
  game_type: 'dont_repeat';
  totals: { submitted: number; skipped: number };
  unique_answers: Array<{ normalized_text: string; raw_text: string; participant_id: string; display_name: string }>;
  repeated_groups: Array<{ normalized_text: string; entries: Array<{ raw_text: string; participant_id: string; display_name: string }> }>;
  skipped: RevealSkippedEntry[];
};

export type RoundRevealPayload = WouldYouRatherReveal | MostLikelyReveal | NoRepeatReveal;

function displayName(p: RevealParticipant | undefined): string { return p?.display_name ?? `Jugador ${p?.id.slice(0, 4) ?? '????'}`; }

function splitSkipped(submissions: RevealSubmission[], participantsById: Map<string, RevealParticipant>) {
  const skipped = submissions.filter((s) => s.status === 'skipped').map((s) => ({ participant_id: s.participant_id, display_name: displayName(participantsById.get(s.participant_id)) }));
  const submitted = submissions.filter((s) => s.status === 'submitted');
  return { skipped, submitted };
}

export function buildWouldYouRatherReveal(input: { submissions: RevealSubmission[]; participants: RevealParticipant[]; options: string[] }): WouldYouRatherReveal {
  const participantsById = new Map(input.participants.map((p) => [p.id, p]));
  const { skipped, submitted } = splitSkipped(input.submissions, participantsById);
  const byOption = input.options.map((option) => {
    const group = submitted.filter((s) => s.choice_key === option);
    return {
      option,
      count: group.length,
      participants: group.map((s) => ({ participant_id: s.participant_id, display_name: displayName(participantsById.get(s.participant_id)) })),
    };
  });
  const largest = byOption.reduce((acc, item) => Math.max(acc, item.count), 0);
  return { game_type: 'would_you_rather', totals: { submitted: submitted.length, skipped: skipped.length }, by_option: byOption, matches: { largest_group_size: largest, has_consensus: largest > 0 && largest === submitted.length }, skipped };
}

export function buildMostLikelyReveal(input: { submissions: RevealSubmission[]; participants: RevealParticipant[] }): MostLikelyReveal {
  const participantsById = new Map(input.participants.map((p) => [p.id, p]));
  const { skipped, submitted } = splitSkipped(input.submissions, participantsById);
  const counts = new Map<string, number>();
  for (const s of submitted) {
    const target = (s.value as { target_participant_id?: string } | null)?.target_participant_id;
    if (!target) continue;
    counts.set(target, (counts.get(target) ?? 0) + 1);
  }
  const distribution = Array.from(counts.entries()).map(([target_participant_id, votes]) => ({ target_participant_id, display_name: displayName(participantsById.get(target_participant_id)), votes })).sort((a, b) => b.votes - a.votes || a.display_name.localeCompare(b.display_name));
  const topVotes = distribution[0]?.votes ?? 0;
  const topVoted = topVotes > 0 ? distribution.filter((d) => d.votes === topVotes) : [];
  return { game_type: 'most_likely_to', totals: { submitted: submitted.length, skipped: skipped.length }, distribution, top_voted: topVoted, skipped };
}

export function buildNoRepeatReveal(input: { submissions: RevealSubmission[]; participants: RevealParticipant[] }): NoRepeatReveal {
  const participantsById = new Map(input.participants.map((p) => [p.id, p]));
  const { skipped, submitted } = splitSkipped(input.submissions, participantsById);
  const groups = new Map<string, Array<{ raw_text: string; participant_id: string; display_name: string }>>();
  for (const s of submitted) {
    const value = (s.value as { raw_text?: string; normalized_text?: string } | null) ?? {};
    if (!value.normalized_text) continue;
    const list = groups.get(value.normalized_text) ?? [];
    list.push({ raw_text: value.raw_text ?? value.normalized_text, participant_id: s.participant_id, display_name: displayName(participantsById.get(s.participant_id)) });
    groups.set(value.normalized_text, list);
  }

  const unique_answers: NoRepeatReveal['unique_answers'] = [];
  const repeated_groups: NoRepeatReveal['repeated_groups'] = [];
  for (const [normalized_text, entries] of groups.entries()) {
    if (entries.length === 1) unique_answers.push({ normalized_text, ...entries[0] });
    else repeated_groups.push({ normalized_text, entries });
  }

  return { game_type: 'dont_repeat', totals: { submitted: submitted.length, skipped: skipped.length }, unique_answers, repeated_groups, skipped };
}

export function buildRoundReveal(input: { gameType: RoundGameType; submissions: RevealSubmission[]; participants: RevealParticipant[]; options?: string[] }): RoundRevealPayload {
  if (input.gameType === 'would_you_rather') return buildWouldYouRatherReveal({ submissions: input.submissions, participants: input.participants, options: input.options ?? [] });
  if (input.gameType === 'most_likely_to') return buildMostLikelyReveal({ submissions: input.submissions, participants: input.participants });
  return buildNoRepeatReveal({ submissions: input.submissions, participants: input.participants });
}
