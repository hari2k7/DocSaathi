/**
 * Verification engine for DocSaathi.
 */

function locate(transcription, sourceText) {
  if (!transcription || !sourceText) return null;

  const validRegex = /[\p{L}\p{N}\p{M}]/gu;
  
  const transLower = String(transcription).toLowerCase();
  let transNorm = '';
  const transMap = [];
  
  for (const match of transLower.matchAll(validRegex)) {
    transNorm += match[0];
    for (let i = 0; i < match[0].length; i++) {
      transMap.push(match.index + i);
    }
  }

  const sourceLower = String(sourceText).toLowerCase();
  let sourceNorm = '';
  for (const match of sourceLower.matchAll(validRegex)) {
    sourceNorm += match[0];
  }

  if (sourceNorm.length === 0) return null;

  const idx = transNorm.indexOf(sourceNorm);
  if (idx === -1) return null;

  const start = transMap[idx];
  const end = transMap[idx + sourceNorm.length - 1] + 1;

  return { start, end };
}

function parseISODate(str) {
  if (typeof str !== 'string') return null;
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);

  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;

  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

function daysLeft(date, now = new Date()) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return null;
  const nowMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const targetMidnight = date.getTime();
  return Math.round((targetMidnight - nowMidnight) / (1000 * 60 * 60 * 24));
}

module.exports = {
  locate,
  parseISODate,
  daysLeft
};
