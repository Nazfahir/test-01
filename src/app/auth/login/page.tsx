import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { initialAuthState, loginAction } from '@/features/auth/actions';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export default async function LoginPage() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect('/');
  }

  return <AuthForm title="Entrar a Orbitas" submitLabel="Iniciar sesión" mode="login" action={loginAction} initialState={initialAuthState} />;
}
