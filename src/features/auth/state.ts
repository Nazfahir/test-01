export type AuthFormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

export const initialAuthState: AuthFormState = { status: 'idle' };
