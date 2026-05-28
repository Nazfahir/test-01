import { canStartMatch } from '@/features/rooms/rules';

export type ConnectionStatus = 'connected' | 'disconnected' | 'left';

export type LobbyParticipant = {
  id: string;
  display_name: string;
  is_host: boolean;
  joined_at: string;
  left_at: string | null;
  connection_status: 'connected' | 'disconnected';
  last_seen_at: string;
  updated_at?: string;
};

export type LobbyRoom = {
  id: string;
  status: string;
  selected_mode: string | null;
  host_participant_id: string | null;
  min_players: number;
  max_players: number;
};

export type LobbyState = { room: LobbyRoom; participants: LobbyParticipant[] };

export function normalizeParticipants(participants: LobbyParticipant[]): LobbyParticipant[] {
  const byId = new Map<string, LobbyParticipant>();
  for (const participant of participants) byId.set(participant.id, participant);
  return [...byId.values()].sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime() || a.id.localeCompare(b.id));
}

export function mergeParticipantEvent(state: LobbyState, incoming: LobbyParticipant): LobbyState {
  const previous = state.participants.find((p) => p.id === incoming.id);
  const prevUpdated = previous?.updated_at ?? previous?.last_seen_at ?? '';
  const nextUpdated = incoming.updated_at ?? incoming.last_seen_at ?? '';
  const shouldIgnore = previous && prevUpdated && nextUpdated && new Date(nextUpdated).getTime() < new Date(prevUpdated).getTime();
  if (shouldIgnore) return state;

  const merged = state.participants.filter((p) => p.id !== incoming.id);
  merged.push({ ...previous, ...incoming });
  return { ...state, participants: normalizeParticipants(merged) };
}

export function isHostDisconnected(room: LobbyRoom, participants: LobbyParticipant[]): boolean {
  if (!room.host_participant_id) return false;
  const host = participants.find((participant) => participant.id === room.host_participant_id);
  if (!host) return true;
  return !host.left_at && host.connection_status === 'disconnected';
}

export function deriveConnectionStatus(participant: LobbyParticipant): ConnectionStatus {
  if (participant.left_at) return 'left';
  return participant.connection_status;
}

export function getActiveParticipants(participants: LobbyParticipant[]): LobbyParticipant[] {
  return participants.filter((participant) => !participant.left_at);
}

export function getLobbyStartStatus(room: LobbyRoom, participants: LobbyParticipant[]): { canStart: boolean; reason: string } {
  const activeCount = getActiveParticipants(participants).length;
  const canStart = canStartMatch({
    roomStatus: room.status as 'lobby' | 'in_game' | 'results' | 'closed' | 'expired',
    activeParticipantsCount: activeCount,
    minPlayers: room.min_players,
    maxPlayers: room.max_players,
    selectedMode: room.selected_mode,
  });

  if (canStart) return { canStart: true, reason: '✅ Todo listo para iniciar.' };
  if (room.status !== 'lobby') return { canStart: false, reason: 'La sala ya no está en lobby.' };
  if (!room.selected_mode) return { canStart: false, reason: 'Elige modo Suave o Fiesta para habilitar inicio.' };
  if (activeCount < room.min_players) return { canStart: false, reason: `Faltan ${room.min_players - activeCount} jugador(es) para iniciar.` };
  return { canStart: false, reason: `Hay demasiados jugadores activos (${activeCount}/${room.max_players}).` };
}
