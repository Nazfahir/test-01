export type AuthValidationResult = {
  valid: boolean;
  errors: {
    email?: string;
    password?: string;
    displayName?: string;
  };
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginInput(email: string, password: string): AuthValidationResult {
  const errors: AuthValidationResult['errors'] = {};

  if (!email.trim()) {
    errors.email = 'Ingresa tu email para continuar.';
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Ese email no parece válido todavía. Revísalo con calma.';
  }

  if (!password) {
    errors.password = 'Ingresa tu contraseña para entrar.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateRegisterInput(
  email: string,
  password: string,
  displayName: string,
): AuthValidationResult {
  const loginValidation = validateLoginInput(email, password);
  const errors = { ...loginValidation.errors };

  if (!displayName.trim()) {
    errors.displayName = 'Elige un nombre visible para tu perfil.';
  } else if (displayName.trim().length < 2) {
    errors.displayName = 'Tu nombre visible debe tener al menos 2 caracteres.';
  }

  if (password && password.length < 8) {
    errors.password = 'Usa una contraseña de al menos 8 caracteres.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
