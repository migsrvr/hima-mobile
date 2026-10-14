/** U+2212 MINUS SIGN. Money never uses the ASCII hyphen. */
export const MINUS = '−';

const groupThousands = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

type FormatOptions = {
  /** Prefix positive amounts with "+" (incoming money). */
  sign?: boolean;
  /** Drop ".00" on whole amounts ("₱145"); keep cents otherwise ("₱77.50"). Used where the design shows whole pesos. */
  compact?: boolean;
};

/**
 * Formats a peso amount: ₱ sign, comma thousands, two decimals, true minus.
 * Render with `tabular` from @/theme so figures line up.
 *
 * formatPeso(2580) -> "₱2,580.00"; formatPeso(-85) -> "−₱85.00"; formatPeso(85, { sign: true }) -> "+₱85.00"
 * formatPeso(145, { compact: true }) -> "₱145"
 */
export function formatPeso(amount: number, opts: FormatOptions = {}): string {
  const cents = Math.round(amount * 100);
  const abs = Math.abs(cents);
  const whole = groupThousands(Math.floor(abs / 100).toString());
  const frac = (abs % 100).toString().padStart(2, '0');
  const body = opts.compact && abs % 100 === 0 ? `₱${whole}` : `₱${whole}.${frac}`;
  if (cents < 0) return `${MINUS}${body}`;
  if (opts.sign && cents > 0) return `+${body}`;
  return body;
}

/** Screen-reader text for an amount: "2,580 pesos", "minus 85 pesos 50 centavos". */
export function spokenPeso(amount: number): string {
  const cents = Math.round(amount * 100);
  const abs = Math.abs(cents);
  const pesos = Math.floor(abs / 100);
  const centavos = abs % 100;
  const parts = [`${groupThousands(pesos.toString())} ${pesos === 1 ? 'peso' : 'pesos'}`];
  if (centavos > 0) parts.push(`${centavos} ${centavos === 1 ? 'centavo' : 'centavos'}`);
  return `${cents < 0 ? 'minus ' : ''}${parts.join(' ')}`;
}

/**
 * Cleans what the user typed into a money field: digits and one decimal point,
 * at most two decimals, no minus sign, no leading zeros. Commas are dropped.
 * Returns the raw value ("3000.5"), not the display text.
 */
export function sanitizeAmountInput(text: string): string {
  let out = '';
  let seenDot = false;
  let decimals = 0;
  for (const ch of text) {
    if (ch >= '0' && ch <= '9') {
      if (seenDot) {
        if (decimals >= 2) continue;
        decimals += 1;
      }
      out += ch;
    } else if (ch === '.' && !seenDot) {
      seenDot = true;
      out += out === '' ? '0.' : '.';
    }
  }
  // "0150" -> "150", but keep "0" and "0.5"
  return out.replace(/^0+(?=\d)/, '');
}

/** Display text for a raw amount: comma thousands, optional two decimals ("3,000.00"). */
export function formatAmountInput(raw: string, opts: { padDecimals?: boolean } = {}): string {
  if (raw === '') return '';
  const [intPart, decPart] = raw.split('.');
  const grouped = groupThousands(intPart === '' ? '0' : intPart);
  if (opts.padDecimals) return `${grouped}.${(decPart ?? '').padEnd(2, '0').slice(0, 2)}`;
  return decPart === undefined ? grouped : `${grouped}.${decPart}`;
}

/** Parses a raw amount. Returns null for empty or invalid input. Never negative. */
export function parseAmount(raw: string): number | null {
  const clean = sanitizeAmountInput(raw);
  if (clean === '' || clean === '0.') return null;
  const value = Number(clean);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}
