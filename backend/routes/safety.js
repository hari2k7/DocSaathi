const express = require('express');
const { chat } = require('../ollama');
const { SCAM_SYSTEM } = require('../prompts');
const { scamSchema } = require('../schema');
const { findPII, scamRuleHits } = require('../safety');
const { locate } = require('../verify');

const router = express.Router();

router.post('/redact', (req, res) => {
  const { text } = req.body || {};
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'bad_request' });
  const spans = findPII(text);
  res.json({ spans });
});

router.post('/scam-check', async (req, res, next) => {
  try {
    const { transcription } = req.body || {};
    if (!transcription || typeof transcription !== 'string') {
      return res.status(400).json({ error: 'bad_request' });
    }

    const rules = scamRuleHits(transcription);
    let modelResult = null;

    try {
      const content = await chat({
        messages: [
          { role: 'system', content: SCAM_SYSTEM },
          { role: 'user', content: transcription }
        ],
        format: scamSchema,
        timeoutMs: 60000
      });
      modelResult = JSON.parse(content);
    } catch (e) {
      // If model fails, proceed with rules only
    }

    let finalVerdict = 'likely_genuine';
    let reasons = [];

    if (modelResult) {
      finalVerdict = modelResult.verdict;
      for (const r of modelResult.reasons || []) {
        let span = null;
        const loc = locate(transcription, r.source_text);
        if (loc) span = loc;
        reasons.push({ reason: r.reason, source_text: r.source_text, span });
      }
    }

    // Rules can elevate verdict but not lower it
    const strongRules = ['requests_credential', 'mentions_upi', 'short_link', 'lottery'];
    const hasStrong = rules.some(r => strongRules.includes(r));
    
    if (rules.length > 0 && finalVerdict === 'likely_genuine') {
      finalVerdict = 'suspicious';
    }
    if (hasStrong && finalVerdict !== 'likely_scam') {
      finalVerdict = 'suspicious';
    }

    res.json({ verdict: finalVerdict, rule_hits: rules, reasons });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
