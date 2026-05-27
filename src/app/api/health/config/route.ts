import { NextResponse } from 'next/server';
import { validatePublicEnv } from '@/lib/env';

export async function GET() {
  const publicEnv = validatePublicEnv();

  return NextResponse.json({
    status: 'ok',
    supabase: {
      configured: publicEnv.isValid,
      hasUrl: Boolean(publicEnv.supabaseUrl),
      hasAnonKey: Boolean(publicEnv.supabaseAnonKey),
    },
  });
}
