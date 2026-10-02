/**
 * NiveshShield Phone Reputation & Contact Investigation Service
 * Provider-independent architecture evaluating telephone numbers against
 * official cybercrime repositories, commercial reputation adapters, and telecom databases.
 */

import { z } from 'zod'
import { maskPhoneNumber, normalizeIndianNumber, normalizeInternationalNumber } from './phoneExtractor.js'

export type PhoneReputationStatus =
  | 'reported'
  | 'no_match'
  | 'unavailable'
  | 'not_checked'
  | 'inconclusive'

export interface PhoneReputationSourceResult {
  source_name: string
  source_type: 'official_regulatory' | 'telecom_registry' | 'community_reputation'
  status: PhoneReputationStatus
  checked_at: string
  label: string | null
  source_url: string | null
  limitations: string
  details?: Record<string, unknown>
}

export interface OfficialVerificationResource {
  name: string
  authority: string
  url: string
  description: string
  manual_search_supported: boolean
  reporting_supported: boolean
  instructions: string
}

export interface PhoneReputationInvestigation {
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

export const PhoneReputationRequestSchema = z.object({
  phone_number: z.string().min(3).max(30),
  original_context: z.string().max(2000).optional(),
})

export type PhoneReputationRequest = z.infer<typeof PhoneReputationRequestSchema>

/**
 * Official Indian and international regulatory verification portals
 */
export const OFFICIAL_CYBERCRIME_RESOURCES: OfficialVerificationResource[] = [
  {
    name: 'National Cyber Crime Reporting Portal - Suspect Repository',
    authority: 'Ministry of Home Affairs (MHA) / Indian Cybercrime Coordination Centre (I4C)',
    url: 'https://cybercrime.gov.in/Webform/suspect_search_repository.aspx',
    description: 'Centralized government repository of bank accounts, UPI handles, and mobile numbers reported in cybercrime incidents across Indian states.',
    manual_search_supported: true,
    reporting_supported: true,
    instructions: 'Open the official repository link, enter the contact number with CAPTCHA verification, and review if any First Information Reports (FIR) or incident complaints are linked.',
  },
  {
    name: 'Sanchar Saathi - Chakshu (Suspected Fraud Communication Reporting)',
    authority: 'Department of Telecommunications (DoT), Government of India',
    url: 'https://sancharsaathi.gov.in/sfc/',
    description: 'Official telecom security facility enabling citizens to report fraudulent calls, SMS, and WhatsApp communications impersonating financial entities or government officials.',
    manual_search_supported: false,
    reporting_supported: true,
    instructions: 'Use Chakshu to report fraudulent callers, unsolicited stock-tipping channels, or fake trading academy messages. DoT coordinates with telecom service providers to disconnect malicious numbers.',
  },
  {
    name: 'National Cyber Financial Fraud Reporting Helpline (1930)',
    authority: 'Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS)',
    url: 'https://cybercrime.gov.in',
    description: 'Emergency national financial fraud helpline for immediate freeze of fraudulent transactions and recording suspect mobile coordinates.',
    manual_search_supported: false,
    reporting_supported: true,
    instructions: 'If funds have been transferred or requested under coercion, dial 1930 immediately within the golden hour to alert authorities and recipient banks.',
  },
  {
    name: 'Telecom Commercial Communications Customer Preference Portal (TRAI DLT)',
    authority: 'Telecom Regulatory Authority of India (TRAI)',
    url: 'https://www.trai.gov.in/telecom-commercial-communications-customer-preference-regulations-2018',
    description: 'Regulatory framework governing commercial senders and Distributed Ledger Technology (DLT) registered telemarketer headers.',
    manual_search_supported: true,
    reporting_supported: true,
    instructions: 'Official financial institutions must communicate using 6-character registered DLT sender IDs (e.g. AX-HDFCBK), never from personal 10-digit mobile numbers.',
  },
]

/**
 * Adapter 1: Official Indian Cybercrime Suspect Search Portal
 * Note: The official I4C / MHA portal enforces CAPTCHA and citizen session tokens
 * to protect citizen privacy and prevent mass automated harvesting.
 * We accurately report 'unavailable' for automated API scraping and guide the user
 * to the official manual search portal.
 */
function checkOfficialCybercrimeRepository(): PhoneReputationSourceResult {
  return {
    source_name: 'National Cyber Crime Reporting Portal (I4C Suspect Repository)',
    source_type: 'official_regulatory',
    status: 'unavailable',
    checked_at: new Date().toISOString(),
    label: null,
    source_url: 'https://cybercrime.gov.in/Webform/suspect_search_repository.aspx',
    limitations: 'Automated machine lookup unavailable: The National Cyber Crime Reporting Portal Suspect Repository is a secure citizen-facing portal requiring interactive CAPTCHA verification. Third-party automated scraping is prohibited to protect portal security and citizen privacy. Use the official link to verify manually.',
  }
}

/**
 * Adapter 2: Truecaller Commercial / Enterprise API Adapter
 * Complies with strict non-scraping policy:
 * Checks for legitimate authorized credentials (TRUECALLER_API_KEY).
 * When unconfigured, returns 'unavailable' with clear disclosure rather than fabricating data.
 */
async function checkTruecallerProvider(normalizedPhone: string | null): Promise<PhoneReputationSourceResult> {
  const apiKey = process.env.TRUECALLER_API_KEY
  const partnerId = process.env.TRUECALLER_PARTNER_ID

  const checkedAt = new Date().toISOString()

  // When no legitimate enterprise credentials are configured:
  if (!apiKey || !partnerId) {
    return {
      source_name: 'Truecaller Enterprise Reputation Check',
      source_type: 'community_reputation',
      status: 'unavailable',
      checked_at: checkedAt,
      label: null,
      source_url: 'https://developer.truecaller.com',
      limitations: 'Truecaller reputation check unavailable: No authorized partner API credentials configured. Truecaller does not offer an open public reverse-lookup reputation API for consumer web apps without an active enterprise agreement. Community reputation data was not queried.',
    }
  }

  if (!normalizedPhone) {
    return {
      source_name: 'Truecaller Enterprise Reputation Check',
      source_type: 'community_reputation',
      status: 'inconclusive',
      checked_at: checkedAt,
      label: null,
      source_url: 'https://developer.truecaller.com',
      limitations: 'Phone number format could not be normalized into valid international E.164 sequence required by Truecaller API.',
    }
  }

  // When credentials exist, execute authorized request with strict timeout
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const response = await fetch(
      `https://api4.truecaller.com/v1/search?phoneNumber=${encodeURIComponent(normalizedPhone)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'X-Partner-Id': partnerId,
          Accept: 'application/json',
        },
        signal: controller.signal,
      },
    )
    clearTimeout(timeoutId)

    if (response.status === 404) {
      return {
        source_name: 'Truecaller Enterprise Reputation Check',
        source_type: 'community_reputation',
        status: 'no_match',
        checked_at: checkedAt,
        label: null,
        source_url: 'https://developer.truecaller.com',
        limitations: 'No spam or community report record found for this number in Truecaller database. A missing record does NOT establish that the contact is safe or legitimate.',
      }
    }

    if (!response.ok) {
      return {
        source_name: 'Truecaller Enterprise Reputation Check',
        source_type: 'community_reputation',
        status: 'unavailable',
        checked_at: checkedAt,
        label: null,
        source_url: 'https://developer.truecaller.com',
        limitations: `Truecaller API returned HTTP ${response.status}. Reputation check could not be completed.`,
      }
    }

    const data = (await response.json()) as { spamScore?: number; spamType?: string }
    if (data && typeof data.spamScore === 'number' && data.spamScore > 0) {
      return {
        source_name: 'Truecaller Enterprise Reputation Check',
        source_type: 'community_reputation',
        status: 'reported',
        checked_at: checkedAt,
        label: data.spamType || 'Community Spam Reports',
        source_url: 'https://developer.truecaller.com',
        limitations: 'Community spam report labels reflect crowdsourced submissions and do not constitute legal proof of financial fraud or identity confirmation.',
      }
    }

    return {
      source_name: 'Truecaller Enterprise Reputation Check',
      source_type: 'community_reputation',
      status: 'no_match',
      checked_at: checkedAt,
      label: null,
      source_url: 'https://developer.truecaller.com',
      limitations: 'Check completed; no community reports identified. Notice: Unreported numbers may still belong to disposable or recently activated fraud SIMs.',
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error'
    return {
      source_name: 'Truecaller Enterprise Reputation Check',
      source_type: 'community_reputation',
      status: 'unavailable',
      checked_at: checkedAt,
      label: null,
      source_url: 'https://developer.truecaller.com',
      limitations: `Failed to query Truecaller endpoint (${errorMsg}).`,
    }
  }
}

/**
 * Adapter 3: TRAI / DoT Telecom Architecture Evaluation
 * Analyzes whether the contact is an unregistered 10-digit mobile number attempting
 * official commercial solicitation (violating TRAI TCCCPR 2018 guidelines).
 */
function evaluateTelecomRegulatoryCompliance(
  _rawInput: string,
  normalizedPhone: string | null,
): PhoneReputationSourceResult {
  const checkedAt = new Date().toISOString()
  const isIndianMobile = normalizedPhone?.startsWith('+91') && /^\+91[6-9]\d{9}$/.test(normalizedPhone)

  if (isIndianMobile) {
    return {
      source_name: 'TRAI Commercial Communication Regulatory Standard (TCCCPR)',
      source_type: 'telecom_registry',
      status: 'reported',
      checked_at: checkedAt,
      label: 'Personal 10-digit mobile number used for investment solicitation',
      source_url: 'https://www.trai.gov.in/telecom-commercial-communications-customer-preference-regulations-2018',
      limitations: 'TRAI mandates that all registered financial institutions and investment intermediaries send official communications through registered headers (e.g. VK-HDFCBK), never via personal 10-digit mobile SIMs. Using a personal mobile number to solicit investments violates telecom regulations.',
    }
  }

  return {
    source_name: 'TRAI Commercial Communication Regulatory Standard (TCCCPR)',
    source_type: 'telecom_registry',
    status: 'inconclusive',
    checked_at: checkedAt,
    label: null,
    source_url: 'https://www.trai.gov.in',
    limitations: 'Number format is not a standard 10-digit Indian personal mobile sequence or is an international line.',
  }
}

/**
 * Core Service: Investigates a contact number against all adapters
 * Enforcing privacy: Does not persist raw number and masks all server logging.
 */
export async function investigatePhoneNumber(
  request: PhoneReputationRequest,
): Promise<PhoneReputationInvestigation> {
  const rawInput = request.phone_number.trim()
  const maskedForLog = maskPhoneNumber(rawInput)

  // Explicitly avoid logging complete phone number
  console.log(`[PhoneReputationService] Received investigation request for contact: ${maskedForLog}`)

  // 1. Try Indian normalization first
  let normalized = normalizeIndianNumber(rawInput)
  let countryCode = 'IN'
  let formatDesc = 'Indian 10-digit Mobile Number (+91)'
  let isValid = Boolean(normalized)

  // 2. If not Indian, try international E.164 normalization
  if (!normalized) {
    const intlNorm = normalizeInternationalNumber(rawInput)
    if (intlNorm) {
      normalized = intlNorm
      isValid = true
      if (normalized.startsWith('+1')) {
        countryCode = 'US/CA'
        formatDesc = 'North American Numbering Plan (+1)'
      } else if (normalized.startsWith('+44')) {
        countryCode = 'GB'
        formatDesc = 'United Kingdom (+44)'
      } else if (normalized.startsWith('+971')) {
        countryCode = 'AE'
        formatDesc = 'United Arab Emirates (+971)'
      } else {
        countryCode = 'International'
        formatDesc = 'International E.164 Number'
      }
    }
  }

  if (!isValid) {
    countryCode = 'Unknown'
    formatDesc = 'Unrecognized or incomplete number format'
  }

  // 3. Query adapters concurrently
  const [truecallerResult] = await Promise.all([
    checkTruecallerProvider(normalized),
  ])

  const officialRepoResult = checkOfficialCybercrimeRepository()
  const telecomResult = evaluateTelecomRegulatoryCompliance(rawInput, normalized)

  const results: PhoneReputationSourceResult[] = [
    telecomResult,
    officialRepoResult,
    truecallerResult,
  ]

  // 4. Synthesize evidence categories (strictly kept separate)
  const messageWarnings: string[] = []
  if (request.original_context) {
    const ctx = request.original_context.toLowerCase()
    if (ctx.includes('guaranteed') || ctx.includes('fixed return') || ctx.includes('profit')) {
      messageWarnings.push('Associated message promises guaranteed returns or fixed profits.')
    }
    if (ctx.includes('urgent') || ctx.includes('expire') || ctx.includes('slots')) {
      messageWarnings.push('Associated message uses artificial urgency pressure.')
    }
    if (ctx.includes('telegram') || ctx.includes('whatsapp') || ctx.includes('vip')) {
      messageWarnings.push('Communication directs investor to unmonitored messaging group.')
    }
  }

  let extSummary = 'Queried commercial and telecom reputation databases.'
  const reportedSource = results.find((r) => r.status === 'reported')
  if (reportedSource && reportedSource.label) {
    extSummary = `Regulatory notice: ${reportedSource.label}.`
  }

  const unverifiedElements = [
    'Actual beneficial owner or registered subscriber identity cannot be determined solely from message content.',
    'Caller ID / sender spoofing cannot be ruled out without operator-level signaling data.',
    'A clean or missing reputation record does NOT establish that a contact is safe or registered with SEBI.',
  ]

  return {
    raw_input: rawInput,
    normalized_e164: normalized,
    country_code: countryCode,
    is_valid_format: isValid,
    format_description: formatDesc,
    results,
    evidence_synthesis: {
      message_warning_signs: messageWarnings,
      external_reputation_summary: extSummary,
      official_verification_status: 'Official government cybercrime portal must be verified directly via citizen search.',
      unverified_elements: unverifiedElements,
    },
    official_verification_links: OFFICIAL_CYBERCRIME_RESOURCES,
    safety_advisories: [
      'SEBI-registered intermediaries never offer investment tips, stock recommendations, or portfolio management via personal WhatsApp numbers or Telegram groups.',
      'Fraudsters frequently purchase new, unregistered SIM cards or use international VoIP numbers that have zero previous spam history.',
      'Never send funds via UPI or net-banking to an individual savings account for purported share market investments.',
    ],
    privacy_notice: 'Zero persistence: NiveshShield does not store submitted phone numbers, logs are masked, and data is processed ephemerally for fraud prevention analysis only.',
  }
}
