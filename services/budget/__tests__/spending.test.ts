import { NEAR_LIMIT_RATIO, percentUsed, spendingStatus } from '../spending';

describe('spendingStatus', () => {
  it('matches the Components board examples', () => {
    expect(spendingStatus(145, 450)).toBe('onTrack'); // Food 32%
    expect(spendingStatus(210, 240)).toBe('nearLimit'); // Transport 88%
    expect(spendingStatus(460, 400)).toBe('over'); // Other, ₱60 over
  });

  it('matches the Home budget rows', () => {
    expect(spendingStatus(120, 240)).toBe('onTrack');
    expect(spendingStatus(60, 200)).toBe('onTrack');
    expect(spendingStatus(95, 400)).toBe('onTrack');
  });

  it('treats exactly the plan as near the limit, not over', () => {
    expect(spendingStatus(240, 240)).toBe('nearLimit');
    expect(spendingStatus(240 * NEAR_LIMIT_RATIO, 240)).toBe('nearLimit');
    expect(spendingStatus(240 * NEAR_LIMIT_RATIO - 0.01, 240)).toBe('onTrack');
  });

  it('handles an empty plan', () => {
    expect(spendingStatus(0, 0)).toBe('onTrack');
    expect(spendingStatus(10, 0)).toBe('over');
  });
});

describe('percentUsed', () => {
  it('rounds to whole percent', () => {
    expect(percentUsed(210, 240)).toBe(88);
    expect(percentUsed(145, 450)).toBe(32);
    expect(percentUsed(0, 0)).toBe(0);
    expect(percentUsed(5, 0)).toBe(100);
  });
});
