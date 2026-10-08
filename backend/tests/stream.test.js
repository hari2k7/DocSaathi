const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../server');
const { config } = require('../config');

// Mock Ollama that streams newline-delimited JSON like the real /api/chat
function startMockOllama({ tokens = ['Hello ', 'world'], delay = 1 } = {}) {
  const mock = { payloads: [], clientAborted: false };
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (d) => (raw += d));
    req.on('end', () => {
      mock.payloads.push(JSON.parse(raw));
      res.setHeader('content-type', 'application/x-ndjson');
      let i = 0;
      const timer = setInterval(() => {
        if (i < tokens.length) {
          res.write(JSON.stringify({ message: { content: tokens[i++] }, done: false }) + '\n');
        } else {
          clearInterval(timer);
          res.write(JSON.stringify({ done: true }) + '\n');
          res.end();
        }
      }, delay);
      res.on('close', () => {
        clearInterval(timer);
        if (!res.writableFinished) mock.clientAborted = true;
      });
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, mock, host: `http://127.0.0.1:${server.address().port}` }));
  });
}

function parseSSE(text) {
  return text.split('\n\n').filter((b) => b.trim()).map((block) => ({
    event: /^event: (.*)$/m.exec(block)[1],
    data: JSON.parse(/^data: (.*)$/m.exec(block)[1])
  }));
}

const FACTS = {
  doc_type: 'electricity_bill', sender: 'TANGEDCO',
  amount_due: { value: 1500, source_text: 'Total: 1500' },
  due_date: { value: '2026-10-15', source_text: 'Due 15-10-2026' },
  required_actions: [{ action: 'Pay the bill' }], penalties: [], ids: []
};
const VERIFICATION = { due_date: { days_left: 7, status: 'upcoming' }, needs_paper_check: false };

async function withApp(ollamaOpts, fn) {
  const ollama = await startMockOllama(ollamaOpts);
  const original = config.ollamaHost;
  config.ollamaHost = ollama.host;
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn({ base, mock: ollama.mock });
  } finally {
    config.ollamaHost = original;
    server.closeAllConnections?.();
    server.close();
    ollama.server.closeAllConnections?.();
    ollama.server.close();
  }
}

const post = (base, path, body, init = {}) =>
  fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...init
  });

test('POST /api/explain', async (t) => {
  await t.test('streams token events then done', async () => {
    await withApp({ tokens: ['A ', 'B ', 'C'] }, async ({ base }) => {
      const res = await post(base, '/api/explain', { language: 'ta', facts: FACTS, verification: VERIFICATION });
      assert.strictEqual(res.status, 200);
      assert.match(res.headers.get('content-type'), /text\/event-stream/);
      const events = parseSSE(await res.text());
      assert.deepStrictEqual(events.map((e) => e.event), ['token', 'token', 'token', 'done']);
      assert.strictEqual(events.slice(0, 3).map((e) => e.data).join(''), 'A B C');
    });
  });

  await t.test('prompt names the language, not the code', async () => {
    await withApp({}, async ({ base, mock }) => {
      await (await post(base, '/api/explain', { language: 'ml', facts: FACTS, verification: VERIFICATION })).text();
      const system = mock.payloads[0].messages[0].content;
      assert.match(system, /Write ONLY in Malayalam\./);
      assert.doesNotMatch(system, /in ml\b/);
    });
  });

  await t.test('supports all nine languages', async () => {
    await withApp({}, async ({ base }) => {
      for (const language of ['ta', 'hi', 'en', 'ml', 'te', 'kn', 'bn', 'mr', 'gu']) {
        const res = await post(base, '/api/explain', { language, facts: FACTS, verification: VERIFICATION });
        assert.strictEqual(res.status, 200, language);
        await res.text();
      }
    });
  });

  await t.test('rejects unknown languages, language names and prototype keys', async () => {
    await withApp({}, async ({ base }) => {
      for (const language of ['Tamil', 'xx', 'constructor', '', null, undefined, 5]) {
        const res = await post(base, '/api/explain', { language, facts: FACTS, verification: VERIFICATION });
        assert.strictEqual(res.status, 400, String(language));
        assert.deepStrictEqual(await res.json(), { error: 'bad_request' });
      }
    });
  });

  await t.test('rejects missing facts / verification / unknown mode / missing body', async () => {
    await withApp({}, async ({ base }) => {
      assert.strictEqual((await post(base, '/api/explain', { language: 'ta', verification: VERIFICATION })).status, 400);
      assert.strictEqual((await post(base, '/api/explain', { language: 'ta', facts: FACTS })).status, 400);
      assert.strictEqual((await post(base, '/api/explain', { language: 'ta', facts: FACTS, verification: VERIFICATION, mode: 'nope' })).status, 400);
      assert.strictEqual((await fetch(base + '/api/explain', { method: 'POST' })).status, 400);
    });
  });

  await t.test('summarize mode uses the bullet prompt', async () => {
    await withApp({}, async ({ base, mock }) => {
      await (await post(base, '/api/explain', { language: 'hi', mode: 'summarize', facts: FACTS, verification: VERIFICATION })).text();
      assert.match(mock.payloads[0].messages[0].content, /starting with "- "/);
    });
  });

  await t.test('translate mode sends the transcription and requires it', async () => {
    await withApp({}, async ({ base, mock }) => {
      const bad = await post(base, '/api/explain', { language: 'ta', mode: 'translate' });
      assert.strictEqual(bad.status, 400);

      await (await post(base, '/api/explain', { language: 'ta', mode: 'translate', transcription: 'Total: 1500' })).text();
      const [system, user] = mock.payloads[0].messages;
      assert.match(system.content, /Translate the document text/);
      assert.strictEqual(user.content, 'Total: 1500');
    });
  });

  await t.test('sends an error event when Ollama is unreachable', async () => {
    const original = config.ollamaHost;
    config.ollamaHost = 'http://127.0.0.1:1';
    const server = http.createServer(app);
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    try {
      const res = await post(`http://127.0.0.1:${server.address().port}`, '/api/explain', { language: 'en', facts: FACTS, verification: VERIFICATION });
      const events = parseSSE(await res.text());
      assert.deepStrictEqual(events, [{ event: 'error', data: 'ollama_unreachable' }]);
    } finally {
      config.ollamaHost = original;
      server.close();
    }
  });

  await t.test('stops Ollama when the client disconnects', async () => {
    const tokens = Array.from({ length: 400 }, (_, i) => `t${i} `);
    await withApp({ tokens, delay: 15 }, async ({ base, mock }) => {
      const controller = new AbortController();
      const res = await post(base, '/api/explain', { language: 'ta', facts: FACTS, verification: VERIFICATION }, { signal: controller.signal });
      const reader = res.body.getReader();
      await reader.read(); // first chunk arrived
      controller.abort();
      for (let i = 0; i < 60 && !mock.clientAborted; i++) await new Promise((r) => setTimeout(r, 25));
      assert.ok(mock.clientAborted, 'Ollama request should be cancelled after the browser disconnects');
    });
  });
});

test('POST /api/ask', async (t) => {
  const transcription = 'TANGEDCO BILL\nTotal: 1500\nDue: 15-10-2026';

  await t.test('streams tokens, then a verified source, then done', async () => {
    await withApp({ tokens: ['Pay 1500. ', '\nSOURCE: "Total: 1500"'] }, async ({ base }) => {
      const res = await post(base, '/api/ask', { transcription, question: 'How much?', language: 'en', facts: FACTS });
      const events = parseSSE(await res.text());
      assert.deepStrictEqual(events.map((e) => e.event), ['token', 'token', 'source', 'done']);
      const source = events.find((e) => e.event === 'source').data;
      assert.strictEqual(source.quote, 'Total: 1500');
      assert.strictEqual(source.verified, true);
      assert.deepStrictEqual(transcription.slice(source.span.start, source.span.end), 'Total: 1500');
    });
  });

  await t.test('marks an invented quote as not verified', async () => {
    await withApp({ tokens: ['Answer.\nSOURCE: "Pay 9999 now"'] }, async ({ base }) => {
      const res = await post(base, '/api/ask', { transcription, question: 'How much?', language: 'en' });
      const source = parseSSE(await res.text()).find((e) => e.event === 'source').data;
      assert.strictEqual(source.verified, false);
      assert.strictEqual(source.span, null);
    });
  });

  await t.test('validates input and uses the language name', async () => {
    await withApp({}, async ({ base, mock }) => {
      assert.strictEqual((await post(base, '/api/ask', { transcription, question: 'x', language: 'English' })).status, 400);
      assert.strictEqual((await post(base, '/api/ask', { transcription, question: '   ', language: 'en' })).status, 400);
      assert.strictEqual((await post(base, '/api/ask', { question: 'x', language: 'en' })).status, 400);
      assert.strictEqual((await fetch(base + '/api/ask', { method: 'POST' })).status, 400);

      await (await post(base, '/api/ask', { transcription, question: 'When?', language: 'te' })).text();
      assert.match(mock.payloads[0].messages[0].content, /Answer ONLY in Telugu/);
    });
  });
});
