import { describe, expect, it } from 'vitest';
import { validateGuestJoin } from '@/features/rooms/join';

describe('validateGuestJoin', () => {
  it('returns room_not_found when room does not exist', () => {
    expect(
      validateGuestJoin({ roomExists: false, roomState: 'lobby', participantCount: 0 }),
    ).toBe('room_not_found');
  });

  it('blocks in_game rooms', () => {
    expect(validateGuestJoin({ roomExists: true, roomState: 'in_game', participantCount: 1 })).toBe(
      'room_in_game',
    );
  });

  it('blocks closed or expired rooms', () => {
    expect(validateGuestJoin({ roomExists: true, roomState: 'closed', participantCount: 1 })).toBe(
      'room_closed_or_expired',
    );
    expect(validateGuestJoin({ roomExists: true, roomState: 'expired', participantCount: 1 })).toBe(
      'room_closed_or_expired',
    );
  });

  it('blocks full rooms', () => {
    expect(validateGuestJoin({ roomExists: true, roomState: 'lobby', participantCount: 8 })).toBe(
      'room_full',
    );
  });

  it('allows valid lobby rooms', () => {
    expect(validateGuestJoin({ roomExists: true, roomState: 'lobby', participantCount: 3 })).toBeNull();
  });
});
