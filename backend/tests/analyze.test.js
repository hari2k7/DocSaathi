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

  server.close();
});
