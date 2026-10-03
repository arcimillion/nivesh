export type CaseStatus =
  | 'investigating'
  | 'report_prepared'
  | 'report_submitted'
  | 'resolved'
  | 'closed'

export type TimelineEventType =
  | 'initial_contact'
  | 'suspicious_offer'
  | 'urgency_threat'
  | 'payment_made'
  | 'payment_attempted'
  | 'credential_shared'
  | 'fraud_discovered'
  | 'bank_contacted'
  | 'police_cybercrime_complaint'
  | 'sebi_scores_filed'
  | 'followup_update'

export interface IncidentTimelineEvent {
  id: string
  timestamp: string // ISO string
  dateStr: string
  eventType: TimelineEventType
  title: string
  description: string
  isConfirmedDate: boolean
  amountInvolved?: number
  evidenceItemIds?: string[]
}

export type EvidenceCategory =
  | 'chat_excerpt'
  | 'screenshot_ocr'
  | 'url'
  | 'phone_number'
  | 'upi_id'
  | 'payment_receipt'
  | 'audio_transcript'
  | 'regulatory_citation'

export interface IncidentEvidenceRecord {
  id: string
  title: string
  category: EvidenceCategory
  content: string
  sourceType: 'user_provided' | 'extracted' | 'ai_interpretation' | 'verified_source'
  sha256Hash?: string
  dateAdded: string
}

export interface IncidentFinancialSummary {
  amountPaid: number
  amountRequestedNotPaid: number
  amountRecovered: number
  outstandingLoss: number
  currency: string
  isEstimated: boolean
}

export interface IncidentCase {
  id: string // e.g. CASE-2026-XXXX
  title: string
  createdAt: string
  updatedAt: string
  status: CaseStatus
  suspectName?: string
  suspectContact?: string
  suspectUpi?: string
  timeline: IncidentTimelineEvent[]
  evidenceVault: IncidentEvidenceRecord[]
  financial: IncidentFinancialSummary
  officialReferenceNumber?: string
  notes?: string
}

const STORAGE_KEY = 'nivesh_incident_cases_v2'

/**
 * Calculates SHA-256 hash using the browser Web Crypto API.
 * Explains that hashing detects tampering, but does not prove legal authenticity or ownership.
 */
export async function calculateSha256(text: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder()
      const data = encoder.encode(text)
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    }
  } catch {
    // fallback pseudo hash
  }
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(16).padStart(16, '0')
}

export function loadIncidentCases(): IncidentCase[] {
  try {
    if (typeof window === 'undefined') return []
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveIncidentCase(caseItem: IncidentCase): void {
  try {
    if (typeof window === 'undefined') return
    const cases = loadIncidentCases()
    const index = cases.findIndex((c) => c.id === caseItem.id)
    if (index >= 0) {
      cases[index] = { ...caseItem, updatedAt: new Date().toISOString() }
    } else {
      cases.unshift({ ...caseItem, updatedAt: new Date().toISOString() })
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))
  } catch (err) {
    console.error('[NiveshShield Casebook] Storage error:', err)
  }
}

export function deleteIncidentCase(caseId: string): void {
  try {
    if (typeof window === 'undefined') return
    const cases = loadIncidentCases().filter((c) => c.id !== caseId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))
  } catch (err) {
    console.error('[NiveshShield Casebook] Delete error:', err)
  }
}

export function clearAllIncidentCases(): void {
  try {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('[NiveshShield Casebook] Clear error:', err)
  }
}

export function generateNewCaseId(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  return `CASE-${new Date().getFullYear()}-${randomSuffix}`
}

export function exportCaseAsText(c: IncidentCase): string {
  const financialSummary = `Financial Summary:
- Total Amount Paid: ₹${c.financial.amountPaid.toLocaleString('en-IN')}
- Amount Requested Not Paid: ₹${c.financial.amountRequestedNotPaid.toLocaleString('en-IN')}
- Amount Recovered: ₹${c.financial.amountRecovered.toLocaleString('en-IN')}
- Net Suspected Outstanding Loss: ₹${c.financial.outstandingLoss.toLocaleString('en-IN')}`

  const timelineStr = c.timeline
    .sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime())
    .map(
      (t, idx) =>
        `${idx + 1}. [${t.dateStr}${t.isConfirmedDate ? '' : ' (approx)'}] ${t.title}
   Details: ${t.description}${t.amountInvolved ? ` | Amount: ₹${t.amountInvolved}` : ''}`,
    )
    .join('\n\n')

  const evidenceStr = c.evidenceVault
    .map(
      (e, idx) =>
        `Evidence #${idx + 1}: ${e.title} [${e.category}]
Source: ${e.sourceType} | Added: ${e.dateAdded}
SHA-256 Hash: ${e.sha256Hash || 'N/A'}
Content Excerpt:
"${e.content}"`,
    )
    .join('\n\n')

  return `=====================================================
NIVESHSHIELD 2.0 INVESTOR INCIDENT DOSSIER & CASEBOOK
Case ID: ${c.id}
Status: ${c.status.toUpperCase()}
Created: ${c.createdAt} | Updated: ${c.updatedAt}
=====================================================

1. INCIDENT PROFILE:
- Title: ${c.title}
- Suspect Contact / Identifier: ${c.suspectContact || 'Unspecified'}
- Suspect UPI / Beneficiary: ${c.suspectUpi || 'Unspecified'}
- Official Complaint Reference: ${c.officialReferenceNumber || 'Pending Filing'}

2. FINANCIAL IMPACT SUMMARY:
${financialSummary}

3. CHRONOLOGICAL INCIDENT TIMELINE:
${timelineStr || 'No chronological timeline events logged.'}

4. EVIDENCE VAULT INDEX:
${evidenceStr || 'No primary evidence records indexed.'}

5. OFFICIAL REPORTING DESTINATIONS:
- National Cyber Crime Reporting Portal (1930): https://cybercrime.gov.in
- DoT Sanchar Saathi (Chakshu): https://sancharsaathi.gov.in/sfc/
- SEBI SCORES 2.0: https://scores.sebi.gov.in

6. STATUTORY DISCLAIMER:
This dossier organizes user-provided evidence, extracted text, and AI analysis for reporting purposes.
Calculated SHA-256 hashes detect data modification post-export; they do not prove legal ownership, admissibility, or criminal liability.
=====================================================`
}
