const ENV_KEYS = {
  NEXT_PUBLIC_SUPABASE_URL: 'NEXT_PUBLIC_SUPABASE_URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  SUPABASE_SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
} as const;

type PublicEnvKey =
  | typeof ENV_KEYS.NEXT_PUBLIC_SUPABASE_URL
  | typeof ENV_KEYS.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type PrivateEnvKey = typeof ENV_KEYS.SUPABASE_SERVICE_ROLE_KEY;

function readRequiredEnv(name: PublicEnvKey | PrivateEnvKey): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        'Add it to your .env.local before running Orbitas.',
    );
  }

  return value;
}

export function getPublicEnv() {
  return {
    supabaseUrl: readRequiredEnv(ENV_KEYS.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: readRequiredEnv(ENV_KEYS.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}

export function getServiceRoleKey() {
  return readRequiredEnv(ENV_KEYS.SUPABASE_SERVICE_ROLE_KEY);
}

export function validatePublicEnv() {
  const publicEnv = getPublicEnv();

  return {
    isValid: true,
    ...publicEnv,
  };
}

export const envKeys = ENV_KEYS;
