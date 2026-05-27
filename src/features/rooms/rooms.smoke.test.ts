import { describe, expect, it } from 'vitest';
import { generateRoomCode, isRoomCodeFormatValid } from '@/features/rooms/room-code';

describe('room code generation smoke', () => {
  it('generates 6-char uppercase alphanumeric codes with no obvious collisions', () => {
    const generated = new Set<string>();

    for (let index = 0; index < 500; index += 1) {
      const code = generateRoomCode();
      expect(isRoomCodeFormatValid(code)).toBe(true);
      generated.add(code);
    }

    expect(generated.size).toBeGreaterThan(495);
  });
});
