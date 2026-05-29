import { envKeys, getOptionalPublicEnv, getPublicEnv, validatePublicEnv } from '@/lib/env';

describe('browser-safe env helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env[envKeys.NEXT_PUBLIC_SUPABASE_URL];
    delete process.env[envKeys.NEXT_PUBLIC_SUPABASE_ANON_KEY];
    delete process.env[envKeys.SUPABASE_URL];
    delete process.env[envKeys.SUPABASE_ANON_KEY];
    delete process.env[envKeys.NEXT_PUBLIC_APP_URL];
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns public env when present', () => {
    process.env[envKeys.NEXT_PUBLIC_SUPABASE_URL] = 'https://example.supabase.co';
    process.env[envKeys.NEXT_PUBLIC_SUPABASE_ANON_KEY] = 'anon-key';

    expect(getPublicEnv()).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'anon-key',
      appUrl: undefined,
    });
  });

  it('returns optional app url when present', () => {
    process.env[envKeys.NEXT_PUBLIC_SUPABASE_URL] = 'https://example.supabase.co';
    process.env[envKeys.NEXT_PUBLIC_SUPABASE_ANON_KEY] = 'anon-key';
    process.env[envKeys.NEXT_PUBLIC_APP_URL] = 'https://orbitas.example';

    expect(getPublicEnv()).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'anon-key',
      appUrl: 'https://orbitas.example',
    });
  });

  it('returns null instead of throwing when public env is incomplete', () => {
    process.env[envKeys.NEXT_PUBLIC_SUPABASE_ANON_KEY] = 'anon-key';

    expect(getPublicEnv()).toBeNull();
    expect(getOptionalPublicEnv()).toBeNull();
    expect(validatePublicEnv().isValid).toBe(false);
  });
});
