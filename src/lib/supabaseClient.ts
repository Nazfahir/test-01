'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getOptionalPublicEnv } from '@/lib/env';

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient) {
    return browserClient;
  }

  const publicEnv = getOptionalPublicEnv();
  if (!publicEnv) return null;

  browserClient = createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
  return browserClient;
}
