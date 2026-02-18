# API Documentation

## Health

### GET `/health`
Returns service health.

---

## Webhooks

### GET `/webhook/whatsapp`
Meta verification endpoint.

### POST `/webhook/whatsapp`
Receives WhatsApp Cloud API events.

Flow:
1. Signature verification (`X-Hub-Signature-256`).
2. Student upsert by `from + platform`.
3. Conversation open/create.
4. Save inbound message.
5. Generate AI response with last 10 messages.
6. Save bot response.
7. Auto-escalate to `needs_review` if keyword/low-confidence.
8. Send reply via WhatsApp API.

### GET `/webhook/facebook`
Meta verification endpoint.

### POST `/webhook/facebook`
Receives Messenger events with same flow as WhatsApp.

---

## Admin API (`/api/admin`) - requires Bearer Supabase access token

### GET `/dashboard`
Returns analytics:
- `perDay`: student query volume by date
- `topTopic`: most asked topics

### GET `/conversations`
Query params:
- `platform` = whatsapp|facebook
- `status` = open|resolved|needs_review
- `fromDate`
- `toDate`
- `search` (student name or phone)

### GET `/conversations/export`
Returns CSV export of filtered list.

### GET `/conversations/:id`
Returns conversation with student + messages.

### PATCH `/conversations/:id/resolve`
Marks conversation as resolved.
Body:
```json
{ "note": "optional" }
```
