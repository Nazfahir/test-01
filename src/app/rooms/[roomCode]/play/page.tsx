import { Card } from '@/components/ui/Card';
import { getGuestSessionIdFromCookie } from '@/features/guests/session';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { getSupabaseServiceRoleClient } from '@/lib/supabaseServer';
import { PlayControls } from './play-controls';
import { PlayRealtimeClient } from './play-realtime-client';
import type { RoundRevealPayload } from '@/features/rooms/reveal';

export default async function PlayPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  const supabase = getSupabaseServiceRoleClient();
  const auth = await getSupabaseServerClient();
  const { data: userData } = await auth.auth.getUser();

  const { data: room } = await supabase.from('rooms').select('id,room_code,status,host_participant_id').eq('room_code', roomCode.toUpperCase()).maybeSingle();
  if (!room) return <Card><p>Sala no encontrada.</p></Card>;

  const { data: match } = await supabase.from('matches').select('id,current_round_id,status').eq('room_id', room.id).in('status', ['created', 'in_progress']).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!match?.current_round_id) return <Card><p>No hay ronda activa en este momento.</p></Card>;

  const { data: round } = await supabase.from('rounds').select('id,status,round_order,game_type,prompt_id,reveal_snapshot').eq('id', match.current_round_id).maybeSingle();
  const { data: participants } = await supabase.from('room_participants').select('id,display_name').eq('room_id', room.id).is('left_at', null);
  const guestSessionId = userData.user ? null : await getGuestSessionIdFromCookie();
  let actorQuery = supabase.from('room_participants').select('id').eq('room_id', room.id).is('left_at', null).limit(1);
  actorQuery = userData.user ? actorQuery.eq('user_id', userData.user.id) : actorQuery.eq('guest_session_id', guestSessionId ?? '');
  const { data: actor } = await actorQuery.maybeSingle();
  if (!actor?.id) return <Card><p>No tienes acceso a esta sala.</p></Card>;
  const isHost = actor.id === room.host_participant_id;

  const { data: prompt } = round?.prompt_id ? await supabase.from('prompts').select('content,options').eq('id', round.prompt_id).maybeSingle() : { data: null };
  const { data: existingSubmission } = actor && round
    ? await supabase.from('round_submissions').select('id').eq('round_id', round.id).eq('participant_id', actor.id).maybeSingle()
    : { data: null };

  const options = Array.isArray(prompt?.options) ? prompt.options.filter((item): item is string => typeof item === 'string') : [];
  const revealSnapshot = (round?.status === 'reveal' ? round.reveal_snapshot : null) as RoundRevealPayload | null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <Card>
        <h1 className="text-lg font-semibold">Sala {room.room_code} · Ronda {round?.round_order}</h1>
        <p className="text-sm text-slate-600">Estado: {round?.status ?? 'desconocido'}.</p>
        <p className="text-sm text-slate-600">Participantes activos: {participants?.length ?? 0}.</p>
      </Card>
      {round ? (
        <PlayRealtimeClient roomId={room.id} hostParticipantId={room.host_participant_id} actorParticipantId={actor?.id ?? null}>
          <PlayControls roomId={room.id} matchId={match.id} roundId={round.id} roundStatus={round.status} gameType={round.game_type} question={prompt?.content ?? 'Pregunta no disponible.'} options={options} isHost={isHost} hasSubmitted={Boolean(existingSubmission)} participants={participants ?? []} actorParticipantId={actor?.id ?? null} revealSnapshot={revealSnapshot} />
        </PlayRealtimeClient>
      ) : null}
    </main>
  );
}
