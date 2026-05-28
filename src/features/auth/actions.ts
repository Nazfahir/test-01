'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from '@/lib/supabaseServer';
import { validateLoginInput, validateRegisterInput } from '@/features/auth/validation';
import { getGuestSessionIdFromCookie } from '@/features/guests/session';
import { convertGuestProgress } from '@/features/guests/convert-progress';
import { getErrorUX } from '@/features/errors/catalog';

export type AuthFormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

export const initialAuthState: AuthFormState = { status: 'idle' };

export async function registerAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const displayName = String(formData.get('display_name') ?? '').trim();

  const validation = validateRegisterInput(email, password, displayName);
  if (!validation.valid) {
    return { status: 'error', message: Object.values(validation.errors)[0] };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user) {
    return { status: 'error', message: mapAuthError(error?.message, 'No pudimos crear tu cuenta por ahora.') };
  }

  const service = getSupabaseServiceRoleClient();
  const guestSessionId = await getGuestSessionIdFromCookie();
  const { error: profileError } = await service.from('profiles').upsert(
    {
      id: data.user.id,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (profileError) {
    return {
      status: 'error',
      message: 'Tu cuenta fue creada, pero no pudimos preparar tu perfil. Intenta iniciar sesión nuevamente.',
    };
  }

  if (guestSessionId) {
    const conversion = await convertGuestProgress({
      service,
      guestSessionId,
      requesterGuestSessionId: guestSessionId,
      targetUserId: data.user.id,
      eligibleHours: 24,
    });

    if (conversion.kind === 'failed_partial') {
      console.error('guest_conversion_partial_failure', { guestSessionId, userId: data.user.id });
      return {
        status: 'success',
        message: getErrorUX('GUEST_CONVERSION_FAILED').description,
      };
    }

    console.info('guest_conversion_result', { guestSessionId, userId: data.user.id, result: conversion.kind });
  }

  return { status: 'success', message: '¡Listo! Tu cuenta Orbitas ya está preparada y tu progreso reciente quedó guardado ✨' };
}

export async function loginAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const validation = validateLoginInput(email, password);
  if (!validation.valid) {
    return { status: 'error', message: Object.values(validation.errors)[0] };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { status: 'error', message: mapAuthError(error.message, 'No pudimos iniciar tu sesión todavía.') };
  }

  return { status: 'success', message: '¡Qué bueno verte! Tu sesión ya está activa.' };
}

export async function logoutAction(): Promise<never> {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}

function mapAuthError(rawMessage: string | undefined, fallback: string): string {
  if (!rawMessage) return fallback;

  const message = rawMessage.toLowerCase();
  if (message.includes('invalid login credentials')) {
    return 'No encontramos coincidencia con ese email y contraseña. Revisa e intenta de nuevo.';
  }
  if (message.includes('email not confirmed')) {
    return 'Tu email aún no está confirmado. Revisa tu bandeja e intenta nuevamente.';
  }
  if (message.includes('user already registered')) {
    return 'Ese email ya tiene cuenta. Puedes entrar desde login.';
  }

  return fallback;
}
