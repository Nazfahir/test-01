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

function readOptionalEnv(name: typeof ENV_KEYS.NEXT_PUBLIC_APP_URL): string | undefined {
  const value = process.env[name]?.trim();
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
    appUrl: readOptionalEnv(ENV_KEYS.NEXT_PUBLIC_APP_URL),
  };
}

export function getPublicEnv(): PublicSupabaseEnv {
  // Keep these as direct process.env references so Next.js can inline them into
  // the browser bundle. Dynamic access like process.env[name] is not reliable
  // for NEXT_PUBLIC_* values in client components.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl) {
    throw new Error(
      `Missing required environment variable "${ENV_KEYS.NEXT_PUBLIC_SUPABASE_URL}". ` +
        'Add it to your .env.local before running Orbitas.',
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      `Missing required environment variable "${ENV_KEYS.NEXT_PUBLIC_SUPABASE_ANON_KEY}". ` +
        'Add it to your .env.local before running Orbitas.',
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    appUrl: readOptionalEnv(ENV_KEYS.NEXT_PUBLIC_APP_URL),
  };
}

export function validatePublicEnv() {
  const publicEnv = getOptionalPublicEnv();

  if (!publicEnv) {
    return {
      isValid: false,
      supabaseUrl: '',
      supabaseAnonKey: '',
      appUrl: readOptionalEnv(ENV_KEYS.NEXT_PUBLIC_APP_URL),
    };
  }

  return {
    isValid: true,
    ...publicEnv,
  };
}

export const envKeys = ENV_KEYS;
