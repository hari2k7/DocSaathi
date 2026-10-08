/**
 * API service for DocSaathi backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Check health status of backend & local Ollama instance
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
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
 * Send image (base64) for analysis (Pass 1: Vision Extraction + Code Verification)
 */
export async function analyzeDocument(base64Image) {
  const res = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || data.details || 'Document analysis failed');
  }

  return data;
}

/**
 * Stream explanation in chosen language and mode via SSE (Pass 2)
 */
export async function streamExplanation(facts, language, mode, onChunk, onError, onComplete) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facts, language, mode })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed === 'data: [DONE]') {
          if (onComplete) onComplete();
          return;
        }
        if (trimmed.startsWith('data: ')) {
          try {
            const jsonStr = trimmed.slice(6);
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) {
              if (onError) onError(parsed.error);
              return;
            }
            if (parsed.token) {
              onChunk(parsed.token);
            }
          } catch (e) {
            console.warn('[SSE Explain Parse Error]', e, trimmed);
          }
        }
      }
    }

    if (onComplete) onComplete();
  } catch (err) {
    if (onError) onError(err.message || 'Streaming failed');
  }
}

/**
 * Stream Q&A response grounded in transcription via SSE (Pass 3)
 */
export async function streamQA(transcription, question, language, onChunk, onError, onComplete) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcription, question, language })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed === 'data: [DONE]') {
          if (onComplete) onComplete();
          return;
        }
        if (trimmed.startsWith('data: ')) {
          try {
            const jsonStr = trimmed.slice(6);
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) {
              if (onError) onError(parsed.error);
              return;
            }
            if (parsed.token) {
              onChunk(parsed.token);
            }
          } catch (e) {
            console.warn('[SSE QA Parse Error]', e, trimmed);
          }
        }
      }
    }

    if (onComplete) onComplete();
  } catch (err) {
    if (onError) onError(err.message || 'QA streaming failed');
  }
}
