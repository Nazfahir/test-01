import type { SupabaseClient } from '@supabase/supabase-js';

export type ConversionStatus =
  | { kind: 'converted'; progressLinked: boolean }
  | { kind: 'already_converted'; progressLinked: boolean }
  | { kind: 'forbidden' }
  | { kind: 'not_found' }
  | { kind: 'failed_partial'; progressLinked: false };

type GuestSessionRow = {
  id: string;
  converted_user_id: string | null;
};

type ParticipantRow = {
  id: string;
  room_id: string;
};

type MatchRow = {
  id: string;
  room_id: string;
  created_at: string;
};

type CurrencyRow = {
  amount: number;
  source_type: string;
  source_id: string;
  room_id: string;
  match_id: string;
  round_id: string | null;
  metadata: Record<string, unknown> | null;
};

function buildConversionSourceId(guestSessionId: string, sourceType: string, sourceId: string) {
  return `guest_conversion:${guestSessionId}:${sourceType}:${sourceId}`;
}

export async function convertGuestProgress(params: {
  service: SupabaseClient;
  guestSessionId: string;
  requesterGuestSessionId: string | null;
  targetUserId: string;
  eligibleHours?: number;
}): Promise<ConversionStatus> {
  const eligibleHours = params.eligibleHours ?? 24;
  if (!params.requesterGuestSessionId || params.requesterGuestSessionId !== params.guestSessionId) {
    return { kind: 'forbidden' };
  }

  const { data: session } = await params.service
    .from('guest_sessions')
    .select('id,converted_user_id')
    .eq('id', params.guestSessionId)
    .maybeSingle<GuestSessionRow>();

  if (!session) return { kind: 'not_found' };

  if (session.converted_user_id && session.converted_user_id !== params.targetUserId) {
    return { kind: 'forbidden' };
  }

  const alreadyConverted = session.converted_user_id === params.targetUserId;

  const updated = await params.service
    .from('guest_sessions')
    .update({ converted_user_id: params.targetUserId, converted_at: new Date().toISOString() })
    .eq('id', params.guestSessionId)
    .or(`converted_user_id.is.null,converted_user_id.eq.${params.targetUserId}`)
    .select('id')
    .maybeSingle();

  if (!updated.data) {
    return { kind: 'forbidden' };
  }

  const sinceIso = new Date(Date.now() - eligibleHours * 60 * 60 * 1000).toISOString();
  const { data: participants } = await params.service
    .from('room_participants')
    .select('id,room_id')
    .eq('guest_session_id', params.guestSessionId)
    .gte('created_at', sinceIso);

  const participantRows = (participants ?? []) as ParticipantRow[];
  if (participantRows.length === 0) {
    return { kind: alreadyConverted ? 'already_converted' : 'converted', progressLinked: true };
  }

  const participantIds = participantRows.map((p) => p.id);
  const roomIds = Array.from(new Set(participantRows.map((p) => p.room_id)));

  await params.service.from('room_participants').update({ user_id: params.targetUserId, guest_session_id: null }).in('id', participantIds);

  const { data: matches } = await params.service
    .from('matches')
    .select('id,room_id,created_at')
    .in('room_id', roomIds)
    .gte('created_at', sinceIso);

  const matchRows = (matches ?? []) as MatchRow[];
  if (matchRows.length === 0) {
    return { kind: alreadyConverted ? 'already_converted' : 'converted', progressLinked: true };
  }

  const { data: guestCurrency } = await params.service
    .from('currency_transactions')
    .select('amount,source_type,source_id,room_id,match_id,round_id,metadata,user_id')
    .in('match_id', matchRows.map((m) => m.id))
    .is('user_id', null);

  const rows = (guestCurrency ?? []) as (CurrencyRow & { user_id?: string | null })[];

  const inserts = rows.map((row) => ({
    user_id: params.targetUserId,
    amount: row.amount,
    source_type: row.source_type,
    source_id: buildConversionSourceId(params.guestSessionId, row.source_type, row.source_id),
    room_id: row.room_id,
    match_id: row.match_id,
    round_id: row.round_id,
    metadata: { ...(row.metadata ?? {}), guest_session_id: params.guestSessionId, converted_from_source_id: row.source_id },
  }));

  if (inserts.length === 0) {
    return { kind: alreadyConverted ? 'already_converted' : 'converted', progressLinked: true };
  }

  const insertRes = await params.service
    .from('currency_transactions')
    .upsert(inserts, { onConflict: 'user_id,source_type,source_id', ignoreDuplicates: true });

  if (insertRes.error) {
    return { kind: 'failed_partial', progressLinked: false };
  }

  return { kind: alreadyConverted ? 'already_converted' : 'converted', progressLinked: true };
}
