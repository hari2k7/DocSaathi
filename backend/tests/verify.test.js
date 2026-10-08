const test = require('node:test');
const assert = require('node:assert');
const { locate } = require('../verify.js');

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
