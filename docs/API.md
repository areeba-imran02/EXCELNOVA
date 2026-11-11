# API

All routes are served by the Express application.

## GET `/api/health`
Returns application status and timestamp.

## GET `/api/config`
Returns only public Supabase URL/anon-key configuration needed by the browser. Never returns Gemini key.

## GET `/api/ai/models`
Returns configured model IDs and whether a Gemini key is present. Does not return the key.

## POST `/api/ai/chat`
Body:
```json
{
  "message": "Explain the SUM formula",
  "context": {"page":"formula","sheet":{"name":"Sales","rows":[["Amount"],[10],[20]]}},
  "history": []
}
```
Returns response text, selected model, fallback flag, attempts, agent classification, and calculated data profile if applicable.

## POST `/api/ai/stream`
Same body as `/api/ai/chat`; emits Server-Sent Events:
- `agent`: backend agent/model execution activity
- `result`: final response
- `failure`: error

## POST `/api/ai/generate`
Body:
```json
{"task":"excel_formula","prompt":"Sum C2:C20","context":{}}
```
Returns generated text and selected model metadata.

## Error handling
- 400 invalid request
- 503 missing API key / all models unavailable
- 429 rate limit at API middleware
- 500 unexpected server error
