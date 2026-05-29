'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

type Props = {
  roomId: string;
  hostParticipantId: string | null;
  actorParticipantId: string | null;
  children: React.ReactNode;
};

export function PlayRealtimeClient({ roomId, hostParticipantId, actorParticipantId, children }: Props) {
  const router = useRouter();
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [hostDisconnected, setHostDisconnected] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setConnectionMessage('La sincronización en vivo no está configurada. Puedes seguir viendo esta pantalla; revisa las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY para activar actualizaciones automáticas.');
      return;
    }

    const refreshSnapshot = async () => {
      const [roomRes, matchRes, hostRes] = await Promise.all([
        supabase.from('rooms').select('status,host_participant_id').eq('id', roomId).maybeSingle(),
        supabase.from('matches').select('id,current_round_id,status').eq('room_id', roomId).in('status', ['created', 'in_progress']).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        hostParticipantId ? supabase.from('room_participants').select('id,connection_status,left_at').eq('id', hostParticipantId).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      const hostOut = Boolean(hostRes.data && !hostRes.data.left_at && hostRes.data.connection_status === 'disconnected');
      setHostDisconnected(hostOut);

      if (roomRes.data?.status === 'results') router.refresh();
      if (!matchRes.data?.current_round_id && roomRes.data?.status === 'in_game') router.refresh();
    };

    const channel = supabase
      .channel(`play:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `room_id=eq.${roomId}` }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds', filter: `room_id=eq.${roomId}` }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${roomId}` }, (payload) => {
        const row = payload.new as { id?: string; connection_status?: string; left_at?: string | null } | null;
        if (row?.id && row.id === hostParticipantId) {
          setHostDisconnected(Boolean(!row.left_at && row.connection_status === 'disconnected'));
        }
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hostParticipantId, roomId, router]);

  const hostDisconnectedForActor = useMemo(() => hostDisconnected && actorParticipantId !== hostParticipantId, [actorParticipantId, hostDisconnected, hostParticipantId]);

  return (
    <div className="space-y-3">
      {connectionMessage ? <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">{connectionMessage}</p> : null}
      {hostDisconnectedForActor ? <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">Host desconectado. El avance de ronda se pausa hasta que vuelva.</p> : null}
      {children}
    </div>
  );
}
