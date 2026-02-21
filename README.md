# Optimizium - AI Agent Platform

Projekt Next.js z integracją ElevenLabs ConvAI dla AI agents.

## Struktura projektu

```
optimizium_xyz/
├── app/
│   ├── api/
│   │   ├── agent/
│   │   │   ├── submit-feedback/route.ts       # ElevenLabs tool: submit_feedback
│   │   │   ├── request-handoff/route.ts       # ElevenLabs tool: request_handoff
│   │   │   ├── log-negotiation/route.ts       # ElevenLabs tool: log_negotiation_signal
│   │   │   └── contact-preference/route.ts    # ElevenLabs tool: capture_contact_preference
│   │   └── webhook/
│   │       └── elevenlabs/route.ts            # ElevenLabs webhook endpoint
│   ├── layout.tsx
│   ├── page.tsx                               # Landing page z widgetem
│   └── globals.css
├── lib/
│   ├── auth.ts                                # Auth & response helpers
│   ├── schemas.ts                             # Zod validation schemas
│   └── storage.ts                             # Pluggable storage interface
├── offer_runtime_config.json                  # Konfiguracja biznesowa
└── package.json
```

---

## ElevenLabs Backend Setup

### Prerequisites

1. **Stwórz konto ElevenLabs** i uzyskaj API Key
2. **Zdeployuj ten projekt** na Vercel
3. **Skonfiguruj zmienne środowiskowe** (poniżej)

---

### Environment Variables (Vercel)

W **Vercel → Settings → Environment Variables** ustaw:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `INTERNAL_API_TOKEN` | ✅ | Token autoryzacji dla tooli | Generate with: `openssl rand -hex 32` |
| `WEBHOOK_SECRET` | ⚠️ Recommended | Secret do weryfikacji webhook signature | Generate with: `openssl rand -hex 32` |
| `APP_BASE_URL` | ✅ | URL strony | `https://optimizium-pkzlpxlf4-kemalmus-projects.vercel.app` |
| `FEEDBACK_API_BASE_URL` | ✅ | URL API (zazwyczaj = APP_BASE_URL) | `https://optimizium-pkzlpxlf4-kemalmus-projects.vercel.app` |
| `BRAND_NAME` | Optional | Nazwa marki | `Optimizium` |
| `HUMAN_CONTACT_NAME` | Optional | Imię kontaktu | `Paweł` |
| `STORAGE_TYPE` | Optional | Typ storage: `console`, `ndjson`, `vercel-kv` | `console` (default) |

---

### ElevenLabs Tool Configuration

W **ElevenLabs ConvAI → Agent → Tools**, skonfiguruj następujące tooli:

#### 1. submit_feedback

```json
{
  "name": "submit_feedback",
  "description": "Stores structured conversation summary and lead qualification data. Use after gathering sufficient context.",
  "method": "POST",
  "url": "{{FEEDBACK_API_BASE_URL}}/api/agent/submit-feedback",
  "headers": {
    "Authorization": "Bearer {{INTERNAL_API_TOKEN}}",
    "Content-Type": "application/json"
  }
}
```

#### 2. request_handoff

```json
{
  "name": "request_handoff",
  "description": "Requests human follow-up and records urgency + reason. Use when topic is outside agent's authority or requires human decision.",
  "method": "POST",
  "url": "{{FEEDBACK_API_BASE_URL}}/api/agent/request-handoff",
  "headers": {
    "Authorization": "Bearer {{INTERNAL_API_TOKEN}}",
    "Content-Type": "application/json"
  }
}
```

#### 3. log_negotiation_signal

```json
{
  "name": "log_negotiation_signal",
  "description": "Captures any pricing/scope negotiation request, whether within guardrails or not.",
  "method": "POST",
  "url": "{{FEEDBACK_API_BASE_URL}}/api/agent/log-negotiation",
  "headers": {
    "Authorization": "Bearer {{INTERNAL_API_TOKEN}}",
    "Content-Type": "application/json"
  }
}
```

#### 4. capture_contact_preference

```json
{
  "name": "capture_contact_preference",
  "description": "Stores how/when the prospect prefers to be contacted. Optional but recommended.",
  "method": "POST",
  "url": "{{FEEDBACK_API_BASE_URL}}/api/agent/contact-preference",
  "headers": {
    "Authorization": "Bearer {{INTERNAL_API_TOKEN}}",
    "Content-Type": "application/json"
  }
}
```

---

### Webhook Configuration (ElevenLabs)

W **ElevenLabs ConvAI → Agent → Webhooks**, ustaw:

- **URL**: `{{APP_BASE_URL}}/api/webhook/elevenlabs`
- **Secret**: Wartość `WEBHOOK_SECRET`

---

## API Endpoints Reference

### POST /api/agent/submit-feedback

**Request Body:**
```json
{
  "timestamp": "2025-02-21T10:30:00Z",
  "lead_id": "lead_123",
  "company": "ACME Corp",
  "contact_name": "Jan Kowalski",
  "language": "pl",
  "offer_version": "recruitment-v1",
  "conversation_channel": "widget",
  "interest_level": "warm",
  "fit_assessment": {
    "workshops_interest": true,
    "retainer_interest": true,
    "implementation_interest": false
  },
  "stated_priorities": ["Automatyzacja procesów", "Szkolenie zespołu"],
  "objections": [
    { "type": "budget", "detail": "Obawy o koszty" }
  ],
  "negotiation_signals": [
    {
      "topic": "retainer_hours",
      "requested_change": "Czy można mniej godzin?",
      "within_guardrails": true
    }
  ],
  "next_step_preference": "email",
  "agent_summary": "Klient zainteresowany warsztatami i retainerem, ma obawy budżetowe."
}
```

### POST /api/agent/request-handoff

**Request Body:**
```json
{
  "timestamp": "2025-02-21T10:30:00Z",
  "lead_id": "lead_123",
  "urgency": "high",
  "reason": "Klient prosi o indywidualną wycenę poza standardowym cennikiem",
  "relevant_context": ["Rozmowa o dużym projekcie", "Budżet: 50k+ PLN"]
}
```

### POST /api/agent/log-negotiation

**Request Body:**
```json
{
  "timestamp": "2025-02-21T10:30:00Z",
  "lead_id": "lead_123",
  "topic": "pricing",
  "requested_change": "Czy jest możliwość rabatu za płatność z góry?",
  "within_guardrails": false,
  "conversation_context": "Klient pyta o zniżki - wymaga handoff"
}
```

### POST /api/agent/contact-preference

**Request Body:**
```json
{
  "timestamp": "2025-02-21T10:30:00Z",
  "lead_id": "lead_123",
  "contact_method": "email",
  "time_window": "Popołudnia, po 14:00",
  "email": "jan@acme-corp.pl"
}
```

---

## Testowanie Endpointów

Zastąp `YOUR_VERCEL_URL` i `YOUR_TOKEN` własnymi wartościami:

```bash
# Set variables
VERCEL_URL="https://optimizium-pkzlpxlf4-kemalmus-projects.vercel.app"
TOKEN="your-internal-api-token-here"

# Test 1: submit-feedback
curl -X POST "$VERCEL_URL/api/agent/submit-feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-02-21T10:30:00Z",
    "language": "pl",
    "offer_version": "recruitment-v1",
    "conversation_channel": "widget",
    "interest_level": "warm",
    "fit_assessment": {
      "workshops_interest": true,
      "retainer_interest": true
    },
    "stated_priorities": ["Automatyzacja"],
    "objections": [],
    "next_step_preference": "email",
    "agent_summary": "Test feedback"
  }'

# Test 2: request-handoff
curl -X POST "$VERCEL_URL/api/agent/request-handoff" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-02-21T10:30:00Z",
    "urgency": "medium",
    "reason": "Test handoff"
  }'

# Test 3: log-negotiation
curl -X POST "$VERCEL_URL/api/agent/log-negotiation" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-02-21T10:30:00Z",
    "topic": "pricing",
    "requested_change": "Test negotiation",
    "within_guardrails": true
  }'

# Test 4: contact-preference
curl -X POST "$VERCEL_URL/api/agent/contact-preference" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-02-21T10:30:00Z",
    "contact_method": "email",
    "time_window": "any"
  }'

# Test 5: webhook (no auth)
curl -X POST "$VERCEL_URL/api/webhook/elevenlabs" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "call.completed",
    "timestamp": "2025-02-21T10:30:00Z",
    "data": {
      "conversation_id": "test_conv_123",
      "duration_seconds": 120
    }
  }'
```

---

## Response Format

All endpoints return consistent JSON responses:

**Success (200/201):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2025-02-21T10:30:00Z"
}
```

**Error (400/401/500):**
```json
{
  "success": false,
  "error": "ERROR_CODE: Error message",
  "timestamp": "2025-02-21T10:30:00Z"
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "path": "agent_summary", "message": "Required", "code": "invalid_type" }
  ],
  "timestamp": "2025-02-21T10:30:00Z"
}
```

---

## Go Live Checklist (Custom Domain)

Gdy domena `optimiziu.xyz` będzie gotowa:

### 1. Update Vercel Environment Variables

```
APP_BASE_URL=https://optimiziu.xyz
FEEDBACK_API_BASE_URL=https://optimiziu.xyz
```

### 2. Update ElevenLabs Tools

Zmień URL we wszystkich toolach z:
- `https://optimizium-pkzlpxlf4-kemalmus-projects.vercel.app`
→ `https://optimiziu.xyz`

### 3. Update Webhook URL

W ElevenLabs ConvAI:
- Stary URL: `https://optimizium-pkzlpxlf4-kemalmus-projects.vercel.app/api/webhook/elevenlabs`
- Nowy URL: `https://optimiziu.xyz/api/webhook/elevenlabs`

### 4. Redeploy (jeśli potrzebne)

```bash
git add .
git commit -m "Update URLs for custom domain"
git push
# Vercel automatycznie zdeployuje
```

---

## Development

```bash
npm install
npm run dev
```

Otwórz http://localhost:3000

## Build

```bash
npm run build
npm start
```
