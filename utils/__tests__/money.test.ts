import { MINUS, formatAmountInput, formatPeso, parseAmount, sanitizeAmountInput, spokenPeso } from '../money';

describe('formatPeso', () => {
  it('uses peso sign, comma thousands and two decimals', () => {
    expect(formatPeso(2580)).toBe('₱2,580.00');
    expect(formatPeso(920)).toBe('₱920.00');
    expect(formatPeso(1234567.5)).toBe('₱1,234,567.50');
    expect(formatPeso(0)).toBe('₱0.00');
  });

  it('uses a true minus sign for negatives', () => {
    expect(formatPeso(-85)).toBe(`${MINUS}₱85.00`);
    expect(formatPeso(-85).startsWith('-')).toBe(false);
    expect(MINUS).toBe('−');
  });

  it('adds a plus only when asked', () => {
    expect(formatPeso(85, { sign: true })).toBe('+₱85.00');
    expect(formatPeso(0, { sign: true })).toBe('₱0.00');
  });

  it('rounds to the cent without float artifacts', () => {
    expect(formatPeso(0.1 + 0.2)).toBe('₱0.30');
    expect(formatPeso(-0.004)).toBe('₱0.00');
  });

  it('drops .00 in compact form only for whole amounts', () => {
    expect(formatPeso(145, { compact: true })).toBe('₱145');
    expect(formatPeso(1290, { compact: true })).toBe('₱1,290');
    expect(formatPeso(77.5, { compact: true })).toBe('₱77.50');
    expect(formatPeso(-60, { compact: true })).toBe(`${MINUS}₱60`);
  });
});

describe('spokenPeso', () => {
  it('reads amounts for screen readers', () => {
    expect(spokenPeso(2580)).toBe('2,580 pesos');
    expect(spokenPeso(1)).toBe('1 peso');
    expect(spokenPeso(-85.5)).toBe('minus 85 pesos 50 centavos');
  });
});

describe('money input', () => {
  it('keeps digits and one decimal point, max two decimals', () => {
    expect(sanitizeAmountInput('3,000.00')).toBe('3000.00');
    expect(sanitizeAmountInput('12.345')).toBe('12.34');
    expect(sanitizeAmountInput('1.2.3')).toBe('1.23');
    expect(sanitizeAmountInput('₱ 150')).toBe('150');
  });

  it('rejects negatives and strips leading zeros', () => {
    expect(sanitizeAmountInput('-50')).toBe('50');
    expect(sanitizeAmountInput('0150')).toBe('150');
    expect(sanitizeAmountInput('0')).toBe('0');
    expect(sanitizeAmountInput('.5')).toBe('0.5');
  });

  it('formats for display', () => {
    expect(formatAmountInput('3000')).toBe('3,000');
    expect(formatAmountInput('3000.5')).toBe('3,000.5');
    expect(formatAmountInput('3000', { padDecimals: true })).toBe('3,000.00');
    expect(formatAmountInput('77.5', { padDecimals: true })).toBe('77.50');
    expect(formatAmountInput('')).toBe('');
  });

  it('parses to a number or null', () => {
    expect(parseAmount('3,000.00')).toBe(3000);
    expect(parseAmount('77.5')).toBe(77.5);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('-20')).toBe(20);
  });
});
