const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../server');

test('analyze rejects non-raster images before calling Ollama', async () => {
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const res = await fetch(`${base}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' })
    });
    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(await res.json(), { error: 'invalid_image' });

    const noBody = await fetch(`${base}/api/analyze`, { method: 'POST' });
    assert.strictEqual(noBody.status, 400);
  } finally {
    server.close();
  }
});
