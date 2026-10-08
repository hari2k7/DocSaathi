const express = require('express');
const { chatStream } = require('../ollama');
const { askSystem } = require('../prompts');
const { extractSourceQuote, locate } = require('../verify');

const router = express.Router();

router.post('/', async (req, res, next) => {
  const { transcription, facts, question, language, history } = req.body;
  if (!transcription || typeof transcription !== 'string') return res.status(400).json({ error: 'bad_request' });
  if (!question || typeof question !== 'string') return res.status(400).json({ error: 'bad_request' });
  if (!['ta', 'hi', 'en'].includes(language)) return res.status(400).json({ error: 'bad_request' });

  let safeHistory = [];
  if (Array.isArray(history)) {
    safeHistory = history
      .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-6);
  }

  const cleanQuestion = question.trim().substring(0, 1000);

  const { openSSE } = require('../sse');
  const sse = openSSE(res);

  const controller = new AbortController();
  req.on('close', () => controller.abort());

  const contextStr = `TRANSCRIPTION (authoritative):\n${transcription}\n\nFACTS (possibly wrong):\n${JSON.stringify(facts || {})}`;
  const messages = [
    { role: 'system', content: askSystem(language) },
    { role: 'user', content: contextStr },
    ...safeHistory,
    { role: 'user', content: cleanQuestion }
  ];

  try {
    const stream = chatStream({ messages, timeoutMs: 120000 });
    let fullAnswer = '';

    for await (const chunk of stream) {
      if (controller.signal.aborted) break;
      fullAnswer += chunk;
      sse.send('token', chunk);
    }

    if (!controller.signal.aborted) {
      const { quote } = extractSourceQuote(fullAnswer);
      let span = null;
      let verified = false;

      if (quote) {
        const loc = locate(transcription, quote);
        if (loc) {
          span = loc;
          verified = true;
        }
      }

      sse.send('source', { quote, span, verified });
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
