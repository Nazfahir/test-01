export type RoomStatus = 'lobby' | 'in_game' | 'results' | 'closed' | 'expired';

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
