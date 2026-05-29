import { envKeys, getOptionalPublicEnv, getPublicEnv, getServerSupabaseEnv, getServiceRoleKey, validatePublicEnv } from '@/lib/env';

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

  it('throws clear error when required public env is missing', () => {
    process.env[envKeys.NEXT_PUBLIC_SUPABASE_ANON_KEY] = 'anon-key';

    expect(() => getPublicEnv()).toThrow(
      'Missing required environment variable "NEXT_PUBLIC_SUPABASE_URL"',
    );
  });

  it('returns null optional public env instead of throwing when browser config is incomplete', () => {
    process.env[envKeys.NEXT_PUBLIC_SUPABASE_ANON_KEY] = 'anon-key';

    expect(getOptionalPublicEnv()).toBeNull();
    expect(validatePublicEnv().isValid).toBe(false);
  });

  it('allows server-side supabase env to use private fallback names', () => {
    process.env[envKeys.SUPABASE_URL] = 'https://server-only.supabase.co';
    process.env[envKeys.SUPABASE_ANON_KEY] = 'server-anon-key';

    expect(getServerSupabaseEnv()).toEqual({
      supabaseUrl: 'https://server-only.supabase.co',
      supabaseAnonKey: 'server-anon-key',
    });
  });

  it('returns service role key only in server env helper', () => {
    process.env[envKeys.SUPABASE_SERVICE_ROLE_KEY] = 'service-role-key';

    expect(getServiceRoleKey()).toBe('service-role-key');
  });
});
