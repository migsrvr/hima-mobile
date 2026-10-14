import { validateEmail, validatePassword } from '../validation';

describe('validateEmail', () => {
  it('accepts full addresses', () => {
    expect(validateEmail('bea.reyes@example.com')).toBeUndefined();
    expect(validateEmail('  bea@uni.edu.ph ')).toBeUndefined();
  });

  it('rejects partial addresses with the 02b copy', () => {
    expect(validateEmail('bea.reyes@example')).toBe('Enter a full email, like name@example.com');
    expect(validateEmail('')).toBe('Enter a full email, like name@example.com');
    expect(validateEmail('bea reyes@example.com')).toBeDefined();
  });
});

describe('validatePassword', () => {
  it('requires a password to log in', () => {
    expect(validatePassword('', 'logIn')).toBe('Enter your password');
    expect(validatePassword('x', 'logIn')).toBeUndefined();
  });

  it('requires 8 characters to sign up', () => {
    expect(validatePassword('hima12', 'signUp')).toBe('Use at least 8 characters');
    expect(validatePassword('hima-demo', 'signUp')).toBeUndefined();
  });
});
