'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from '@/lib/supabaseServer';
import { ensureGuestSessionCookie, getGuestSessionIdFromCookie } from '@/features/guests/session';
import { generateRoomCode } from '@/features/rooms/room-code';
import { canSelectMode, validateJoinRoom, type JoinRoomValidationError, type RoomStatus } from '@/features/rooms/rules';

type RoomsActionState = { error?: string };

function mapJoinError(error: JoinRoomValidationError): string {
  switch (error) {
    case 'room_not_found':
      return 'No encontramos esa sala. Revisa el código o pide un link nuevo.';
    case 'room_invalid_state':
      return 'Esa sala ya no está en lobby. Te conviene crear o buscar una nueva.';
    case 'room_closed_or_expired':
      return 'Esa sala ya se cerró o expiró. Te ayudamos a entrar a otra enseguida.';
    case 'room_full':
      return 'La sala ya está completa (máximo 8). Prueba con otra sala.';
  }
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function upsertGuest(displayName: string): Promise<string> {
  const supabase = getSupabaseServiceRoleClient();
  const existingSessionId = await getGuestSessionIdFromCookie();
  const sessionId = await ensureGuestSessionCookie(existingSessionId ?? undefined);

  const { error } = await supabase.from('guest_sessions').upsert({
    id: sessionId,
    display_name: displayName,
    last_seen_at: new Date().toISOString(),
  });

  if (error) throw new Error('guest_session_error');
  return sessionId;
}

export async function createRoomAction(_: RoomsActionState, formData: FormData): Promise<RoomsActionState> {
  try {
    const supabase = getSupabaseServiceRoleClient();
    const displayName = String(formData.get('displayName') ?? '').trim();
    const userId = await getCurrentUserId();

    if (!userId && !displayName) {
      return { error: 'Si entras como invitado, cuéntanos tu nombre visible para crear la sala.' };
    }

    const guestSessionId = userId ? null : await upsertGuest(displayName);

    let roomId = '';
    let roomCode = '';

    for (let attempt = 0; attempt < 5; attempt += 1) {
      roomCode = generateRoomCode();
      const { data: room, error } = await supabase
        .from('rooms')
        .insert({ room_code: roomCode, status: 'lobby', host_user_id: userId })
        .select('id, room_code')
        .single();

      if (!error && room) {
        roomId = room.id;
        roomCode = room.room_code;
        break;
      }
    }

    if (!roomId) return { error: 'No pudimos crear la sala por ahora. Intenta nuevamente en unos segundos.' };

    const { data: participant, error: participantError } = await supabase
      .from('room_participants')
      .insert({
        room_id: roomId,
        user_id: userId,
        guest_session_id: guestSessionId,
        display_name: userId ? null : displayName,
        is_host: true,
      })
      .select('id')
      .single();

    if (participantError || !participant) return { error: 'Creamos la sala, pero falló el ingreso del host.' };

    await supabase.from('rooms').update({ host_participant_id: participant.id }).eq('id', roomId);

    redirect(`/rooms/${roomCode}/lobby`);
  } catch {
    return { error: 'Tuvimos un problema de conexión. Vuelve a intentarlo en un momento.' };
  }
}

export async function joinRoomAction(_: RoomsActionState, formData: FormData): Promise<RoomsActionState> {
  const roomCode = String(formData.get('roomCode') ?? '').trim().toUpperCase();
  const displayName = String(formData.get('displayName') ?? '').trim();

  if (!roomCode) return { error: 'Ingresa un código de sala para continuar.' };

  try {
    const supabase = getSupabaseServiceRoleClient();
    const userId = await getCurrentUserId();

    const { data: room } = await supabase
      .from('rooms')
      .select('id, room_code, status, max_players, expires_at')
      .eq('room_code', roomCode)
      .maybeSingle();

    const guestSessionId = userId ? null : await ensureGuestSessionCookie(await getGuestSessionIdFromCookie() ?? undefined);

    const existingParticipantQuery = supabase
      .from('room_participants')
      .select('id')
      .eq('room_id', room?.id ?? '');

    const existingParticipant = userId
      ? await existingParticipantQuery.eq('user_id', userId).is('left_at', null).maybeSingle()
      : await existingParticipantQuery.eq('guest_session_id', guestSessionId).is('left_at', null).maybeSingle();

    const { count } = await supabase
      .from('room_participants')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', room?.id ?? '')
      .is('left_at', null);

    const status = (room?.status ?? 'closed') as RoomStatus;
    const isExpired = room?.expires_at ? new Date(room.expires_at).getTime() < Date.now() : false;

    const validation = validateJoinRoom({
      roomExists: Boolean(room),
      roomStatus: status,
      isExpired,
      activeParticipantCount: count ?? 0,
      maxParticipants: room?.max_players ?? 8,
      hasActiveParticipant: Boolean(existingParticipant.data?.id),
    });

    if (validation) return { error: mapJoinError(validation) };

    if (!existingParticipant.data?.id) {
      const resolvedGuestSessionId = userId ? null : await upsertGuest(displayName || 'Invitado Orbitas');

      const { error } = await supabase.from('room_participants').insert({
        room_id: room!.id,
        user_id: userId,
        guest_session_id: resolvedGuestSessionId,
        display_name: userId ? null : displayName || 'Invitado Orbitas',
        is_host: false,
      });

      if (error) return { error: 'No pudimos sumarte a la sala. Inténtalo otra vez en unos segundos.' };
    }

    redirect(`/rooms/${room!.room_code}/lobby`);
  } catch {
    return { error: 'Tuvimos un problema de conexión. Vuelve a intentarlo en un momento.' };
  }
}


type UpdateModeActionState = { ok?: true; error?: string };

export async function updateSelectedModeAction(_: UpdateModeActionState, formData: FormData): Promise<UpdateModeActionState> {
  try {
    const roomId = String(formData.get('roomId') ?? '');
    const participantId = String(formData.get('participantId') ?? '');
    const selectedMode = String(formData.get('selectedMode') ?? '');

    if (!roomId || !participantId || !selectedMode) return { error: 'No pudimos actualizar el modo. Falta información de la sala.' };
    if (!canSelectMode({ roomStatus: 'lobby', isHost: true, selectedMode })) {
      return { error: 'Modo inválido. Elige Suave o Fiesta.' };
    }

    const supabase = getSupabaseServiceRoleClient();

    const { data: room } = await supabase
      .from('rooms')
      .select('status, host_participant_id')
      .eq('id', roomId)
      .maybeSingle();

    if (!room) return { error: 'No encontramos la sala para actualizar el modo.' };

    const isHost = room.host_participant_id === participantId;
    if (!canSelectMode({ roomStatus: room.status as RoomStatus, isHost, selectedMode })) {
      return { error: isHost ? 'La sala ya cambió de estado. Vuelve al lobby para continuar.' : 'Solo el host puede cambiar el modo.' };
    }

    const { error } = await supabase
      .from('rooms')
      .update({ selected_mode: selectedMode })
      .eq('id', roomId)
      .eq('host_participant_id', participantId)
      .eq('status', 'lobby');

    if (error) return { error: 'No pudimos guardar el modo. Intenta nuevamente.' };

    return { ok: true };
  } catch {
    return { error: 'Tuvimos un problema al actualizar el modo. Reintenta en unos segundos.' };
  }
}
