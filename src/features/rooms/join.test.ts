import { describe, expect, it } from 'vitest';
import { validateJoinRoom } from '@/features/rooms/rules';

describe('validateJoinRoom', () => {
  it('returns room_not_found when room does not exist', () => {
    expect(
      validateJoinRoom({
        roomExists: false,
        roomStatus: 'lobby',
        isExpired: false,
        activeParticipantCount: 0,
        maxParticipants: 8,
        hasActiveParticipant: false,
      }),
    ).toBe('room_not_found');
  });

  it('blocks non-lobby states', () => {
    expect(
      validateJoinRoom({
        roomExists: true,
        roomStatus: 'in_game',
        isExpired: false,
        activeParticipantCount: 1,
        maxParticipants: 8,
        hasActiveParticipant: false,
      }),
    ).toBe('room_invalid_state');
  });

  it('blocks closed or expired rooms', () => {
    expect(
      validateJoinRoom({
        roomExists: true,
        roomStatus: 'closed',
        isExpired: false,
        activeParticipantCount: 1,
        maxParticipants: 8,
        hasActiveParticipant: false,
      }),
    ).toBe('room_invalid_state');

    expect(
      validateJoinRoom({
        roomExists: true,
        roomStatus: 'lobby',
        isExpired: true,
        activeParticipantCount: 1,
        maxParticipants: 8,
        hasActiveParticipant: false,
      }),
    ).toBe('room_closed_or_expired');
  });

  it('blocks full rooms for new participants', () => {
    expect(
      validateJoinRoom({
        roomExists: true,
        roomStatus: 'lobby',
        isExpired: false,
        activeParticipantCount: 8,
        maxParticipants: 8,
        hasActiveParticipant: false,
      }),
    ).toBe('room_full');
  });

  it('allows reusing existing active participant even when room is full', () => {
    expect(
      validateJoinRoom({
        roomExists: true,
        roomStatus: 'lobby',
        isExpired: false,
        activeParticipantCount: 8,
        maxParticipants: 8,
        hasActiveParticipant: true,
      }),
    ).toBeNull();
  });
});
