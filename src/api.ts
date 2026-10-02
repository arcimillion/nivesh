export type FindingIndicator =
  | 'guaranteed_returns'
  | 'urgency_pressure'
  | 'upfront_payment'
  | 'suspicious_link'
  | 'impersonation'
  | 'unofficial_app'
  | 'other_warning_sign'

export type AnalysisFinding = {
  indicator: FindingIndicator
  original_excerpt: string
  explanation: string
  evidence_type: 'message_excerpt' | 'insufficient_evidence'
  verification_status: 'not_independently_verified' | 'verified' | 'unknown'
}

export type ClaimInvestigation = {
  original_claim: string
  what_content_establishes: string
  external_source_consulted: {
    id: string
    title: string
    url: string
    relevant_excerpt: string
    date_accessed: string
  } | null
  source_verdict: 'supports' | 'contradicts' | 'does_not_establish' | 'unverified'
  what_remains_unknown: string
  safe_verification_step: string
}

export type JourneyStageKey =
  | 'initial_offer'
  | 'urgency_pressure'
  | 'payment_request'
  | 'app_or_credential_request'
  | 'followup_or_recovery'

export type JourneyStage = {
  stage: JourneyStageKey
  title: string
  observed: boolean
  evidence: string
  explanation: string
  is_future_risk: boolean
}

export type ExtractionUncertainty = {
  has_uncertainty: boolean
  confidence: 'high' | 'medium' | 'low'
  notes: string
}

export type ExtractedEntities = {
  urls: string[]
  names: string[]
  promised_returns: string[]
  deadlines: string[]
  payment_requests: string[]
  claims: string[]
  phone_numbers?: string[]
}

export type ExtractedPhoneItem = {
  raw: string
  normalized_e164: string | null
  country_code: string
  format_type: string
}

export type InputModality = 'text' | 'image' | 'url' | 'voice'

export type AnalysisResult = {
  input_modality: InputModality
  input_language: string
  extracted_text: string
  extraction_uncertainty: ExtractionUncertainty
  extracted_entities: ExtractedEntities
  extracted_phones?: ExtractedPhoneItem[]

  overall_status:
    | 'warning_signs_found'
    | 'no_obvious_warning_signs'
    | 'insufficient_evidence'
  uncertainty_rating: 'low' | 'medium' | 'high'
  summary: string

  findings: AnalysisFinding[]
  claims: ClaimInvestigation[]
  scam_journey_map: JourneyStage[]

  unknowns: string[]
  next_steps: string[]
  limitations: string[]
}

export type PhoneReputationStatus =
  | 'reported'
  | 'no_match'
  | 'unavailable'
  | 'not_checked'
  | 'inconclusive'

export type PhoneReputationSourceResult = {
  source_name: string
  source_type: 'official_regulatory' | 'telecom_registry' | 'community_reputation'
  status: PhoneReputationStatus
  checked_at: string
  label: string | null
  source_url: string | null
  limitations: string
  details?: Record<string, unknown>
}

export type OfficialVerificationResource = {
  name: string
  authority: string
  url: string
  description: string
  manual_search_supported: boolean
  reporting_supported: boolean
  instructions: string
}

export type PhoneReputationInvestigation = {
  raw_input: string
  normalized_e164: string | null
  country_code: string
  is_valid_format: boolean
  format_description: string
  results: PhoneReputationSourceResult[]
  evidence_synthesis: {
    message_warning_signs: string[]
    external_reputation_summary: string
    official_verification_status: string
    unverified_elements: string[]
  }
  official_verification_links: OfficialVerificationResource[]
  safety_advisories: string[]
  privacy_notice: string
}

export type AnalyzeOptions = {
  message?: string
  modality?: InputModality
  language: string
  file_data?: string // base64 string
  file_mime_type?: string
  url?: string
}

import { evaluateLocally, evaluatePhoneLocally } from './localRegulatoryEngine.ts'

// Unified full-stack server serves both frontend and backend on port 3000.
// In the browser, always use relative path '' to avoid Mixed Content or obsolete localhost:5000 port errors.
const getApiEndpoint = (): string => {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env
  const envUrl = String(metaEnv?.VITE_API_URL || '').trim()
  const globalObj = globalThis as unknown as { location?: { protocol?: string } }
  if (
    !envUrl ||
    envUrl.includes('localhost:5000') ||
    envUrl.includes('localhost:3000') ||
    (globalObj.location?.protocol === 'https:' && envUrl.startsWith('http:'))
  ) {
    return ''
  }
  return envUrl
}

const API_URL = getApiEndpoint()

export async function analyzeMessage(
  options: AnalyzeOptions | string,
  languageParam?: string,
): Promise<AnalysisResult> {
  const payload: AnalyzeOptions =
    typeof options === 'string'
      ? { message: options, language: languageParam || 'en', modality: 'text' as InputModality }
      : options

  const targetUrl = API_URL ? `${API_URL}/api/analyze` : '/api/analyze'

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const contentType = response.headers.get('content-type') || ''

    // If server responded with HTML (e.g. static host like Netlify returning index.html for unknown /api route),
    // or HTTP 404 / 502 / 503, gracefully fall back to local regulatory engine
    if (!response.ok || !contentType.includes('application/json')) {
      console.warn(
        `[NiveshShield] Backend returned ${response.status} (${contentType || 'non-json'}). Activating client-side regulatory analysis engine.`,
      )
      return evaluateLocally(payload)
    }

    let data: { error?: string; analysis?: AnalysisResult }
    try {
      data = (await response.json()) as { error?: string; analysis?: AnalysisResult }
    } catch {
      console.warn('[NiveshShield] Non-JSON payload received. Activating client-side regulatory analysis engine.')
      return evaluateLocally(payload)
    }

    if (data?.analysis) {
      return data.analysis
    }

    if (data?.error) {
      console.warn('[NiveshShield] Backend error received:', data.error)
      // If error is just missing Gemini key or rate limit, provide complete regulatory analysis
      return evaluateLocally(payload)
    }

    return evaluateLocally(payload)
  } catch (networkError) {
    console.warn(
      '[NiveshShield] Backend endpoint not reachable (static host or offline). Activating client-side regulatory analysis engine:',
      networkError,
    )
    return evaluateLocally(payload)
  }
}

export async function checkPhoneReputation(
  phoneNumber: string,
  originalContext?: string,
  language = 'en',
): Promise<PhoneReputationInvestigation> {
  const targetUrl = API_URL ? `${API_URL}/api/phone-reputation` : '/api/phone-reputation'

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        original_context: originalContext,
        language,
      }),
    })

    const contentType = response.headers.get('content-type') || ''
    if (!response.ok || !contentType.includes('application/json')) {
      return evaluatePhoneLocally(phoneNumber, originalContext, language)
    }

    let data: { error?: string; data?: PhoneReputationInvestigation }
    try {
      data = (await response.json()) as { error?: string; data?: PhoneReputationInvestigation }
    } catch {
      return evaluatePhoneLocally(phoneNumber, originalContext, language)
    }

    if (data?.data) {
      return data.data
    }

    return evaluatePhoneLocally(phoneNumber, originalContext, language)
  } catch {
    return evaluatePhoneLocally(phoneNumber, originalContext, language)
  }
}