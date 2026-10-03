import { z } from 'zod'
import {
  type IndicatorCategory,
  type CommunityTrustLabel,
  type ScamCategory,
  type CommunityReport,
  type CommunityIndicatorAggregate,
  normalizeAndMaskIndicator,
} from '../src/types/community.ts'

export const CommunityReportInputSchema = z.object({
  indicatorCategory: z.enum([
    'phone_number',
    'domain_url',
    'upi_identifier',
    'telegram_whatsapp_group',
  ]),
  rawIndicator: z.string().min(3).max(256),
  scamCategory: z.enum([
    'guaranteed_return',
    'fake_trading_app',
    'pre_ipo_scam',
    'impersonation_adviser',
    'task_job_fraud',
    'other',
  ]),
  messageExcerpt: z.string().max(1000).optional(),
  description: z.string().min(10).max(2000),
  incidentDate: z.string().min(8).max(32),
  isDirectExperience: z.boolean(),
  userConsentGiven: z.boolean().refine((val) => val === true, {
    message: 'User consent is required before submitting a community report.',
  }),
})

export type CommunityReportInputType = z.infer<typeof CommunityReportInputSchema>

// In-memory data store for community reports
const reportsStore: CommunityReport[] = []
const aggregatesMap = new Map<string, CommunityIndicatorAggregate>()

// Seed synthetic demo data clearly labeled
const DEMO_SEEDS: Array<{
  category: IndicatorCategory
  raw: string
  scamCategory: ScamCategory
  desc: string
  count: number
  trustLabel: CommunityTrustLabel
  tactics: string[]
}> = [
  {
    category: 'phone_number',
    raw: '+919845129810',
    scamCategory: 'fake_trading_app',
    desc: 'Unsolicited WhatsApp message promoting VIP Institutional APK download with guaranteed 15% daily return claims.',
    count: 14,
    trustLabel: 'multiple_reports_unverified',
    tactics: ['Sideloaded APK', 'Guaranteed Daily Yield', 'WhatsApp Solicitation'],
  },
  {
    category: 'domain_url',
    raw: 'fii-vip-terminal.in',
    scamCategory: 'fake_trading_app',
    desc: 'Phishing domain mimicking institutional broker terminal; requests users to deposit funds into private UPI handle.',
    count: 23,
    trustLabel: 'multiple_reports_unverified',
    tactics: ['Institutional Impersonation', 'Fake Trading Balance', 'Withdrawal Lock'],
  },
  {
    category: 'upi_identifier',
    raw: 'sharma.wealth@oksbi',
    scamCategory: 'impersonation_adviser',
    desc: 'Purporting to be registered Research Analyst INH000099812; demanding advisory fees into personal SBI UPI.',
    count: 8,
    trustLabel: 'community_unverified',
    tactics: ['Personal UPI Collection', 'Fake SEBI Certificate', 'Zero Loss Guarantee'],
  },
  {
    category: 'domain_url',
    raw: 'pre-ipo-swiggy-allotment.top',
    scamCategory: 'pre_ipo_scam',
    desc: 'Urgent landing page urging off-market Demat share transfers to claim fictitious unlisted pre-IPO quota at 60% discount.',
    count: 31,
    trustLabel: 'multiple_reports_unverified',
    tactics: ['Off-Market Transfer', 'e-DIS Coercion', 'Fake Discount'],
  },
]

// Initialize synthetic baseline records
DEMO_SEEDS.forEach((seed, idx) => {
  const { normalized, masked } = normalizeAndMaskIndicator(seed.category, seed.raw)
  const key = `${seed.category}:${normalized}`

  aggregatesMap.set(key, {
    indicatorKey: key,
    category: seed.category,
    maskedIdentifier: masked,
    reportCount: seed.count,
    firstSeen: '2026-09-12',
    lastSeen: '2026-10-02',
    topTactics: seed.tactics,
    trustLabel: seed.trustLabel,
    isDemoData: true,
    evidenceQuality: 'medium',
    sampleDescription: `[DEMO DATA — NOT A REAL-WORLD REPORT] ${seed.desc}`,
  })

  reportsStore.push({
    id: `DEMO-REP-${idx + 1}`,
    indicatorCategory: seed.category,
    normalizedIndicator: normalized,
    maskedIndicator: masked,
    scamCategory: seed.scamCategory,
    description: `[DEMO DATA — NOT A REAL-WORLD REPORT] ${seed.desc}`,
    reportDate: '2026-10-01',
    isDirectExperience: true,
    trustLabel: seed.trustLabel,
    isDemoData: true,
    createdAt: new Date().toISOString(),
  })
})

export function submitCommunityReport(input: CommunityReportInputType): {
  report: CommunityReport
  aggregate: CommunityIndicatorAggregate
} {
  const { normalized, masked } = normalizeAndMaskIndicator(
    input.indicatorCategory,
    input.rawIndicator,
  )
  const key = `${input.indicatorCategory}:${normalized}`

  const reportId = `CR-${Date.now().toString(36).toUpperCase()}-${Math.floor(
    100 + Math.random() * 900,
  )}`
  const today = new Date().toISOString().split('T')[0]

  const newReport: CommunityReport = {
    id: reportId,
    indicatorCategory: input.indicatorCategory,
    normalizedIndicator: normalized,
    maskedIndicator: masked,
    scamCategory: input.scamCategory,
    messageExcerpt: input.messageExcerpt ? input.messageExcerpt.slice(0, 500) : undefined,
    description: input.description.slice(0, 2000),
    reportDate: input.incidentDate || today,
    isDirectExperience: input.isDirectExperience,
    trustLabel: 'community_unverified',
    isDemoData: false,
    createdAt: new Date().toISOString(),
  }

  reportsStore.unshift(newReport)

  const existingAgg = aggregatesMap.get(key)
  const newCount = (existingAgg?.reportCount || 0) + 1
  const updatedAgg: CommunityIndicatorAggregate = {
    indicatorKey: key,
    category: input.indicatorCategory,
    maskedIdentifier: masked,
    reportCount: newCount,
    firstSeen: existingAgg?.firstSeen || today,
    lastSeen: today,
    topTactics: Array.from(
      new Set([
        input.scamCategory.replace(/_/g, ' '),
        ...(existingAgg?.topTactics || []),
      ]),
    ).slice(0, 4),
    trustLabel: newCount >= 3 ? 'multiple_reports_unverified' : 'community_unverified',
    isDemoData: false,
    evidenceQuality: input.messageExcerpt ? 'high' : 'medium',
    sampleDescription: input.description.slice(0, 240),
  }

  aggregatesMap.set(key, updatedAgg)

  return { report: newReport, aggregate: updatedAgg }
}

export function searchCommunityIndicators(query?: string, category?: string) {
  const cleanQ = (query || '').trim().toLowerCase()
  const cleanCat = (category || '').trim().toLowerCase()

  const results: CommunityIndicatorAggregate[] = []

  for (const agg of aggregatesMap.values()) {
    if (cleanCat && agg.category !== cleanCat) {
      continue
    }

    if (cleanQ) {
      const matchKey = agg.indicatorKey.toLowerCase().includes(cleanQ)
      const matchMasked = agg.maskedIdentifier.toLowerCase().includes(cleanQ)
      const matchTactics = agg.topTactics.some((t) => t.toLowerCase().includes(cleanQ))
      const matchDesc = agg.sampleDescription.toLowerCase().includes(cleanQ)

      if (!matchKey && !matchMasked && !matchTactics && !matchDesc) {
        continue
      }
    }

    results.push(agg)
  }

  // Sort by reportCount descending
  results.sort((a, b) => b.reportCount - a.reportCount)

  return {
    results: results.slice(0, 50),
    totalCount: results.length,
    query: cleanQ,
  }
}

export function getCommunityStats() {
  let realCount = 0
  let demoCount = 0

  reportsStore.forEach((r) => {
    if (r.isDemoData) {
      demoCount++
    } else {
      realCount++
    }
  })

  return {
    totalIndicators: aggregatesMap.size,
    totalReports: reportsStore.length,
    realReportsCount: realCount,
    demoReportsCount: demoCount,
    categories: {
      phone_numbers: Array.from(aggregatesMap.values()).filter(
        (a) => a.category === 'phone_number',
      ).length,
      domains: Array.from(aggregatesMap.values()).filter((a) => a.category === 'domain_url')
        .length,
      upi_ids: Array.from(aggregatesMap.values()).filter(
        (a) => a.category === 'upi_identifier',
      ).length,
    },
  }
}
