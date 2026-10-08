# DocSaathi

> A private, local AI assistant that reads a photo of an English document and explains it in Tamil, Hindi or simple English: what it is, what to do, by when, and how much. Nothing leaves your machine.

## Team

**Team Name:** [Team Name]

| Member | Contribution |
| ------ | ------------ |
| Hariharasudhan | Backend: local-only config, Ollama client with timeouts, extraction schema, analyze route, deterministic fact-verification engine, explain and ask streaming APIs, safety API (PII redaction and scam check), .ics reminders, backend tests and backend docs |
| Navikeshsaravanan | Frontend: the React application (uploader, fact verification cards, explanation panel with audio reader, document chat, transcription viewer, sample documents) |
| Nithin Sai | First Ollama and backend connection, and port configuration |
| Shivaditya S S | Frontend–backend integration (API contract, streaming, language codes, port), nine languages and three modes, audio-reader voice selection, fixes to the scam check, calendar export and image handling, documentation, and the project README |

## Problem Statement

### The Problem

Much of everyday Indian life runs on English paperwork: bank notices, electricity bills, insurance letters, rental agreements, scheme application forms, tax and legal notices. Many people who must act on these documents read only Tamil, Hindi or another regional language, or read English only partly.

Today they ask a shopkeeper, neighbour, agent or cyber-cafe operator to read the document for them, and often hand over Aadhaar, PAN, account numbers and personal letters in the process. Helpers can misread, summarise wrongly, or exploit the situation through extra fees, upselling or fraud. Deadlines and amounts get missed, which leads to penalties, lost scheme benefits, or signing something that was not understood. Fake notices ("your account will be blocked") are hard to tell apart from real ones.

Cloud AI apps and camera-translate tools require uploading sensitive documents to someone else's servers, and translation alone does not answer the questions people actually have: what do I do, by when, how much, and is this letter genuine?

### Why We Chose This Problem

People who cannot read English documents must choose between not understanding them and exposing their private data to strangers or the cloud. That is an unfair choice, and it affects ordinary people dealing with essential services. It is also a problem where open-weight AI is the right answer rather than a gimmick: the privacy promise ("your Aadhaar and bank letters never leave your machine") is only possible if the model runs locally. [Add one sentence on why this matters personally to your team, for example a relative who has had to rely on a stranger to read a notice.]

## Solution

DocSaathi turns a photo of an English document into a plain-language explanation in the reader's own language. Gemma 4 runs locally through Ollama on one laptop, reads the document image, extracts the key facts, and explains them. Plain code, not the model, checks every date and amount. Every fact is shown next to the exact words it came from, so the user can see where it came from.

The same laptop can be shared at a panchayat office, CSC or NGO desk, so helpers can explain documents without handing data to anyone.

### Key Features

- **Photo upload:** the document image is sent to the local server as base64 and read by Gemma 4 vision.
- **Action-first facts:** document type, sender, amount due, due date with days left, reference IDs, and what the reader must do.
- **Explanation in Tamil, Hindi or simple English:** short sentences, streamed as they are generated.
- **Evidence:** every fact carries the exact source text it was read from, shown next to the transcription.
- **Grounded Q&A:** follow-up questions are answered only from the document, and the app says the document does not say so when the answer is not there.
- **Honesty checks:** unreadable or unmatched facts trigger "Please check this against your paper copy."
- **Safety extras:** Aadhaar / PAN / phone / account number redaction, a scam check, and a downloadable .ics deadline reminder (backend endpoints). [Keep this line only for features that work end to end in the UI at submission.]
- **Read-aloud:** browser speech so the explanation can be listened to. [Keep only if it works in your demo.]

## Innovation and Differentiation

- **Code handles facts, the model handles language.** The model reads and explains; deterministic code validates dates, amounts, days left, overdue status, and whether each quoted source really appears in the transcription. The model never decides these and never invents them.
- **Two-pass approach.** Pass 1 extracts structured facts with source quotes from the image. Pass 2 writes the Tamil or Hindi explanation from the verified facts only, which is more reliable than converting an image directly into Tamil.
- **Privacy enforced in code, not just promised.** The server refuses to start if the Ollama address is not local, binds to 127.0.0.1 only, never logs document content, and stores nothing.
- **Action over translation.** Existing camera-translate and cloud tools translate words. DocSaathi answers what to do, by when, and how much, with evidence and honest uncertainty.

## Technical Implementation

### Architecture

```mermaid
flowchart LR
    U[User photo of document] --> C[React client]
    C -->|base64 image| S[Express server<br/>127.0.0.1 only]
    S -->|Pass 1: image + schema| O[(Ollama<br/>Gemma 4)]
    O -->|transcription + facts JSON| S
    S --> V[verify.js<br/>dates, amounts, source match]
    V -->|verified facts + checks| C
    C -->|facts + language| S
    S -->|Pass 2: verified facts only| O
    O -->|streamed explanation| C
    C -->|question + transcription| S
    S -->|grounded answer + source quote| C
    C -->|transcription| R[safety.js<br/>redaction + scam rules]
```

### Technology Stack

| Category        | Technologies                                                                 |
| --------------- | ---------------------------------------------------------------------------- |
| Frontend        | React 19, Vite, Lucide icons, plain CSS, Web Speech API                      |
| Backend         | Node.js 18+, Express 5, cors, dotenv, Server-Sent Events, built-in `fetch`   |
| Database        | N/A (nothing is stored on the server)                                        |
| AI / ML         | Gemma 4 (`gemma4:latest` in our setup) through Ollama                        |
| Infrastructure  | Runs entirely on one local machine (Windows laptop)                          |
| APIs / Services | Local Ollama HTTP API only; no external services                             |
| Testing         | Node's built-in test runner (`node:test`), 69 passing backend tests          |

### How It Works

1. **Capture.** The browser sends the document image as base64 to `POST /api/analyze`. The server validates it (bad base64 and oversized images are rejected with clean error codes).
2. **Pass 1, understand.** The server asks Gemma 4 (vision) for the transcription and a structured JSON object: document type, sender, amount, due date, reference IDs, required actions and penalties, each with a `source_text` quote. Invalid JSON is retried once, then a clean error is returned. If schema-constrained output conflicts with image input on a given Ollama version, the server falls back to prompt-only JSON with tolerant parsing.
3. **Verify in code.** `verify.js` checks that dates are valid and plausible, computes days left and overdue status in UTC, checks the amount appears in its quote, and locates every quote inside the transcription (Unicode-safe, so Tamil and Devanagari work). Any problem sets `needs_paper_check`.
4. **Pass 2, explain.** Only the verified facts go to the model, which writes a short explanation in Tamil, Hindi or simple English, streamed over Server-Sent Events from `POST /api/explain`.
5. **Display.** The UI shows the transcription alongside the facts and explanation. Sources are located by character offsets into the transcription.
6. **Q&A.** `POST /api/ask` sends the transcription and the question; the model answers only from the document and ends with an exact `SOURCE` quote, which the server locates so the UI highlights only verified evidence.
7. **Safety extras.** `POST /api/redact` finds Aadhaar, PAN, phone and account numbers with deterministic rules; `POST /api/scam-check` combines rules with a model judgement; `POST /api/reminder` returns an .ics file.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Is Ollama reachable and is the model installed |
| `POST /api/analyze` | Image in, facts + verification + transcription out |
| `POST /api/explain` (SSE) | Streamed explanation in `ta`, `hi` or `en` |
| `POST /api/ask` (SSE) | Streamed grounded answer + source span |
| `POST /api/scam-check` | Verdict, rule hits, reasons |
| `POST /api/redact` | Character spans of sensitive numbers |
| `POST /api/reminder` | Downloadable .ics deadline reminder |

Full request and response shapes are in [`backend/API.md`](backend/API.md).

### Technical Decisions

- **No OCR pipeline.** Gemma 4 vision reads the photo directly, which removes risky Windows installs (Tesseract, Poppler) and keeps the stack to one language.
- **No vector database or RAG.** One document fits easily in the model's context, so the full transcription is sent with each question.
- **Highlight text, not image regions.** Substring matching on the transcription is more reliable than image coordinates.
- **Fuzzy source matching.** Quotes are matched ignoring case, spacing and punctuation across all Unicode scripts.
- **Rules can raise, never lower.** In the scam check, deterministic rules can raise the model's verdict but never lower it.
- **Local-only enforced.** The config module throws if `OLLAMA_HOST` is not localhost, 127.0.0.1 or ::1, and the server listens on 127.0.0.1 only. CORS allows only localhost origins.
- **No content in logs.** Request bodies, images, transcriptions, questions and model output are never logged, only error codes.
- **Timeouts and abort.** Ollama calls have timeouts, and a client disconnect mid-stream aborts the Ollama request.
- **Model size by hardware.** A larger tag on 16 GB RAM or more, `gemma4:e2b` if the laptop is slow, chosen by a speed test (second run under about 45 seconds with correct amount and date).

## Implementation During the Hackathon

Everything in this repository was started and built during the Hack Day. The team used existing open-source libraries and the Gemma 4 model; the application, prompts, schema, verification engine, safety module, UI and integration were written by the team. The commit history shows the progression.

- Local server with Ollama client, health check and local-only enforcement
- Document analysis endpoint with structured extraction, image validation and retry on invalid JSON
- Deterministic verification engine (quote location, strict dates, days left, amount and date checks) with unit tests
- Streaming multilingual explanation (Tamil, Hindi, English)
- Grounded Q&A with a verified source event
- PII redaction, rule-based scam signals with model judgement, and .ics calendar reminder
- Request limits, timeouts and clean error codes, plus a privacy audit of logging
- Backend setup and API documentation
- React UI for upload, fact verification cards, explanation and document chat
- [Evaluation on N fake sample documents, results in `docs/evaluation.md`, add only if done]

### Team Contributions

- **[Backend member]:** server, Ollama client, verification engine, explain / ask / safety / reminder routes, tests and API docs.
- **[AI member]:** [prompts, schema, Tamil / Hindi quality, extraction evaluation]
- **[Vision & Safety member]:** [sample documents, redaction and scam rules, accuracy report]
- **[Frontend member]:** upload, fact cards, explanation panel, transcription view, document chat, streaming UI.

## Working Application

**Live Application:** N/A. DocSaathi is intentionally not deployed. Its privacy promise depends on running on the user's own machine, so there is no hosted version. To try it, follow the setup below, or watch the demo video.

After running locally you can: upload a sample document from `samples/` (fake data only), switch the explanation language, check each fact against its source text, ask a question that the document answers and one it does not, and try the scam and redaction samples.

## Demo Video

**Demo Video:** [Video URL]

The video shows: the problem, turning Wi-Fi off, uploading a fake electricity bill, facts with days left, checking the amount against its source, switching between Tamil, Hindi and English, asking an answerable question and an unanswerable one ("This document does not say"), a scam notice, and Aadhaar redaction. [Edit to match what the video really shows.]

## Open Source and AI Usage

### AI / Models

- **Gemma 4 (`gemma4:latest` in our setup), run locally with Ollama:** reads the document photo (vision transcription), extracts structured facts with source quotes, writes the Tamil / Hindi / simple English explanation, answers follow-up questions from the document only, and judges whether a letter looks like a scam. Model licence: [link to the Gemma 4 licence from its Ollama or model page].

Code, not the model, does all date, amount, overdue and source verification, redaction, and calendar file generation.

### Open Source Components

- **Ollama:** local model runtime (MIT).
- **React and Vite:** frontend framework and build tool (MIT).
- **Lucide React:** icons (ISC).
- **Express:** HTTP server (MIT).
- **cors:** localhost-only CORS handling (MIT).
- **dotenv:** environment variable loading (BSD-2-Clause).
- **Dataset:** no external dataset. All sample documents in `samples/` are fake and created by the team.
- **API / Service:** none external. The only network call is to the local Ollama API.

[Verify each licence against the package before submitting and add any package you added later, such as pdf.js if the frontend uses it.]

## Setup and Usage

### Prerequisites

- Node.js 18 or newer
- Git
- [Ollama](https://ollama.com) installed and running
- A Gemma 4 model pulled through Ollama (see below); about 15 GB free disk
- Windows laptop with a charger connected and best-performance power mode recommended

### Installation

```bash
git clone https://github.com/[user]/[repository].git
cd [repository]

# pull the model, then confirm the exact tag with: ollama list
ollama pull gemma4

# backend
cd backend
npm install
cp .env.example .env

# frontend (new terminal)
cd frontend
npm install
```

### Environment Variables

`backend/.env`:

```env
PORT=3001
OLLAMA_HOST=http://127.0.0.1:11434
MODEL=gemma4:latest
```

`OLLAMA_HOST` must be a local address; the server refuses to start otherwise. Set `MODEL` to the exact tag shown by `ollama list`. On slower laptops use a smaller tag such as `gemma4:e2b`. The frontend must send its `/api` requests to port 3001 (check the proxy in `frontend/vite.config.js`).

### Running the Project

```bash
# terminal 1: backend
cd backend
npm start

# terminal 2: frontend
cd frontend
npm run dev
```

Open the address Vite prints (usually http://localhost:5173). To run the backend tests: `cd backend && npm test`.

### Usage

1. Open the app and confirm Ollama and the model are ready (`GET /api/health` returns `modelReady: true`).
2. Choose a language: Tamil, Hindi or Simple English.
3. Upload a photo of a document (use a file from `samples/`).
4. Wait while the document is read on your computer (the first run after starting can take longer).
5. Read the action-first facts and the explanation; check each fact against its source text.
6. Ask follow-up questions; answers come only from this document.
7. Optional: hide private numbers, check if the notice is a scam, or download a calendar reminder.

Tip for demos: run a sample document twice before presenting so the model is warm, and use fake data only.

## Limitations

- Accuracy depends on photo quality and the model; DocSaathi is a reading aid, not legal or financial advice. Serious matters should be confirmed with a bank, CSC or lawyer.
- The scam check is a signal, not a guarantee.
- Tamil and Hindi explanation quality is [reviewed by: name / not yet reviewed by a native speaker].
- Only one image (a single page) is processed per document.
- Browser read-aloud needs a Tamil or Hindi voice installed on the computer.
- Language support is limited to Tamil, Hindi and simple English.

## Challenges and Learnings

[Replace with the real ones. Possible topics, delete what did not happen: getting structured output to work together with images in Ollama and falling back to prompt-only JSON; making the model copy source quotes exactly; matching quotes across Tamil and Devanagari scripts; keeping explanations short and faithful to verified facts; enforcing privacy in code; speed of local inference and choosing a model size.]

Main lesson: splitting the work so that code handles facts and the model handles language made the product both more trustworthy and easier to test.

## Credits and License

### Credits

- Google's Gemma 4 open-weight model, and Ollama for local inference.
- React, Vite, Express, cors, dotenv and Lucide, and their maintainers.
- Hacktoberfest Hack Day Coimbatore 2026, organised by INIT Club and iDEA-Club with MLH.
- [Anyone who reviewed Tamil or Hindi output, tested the app, or helped.]

### License

MIT License. See [LICENSE](LICENSE). Gemma 4 is used under its own licence: [link].

## Submission Checklist

- [x] Project title and description added
- [x] All team members listed
- [x] Problem clearly explained
- [x] Reason for choosing the problem explained
- [x] Solution and key features documented
- [x] Innovation and differentiation explained
- [x] Architecture included
- [x] Technical implementation documented
- [x] Work completed during the hackathon documented
- [x] Team contributions documented
- [ ] Working application is functional
- [x] Live application link added where applicable (N/A: local-only by design, explained in the README)
- [ ] Demo video added
- [x] AI and open-source components documented
- [ ] Setup and usage instructions tested
- [ ] Challenges and learnings documented
- [ ] Devpost submission completed
- [ ] Devpost link added
- [x] Credits added
- [x] License added
- [ ] Repository is organized and complete
