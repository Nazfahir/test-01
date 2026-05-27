import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { logoutAction } from '@/features/auth/actions';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export default async function ProfilePage() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', data.user.id)
    .maybeSingle();

  return (
    <Card>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Tu perfil</h1>
        <p className="text-sm text-gray-700">Nombre visible: {profile?.display_name ?? 'Sin nombre todavía'}</p>
        <p className="text-sm text-gray-700">Sesión activa: {data.user.email}</p>
        <p className="text-xs text-gray-500">Pronto podrás ver más detalles de tu progreso aquí.</p>
        <form action={logoutAction}>
          <Button type="submit" className="bg-gray-800">
            Cerrar sesión
          </Button>
        </form>
      </div>
    </Card>
  );
}
