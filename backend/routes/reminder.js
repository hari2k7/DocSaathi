const express = require('express');
const { parseISODate } = require('../verify');
const { buildICS } = require('../ics');

const router = express.Router();

router.post('/', (req, res) => {
  const { title, due_date, notes } = req.body || {};
  if (!title || typeof title !== 'string' || title.length === 0) {
    return res.status(400).json({ error: 'invalid_title' });
  }
  if (title.length > 120) {
    return res.status(400).json({ error: 'title_too_long' });
  }
  if (notes && typeof notes === 'string' && notes.length > 500) {
    return res.status(400).json({ error: 'notes_too_long' });
  }

  const d = parseISODate(due_date);
  if (!d) {
    return res.status(400).json({ error: 'invalid_date' });
  }

  try {
    const icsContent = buildICS({ title, date: due_date, notes });
    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="reminder.ics"'
    });
    res.send(icsContent);
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
