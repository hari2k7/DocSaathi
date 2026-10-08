const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const { health, warmUp } = require('./ollama');

const app = express();

app.use(cors({
  origin: [/^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/]
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

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
  const code = err.code || 'internal_error';
  const status = err.status || 500;
  console.error(`[Error] ${code}: ${err.message}`);
  res.status(status).json({ error: code });
});

app.listen(config.port, '127.0.0.1', () => {
  console.log(`Server listening on http://127.0.0.1:${config.port}`);
  console.log(`Model: ${config.model}`);
  warmUp();
});
