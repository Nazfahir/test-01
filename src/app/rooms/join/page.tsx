'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { joinRoomAction } from '@/features/rooms/actions';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { uxCopy } from '@/copy/ux';

export default function JoinRoomPage() {
  const [state, formAction, isPending] = useActionState(joinRoomAction, {});

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold text-primary">{uxCopy.room.joinTitle}</h1>
      <p className="text-sm text-gray-600">{uxCopy.room.joinSubtitle}</p>

      <Card>
        <form action={formAction} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700" htmlFor="roomCode">
            Código de sala
          </label>
          <Input id="roomCode" name="roomCode" placeholder="Ej: AB7KQ2" autoCapitalize="characters" required />

          <label className="block text-sm font-medium text-gray-700" htmlFor="displayName">
            {uxCopy.room.guestNameHelp}
          </label>
          <Input id="displayName" name="displayName" placeholder="¿Cómo te llamamos en la sala?" />

          {state.error ? <ErrorNotice code="UNKNOWN" /> : null}
          {state.error ? <p className="text-xs text-gray-600">{state.error}</p> : null}

          <Button type="submit" disabled={isPending}>
            {isPending ? uxCopy.room.joinPending : uxCopy.room.joinCta}
          </Button>
        </form>
      </Card>

      <p className="text-center text-xs text-gray-500">
        ¿Aún no hay sala?{' '}
        <Link className="font-medium text-primary underline" href="/rooms/create">
          Crear una nueva
        </Link>
      </p>
    </main>
  );
}
