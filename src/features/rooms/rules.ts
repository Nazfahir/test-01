export type RoomStatus = 'lobby' | 'in_game' | 'results' | 'closed' | 'expired';
export type RoomMode = 'soft' | 'party';

export type JoinRoomValidationInput = {
  roomExists: boolean;
  roomStatus: RoomStatus;
  isExpired: boolean;
  activeParticipantCount: number;
  maxParticipants: number;
  hasActiveParticipant: boolean;
};

export type JoinRoomValidationError =
  | 'room_not_found'
  | 'room_invalid_state'
  | 'room_closed_or_expired'
  | 'room_full';

export type CanSelectModeInput = {
  roomStatus: RoomStatus;
  isHost: boolean;
  selectedMode: string;
};

export type CanStartMatchInput = {
  roomStatus: RoomStatus;
  activeParticipantsCount: number;
  minPlayers: number;
  maxPlayers: number;
  selectedMode: string | null;
};

export function validateJoinRoom(input: JoinRoomValidationInput): JoinRoomValidationError | null {
  if (!input.roomExists) return 'room_not_found';
  if (input.roomStatus !== 'lobby') return 'room_invalid_state';
  if (input.isExpired) {
    return 'room_closed_or_expired';
  }

  if (!input.hasActiveParticipant && input.activeParticipantCount >= input.maxParticipants) {
    return 'room_full';
  }

  return null;
}

export function isValidRoomMode(mode: string | null): mode is RoomMode {
  return mode === 'soft' || mode === 'party';
}

export function canSelectMode(input: CanSelectModeInput): boolean {
  return input.roomStatus === 'lobby' && input.isHost && isValidRoomMode(input.selectedMode);
}

export function canStartMatch(input: CanStartMatchInput): boolean {
  if (input.roomStatus !== 'lobby') return false;
  if (!isValidRoomMode(input.selectedMode)) return false;
  return input.activeParticipantsCount >= input.minPlayers && input.activeParticipantsCount <= input.maxPlayers;
}
