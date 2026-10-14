import { approxAsset, exactAsset, formatAsset, formatStroopsDecimal, parseRateCentavos, parseStroops, splitByPercents, toStroops } from '../asset';

describe('testnet asset amounts', () => {
  it('converts pesos at the demo rate with the same integer math as the server', () => {
    expect(toStroops(8500, 750)).toBe(113333333n); // ₱85 = 11.3333333 XLM
    expect(toStroops(150000, 750)).toBe(2000000000n); // ₱1,500 = 200 XLM
    expect(toStroops(1, 750)).toBe(13333n);
    expect(toStroops(2, 3)).toBe(6666667n); // rounds half up
    expect(() => toStroops(85.5, 750)).toThrow();
  });

  it('formats previews to two decimals and receipts to all seven', () => {
    expect(formatAsset(113333333n, 'XLM', { approx: true })).toBe('≈ 11.33 XLM');
    expect(formatAsset(113333333n, 'XLM', { exact: true })).toBe('11.3333333 XLM');
    expect(formatAsset(3440000000n, 'XLM')).toBe('344.00 XLM');
    expect(formatAsset(12345678900000n, 'XLM')).toBe('1,234,567.89 XLM');
    expect(formatAsset(99995000n, 'XLM')).toBe('10.00 XLM');
    expect(formatAsset(-113333333n, 'XLM')).toBe('−11.33 XLM');
    expect(formatStroopsDecimal(113333333n)).toBe('11.3333333');
  });

  it("reads the server's rate and decimal amounts", () => {
    expect(parseRateCentavos('7.50')).toBe(750);
    expect(parseRateCentavos('7.5')).toBe(750);
    expect(parseRateCentavos('58')).toBe(5800);
    expect(parseRateCentavos('0')).toBeNull();
    expect(parseRateCentavos('7.505')).toBeNull();
    expect(parseStroops('11.3333333')).toBe(113333333n);
    expect(parseStroops('10000')).toBe(100000000000n);
    expect(parseStroops('1.12345678')).toBeNull();
  });

  it('splits like Paiflow: legs round down, the last leg takes the remainder', () => {
    expect(splitByPercents(113333333n, [90, 10])).toEqual([101999999n, 11333334n]);
    expect(splitByPercents(8500n, [90, 10])).toEqual([7650n, 850n]);
    expect(splitByPercents(99999999n, [85, 10, 5])).toEqual([84999999n, 9999999n, 5000001n]);
  });

  it('previews only once the server has given a rate', () => {
    const rate = { phpPerUnit: '7.50', assetCode: 'XLM' };
    expect(approxAsset(2580, rate)).toBe('≈ 344.00 XLM');
    expect(approxAsset(85, rate)).toBe('≈ 11.33 XLM');
    expect(approxAsset(85, null)).toBeNull();
    expect(approxAsset(85, { phpPerUnit: 'n/a', assetCode: 'XLM' })).toBeNull();
    expect(exactAsset('11.3333333', 'XLM')).toBe('11.3333333 XLM');
    expect(exactAsset('nope', 'XLM')).toBeNull();
  });
});
