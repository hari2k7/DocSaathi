const express = require('express');
const cors = require('cors');
require('dotenv').config();

const {
  checkHealth,
  warmupModel,
  analyzeImage,
  streamExplanation,
  streamQA
} = require('./ollama');
const { verifyExtractedFacts } = require('./checks');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and support large JSON payloads for base64 document images
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

/**
 * Health Check: Verifies backend and local Ollama instance
 */
app.get('/api/health', async (req, res) => {
  const ollamaStatus = await checkHealth();
  res.json({
    status: 'ok',
    service: 'DocSaathi Backend',
    ollama: ollamaStatus
  });
});

/**
 * Pass 1: Analyze Document (Image -> Ollama Vision -> Fact Verification)
 */
app.post('/api/analyze', async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Image data (base64) is required.' });
  }

  try {
    console.log('[API] Analyzing document with Ollama Vision...');
    const startTime = Date.now();

    // 1. Ollama Pass 1: Extract transcription and facts
    const rawFacts = await analyzeImage(image);

    // 2. Code Verification: Fact checks and date calculations
    const verifiedFacts = verifyExtractedFacts(rawFacts);

    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[API] Document analyzed and verified in ${elapsedSeconds}s`);

    res.json({
      success: true,
      data: verifiedFacts,
      processingTimeSeconds: Number(elapsedSeconds)
    });
  } catch (err) {
    console.error('[API] Error in /api/analyze:', err.message);
    res.status(500).json({
      error: 'Failed to analyze document',
      details: err.message
    });
  }
});

/**
 * Pass 2: Stream Explanation in chosen language via Server-Sent Events (SSE)
 */
app.post('/api/explain', async (req, res) => {
  const { facts, language = 'Tamil', mode = 'explain' } = req.body;

  if (!facts) {
    return res.status(400).json({ error: 'Verified facts payload is required.' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    console.log(`[API] Streaming ${mode} in ${language}...`);

    await streamExplanation(facts, language, mode, (token) => {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[API] Error in /api/explain:', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

/**
 * Pass 3: Grounded Q&A against document transcription via SSE
 */
app.post('/api/ask', async (req, res) => {
  const { transcription, question, language = 'English' } = req.body;

  if (!transcription || !question) {
    return res.status(400).json({ error: 'Transcription and question are required.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    console.log(`[API] Answering question: "${question}" in ${language}...`);

    await streamQA(transcription, question, language, (token) => {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[API] Error in /api/ask:', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'DocSaathi Backend API is running.',
    endpoints: ['/api/health', '/api/analyze', '/api/explain', '/api/ask']
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  DocSaathi Server listening on port ${PORT}   `);
  console.log(`  Ollama endpoint: ${process.env.OLLAMA_URL || 'http://127.0.0.1:11434'}`);
  console.log(`===============================================`);

  // Non-blocking model warm-up
  warmupModel().catch(err => console.warn('[Warmup] Warning:', err.message));
});
