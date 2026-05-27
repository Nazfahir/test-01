'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from '@/lib/supabaseServer';
import { ensureGuestSessionCookie, getGuestSessionIdFromCookie } from '@/features/guests/session';
import { generateRoomCode } from '@/features/rooms/room-code';
import { canSelectMode, validateJoinRoom, type JoinRoomValidationError, type RoomStatus } from '@/features/rooms/rules';
import { startMatch, type RoundGameType, type StartMatchErrorCode } from '@/features/rooms/start-match';

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

async function getActorParticipantId(roomId: string): Promise<string | null> {
  const supabase = getSupabaseServiceRoleClient();
  const userId = await getCurrentUserId();
  const guestSessionId = userId ? null : await getGuestSessionIdFromCookie();

  if (!userId && !guestSessionId) return null;

  let query = supabase
    .from('room_participants')
    .select('id')
    .eq('room_id', roomId)
    .is('left_at', null)
    .limit(1);

  query = userId ? query.eq('user_id', userId) : query.eq('guest_session_id', guestSessionId ?? '');
  const { data } = await query.maybeSingle();
  return data?.id ?? null;
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
type StartMatchActionState = { ok?: true; redirectTo?: string; error?: string };

function mapStartMatchError(code: StartMatchErrorCode): string {
  switch (code) {
    case 'NOT_HOST':
      return 'Solo el host puede iniciar la partida.';
    case 'ROOM_NOT_IN_LOBBY':
      return 'La sala ya no está en lobby. Actualiza para ver el estado actual.';
    case 'INVALID_PLAYER_COUNT':
      return 'Necesitan entre 3 y 8 participantes activos para iniciar.';
    case 'MODE_NOT_SELECTED':
      return 'Antes de iniciar, elige modo Suave o Fiesta.';
    case 'PROMPTS_UNAVAILABLE':
      return 'Nos faltan preguntas para una de las rondas de este modo. Prueba nuevamente en un momento.';
    case 'MATCH_ALREADY_STARTED':
      return 'Esta partida ya fue iniciada desde otro dispositivo.';
  }
}

export async function updateSelectedModeAction(_: UpdateModeActionState, formData: FormData): Promise<UpdateModeActionState> {
  try {
    const roomId = String(formData.get('roomId') ?? '');
    const selectedMode = String(formData.get('selectedMode') ?? '');

    if (!roomId || !selectedMode) return { error: 'No pudimos actualizar el modo. Falta información de la sala.' };
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

    const actorParticipantId = await getActorParticipantId(roomId);
    if (!actorParticipantId) return { error: 'ROOM_NOT_ACCESSIBLE' };

    const isHost = room.host_participant_id === actorParticipantId;
    if (!canSelectMode({ roomStatus: room.status as RoomStatus, isHost, selectedMode })) {
      return { error: isHost ? 'La sala ya cambió de estado. Vuelve al lobby para continuar.' : 'Solo el host puede cambiar el modo.' };
    }

    const { error } = await supabase
      .from('rooms')
      .update({ selected_mode: selectedMode })
      .eq('id', roomId)
      .eq('host_participant_id', actorParticipantId)
      .eq('status', 'lobby');

    if (error) return { error: 'No pudimos guardar el modo. Intenta nuevamente.' };

    return { ok: true };
  } catch {
    return { error: 'Tuvimos un problema al actualizar el modo. Reintenta en unos segundos.' };
  }
}

export async function startMatchAction(_: StartMatchActionState, formData: FormData): Promise<StartMatchActionState> {
  try {
    const roomId = String(formData.get('roomId') ?? '');
    const roomCode = String(formData.get('roomCode') ?? '').toUpperCase();
    if (!roomId && !roomCode) return { error: 'No pudimos iniciar la partida. Falta información de sala o host.' };

    const supabase = getSupabaseServiceRoleClient();
    const actorParticipantId = roomId ? await getActorParticipantId(roomId) : null;
    if (!actorParticipantId) return { error: 'ROOM_NOT_ACCESSIBLE' };

    const result = await startMatch(
      {
        async findRoom({ roomId: searchRoomId, roomCode: searchRoomCode }) {
          let query = supabase.from('rooms').select('id, room_code, status, selected_mode, min_players, max_players, host_participant_id');
          query = searchRoomId ? query.eq('id', searchRoomId) : query.eq('room_code', searchRoomCode ?? '');
          const { data } = await query.maybeSingle();
          return data as never;
        },
        async countActiveParticipants(searchRoomId) {
          const { count } = await supabase.from('room_participants').select('id', { count: 'exact', head: true }).eq('room_id', searchRoomId).is('left_at', null);
          return count ?? 0;
        },
        async findActiveMatch(searchRoomId) {
          const { data: match } = await supabase
            .from('matches')
            .select('id,status,current_round_id')
            .eq('room_id', searchRoomId)
            .in('status', ['created', 'in_progress'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!match) return null;
          return { id: match.id, currentRoundId: match.current_round_id };
        },
        async takePrompts(mode, gameTypes) {
          const { data } = await supabase.from('prompts').select('id,game_type').eq('mode', mode).eq('active', true).in('game_type', gameTypes).limit(40);
          const seen = new Set<string>();
          const picked: { id: string; game_type: RoundGameType }[] = [];
          for (const gameType of gameTypes) {
            const found = (data ?? []).find((prompt) => prompt.game_type === gameType && !seen.has(prompt.id));
            if (found) {
              seen.add(found.id);
              picked.push(found as { id: string; game_type: RoundGameType });
            }
          }
          return picked;
        },
        async createMatchWithRounds({ room, actorParticipantId: actorId, promptsByType }) {
          const now = new Date().toISOString();

          const { data: lockedRoom } = await supabase
            .from('rooms')
            .update({ status: 'in_game', started_at: now })
            .eq('id', room.id)
            .eq('status', 'lobby')
            .select('id')
            .maybeSingle();
          if (!lockedRoom) throw new Error('room_already_started');

          const { data: match, error: matchError } = await supabase
            .from('matches')
            .insert({ room_id: room.id, status: 'created', selected_mode: room.selected_mode, created_by_participant_id: actorId, started_at: now })
            .select('id, room_id, status')
            .single();
          if (matchError || !match) throw new Error('match_insert_error');

          const roundRows = [
            { match_id: match.id, room_id: room.id, round_order: 1, game_type: 'would_you_rather', prompt_id: promptsByType.would_you_rather, status: 'question', started_at: now },
            { match_id: match.id, room_id: room.id, round_order: 2, game_type: 'most_likely_to', prompt_id: promptsByType.most_likely_to, status: 'waiting' },
            { match_id: match.id, room_id: room.id, round_order: 3, game_type: 'dont_repeat', prompt_id: promptsByType.dont_repeat, status: 'waiting' },
          ] as const;

          const { data: rounds, error: roundsError } = await supabase.from('rounds').insert(roundRows).select('id,round_order,game_type,status').order('round_order', { ascending: true });
          if (roundsError || !rounds || rounds.length !== 3) throw new Error('rounds_insert_error');

          const currentRoundId = rounds[0].id;
          await supabase.from('matches').update({ status: 'in_progress', current_round_id: currentRoundId, started_at: now }).eq('id', match.id);

          return { match, rounds: rounds as never, currentRoundId };
        },
      },
      { roomId: roomId || undefined, roomCode: roomCode || undefined, actorParticipantId },
    );

    if (!result.ok) return { error: mapStartMatchError(result.code) };
    return { ok: true, redirectTo: `/rooms/${result.roomCode}/play` };
  } catch {
    return { error: 'No pudimos iniciar la partida por ahora. Reintenta en unos segundos.' };
  }
}
