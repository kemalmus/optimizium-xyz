# Optimizium - AI Agent Platform

Projekt Next.js z integracją ElevenLabs Convex dla AI agents.

## Struktura projektu

```
optimizium_xyz/
├── app/
│   ├── api/
│   │   ├── agent/
│   │   │   ├── submit-feedback/route.ts    # Endpoint do zbierania feedbacku
│   │   │   ├── request-handoff/route.ts    # Endpoint do przekazywania do człowieka
│   │   │   └── log-negotiation/route.ts    # Endpoint do logowania negocjacji
│   │   └── webhook/
│   │       └── elevenlabs/route.ts          # Webhook ElevenLabs
│   ├── layout.tsx
│   ├── page.tsx                             # Landing page z widgetem
│   └── globals.css
├── lib/
│   └── auth.ts                              # Utilities do weryfikacji tokena
├── offer_runtime_config.json                # Konfiguracja biznesowa
└── package.json
```

## Instalacja i deployment

### 1. Zainstaluj zależności

```bash
npm install
```

### 2. Skonfiguruj zmienne środowiskowe

Utwórz plik `.env.local` na podstawie `.env.example`:

```bash
cp .env.example .env.local
```

Wygeneruj silny token dla `INTERNAL_API_TOKEN`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Deployment do Vercel

#### Opcja A: Przez CLI

```bash
# Zaloguj się do Vercel
vercel login

# Deploy do produkcji
vercel --prod

# Dodaj domenę
vercel domains add optimiziu.xyz
```

#### Opcja B: Przez dashboard

1. Push do GitHub
2. Vercel → Import Project
3. Skonfiguruj environment variables w dashboard

### 4. Konfiguracja DNS (Unstoppable Domains)

W panelu Unstoppable Domains dla `optimiziu.xyz`:

**Rekord A (apex domain):**
- Name/Host: `@`
- Value: `76.76.21.21`

**Opcjonalnie - rekord CNAME (www):**
- Name/Host: `www`
- Value: (skoż z Vercel dashboard)

### 5. Zmienne środowiskowe w Vercel

Dodaj w Vercel → Settings → Environment Variables:

```
APP_BASE_URL=https://optimiziu.xyz
FEEDBACK_API_BASE_URL=https://optimiziu.xyz
INTERNAL_API_TOKEN=<wygenerowany token>
ELEVENLABS_API_KEY=<twój klucz>
WEBHOOK_SECRET=<opcjonalny sekret>
BRAND_NAME=Optimizium
HUMAN_CONTACT_NAME=Paweł
```

## API Endpoints

Wszystkie endpointy wymagają nagłówka: `Authorization: Bearer <INTERNAL_API_TOKEN>`

### POST /api/agent/submit-feedback

Zapisuje feedback z rozmowy.

```json
{
  "agent_id": "agent-123",
  "conversation_id": "conv-456",
  "feedback_text": "Bardzo dobra rozmowa",
  "sentiment": "positive"
}
```

### POST /api/agent/request-handoff

Inicjuje przekazanie do człowieka.

```json
{
  "agent_id": "agent-123",
  "conversation_id": "conv-456",
  "reason": "Klient pyta o cenę",
  "urgency": "high",
  "context": {
    "user_name": "Jan Kowalski",
    "topic": "Wycena projektu"
  }
}
```

### POST /api/agent/log-negotiation

Loguje sygnały negocjacyjne.

```json
{
  "agent_id": "agent-123",
  "conversation_id": "conv-456",
  "signal_type": "price_concern",
  "content": "Klient martwi się kosztem",
  "metadata": {
    "proposed_price": 10000,
    "budget_indicated": 8000
  }
}
```

### POST /api/webhook/elevenlabs

Webhook ElevenLabs po zakończeniu rozmowy.

## Integracja z OpenClaw/ElevenLabs

W definicji tools OpenClaw użyj:

```json
{
  "submit_feedback": {
    "url": "https://optimiziu.xyz/api/agent/submit-feedback",
    "headers": {
      "Authorization": "Bearer <INTERNAL_API_TOKEN>"
    }
  },
  "request_handoff": {
    "url": "https://optimiziu.xyz/api/agent/request-handoff",
    "headers": {
      "Authorization": "Bearer <INTERNAL_API_TOKEN>"
    }
  }
}
```

## Development

```bash
npm run dev
```

Otwórz http://localhost:3000

## Build

```bash
npm run build
npm start
```
