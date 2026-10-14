import { classifyTag } from '../classify';

describe('classifyTag', () => {
  it('recognizes the registered demo tag as Campus Canteen', () => {
    const r = classifyTag({ id: '04a1b2c34f2a', techTypes: ['android.nfc.tech.NfcA', 'android.nfc.tech.MifareClassic'] });
    expect(r.kind).toBe('merchant');
    expect(r.kind === 'merchant' && r.merchant.name).toBe('Campus Canteen');
  });

  it('treats other readable tags as unknown (11d)', () => {
    expect(classifyTag({ id: '049A3B7C91C0', techTypes: ['android.nfc.tech.NfcA', 'android.nfc.tech.MifareClassic'] }).kind).toBe(
      'unknown',
    );
  });

  it('refuses bank (ISO-DEP) and transit (FeliCa) cards (11e)', () => {
    expect(classifyTag({ id: '08F1E2D3', techTypes: ['android.nfc.tech.IsoDep', 'android.nfc.tech.NfcA'] }).kind).toBe('unsupported');
    expect(classifyTag({ id: '0123ABCD', techTypes: ['android.nfc.tech.NfcF'] }).kind).toBe('unsupported');
  });
});
