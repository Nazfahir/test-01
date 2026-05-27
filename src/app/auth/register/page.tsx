import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { initialAuthState, registerAction } from '@/features/auth/actions';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export default async function RegisterPage() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect('/');
  }

  return <AuthForm title="Crear cuenta Orbitas" submitLabel="Crear cuenta" mode="register" action={registerAction} initialState={initialAuthState} />;
}
