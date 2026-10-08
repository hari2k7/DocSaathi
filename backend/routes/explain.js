const express = require('express');
const { chatStream } = require('../ollama');
const { explainSystem } = require('../prompts');

const router = express.Router();

function buildFactsForModel(facts, verification) {
  if (!facts) return {};
  const vDue = verification?.due_date || {};
  return {
    doc_type: facts.doc_type,
    sender: facts.sender,
    amount_due_inr: facts.amount_due?.value,
    due_date: facts.due_date?.value,
    days_left: vDue.days_left,
    status: vDue.status,
    required_actions: (facts.required_actions || []).map(a => a.action),
    penalties: (facts.penalties || []).map(p => p.description),
    reference_ids: (facts.ids || []).map(i => `${i.label}: ${i.value}`),
    needs_paper_check: verification?.needs_paper_check || false
  };
}

router.post('/', async (req, res, next) => {
  const { language, facts, verification } = req.body;
  if (!['ta', 'hi', 'en'].includes(language)) {
    return res.status(400).json({ error: 'bad_request' });
  }
  if (!facts || !verification) {
    return res.status(400).json({ error: 'bad_request' });
  }

  const { openSSE } = require('../sse');
  const sse = openSSE(res);

  const controller = new AbortController();
  req.on('close', () => {
    controller.abort();
  });

  const minimalFacts = buildFactsForModel(facts, verification);
  const messages = [
    { role: 'system', content: explainSystem(language) },
    { role: 'user', content: JSON.stringify(minimalFacts) }
  ];

  try {
    const stream = chatStream({ messages, timeoutMs: 120000 });
    for await (const chunk of stream) {
      if (controller.signal.aborted) break;
      sse.send('token', chunk);
    }
    if (!controller.signal.aborted) {
      sse.send('done', {});
      sse.end();
    }
  } catch (err) {
    if (!controller.signal.aborted) {
      sse.send('error', err.code || 'internal_error');
      sse.end();
    }
  }
});

module.exports = router;
module.exports.buildFactsForModel = buildFactsForModel;
