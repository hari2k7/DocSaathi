const { test } = require('node:test');
const assert = require('node:assert');
const { extractSourceQuote } = require('../verify');

test('extractSourceQuote', async (t) => {
  await t.test('present', () => {
    const res = extractSourceQuote('Answer.\nSOURCE: "my quote"');
    assert.strictEqual(res.answer, 'Answer.');
    assert.strictEqual(res.quote, 'my quote');
  });
  await t.test('absent', () => {
    const res = extractSourceQuote('Answer only.');
    assert.strictEqual(res.answer, 'Answer only.');
    assert.strictEqual(res.quote, null);
  });
  await t.test('curly quotes', () => {
    const res = extractSourceQuote('Answer.\nSOURCE: “curly quote”');
    assert.strictEqual(res.answer, 'Answer.');
    assert.strictEqual(res.quote, 'curly quote');
  });
  await t.test('quote with punctuation', () => {
    const res = extractSourceQuote('Answer.\nSOURCE: "hello, world!"');
    assert.strictEqual(res.quote, 'hello, world!');
  });
  await t.test('mid-text', () => {
    const res = extractSourceQuote('Answer\nSOURCE: "not end"\nMore text');
    assert.strictEqual(res.quote, null);
  });
  await t.test('empty', () => {
    const res = extractSourceQuote('');
    assert.strictEqual(res.quote, null);
  });
});
