import { envKeys, getPublicEnv, getServiceRoleKey } from '@/lib/env';

describe('env helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
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
    delete process.env[envKeys.NEXT_PUBLIC_SUPABASE_URL];
    process.env[envKeys.NEXT_PUBLIC_SUPABASE_ANON_KEY] = 'anon-key';

    expect(() => getPublicEnv()).toThrow(
      'Missing required environment variable "NEXT_PUBLIC_SUPABASE_URL"',
    );
  });

  it('returns service role key only in server env helper', () => {
    process.env[envKeys.SUPABASE_SERVICE_ROLE_KEY] = 'service-role-key';

    expect(getServiceRoleKey()).toBe('service-role-key');
  });
});
