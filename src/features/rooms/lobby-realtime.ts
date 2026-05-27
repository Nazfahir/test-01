export type ConnectionStatus = 'connected' | 'disconnected' | 'left';

export type LobbyParticipant = {
  id: string;
  display_name: string;
  is_host: boolean;
  joined_at: string;
  left_at: string | null;
  connection_status: 'connected' | 'disconnected';
  last_seen_at: string;
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
  const merged = state.participants.filter((p) => p.id !== incoming.id);
  merged.push(incoming);
  return { ...state, participants: normalizeParticipants(merged) };
}

export function deriveConnectionStatus(participant: LobbyParticipant): ConnectionStatus {
  if (participant.left_at) return 'left';
  return participant.connection_status;
}
