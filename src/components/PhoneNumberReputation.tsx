import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  checkPhoneReputation,
  type PhoneReputationInvestigation,
  type PhoneReputationSourceResult,
  type ExtractedPhoneItem,
} from '../api'

interface PhoneNumberReputationProps {
  extractedPhones?: ExtractedPhoneItem[]
  originalText?: string
}

export const PhoneNumberReputation: React.FC<PhoneNumberReputationProps> = ({
  extractedPhones = [],
  originalText = '',
}) => {
  const { t } = useTranslation()

  // Selected or typed phone number state
  const [phoneList, setPhoneList] = useState<string[]>(() => {
    const list = extractedPhones.map((p) => p.normalized_e164 || p.raw)
    return Array.from(new Set(list))
  })
  const [selectedPhone, setSelectedPhone] = useState<string>(() => {
    return phoneList[0] || ''
  })
  const [manualInput, setManualInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [investigation, setInvestigation] = useState<PhoneReputationInvestigation | null>(null)

  // Sync if extracted phones change
  const [prevExtracted, setPrevExtracted] = useState(extractedPhones)
  if (extractedPhones !== prevExtracted) {
    setPrevExtracted(extractedPhones)
    const list = Array.from(new Set(extractedPhones.map((p) => p.normalized_e164 || p.raw)))
    setPhoneList(list)
    if (list.length > 0 && !selectedPhone) {
      setSelectedPhone(list[0])
    }
  }

  const handleAddManualPhone = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = manualInput.trim()
    if (!trimmed) return
    if (!phoneList.includes(trimmed)) {
      setPhoneList((prev) => [...prev, trimmed])
    }
    setSelectedPhone(trimmed)
    setManualInput('')
    setError(null)
  }

  const handleRemovePhone = (phoneToRemove: string) => {
    setPhoneList((prev) => prev.filter((p) => p !== phoneToRemove))
    if (selectedPhone === phoneToRemove) {
      const remaining = phoneList.filter((p) => p !== phoneToRemove)
      setSelectedPhone(remaining[0] || '')
      setInvestigation(null)
    }
  }

  const handleRunInvestigation = async (numberToInvestigate?: string) => {
    const target = numberToInvestigate || selectedPhone
    if (!target) return

    setLoading(true)
    setError(null)
    try {
      const result = await checkPhoneReputation(target, originalText)
      setInvestigation(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to investigate phone reputation'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: PhoneReputationSourceResult['status']) => {
    switch (status) {
      case 'reported':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200">
            <span>⚠️</span> {t('phoneInvestigation.statusReported', 'Flagged / Regulatory Warning')}
          </span>
        )
      case 'no_match':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-800 border border-slate-300">
            <span>⚪</span> {t('phoneInvestigation.statusNoMatch', 'No Reports (Not Proof of Safety)')}
          </span>
        )
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 border border-blue-200">
            <span>ℹ️</span> {t('phoneInvestigation.statusUnavailable', 'Automated Lookup Unavailable')}
          </span>
        )
      case 'inconclusive':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
            <span>❓</span> {t('phoneInvestigation.statusInconclusive', 'Inconclusive / Format Unrecognized')}
          </span>
        )
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-lg text-blue-800">
            📞
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {t('phoneInvestigation.title', 'Contact Number Reputation & Scam Investigation')}
            </h3>
            <p className="text-xs text-slate-600">
              {t(
                'phoneInvestigation.subtitle',
                'Verify WhatsApp numbers, SMS senders, and telegram contacts against telecom regulations and official cybercrime repositories.',
              )}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
          <span>🔒</span> {t('phoneInvestigation.privacyGuaranteed', 'Zero Persistence & Masked Logs')}
        </span>
      </div>

      {/* SECTION 1: Phone Selection & Management */}
      <div className="mt-5 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            {t('phoneInvestigation.selectNumberLabel', 'Contacts detected from content or manually added:')}
          </label>

          {phoneList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {phoneList.map((phone) => (
                <div
                  key={phone}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer ${
                    selectedPhone === phone
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-100'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                  onClick={() => {
                    setSelectedPhone(phone)
                    setInvestigation(null)
                  }}
                >
                  <span>📱</span>
                  <span>{phone}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemovePhone(phone)
                    }}
                    className="text-slate-400 hover:text-red-600 ml-1"
                    title={t('phoneInvestigation.remove', 'Remove')}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center text-xs text-slate-500">
              {t(
                'phoneInvestigation.noNumbersFound',
                'No contact phone numbers detected automatically in the submitted content. You can add one below to investigate.',
              )}
            </div>
          )}
        </div>

        {/* Manual Number Add Input */}
        <form onSubmit={handleAddManualPhone} className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={t(
              'phoneInvestigation.inputPlaceholder',
              'Enter phone number (e.g. +91 98765 43210 or 9876543210)...',
            )}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-mono"
          />
          <button
            type="submit"
            disabled={!manualInput.trim()}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {t('phoneInvestigation.addNumberBtn', '+ Add Contact')}
          </button>
        </form>

        {/* Action Button */}
        {selectedPhone && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => handleRunInvestigation(selectedPhone)}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-blue-800 disabled:opacity-50 w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{t('phoneInvestigation.investigatingBtn', 'Querying Repositories & Telecom Standards...')}</span>
                </>
              ) : (
                <>
                  <span>🔎</span>
                  <span>
                    {t('phoneInvestigation.investigateBtn', 'Investigate Contact Reputation for')}{' '}
                    <span className="font-mono">{selectedPhone}</span>
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* SECTION 2: Investigation Results Report */}
      {investigation && (
        <div className="mt-6 space-y-5 border-t border-slate-100 pt-5">
          {/* Header Summary Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t('phoneInvestigation.normalizedHeading', 'Analyzed Target Number')}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-base font-extrabold text-slate-900">
                    {investigation.normalized_e164 || investigation.raw_input}
                  </span>
                  <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {investigation.country_code} ({investigation.format_description})
                  </span>
                </div>
              </div>

              {/* Crucial Safety Guardrail Banner */}
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-[11px] font-medium text-amber-950 sm:max-w-xs">
                ⚠️ <strong>Safety Rule:</strong> A clean or unlisted record does <em>not</em> prove safety. Scammers routinely activate fresh SIM cards.
              </div>
            </div>
          </div>

          {/* 4 STRICTLY SEPARATED EVIDENCE CATEGORIES */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {t('phoneInvestigation.evidenceBreakdownHeading', 'Evidence Categorization & Verification Breakdown')}
            </h4>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Category 1: Message Warning Signs */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-900 text-[10px]">
                    1
                  </span>
                  <span>{t('phoneInvestigation.category1', 'Warning Signs in Content')}</span>
                </div>
                {investigation.evidence_synthesis.message_warning_signs.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {investigation.evidence_synthesis.message_warning_signs.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-600">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    {t('phoneInvestigation.noDirectMessageWarnings', 'No aggressive keywords directly tied to this number in context.')}
                  </p>
                )}
              </div>

              {/* Category 2: External Source Reputation */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-900 text-[10px]">
                    2
                  </span>
                  <span>{t('phoneInvestigation.category2', 'External Reputation Findings')}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {investigation.evidence_synthesis.external_reputation_summary}
                </p>
              </div>

              {/* Category 3: Facts Verified via Official Sources */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-900 text-[10px]">
                    3
                  </span>
                  <span>{t('phoneInvestigation.category3', 'Official Regulatory Standards')}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {investigation.evidence_synthesis.official_verification_status}
                </p>
              </div>

              {/* Category 4: Information that could NOT be verified */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-800 text-[10px]">
                    4
                  </span>
                  <span>{t('phoneInvestigation.category4', 'What Remains Unverified')}</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {investigation.evidence_synthesis.unverified_elements.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-slate-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Source Breakdown Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              {t('phoneInvestigation.sourceResultsHeading', 'Detailed Source Inspection Records')}
            </h4>

            <div className="space-y-2.5">
              {investigation.results.map((src, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{src.source_name}</span>
                      {src.source_url && (
                        <a
                          href={src.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-600 hover:underline font-normal"
                        >
                          [source ↗]
                        </a>
                      )}
                    </div>
                    <div>{getStatusBadge(src.status)}</div>
                  </div>

                  {src.label && (
                    <div className="rounded-md bg-white border border-slate-200 px-2.5 py-1.5 font-medium text-slate-800">
                      <strong>Notice:</strong> {src.label}
                    </div>
                  )}

                  <div className="text-slate-600 text-[11px] leading-relaxed">
                    <strong>Limitations:</strong> {src.limitations}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* OFFICIAL MANUAL VERIFICATION & REPORTING PORTALS */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-2 mb-2">
              <span>🏛️</span> {t('phoneInvestigation.officialPortalsHeading', 'Official Government Verification & Reporting Direct Links')}
            </h4>
            <p className="text-xs text-emerald-900 leading-relaxed mb-3">
              {t(
                'phoneInvestigation.officialPortalsDesc',
                'Government cybercrime portals protect citizen privacy with CAPTCHA and do not permit automated third-party scraping. Use these verified official government portals to check or report suspicious contacts directly:',
              )}
            </p>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {investigation.official_verification_links.map((link, idx) => (
                <div key={idx} className="rounded-lg border border-emerald-100 bg-white p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{link.name}</span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      Open Portal ↗
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">{link.authority}</p>
                  <p className="text-[11px] text-slate-700 leading-normal">{link.instructions}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Final Privacy & Safety Advisory */}
          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>🛡️ {investigation.privacy_notice}</span>
            <span>
              Helpline:{' '}
              <a href="tel:1930" className="font-bold text-blue-700 hover:underline">
                Call 1930
              </a>{' '}
              (National Cyber Financial Fraud)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
