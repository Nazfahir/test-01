'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { createRoomAction } from '@/features/rooms/actions';

export default function CreateRoomPage() {
  const [state, formAction, isPending] = useActionState(createRoomAction, {});

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold text-primary">Crear sala</h1>
      <p className="text-sm text-gray-600">Arma una sala en lobby y comparte el código con tu grupo ✨</p>
      <Card>
        <form action={formAction} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700" htmlFor="displayName">
            Tu nombre visible (si entras como invitado)
          </label>
          <Input id="displayName" name="displayName" placeholder="Ej: Cami Cósmica" />

          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creando sala...' : 'Crear sala ahora'}
          </Button>
        </form>
      </Card>

      <p className="text-center text-xs text-gray-500">
        ¿Ya tienes código?{' '}
        <Link className="font-medium text-primary underline" href="/rooms/join">
          Unirme a una sala
        </Link>
      </p>
    </main>
  );
}
