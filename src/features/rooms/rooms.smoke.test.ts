import { roomsFeatureReady } from '@/features/rooms';

describe('rooms feature scaffold', () => {
  it('smoke test', () => {
    expect(roomsFeatureReady).toBe(true);
  });
});
