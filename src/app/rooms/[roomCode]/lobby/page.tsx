import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { getSupabaseServiceRoleClient, getSupabaseServerClient } from '@/lib/supabaseServer';
import { getGuestSessionIdFromCookie } from '@/features/guests/session';
import { LobbyRealtimeClient } from '@/features/rooms/lobby-realtime-client';

export default async function LobbyPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  const normalizedRoomCode = roomCode.toUpperCase();
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/rooms/${normalizedRoomCode}`;

  const supabase = getSupabaseServiceRoleClient();
  const serverClient = await getSupabaseServerClient();
  const [{ data: authUser }, guestSessionId] = await Promise.all([serverClient.auth.getUser(), getGuestSessionIdFromCookie()]);

  const { data: room } = await supabase
    .from('rooms')
    .select('id, room_code, status, selected_mode, host_participant_id, min_players, max_players')
    .eq('room_code', normalizedRoomCode)
    .maybeSingle();

  if (!room) {
    return <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 p-4">No encontramos esa sala. Revisa el código y vuelve a intentar.</main>;
  }

  const { data: participants } = await supabase
    .from('room_participants')
    .select('id, display_name, is_host, joined_at, left_at, connection_status, last_seen_at, updated_at, user_id, guest_session_id')
    .eq('room_id', room.id);

  const currentParticipant = participants?.find((p) =>
    authUser.user?.id ? p.user_id === authUser.user.id : guestSessionId ? p.guest_session_id === guestSessionId : false,
  );

  if (!currentParticipant) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold text-primary">Acceso restringido</h1>
        <p className="text-sm text-gray-600">Esta sala solo es visible para participantes activos. Únete con un código o link válido.</p>
        <Link className="text-sm font-medium text-primary underline" href="/rooms/join">
          Ir a unirme a sala
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold text-primary">Lobby de la sala</h1>
      <p className="text-sm text-gray-600">Todo listo. Compartan el acceso y esperen al resto con calma ✨</p>

      <LobbyRealtimeClient
        roomCode={normalizedRoomCode}
        inviteLink={inviteLink}
        initialRoom={room}
        initialParticipants={(participants ?? []).map(({ user_id: _user, guest_session_id: _guest, ...rest }) => rest)}
        currentParticipantId={currentParticipant?.id ?? null}
      />

      <Card>
        <p className="text-xs text-gray-500">Código QR disponible pronto. Mientras tanto, usa código o link de invitación.</p>
      </Card>

      <Link className="text-sm font-medium text-primary underline" href="/rooms/join">
        Usar otro código
      </Link>
    </main>
  );
}
