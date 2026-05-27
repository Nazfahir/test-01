import { validateLoginInput, validateRegisterInput } from '@/features/auth/validation';

describe('auth input validation', () => {
  it('validates login happy path', () => {
    expect(validateLoginInput('test@example.com', 'secure-pass')).toEqual({
      valid: true,
      errors: {},
    });
  });

  it('validates login errors', () => {
    const result = validateLoginInput('bad-email', '');
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeDefined();
    expect(result.errors.password).toBeDefined();
  });

  it('validates register fields', () => {
    const result = validateRegisterInput('test@example.com', '123', 'A');
    expect(result.valid).toBe(false);
    expect(result.errors.displayName).toBeDefined();
    expect(result.errors.password).toBeDefined();
  });
});
