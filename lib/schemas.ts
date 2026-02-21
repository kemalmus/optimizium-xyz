import { z } from 'zod';

// ============================================================================
// Validation Schemas for ElevenLabs Tools
// Based on: ~/.openclaw/workspace/builder/server_tools_specs.json
// ============================================================================

// Common enums
export const LanguageEnum = z.enum(['pl', 'en', 'other']);
export type Language = z.infer<typeof LanguageEnum>;

export const InterestLevelEnum = z.enum(['hot', 'warm', 'cold', 'unknown']);
export type InterestLevel = z.infer<typeof InterestLevelEnum>;

export const UrgencyEnum = z.enum(['low', 'medium', 'high']);
export type Urgency = z.infer<typeof UrgencyEnum>;

export const ObjectionTypeEnum = z.enum(['budget', 'scope', 'timing', 'gdpr', 'other']);
export type ObjectionType = z.infer<typeof ObjectionTypeEnum>;

export const NegotiationTopicEnum = z.enum(['retainer_hours', 'pricing', 'sequence', 'format', 'other']);
export type NegotiationTopic = z.infer<typeof NegotiationTopicEnum>;

export const NextStepPreferenceEnum = z.enum(['email', 'call', 'later', 'no_followup', 'unknown']);
export type NextStepPreference = z.infer<typeof NextStepPreferenceEnum>;

export const ContactMethodEnum = z.enum(['email', 'call', 'no_preference']);
export type ContactMethod = z.infer<typeof ContactMethodEnum>;

// ============================================================================
// submit_feedback Schema
// ============================================================================
export const FitAssessmentSchema = z.object({
  workshops_interest: z.boolean(),
  retainer_interest: z.boolean(),
  implementation_interest: z.boolean().optional(),
});

export const ObjectionSchema = z.object({
  type: ObjectionTypeEnum,
  detail: z.string(),
});

export const NegotiationSignalSchema = z.object({
  topic: NegotiationTopicEnum,
  requested_change: z.string(),
  within_guardrails: z.boolean(),
});

export const ContactPreferenceSchema = z.object({
  email: z.string().email().nullable().optional(),
  time_window: z.string().nullable().optional(),
});

export const SubmitFeedbackSchema = z.object({
  timestamp: z.string().datetime(),
  lead_id: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  contact_name: z.string().nullable().optional(),
  language: LanguageEnum,
  offer_version: z.string().default('recruitment-v1'),
  conversation_channel: z.enum(['widget']).default('widget'),
  interest_level: InterestLevelEnum.default('unknown'),
  fit_assessment: FitAssessmentSchema,
  stated_priorities: z.array(z.string()),
  constraints: z.array(z.string()).optional(),
  objections: z.array(ObjectionSchema),
  negotiation_signals: z.array(NegotiationSignalSchema).optional(),
  next_step_preference: NextStepPreferenceEnum.default('unknown'),
  contact_preference: ContactPreferenceSchema.optional(),
  human_handoff_requested: z.boolean().default(false),
  agent_summary: z.string().min(1, 'Agent summary is required'),
});

export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackSchema>;

// ============================================================================
// request_handoff Schema
// ============================================================================
export const RequestHandoffSchema = z.object({
  timestamp: z.string().datetime(),
  lead_id: z.string().nullable().optional(),
  urgency: UrgencyEnum.default('medium'),
  reason: z.string().min(1, 'Reason is required'),
  relevant_context: z.array(z.string()).optional(),
});

export type RequestHandoffInput = z.infer<typeof RequestHandoffSchema>;

// ============================================================================
// log_negotiation Schema
// ============================================================================
export const LogNegotiationSchema = z.object({
  timestamp: z.string().datetime(),
  lead_id: z.string().nullable().optional(),
  topic: NegotiationTopicEnum,
  requested_change: z.string().min(1, 'Requested change is required'),
  within_guardrails: z.boolean(),
  conversation_context: z.string().optional(),
});

export type LogNegotiationInput = z.infer<typeof LogNegotiationSchema>;

// ============================================================================
// contact_preference Schema
// ============================================================================
export const CaptureContactPreferenceSchema = z.object({
  timestamp: z.string().datetime(),
  lead_id: z.string().nullable().optional(),
  contact_method: ContactMethodEnum.default('no_preference'),
  time_window: z.string().nullable().optional(),
  email: z.string().email('Invalid email format').nullable().optional(),
});

export type CaptureContactPreferenceInput = z.infer<typeof CaptureContactPreferenceSchema>;

// ============================================================================
// Webhook Payload Schema (ElevenLabs)
// ============================================================================
export const ElevenLabsWebhookSchema = z.object({
  event_id: z.string().optional(),
  event_type: z.string(),
  timestamp: z.string().optional(),
  data: z.object({
    conversation_id: z.string().optional(),
    call_id: z.string().optional(),
    agent_id: z.string().optional(),
    duration_seconds: z.number().optional(),
    transcript: z.string().optional(),
    summary: z.string().optional(),
    outcome: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }).optional(),
});

export type ElevenLabsWebhookInput = z.infer<typeof ElevenLabsWebhookSchema>;
