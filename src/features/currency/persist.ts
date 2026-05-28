import type { SupabaseClient } from '@supabase/supabase-js';
import { buildMatchCurrencyGrants, buildRoundCurrencyGrants, type CurrencyRoundGameType, type CurrencySourceType } from '@/features/currency/currencyScoring';

type ParticipantRow = { id: string; user_id: string | null; room_id: string; left_at: string | null };
type SubmissionRow = { participant_id: string; status: 'submitted' | 'skipped' | 'invalid'; choice_key: string | null; value: unknown };

type LedgerInsert = {
  user_id: string;
  amount: number;
  source_type: CurrencySourceType;
  source_id: string;
  room_id: string;
  match_id: string;
  round_id: string | null;
  metadata: Record<string, unknown>;
};

async function insertIdempotent(supabase: SupabaseClient, rows: LedgerInsert[]) {
  if (rows.length === 0) return;
  await supabase.from('currency_transactions').upsert(rows, { onConflict: 'user_id,source_type,source_id', ignoreDuplicates: true });
}

export async function grantRoundCurrency(supabase: SupabaseClient, input: { roomId: string; matchId: string; roundId: string; gameType: CurrencyRoundGameType }) {
  const [submissionsRes, participantsRes] = await Promise.all([
    supabase.from('round_submissions').select('participant_id,status,choice_key,value').eq('round_id', input.roundId),
    supabase.from('room_participants').select('id,user_id,room_id,left_at').eq('room_id', input.roomId).is('left_at', null),
  ]);

  const participantsById = new Map((participantsRes.data ?? []).map((p: ParticipantRow) => [p.id, p]));
  const grants = buildRoundCurrencyGrants({
    matchId: input.matchId,
    roundId: input.roundId,
    gameType: input.gameType,
    submissions: (submissionsRes.data ?? []).map((s: SubmissionRow) => ({ participantId: s.participant_id, status: s.status, choiceKey: s.choice_key, value: s.value })),
  });

  const rows: LedgerInsert[] = grants.flatMap((g) => {
    const participant = participantsById.get(g.participantId);
    if (!participant?.user_id) return [];
    return [{
      user_id: participant.user_id,
      amount: g.amount,
      source_type: g.sourceType,
      source_id: g.sourceId,
      room_id: input.roomId,
      match_id: input.matchId,
      round_id: g.roundId,
      metadata: { ...(g.metadata ?? {}), participant_id: g.participantId, grant_stage: 'round_reveal' },
    }];
  });

  await insertIdempotent(supabase, rows);
}

export async function grantMatchCurrency(supabase: SupabaseClient, input: { roomId: string; matchId: string }) {
  const { data: participants } = await supabase.from('room_participants').select('id,user_id,room_id,left_at').eq('room_id', input.roomId).is('left_at', null);
  const participantRows = (participants ?? []) as ParticipantRow[];
  const grants = buildMatchCurrencyGrants({ matchId: input.matchId, eligibleParticipantIds: participantRows.map((p) => p.id) });
  const byParticipant = new Map(participantRows.map((p) => [p.id, p]));

  const rows: LedgerInsert[] = grants.flatMap((g) => {
    const participant = byParticipant.get(g.participantId);
    if (!participant?.user_id) return [];
    return [{
      user_id: participant.user_id,
      amount: g.amount,
      source_type: g.sourceType,
      source_id: g.sourceId,
      room_id: input.roomId,
      match_id: input.matchId,
      round_id: null,
      metadata: { participant_id: g.participantId, grant_stage: 'match_finish' },
    }];
  });

  await insertIdempotent(supabase, rows);
}

export async function getCurrencyBreakdownByMatch(supabase: SupabaseClient, input: { userId: string; matchId: string }) {
  const { data } = await supabase
    .from('currency_transactions')
    .select('amount,source_type,match_id,user_id')
    .eq('user_id', input.userId)
    .eq('match_id', input.matchId);

  const bySource = new Map<string, number>();
  let total = 0;
  for (const row of data ?? []) {
    total += row.amount;
    bySource.set(row.source_type, (bySource.get(row.source_type) ?? 0) + row.amount);
  }

  return {
    total,
    breakdown: Array.from(bySource.entries()).map(([sourceType, amount]) => ({ sourceType, amount })).sort((a, b) => b.amount - a.amount || a.sourceType.localeCompare(b.sourceType)),
  };
}
