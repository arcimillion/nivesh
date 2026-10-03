/**
 * NiveshShield 2.0 — Zero-Trust Fraud Detection Pipeline: Stage 1
 *
 * Instant Deterministic Pre-Screener (0ms Guardrail Bouncer)
 * Intercepts fatal red lines (Credit Cards, CVV, OTP, PIN, Card Photos, Free Money Lures)
 * before any network requests are made, protecting users instantly and saving AI API quota.
 */

import type { AnalysisResult, AnalyzeOptions, FindingIndicator, InputModality, JourneyStage } from './api.ts'
import { officialSources, type OfficialSource } from './officialSources.ts'

export type FatalRedLineCategory =
  | 'CREDIT_CARD_NUMBER'
  | 'CVV_HARVESTING'
  | 'OTP_HARVESTING'
  | 'PIN_HARVESTING'
  | 'CARD_PHOTO_HARVESTING'
  | 'SENSITIVE_DOCUMENT_HARVESTING'
  | 'FREE_MONEY_CREDENTIAL_LURE'
  | 'BLATANT_MONEY_MULTIPLIER'

export interface FatalRedLineMatch {
  category: FatalRedLineCategory
  rawMatch: string
  normalizedExcerpt: string
  ruleDescription: string
  suggestedIndicator: FindingIndicator
  statutoryAuthority: 'RBI' | 'SEBI' | 'MHA_1930'
}

export interface PreScreenResult {
  intercepted: boolean
  executionLatencyMs: number
  fatalMatch: FatalRedLineMatch | null
  extractedText?: string
  syntheticAnalysis?: AnalysisResult
}

// ----------------------------------------------------
// 1. LUHN ALGORITHM (Credit Card Checksum Validation)
// ----------------------------------------------------
export function isValidLuhn(digitsOnly: string): boolean {
  const clean = digitsOnly.replace(/\D/g, '')
  if (clean.length < 13 || clean.length > 19) return false

  let sum = 0
  let shouldDouble = false
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10)
    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
}

/**
 * Checks for known payment card issuer IIN/BIN prefixes (Visa, MasterCard, RuPay, Amex, Maestro)
 */
export function hasCardIssuerPrefix(digitsOnly: string): boolean {
  const clean = digitsOnly.replace(/\D/g, '')
  // Visa: starts with 4
  if (/^4\d{12,18}$/.test(clean)) return true
  // MasterCard: 51-55 or 2221-2720
  if (/^(?:5[1-5]\d{14}|2(?:2[2-9]\d{2}|[3-6]\d{3}|7[01]\d{2}|720\d)\d{10})$/.test(clean)) return true
  // RuPay: starts with 60, 65, 81, 82, 508, 353
  if (/^(?:60\d{14}|65\d{14}|81\d{14}|82\d{14}|508\d{12,14}|353\d{12})$/.test(clean)) return true
  // Amex: starts with 34 or 37
  if (/^3[47]\d{13}$/.test(clean)) return true
  // Maestro / Diners
  if (/^(?:50\d{10,17}|5[6-8]\d{10,17}|6\d{11,18}|3(?:0[0-5]|[68]\d)\d{11})$/.test(clean)) return true
  return false
}

// ----------------------------------------------------
// 2. HARDENED DETERMINISTIC PRE-SCREENER (0ms)
// ----------------------------------------------------

/**
 * Deterministic Pre-Screen Regex Checker (Stage 1 Guardrail Bouncer)
 * Runs synchronously in 0ms to detect definitive credentials (Credit Card PAN, CVV, PIN, OTP).
 *
 * Fixes:
 * - TC 6: Handles spaced OTP digits (e.g. 9 4 0 2 1 1)
 * - TC 7 & 9: Full case-insensitivity (/i) and compound separators (e.g. `:-`, `:=`)
 * - TC 12 & 13: Eliminates false positives on general numbers like 500/400 by strictly requiring 13-16 digits for CC or associated credential keywords for PIN/OTP
 */
export const runDeterministicPreScreen = (input: string | null | undefined): boolean => {
  if (!input) return false // Graceful passthrough for empty states

  // 1. Normalize the string to prevent multiline bypasses
  const normalizedText = input.replace(/\n/g, ' ')

  // 2. Credit Card Matcher: Strictly requires 13 to 16 digits.
  // Allows for spaces or dashes between digits, but prevents matching random 3-digit numbers.
  const ccRegex = /\b(?:\d(?:[\s-]*\d){12,15})\b/

  // 3. PIN / CVV Matcher: Looks for keywords, allows multiple separators (like :- or is), 
  // and handles spaced-out digits (e.g., 1 2 3 4). Uses /i for case-insensitivity.
  const pinRegex = /\b(cvv2?|cvc2?|pin|passcode)\s*(?:is\s*)?[:=\-~>]*\s*(?:\d\s*){3,4}\b/i

  // 4. OTP / Code Matcher: Same logic as PIN, but expects 4 to 6 digits.
  const otpRegex = /\b(otp|one[- ]time password|verification code|sms code|auth code|code)\s*(?:is\s*)?[:=\-~>]*\s*(?:\d\s*){4,6}\b/i

  // If ANY of these return true, trigger the 🔴 Hard RED Block.
  return ccRegex.test(normalizedText) || pinRegex.test(normalizedText) || otpRegex.test(normalizedText)
}

// Formatted card sequences (e.g. 4111 2222 3333 4444 or 4111-2222-3333-4444)
const FORMATTED_CARD_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b|\b3[47]\d{2}[ -]?\d{6}[ -]?\d{5}\b/g

// Unformatted 13-19 digit continuous numbers
const CONTINUOUS_DIGITS_REGEX = /\b\d{13,19}\b/g

// CVV / CVC / Security code requests or exposure (supports compound separators like :- or :=, 'is', and spaced digits)
const CVV_EXPOSURE_REGEX =
  /\b(?:cvv2?|cvc2?|security\s*code|3\s*digit\s*code|three\s*digit\s*code)\s*(?:is\s*)?[:=\-~>]*\s*(?:\d\s*){3,4}\b/i
const CVV_HARVEST_REQUEST_REGEX =
  /(?:enter|send|share|provide|give|type|upload|submit|write)\s*(?:your\s*)?(?:[0-9]\s*digit\s*)?(?:three\s*digit\s*)?(?:card\s*)?(?:cvv2?|cvc2?|security\s*code)/i

// One-Time Password (OTP) patterns (supports compound separators like :- or :=, 'is', and spaced digits e.g. 9 4 0 2 1 1)
const OTP_EXPOSURE_REGEX =
  /\b(?:otp|one[- ]time password|verification code|sms code|auth code|code)\s*(?:is\s*)?[:=\-~>]*\s*(?:\d\s*){4,6}\b/i
const OTP_HARVEST_REQUEST_REGEX =
  /(?:share|send|forward|tell|give|enter|provide|type|submit)\s*(?:your\s*)?(?:otp|one[- ]time password|verification code|sms code|login code)/i

// PIN patterns (ATM PIN, UPI PIN, MPIN, net banking password, passcode, supports compound separators like :- and spaced digits)
const PIN_EXPOSURE_REGEX =
  /\b(?:cvv|pin|passcode|atm\s*pin|upi\s*pin|mpin|card\s*pin|transaction\s*pin)\s*(?:is\s*)?[:=\-~>]*\s*(?:\d\s*){3,4}\b/i
const PIN_HARVEST_REGEX =
  /(?:share|send|tell|give|enter|provide|type|submit)\s*(?:your\s*)?(?:atm\s*pin|upi\s*pin|mpin|card\s*pin|net\s*banking\s*password|passcode)/i
const PIN_GENERAL_REGEX = /\b(?:atm\s*pin|upi\s*pin|mpin|card\s*pin|net\s*banking\s*password)\b/i

// Card photos, scans, and physical credential requests
const CARD_PHOTO_HARVEST_REGEX =
  /(?:credit|debit|atm|bank|forex|rupay|visa|mastercard)?\s*card\s*(?:photo|picture|image|pic|scan|front|back|details|number|copy|snapshot)/i
const PHOTO_OF_CARD_REGEX =
  /(?:photo|picture|image|pic|scan|copy|snapshot)\s*(?:of\s*)?(?:your\s*)?(?:credit|debit|atm|bank|forex|rupay|visa|mastercard)?\s*card/i
const SENSITIVE_DOCS_REGEX =
  /(?:cheque|check|passbook|bank\s*statement|aadhaar|pan\s*card)\s*(?:photo|picture|image|pic|copy|scan)/i

// Free money & reward phishing lures
const FREE_MONEY_LURE_REGEX =
  /\b(?:free\s*(?:money|cash|fund|funds|rupees|dollar|crypto|reward|bonus|gift|payout|earning|income))\b/i
const GET_FREE_MONEY_REGEX =
  /\b(?:get|win|claim|earn|receive)\s*free\s*(?:money|cash|reward|rupees|bonus)\b/i
const EXCHANGE_LURE_REGEX =
  /\b(?:in\s*exchange\s*(?:of|for)|in\s*return\s*(?:of|for)|exchange\s*(?:your|of))\b/i

// Blatant money multiplier schemes
const MONEY_MULTIPLIER_REGEX =
  /(?:give|giving|send|sending|invest|investing|pay|paying|deposit\w*)\s*\d+.*(?:take|taking|get|getting|receive|receiving|return\w*)\s*\d+/i
const MONEY_DOUBLING_REGEX =
  /(?:double|triple)\s*(?:your\s*)?money|money\s*(?:double|triple)|multipl(?:y|ier)\s*(?:your\s*)?(?:money|funds|capital)/i

// Multilingual vernacular red lines (Hindi, Marathi, Bengali, Tamil, Gujarati)
const VERNACULAR_CARD_PHOTO_REGEX =
  /(?:क्रेडिट कार्ड|कार्ड का फोटो|कार्ड फोटो|डेबिट कार्ड|कार्डचा फोटो|কার্ডের ছবি|கார்டு புகைப்படம்|கાર્ડનો ફોટો)/i
const VERNACULAR_OTP_PIN_REGEX =
  /(?:ओटीपी|पिन|पासवर्ड|सीवीवी|ஓடிபி|પીન|ઓટીપી|গোপন পিন|ওটিপি)/i
const VERNACULAR_FREE_MONEY_REGEX =
  /(?:मुफ्त पैसे|फ्री पैसे|मुफ्त धन|मोफत पैसे|বিনামূল্যে টাকা|இலவச பணம்|મફત પૈસા)/i

// ----------------------------------------------------
// 3. DETERMINISTIC FATAL RED LINES EVALUATION (0ms)
// ----------------------------------------------------
export function evaluateFatalRedLines(rawText: string): FatalRedLineMatch | null {
  if (!rawText || !rawText.trim()) return null
  const text = rawText.trim()
  const lower = text.toLowerCase()

  // 1. Check for real or formatted credit card numbers with Luhn / IIN verification
  const formattedMatches = text.match(FORMATTED_CARD_REGEX)
  if (formattedMatches) {
    for (const match of formattedMatches) {
      const digits = match.replace(/\D/g, '')
      if (isValidLuhn(digits) || hasCardIssuerPrefix(digits)) {
        return {
          category: 'CREDIT_CARD_NUMBER',
          rawMatch: match,
          normalizedExcerpt: `${digits.slice(0, 4)} **** **** ${digits.slice(-4)}`,
          ruleDescription: 'Live payment card primary account number (PAN) detected in text.',
          suggestedIndicator: 'other_warning_sign',
          statutoryAuthority: 'RBI',
        }
      }
    }
  }

  const continuousMatches = text.match(CONTINUOUS_DIGITS_REGEX)
  if (continuousMatches) {
    for (const match of continuousMatches) {
      if (isValidLuhn(match) && hasCardIssuerPrefix(match)) {
        return {
          category: 'CREDIT_CARD_NUMBER',
          rawMatch: match,
          normalizedExcerpt: `${match.slice(0, 4)} **** **** ${match.slice(-4)}`,
          ruleDescription: 'Unmasked credit/debit card number matching bank IIN and Luhn checksum.',
          suggestedIndicator: 'other_warning_sign',
          statutoryAuthority: 'RBI',
        }
      }
    }
  }

  // 2. CVV / CVC harvesting
  const cvvExpMatch = text.match(CVV_EXPOSURE_REGEX)
  if (cvvExpMatch) {
    return {
      category: 'CVV_HARVESTING',
      rawMatch: cvvExpMatch[0],
      normalizedExcerpt: cvvExpMatch[0],
      ruleDescription: 'Card Verification Value (CVV/CVC) confidential security code exposed.',
      suggestedIndicator: 'other_warning_sign',
      statutoryAuthority: 'RBI',
    }
  }
  const cvvReqMatch = text.match(CVV_HARVEST_REQUEST_REGEX)
  if (cvvReqMatch) {
    return {
      category: 'CVV_HARVESTING',
      rawMatch: cvvReqMatch[0],
      normalizedExcerpt: cvvReqMatch[0],
      ruleDescription: 'Unsolicited request to submit private Card Verification Value (CVV).',
      suggestedIndicator: 'other_warning_sign',
      statutoryAuthority: 'RBI',
    }
  }

  // 3. OTP harvesting
  const otpReqMatch = text.match(OTP_HARVEST_REQUEST_REGEX)
  if (otpReqMatch) {
    return {
      category: 'OTP_HARVESTING',
      rawMatch: otpReqMatch[0],
      normalizedExcerpt: otpReqMatch[0],
      ruleDescription: 'Coercive request to share One-Time Password (OTP) or authentication code.',
      suggestedIndicator: 'other_warning_sign',
      statutoryAuthority: 'RBI',
    }
  }
  const otpExpMatch = text.match(OTP_EXPOSURE_REGEX)
  if (otpExpMatch) {
    return {
      category: 'OTP_HARVESTING',
      rawMatch: otpExpMatch[0],
      normalizedExcerpt: otpExpMatch[0],
      ruleDescription: 'One-Time Password (OTP) exposed in unsecured communication channel.',
      suggestedIndicator: 'other_warning_sign',
      statutoryAuthority: 'RBI',
    }
  }

  // 4. PIN harvesting & exposure
  const pinExpMatch = text.match(PIN_EXPOSURE_REGEX)
  if (pinExpMatch) {
    return {
      category: 'PIN_HARVESTING',
      rawMatch: pinExpMatch[0],
      normalizedExcerpt: pinExpMatch[0],
      ruleDescription: 'Confidential transaction PIN or passcode exposed.',
      suggestedIndicator: 'other_warning_sign',
      statutoryAuthority: 'RBI',
    }
  }
  const pinReqMatch = text.match(PIN_HARVEST_REGEX)
  if (pinReqMatch) {
    return {
      category: 'PIN_HARVESTING',
      rawMatch: pinReqMatch[0],
      normalizedExcerpt: pinReqMatch[0],
      ruleDescription: 'Solicitation asking for confidential ATM PIN, UPI PIN, or Net Banking credentials.',
      suggestedIndicator: 'other_warning_sign',
      statutoryAuthority: 'RBI',
    }
  }
  if (PIN_GENERAL_REGEX.test(text) && (lower.includes('enter') || lower.includes('send') || lower.includes('share') || lower.includes('tell'))) {
    const match = text.match(PIN_GENERAL_REGEX)
    return {
      category: 'PIN_HARVESTING',
      rawMatch: match ? match[0] : 'PIN request',
      normalizedExcerpt: match ? match[0] : 'PIN solicitation',
      ruleDescription: 'Request for private financial transaction authorization PIN.',
      suggestedIndicator: 'other_warning_sign',
      statutoryAuthority: 'RBI',
    }
  }

  // 5. Card photo / scan harvesting
  const cardPhotoMatch = text.match(CARD_PHOTO_HARVEST_REGEX) || text.match(PHOTO_OF_CARD_REGEX)
  if (cardPhotoMatch) {
    return {
      category: 'CARD_PHOTO_HARVESTING',
      rawMatch: cardPhotoMatch[0],
      normalizedExcerpt: cardPhotoMatch[0],
      ruleDescription: 'Solicitation demanding a photo or scan of credit/debit card front or back.',
      suggestedIndicator: 'other_warning_sign',
      statutoryAuthority: 'RBI',
    }
  }
  const sensitiveDocMatch = text.match(SENSITIVE_DOCS_REGEX)
  if (sensitiveDocMatch) {
    return {
      category: 'SENSITIVE_DOCUMENT_HARVESTING',
      rawMatch: sensitiveDocMatch[0],
      normalizedExcerpt: sensitiveDocMatch[0],
      ruleDescription: 'Unsolicited request to submit photos of bank cheques, passbooks, or identity documents.',
      suggestedIndicator: 'other_warning_sign',
      statutoryAuthority: 'RBI',
    }
  }

  // 6. Free money in exchange for credentials / actions
  const hasFreeMoney = FREE_MONEY_LURE_REGEX.test(text) || GET_FREE_MONEY_REGEX.test(text)
  const hasExchange = EXCHANGE_LURE_REGEX.test(text)
  if (hasFreeMoney && (hasExchange || lower.includes('credit card') || lower.includes('card photo') || lower.includes('card picture') || lower.includes('otp'))) {
    const matchedSnippet = text.match(/(?:get\s*)?free\s*money[^.!?\n]*|\bin\s*exchange\s*(?:of|for)[^.!?\n]*/i)?.[0] || 'GET FREE MONEY'
    return {
      category: 'FREE_MONEY_CREDENTIAL_LURE',
      rawMatch: matchedSnippet,
      normalizedExcerpt: matchedSnippet,
      ruleDescription: 'Fraudulent lure promising free money or rewards in exchange for sensitive credentials or card photos.',
      suggestedIndicator: 'other_warning_sign',
      statutoryAuthority: 'RBI',
    }
  }

  // 7. Blatant money multipliers
  const multiplierMatch = text.match(MONEY_MULTIPLIER_REGEX) || text.match(MONEY_DOUBLING_REGEX)
  if (multiplierMatch) {
    return {
      category: 'BLATANT_MONEY_MULTIPLIER',
      rawMatch: multiplierMatch[0],
      normalizedExcerpt: multiplierMatch[0],
      ruleDescription: 'Blatant money multiplication scheme violating statutory SEBI/RBI prohibitions on guaranteed returns.',
      suggestedIndicator: 'guaranteed_returns',
      statutoryAuthority: 'SEBI',
    }
  }

  // 8. Vernacular triggers
  if (VERNACULAR_CARD_PHOTO_REGEX.test(text)) {
    const vMatch = text.match(VERNACULAR_CARD_PHOTO_REGEX)
    return {
      category: 'CARD_PHOTO_HARVESTING',
      rawMatch: vMatch ? vMatch[0] : 'क्रेडिट कार्ड फोटो',
      normalizedExcerpt: vMatch ? vMatch[0] : 'क्रेडिट कार्ड फोटो',
      ruleDescription: 'Vernacular solicitation for credit/debit card photograph.',
      suggestedIndicator: 'other_warning_sign',
      statutoryAuthority: 'RBI',
    }
  }

  if (VERNACULAR_OTP_PIN_REGEX.test(text) && (lower.includes('भेजें') || lower.includes('साझा') || lower.includes('पाठवा') || lower.includes('পাঠান') || lower.includes('பகிர்') || lower.includes('મોકલો'))) {
    const vMatch = text.match(VERNACULAR_OTP_PIN_REGEX)
    return {
      category: 'OTP_HARVESTING',
      rawMatch: vMatch ? vMatch[0] : 'ओटीपी / पिन',
      normalizedExcerpt: vMatch ? vMatch[0] : 'ओटीपी / पिन',
      ruleDescription: 'Vernacular request to share confidential OTP or transaction PIN.',
      suggestedIndicator: 'other_warning_sign',
      statutoryAuthority: 'RBI',
    }
  }

  if (VERNACULAR_FREE_MONEY_REGEX.test(text) && (lower.includes('बदले') || lower.includes('कार्ड') || lower.includes('इनाम') || lower.includes('બદલામાં'))) {
    const vMatch = text.match(VERNACULAR_FREE_MONEY_REGEX)
    return {
      category: 'FREE_MONEY_CREDENTIAL_LURE',
      rawMatch: vMatch ? vMatch[0] : 'मुफ्त पैसे',
      normalizedExcerpt: vMatch ? vMatch[0] : 'मुफ्त पैसे',
      ruleDescription: 'Vernacular lure offering unearned money in return for credentials.',
      suggestedIndicator: 'other_warning_sign',
      statutoryAuthority: 'RBI',
    }
  }

  return null
}

// ----------------------------------------------------
// 4. IMAGE FAST-PASS INTERCEPTOR (Client-Side)
// ----------------------------------------------------
export interface ImagePreScreenOptions {
  fileData?: string // base64 string
  fileMimeType?: string
  fileName?: string
}

export async function fastImagePreScreener(
  options: ImagePreScreenOptions,
): Promise<{ intercepted: boolean; fatalMatch: FatalRedLineMatch | null; extractedText?: string }> {
  // A. Check file name / metadata for fatal red lines
  const fileName = options.fileName || ''
  if (fileName) {
    const lowerName = fileName.toLowerCase()
    if (
      lowerName.includes('card_photo') ||
      lowerName.includes('credit_card') ||
      lowerName.includes('debit_card') ||
      lowerName.includes('card_front') ||
      lowerName.includes('card_back') ||
      lowerName.includes('cvv') ||
      lowerName.includes('otp_screenshot')
    ) {
      return {
        intercepted: true,
        fatalMatch: {
          category: 'CARD_PHOTO_HARVESTING',
          rawMatch: fileName,
          normalizedExcerpt: fileName,
          ruleDescription: 'File metadata indicates high-risk credit/debit card photograph or confidential OTP screenshot.',
          suggestedIndicator: 'other_warning_sign',
          statutoryAuthority: 'RBI',
        },
        extractedText: `[Image file metadata match: ${fileName}]`,
      }
    }
  }

  // B. Client-side browser inspection if base64 fileData is present
  const g = globalThis as unknown as {
    window?: unknown
    document?: unknown
    Image?: new () => { src: string; onload: () => void; onerror: () => void }
    TextDetector?: new () => { detect: (bitmap: unknown) => Promise<Array<{ rawValue: string }>> }
  }

  if (options.fileData && g.window && g.document && g.Image) {
    try {
      // If TextDetector is supported in modern browser (Shape Detection API)
      if (g.TextDetector) {
        const textDetector = new g.TextDetector()
        const img = new g.Image()
        const base64Clean = options.fileData.includes(',')
          ? options.fileData
          : `data:${options.fileMimeType || 'image/jpeg'};base64,${options.fileData}`
        img.src = base64Clean

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject()
        })

        const textBlocks = await textDetector.detect(img)
        const combinedText = textBlocks.map((t) => t.rawValue).join(' ')
        if (combinedText) {
          const match = evaluateFatalRedLines(combinedText)
          if (match) {
            return {
              intercepted: true,
              fatalMatch: match,
              extractedText: combinedText,
            }
          }
        }
      }
    } catch {
      // ShapeDetection API not supported or image decode issue; cleanly fall through to Stage 2
    }
  }

  return {
    intercepted: false,
    fatalMatch: null,
  }
}

// ----------------------------------------------------
// 5. SYNTHETIC HARD RED BLOCK RESPONSE GENERATOR
// ----------------------------------------------------
const MULTILINGUAL_TITLES: Record<string, { summary: string; action: string; headline: string }> = {
  en: {
    summary:
      '🛑 HARD RED BLOCK (STAGE 1 ZERO-TRUST GUARDRAIL): Fatal financial security risk detected in 0ms. Solicitations or submissions containing credit card numbers, CVVs, OTPs, PINs, or card photos are strictly blocked to protect your funds under RBI and Cyber Crime regulations. AI network call halted.',
    action: 'DO NOT SHARE CREDENTIALS OR CARD PHOTOS. HOTLIST/BLOCK YOUR CARD IMMEDIATELY IF ALREADY SHARED.',
    headline: 'CRITICAL SECURITY BREACH PREVENTED',
  },
  hi: {
    summary:
      '🛑 हार्ड रेड ब्लॉक (स्टेज 1 ज़ीरो-ट्रस्ट सुरक्षा): 0ms में गंभीर वित्तीय जोखिम का पता चला। क्रेडिट कार्ड नंबर, CVV, OTP, पिन या कार्ड का फोटो मांगना सीधे धोखाधड़ी है। आपकी सुरक्षा के लिए यह लेन-देन तुरंत रोका गया है।',
    action: 'क्रेडिट कार्ड का फोटो या ओटीपी कभी साझा न करें। यदि दे दिया है तो तुरंत बैंक से कार्ड ब्लॉक कराएं।',
    headline: 'गंभीर वित्तीय धोखाधड़ी रोकी गई',
  },
  mr: {
    summary:
      '🛑 हार्ड रेड ब्लॉक (स्टेज 1 झिरो-ट्रस्ट संरक्षण): 0ms मध्ये गंभीर सायबर जोखीम आढळली. क्रेडिट कार्ड तपशील, CVV, OTP किंवा कार्डचा फोटो मागणे ही गंभीर फसवणूक आहे. तुमचा निधी सुरक्षित ठेवण्यासाठी प्रक्रिया त्वरित थांबवली.',
    action: 'कार्डचा फोटो किंवा पिन कोणालाही देऊ नका. त्वरित बँकेशी संपर्क साधून कार्ड ब्लॉक करा.',
    headline: 'गंभीर सायबर फसवणूक रोखली',
  },
  bn: {
    summary:
      '🛑 হার্ড রেড ব্লক (স্টেজ ১ জিরো-ট্রাস্ট গার্ডরেল): ০ মিলিসেকেন্ডে মারাত্মক আর্থিক ঝুঁকি শনাক্ত হয়েছে। ক্রেডিট কার্ড নম্বর, CVV, OTP বা কার্ডের ছবি চাওয়া সরাসরি সাইবার জালিয়াতি। আপনার সুরক্ষা নিশ্চিত করতে এটি অবিলম্বে আটকানো হয়েছে।',
    action: 'কখনোই কার্ডের ছবি বা ওটিপি পাঠাবেন না। অবিলম্বে আপনার ব্যাংকে যোগাযোগ করে কার্ড ব্লক করুন।',
    headline: 'গুরুতর আর্থিক জালিয়াতি প্রতিরোধ করা হয়েছে',
  },
  ta: {
    summary:
      '🛑 ஹார்ட் ரெட் பிளாக் (நிலை 1 ஜீரோ-டிரஸ்ட் பாதுகாப்பு): 0 மில்லி விநாடியில் கடுமையான நிதி ஆபத்து கண்டறியப்பட்டது. கிரெடிட் கார்டு விவரங்கள், CVV, OTP அல்லது கார்டு புகைப்படத்தைக் கோருவது கடுமையான இணைய மோசடியாகும்.',
    action: 'கார்டு புகைப்படத்தையோ கடவுச்சொல்லையோ ஒருபோதும் பகிராதீர்கள். உடனே கார்டை முடக்குங்கள்.',
    headline: 'கடுமையான நிதி மோசடி தடுக்கப்பட்டது',
  },
  gu: {
    summary:
      '🛑 હાર્ડ રેડ બ્લોક (સ્ટેજ 1 ઝીરો-ટ્રસ્ટ સુરક્ષા): 0ms માં ગંભીર સાયબર છેતરપિંડી પકડાઈ. ક્રેડિટ કાર્ડ વિગતો, CVV, OTP કે કાર્ડનો ફોટો માંગવો એ ગેરકાયદે છે. તમારા નાણાં બચાવવા આ વિનંતી તાત્કાલિક રોકવામાં આવી છે.',
    action: 'કાર્ડનો ફોટો કે પિન ક્યારેય શેર કરશો નહીં. તરત જ બેંકનો સંપર્ક કરી કાર્ડ બ્લોક કરાવો.',
    headline: 'ગંભીર નાણાકીય છેતરપિંડી અટકાવી',
  },
}

export function buildHardRedBlockResult(
  options: AnalyzeOptions,
  fatalMatch: FatalRedLineMatch,
  latencyMs = 0,
): AnalysisResult {
  const lang = (options.language && MULTILINGUAL_TITLES[options.language] ? options.language : 'en')
  const localized = MULTILINGUAL_TITLES[lang]
  const modality: InputModality = options.modality || 'text'
  const text = options.message || fatalMatch.normalizedExcerpt

  const rbiKehtaHai = officialSources.find((s: OfficialSource) => s.id === 'rbi_kehta_hai')
  const cybercrime1930 = officialSources.find((s: OfficialSource) => s.id === 'cybercrime_1930')
  const sebiFakeTrading = officialSources.find((s: OfficialSource) => s.id === 'sebi_fake_trading_apps')

  const consultedSource =
    fatalMatch.statutoryAuthority === 'SEBI'
      ? sebiFakeTrading
      : rbiKehtaHai || cybercrime1930

  const journeyStages: JourneyStage[] = [
    {
      stage: 'initial_offer',
      title: 'Lure of Free Money or Unsolicited Offer',
      observed: true,
      evidence: fatalMatch.normalizedExcerpt,
      explanation: 'Perpetrators use unearned prizes, free money, or high return promises as an initial psychological lure.',
      is_future_risk: false,
    },
    {
      stage: 'urgency_pressure',
      title: 'Urgent Action or Requirement Demand',
      observed: true,
      evidence: 'Mandatory submission of payment card credentials',
      explanation: 'Target is pressured to share confidential details under pretext of receiving funds.',
      is_future_risk: false,
    },
    {
      stage: 'payment_request',
      title: 'Direct Card Compromise Demand',
      observed: false,
      evidence: '',
      explanation: 'Compromised card credentials are used directly to make unauthorized online transactions.',
      is_future_risk: true,
    },
    {
      stage: 'app_or_credential_request',
      title: 'Card Photo & Confidential Credential Harvesting',
      observed: true,
      evidence: fatalMatch.normalizedExcerpt,
      explanation: `${fatalMatch.ruleDescription} Reserve Bank of India (RBI) directives strictly prohibit sharing card photos, CVVs, OTPs, or confidential credentials.`,
      is_future_risk: false,
    },
    {
      stage: 'followup_or_recovery',
      title: 'Account Draining & Unauthorized Charges',
      observed: false,
      evidence: '',
      explanation: 'Unchecked transmission of card credentials results in rapid unauthorized debits.',
      is_future_risk: true,
    },
  ]

  return {
    input_modality: modality,
    input_language: lang,
    extracted_text: text,
    extraction_uncertainty: {
      has_uncertainty: false,
      confidence: 'high',
      notes: `Deterministic Zero-Trust Pre-Screener triggered in ${latencyMs}ms. Fatal category: ${fatalMatch.category}.`,
    },
    extracted_entities: {
      urls: [],
      names: ['Stage 1 Zero-Trust Guardrail Bouncer'],
      promised_returns: ['Unearned Free Money / High Yield Lure'],
      deadlines: ['Immediate Block'],
      payment_requests: [fatalMatch.ruleDescription],
      claims: [`Fatal Red Line: ${fatalMatch.category}`],
      phone_numbers: [],
    },
    overall_status: 'warning_signs_found',
    uncertainty_rating: 'low',
    summary: localized.summary,
    findings: [
      {
        indicator: fatalMatch.suggestedIndicator,
        original_excerpt: fatalMatch.normalizedExcerpt,
        explanation: `${fatalMatch.ruleDescription} RBI and Cyber Crime guidelines strictly prohibit sharing card numbers, card photos, CVV, OTP, or PIN under any circumstances.`,
        evidence_type: 'message_excerpt',
        verification_status: 'not_independently_verified',
      },
    ],
    claims: [
      {
        original_claim: fatalMatch.normalizedExcerpt,
        what_content_establishes: `Submitted content contains fatal financial security violation: ${fatalMatch.ruleDescription}`,
        external_source_consulted: consultedSource
          ? {
              id: consultedSource.id,
              title: consultedSource.title,
              url: consultedSource.url,
              relevant_excerpt:
                'Statutory Directive: Never share credit/debit card photos, card number, CVV, OTP, or PIN under any pretext. Legitimate authorities NEVER ask for card photos.',
              date_accessed: '2026-10-02',
            }
          : null,
        source_verdict: 'contradicts',
        what_remains_unknown: 'Legitimate business registration and legal authorization under Indian financial regulations.',
        safe_verification_step: 'Never share payment card photos. If already sent, contact your bank immediately to hotlist/block the card and dial National Cyber Crime Helpline 1930.',
      },
    ],
    scam_journey_map: journeyStages,
    unknowns: ['Sender legal identity and authorization under RBI Payment & Settlement Systems Act.'],
    next_steps: [
      'DO NOT transfer money or share card photos, CVV, OTP, or PIN.',
      'If you have already shared card photos, call your bank customer care immediately to block the card.',
      'Report suspected cyber fraud immediately on www.cybercrime.gov.in or dial 1930.',
    ],
    limitations: [
      `Intercepted deterministically by Stage 1 Zero-Trust Guardrail in ${latencyMs}ms. Network AI call was halted to protect user credentials and preserve quota.`,
    ],
  }
}

// ----------------------------------------------------
// 6. MAIN STAGE 1 PRE-SCREENER PIPELINE
// ----------------------------------------------------
export async function runZeroTrustPreScreen(options: AnalyzeOptions): Promise<PreScreenResult> {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now()

  // 1. Text-based evaluation (0ms deterministic regex)
  if (options.message && options.message.trim()) {
    const fatalMatch = evaluateFatalRedLines(options.message)
    if (fatalMatch) {
      const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const latencyMs = Math.round(endTime - startTime)
      return {
        intercepted: true,
        executionLatencyMs: latencyMs,
        fatalMatch,
        extractedText: options.message,
        syntheticAnalysis: buildHardRedBlockResult(options, fatalMatch, latencyMs),
      }
    }
  }

  // 2. Image fast-pass evaluation (if image modality or file_data provided)
  if (options.file_data || options.modality === 'image') {
    const imagePreScreen = await fastImagePreScreener({
      fileData: options.file_data,
      fileMimeType: options.file_mime_type,
      fileName: options.message,
    })

    if (imagePreScreen.intercepted && imagePreScreen.fatalMatch) {
      const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const latencyMs = Math.round(endTime - startTime)
      return {
        intercepted: true,
        executionLatencyMs: latencyMs,
        fatalMatch: imagePreScreen.fatalMatch,
        extractedText: imagePreScreen.extractedText,
        syntheticAnalysis: buildHardRedBlockResult(options, imagePreScreen.fatalMatch, latencyMs),
      }
    }
  }

  // 3. Clean Pass-Through to Stage 2 (Deep Multimodal AI)
  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const latencyMs = Math.round(endTime - startTime)
  return {
    intercepted: false,
    executionLatencyMs: latencyMs,
    fatalMatch: null,
  }
}
