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
export function isEducationalOrDisclaimer(input: string): boolean {
  if (!input) return false
  const lower = input.toLowerCase().trim()

  // 1. Detect pure financial literacy questions (e.g., "What is...", "How does...", "Difference between...")
  const isLiteracyQuestion =
    /^(what|how|why|can|explain|difference|compare)\s+.*(mutual fund|etf|stock|equity|bond|sip|nav|demat)/i.test(
      lower,
    )

  // 2. Detect standard statutory disclaimers
  const isStatutoryDisclaimer =
    /disclaimer\s*:.*market risk|read all scheme documents carefully/i.test(lower)

  return isLiteracyQuestion || isStatutoryDisclaimer
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
      summary:
        'Financial Education & Statutory Disclosure: Content is strictly informational or standard regulatory disclaimer without promotional fraud vectors.',
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
      summary:
        'Zero-Trust Alert: Impersonation of financial institution executives or regulators detected.',
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
      summary:
        'Zero-Trust Alert: Fabricated investment gains and unauthorized IPO allotment claims detected.',
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

    // NEW: Clean pass for everyday non-financial chatter (e.g., "hello")
    if (aiResult.is_financial_context === false) {
      const fallback = runLocalFallbackRules(rawInput)
      return {
        ...fallback,
        ...aiResult,
        verdict: '🟢 GREEN',
        scam_detected: false,
        confidence_score: 0.0,
        scam_stage: 'none',
        rationale_for_dossier:
          'Neutral Context: This is everyday conversation, not a financial proposition.',
        overall_status: 'no_obvious_warning_signs',
        summary:
          'Neutral Context: This is everyday conversation, not a financial proposition.',
      }
    }

    // Default Zero-Trust Fallback (Only triggers if it IS financial but unverified)
    const fallback = runLocalFallbackRules(rawInput)
    return {
      ...fallback,
      ...aiResult,
      verdict: '🟡 AMBER',
      scam_detected: false,
      confidence_score: 0.5,
      scam_stage: 'none',
      rationale_for_dossier:
        'Zero-Trust Rule: Unverified external communication. Exercise caution.',
      overall_status:
        fallback.overall_status === 'warning_signs_found'
          ? 'warning_signs_found'
          : 'insufficient_evidence',
    }
  } catch {
    // Stage 2 Failure / Timeout Fallback
    const fallback = runLocalFallbackRules(rawInput)
    const isCasual =
      /^(hello|hi|hey|good morning|good evening|good afternoon|how are you|namaste|sup)\b/i.test(
        lowerInput.trim(),
      ) ||
      (!/(invest|money|profit|return|stock|fund|share|rupee|inr|usd|crypto|bank|demat|broker|tax|fee|allotment|deposit|account|upi|card|p&l)/i.test(
        lowerInput,
      ) &&
        lowerInput.length < 50)

    if (isCasual) {
      return {
        ...fallback,
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

    return {
      verdict: fallback.overall_status === 'warning_signs_found' ? '🔴 RED' : '🟡 AMBER',
      ...fallback,
    }
  }
}
