const { config } = require('./config');

class OllamaError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function chat({ messages, format, options, timeoutMs = 120000 }) {
  const payload = {
    model: config.model,
    stream: false,
    keep_alive: config.keepAlive,
    messages: messages,
    options: {
      temperature: 0,
      ...options
    }
  };
  if (format) {
    payload.format = format;
  }

  const signal = AbortSignal.timeout(timeoutMs);

  try {
    const res = await fetch(`${config.ollamaHost}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });

    if (!res.ok) {
      throw new OllamaError('ollama_error', `Ollama returned ${res.status}`, 502);
    }
    
    const data = await res.json();
    return data.message?.content || '';
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new OllamaError('ollama_timeout', 'Ollama request timed out', 504);
    }
    if (err instanceof OllamaError) throw err;
    throw new OllamaError('ollama_unreachable', `Could not connect to Ollama: ${err.message}`, 503);
  }
}

// Streams tokens from Ollama. `timeoutMs` is an idle timeout (time allowed between chunks,
// including the wait for the first token). `signal` lets the caller cancel, e.g. when the
// browser disconnects, so Ollama stops generating.
async function* chatStream({ messages, options, timeoutMs = 120000, signal: externalSignal }) {
  const payload = {
    model: config.model,
    stream: true,
    keep_alive: config.keepAlive,
    messages: messages,
    options: {
      temperature: 0,
      ...options
    }
  };

  const controller = new AbortController();
  let timedOut = false;
  let timer;
  const armTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
  };
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  let reader;
  try {
    armTimer();
    const res = await fetch(`${config.ollamaHost}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!res.ok) {
      throw new OllamaError('ollama_error', `Ollama returned ${res.status}`, 502);
    }

    reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      armTimer();

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep remainder

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            yield parsed.message.content;
          }
          if (parsed.done) {
            return;
          }
        } catch (e) {
          // Ignore parse errors on partial chunks
        }
      }
    }

    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer);
        if (parsed.message?.content) {
          yield parsed.message.content;
        }
      } catch (e) {}
    }
  } catch (err) {
    if (err instanceof OllamaError) throw err;
    if (timedOut || err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new OllamaError('ollama_timeout', 'Ollama request timed out', 504);
    }
    throw new OllamaError('ollama_unreachable', `Could not connect to Ollama: ${err.message}`, 503);
  } finally {
    clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
    if (reader) reader.cancel().catch(() => {});
  }
}

async function health() {
  try {
    const res = await fetch(`${config.ollamaHost}/api/tags`, { method: 'GET' });
    if (!res.ok) {
      return { ollama: true, model: config.model, modelReady: false, installed: [] };
    }
    const data = await res.json();
    const installed = (data.models || []).map(m => m.name);
    const modelReady = installed.includes(config.model) || installed.includes(`${config.model}:latest`);
    
    return {
      ollama: true,
      model: config.model,
      modelReady,
      installed
    };
  } catch (err) {
    return {
      ollama: false,
      model: config.model,
      modelReady: false,
      installed: []
    };
  }
}

async function warmUp() {
  try {
    const res = await fetch(`${config.ollamaHost}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        prompt: 'ready',
        keep_alive: config.keepAlive,
        stream: false
      })
    });
    if (res.ok) {
      console.log(`[Ollama] Model '${config.model}' is warm and ready.`);
    }
  } catch (err) {
    console.warn(`[Ollama] Warmup skipped or failed.`);
  }
}

module.exports = {
  chat,
  chatStream,
  health,
  warmUp,
  OllamaError
};
