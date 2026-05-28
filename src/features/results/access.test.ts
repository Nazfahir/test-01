import { describe, expect, it } from 'vitest';
import { canViewRoomResults } from '@/features/results/access';

describe('canViewRoomResults', () => {
  const participants = [
    { userId: 'user-1', guestSessionId: null, leftAt: null },
    { userId: null, guestSessionId: 'guest-1', leftAt: null },
    { userId: 'user-left', guestSessionId: null, leftAt: '2026-01-01T00:00:00.000Z' },
  ];

  it('permite usuario registrado activo', () => {
    expect(canViewRoomResults({ userId: 'user-1', guestSessionId: null }, participants)).toBe(true);
  });

  it('permite invitado activo', () => {
    expect(canViewRoomResults({ userId: null, guestSessionId: 'guest-1' }, participants)).toBe(true);
  });

  it('rechaza usuario no participante o que salió', () => {
    expect(canViewRoomResults({ userId: 'user-left', guestSessionId: null }, participants)).toBe(false);
    expect(canViewRoomResults({ userId: 'other', guestSessionId: null }, participants)).toBe(false);
  });
});
