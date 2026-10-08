const express = require('express');
const { chat, OllamaError } = require('../ollama');
const { config } = require('../config');
const { analyzeSchema } = require('../schema');
const { ANALYZE_SYSTEM } = require('../prompts');
const { verifyFacts } = require('../verify');

const router = express.Router();

function cleanBase64(str) {
  return str.replace(/^data:image\/\w+;base64,/, '').trim();
}

function parseModelJson(content) {
  try {
    return JSON.parse(content);
  } catch (err) {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {}
    }
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(content.substring(firstBrace, lastBrace + 1));
      } catch (e) {}
    }
    throw new Error('Could not parse JSON');
  }
}

async function tryOllamaAnalyze(base64Image, useFormat) {
  const messages = [
    { role: 'system', content: ANALYZE_SYSTEM },
    { role: 'user', content: 'Transcribe this document and extract facts.', images: [base64Image] }
  ];
  const format = useFormat ? analyzeSchema : undefined;
  
  if (!useFormat) {
    messages[0].content += '\n\nRESPOND ONLY WITH VALID JSON adhering to the specified structure.';
  }
  
  const content = await chat({ messages, format, timeoutMs: 180000 });
  if (!content) throw new Error('Empty response from model');
  return parseModelJson(content);
}

router.post('/', async (req, res, next) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'invalid_image' });
    }

    const cleanImg = cleanBase64(image);
    
    // Check base64 format basic regex
    if (!/^[A-Za-z0-9+/=]+$/.test(cleanImg)) {
      return res.status(400).json({ error: 'invalid_image' });
    }

    // Check size limit: rough size of base64 = length * 3/4
    const estimatedBytes = (cleanImg.length * 3) / 4;
    if (estimatedBytes > config.maxImageBytes) {
      return res.status(413).json({ error: 'image_too_large' });
    }

    let parsedResult;
    try {
      // First attempt with structured output
      parsedResult = await tryOllamaAnalyze(cleanImg, true);
    } catch (err) {
      // Retry once without strict format in case model choked on image + format
      if (err instanceof OllamaError) throw err;
      try {
        parsedResult = await tryOllamaAnalyze(cleanImg, false);
      } catch (retryErr) {
        if (retryErr instanceof OllamaError) throw retryErr;
        return res.status(502).json({ error: 'model_returned_invalid_json' });
      }
    }

    const facts = parsedResult;
    const verification = verifyFacts(facts);
    res.json({ success: true, facts, verification });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
