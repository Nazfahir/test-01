import { describe, expect, it } from 'vitest';
import { convertGuestProgress } from '@/features/guests/convert-progress';

function createService(opts?: { guestConvertedUserId?: string | null; currencyUpsertError?: boolean }) {
  const state = { participantUpdates: 0, inserts: [] as unknown[] };

  const service: any = {
    from(table: string) {
      if (table === 'guest_sessions') {
        return {
          select() { return this; },
          eq() { return this; },
          maybeSingle: () => Promise.resolve({ data: { id: 'guest-1', converted_user_id: opts?.guestConvertedUserId ?? null } }),
          update() { return this; },
          or() { return this; },
        };
      }

      if (table === 'room_participants') {
        return {
          select() { return this; },
          eq() { return this; },
          gte: () => Promise.resolve({ data: [{ id: 'p1', room_id: 'r1' }] }),
          update() { return this; },
          in: () => { state.participantUpdates += 1; return Promise.resolve({ data: [] }); },
        };
      }

      if (table === 'matches') {
        return {
          select() { return this; },
          in() { return this; },
          gte: () => Promise.resolve({ data: [{ id: 'm1', room_id: 'r1', created_at: new Date().toISOString() }] }),
        };
      }

      if (table === 'currency_transactions') {
        return {
          select() { return this; },
          in() { return this; },
          is: () => Promise.resolve({ data: [{ amount: 12, source_type: 'match_completed', source_id: 'src-1', room_id: 'r1', match_id: 'm1', round_id: null, metadata: null }] }),
          upsert: (rows: unknown[]) => {
            state.inserts = rows;
            return Promise.resolve(opts?.currencyUpsertError ? { error: { message: 'boom' } } : { error: null });
          },
        };
      }

      return { select() { return this; }, eq() { return this; }, maybeSingle: () => Promise.resolve({ data: null }) };
    },
  };

  return { service, state };
}

describe('convertGuestProgress', () => {
  it('converts guest identity and links eligible rewards', async () => {
    const { service, state } = createService();
    const result = await convertGuestProgress({ service, guestSessionId: 'guest-1', requesterGuestSessionId: 'guest-1', targetUserId: 'user-1' });
    expect(result.kind).toBe('converted');
    expect(state.participantUpdates).toBe(1);
    expect(state.inserts).toHaveLength(1);
  });

  it('is idempotent on retry', async () => {
    const { service } = createService({ guestConvertedUserId: 'user-1' });
    const result = await convertGuestProgress({ service, guestSessionId: 'guest-1', requesterGuestSessionId: 'guest-1', targetUserId: 'user-1' });
    expect(result.kind).toBe('already_converted');
  });

  it('blocks cross-guest claim attempts', async () => {
    const { service } = createService();
    const result = await convertGuestProgress({ service, guestSessionId: 'guest-1', requesterGuestSessionId: 'guest-2', targetUserId: 'user-1' });
    expect(result.kind).toBe('forbidden');
  });

  it('returns recoverable partial failure', async () => {
    const { service } = createService({ currencyUpsertError: true });
    const result = await convertGuestProgress({ service, guestSessionId: 'guest-1', requesterGuestSessionId: 'guest-1', targetUserId: 'user-1' });
    expect(result.kind).toBe('failed_partial');
  });
});
