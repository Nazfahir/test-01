export type RoomState = 'lobby' | 'in_game' | 'closed' | 'expired';

export type JoinRoomValidationInput = {
  roomExists: boolean;
  roomState: RoomState;
  participantCount: number;
  maxParticipants?: number;
};

export type JoinRoomValidationError =
  | 'room_not_found'
  | 'room_full'
  | 'room_in_game'
  | 'room_closed_or_expired';

export function validateGuestJoin(input: JoinRoomValidationInput): JoinRoomValidationError | null {
  if (!input.roomExists) return 'room_not_found';
  if (input.roomState === 'in_game') return 'room_in_game';
  if (input.roomState === 'closed' || input.roomState === 'expired') return 'room_closed_or_expired';

  const maxParticipants = input.maxParticipants ?? 8;
  if (input.participantCount >= maxParticipants) return 'room_full';

  return null;
}
