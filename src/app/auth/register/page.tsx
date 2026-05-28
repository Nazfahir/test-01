import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { registerAction } from '@/features/auth/actions';
import { initialAuthState } from '@/features/auth/state';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { uxCopy } from '@/copy/ux';

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect('/');
  }

  const { next } = await searchParams;
  const safeNext = next?.startsWith('/') ? next : '/auth/login';

  return <AuthForm title={uxCopy.auth.registerTitle} submitLabel="Crear cuenta" mode="register" action={registerAction} initialState={initialAuthState} successRedirectTo={safeNext} />;
}
