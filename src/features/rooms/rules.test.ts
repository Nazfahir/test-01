import { describe, expect, it } from 'vitest';
import { canSelectMode, canStartMatch } from '@/features/rooms/rules';

describe('lobby pre-start rules', () => {
  describe('canSelectMode', () => {
    it('permite al host seleccionar modo válido en lobby', () => {
      expect(canSelectMode({ roomStatus: 'lobby', isHost: true, selectedMode: 'soft' })).toBe(true);
      expect(canSelectMode({ roomStatus: 'lobby', isHost: true, selectedMode: 'party' })).toBe(true);
    });

    it('bloquea no-host, estado inválido y modos inválidos', () => {
      expect(canSelectMode({ roomStatus: 'lobby', isHost: false, selectedMode: 'soft' })).toBe(false);
      expect(canSelectMode({ roomStatus: 'in_game', isHost: true, selectedMode: 'soft' })).toBe(false);
      expect(canSelectMode({ roomStatus: 'lobby', isHost: true, selectedMode: 'deep' })).toBe(false);
    });
  });

  describe('canStartMatch', () => {
    it('permite iniciar con 3 a 8 activos, lobby y modo válido', () => {
      expect(canStartMatch({ roomStatus: 'lobby', activeParticipantsCount: 3, minPlayers: 3, maxPlayers: 8, selectedMode: 'soft' })).toBe(true);
      expect(canStartMatch({ roomStatus: 'lobby', activeParticipantsCount: 8, minPlayers: 3, maxPlayers: 8, selectedMode: 'party' })).toBe(true);
    });

    it('bloquea umbrales, estado y modo inválidos', () => {
      expect(canStartMatch({ roomStatus: 'lobby', activeParticipantsCount: 2, minPlayers: 3, maxPlayers: 8, selectedMode: 'soft' })).toBe(false);
      expect(canStartMatch({ roomStatus: 'lobby', activeParticipantsCount: 9, minPlayers: 3, maxPlayers: 8, selectedMode: 'soft' })).toBe(false);
      expect(canStartMatch({ roomStatus: 'in_game', activeParticipantsCount: 4, minPlayers: 3, maxPlayers: 8, selectedMode: 'soft' })).toBe(false);
      expect(canStartMatch({ roomStatus: 'lobby', activeParticipantsCount: 4, minPlayers: 3, maxPlayers: 8, selectedMode: null })).toBe(false);
    });
  });
});
