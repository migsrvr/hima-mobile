import { MINUS } from './money';

/**
 * Testnet asset amounts (XLM by default). Integer math only: PHP in centavos,
 * assets in stroops (10^7 per unit). The server uses the same rounding, so a
 * preview here always matches what it settles.
 */
const STROOPS_PER_UNIT = 10000000n;

const groupThousands = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** "7.50" -> 750. Null unless it is a positive amount with at most two decimals. */
export function parseRateCentavos(rate: string): number | null {
  const m = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(rate.trim());
  if (!m) return null;
  const centavos = Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  return centavos > 0 ? centavos : null;
}

/** PHP centavos -> stroops at `rateCentavos` PHP per unit, rounded half up. */
export function toStroops(centavos: number, rateCentavos: number): bigint {
  if (!Number.isSafeInteger(centavos) || !Number.isSafeInteger(rateCentavos) || rateCentavos <= 0) {
    throw new RangeError('toStroops needs whole centavos and a positive rate');
  }
  const negative = centavos < 0;
  const rate = BigInt(rateCentavos);
  const stroops = (BigInt(Math.abs(centavos)) * STROOPS_PER_UNIT * 2n + rate) / (2n * rate);
  return negative ? -stroops : stroops;
}

/** Splits by whole percentages like Paiflow's Split: each leg but the last rounds down, the last takes the remainder. */
export function splitByPercents(total: bigint, percents: readonly number[]): bigint[] {
  let paid = 0n;
  return percents.map((percent, i) => {
    if (i === percents.length - 1) return total - paid;
    const leg = (total * BigInt(percent)) / 100n;
    paid += leg;
    return leg;
  });
}

/** "11.3333333" (as the server reports amounts) -> 113333333n. Null for anything else. */
export function parseStroops(value: string): bigint | null {
  const m = /^(-?)(\d+)(?:\.(\d{1,7}))?$/.exec(value.trim());
  if (!m) return null;
  const abs = BigInt(m[2]) * STROOPS_PER_UNIT + BigInt((m[3] ?? '').padEnd(7, '0'));
  return m[1] ? -abs : abs;
}

/** 113333333n -> "11.3333333": the server's machine format (no grouping, no code). */
export function formatStroopsDecimal(stroops: bigint): string {
  const negative = stroops < 0n;
  const abs = negative ? -stroops : stroops;
  return `${negative ? '-' : ''}${abs / STROOPS_PER_UNIT}.${(abs % STROOPS_PER_UNIT).toString().padStart(7, '0')}`;
}

type FormatOptions = {
  /** All seven decimals, as on-chain ("11.3333333 XLM"). Default: two, rounded half up ("11.33 XLM"). */
  exact?: boolean;
  /** Prefix "≈ " for converted previews. */
  approx?: boolean;
};

/** 113333333n -> "11.33 XLM": comma thousands, true minus sign. */
export function formatAsset(stroops: bigint, code: string, { exact = false, approx = false }: FormatOptions = {}): string {
  const negative = stroops < 0n;
  const abs = negative ? -stroops : stroops;
  let whole: bigint;
  let fraction: string;
  if (exact) {
    whole = abs / STROOPS_PER_UNIT;
    fraction = (abs % STROOPS_PER_UNIT).toString().padStart(7, '0');
  } else {
    const hundredths = (abs + 50000n) / 100000n;
    whole = hundredths / 100n;
    fraction = (hundredths % 100n).toString().padStart(2, '0');
  }
  return `${approx ? '≈ ' : ''}${negative ? MINUS : ''}${groupThousands(whole.toString())}.${fraction} ${code}`;
}

/** "≈ 11.33 XLM" for a peso amount at the server's demo rate, or null while the rate is unknown. */
export function approxAsset(pesos: number, rate: { phpPerUnit: string; assetCode: string } | null | undefined): string | null {
  const rateCentavos = rate ? parseRateCentavos(rate.phpPerUnit) : null;
  if (!rate || rateCentavos == null || !Number.isFinite(pesos)) return null;
  return formatAsset(toStroops(Math.round(pesos * 100), rateCentavos), rate.assetCode, { approx: true });
}

/** Exact on-chain amount from the server's decimal string: "11.3333333 XLM". */
export function exactAsset(amount: string, code: string): string | null {
  const stroops = parseStroops(amount);
  return stroops == null ? null : formatAsset(stroops, code, { exact: true });
}
