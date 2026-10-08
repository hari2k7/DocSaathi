function openSSE(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.flushHeaders();

  // Aborts when the client goes away before we finished (tab closed, language switched).
  // Listen on `res`, not `req`: `req` emits 'close' as soon as the request body is read.
  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) controller.abort();
  });

  const canWrite = () => !res.writableEnded && !res.destroyed;

  return {
    signal: controller.signal,
    send(event, data) {
      if (canWrite()) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    },
    end() {
      if (canWrite()) res.end();
    }
  };
}

module.exports = { openSSE };
