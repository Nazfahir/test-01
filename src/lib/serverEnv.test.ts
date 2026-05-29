import { envKeys } from '@/lib/env';
import { getServerSupabaseEnv, getServiceRoleKey } from '@/lib/serverEnv';

describe('server env helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env[envKeys.NEXT_PUBLIC_SUPABASE_URL];
    delete process.env[envKeys.NEXT_PUBLIC_SUPABASE_ANON_KEY];
    delete process.env[envKeys.SUPABASE_URL];
    delete process.env[envKeys.SUPABASE_ANON_KEY];
    delete process.env[envKeys.SUPABASE_SERVICE_ROLE_KEY];
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses public names on the server when present', () => {
    process.env[envKeys.NEXT_PUBLIC_SUPABASE_URL] = 'https://public.supabase.co';
    process.env[envKeys.NEXT_PUBLIC_SUPABASE_ANON_KEY] = 'public-anon-key';

    expect(getServerSupabaseEnv()).toEqual({
      supabaseUrl: 'https://public.supabase.co',
      supabaseAnonKey: 'public-anon-key',
    });
  });

  it('allows server-side supabase env to use private fallback names', () => {
    process.env[envKeys.SUPABASE_URL] = 'https://server-only.supabase.co';
    process.env[envKeys.SUPABASE_ANON_KEY] = 'server-anon-key';

    expect(getServerSupabaseEnv()).toEqual({
      supabaseUrl: 'https://server-only.supabase.co',
      supabaseAnonKey: 'server-anon-key',
    });
  });

  it('throws clear server-only error when server supabase url is missing', () => {
    process.env[envKeys.SUPABASE_ANON_KEY] = 'server-anon-key';

    expect(() => getServerSupabaseEnv()).toThrow(
      'Missing required server environment variable "NEXT_PUBLIC_SUPABASE_URL" or "SUPABASE_URL"',
    );
  });

  it('returns service role key only in server env helper', () => {
    process.env[envKeys.SUPABASE_SERVICE_ROLE_KEY] = 'service-role-key';

    expect(getServiceRoleKey()).toBe('service-role-key');
  });
});
