import { canStartMatch, isValidRoomMode } from '@/features/rooms/rules';

export type StartMatchErrorCode =
  | 'NOT_HOST'
  | 'ROOM_NOT_IN_LOBBY'
  | 'INVALID_PLAYER_COUNT'
  | 'MODE_NOT_SELECTED'
  | 'PROMPTS_UNAVAILABLE'
  | 'MATCH_ALREADY_STARTED';

type RoomRow = {
  id: string;
  room_code: string;
  status: 'lobby' | 'in_game' | 'results' | 'closed' | 'expired';
  selected_mode: 'soft' | 'party' | null;
  min_players: number;
  max_players: number;
  host_participant_id: string | null;
};

type PromptRow = { id: string; game_type: RoundGameType };
export type RoundGameType = 'would_you_rather' | 'most_likely_to' | 'dont_repeat';

type MatchRow = { id: string; room_id: string; status: 'created' | 'in_progress' | 'finished' | 'cancelled' };
type RoundRow = { id: string; round_order: number; game_type: RoundGameType; status: 'waiting' | 'question' | 'locked' | 'reveal' | 'finished' };

export type StartMatchResult =
  | { ok: false; code: StartMatchErrorCode }
  | { ok: true; roomCode: string; matchId: string; currentRoundId: string; alreadyStarted: boolean };

export type StartMatchDeps = {
  findRoom(input: { roomId?: string; roomCode?: string }): Promise<RoomRow | null>;
  countActiveParticipants(roomId: string): Promise<number>;
  findActiveMatch(roomId: string): Promise<{ id: string; currentRoundId: string | null } | null>;
  takePrompts(mode: 'soft' | 'party', gameTypes: RoundGameType[]): Promise<PromptRow[]>;
  createMatchWithRounds(input: {
    room: RoomRow;
    actorParticipantId: string;
    promptsByType: Record<RoundGameType, string>;
  }): Promise<{ match: MatchRow; rounds: RoundRow[]; currentRoundId: string }>;
};

const ROUND_ORDER: RoundGameType[] = ['would_you_rather', 'most_likely_to', 'dont_repeat'];

export async function startMatch(deps: StartMatchDeps, input: { roomId?: string; roomCode?: string; actorParticipantId: string }): Promise<StartMatchResult> {
  const room = await deps.findRoom({ roomId: input.roomId, roomCode: input.roomCode });
  if (!room || room.status !== 'lobby') return { ok: false, code: 'ROOM_NOT_IN_LOBBY' };

  const alreadyStarted = await deps.findActiveMatch(room.id);
  if (alreadyStarted?.currentRoundId) {
    return { ok: true, roomCode: room.room_code, matchId: alreadyStarted.id, currentRoundId: alreadyStarted.currentRoundId, alreadyStarted: true };
  }

  if (room.host_participant_id !== input.actorParticipantId) return { ok: false, code: 'NOT_HOST' };

  if (!isValidRoomMode(room.selected_mode)) return { ok: false, code: 'MODE_NOT_SELECTED' };

  const activeCount = await deps.countActiveParticipants(room.id);
  if (!canStartMatch({ roomStatus: room.status, activeParticipantsCount: activeCount, minPlayers: room.min_players, maxPlayers: room.max_players, selectedMode: room.selected_mode })) {
    return { ok: false, code: 'INVALID_PLAYER_COUNT' };
  }

  const prompts = await deps.takePrompts(room.selected_mode, ROUND_ORDER);
  const promptsByType = Object.fromEntries(prompts.map((prompt) => [prompt.game_type, prompt.id])) as Partial<Record<RoundGameType, string>>;

  if (ROUND_ORDER.some((gameType) => !promptsByType[gameType])) return { ok: false, code: 'PROMPTS_UNAVAILABLE' };

  try {
    const created = await deps.createMatchWithRounds({
      room,
      actorParticipantId: input.actorParticipantId,
      promptsByType: promptsByType as Record<RoundGameType, string>,
    });

    return { ok: true, roomCode: room.room_code, matchId: created.match.id, currentRoundId: created.currentRoundId, alreadyStarted: false };
  } catch {
    const retried = await deps.findActiveMatch(room.id);
    if (retried?.currentRoundId) {
      return { ok: true, roomCode: room.room_code, matchId: retried.id, currentRoundId: retried.currentRoundId, alreadyStarted: true };
    }
    return { ok: false, code: 'MATCH_ALREADY_STARTED' };
  }
}
