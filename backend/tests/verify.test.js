const test = require('node:test');
const assert = require('node:assert');
const { locate, parseISODate, daysLeft, verifyAmount, verifyDueDate, verifyFacts } = require('../verify.js');

test('locate()', async (t) => {
  await t.test('exact match', () => {
    const res = locate('The quick brown fox', 'quick brown');
    assert.deepStrictEqual(res, { start: 4, end: 15 });
  });

  await t.test('spacing and punctuation differences', () => {
    const res = locate('Total: Rs. 1,500.00 due', 'rs150000');
    assert.deepStrictEqual(res, { start: 7, end: 19 });
  });

  await t.test('missing source', () => {
    const res = locate('Hello world', 'goodbye');
    assert.strictEqual(res, null);
  });

  await t.test('Tamil text', () => {
    const res = locate('ரசீது: மின்சார கட்டணம் 100', 'மின்சாரகட்டணம்');
    assert.deepStrictEqual(res, { start: 7, end: 22 });
  });

  await t.test('Devanagari text', () => {
    const res = locate('यह बिजली का बिल है', 'बिजलीकाबिल');
    assert.deepStrictEqual(res, { start: 3, end: 15 });
  });

  await t.test('empty input', () => {
    assert.strictEqual(locate('', 'text'), null);
    assert.strictEqual(locate('text', ''), null);
    assert.strictEqual(locate(null, null), null);
  });
});

test('parseISODate()', async (t) => {
  await t.test('valid', () => {
    const d = parseISODate('2026-10-15');
    assert.strictEqual(d.toISOString(), '2026-10-15T00:00:00.000Z');
  });

  await t.test('impossible dates', () => {
    assert.strictEqual(parseISODate('2026-02-30'), null);
    assert.strictEqual(parseISODate('2026-13-01'), null);
  });

  await t.test('leap day', () => {
    const d = parseISODate('2024-02-29');
    assert.strictEqual(d.toISOString(), '2024-02-29T00:00:00.000Z');
    assert.strictEqual(parseISODate('2026-02-29'), null); // not a leap year
  });
});

test('daysLeft()', async (t) => {
  const now = new Date('2026-10-08T15:00:00Z'); // 3 PM UTC

  await t.test('valid future', () => {
    const d = parseISODate('2026-10-10');
    assert.strictEqual(daysLeft(d, now), 2);
  });

  await t.test('due today', () => {
    const d = parseISODate('2026-10-08');
    assert.strictEqual(daysLeft(d, now), 0);
  });

  await t.test('year boundary', () => {
    const d = parseISODate('2027-01-01');
    const endOfYear = new Date('2026-12-31T23:59:59Z');
    assert.strictEqual(daysLeft(d, endOfYear), 1);
  });
});

test('verifyAmount()', async (t) => {
  await t.test('good amount', () => {
    assert.deepStrictEqual(verifyAmount({ value: 1500, source_text: '1500' }, 'Total: 1500'), []);
  });

  await t.test('comma formats', () => {
    assert.deepStrictEqual(verifyAmount({ value: 184000, source_text: 'Rs 1,84,000.00' }, 'Pay Rs 1,84,000.00 now'), []);
  });

  await t.test('mismatch', () => {
    assert.deepStrictEqual(verifyAmount({ value: 1500, source_text: '1600' }, 'Total: 1600'), ['amount_not_in_source']);
  });

  await t.test('missing quote', () => {
    assert.deepStrictEqual(verifyAmount({ value: 1500, source_text: '1500' }, 'Total is 1600'), ['amount_source_not_found']);
  });

  await t.test('null amount', () => {
    assert.deepStrictEqual(verifyAmount(null, 'text'), []);
    assert.deepStrictEqual(verifyAmount({ value: null, source_text: '' }, 'text'), []);
  });
});

test('verifyDueDate()', async (t) => {
  const now = new Date('2026-10-08T15:00:00Z');
  
  await t.test('upcoming', () => {
    const res = verifyDueDate({ value: '2026-10-10', source_text: '10/10/26' }, 'Due on 10/10/26', now);
    assert.deepStrictEqual(res, { issues: [], days_left: 2, status: 'upcoming' });
  });

  await t.test('today', () => {
    const res = verifyDueDate({ value: '2026-10-08', source_text: '08-Oct-2026' }, 'Due 08-Oct-2026', now);
    assert.deepStrictEqual(res, { issues: [], days_left: 0, status: 'due_today' });
  });

  await t.test('overdue', () => {
    const res = verifyDueDate({ value: '2026-10-01', source_text: '1st Oct 26' }, 'Paid by 1st Oct 26', now);
    assert.deepStrictEqual(res, { issues: [], days_left: -7, status: 'overdue' });
  });

  await t.test('implausible year', () => {
    const res = verifyDueDate({ value: '2020-01-01', source_text: 'Jan 1 2020' }, 'Jan 1 2020', now);
    assert.deepStrictEqual(res, { issues: ['date_implausible'], days_left: -2472, status: 'overdue' });
  });

  await t.test('invalid', () => {
    const res = verifyDueDate({ value: '2026-13-01', source_text: 'foo' }, 'foo', now);
    assert.deepStrictEqual(res, { issues: ['date_invalid'], days_left: null, status: null });
  });

  await t.test('null', () => {
    const res = verifyDueDate(null, 'text', now);
    assert.deepStrictEqual(res, { issues: [], days_left: null, status: null });
  });
});

test('verifyFacts()', async (t) => {
  const now = new Date('2026-10-08T15:00:00Z');
  
  await t.test('clean facts', () => {
    const facts = {
      transcription: "Total 1500 Due 2026-10-10 Warning: pay now Penalty: fees",
      amount_due: { value: 1500, source_text: "1500" },
      due_date: { value: "2026-10-10", source_text: "2026-10-10" },
      required_actions: [{ action: "pay", source_text: "pay now" }],
      penalties: [{ description: "late fee", source_text: "fees" }],
      unclear_parts: [],
      confidence: 0.9
    };
    const res = verifyFacts(facts, now);
    assert.strictEqual(res.needs_paper_check, false);
    assert.strictEqual(res.issues.length, 0);
  });

  await t.test('needs_paper_check triggers', () => {
    // Has issues
    const factsIssues = {
      transcription: "Total 1500",
      amount_due: { value: 1500, source_text: "1600" },
      confidence: 0.9
    };
    assert.strictEqual(verifyFacts(factsIssues, now).needs_paper_check, true);

    // Low confidence
    const factsConf = {
      transcription: "Total 1500",
      amount_due: { value: 1500, source_text: "1500" },
      confidence: 0.6
    };
    assert.strictEqual(verifyFacts(factsConf, now).needs_paper_check, true);

    // Unclear parts
    const factsUnclear = {
      transcription: "Total 1500",
      amount_due: { value: 1500, source_text: "1500" },
      unclear_parts: ["some smudge"],
      confidence: 0.9
    };
    assert.strictEqual(verifyFacts(factsUnclear, now).needs_paper_check, true);
  });
});
