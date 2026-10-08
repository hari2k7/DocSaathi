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
  const lower = text.toLowerCase();
  
  if (/(otp|pin|cvv|password)/.test(lower)) hits.push('requests_credential');
  if (/(upi|gpay|paytm|phonepe)/.test(lower)) hits.push('mentions_upi');
  if (/(urgent|immediate|blocked|suspend|within 24 hours)/.test(lower)) hits.push('urgency');
  if (/(kyc).*(expir|block|suspend|update)/.test(lower)) hits.push('kyc_pressure');
  if (/(bit\.ly|tinyurl|t\.co|goo\.gl)/.test(lower)) hits.push('short_link');
  if (/(lottery|prize|winner|won|claim your reward)/.test(lower)) hits.push('lottery');
  if (/(http|www\.)/.test(lower) && !hits.includes('short_link')) hits.push('contains_link');

  return hits;
}

module.exports = { findPII, scamRuleHits };
