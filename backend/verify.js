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

module.exports = {
  locate
};
