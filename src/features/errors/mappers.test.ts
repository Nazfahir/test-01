import { describe, expect, it } from 'vitest';
import { getErrorUX } from '@/features/errors/catalog';
import { mapJoinValidationErrorToCode, mapRoundErrorToCode, mapStartMatchErrorToCode } from '@/features/errors/mappers';

describe('error mappers', () => {
  it('maps join errors to user-friendly codes', () => {
    expect(mapJoinValidationErrorToCode('room_not_found')).toBe('ROOM_NOT_FOUND');
    expect(mapJoinValidationErrorToCode('room_full')).toBe('ROOM_FULL');
  });

  it('maps start-match errors', () => {
    expect(mapStartMatchErrorToCode('INVALID_PLAYER_COUNT')).toBe('MIN_PLAYERS_NOT_MET');
    expect(mapStartMatchErrorToCode('PROMPTS_UNAVAILABLE')).toBe('PROMPTS_UNAVAILABLE');
  });

  it('maps round errors and returns ux content', () => {
    const code = mapRoundErrorToCode('ROUND_NOT_CURRENT');
    expect(code).toBe('ROUND_STATE_INVALID');
    expect(getErrorUX(code).title).toContain('ronda');
  });
});
