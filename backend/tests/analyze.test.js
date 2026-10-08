const test = require('node:test');
const assert = require('node:assert');
const app = require('../server');
const { config } = require('../config');
const http = require('http');

test('analyze failure rehearsal', async (t) => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/analyze`;

  // 1. Missing image
  await t.test('missing image', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error, 'invalid_image');
  });

  // 2. Corrupt base64
  await t.test('corrupt base64 image', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: 'not-base-64!@#' })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error, 'invalid_image');
  });

  // 3. Payload too large
  await t.test('oversized image', async () => {
    const huge = Buffer.alloc(config.maxImageBytes + 1024).toString('base64');
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: huge })
    });
    assert.strictEqual(res.status, 413);
    const body = await res.json();
    assert.ok(body.error === 'image_too_large' || body.error === 'payload_too_large');
  });

  // 4. Bad JSON payload
  await t.test('bad JSON', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ "image": "base64" ' // malformed
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error, 'bad_json');
  });

  // 5. Success (Mocked Ollama)
  await t.test('success response structure', async () => {
    const mockOllama = require('express')();
    mockOllama.post('/api/chat', (req, res) => {
      res.json({
        message: {
          content: JSON.stringify({
            transcription: 'Mock text',
            doc_type: 'other',
            sender: 'Me',
            document_language: 'en',
            summary_en: 'Mock summary',
            amount_due: { value: 10, source_text: '10' },
            due_date: { value: '2026-10-15', source_text: 'Oct 15' },
            ids: [],
            required_actions: [],
            penalties: [],
            unclear_parts: [],
            confidence: 0.99
          })
        }
      });
    });
    const ollamaServer = require('http').createServer(mockOllama);
    await new Promise(resolve => ollamaServer.listen(0, resolve));
    const ollamaPort = ollamaServer.address().port;
    
    const originalHost = config.ollamaHost;
    config.ollamaHost = `http://127.0.0.1:${ollamaPort}`;

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: 'YWJjZGU=' }) // valid looking base64
    });
    
    config.ollamaHost = originalHost;
    ollamaServer.close();
    
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok('facts' in body);
    assert.ok('verification' in body);
    assert.strictEqual(body.transcription, 'Mock text');
    assert.ok(!('transcription' in body.facts));
  });

  server.close();
});
