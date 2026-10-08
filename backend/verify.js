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

function verifyAmount(amount, transcription) {
  const issues = [];
  if (!amount || amount.value === null || amount.value === undefined) {
    return issues;
  }
  
  const val = amount.value;
  if (!Number.isFinite(val) || val < 0 || val >= 1e9) {
    issues.push('amount_implausible');
  }

  if (!amount.source_text) {
    issues.push('amount_source_not_found');
    return issues;
  }

  const loc = locate(transcription, amount.source_text);
  if (!loc) {
    issues.push('amount_source_not_found');
  }

  const intPart = String(Math.trunc(val));
  const cleanSource = amount.source_text.replace(/[\s,]/g, '');
  if (!cleanSource.includes(intPart)) {
    issues.push('amount_not_in_source');
  }

  return issues;
}

function verifyDueDate(due, transcription, now = new Date()) {
  const result = {
    issues: [],
    days_left: null,
    status: null
  };

  if (!due || due.value === null || due.value === undefined) {
    return result;
  }

  const d = parseISODate(due.value);
  if (!d) {
    result.issues.push('date_invalid');
    return result;
  }

  const dl = daysLeft(d, now);
  result.days_left = dl;

  if (dl > 0) result.status = 'upcoming';
  else if (dl === 0) result.status = 'due_today';
  else result.status = 'overdue';

  const yNow = now.getUTCFullYear();
  const yDate = d.getUTCFullYear();
  if (yDate < yNow - 5 || yDate > yNow + 2) {
    result.issues.push('date_implausible');
  }

  if (!due.source_text) {
    result.issues.push('date_source_not_found');
    return result;
  }

  const loc = locate(transcription, due.source_text);
  if (!loc) {
    result.issues.push('date_source_not_found');
  }

  const twoDigit = String(yDate).slice(-2);
  if (!due.source_text.includes(twoDigit)) {
    result.issues.push('date_year_not_in_source');
  }

  return result;
}

const ISSUE_MESSAGES = {
  amount_implausible: "The amount is unusual or invalid.",
  amount_source_not_found: "The exact text for the amount could not be located in the document.",
  amount_not_in_source: "The extracted amount does not match its source text.",
  date_invalid: "The due date is invalid.",
  date_implausible: "The due date is too far in the past or future.",
  date_source_not_found: "The exact text for the date could not be located in the document.",
  date_year_not_in_source: "The year in the due date does not match its source text.",
  action_source_not_found: "The exact text for an action could not be located in the document.",
  penalty_source_not_found: "The exact text for a penalty could not be located in the document."
};

function verifyFacts(facts, now = new Date()) {
  const result = {
    due_date: null,
    issues: [],
    messages: [],
    needs_paper_check: false
  };

  if (!facts) return result;

  const transcription = facts.transcription || '';

  const amountIssues = verifyAmount(facts.amount_due, transcription);
  result.issues.push(...amountIssues);

  const dueInfo = verifyDueDate(facts.due_date, transcription, now);
  result.due_date = dueInfo;
  result.issues.push(...dueInfo.issues);

  if (Array.isArray(facts.required_actions)) {
    for (const act of facts.required_actions) {
      if (!locate(transcription, act.source_text)) {
        result.issues.push('action_source_not_found');
      }
    }
  }

  if (Array.isArray(facts.penalties)) {
    for (const pen of facts.penalties) {
      if (!locate(transcription, pen.source_text)) {
        result.issues.push('penalty_source_not_found');
      }
    }
  }

  result.issues = [...new Set(result.issues)];
  result.messages = result.issues.map(code => ISSUE_MESSAGES[code]);

  const hasIssues = result.issues.length > 0;
  const lowConfidence = (typeof facts.confidence === 'number' && facts.confidence < 0.7);
  const hasUnclear = (Array.isArray(facts.unclear_parts) && facts.unclear_parts.length > 0);

  result.needs_paper_check = hasIssues || lowConfidence || hasUnclear;

  return result;
}

module.exports = {
  locate,
  parseISODate,
  daysLeft,
  verifyAmount,
  verifyDueDate,
  verifyFacts,
  ISSUE_MESSAGES
};
