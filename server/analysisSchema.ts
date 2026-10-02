import { z } from 'zod'

export const FindingSchema = z.object({
  indicator: z.enum([
    'guaranteed_returns',
    'urgency_pressure',
    'upfront_payment',
    'suspicious_link',
    'impersonation',
    'unofficial_app',
    'other_warning_sign',
  ]),
  original_excerpt: z.string().min(1),
  explanation: z.string().min(1),
  evidence_type: z.enum(['message_excerpt', 'insufficient_evidence']),
  verification_status: z.enum(['not_independently_verified', 'verified', 'unknown']),
})

export const ClaimInvestigationSchema = z.object({
  original_claim: z.string().min(1),
  what_content_establishes: z.string().min(1),
  external_source_consulted: z
    .object({
      id: z.string(),
      title: z.string(),
      url: z.string(),
      relevant_excerpt: z.string(),
      date_accessed: z.string(),
    })
    .nullable(),
  source_verdict: z.enum(['supports', 'contradicts', 'does_not_establish', 'unverified']),
  what_remains_unknown: z.string().min(1),
  safe_verification_step: z.string().min(1),
})

export const JourneyStageSchema = z.object({
  stage: z.enum([
    'initial_offer',
    'urgency_pressure',
    'payment_request',
    'app_or_credential_request',
    'followup_or_recovery',
  ]),
  title: z.string().min(1),
  observed: z.boolean(),
  evidence: z.string(),
  explanation: z.string(),
  is_future_risk: z.boolean(),
})

export const ExtractionUncertaintySchema = z.object({
  has_uncertainty: z.boolean(),
  confidence: z.enum(['high', 'medium', 'low']),
  notes: z.string(),
})

export const ExtractedEntitiesSchema = z.object({
  urls: z.array(z.string()),
  names: z.array(z.string()),
  promised_returns: z.array(z.string()),
  deadlines: z.array(z.string()),
  payment_requests: z.array(z.string()),
  claims: z.array(z.string()),
})

export const AnalysisSchema = z.object({
  input_modality: z.enum(['text', 'image', 'url', 'voice']).default('text'),
  input_language: z.string().min(1),
  extracted_text: z.string().default(''),
  extraction_uncertainty: ExtractionUncertaintySchema,
  extracted_entities: ExtractedEntitiesSchema,

  overall_status: z.enum([
    'warning_signs_found',
    'no_obvious_warning_signs',
    'insufficient_evidence',
  ]),
  uncertainty_rating: z.enum(['low', 'medium', 'high']).default('low'),
  summary: z.string().default(''),

  findings: z.array(FindingSchema),
  claims: z.array(ClaimInvestigationSchema),
  scam_journey_map: z.array(JourneyStageSchema),

  unknowns: z.array(z.string()),
  next_steps: z.array(z.string()),
  limitations: z.array(z.string()),
})

export type AnalysisSchemaType = z.infer<typeof AnalysisSchema>
