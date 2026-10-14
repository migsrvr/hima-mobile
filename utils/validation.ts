/** Field validation with the error copy from the design (02b Log in error, Components board). */

const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export const MIN_PASSWORD = 8;

export function validateEmail(email: string): string | undefined {
  const value = email.trim();
  if (!EMAIL.test(value)) return 'Enter a full email, like name@example.com';
  return undefined;
}

export function validatePassword(password: string, mode: 'logIn' | 'signUp'): string | undefined {
  if (password.length === 0) return 'Enter your password';
  if (mode === 'signUp' && password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters`;
  return undefined;
}
