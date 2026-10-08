require('dotenv').config();

function validateOllamaHost(url) {
  try {
    const parsed = new URL(url);
    if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(parsed.hostname)) {
      throw new Error(`OLLAMA_HOST must be a local address, got ${parsed.hostname}`);
    }
    return true;
  } catch (err) {
    throw new Error(`Invalid OLLAMA_HOST: ${err.message}`);
  }
}

const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
validateOllamaHost(ollamaHost);

const config = {
  port: process.env.PORT || 3001,
  ollamaHost: ollamaHost,
  model: process.env.MODEL || 'gemma4:latest',
  keepAlive: '30m',
  maxImageBytes: 8 * 1024 * 1024,
  languageMap: {
    ta: 'Tamil',
    hi: 'Hindi',
    en: 'simple English',
    ml: 'Malayalam',
    te: 'Telugu',
    kn: 'Kannada',
    bn: 'Bengali',
    mr: 'Marathi',
    gu: 'Gujarati'
  }
};

// Returns the language name used in prompts for a code like 'ta', or null if unsupported
function languageName(code) {
  return typeof code === 'string' && Object.hasOwn(config.languageMap, code)
    ? config.languageMap[code]
    : null;
}

module.exports = { validateOllamaHost, languageName, config };
