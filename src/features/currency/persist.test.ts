import { describe, expect, it } from 'vitest';
import { grantRoundCurrency } from '@/features/currency/persist';

type Row = Record<string, unknown>;

function buildFakeSupabase() {
  const currencyRows: Row[] = [];
  const keySet = new Set<string>();
  const submissions = [{ participant_id: 'p1', status: 'submitted', choice_key: 'A', value: null }];
  const participants = [{ id: 'p1', user_id: 'u1', room_id: 'room-1', left_at: null }];

  return {
    currencyRows,
    client: {
      from(table: string) {
        return {
          select() { return this; },
          eq(_c: string, _v: unknown) {
            if (table === 'round_submissions') return Promise.resolve({ data: submissions });
            if (table === 'room_participants') return { is: () => Promise.resolve({ data: participants }) };
            return Promise.resolve({ data: [] });
          },
          is() { return Promise.resolve({ data: participants }); },
          upsert(rows: Row[]) {
            for (const row of rows) {
              const key = `${row.user_id}|${row.source_type}|${row.source_id}`;
              if (!keySet.has(key)) {
                keySet.add(key);
                currencyRows.push(row);
              }
            }
            return Promise.resolve({ data: rows });
          },
        };
      },
    },
  };
}

describe('currency persist', () => {
  it('is idempotent on retry and stores required fields', async () => {
    const fake = buildFakeSupabase();
    await grantRoundCurrency(fake.client as never, { roomId: 'room-1', matchId: 'm1', roundId: 'r1', gameType: 'would_you_rather' });
    await grantRoundCurrency(fake.client as never, { roomId: 'room-1', matchId: 'm1', roundId: 'r1', gameType: 'would_you_rather' });

    expect(fake.currencyRows.length).toBe(1);
    const row = fake.currencyRows[0];
    expect(row.user_id).toBe('u1');
    expect(row.amount).toBeTypeOf('number');
    expect(row.source_type).toBe('round_completed');
    expect(row.source_id).toBeTypeOf('string');
    expect(row.room_id).toBe('room-1');
    expect(row.match_id).toBe('m1');
    expect(row.round_id).toBe('r1');
    expect(row.metadata).toBeTruthy();
  });

  it('does not duplicate on simple concurrent double trigger', async () => {
    const fake = buildFakeSupabase();
    await Promise.all([
      grantRoundCurrency(fake.client as never, { roomId: 'room-1', matchId: 'm1', roundId: 'r1', gameType: 'would_you_rather' }),
      grantRoundCurrency(fake.client as never, { roomId: 'room-1', matchId: 'm1', roundId: 'r1', gameType: 'would_you_rather' }),
    ]);
    expect(fake.currencyRows.length).toBe(1);
  });
});
