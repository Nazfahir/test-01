import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getRequiredEnv } from '@/lib/env';

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );
}
