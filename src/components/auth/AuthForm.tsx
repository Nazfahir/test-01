'use client';

import { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { AuthFormState } from '@/features/auth/actions';

type Props = {
  title: string;
  submitLabel: string;
  mode: 'login' | 'register';
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  initialState: AuthFormState;
  successRedirectTo?: string;
};

export function AuthForm({ title, submitLabel, mode, action, initialState, successRedirectTo }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === 'success' && mode === 'login') router.push('/profile');
    if (state.status === 'success' && mode === 'register') router.push(successRedirectTo ?? '/auth/login');
  }, [mode, router, state.status, successRedirectTo]);

  return (
    <Card>
      <form action={formAction} className="space-y-4" aria-live="polite">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

        {mode === 'register' ? (
          <label className="block text-sm text-gray-700">
            Nombre visible
            <Input name="display_name" autoComplete="nickname" required minLength={2} />
          </label>
        ) : null}

        <label className="block text-sm text-gray-700">
          Email
          <Input name="email" type="email" autoComplete="email" required />
        </label>

        <label className="block text-sm text-gray-700">
          Contraseña
          <Input
            name="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={8}
          />
        </label>

        {state.message ? (
          <p className={`text-sm ${state.status === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>{state.message}</p>
        ) : null}

        <Button type="submit" disabled={pending}>
          {pending ? 'Un momento…' : submitLabel}
        </Button>

        <p className="text-sm text-gray-600">
          {mode === 'login' ? '¿Primera vez por aquí?' : '¿Ya tienes cuenta?'}{' '}
          <Link className="font-semibold text-primary" href={mode === 'login' ? '/auth/register' : '/auth/login'}>
            {mode === 'login' ? 'Crear cuenta' : 'Ir a login'}
          </Link>
        </p>
      </form>
    </Card>
  );
}
