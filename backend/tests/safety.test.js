const { test } = require('node:test');
const assert = require('node:assert');
const { findPII, scamRuleHits } = require('../safety');

test('findPII', async (t) => {
  await t.test('Aadhaar vs account overlap', () => {
    const res = findPII('My aadhaar is 234567890123');
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].type, 'aadhaar');
  });
  await t.test('PAN', () => {
    const res = findPII('ABCDE1234F');
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].type, 'pan');
  });
  await t.test('phone', () => {
    const res1 = findPII('+91 9876543210');
    assert.strictEqual(res1.length, 1);
    assert.strictEqual(res1[0].type, 'phone');

    const res2 = findPII('9876543210');
    assert.strictEqual(res2.length, 1);
    assert.strictEqual(res2[0].type, 'phone');
  });
  await t.test('normal amounts', () => {
    const res = findPII('Pay 1500 on 2026-10-15');
    assert.strictEqual(res.length, 0);
  });
});

test('scamRuleHits', async (t) => {
  await t.test('kyc pressure and otp', () => {
    const hits = scamRuleHits('Your KYC will be blocked, share OTP immediately');
    assert.ok(hits.includes('kyc_pressure'));
    assert.ok(hits.includes('requests_credential'));
    assert.ok(hits.includes('urgency'));
  });
  await t.test('normal bill', () => {
    const hits = scamRuleHits('Electricity bill for Oct 2026. Total: 1500');
    assert.strictEqual(hits.length, 0);
  });
});
