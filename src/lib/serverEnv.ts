import { envKeys } from '@/lib/env';

function readOptionalString(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required server environment variable "${name}". ` +
        'Add it to your deployment environment before running Orbitas.',
    );
  }

  return value;
}

export function getServerSupabaseEnv() {
  const supabaseUrl =
    readOptionalString(envKeys.NEXT_PUBLIC_SUPABASE_URL) ?? readOptionalString(envKeys.SUPABASE_URL);
  const supabaseAnonKey =
    readOptionalString(envKeys.NEXT_PUBLIC_SUPABASE_ANON_KEY) ?? readOptionalString(envKeys.SUPABASE_ANON_KEY);

  if (!supabaseUrl) {
    throw new Error(
      `Missing required server environment variable "${envKeys.NEXT_PUBLIC_SUPABASE_URL}" or "${envKeys.SUPABASE_URL}". ` +
        'Add one of them to your deployment environment before running Orbitas.',
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      `Missing required server environment variable "${envKeys.NEXT_PUBLIC_SUPABASE_ANON_KEY}" or "${envKeys.SUPABASE_ANON_KEY}". ` +
        'Add one of them to your deployment environment before running Orbitas.',
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export function getServiceRoleKey() {
  return readRequiredEnv(envKeys.SUPABASE_SERVICE_ROLE_KEY);
}
