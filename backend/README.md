# DocSaathi Backend

The backend of DocSaathi provides a local, private API for reading and analyzing English documents (like bills, notices, and agreements) and returning extracted facts in Tamil, Hindi, or plain English. It is powered by a local Ollama model. The backend is designed with privacy and strict fact verification at its core: the model handles language extraction, while deterministic code verifies dates, amounts, and statuses.

## Prerequisites

- **Node.js**: v18 or later
- **Ollama**: Installed and running locally.

## Environment Variables

The backend relies on the following environment variables (defined in a `.env` file):

- `PORT`: Port the server runs on (default: `3001`).
- `OLLAMA_HOST`: Local Ollama API URL (default: `http://127.0.0.1:11434`). Must be localhost or 127.0.0.1.
- `MODEL`: The Ollama model to use (default: `gemma2:2b`).

## How to Pull the Model

Before starting, ensure you have pulled the required model in Ollama:

```powershell
ollama pull gemma2:2b
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

- `/routes`: Express route handlers (`analyze.js`, `reminder.js`).
- `/scripts`: Developer tools, including `analyze-file.js` to test extraction.
- `/tests`: Unit tests for verification and routes.
- `config.js`: Configuration loader with validation.
- `ollama.js`: Ollama client with error handling, streaming, and timeouts.
- `prompts.js`: The system prompts passed to the model.
- `schema.js`: JSON schema defining the extraction structure.
- `server.js`: The main Express application.
- `verify.js`: The deterministic fact verification engine.

## Dev Script

You can test the extraction pipeline locally on an image without using the frontend:

```powershell
node scripts/analyze-file.js <path-to-image>
```
