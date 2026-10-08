const { test } = require('node:test');
const assert = require('node:assert');
const { buildFactsForModel } = require('../routes/explain');

test('buildFactsForModel', async (t) => {
  await t.test('builds minimal bundle', () => {
    const facts = {
      doc_type: 'tax_notice', sender: 'Gov', amount_due: { value: 100 },
      due_date: { value: '2026-01-01' },
      required_actions: [{ action: 'Pay' }], penalties: [{ description: 'Late fee' }],
      ids: [{ label: 'PAN', value: '123' }], transcription: 'ignored'
    };
    const verification = { due_date: { days_left: 5, status: 'upcoming' }, needs_paper_check: true };
    const res = buildFactsForModel(facts, verification);
    assert.deepStrictEqual(res, {
      doc_type: 'tax_notice', sender: 'Gov', amount_due_inr: 100, due_date: '2026-01-01',
      days_left: 5, status: 'upcoming', required_actions: ['Pay'], penalties: ['Late fee'],
      reference_ids: ['PAN: 123'], needs_paper_check: true
    });
    assert.ok(res.transcription === undefined);
  });
});
