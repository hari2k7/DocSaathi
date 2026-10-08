const test = require('node:test');
const assert = require('node:assert');
const { validateOllamaHost } = require('../config');

test('validateOllamaHost accepts localhost', () => {
  assert.strictEqual(validateOllamaHost('http://localhost:11434'), true);
});

test('validateOllamaHost accepts 127.0.0.1', () => {
  assert.strictEqual(validateOllamaHost('http://127.0.0.1:11434'), true);
});

test('validateOllamaHost accepts ::1', () => {
  assert.strictEqual(validateOllamaHost('http://[::1]:11434'), true);
});

test('validateOllamaHost rejects remote hosts', () => {
  assert.throws(() => validateOllamaHost('http://example.com:11434'), /OLLAMA_HOST must be a local address/);
});

test('validateOllamaHost rejects LAN addresses', () => {
  assert.throws(() => validateOllamaHost('http://192.168.1.5:11434'), /OLLAMA_HOST must be a local address/);
});

test('validateOllamaHost rejects garbage strings', () => {
  assert.throws(() => validateOllamaHost('garbage'), /Invalid OLLAMA_HOST/);
});
