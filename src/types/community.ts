export type IndicatorCategory =
  | 'phone_number'
  | 'domain_url'
  | 'upi_identifier'
  | 'telegram_whatsapp_group'

export type CommunityTrustLabel =
  | 'community_unverified'
  | 'multiple_reports_unverified'
  | 'officially_confirmed'
  | 'expired_stale'
  | 'disputed'

export type ScamCategory =
  | 'guaranteed_return'
  | 'fake_trading_app'
  | 'pre_ipo_scam'
  | 'impersonation_adviser'
  | 'task_job_fraud'
  | 'other'

export interface CommunityReportInput {
  indicatorCategory: IndicatorCategory
  rawIndicator: string
  scamCategory: ScamCategory
  messageExcerpt?: string
  description: string
  incidentDate: string
  isDirectExperience: boolean
  userConsentGiven: boolean
}

export interface CommunityReport {
  id: string
  indicatorCategory: IndicatorCategory
  normalizedIndicator: string
  maskedIndicator: string
  scamCategory: ScamCategory
  messageExcerpt?: string
  description: string
  reportDate: string
  isDirectExperience: boolean
  trustLabel: CommunityTrustLabel
  isDemoData: boolean
  createdAt: string
}

export interface CommunityIndicatorAggregate {
  indicatorKey: string
  category: IndicatorCategory
  maskedIdentifier: string
  reportCount: number
  firstSeen: string
  lastSeen: string
  topTactics: string[]
  trustLabel: CommunityTrustLabel
  isDemoData: boolean
  evidenceQuality: 'high' | 'medium' | 'low'
  sampleDescription: string
}

/**
 * Normalizes and masks indicators for privacy preservation.
 */
export function normalizeAndMaskIndicator(
  category: IndicatorCategory,
  raw: string,
): { normalized: string; masked: string } {
  const clean = raw.trim()

  if (category === 'phone_number') {
    const digits = clean.replace(/\D/g, '')
    let normalized = clean
    if (digits.length === 10) {
      normalized = `+91${digits}`
    } else if (digits.length === 12 && digits.startsWith('91')) {
      normalized = `+${digits}`
    }
    const masked =
      digits.length >= 10
        ? `+91 ${digits.slice(-10, -8)}*** ***${digits.slice(-2)}`
        : `${clean.slice(0, 3)}***`
    return { normalized, masked }
  }

  if (category === 'domain_url') {
    let domain = clean.toLowerCase()
    try {
      if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
        domain = `https://${domain}`
      }
      const parsed = new URL(domain)
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
      return {
        normalized: host,
        masked: host,
      }
    } catch {
      const fallback = clean.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
      return { normalized: fallback, masked: fallback }
    }
  }

  if (category === 'upi_identifier') {
    const normalized = clean.toLowerCase()
    if (normalized.includes('@')) {
      const [user, handle] = normalized.split('@')
      const maskedUser =
        user.length <= 2
          ? `${user[0] || '*'}***`
          : `${user.slice(0, 2)}***${user.slice(-1)}`
      return { normalized, masked: `${maskedUser}@${handle}` }
    }
    return { normalized, masked: `${normalized.slice(0, 3)}***` }
  }

  // Telegram/WhatsApp group
  const normalized = clean.toLowerCase()
  return { normalized, masked: clean }
}
