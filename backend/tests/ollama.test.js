const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const { chat, OllamaError } = require('../ollama');
const { config } = require('../config');

test('ollama timeout', async (t) => {
  const app = express();
  app.post('/api/chat', (req, res) => {
    // delay to trigger timeout
    setTimeout(() => {
      res.json({ message: { content: 'hello' } });
    }, 200);
  });
  
  const server = app.listen(0);
  const port = server.address().port;
  
  const originalHost = config.ollamaHost;
  config.ollamaHost = `http://127.0.0.1:${port}`;
  
  try {
    await assert.rejects(
      async () => {
        await chat({ messages: [{ role: 'user', content: 'hi' }], timeoutMs: 50 });
      },
      (err) => {
        assert.ok(err instanceof OllamaError);
        assert.strictEqual(err.code, 'ollama_timeout');
        assert.strictEqual(err.status, 504);
        return true;
      }
    );
  } finally {
    config.ollamaHost = originalHost;
    server.close();
  }
});
