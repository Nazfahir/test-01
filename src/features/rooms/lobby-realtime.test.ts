import { describe, expect, it } from 'vitest';
import { deriveConnectionStatus, mergeParticipantEvent, normalizeParticipants, type LobbyState } from '@/features/rooms/lobby-realtime';

const baseRoom = { id: 'room-1', status: 'lobby', selected_mode: null, host_participant_id: 'p1', min_players: 3, max_players: 8 };

describe('lobby realtime state', () => {
  it('deduplica y ordena participantes por joined_at', () => {
    const participants = normalizeParticipants([
      { id: 'p2', display_name: 'B', is_host: false, joined_at: '2026-01-01T00:00:02Z', left_at: null, connection_status: 'connected', last_seen_at: '2026-01-01T00:00:02Z' },
      { id: 'p1', display_name: 'A', is_host: true, joined_at: '2026-01-01T00:00:01Z', left_at: null, connection_status: 'connected', last_seen_at: '2026-01-01T00:00:01Z' },
      { id: 'p2', display_name: 'B2', is_host: false, joined_at: '2026-01-01T00:00:02Z', left_at: null, connection_status: 'connected', last_seen_at: '2026-01-01T00:00:03Z' },
    ]);

    expect(participants.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(participants[1].display_name).toBe('B2');
  });

  it('mergea evento sin duplicar', () => {
    const state: LobbyState = {
      room: baseRoom,
      participants: [{ id: 'p1', display_name: 'A', is_host: true, joined_at: '2026-01-01T00:00:01Z', left_at: null, connection_status: 'connected', last_seen_at: '2026-01-01T00:00:01Z' }],
    };

    const next = mergeParticipantEvent(state, { id: 'p1', display_name: 'A', is_host: true, joined_at: '2026-01-01T00:00:01Z', left_at: null, connection_status: 'disconnected', last_seen_at: '2026-01-01T00:01:00Z' });
    expect(next.participants).toHaveLength(1);
    expect(next.participants[0].connection_status).toBe('disconnected');
  });

  it('deriva estado left cuando left_at existe', () => {
    expect(
      deriveConnectionStatus({ id: 'p1', display_name: 'A', is_host: false, joined_at: '', left_at: '2026-01-01T00:00:00Z', connection_status: 'connected', last_seen_at: '' }),
    ).toBe('left');
  });
});
