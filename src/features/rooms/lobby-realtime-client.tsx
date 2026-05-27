'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
import { Card } from '@/components/ui/Card';
import { deriveConnectionStatus, mergeParticipantEvent, normalizeParticipants, type LobbyParticipant, type LobbyRoom, type LobbyState } from '@/features/rooms/lobby-realtime';

type Props = {
  roomCode: string;
  inviteLink: string;
  initialRoom: LobbyRoom;
  initialParticipants: LobbyParticipant[];
  currentParticipantId: string | null;
};

export function LobbyRealtimeClient({ roomCode, inviteLink, initialRoom, initialParticipants, currentParticipantId }: Props) {
  const [state, setState] = useState<LobbyState>({ room: initialRoom, participants: normalizeParticipants(initialParticipants) });
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let heartbeat: NodeJS.Timeout | undefined;

    const refreshSnapshot = async () => {
      const [roomRes, participantsRes] = await Promise.all([
        supabase.from('rooms').select('id,status,selected_mode,host_participant_id,min_players,max_players').eq('id', initialRoom.id).single(),
        supabase.from('room_participants').select('id,display_name,is_host,joined_at,left_at,connection_status,last_seen_at,updated_at').eq('room_id', initialRoom.id),
      ]);
      if (roomRes.data && participantsRes.data) {
        setState({ room: roomRes.data, participants: normalizeParticipants(participantsRes.data as LobbyParticipant[]) });
      }
    };

    const roomChannel = supabase
      .channel(`lobby:${initialRoom.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${initialRoom.id}` }, (payload) => {
        const row = (payload.new ?? payload.old) as LobbyParticipant;
        if (!row) return;
        setState((prev) => mergeParticipantEvent(prev, row));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${initialRoom.id}` }, (payload) => {
        if (payload.new) setState((prev) => ({ ...prev, room: payload.new as LobbyRoom }));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionMessage(null);
          refreshSnapshot();
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnectionMessage('Conexión inestable. Reintentando sincronizar…');
          setTimeout(() => refreshSnapshot(), 1500);
        }
      });

    if (currentParticipantId) {
      heartbeat = setInterval(async () => {
        await supabase
          .from('room_participants')
          .update({ connection_status: 'connected', last_seen_at: new Date().toISOString() })
          .eq('id', currentParticipantId)
          .is('left_at', null);
      }, 20000);
    }

    const onHide = async () => {
      if (!currentParticipantId) return;
      await supabase.from('room_participants').update({ connection_status: 'disconnected', last_seen_at: new Date().toISOString() }).eq('id', currentParticipantId);
    };
    window.addEventListener('beforeunload', onHide);

    return () => {
      if (heartbeat) clearInterval(heartbeat);
      window.removeEventListener('beforeunload', onHide);
      supabase.removeChannel(roomChannel);
    };
  }, [currentParticipantId, initialRoom.id]);

  const activeParticipants = useMemo(() => state.participants.filter((p) => !p.left_at), [state.participants]);
  const canStart = activeParticipants.length >= state.room.min_players && activeParticipants.length <= state.room.max_players;

  return (
    <>
      <Card>
        <div className="space-y-2 text-sm text-gray-700">
          <p>Código: <strong>{roomCode}</strong></p>
          <p>Participantes: {activeParticipants.length} / {state.room.max_players} (mínimo {state.room.min_players})</p>
          <p className="font-medium">{canStart ? '✅ Se puede iniciar cuando quieran.' : `⏳ Faltan ${Math.max(state.room.min_players - activeParticipants.length, 0)} jugador(es).`}</p>
          <p className="break-all">Link de invitación: <span className="font-medium">{inviteLink}</span></p>
          {connectionMessage ? <p className="text-xs text-amber-600">{connectionMessage}</p> : null}
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 text-base font-semibold text-primary">Participantes</h2>
        <ul className="space-y-2 text-sm">
          {activeParticipants.map((participant) => (
            <li key={participant.id} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2">
              <div>
                <span className="font-medium">{participant.display_name || 'Jugador'}</span>
                {participant.id === state.room.host_participant_id || participant.is_host ? <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">HOST</span> : null}
              </div>
              <span className="text-xs text-gray-500">{deriveConnectionStatus(participant)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
