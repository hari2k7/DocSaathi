/**
 * Ollama Client for DocSaathi
 * Direct HTTP connection using Node.js native fetch (no SDK required)
 */

const { PASS_1_SCHEMA, PASS_1_SYSTEM_PROMPT, getPass2Prompt, getQAPrompt } = require('./prompts');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.MODEL || 'gemma4:latest';

/**
 * Strips data URI header if present to ensure raw base64 string
 */
function cleanBase64Image(dataString) {
  if (!dataString) return '';
  return dataString.replace(/^data:image\/\w+;base64,/, '').trim();
}

/**
 * Extracts and parses JSON from model response safely
 */
function parseModelJson(content) {
  if (!content) throw new Error('Empty response from model');
  
  // Try direct parse first
  try {
    return JSON.parse(content);
  } catch {
    // If wrapped in markdown code fence: ```json ... ```
    const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
    // Attempt extracting between first { and last }
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(content.substring(firstBrace, lastBrace + 1));
    }
    throw new Error('Could not parse structured JSON from model response: ' + content.slice(0, 100));
  }
}

/**
 * Health check: Tests if Ollama is accessible and lists available models
 */
async function checkHealth() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { method: 'GET' });
    if (!res.ok) {
      return { status: 'error', message: `Ollama returned HTTP ${res.status}` };
    }
    const data = await res.json();
    const availableModels = (data.models || []).map(m => m.name);
    const hasTargetModel = availableModels.some(m => m.startsWith(DEFAULT_MODEL.split(':')[0]));

    return {
      status: 'ok',
      url: OLLAMA_URL,
      configuredModel: DEFAULT_MODEL,
      modelFound: hasTargetModel,
      availableModels
    };
  } catch (err) {
    return {
      status: 'offline',
      url: OLLAMA_URL,
      message: err.message,
      hint: 'Make sure Ollama is running and OLLAMA_URL is set to http://127.0.0.1:11434'
    };
  }
}

/**
 * Model warmup: Pre-loads the model weights into RAM/VRAM with 30m keep-alive
 */
async function warmupModel() {
  try {
    console.log(`[Ollama] Warming up model '${DEFAULT_MODEL}'...`);
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt: 'ready',
        keep_alive: '30m',
        stream: false
      })
    });
    if (res.ok) {
      console.log(`[Ollama] Model '${DEFAULT_MODEL}' is warm and ready.`);
      return true;
    }
  } catch (err) {
    console.warn(`[Ollama] Warmup ping skipped or failed: ${err.message}`);
  }
  return false;
}

/**
 * Pass 1: Analyzes image, extracts transcription and facts as JSON
 */
async function analyzeImage(base64Image) {
  const cleanImage = cleanBase64Image(base64Image);
  if (!cleanImage) {
    throw new Error('Invalid or missing image payload');
  }

  const payload = {
    model: DEFAULT_MODEL,
    stream: false,
    format: 'json',
    options: {
      temperature: 0,
      num_ctx: 8192,
      keep_alive: '30m'
    },
    messages: [
      {
        role: 'system',
        content: PASS_1_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: 'Transcribe this document verbatim and extract all key facts into JSON.',
        images: [cleanImage]
      }
    ]
  };

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama chat failed with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.message?.content || '';
  return parseModelJson(rawContent);
}

/**
 * Pass 2: Stream explanation in chosen language and mode
 * mode: 'explain' | 'summarize' | 'translate'
 * onChunk(token) is called as each token arrives
 */
async function streamExplanation(verifiedFacts, language = 'Tamil', mode = 'explain', onChunk) {
  const prompt = getPass2Prompt(verifiedFacts, language, mode);

  const payload = {
    model: DEFAULT_MODEL,
    stream: true,
    options: {
      temperature: 0.3,
      num_ctx: 8192,
      keep_alive: '30m'
    },
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama stream failed with status ${response.status}: ${errorText}`);
  }

  // Read response stream line-by-line
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep remainder

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.message?.content) {
          onChunk(parsed.message.content);
        }
      } catch (err) {
        console.warn('[Ollama Stream] Non-JSON line:', line);
      }
    }
  }

  if (buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer);
      if (parsed.message?.content) {
        onChunk(parsed.message.content);
      }
    } catch {}
  }
}

/**
 * Pass 3: Stream Q&A answer grounded in document transcription
 */
async function streamQA(transcription, question, language = 'English', onChunk) {
  const prompt = getQAPrompt(transcription, question, language);

  const payload = {
    model: DEFAULT_MODEL,
    stream: true,
    options: {
      temperature: 0.3,
      num_ctx: 8192,
      keep_alive: '30m'
    },
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama Q&A failed with status ${response.status}: ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.message?.content) {
          onChunk(parsed.message.content);
        }
      } catch {}
    }
  }

  if (buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer);
      if (parsed.message?.content) {
        onChunk(parsed.message.content);
      }
    } catch {}
  }
}

module.exports = {
  checkHealth,
  warmupModel,
  analyzeImage,
  streamExplanation,
  streamQA
};
