const crypto = require('crypto');

function escapeICS(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// RFC 5545: lines longer than 75 octets must be folded (CRLF + one space).
// Never split inside a multi-byte UTF-8 character (Tamil/Hindi text is 3 bytes per letter).
function foldLine(line) {
  if (Buffer.byteLength(line, 'utf8') <= 75) return line;
  const parts = [];
  let current = '';
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const size = Buffer.byteLength(ch, 'utf8');
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
      limit = 74; // continuation lines start with a 1-octet space
    }
    current += ch;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

function buildICS({ title, date, notes }) {
  if (!title || !date) {
    throw new Error('title and date are required');
  }
  const dt = date.replace(/-/g, '');
  
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DocSaathi//Backend//EN',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}@docsaathi`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.[0-9]+Z/, 'Z')}`,
    `DTSTART;VALUE=DATE:${dt}`,
    `SUMMARY:${escapeICS(title)}`
  ];

  if (notes) {
    lines.push(`DESCRIPTION:${escapeICS(notes)}`);
  }

  lines.push(
    'BEGIN:VALARM',
    'TRIGGER:-P3D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  );

  return lines.map(foldLine).join('\r\n') + '\r\n';
}

module.exports = { buildICS, escapeICS, foldLine };
