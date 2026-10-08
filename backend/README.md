# DocSaathi Backend

The backend of DocSaathi provides a local, private API for reading and analyzing English documents (like bills, notices, and agreements) and returning extracted facts and explanations in plain English, Tamil, Hindi, Malayalam, Telugu, Kannada, Bengali, Marathi or Gujarati. It is powered by a local Ollama model. The backend is designed with privacy and strict fact verification at its core: the model handles language extraction, while deterministic code verifies dates, amounts, and statuses.

## Prerequisites

- **Node.js**: v18 or later
- **Ollama**: Installed and running locally.

## Environment Variables

The backend relies on the following environment variables (defined in a `.env` file):

- `PORT`: Port the server runs on (default: `3001`).
- `OLLAMA_HOST`: Local Ollama API URL (default: `http://127.0.0.1:11434`). Must be localhost or 127.0.0.1.
- `MODEL`: The Ollama model to use (default: whatever `.env.example` sets).

## How to Pull the Model

Before starting, ensure you have pulled the required model in Ollama:

```powershell
ollama pull <MODEL>
```

## Run

To run the backend server:

```powershell
npm install
npm start
```

For development with auto-restart:
```powershell
npm run dev
```

## Test

To run the test suite:
```powershell
npm test
```

## Folder Layout

- `/routes`: Express route handlers (`analyze.js`, `explain.js`, `ask.js`, `safety.js`, `reminder.js`).
- `/scripts`: Developer tools, including `analyze-file.js` to test extraction.
- `/tests`: Unit tests for verification and routes.
- `config.js`: Configuration loader with validation.
- `ollama.js`: Ollama client with error handling, streaming, and timeouts.
- `prompts.js`: The system prompts passed to the model.
- `schema.js`: JSON schema defining the extraction structure.
- `server.js`: The main Express application.
- `sse.js`: Server-Sent Events helper used by the streaming routes.
- `safety.js`: Rule-based PII detection and scam signals.
- `ics.js`: iCalendar (`.ics`) builder for reminders.
- `verify.js`: The deterministic fact verification engine.

## Dev Script

You can test the extraction pipeline locally on an image without using the frontend:

```powershell
node scripts/analyze-file.js <path-to-image>
```

## Gemma Usage (Model vs Code)

DocSaathi strictly separates responsibilities to ensure privacy, reliability, and honesty:
- **Model Jobs**: The specified model handles language reading, extracting key facts from the image, generating explanations, and answering follow-up questions directly from the document.
- **Code Jobs**: Deterministic code handles fact verification. It computes days left, verifies dates, verifies amounts, and checks if the model's extracted text exactly matches the original transcription.

## Known Limitations

- **Reading Aid, Not Advice**: The application serves as a reading aid. It does not provide legal, financial, or medical advice.
- **Single Page Processing**: Only the first page of an uploaded PDF or image is processed.
- **Scam Check**: The scam detection is a helpful signal but not a definitive guarantee.
- **Language Quality**: Regional-language explanation quality rely entirely on the model's native capabilities; quality is not formally guaranteed or claimed without prior measurements.

## Demo Checklist

- [ ] Ensure Ollama is running and the required model is pulled.
- [ ] Run `npm start` and verify `GET /api/health` returns `modelReady: true`.
- [ ] Use `scripts/analyze-file.js` to ensure the extraction pipeline works.
- [ ] Upload an electricity bill or tax notice image via the frontend.
- [ ] Validate that the amounts and dates are highlighted correctly.
- [ ] Ask a follow-up question in a supported language.
