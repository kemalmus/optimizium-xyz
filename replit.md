# Optimizium - AI Agent Platform

## Overview
A Next.js application with ElevenLabs ConvAI integration for AI agent interactions. The platform serves as a landing page with an embedded ElevenLabs voice widget for AI-powered conversations.

## Project Architecture
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with PostCSS
- **Validation**: Zod schemas
- **Frontend Port**: 5000 (bound to 0.0.0.0)

### Directory Structure
```
app/
  api/
    agent/           - ElevenLabs tool endpoints (submit-feedback, request-handoff, log-negotiation, contact-preference)
    webhook/
      elevenlabs/    - ElevenLabs webhook endpoint
  layout.tsx         - Root layout
  page.tsx           - Landing page with ElevenLabs widget
  globals.css        - Global styles
lib/
  auth.ts            - Auth & response helpers
  schemas.ts         - Zod validation schemas
  storage.ts         - Pluggable storage interface
public/              - Static assets (logos, video)
offer_runtime_config.json - Business configuration
```

## Environment Variables
- `INTERNAL_API_TOKEN` - Authorization token for tools
- `WEBHOOK_SECRET` - Webhook signature verification
- `APP_BASE_URL` - Application URL
- `FEEDBACK_API_BASE_URL` - Feedback API URL
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` - ElevenLabs agent ID (public)
- `BRAND_NAME` - Brand name configuration
- `HUMAN_CONTACT_NAME` - Human contact name

## Recent Changes
- 2026-02-22: Initial Replit setup - configured port 5000, allowed dev origins for proxy, set up workflow and deployment
