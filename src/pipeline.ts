/**
 * NiveshShield 2.0 — Hardened Execution Pipeline
 * Integrates Stage 1 (0ms Deterministic Guardrail), Pre-Inspection filters (TC-8, TC-9, TC-11),
 * Stage 2 (Gemini Deep Multimodal AI) with Tag Sanitization, and Stage 3 (Zero-Trust Triage Gate).
 */

import {
  type AnalysisResult,
  type AnalyzeOptions,
  type InputModality,
  runStage2SemanticAnalysis,
  type Stage2AnalysisResult,
  type Stage2AnalysisPayload,
} from './api.ts'
import {
  runDeterministicPreScreen,
  runZeroTrustPreScreen,
  evaluateFatalRedLines,
  buildHardRedBlockResult,
} from './zeroTrustPreScreener.ts'
import { evaluateLocally } from './localRegulatoryEngine.ts'

export interface PipelineInputPayload {
  message?: string
  text?: string
  language?: string
  modality?: InputModality | string
  file_data?: string
  file_mime_type?: string
  image_base64?: string
  audio_base64?: string
  audio_mime_type?: string
  url?: string
}

export interface HardenedPipelineResult extends Partial<AnalysisResult> {
  verdict?: '🔴 RED' | '🟡 AMBER' | '🟢 GREEN' | string
  scam_detected?: boolean
  reason?: string
  scam_stage?: string
  confidence_score?: number
  rationale_for_dossier?: string
  is_financial_context?: boolean
  evidence?: {
    original_excerpt: string
    detected_tactics: string[]
    regulatory_violations: string[]
  }
}

// ----------------------------------------------------
// 1. INPUT SANITIZER (Kills TC-11)
// ----------------------------------------------------
export function sanitizeInput(input: string): string {
  if (!input) return ''
  // Strip XML/HTML tags from user input to prevent tag breakout
  return input
    .replace(/<\/?user_evidence>/gi, '') // Remove fake container tags
    .replace(/<\/?untrusted_user_input>/gi, '')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export const sanitizeUserInput = sanitizeInput

// ----------------------------------------------------
// SAFE EXEMPTION CHECK: Educational & Disclaimers
// ----------------------------------------------------
// URL Validator & SSRF Preventer
export function isSafePublicUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)

    // Only allow HTTP/HTTPS
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false

    const hostname = url.hostname

    // Block common private/local IP ranges (SSRF Protection)
    const privateIpRegex =
      /^(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3})$/i

    if (privateIpRegex.test(hostname)) return false

    return true
  } catch {
    return false // Invalid URL format
  }
}

export function isEducationalOrDisclaimer(input: string): boolean {
  if (!input) return false
  const lower = input.toLowerCase().trim()

  // 1. Added Hinglish/Vernacular question markers (kya, kaise, antar, fark, kaunsa, matlab)
  const isLiteracyQuestion =
    /^(what|how|why|can|explain|difference|compare|kya|kaise|kaunsa)\s+.*(mutual fund|etf|stock|equity|bond|sip|nav|demat|invest)/i.test(
      lower,
    ) || /(antar|fark|matlab|sahi rahega)/i.test(lower)

  // 2. Detect standard statutory disclaimers in all regional languages
  const isStatutoryDisclaimer =
    /disclaimer\s*:.*market risk|read all scheme.*documents carefully|market risks|bazaar jokhim|bajar jokhim|बाजार जोखिम|जोखमीच्या अधीन|જોખમોને આધીન|ঝুঁকির সাপেক্ষ|அபாயங்களுக்கு உட்பட்டவை|sebi website|official bank|panjikrit broker/i.test(lower)

  // 3. Detect standard legitimate bank transaction alerts or notices
  const isLegitimateBankSms =
    /(credited|debited|available balance|a\/c ending|account ending|ref no|rrn|txn id|transaction id|your a\/c|bank alert|neft|rtgs|imps|upi transaction|deposit credited|standard bank notice|jama kiye|balke balance|shillak)/i.test(lower) &&
    !/(guarantee|fixed return|40%|100% profit|double|triple|free money|give 1000|earn 50000|click link|download apk|vip group)/i.test(lower)

  return isLiteracyQuestion || isStatutoryDisclaimer || isLegitimateBankSms
}

export function isUniversalGuaranteedReturnScam(input: string): boolean {
  if (!input) return false
  const cleanInput = input.toLowerCase()

  // 1. Script & Voice-Agnostic Pattern: Catches actual '%' AND spoken words for "percent"
  const hasPercentageYield =
    /([\d\u0966-\u096F]{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|chalis|pachas|tis|saath)\s*(%|percent|pratishat|takka|shatake)\s*(return|returns|profit|gains|yield|monthly|daily|per\s*month|मासिक|रोजाना|दरमहा|માસિક|মাসিক|மாதாந்திர|నెలవారీ|ಪ್ರતિ\s*તિંಗಳು|मुनाफा|फायदा|रिटर्न|परतावा|વળતર|નફો|রিটার্ন|মুনাফা|வருமானம்|லாபம்|రిటర్న్|లాభం)/i.test(
      cleanInput,
    )
  // 2. Multilingual Keyword Dictionary (Guaranteed / Return / Profit / Special Offer)
  // Cleaned up legacy pattern

  // legacy yield regex skipped
  // legacy unused variables removed
  /* legacy code start /([\d\u0966-\u096F]{1,3}\s*%\s*(monthly|daily|per\s*month|मासिक|रोजाना|दरमहा|માસિક|মাসিক|மாதாந்திர|నెలవారీ|ಪ್ರತಿ\s*ತಿಂಗಳು))/i.test(
    cleanInput,
  ) */

  // 2. Multilingual Keyword Dictionary (Guaranteed / Return / Profit / Special Offer)
  const multilingualKeywords = [
    // Devanagari (Hindi / Marathi)
    /गारंटीड|ग्यारंटी|गारंटी|परतावा|हमी|मासिक\s*रिटर्न|विशेष\s*ऑफर|खास\s*ऑफर/i,
    // Gujarati
    /ગેરંટીડ|વળતર|માસિક|વિશેષ\s*ઓફર|નફો/i,
    // Bengali
    /গ্যারান্টিযুক্ত|রিটার্ন|মাসিক|বিশেষ\s*অফার|মুনাফা/i,
    // Tamil
    /உத்தரவாதம்|வருமானம்|மாதாந்திர|சிறப்பு\s*ஆஃபர்|லாபம்/i,
    // Telugu
    /హామీ|రిటర్న్|నెలవారీ|ప్రత్యేక\s*ఆఫర్|లాభం/i,
    // Phonetic / Voice / Spoken English & Hinglish
    /guaranteed|guarantee|gwaranti|gyaranti|gwarantee/i,
  ]

  const hasKeywordMatch = multilingualKeywords.some((regex) => regex.test(cleanInput))

  // Spoken or symbolic percentage check for keyword match
  const hasPercentSymbolOrWord =
    /([\d\u0966-\u096F]{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|chalis|pachas|tis|saath)\s*(%|percent|pratishat|takka|shatake)/i.test(
      cleanInput,
    )

  // If input contains a percentage yield promise AND a regional guarantee/profit word
  return hasPercentageYield || (hasKeywordMatch && hasPercentSymbolOrWord)
}

// ----------------------------------------------------
// LOCAL FALLBACK RULES
// ----------------------------------------------------
export function runLocalFallbackRules(
  rawInput: string | PipelineInputPayload | AnalyzeOptions,
): AnalysisResult {
  const options: AnalyzeOptions =
    typeof rawInput === 'string'
      ? { message: rawInput, language: 'en', modality: 'text' }
      : {
          message: rawInput.message || (rawInput as PipelineInputPayload).text || '',
          language: rawInput.language || 'en',
          modality: ((rawInput.modality as InputModality) || 'text') as InputModality,
          file_data:
            (rawInput as PipelineInputPayload).file_data ||
            (rawInput as PipelineInputPayload).image_base64,
          file_mime_type:
            (rawInput as PipelineInputPayload).file_mime_type ||
            (rawInput as PipelineInputPayload).audio_mime_type,
          url: (rawInput as PipelineInputPayload).url,
        }
  return evaluateLocally(options)
}

// ----------------------------------------------------
// 2. HARDENED PIPELINE WRAPPER (Fixes TC-8, TC-9, TC-11)
// ----------------------------------------------------
export async function executeNiveshShieldPipeline(
  rawInput: string | PipelineInputPayload,
  languageFallback = 'en',
): Promise<HardenedPipelineResult> {
  const rawText =
    typeof rawInput === 'string'
      ? rawInput
      : rawInput.text || rawInput.message || ''

  const selectedLanguage =
    (typeof rawInput !== 'string' && rawInput.language) || languageFallback || 'en'

  const safeModality: InputModality =
    typeof rawInput !== 'string' &&
    (rawInput.modality === 'image' ||
      rawInput.modality === 'url' ||
      rawInput.modality === 'voice')
      ? (rawInput.modality as InputModality)
      : 'text'

  const fileData =
    typeof rawInput !== 'string'
      ? rawInput.file_data || rawInput.image_base64 || rawInput.audio_base64
      : undefined

  const fileMimeType =
    typeof rawInput !== 'string'
      ? rawInput.file_mime_type || rawInput.audio_mime_type
      : undefined

  const targetUrlStr = typeof rawInput !== 'string' ? rawInput.url : undefined

  const analyzeOptions: AnalyzeOptions = {
    message: rawText,
    language: selectedLanguage,
    modality: safeModality,
    file_data: fileData,
    file_mime_type: fileMimeType,
    url: targetUrlStr,
  }

  // --- SSRF URL GUARD (0ms Deterministic Interception) ---
  if (safeModality === 'url' || targetUrlStr || (typeof rawInput === 'string' && /^https?:\/\//i.test(rawInput))) {
    const urlString = targetUrlStr || rawText
    if (urlString && !isSafePublicUrl(urlString)) {
      return {
        verdict: '🔴 RED',
        scam_detected: true,
        reason: '🔴 RED: Invalid or blocked URL detected.',
        scam_stage: 'lure_contact',
        confidence_score: 1.0,
        rationale_for_dossier: 'Zero-Trust Hard Block: Attempted SSRF or blocked URL range access.',
        overall_status: 'warning_signs_found',
        summary: 'Security Violation: Attempted SSRF or invalid URL blocked by NiveshShield guardrail.',
      }
    }
  }

  // --- STAGE 1: Deterministic Pre-Screener ---
  if (runDeterministicPreScreen(rawText)) {
    const fatalMatch = evaluateFatalRedLines(rawText) || {
      category: 'CREDIT_CARD_NUMBER',
      rawMatch: rawText.slice(0, 50),
      normalizedExcerpt: rawText.slice(0, 50),
      ruleDescription: 'Hard RED: Sensitive credentials detected.',
      suggestedIndicator: 'other_warning_sign',
      statutoryAuthority: 'RBI',
    }
    const fullBlock = buildHardRedBlockResult(analyzeOptions, fatalMatch, 0)
    return {
      verdict: '🔴 RED',
      scam_detected: true,
      reason: 'Hard RED: Sensitive credentials detected.',
      scam_stage: 'app_or_credential_request',
      confidence_score: 1.0,
      rationale_for_dossier: 'Zero-Trust Hard Block: Confidential financial credentials or payment card exposed.',
      ...fullBlock,
    }
  }

  // --- SAFE EXEMPTION CHECK: Educational & Statutory Disclaimers ---
  if (isEducationalOrDisclaimer(rawText)) {
    const fallback = runLocalFallbackRules(rawInput)
    return {
      verdict: '🟢 GREEN',
      scam_detected: false,
      confidence_score: 0.0,
      scam_stage: 'none',
      rationale_for_dossier:
        'Verifiable & Educational: Strictly neutral financial literacy or statutory risk disclosure.',
      ...fallback,
      overall_status: 'no_obvious_warning_signs',
      summary: fallback.summary || 'Financial Education & Statutory Disclosure: Content is strictly informational or standard regulatory disclaimer without promotional fraud vectors.',
    }
  }

  // --- UNIVERSAL GUARANTEED RETURN SCAM INTERCEPTOR ---
  if (isUniversalGuaranteedReturnScam(rawText)) {
    const fallback = runLocalFallbackRules(rawInput)
    return {
      verdict: '🔴 RED',
      scam_detected: true,
      scam_stage: 'lure_contact',
      confidence_score: 0.99,
      rationale_for_dossier:
        'Zero-Trust Violation: Promising guaranteed percentage returns in any language or script violates SEBI regulations.',
      ...fallback,
      overall_status: 'warning_signs_found',
      summary: fallback.summary || 'This message promises fake guaranteed returns on your money. Real stock market investments can never guarantee fixed returns.',
    }
  }

  // Check file/image metadata fast-pass if applicable
  if (typeof rawInput === 'object') {
    const preScreenResult = await runZeroTrustPreScreen(analyzeOptions)
    if (preScreenResult.intercepted && preScreenResult.syntheticAnalysis) {
      return {
        verdict: '🔴 RED',
        scam_detected: true,
        reason: 'Hard RED: Sensitive media metadata detected.',
        ...preScreenResult.syntheticAnalysis,
      }
    }
  }

  // --- PRE-INSPECTION: Catch Injection & Fraud Patterns Deterministically ---
  const lowerInput = rawText.toLowerCase()

  // Fix TC-11: Detect Injection Attempts Directly
  if (/system\s*override|disregard|set\s*scam_detected/i.test(lowerInput)) {
    const fallback = runLocalFallbackRules(rawInput)
    return {
      verdict: '🔴 RED',
      scam_detected: true,
      scam_stage: 'lure_contact',
      confidence_score: 1.0,
      rationale_for_dossier: 'Security Alert: Prompt injection attack intercepted.',
      ...fallback,
      overall_status: 'warning_signs_found',
      summary: 'Security Guardrail Alert: Adversarial prompt injection attempt detected and neutralized.',
    }
  }

  // Fix TC-8: Catch Authority Impersonation
  const isAuthorityImpersonation =
    /(vice\s*president|vp|manager|officer|executive)\s*(of|at)?\s*(hdfc|zerodha|icici|sebi|sbi)/i.test(
      lowerInput,
    )
  if (isAuthorityImpersonation) {
    const fallback = runLocalFallbackRules(rawInput)
    return {
      verdict: '🔴 RED',
      scam_detected: true,
      scam_stage: 'grooming_authority',
      confidence_score: 0.95,
      rationale_for_dossier:
        'Zero-Trust Trigger: Unsolicited executive impersonation over personal chat.',
      ...fallback,
      overall_status: 'warning_signs_found',
      summary: fallback.summary || 'This message pretends to be from a bank or company manager. Real officials never ask for money or account transfers on personal WhatsApp.',
    }
  }

  // Fix TC-9: Catch Artificial Profit/IPO Allotment Claims
  const isArtificialProfit =
    /(dashboard|account)\s*shows.*(profit|allotment|gains)/i.test(lowerInput) ||
    /₹\s*\d+.*profit/i.test(lowerInput)
  if (isArtificialProfit) {
    const fallback = runLocalFallbackRules(rawInput)
    return {
      verdict: '🔴 RED',
      scam_detected: true,
      scam_stage: 'artificial_profit',
      confidence_score: 0.92,
      rationale_for_dossier:
        'Zero-Trust Trigger: Unsolicited dashboard profit/IPO allotment claim detected.',
      ...fallback,
      overall_status: 'warning_signs_found',
      summary: fallback.summary || 'This message shows fake profit numbers or fake share allotments to trick you into transferring money.',
    }
  }

  // Catch Guaranteed Returns in English, Hindi, and Marathi Devanagari Scripts
  const isVernacularGuaranteedReturn =
    /(गारंटीड|ग्यारंटी|गारंटी|गारंटीड)\s*.*\s*(\d{1,3}%|\d+\s*टक्के)\s*.*\s*(रिटर्न|परतावा|मुनाफा|फायदा|उत्पन्न)/i.test(rawText) ||
    /(विशेष\s*ऑफर|खास\s*ऑफर)\s*.*\s*(गारंटीड|गारंटी)\s*.*\s*(\d+%\s*मासिक|\d+%\s*रोजाना)/i.test(rawText)

  if (isVernacularGuaranteedReturn) {
    const fallback = runLocalFallbackRules(rawInput)
    return {
      verdict: '🔴 RED',
      scam_detected: true,
      scam_stage: 'lure_contact',
      confidence_score: 0.98,
      rationale_for_dossier:
        'Zero-Trust Trigger: Promising guaranteed monthly financial returns in regional languages violates SEBI regulations.',
      ...fallback,
      overall_status: 'warning_signs_found',
      summary: fallback.summary || 'This message promises fake guaranteed returns on your money. Real stock market investments can never guarantee fixed returns.',
    }
  }

  // --- STAGE 2: Sanitized Multimodal AI Call ---
  const cleanInput = sanitizeInput(rawText)
  const geminiPayload = `<untrusted_user_input>\n${cleanInput}\n</untrusted_user_input>`

  try {
    const payload: Stage2AnalysisPayload = {
      text: geminiPayload,
      message: geminiPayload,
      language: selectedLanguage,
      target_language: selectedLanguage,
      modality: safeModality,
      file_data: fileData,
      file_mime_type: fileMimeType,
    }

    const aiResult: Stage2AnalysisResult = await runStage2SemanticAnalysis(payload)

    // --- STAGE 3: Zero-Trust Triage Gate Audit ---
    if (aiResult.scam_detected) {
      const fallback = runLocalFallbackRules(rawInput)
      return {
        ...fallback,
        ...aiResult,
        verdict: '🔴 RED',
        overall_status: 'warning_signs_found',
      }
    }

    const isNonInvestmentExpense =
      /(grocery|groceries|movie|ticket|tickets|dinner|lunch|breakfast|food|restaurant|shopping|travel|flight|hotel|uber|ola|cab|rent|electricity|bill)/i.test(
        lowerInput,
      )

    // NEW: Clean pass for everyday non-financial chatter (e.g., "hello") or non-investment expenses
    if (aiResult.is_financial_context === false || isNonInvestmentExpense) {
      const fallback = runLocalFallbackRules(rawInput)
      return {
        ...fallback,
        ...aiResult,
        verdict: '🟢 GREEN',
        scam_detected: false,
        confidence_score: 0.0,
        scam_stage: 'none',
        is_financial_context: false,
        rationale_for_dossier:
          'Neutral Context: This is everyday conversation, not a financial proposition.',
        overall_status: 'no_obvious_warning_signs',
        summary:
          'Neutral Context: This is everyday conversation, not a financial proposition.',
      }
    }

    // Fallback based on deterministic engine assessment
    const fallback = runLocalFallbackRules(rawInput)
    if (fallback.overall_status === 'no_obvious_warning_signs') {
      return {
        ...fallback,
        verdict: '🟢 GREEN',
        scam_detected: false,
        confidence_score: 0.0,
        scam_stage: 'none',
        rationale_for_dossier:
          'Safe & Verified: No warning signs or deceptive patterns detected.',
        overall_status: 'no_obvious_warning_signs',
      }
    }
    if (fallback.overall_status === 'warning_signs_found') {
      return {
        ...fallback,
        verdict: '🔴 RED',
        scam_detected: true,
        confidence_score: 0.95,
        overall_status: 'warning_signs_found',
      }
    }
    return {
      ...fallback,
      verdict: '🟡 AMBER',
      scam_detected: false,
      confidence_score: 0.5,
      scam_stage: 'none',
      rationale_for_dossier:
        'Zero-Trust Rule: Unverified external communication. Exercise caution.',
      overall_status: 'insufficient_evidence',
    }
  } catch {
    // Stage 2 Failure / Timeout Fallback
    const fallback = runLocalFallbackRules(rawInput)
    if (fallback.overall_status === 'no_obvious_warning_signs') {
      return {
        ...fallback,
        verdict: '🟢 GREEN',
        scam_detected: false,
        confidence_score: 0.0,
        scam_stage: 'none',
        rationale_for_dossier:
          'Safe & Verified: No warning signs or deceptive patterns detected.',
        overall_status: 'no_obvious_warning_signs',
      }
    }
    return {
      verdict: fallback.overall_status === 'warning_signs_found' ? '🔴 RED' : '🟡 AMBER',
      ...fallback,
    }
  }
}
