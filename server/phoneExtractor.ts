/**
 * NiveshShield Phone Number Extraction, Normalization & Privacy Masking Module
 * Complies with Indian National Numbering Plan (DoT/TRAI) and ITU-T E.164.
 */

export interface ExtractedPhoneNumber {
  raw: string
  normalized_e164: string | null
  country_code: string
  format_type: 'indian_mobile' | 'indian_landline' | 'indian_tollfree' | 'international' | 'unknown'
  start_index: number
  end_index: number
  confidence: 'high' | 'medium'
}

/**
 * Masks a phone number to protect privacy in logs and non-privileged displays.
 * Example: +91 98765 43210 -> +91 98*** **210
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '[REDACTED]'
  const cleaned = phone.trim()
  if (cleaned.length <= 5) return '***'

  // If E.164 with +91
  if (cleaned.startsWith('+91') && cleaned.length >= 13) {
    const national = cleaned.slice(3)
    return `+91 ${national.slice(0, 2)}*** ***${national.slice(-2)}`
  }

  // Generic international with +
  if (cleaned.startsWith('+')) {
    const prefix = cleaned.slice(0, 4)
    const suffix = cleaned.slice(-2)
    return `${prefix}*** ***${suffix}`
  }

  // 10-digit number
  if (/^\d{10}$/.test(cleaned)) {
    return `${cleaned.slice(0, 2)}*** ***${cleaned.slice(-2)}`
  }

  // Fallback masking
  const visibleStart = Math.min(3, Math.floor(cleaned.length / 4))
  const visibleEnd = Math.min(2, Math.floor(cleaned.length / 4))
  return `${cleaned.slice(0, visibleStart)}*****${cleaned.slice(-visibleEnd)}`
}

/**
 * Normalizes an Indian number into E.164 format (+91XXXXXXXXXX).
 * Returns null if not a valid 10-digit Indian mobile or landline.
 */
export function normalizeIndianNumber(raw: string): string | null {
  const digitsOnly = raw.replace(/\D/g, '')

  // 12 digits starting with 91: e.g. 919876543210
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    const national = digitsOnly.slice(2)
    if (/^[6-9]\d{9}$/.test(national)) {
      return `+91${national}`
    }
  }

  // 11 digits starting with 0: e.g. 09876543210
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    const national = digitsOnly.slice(1)
    if (/^[6-9]\d{9}$/.test(national)) {
      return `+91${national}`
    }
  }

  // 10 digits starting with 6, 7, 8, 9 (standard Indian mobile series)
  if (digitsOnly.length === 10 && /^[6-9]\d{9}$/.test(digitsOnly)) {
    return `+91${digitsOnly}`
  }

  return null
}

/**
 * Normalizes an international number starting with + into E.164 format.
 */
export function normalizeInternationalNumber(raw: string): string | null {
  if (!raw.startsWith('+')) return null
  const cleaned = '+' + raw.replace(/\D/g, '')
  // E.164 allows up to 15 digits excluding +
  if (cleaned.length >= 8 && cleaned.length <= 16) {
    return cleaned
  }
  return null
}

/**
 * Checks whether a surrounding token indicates that the matched number is actually
 * a date, currency amount, transaction ID, UTR, OTP, or PIN code.
 */
function isFalsePositiveContext(text: string, startIndex: number, endIndex: number): boolean {
  const windowStart = Math.max(0, startIndex - 30)
  const windowEnd = Math.min(text.length, endIndex + 30)
  const beforeContext = text.slice(windowStart, startIndex).toLowerCase()
  const afterContext = text.slice(endIndex, windowEnd).toLowerCase()
  const matchedText = text.slice(startIndex, endIndex)

  // 1. Currency & Amount Indicators
  const currencyTriggers = [
    '₹', 'rs', 'rs.', 'inr', '$', 'usd', 'eur', 'amount', 'fee', 'charge', 'paid',
    'pay', 'invest', 'profit', 'returns', 'rupees', 'deposit', 'give', 'take',
    'balance', 'credited', 'debited', 'bonus', 'salary', 'lakh', 'crore'
  ]
  for (const trigger of currencyTriggers) {
    if (beforeContext.endsWith(trigger) || beforeContext.endsWith(trigger + ' ') || beforeContext.endsWith(trigger + ':') || beforeContext.endsWith(trigger + ':-')) {
      return true
    }
  }
  if (/^\s*(₹|rs|inr|\$|usd|eur|rupees)/i.test(afterContext)) {
    return true
  }

  // 2. Transaction / Reference / UTR Indicators
  const txnTriggers = ['txn', 'txnid', 'transaction', 'utr', 'ref', 'reference', 'order', 'inv', 'invoice', 'id:', 'upi ref', 'rrn']
  for (const trigger of txnTriggers) {
    if (beforeContext.includes(trigger)) {
      // Check if distance between trigger and number is very short (< 15 chars)
      const lastIndex = beforeContext.lastIndexOf(trigger)
      if (beforeContext.length - (lastIndex + trigger.length) < 15) {
        return true
      }
    }
  }

  // 3. OTP / Verification Code / PIN / Pincode
  const securityTriggers = ['otp', 'pin', 'pincode', 'code is', 'verification code', 'secret code', 'passcode']
  for (const trigger of securityTriggers) {
    if (beforeContext.includes(trigger)) {
      const lastIndex = beforeContext.lastIndexOf(trigger)
      if (beforeContext.length - (lastIndex + trigger.length) < 15) {
        return true
      }
    }
  }

  // 4. Date Check (e.g. 2026-10-02 or 02/10/2026)
  if (/^\d{4}[-/.]\d{2}[-/.]\d{2}$/.test(matchedText) || /^\d{2}[-/.]\d{2}[-/.]\d{4}$/.test(matchedText)) {
    return true
  }
  // If adjacent characters are part of a date format
  if (beforeContext.endsWith('/') || beforeContext.endsWith('-') || afterContext.startsWith('/') || afterContext.startsWith('-')) {
    return true
  }

  // 5. Percentages or ratios
  if (afterContext.trim().startsWith('%') || beforeContext.trim().endsWith(':')) {
    return true
  }

  return false
}

/**
 * Extracts phone numbers from text with Indian and International support,
 * filtering out dates, transaction IDs, currency amounts, and invalid sequences.
 */
export function extractPhoneNumbers(text: string): ExtractedPhoneNumber[] {
  if (!text || typeof text !== 'string') return []

  const results: ExtractedPhoneNumber[] = []
  const seenNormalized = new Set<string>()

  // PATTERN 1: Explicit Indian Mobile Numbers with +91 or 91 or 0 prefix
  // e.g. +91 98765 43210, +91-9876543210, 09876543210, +919876543210
  const indianPrefixedRegex = /(?:\+91|91|0)[\s-]?[6-9]\d{4}[\s-]?\d{5}\b/g
  let match: RegExpExecArray | null

  while ((match = indianPrefixedRegex.exec(text)) !== null) {
    const raw = match[0]
    const startIndex = match.index
    const endIndex = startIndex + raw.length

    if (isFalsePositiveContext(text, startIndex, endIndex)) {
      continue
    }

    const normalized = normalizeIndianNumber(raw)
    if (normalized && !seenNormalized.has(normalized)) {
      seenNormalized.add(normalized)
      results.push({
        raw,
        normalized_e164: normalized,
        country_code: 'IN',
        format_type: 'indian_mobile',
        start_index: startIndex,
        end_index: endIndex,
        confidence: 'high',
      })
    }
  }

  // PATTERN 2: 10-digit Indian Mobile Numbers starting with 6, 7, 8, 9 without prefix
  // e.g. 9876543210, 98765 43210, 98765-43210
  const indianBareRegex = /\b[6-9]\d{4}[\s-]?\d{5}\b/g
  while ((match = indianBareRegex.exec(text)) !== null) {
    const raw = match[0]
    const startIndex = match.index
    const endIndex = startIndex + raw.length

    // Avoid overlapping with already matched prefixed numbers
    const alreadyMatched = results.some(
      (r) => startIndex >= r.start_index && endIndex <= r.end_index,
    )
    if (alreadyMatched) continue

    if (isFalsePositiveContext(text, startIndex, endIndex)) {
      continue
    }

    const normalized = normalizeIndianNumber(raw)
    if (normalized && !seenNormalized.has(normalized)) {
      seenNormalized.add(normalized)
      results.push({
        raw,
        normalized_e164: normalized,
        country_code: 'IN',
        format_type: 'indian_mobile',
        start_index: startIndex,
        end_index: endIndex,
        confidence: 'high',
      })
    }
  }

  // PATTERN 3: Indian Toll-Free Numbers (1800-xxx-xxxx)
  const tollFreeRegex = /\b1800[\s-]?(?:\d{3}[\s-]?\d{3,4}|\d{2}[\s-]?\d{4,5})\b/g
  while ((match = tollFreeRegex.exec(text)) !== null) {
    const raw = match[0]
    const startIndex = match.index
    const endIndex = startIndex + raw.length
    const cleanDigits = raw.replace(/\D/g, '')

    if (!seenNormalized.has(cleanDigits)) {
      seenNormalized.add(cleanDigits)
      results.push({
        raw,
        normalized_e164: `+91${cleanDigits}`,
        country_code: 'IN',
        format_type: 'indian_tollfree',
        start_index: startIndex,
        end_index: endIndex,
        confidence: 'high',
      })
    }
  }

  // PATTERN 4: International Numbers with explicit + country code
  // e.g. +1 (415) 555-2671, +44 7911 123456, +971 50 123 4567
  const intlRegex = /\+(?:[1-9]\d{0,2})[\s-]?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}\b/g
  while ((match = intlRegex.exec(text)) !== null) {
    const raw = match[0]
    const startIndex = match.index
    const endIndex = startIndex + raw.length

    // If already matched under Indian prefixed regex
    const alreadyMatched = results.some(
      (r) => startIndex >= r.start_index && endIndex <= r.end_index,
    )
    if (alreadyMatched) continue

    if (isFalsePositiveContext(text, startIndex, endIndex)) {
      continue
    }

    const normalized = normalizeInternationalNumber(raw)
    if (normalized && !seenNormalized.has(normalized)) {
      seenNormalized.add(normalized)
      let cc = 'International'
      if (normalized.startsWith('+1')) cc = 'US/CA'
      else if (normalized.startsWith('+44')) cc = 'GB'
      else if (normalized.startsWith('+971')) cc = 'AE'
      else if (normalized.startsWith('+65')) cc = 'SG'
      else if (normalized.startsWith('+91')) cc = 'IN'

      results.push({
        raw,
        normalized_e164: normalized,
        country_code: cc,
        format_type: normalized.startsWith('+91') ? 'indian_mobile' : 'international',
        start_index: startIndex,
        end_index: endIndex,
        confidence: 'high',
      })
    }
  }

  return results
}
