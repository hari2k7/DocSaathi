const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const reminderRoute = require('../routes/reminder');

test('reminder route', async (t) => {
  const app = express();
  app.use(express.json());
  app.use('/api/reminder', reminderRoute);
  
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/reminder`;

  await t.test('invalid title', async () => {
    const res = await fetch(baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ due_date: '2026-10-10' }) });
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.error, 'invalid_title');
  });

  await t.test('invalid date', async () => {
    const res = await fetch(baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'T', due_date: '2026-13-10' }) });
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.error, 'invalid_date');
  });

  await t.test('valid', async () => {
    const res = await fetch(baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'T', due_date: '2026-10-10' }) });
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/calendar'));
    const text = await res.text();
    assert.ok(text.includes('BEGIN:VCALENDAR'));
  });

  server.close();
});
