const test = require('node:test');
const assert = require('node:assert');
const { buildICS, escapeICS } = require('../ics');

test('escapeICS()', (t) => {
  assert.strictEqual(escapeICS('hello, world; test\\newline\n'), 'hello\\, world\\; test\\\\newline\\n');
});

test('buildICS()', async (t) => {
  await t.test('required fields', () => {
    assert.throws(() => buildICS({ title: 'foo' }), /title and date are required/);
    assert.throws(() => buildICS({ date: '2026-10-10' }), /title and date are required/);
  });

  await t.test('date format and basic structure', () => {
    const ics = buildICS({ title: 'Pay bill', date: '2026-10-15', notes: 'Don\'t forget' });
    assert.ok(ics.includes('DTSTART;VALUE=DATE:20261015\r\n'));
    assert.ok(ics.includes('SUMMARY:Pay bill\r\n'));
    assert.ok(ics.includes('DESCRIPTION:Don\'t forget\r\n'));
    assert.ok(ics.includes('TRIGGER:-P3D\r\n'));
    assert.ok(ics.includes('TRIGGER:-P1D\r\n'));
    assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  });
});
