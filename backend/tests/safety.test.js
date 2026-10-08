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

test('scamRuleHits avoids false positives on genuine bills', async (t) => {
  await t.test('PIN code on an address is not a credential request', () => {
    assert.deepStrictEqual(scamRuleHits('Door 42, Gandhipuram, Coimbatore - PIN code 641012'), []);
    assert.deepStrictEqual(scamRuleHits('Pincode: 641012'), []);
  });
  await t.test('words that merely contain a keyword do not fire', () => {
    assert.deepStrictEqual(scamRuleHits('Free shipping, spinning mills, wonderful opinion'), []);
  });
  await t.test('a real request for a PIN still fires', () => {
    assert.ok(scamRuleHits('Please share your ATM PIN to continue').includes('requests_credential'));
  });
  await t.test('t.co only matches the short link, not ordinary domains', () => {
    assert.ok(!scamRuleHits('visit https://www.net.com/pay').includes('short_link'));
    assert.ok(scamRuleHits('click https://t.co/abc123').includes('short_link'));
  });
});
