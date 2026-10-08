const test = require('node:test');
const assert = require('node:assert');
const { locate, parseISODate, daysLeft, verifyAmount } = require('../verify.js');

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
