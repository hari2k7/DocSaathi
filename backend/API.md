# Backend API Reference

**Note:** All spans in the responses are character offsets (i.e. `{ "start": 0, "end": 10 }`) into the returned `transcription`. The language codes used for extraction and explanations are one of `ta`, `hi`, `en`.

---

## 1. GET /api/health

Checks the health of the local Ollama instance and verifies the selected model is ready.

**Request Body:** None

**Response Body (200 OK):**
```json
{
  "ollama": true,
  "model": "gemma2:2b",
  "modelReady": true,
  "installed": ["gemma2:2b", "gemma2:latest"]
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
  }
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

---

## 3. POST /api/explain

Streams an explanation of the document facts in the requested language via Server-Sent Events (SSE).

**Request Body:**
```json
{
  "facts": { "doc_type": "electricity_bill", "amount_due": { "value": 1500, "source_text": "1500" } },
  "language": "hi",
  "mode": "summary"
}
```

**Response (200 OK, `text/event-stream`):**
The stream yields chunk events containing tokens, and terminates with `[DONE]`.

**SSE Event Shapes:**
```text
data: {"token": " Your"}

data: {"token": " bill"}

data: {"error": "ollama_timeout"}

data: [DONE]
```

**PowerShell Example:**
```powershell
$body = @{ facts = @{}; language = "ta"; mode = "summary" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/explain" -Method Post -ContentType "application/json" -Body $body
```

---

## 4. POST /api/ask

Streams an answer to a user's follow-up question grounded ONLY in the transcription, via Server-Sent Events (SSE).

**Request Body:**
```json
{
  "transcription": "BILL DETAILS\nTotal: 1500\nDue: Oct 15",
  "question": "What is the total?",
  "language": "en"
}
```

**Response (200 OK, `text/event-stream`):**
The stream yields chunk events containing tokens, and terminates with `[DONE]`.

**SSE Event Shapes:**
```text
data: {"token": " The"}

data: {"token": " total"}

data: {"error": "ollama_unreachable"}

data: [DONE]
```

**PowerShell Example:**
```powershell
$body = @{ transcription = "Bill details"; question = "Total?"; language = "en" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/ask" -Method Post -ContentType "application/json" -Body $body
```

---

## 5. POST /api/reminder

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
$body = @{ title = "Bill", due_date = "2026-10-15" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/reminder" -Method Post -ContentType "application/json" -Body $body -OutFile "reminder.ics"
```
