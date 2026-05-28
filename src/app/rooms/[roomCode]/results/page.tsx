import { getCurrencyBreakdownByMatch } from '@/features/currency/persist';
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from '@/lib/supabaseServer';

const SOURCE_LABELS: Record<string, string> = {
  round_completed: 'por completar ronda',
  match_completed: 'por completar la partida',
  same_choice_bonus: 'por coincidencias de elección',
  unique_answer_bonus: 'por respuesta única',
  received_vote_bonus: 'por votos recibidos',
  group_bonus: 'bonus grupal',
};

export default async function ResultsPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  const supabase = await getSupabaseServerClient();
  const service = getSupabaseServiceRoleClient();
  const { data: auth } = await supabase.auth.getUser();

  const { data: room } = await service
    .from('rooms')
    .select('id,room_code')
    .eq('room_code', roomCode.toUpperCase())
    .maybeSingle();

  const { data: match } = await service
    .from('matches')
    .select('id,status,finished_at')
    .eq('room_id', room?.id ?? '')
    .eq('status', 'finished')
    .order('finished_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!room || !match) return <main className="p-4">Resultados no disponibles todavía.</main>;
  if (!auth.user?.id) return <main className="p-4">Ganaste monedas visuales. Crea o inicia sesión para guardarlas.</main>;

  const breakdown = await getCurrencyBreakdownByMatch(service, { userId: auth.user.id, matchId: match.id });

  return (
    <main className="mx-auto max-w-md p-4 text-slate-100">
      <h1 className="text-2xl font-bold">Ganaste +{breakdown.total} monedas ✨</h1>
      <p className="mt-2 text-sm text-slate-300">Desglose celebratorio de esta partida:</p>
      <ul className="mt-4 space-y-2">
        {breakdown.breakdown.map((item) => (
          <li key={item.sourceType} className="rounded-lg bg-slate-800/60 px-3 py-2 text-sm">
            +{item.amount} {SOURCE_LABELS[item.sourceType] ?? item.sourceType}
          </li>
        ))}
      </ul>
    </main>
  );
}
