import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export default function HomePage() {
  return (
    <Card>
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Orbitas</h1>
        <p className="text-sm text-gray-600">Inicio del MVP. Puedes crear tu cuenta local o entrar a tu perfil.</p>
        <div className="space-y-2 text-sm">
          <Link className="block font-semibold text-primary" href="/auth/register">
            Crear cuenta
          </Link>
          <Link className="block font-semibold text-primary" href="/auth/login">
            Iniciar sesión
          </Link>
          <Link className="block font-semibold text-primary" href="/profile">
            Ir a perfil
          </Link>
        </div>
      </div>
    </Card>
  );
}
