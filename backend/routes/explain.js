const express = require('express');
const { chatStream } = require('../ollama');
const { explainSystem, EXPLAIN_MODES } = require('../prompts');
const { languageName } = require('../config');
const { openSSE } = require('../sse');

const router = express.Router();

const MAX_TRANSCRIPTION_CHARS = 20000;

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

router.post('/', async (req, res) => {
  const { language, facts, verification, transcription, mode = 'explain' } = req.body || {};

  const langName = languageName(language);
  if (!langName) {
    return res.status(400).json({ error: 'bad_request' });
  }
  if (!EXPLAIN_MODES.includes(mode)) {
    return res.status(400).json({ error: 'bad_request' });
  }

  let userContent;
  if (mode === 'translate') {
    // Verbatim translation works on the document text itself
    if (typeof transcription !== 'string' || !transcription.trim() || transcription.length > MAX_TRANSCRIPTION_CHARS) {
      return res.status(400).json({ error: 'bad_request' });
    }
    userContent = transcription;
  } else {
    if (!facts || typeof facts !== 'object' || !verification || typeof verification !== 'object') {
      return res.status(400).json({ error: 'bad_request' });
    }
    userContent = JSON.stringify(buildFactsForModel(facts, verification));
  }

  const sse = openSSE(res);
  const messages = [
    { role: 'system', content: explainSystem(langName, mode) },
    { role: 'user', content: userContent }
  ];

  try {
    const stream = chatStream({ messages, timeoutMs: 120000, signal: sse.signal });
    for await (const chunk of stream) {
      if (sse.signal.aborted) break;
      sse.send('token', chunk);
    }
    if (!sse.signal.aborted) {
      sse.send('done', {});
      sse.end();
    }
  } catch (err) {
    if (!sse.signal.aborted) {
      sse.send('error', err.code || 'internal_error');
      sse.end();
    }
  }
});

module.exports = router;
module.exports.buildFactsForModel = buildFactsForModel;
