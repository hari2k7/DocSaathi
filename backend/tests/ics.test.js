const test = require('node:test');
const assert = require('node:assert');
const { buildICS, escapeICS, foldLine } = require('../ics');

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

test('buildICS() RFC 5545 details', async (t) => {
  const unfold = (s) => s.replace(/\r\n /g, '');

  await t.test('has a UID that differs per event', () => {
    const a = buildICS({ title: 'Bill', date: '2026-10-15' });
    const b = buildICS({ title: 'Bill', date: '2026-10-15' });
    const uid = (ics) => /^UID:(.+)\r$/m.exec(ics)[1];
    assert.match(uid(a), /@docsaathi$/);
    assert.notStrictEqual(uid(a), uid(b));
  });

  await t.test('folds long lines at 75 octets without splitting characters', () => {
    const title = 'மின் கட்டணம் செலுத்த வேண்டும் '.repeat(4);
    const ics = buildICS({ title, date: '2026-10-15', notes: 'x'.repeat(300) });
    for (const line of ics.split('\r\n')) {
      assert.ok(Buffer.byteLength(line, 'utf8') <= 75, `line too long: ${line.length}`);
    }
    assert.ok(unfold(ics).includes('SUMMARY:' + title.replace(/,/g, '\\,')));
    assert.ok(unfold(ics).includes('DESCRIPTION:' + 'x'.repeat(300)));
    assert.ok(!ics.includes('\uFFFD'));
  });

  await t.test('short lines are left alone', () => {
    assert.strictEqual(foldLine('SUMMARY:Pay bill'), 'SUMMARY:Pay bill');
  });
});
