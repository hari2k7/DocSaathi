function findPII(text) {
  if (!text) return [];
  const spans = [];

  // Aadhaar (12 digits, optional spaces/hyphens, first digit 2-9)
  for (const match of text.matchAll(/\b([2-9])(?:[\s-]*\d){11}\b/g)) {
    spans.push({ type: 'aadhaar', start: match.index, end: match.index + match[0].length });
  }

  // PAN (5 letters, 4 digits, 1 letter)
  for (const match of text.matchAll(/\b[A-Z]{5}\d{4}[A-Z]\b/gi)) {
    spans.push({ type: 'pan', start: match.index, end: match.index + match[0].length });
  }

  // Indian mobile (optional +91, starts 6-9, 10 digits)
  for (const match of text.matchAll(/(?:\+91[\s-]*)?\b[6-9](?:[\s-]*\d){9}\b/g)) {
    spans.push({ type: 'phone', start: match.index, end: match.index + match[0].length });
  }

  // Account numbers (9-18 digits)
  for (const match of text.matchAll(/\b\d{9,18}\b/g)) {
    spans.push({ type: 'account', start: match.index, end: match.index + match[0].length });
  }

  // Merge and resolve overlaps
  spans.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged = [];
  for (const current of spans) {
    if (merged.length === 0) {
      merged.push(current);
      continue;
    }
    const prev = merged[merged.length - 1];
    if (current.start < prev.end) {
      // Overlap. Prefer specific types over 'account'.
      if (prev.type === 'account' && current.type !== 'account') {
        merged.pop();
        merged.push(current);
      }
    } else {
      merged.push(current);
    }
  }

  return merged;
}

function scamRuleHits(text) {
  if (!text) return [];
  const hits = [];
  // Whole-word matching only: "pin" must not fire inside "shipping" or "spinning".
  // "PIN code" is the postal code on every Indian address, not a request for a secret PIN.
  const lower = text.toLowerCase();
  const scanned = lower.replace(/\bpin[\s-]*code\b/g, ' ');

  if (/\b(otp|pin|cvv|password)\b/.test(scanned)) hits.push('requests_credential');
  if (/\b(upi|gpay|paytm|phonepe)\b/.test(scanned)) hits.push('mentions_upi');
  if (/\b(urgent|immediate|immediately|blocked?|suspend(ed)?|within 24 hours)\b/.test(scanned)) hits.push('urgency');
  if (/\bkyc\b.*(expir|block|suspend|update)/.test(scanned)) hits.push('kyc_pressure');
  if (/\b(bit\.ly|tinyurl|t\.co|goo\.gl)\b/.test(scanned)) hits.push('short_link');
  if (/\b(lottery|prize|winner|won|claim your reward)\b/.test(scanned)) hits.push('lottery');
  if (/(https?:\/\/|www\.)/.test(scanned) && !hits.includes('short_link')) hits.push('contains_link');

  return hits;
}

module.exports = { findPII, scamRuleHits };
