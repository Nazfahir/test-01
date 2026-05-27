'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { joinRoomAsGuest } from '@/features/guests/actions';

export function JoinRoomGuestForm() {
  const [state, formAction, isPending] = useActionState(joinRoomAsGuest, {});

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold text-primary">Unirte a una sala</h1>
      <p className="text-sm text-gray-600">Entra como invitado, elige tu nombre y arranquen juntos ✨</p>

      <Card>
        <form action={formAction} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700" htmlFor="roomCode">
            Código de sala
          </label>
          <Input id="roomCode" name="roomCode" placeholder="Ej: ORB123" autoCapitalize="characters" />

          <label className="block text-sm font-medium text-gray-700" htmlFor="displayName">
            Tu nombre visible
          </label>
          <Input id="displayName" name="displayName" placeholder="¿Cómo te llamamos en la sala?" required />

          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Uniéndote...' : 'Entrar como invitado'}
          </Button>
        </form>
      </Card>

      <p className="text-center text-xs text-gray-500">
        ¿Prefieres entrar con cuenta?{' '}
        <Link className="font-medium text-primary underline" href="/auth/login">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
