const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const { health, warmUp } = require('./ollama');

// Port configured via .env (default 3001)
const app = express();
const analyzeRoute = require('./routes/analyze');
const explainRoute = require('./routes/explain');
const askRoute = require('./routes/ask');
const safetyRoute = require('./routes/safety');
const reminderRoute = require('./routes/reminder');

app.use(cors({
  origin: [/^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/]
}));

app.use(express.json({ limit: '11mb' }));
app.use(express.urlencoded({ limit: '11mb', extended: true }));

app.use('/api/analyze', analyzeRoute);
app.use('/api/explain', explainRoute);
app.use('/api/ask', askRoute);
app.use('/api', safetyRoute); // Mounts /api/redact and /api/scam-check
app.use('/api/reminder', reminderRoute);

app.get('/api/health', async (req, res, next) => {
  try {
    const status = await health();
    res.json(status);
  } catch (err) {
    next(err);
  }
});

app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'bad_json' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'payload_too_large' });
  }

  const code = err.code || 'internal_error';
  const status = err.status || 500;
  // Log message only, no stack traces
  console.error(`[Error] ${code}`);
  res.status(status).json({ error: code });
});

if (require.main === module) {
  app.listen(config.port, '127.0.0.1', () => {
    console.log(`Server listening on http://127.0.0.1:${config.port}`);
    console.log(`Model: ${config.model}`);
    warmUp();
  });
}

module.exports = app;
