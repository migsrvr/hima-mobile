import { wholePercents } from '../percent';

describe('wholePercents', () => {
  it('sums to 100', () => {
    const p = wholePercents([145, 120, 95, 60]);
    expect(p.reduce((a, b) => a + b, 0)).toBe(100);
    expect(p).toEqual([34, 29, 23, 14]);
  });

  it('handles empty and single values', () => {
    expect(wholePercents([0, 0])).toEqual([0, 0]);
    expect(wholePercents([5])).toEqual([100]);
  });
});
