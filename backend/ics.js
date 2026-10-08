function escapeICS(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
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

  return lines.join('\r\n') + '\r\n';
}

module.exports = { buildICS, escapeICS };
