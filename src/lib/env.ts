const ENV_KEYS = {
  NEXT_PUBLIC_SUPABASE_URL: 'NEXT_PUBLIC_SUPABASE_URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  SUPABASE_URL: 'SUPABASE_URL',
  SUPABASE_ANON_KEY: 'SUPABASE_ANON_KEY',
  SUPABASE_SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
  NEXT_PUBLIC_APP_URL: 'NEXT_PUBLIC_APP_URL',
} as const;

type PublicSupabaseEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appUrl: string | undefined;
};

function readOptionalAppUrl(): string | undefined {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return value || undefined;
}

export function getOptionalPublicEnv(): PublicSupabaseEnv | null {
  // Keep these as direct process.env references so Next.js can inline them into
  // the browser bundle. Dynamic access like process.env[name] is not reliable
  // for NEXT_PUBLIC_* values in client components.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return {
    supabaseUrl,
    supabaseAnonKey,
    appUrl: readOptionalAppUrl(),
  };
}

export function getPublicEnv(): PublicSupabaseEnv | null {
  return getOptionalPublicEnv();
}

export function validatePublicEnv() {
  const publicEnv = getOptionalPublicEnv();

  if (!publicEnv) {
    return {
      isValid: false,
      supabaseUrl: '',
      supabaseAnonKey: '',
      appUrl: readOptionalAppUrl(),
    };
  }

  return {
    isValid: true,
    ...publicEnv,
  };
}

export const envKeys = ENV_KEYS;
