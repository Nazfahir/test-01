import Link from 'next/link';
import { getGuestSessionIdFromCookie } from '@/features/guests/session';
import { canViewRoomResults } from '@/features/results/access';
import { buildCurrencySummary, buildRelationshipHighlights, type Participant } from '@/features/results/results-mapper';
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from '@/lib/supabaseServer';

const SOURCE_LABELS: Record<string, string> = {
  round_completed: 'Rondas completadas',
  match_completed: 'Partida completada',
  same_choice_bonus: 'Coincidencias inesperadas',
  unique_answer_bonus: 'Respuesta única',
  received_vote_bonus: 'Votos recibidos',
  group_bonus: 'Bonus grupal',
};

export default async function ResultsPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  const supabase = await getSupabaseServerClient();
  const service = getSupabaseServiceRoleClient();
  const [{ data: auth }, guestSessionId] = await Promise.all([supabase.auth.getUser(), getGuestSessionIdFromCookie()]);

  const { data: room } = await service.from('rooms').select('id,room_code').eq('room_code', roomCode.toUpperCase()).maybeSingle();
  if (!room) return <main className="mx-auto max-w-md p-4">Sala no encontrada.</main>;

  const { data: participants } = await service
    .from('room_participants')
    .select('id,display_name,user_id,guest_session_id,left_at')
    .eq('room_id', room.id);

  const allowed = canViewRoomResults(
    { userId: auth.user?.id ?? null, guestSessionId: guestSessionId ?? null },
    (participants ?? []).map((p) => ({ userId: p.user_id, guestSessionId: p.guest_session_id, leftAt: p.left_at })),
  );

  if (!allowed) {
    return <main className="mx-auto max-w-md p-4">Acceso restringido. Estos resultados son solo para participantes de la sala.</main>;
  }

  const { data: match } = await service
    .from('matches')
    .select('id,status,finished_at')
    .eq('room_id', room.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!match) return <main className="mx-auto max-w-md p-4">Todavía no hay una partida para mostrar.</main>;
  if (match.status !== 'finished') return <main className="mx-auto max-w-md p-4">La partida sigue en curso. Vuelvan cuando cierre la ronda final ✨</main>;

  const [eventsRes, currencyRes] = await Promise.all([
    service.from('relationship_events').select('actor_participant_id,target_participant_id,points_delta,event_type').eq('match_id', match.id),
    service.from('currency_transactions').select('amount,source_type,metadata,user_id').eq('match_id', match.id),
  ]);

  const playerNodes: Participant[] = (participants ?? []).map((p) => ({ id: p.id, displayName: p.display_name, isGuest: !p.user_id }));
  const highlights = buildRelationshipHighlights(
    playerNodes,
    (eventsRes.data ?? []).map((e) => ({
      actorParticipantId: e.actor_participant_id,
      targetParticipantId: e.target_participant_id,
      pointsDelta: e.points_delta,
      eventType: e.event_type,
    })),
  );

  const viewerCurrencyRows = auth.user?.id
    ? (currencyRes.data ?? []).filter((row) => row.user_id === auth.user?.id).map((row) => ({ sourceType: row.source_type, amount: row.amount }))
    : (currencyRes.data ?? []).map((row) => ({ sourceType: row.source_type, amount: row.amount }));

  const currency = buildCurrencySummary(viewerCurrencyRows);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 p-4 text-slate-100">
      <section className="rounded-xl bg-slate-900 p-4">
        <h1 className="text-2xl font-bold">¡Partida cerrada! 🌟</h1>
        <p className="mt-1 text-sm text-slate-300">Su constelación social se movió un poquito más. Qué buen caos bonito.</p>
      </section>

      <section className="rounded-xl bg-slate-900 p-4">
        <h2 className="text-lg font-semibold">Constelación del grupo</h2>
        {highlights.length === 0 ? <p className="mt-2 text-sm text-slate-300">Hubo energía social, pero no alcanzó para destacar pares aún.</p> : (
          <ul className="mt-3 space-y-2">
            {highlights.map((item) => (
              <li key={item.pairKey} className="rounded-lg bg-slate-800 px-3 py-2 text-sm">
                <p className="font-medium">{item.pairLabel} · +{item.totalPoints}</p>
                <p className="text-slate-300">Eventos: {item.topEvents.join(', ')}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {playerNodes.map((p) => <div key={p.id} className="rounded-md border border-slate-700 px-2 py-1">🪐 {p.displayName}</div>)}
        </div>
      </section>

      <section className="rounded-xl bg-slate-900 p-4">
        <h2 className="text-lg font-semibold">Monedas ganadas</h2>
        <p className="mt-1 text-xl font-bold">+{currency.total}</p>
        <ul className="mt-2 space-y-2 text-sm">
          {currency.breakdown.map((item) => <li key={item.sourceType} className="rounded-md bg-slate-800 px-2 py-1">+{item.amount} · {SOURCE_LABELS[item.sourceType] ?? item.sourceType}</li>)}
        </ul>
        {!auth.user?.id ? (
          <div className="mt-3 rounded-lg border border-amber-400/40 bg-amber-100/10 p-3 text-sm text-amber-100">
            <p className="font-medium">Guarda tus monedas y progreso</p>
            <p className="mt-1">Puedes crear cuenta local para intentar asociar esta recompensa. Si algo falla, te avisaremos con claridad en el flujo de registro.</p>
            <Link href={`/auth/register?next=${encodeURIComponent(`/rooms/${room.room_code}/results`)}`} className="mt-2 inline-block underline">Crear cuenta local</Link>
          </div>
        ) : null}
      </section>

      <section className="flex items-center justify-between gap-3">
        <Link href={`/rooms/${room.room_code}/lobby`} className="rounded-md bg-slate-200 px-3 py-2 text-sm font-medium text-slate-900">Volver a la sala</Link>
        <span className="text-xs text-slate-400">Próximamente: jugar otra partida 🚀</span>
      </section>
    </main>
  );
}
