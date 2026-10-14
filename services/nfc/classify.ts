import { merchantForTag } from '@/services/payments/merchants';

import type { RawTag, TagMeaning } from './types';

const has = (tag: RawTag, tech: string) => tag.techTypes.some((t) => t.endsWith(`.${tech}`) || t === tech);

/**
 * Registered tags are merchants (11c). Bank and transit cards (ISO-DEP payment
 * cards, FeliCa) are refused without reading further (11e). Anything else is a
 * readable tag that isn't linked to a merchant (11d).
 */
export function classifyTag(tag: RawTag): TagMeaning {
  const tagId = tag.id.toUpperCase();
  const merchant = merchantForTag(tagId);
  if (merchant) return { kind: 'merchant', tagId, merchant };

  const paymentCard = has(tag, 'IsoDep') && !has(tag, 'MifareClassic') && !has(tag, 'MifareUltralight') && !has(tag, 'Ndef');
  const transitCard = has(tag, 'NfcF');
  if (paymentCard || transitCard) return { kind: 'unsupported', tagId };
  return { kind: 'unknown', tagId };
}
