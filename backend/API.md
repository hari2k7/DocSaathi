# Backend API Reference

**Note:** All spans in the responses are character offsets (i.e. `{ "start": 0, "end": 10 }`) into the returned `transcription`. The language codes used for explanations and answers are one of `ta` (Tamil), `hi` (Hindi), `en` (simple English), `ml` (Malayalam), `te` (Telugu), `kn` (Kannada), `bn` (Bengali), `mr` (Marathi), `gu` (Gujarati).

---

## 1. GET /api/health

Checks the health of the local Ollama instance and verifies the selected model is ready.

**Request Body:** None

**Response Body (200 OK):**
```json
{
  "ollama": true,
  "model": "<MODEL>",
  "modelReady": true,
  "installed": ["<MODEL>"]
}
```

**PowerShell Example:**
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/health" -Method Get
```

---

## 2. POST /api/analyze

Analyzes a document image, transcribes it, extracts key facts, and runs deterministic verification checks against the transcription.

**Request Body:**
```json
{
  "image": "base64-encoded-image-data..."
}
```

**Response Body (200 OK):**
```json
{
  "success": true,
  "facts": {
    "doc_type": "electricity_bill",
    "sender": "Electricity Board",
    "document_language": "en",
    "summary_en": "Your electricity bill for the month.",
    "amount_due": { "value": 1500, "source_text": "1500" },
    "due_date": { "value": "2026-10-15", "source_text": "Oct 15" },
    "ids": [{ "label": "Account", "value": "12345" }],
    "required_actions": [{ "action": "pay", "source_text": "Pay immediately" }],
    "penalties": [],
    "unclear_parts": [],
    "confidence": 0.95
  },
  "verification": {
    "due_date": {
      "issues": [],
      "days_left": 7,
      "status": "upcoming"
    },
    "issues": [],
    "messages": [],
    "needs_paper_check": false
  },
  "transcription": "BILL DETAILS\nTotal: 1500\nDue: Oct 15"
}
```

**Error Codes:**
- `400 Bad Request`: `invalid_image`, `bad_json`
- `413 Payload Too Large`: `image_too_large`, `payload_too_large`
- `502 Bad Gateway`: `model_returned_invalid_json`, `ollama_error`
- `503 Service Unavailable`: `ollama_unreachable`
- `504 Gateway Timeout`: `ollama_timeout`

**PowerShell Example:**
```powershell
$body = @{ image = "base64..." } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/analyze" -Method Post -ContentType "application/json" -Body $body
```



## 3. POST /api/explain (Server-Sent Events)

Streams an explanation of the extracted facts in the chosen language. Send `facts` and `verification` exactly as returned by `/api/analyze`.

**Request Body:**
```json
{
  "language": "ta",
  "mode": "explain",
  "facts": { "...": "facts from /api/analyze" },
  "verification": { "...": "verification from /api/analyze" },
  "transcription": "only required when mode is translate"
}
```

- `language`: required, one of the codes above.
- `mode`: optional, `explain` (default, short simple sentences), `summarize` (bullet list) or `translate` (verbatim translation of `transcription`, which is required in this mode, max 20000 characters).

**Response (200 OK, `text/event-stream`):** each event is `event: <name>` followed by `data: <JSON>`.
- `token`: data is a JSON string with the next piece of text.
- `done`: data is `{}`; the stream is complete.
- `error`: data is a JSON string error code (`ollama_unreachable`, `ollama_timeout`, `ollama_error`, `internal_error`).

```
event: token
data: "Your electricity bill "

event: done
data: {}
```

**Error Codes (before the stream starts):**
- `400 Bad Request`: `bad_request` (unknown language or mode, missing `facts`/`verification`, missing `transcription` for translate)

---

## 4. POST /api/ask (Server-Sent Events)

Answers a question using only the document transcription. Closing the connection stops generation.

**Request Body:**
```json
{
  "transcription": "text returned by /api/analyze",
  "question": "How much do I have to pay?",
  "language": "en",
  "facts": { "...": "optional, facts from /api/analyze" },
  "history": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }]
}
```

- `question` is trimmed to 1000 characters; only the last 6 `history` turns are used.

**Response (200 OK, `text/event-stream`):** `token` events as above (the answer may end with a `SOURCE: "<quote>"` line), then:
- `source`: `{ "quote": "...", "span": { "start": 0, "end": 10 } | null, "verified": true | false }`. `verified` is true only when the quote was found in the transcription.
- `done`, or `error` as above.

**Error Codes (before the stream starts):**
- `400 Bad Request`: `bad_request`

---

## 5. POST /api/redact

Finds personal data (Aadhaar, PAN, phone numbers, account numbers) in text.

**Request Body:** `{ "text": "..." }`

**Response Body (200 OK):**
```json
{ "spans": [{ "type": "phone", "start": 10, "end": 20 }] }
```
`type` is one of `aadhaar`, `pan`, `phone`, `account`.

**Error Codes:** `400 Bad Request`: `bad_request`

---

## 6. POST /api/scam-check

Combines keyword rules with a model verdict. Rules can raise the verdict to `suspicious`, never lower it. If the model fails, rules alone are used.

**Request Body:** `{ "transcription": "..." }`

**Response Body (200 OK):**
```json
{
  "verdict": "suspicious",
  "rule_hits": ["requests_credential", "urgency"],
  "reasons": [{ "reason": "Asks for an OTP", "source_text": "share OTP", "span": { "start": 0, "end": 9 } }]
}
```
`verdict` is `likely_genuine`, `suspicious` or `likely_scam`. `span` is `null` when the quote is not found.

**Error Codes:** `400 Bad Request`: `bad_request`

---

## 7. POST /api/reminder

Generates and downloads an iCalendar (.ics) file with an all-day event for the given due date, complete with standard reminder alarms.

**Request Body:**
```json
{
  "title": "Pay Electricity Bill",
  "due_date": "2026-10-15",
  "notes": "Remember to pay online."
}
```

**Response (200 OK):**
A file download (`text/calendar; charset=utf-8`) named `reminder.ics` containing the iCalendar data.

**Error Codes:**
- `400 Bad Request`: `invalid_title`, `title_too_long`, `notes_too_long`, `invalid_date`

**PowerShell Example:**
```powershell
$body = @{ title = "Bill"; due_date = "2026-10-15" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/reminder" -Method Post -ContentType "application/json" -Body $body -OutFile "reminder.ics"
```
