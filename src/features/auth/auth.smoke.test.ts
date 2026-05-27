import { authFeatureReady } from '@/features/auth';

describe('auth feature scaffold', () => {
  it('smoke test', () => {
    expect(authFeatureReady).toBe(true);
  });
});
