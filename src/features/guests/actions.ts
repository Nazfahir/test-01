'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServiceRoleClient } from '@/lib/supabaseServer';
import { ensureGuestSessionCookie, getGuestSessionIdFromCookie } from '@/features/guests/session';
import { validateGuestJoin, type JoinRoomValidationError } from '@/features/rooms/join';

type JoinGuestRoomState = {
  error?: string;
};

function mapJoinError(error: JoinRoomValidationError): string {
  switch (error) {
    case 'room_not_found':
      return 'No encontramos esa sala. Revisa el código e inténtalo de nuevo.';
    case 'room_full':
      return 'Esta sala ya está completa (máximo 8). Prueba con otra sala.';
    case 'room_in_game':
      return 'Esta partida ya empezó. Puedes unirte a una nueva sala en lobby.';
    case 'room_closed_or_expired':
      return 'Esta sala ya se cerró o expiró. Te ayudamos a encontrar otra.';
  }
}

export async function joinRoomAsGuest(_: JoinGuestRoomState, formData: FormData): Promise<JoinGuestRoomState> {
  const roomCode = String(formData.get('roomCode') ?? '').trim().toUpperCase();
  const displayName = String(formData.get('displayName') ?? '').trim();

  if (!roomCode) return { error: 'Ingresa un código de sala para continuar.' };
  if (!displayName) return { error: 'Tu nombre visible es obligatorio para entrar a la sala.' };

  try {
    const supabase = getSupabaseServiceRoleClient();

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, code, state, expires_at')
      .eq('code', roomCode)
      .maybeSingle();

    if (roomError) return { error: 'No pudimos validar la sala por un problema de conexión.' };

    const { count: participantCount, error: countError } = await supabase
      .from('room_participants')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', room?.id ?? '');

    if (countError && room) return { error: 'No pudimos validar cupos por un problema de conexión.' };

    const roomState = room?.state === 'in_game' || room?.state === 'closed' ? room.state : 'lobby';
    const expired = room?.expires_at ? new Date(room.expires_at).getTime() < Date.now() : false;
    const joinValidation = validateGuestJoin({
      roomExists: Boolean(room),
      roomState: expired ? 'expired' : roomState,
      participantCount: participantCount ?? 0,
    });

    if (joinValidation) return { error: mapJoinError(joinValidation) };

    const existingSessionId = await getGuestSessionIdFromCookie();
    const sessionId = await ensureGuestSessionCookie(existingSessionId ?? undefined);

    const { error: guestSessionError } = await supabase.from('guest_sessions').upsert({
      id: sessionId,
      display_name: displayName,
      last_seen_at: new Date().toISOString(),
      converted_user_id: null,
    });

    if (guestSessionError) return { error: 'No pudimos crear tu sesión temporal. Inténtalo otra vez.' };

    const { data: existingParticipant } = await supabase
      .from('room_participants')
      .select('id')
      .eq('room_id', room!.id)
      .eq('guest_session_id', sessionId)
      .maybeSingle();

    if (!existingParticipant) {
      const { error: participantError } = await supabase.from('room_participants').insert({
        room_id: room!.id,
        user_id: null,
        guest_session_id: sessionId,
        display_name: displayName,
      });

      if (participantError) {
        return { error: 'No pudimos unirte a la sala en este momento. Inténtalo de nuevo en unos segundos.' };
      }
    }
  } catch {
    return { error: 'Tuvimos un problema de conexión. Vuelve a intentarlo en un momento.' };
  }

  redirect(`/rooms/${roomCode}/lobby`);
}
