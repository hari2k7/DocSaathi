/**
 * API service for DocSaathi backend communication.
 * Request/response shapes follow backend/API.md.
 */

import { prepareImageForUpload } from './image';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const BACKEND_DOWN =
  'Cannot reach the DocSaathi backend. Make sure it is running (cd backend && npm start).';

const ERROR_MESSAGES = {
  invalid_image: 'That file could not be read as an image. Please try a clear PNG or JPG.',
  image_too_large: 'The image is too large. Please use a smaller photo.',
  payload_too_large: 'The image is too large. Please use a smaller photo.',
  model_returned_invalid_json: 'The AI model could not read this document. Please try a clearer photo.',
  ollama_unreachable: 'Cannot reach Ollama. Make sure Ollama is running on this computer.',
  ollama_timeout: 'The model took too long to respond. Please try again.',
  ollama_error: 'Ollama returned an error. Check that the model is installed.',
  bad_request: 'The request was not valid. Please try again.',
  bad_json: 'The request was not valid. Please try again.',
  internal_error: 'Something went wrong on the server. Please try again.'
};

function friendlyError(code) {
  return ERROR_MESSAGES[code] || `Server error: ${code}`;
}

// Turns a failed (non-2xx) response into a readable message
async function errorFromResponse(res) {
  let code = null;
  try {
    code = (await res.json()).error;
  } catch {
    // body was not JSON
  }
  if (code) return friendlyError(code);
  // The dev proxy answers 5xx with an empty body when nothing is listening on the backend port
  return res.status >= 500 ? BACKEND_DOWN : `Server error: HTTP ${res.status}`;
}

/**
 * Check health status of backend & local Ollama instance.
 * Backend returns { ollama, model, modelReady, installed }; the header expects { status, ollama: { status, ... } }.
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const health = await res.json();

    let ollamaStatus = 'offline';
    let message = 'Ollama is not running on this computer.';
    if (health.ollama && health.modelReady) {
      ollamaStatus = 'ok';
      message = 'Ollama and the model are ready.';
    } else if (health.ollama) {
      ollamaStatus = 'model_missing';
      message = `Ollama is running but the model "${health.model}" is not installed.`;
    }

    return {
      status: 'ok',
      service: 'DocSaathi Backend',
      ollama: {
        status: ollamaStatus,
        configuredModel: health.model,
        installed: health.installed || [],
        message
      }
    };
  } catch (err) {
    return {
      status: 'offline',
      service: 'DocSaathi Backend',
      ollama: {
        status: 'offline',
        message: err.message || 'Failed to connect to backend server'
      }
    };
  }
}

/**
 * Convert the backend's { facts, verification, transcription } into the flat shape the
 * UI components read. The untouched backend payload stays available as `raw`.
 */
export function toAnalysis({ facts = {}, verification = {}, transcription = '' }) {
  const issues = verification.issues || [];
  const messages = verification.messages || [];
  // issues[i] and messages[i] describe the same problem
  const warningsFor = (prefix) =>
    issues.map((code, i) => (code.startsWith(prefix) ? messages[i] : null)).filter(Boolean);

  const amountWarnings = warningsFor('amount_');
  const dateWarnings = warningsFor('date_');
  const dueInfo = verification.due_date || {};

  return {
    ...facts,
    transcription,
    sender: facts.sender ? { value: facts.sender } : null,
    amount_due: facts.amount_due
      ? {
          ...facts.amount_due,
          is_verified: amountWarnings.length === 0,
          warning: amountWarnings.join(' ') || null
        }
      : null,
    due_date: facts.due_date
      ? {
          ...facts.due_date,
          days_left: dueInfo.days_left ?? null,
          status: dueInfo.status ?? null,
          is_past: dueInfo.status === 'overdue',
          warning: dateWarnings.join(' ') || null
        }
      : null,
    reference_ids: (facts.ids || []).map(({ label, value }) => ({ label, value })),
    penalties: (facts.penalties || []).map((p) => ({ ...p, text: p.description })),
    needs_paper_check: Boolean(verification.needs_paper_check),
    verification_messages: messages,
    raw: { facts: { ...facts }, verification }
  };
}

/**
 * Send image (data URL) for analysis (Pass 1: Vision Extraction + Code Verification)
 */
export async function analyzeDocument(image, { signal } = {}) {
  const started = performance.now();
  const prepared = await prepareImageForUpload(image);

  let res;
  try {
    res = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: prepared }),
      signal
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error(BACKEND_DOWN);
  }

  if (!res.ok) throw new Error(await errorFromResponse(res));

  const body = await res.json();
  if (!body.success) throw new Error(friendlyError(body.error));

  return {
    success: true,
    data: toAnalysis(body),
    processingTimeSeconds: Number(((performance.now() - started) / 1000).toFixed(1))
  };
}

/**
 * POST to an SSE endpoint and dispatch its events.
 * Backend events: `token` (JSON string), `source` (ask only), `done`, `error` (JSON error code).
 * Aborting via `signal` stops everything silently - no callbacks fire.
 */
async function streamSSE(path, body, { onToken, onSource, onError, onDone }, signal) {
  let finished = false;
  const finish = (callback, ...args) => {
    if (finished || signal?.aborted) return;
    finished = true;
    if (callback) callback(...args);
  };

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal
    });

    if (!res.ok) throw new Error(await errorFromResponse(res));

    const dispatch = (block) => {
      let event = 'message';
      const dataLines = [];
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
      }
      if (dataLines.length === 0 || signal?.aborted) return;

      let data;
      try {
        data = JSON.parse(dataLines.join('\n'));
      } catch (e) {
        console.warn('[SSE parse error]', e, block);
        return;
      }

      if (event === 'token') onToken?.(data);
      else if (event === 'source') onSource?.(data);
      else if (event === 'error') finish(onError, friendlyError(data));
      else if (event === 'done') finish(onDone);
    };

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';
      blocks.forEach(dispatch);
    }
    buffer += decoder.decode();
    if (buffer.trim()) dispatch(buffer);

    // The server always ends a stream with `done` or `error`; anything else means it was cut off
    finish(onError, 'The connection to the server was lost before the response finished.');
  } catch (err) {
    if (err.name === 'AbortError') return;
    const offline = err instanceof TypeError; // fetch() itself failed
    finish(onError, offline ? BACKEND_DOWN : err.message || 'Streaming failed');
  }
}

/**
 * Stream explanation in chosen language and mode via SSE (Pass 2)
 * @param analysis  result of analyzeDocument().data
 * @param language  backend language code: ta, hi, en, ml, te, kn, bn, mr, gu
 * @param mode      explain | summarize | translate
 */
export function streamExplanation({ analysis, language, mode, signal }, onChunk, onError, onComplete) {
  return streamSSE(
    '/api/explain',
    {
      language,
      mode,
      facts: analysis.raw.facts,
      verification: analysis.raw.verification,
      transcription: analysis.transcription
    },
    { onToken: onChunk, onError, onDone: onComplete },
    signal
  );
}

/**
 * Stream Q&A response grounded in the transcription via SSE (Pass 3)
 * @param history  previous turns as [{ role: 'user' | 'assistant', content }]
 */
export function streamQA(
  { analysis, question, language, history = [], signal },
  onChunk,
  onError,
  onComplete,
  onSource
) {
  return streamSSE(
    '/api/ask',
    { transcription: analysis.transcription, facts: analysis.raw.facts, question, language, history },
    { onToken: onChunk, onSource, onError, onDone: onComplete },
    signal
  );
}
