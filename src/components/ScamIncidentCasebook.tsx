import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnalysisResult } from '../api'
import {
  type IncidentCase,
  type IncidentTimelineEvent,
  type IncidentEvidenceRecord,
  type CaseStatus,
  type TimelineEventType,
  type EvidenceCategory,
  loadIncidentCases,
  saveIncidentCase,
  deleteIncidentCase,
  clearAllIncidentCases,
  generateNewCaseId,
  calculateSha256,
  exportCaseAsText,
} from '../types/casebook.ts'

interface ScamIncidentCasebookProps {
  analysis?: AnalysisResult | null
  extractedText?: string
}

function buildInitialCase(
  ana?: AnalysisResult | null,
  text = '',
): IncidentCase {
  const today = new Date().toISOString().split('T')[0]
  const caseId = generateNewCaseId()

  const initialEvidence: IncidentEvidenceRecord[] = []
  if (ana?.extracted_text || text) {
    initialEvidence.push({
      id: `ev_init_${Date.now()}`,
      title: 'Initial Suspicious Communication',
      category: 'chat_excerpt',
      content: (ana?.extracted_text || text).slice(0, 1000),
      sourceType: 'user_provided',
      dateAdded: today,
    })
  }

  const initialTimeline: IncidentTimelineEvent[] = [
    {
      id: `ev_t_${Date.now()}`,
      timestamp: new Date().toISOString(),
      dateStr: today,
      eventType: 'initial_contact',
      title: 'Initial Unsolicited Contact / Proposal Received',
      description:
        ana?.summary || 'Received communication regarding an unverified investment proposal.',
      isConfirmedDate: true,
    },
  ]

  return {
    id: caseId,
    title: 'Suspicious Investment Solicitation Case',
    createdAt: today,
    updatedAt: today,
    status: 'investigating',
    suspectName: ana?.extracted_entities?.names?.[0] || '',
    suspectContact:
      ana?.extracted_phones?.[0]?.raw || ana?.extracted_entities?.phone_numbers?.[0] || '',
    suspectUpi: '',
    timeline: initialTimeline,
    evidenceVault: initialEvidence,
    financial: {
      amountPaid: 0,
      amountRequestedNotPaid: 0,
      amountRecovered: 0,
      outstandingLoss: 0,
      currency: 'INR',
      isEstimated: false,
    },
    officialReferenceNumber: '',
    notes: '',
  }
}

export function ScamIncidentCasebook({
  analysis,
  extractedText = '',
}: ScamIncidentCasebookProps) {
  const { t } = useTranslation()
  const [cases, setCases] = useState<IncidentCase[]>(() => {
    const stored = loadIncidentCases()
    if (stored.length > 0) return stored
    const initial = buildInitialCase(analysis, extractedText)
    saveIncidentCase(initial)
    return [initial]
  })
  const [activeCaseId, setActiveCaseId] = useState<string | null>(() => {
    const stored = loadIncidentCases()
    return stored.length > 0 ? stored[0].id : null
  })
  const [copied, setCopied] = useState(false)
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false)

  // Event creation form modal/state
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDesc, setNewEventDesc] = useState('')
  const [newEventType, setNewEventType] = useState<TimelineEventType>('suspicious_offer')
  const [newEventDate, setNewEventDate] = useState(() => new Date().toISOString().split('T')[0])
  const [newEventAmount, setNewEventAmount] = useState<string>('')
  const [isEventDateConfirmed, setIsEventDateConfirmed] = useState(true)

  // Evidence creation form modal/state
  const [newEvidenceTitle, setNewEvidenceTitle] = useState('')
  const [newEvidenceCategory, setNewEvidenceCategory] = useState<EvidenceCategory>('chat_excerpt')
  const [newEvidenceContent, setNewEvidenceContent] = useState('')

  const activeCase = cases.find((c) => c.id === activeCaseId) || cases[0]

  const handleUpdateStatus = (newStatus: CaseStatus) => {
    if (!activeCase) return
    const updated = { ...activeCase, status: newStatus }
    saveIncidentCase(updated)
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  const handleAddTimelineEvent = () => {
    if (!activeCase || !newEventTitle.trim()) return
    const newEvent: IncidentTimelineEvent = {
      id: `ev_t_${Date.now()}`,
      timestamp: new Date().toISOString(),
      dateStr: newEventDate,
      eventType: newEventType,
      title: newEventTitle.trim(),
      description: newEventDesc.trim(),
      isConfirmedDate: isEventDateConfirmed,
      amountInvolved: newEventAmount ? Number(newEventAmount) : undefined,
    }

    const updatedTimeline = [...activeCase.timeline, newEvent]
    const updated = { ...activeCase, timeline: updatedTimeline }
    saveIncidentCase(updated)
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))

    setNewEventTitle('')
    setNewEventDesc('')
    setNewEventAmount('')
  }

  const handleDeleteTimelineEvent = (eventId: string) => {
    if (!activeCase) return
    const updatedTimeline = activeCase.timeline.filter((e) => e.id !== eventId)
    const updated = { ...activeCase, timeline: updatedTimeline }
    saveIncidentCase(updated)
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  const handleAddEvidence = async () => {
    if (!activeCase || !newEvidenceTitle.trim() || !newEvidenceContent.trim()) return
    const hash = await calculateSha256(newEvidenceContent.trim())
    const newRecord: IncidentEvidenceRecord = {
      id: `ev_rec_${Date.now()}`,
      title: newEvidenceTitle.trim(),
      category: newEvidenceCategory,
      content: newEvidenceContent.trim(),
      sourceType: 'user_provided',
      sha256Hash: hash,
      dateAdded: new Date().toISOString().split('T')[0],
    }

    const updatedVault = [...activeCase.evidenceVault, newRecord]
    const updated = { ...activeCase, evidenceVault: updatedVault }
    saveIncidentCase(updated)
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))

    setNewEvidenceTitle('')
    setNewEvidenceContent('')
  }

  const handleDeleteEvidence = (evidenceId: string) => {
    if (!activeCase) return
    const updatedVault = activeCase.evidenceVault.filter((e) => e.id !== evidenceId)
    const updated = { ...activeCase, evidenceVault: updatedVault }
    saveIncidentCase(updated)
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  const handleUpdateFinancial = (field: 'paid' | 'requested' | 'recovered', value: number) => {
    if (!activeCase) return
    const current = { ...activeCase.financial }
    if (field === 'paid') current.amountPaid = value
    if (field === 'requested') current.amountRequestedNotPaid = value
    if (field === 'recovered') current.amountRecovered = value

    current.outstandingLoss = Math.max(0, current.amountPaid - current.amountRecovered)

    const updated = { ...activeCase, financial: current }
    saveIncidentCase(updated)
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  const handleCreateNewCase = () => {
    const newCase = buildInitialCase(analysis, extractedText)
    saveIncidentCase(newCase)
    setCases((prev) => [newCase, ...prev])
    setActiveCaseId(newCase.id)
  }

  const handleDeleteActiveCase = () => {
    if (!activeCase) return
    deleteIncidentCase(activeCase.id)
    const remaining = cases.filter((c) => c.id !== activeCase.id)
    setCases(remaining)
    setActiveCaseId(remaining.length > 0 ? remaining[0].id : null)
  }

  const handleClearAll = () => {
    clearAllIncidentCases()
    setCases([])
    setActiveCaseId(null)
    setShowConfirmClearAll(false)
  }

  const handleCopyReport = async () => {
    if (!activeCase) return
    const text = exportCaseAsText(activeCase)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleDownloadTxt = () => {
    if (!activeCase) return
    const text = exportCaseAsText(activeCase)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `NiveshShield_${activeCase.id}_Dossier.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-6">
      {/* Top Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📁</span>
            <h3 className="text-base font-bold text-slate-900">
              {t('casebook.title', 'Scam Incident Casebook & Evidence Vault')}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-600 max-w-2xl">
            {t(
              'casebook.subtitle',
              'A user-controlled evidence management vault. Organizes chronological timelines, suspect contacts, financial impacts, and cryptographic hashes ready for official police (1930) or SEBI filing.',
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCreateNewCase}
            className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            + New Incident Case
          </button>
        </div>
      </div>

      {/* Case Selector Tabs if multiple cases exist */}
      {cases.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {cases.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCaseId(c.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                activeCaseId === c.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {c.id} ({c.status})
            </button>
          ))}
        </div>
      )}

      {activeCase ? (
        <div className="space-y-6">
          {/* Active Case Banner & Status Controller */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold bg-white px-2.5 py-1 rounded border border-slate-300 text-slate-900">
                  {activeCase.id}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900">{activeCase.title}</h4>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Created: {activeCase.createdAt} · Last Updated: {activeCase.updatedAt}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Case Status:</span>
              <select
                value={activeCase.status}
                onChange={(e) => handleUpdateStatus(e.target.value as CaseStatus)}
                className="text-xs font-bold rounded-lg border border-slate-300 bg-white p-1.5 text-slate-900 outline-none"
              >
                <option value="investigating">Investigating</option>
                <option value="report_prepared">Report Prepared</option>
                <option value="report_submitted">Report Submitted by User</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed by User</option>
              </select>
            </div>
          </div>

          {/* Financial Impact Dashboard */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>💰</span> Financial Impact Summary (Auditable & Deterministic)
            </h4>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="p-3 rounded-lg border border-red-200 bg-red-50/60">
                <span className="text-[11px] font-semibold text-red-900 block mb-1">Amount Paid</span>
                <input
                  type="number"
                  value={activeCase.financial.amountPaid || ''}
                  onChange={(e) => handleUpdateFinancial('paid', Number(e.target.value) || 0)}
                  placeholder="₹ 0"
                  className="w-full text-sm font-mono font-bold text-red-950 bg-white p-1.5 rounded border border-red-200"
                />
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Requested (Not Paid)
                </span>
                <input
                  type="number"
                  value={activeCase.financial.amountRequestedNotPaid || ''}
                  onChange={(e) => handleUpdateFinancial('requested', Number(e.target.value) || 0)}
                  placeholder="₹ 0"
                  className="w-full text-sm font-mono font-bold text-slate-900 bg-white p-1.5 rounded border border-slate-300"
                />
              </div>

              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/60">
                <span className="text-[11px] font-semibold text-emerald-900 block mb-1">
                  Recovered Amount
                </span>
                <input
                  type="number"
                  value={activeCase.financial.amountRecovered || ''}
                  onChange={(e) => handleUpdateFinancial('recovered', Number(e.target.value) || 0)}
                  placeholder="₹ 0"
                  className="w-full text-sm font-mono font-bold text-emerald-950 bg-white p-1.5 rounded border border-emerald-200"
                />
              </div>

              <div className="p-3 rounded-lg border border-slate-900 bg-slate-900 text-white">
                <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Net Outstanding Loss
                </span>
                <p className="text-base font-mono font-extrabold text-white mt-1">
                  ₹{activeCase.financial.outstandingLoss.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Chronological Incident Timeline */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <span>⏱️</span> Chronological Incident Timeline ({activeCase.timeline.length} Events)
              </h4>
            </div>

            {/* Existing Timeline Events */}
            <div className="space-y-2.5">
              {activeCase.timeline.map((event, idx) => (
                <div
                  key={event.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono font-bold text-slate-400 mt-0.5">#{idx + 1}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">{event.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-600">
                          {event.dateStr}
                          {!event.isConfirmedDate && ' (approx)'}
                        </span>
                        {event.amountInvolved && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-100 text-red-900">
                            ₹{event.amountInvolved.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed">{event.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteTimelineEvent(event.id)}
                    className="text-slate-400 hover:text-red-600 font-bold px-1"
                    title="Delete event"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Add Event Sub-form */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                + Add Chronological Incident Event
              </span>
              <div className="grid gap-2.5 sm:grid-cols-3">
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Event title (e.g. Demand for advance tax)"
                  className="text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
                <select
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value as TimelineEventType)}
                  className="text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-700"
                >
                  <option value="initial_contact">Initial Contact</option>
                  <option value="suspicious_offer">Suspicious Offer</option>
                  <option value="app_installed">App Installed / APK</option>
                  <option value="funds_transferred">Funds Transferred</option>
                  <option value="demand_for_fees">Demand for Fees/Taxes</option>
                  <option value="contact_blocked">Contact Blocked / Ghosted</option>
                  <option value="complaint_filed">Official Complaint Filed</option>
                  <option value="other">Other Event</option>
                </select>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3">
                <textarea
                  rows={2}
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  placeholder="Describe what occurred, who communicated, or what instructions were given..."
                  className="text-xs p-2 rounded-lg border border-slate-300 bg-white sm:col-span-2"
                />
                <div className="space-y-2">
                  <input
                    type="number"
                    value={newEventAmount}
                    onChange={(e) => setNewEventAmount(e.target.value)}
                    placeholder="Amount involved (₹)"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                  <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEventDateConfirmed}
                      onChange={(e) => setIsEventDateConfirmed(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>Date is confirmed</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!newEventTitle.trim()}
                  onClick={handleAddTimelineEvent}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
                >
                  Log Event
                </button>
              </div>
            </div>
          </div>

          {/* Evidence Vault (with SHA-256 Hash Auditing) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>🔒</span> Evidence Vault & Cryptographic Integrity ({activeCase.evidenceVault.length} Records)
            </h4>

            <div className="space-y-3">
              {activeCase.evidenceVault.map((record) => (
                <div
                  key={record.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{record.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-600">
                        {record.category}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteEvidence(record.id)}
                      className="text-slate-400 hover:text-red-600 font-bold"
                      title="Remove evidence"
                    >
                      ✕
                    </button>
                  </div>

                  <pre className="p-2.5 rounded bg-white border border-slate-200 font-mono text-[11px] text-slate-800 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {record.content}
                  </pre>

                  <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                    <span className="font-mono">
                      SHA-256: {record.sha256Hash || 'Calculated upon export'}
                    </span>
                    <span>Added: {record.dateAdded}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Evidence Sub-form */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                + Vault New Evidence Item
              </span>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <input
                  type="text"
                  value={newEvidenceTitle}
                  onChange={(e) => setNewEvidenceTitle(e.target.value)}
                  placeholder="Evidence title (e.g. WhatsApp payment screenshot excerpt)"
                  className="text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
                <select
                  value={newEvidenceCategory}
                  onChange={(e) => setNewEvidenceCategory(e.target.value as EvidenceCategory)}
                  className="text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="chat_excerpt">Chat / SMS Transcript Excerpt</option>
                  <option value="screenshot_ocr">Screenshot OCR Text</option>
                  <option value="upi_id">Suspect UPI / VPA Identifier</option>
                  <option value="phone_number">Suspect Contact Number</option>
                  <option value="payment_receipt">Payment Reference / UTR Number</option>
                  <option value="url">Phishing / Malicious Domain URL</option>
                </select>
              </div>

              <textarea
                rows={2}
                value={newEvidenceContent}
                onChange={(e) => setNewEvidenceContent(e.target.value)}
                placeholder="Paste the raw text, transaction ID, or message excerpt..."
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!newEvidenceTitle.trim() || !newEvidenceContent.trim()}
                  onClick={handleAddEvidence}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
                >
                  Encrypt & Vault Evidence
                </button>
              </div>
            </div>
          </div>

          {/* Export & Privacy Control Actions */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors shadow-xs"
              >
                📥 Download Incident Dossier (.txt)
              </button>
              <button
                type="button"
                onClick={handleCopyReport}
                className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
              >
                {copied ? '✓ Copied Dossier' : '📋 Copy Dossier to Clipboard'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteActiveCase}
                className="px-3 py-1.5 text-xs font-semibold text-red-700 hover:text-red-900 underline"
              >
                Delete this Case
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmClearAll(true)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-700"
              >
                Clear All Local Cases
              </button>
            </div>
          </div>

          {/* Confirm Clear All Modal */}
          {showConfirmClearAll && (
            <div className="p-4 rounded-xl border border-red-300 bg-red-50 text-xs text-red-950 space-y-2">
              <p className="font-bold">Are you sure you want to delete all stored incident cases?</p>
              <p>This action cannot be undone. Data stored in local browser storage will be erased.</p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-red-700 rounded-lg hover:bg-red-800"
                >
                  Yes, Erase All Cases
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmClearAll(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10 space-y-3">
          <p className="text-sm font-semibold text-slate-700">No incident cases currently open.</p>
          <button
            type="button"
            onClick={handleCreateNewCase}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800"
          >
            Create Your First Case
          </button>
        </div>
      )}
    </div>
  )
}
