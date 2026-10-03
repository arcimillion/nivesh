import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnalysisResult } from '../api'
import {
  fetchCommunityIndicators,
  submitCommunityReportApi,
} from '../api'
import {
  type IndicatorCategory,
  type ScamCategory,
  type CommunityIndicatorAggregate,
  type CommunityReportInput,
} from '../types/community.ts'

interface CommunityIntelligenceProps {
  analysis?: AnalysisResult | null
  extractedText?: string
}

export function CommunityIntelligence({
  analysis,
}: CommunityIntelligenceProps) {
  const { t } = useTranslation()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [results, setResults] = useState<CommunityIndicatorAggregate[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Report submission modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Report form state
  const [formCategory, setFormCategory] = useState<IndicatorCategory>('phone_number')
  const [formIndicator, setFormIndicator] = useState('')
  const [formScamCategory, setFormScamCategory] = useState<ScamCategory>('guaranteed_return')
  const [formDesc, setFormDesc] = useState('')
  const [formExcerpt, setFormExcerpt] = useState('')
  const [formDirectExperience, setFormDirectExperience] = useState(true)
  const [formConsent, setFormConsent] = useState(false)

  const loadIndicators = async (query?: string, category?: string) => {
    setLoading(true)
    try {
      const data = await fetchCommunityIndicators(query, category)
      setResults(data.results || [])
      setHasSearched(Boolean(query || category))
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // Load initial community indicators
  useEffect(() => {
    let active = true
    fetchCommunityIndicators()
      .then((data) => {
        if (active) {
          setResults(data.results || [])
        }
      })
      .catch(() => {
        if (active) {
          setResults([])
        }
      })
    return () => {
      active = false
    }
  }, [])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    loadIndicators(searchQuery, selectedCategory)
  }

  const handleMatchWithAnalysis = () => {
    if (!analysis) return
    const candidate =
      analysis.extracted_phones?.[0]?.raw ||
      analysis.extracted_entities?.urls?.[0] ||
      analysis.extracted_entities?.phone_numbers?.[0] ||
      ''

    if (candidate) {
      setSearchQuery(candidate)
      loadIndicators(candidate)
    }
  }

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formConsent) {
      setSubmitError('Consent is required to submit a report.')
      return
    }
    if (!formIndicator.trim() || !formDesc.trim()) {
      setSubmitError('Please complete all required fields.')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    const payload: CommunityReportInput = {
      indicatorCategory: formCategory,
      rawIndicator: formIndicator.trim(),
      scamCategory: formScamCategory,
      description: formDesc.trim(),
      messageExcerpt: formExcerpt.trim() || undefined,
      incidentDate: new Date().toISOString().split('T')[0],
      isDirectExperience: formDirectExperience,
      userConsentGiven: true,
    }

    try {
      await submitCommunityReportApi(payload)
      setSubmitSuccess(true)
      setTimeout(() => {
        setIsSubmitModalOpen(false)
        setSubmitSuccess(false)
        setFormIndicator('')
        setFormDesc('')
        setFormExcerpt('')
        setFormConsent(false)
        loadIndicators()
      }, 1800)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit report'
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const getTrustBadge = (label: string, isDemo: boolean) => {
    if (isDemo) {
      return (
        <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
          DEMO DATA — NOT A REAL-WORLD REPORT
        </span>
      )
    }
    switch (label) {
      case 'officially_confirmed':
        return (
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded">
            Officially Confirmed (Regulatory Order)
          </span>
        )
      case 'multiple_reports_unverified':
        return (
          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
            Multiple Community Reports — Not Independently Verified
          </span>
        )
      default:
        return (
          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded">
            Community Reported — Unverified Allegation
          </span>
        )
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <h3 className="text-base font-bold text-slate-900">
              {t('community.title', 'Community Scam Pattern Intelligence')}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-600 max-w-2xl">
            {t(
              'community.subtitle',
              'A privacy-conscious collective intelligence layer. Discloses recurring suspicious phone numbers, domains, and payment handles while strictly distinguishing community reports from official findings.',
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            + Report Suspicious Pattern
          </button>
        </div>
      </div>

      {/* Prominent Ethical Standard Banner */}
      <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 text-xs text-blue-950 flex items-start gap-2.5">
        <span className="text-base mt-0.5">ℹ️</span>
        <div>
          <span className="font-bold block">Privacy & Due Process Invariant:</span>
          <span>
            Community reports represent crowdsourced warning signals and are NEVER treated as proof
            of criminal conduct. Contact identifiers are masked in public views to prevent doxxing or
            abuse.
          </span>
        </div>
      </div>

      {/* Search Bar & Auto-Match */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by masked phone, domain, UPI ID, or tactic keyword..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 bg-white pl-8 outline-none focus:border-emerald-600"
            />
            <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-300 p-2.5 text-xs text-slate-700 bg-white"
          >
            <option value="">All Categories</option>
            <option value="phone_number">Phone Numbers</option>
            <option value="domain_url">Phishing Domains</option>
            <option value="upi_identifier">UPI Identifiers</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
          >
            Search
          </button>
        </form>

        {analysis && (
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-slate-600">
              Active Investigation Context Available (Extracted identifiers detected)
            </span>
            <button
              type="button"
              onClick={handleMatchWithAnalysis}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
            >
              Match Analysis Indicators Against Community Intel ➔
            </button>
          </div>
        )}
      </div>

      {/* Indicators List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-100 pb-2">
          <span className="font-bold text-slate-800 uppercase tracking-wider">
            Reported Suspicious Patterns ({results.length})
          </span>
          {loading && <span className="animate-pulse">Loading intelligence...</span>}
        </div>

        {results.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {results.map((item) => (
              <div
                key={item.indicatorKey}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-slate-300 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-mono text-sm font-bold text-slate-900 block">
                      {item.maskedIdentifier}
                    </span>
                    <span className="text-[10px] uppercase font-mono text-slate-500">
                      {item.category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-800">
                    {item.reportCount} Reports
                  </span>
                </div>

                {/* Trust Label */}
                <div>{getTrustBadge(item.trustLabel, item.isDemoData)}</div>

                {/* Description Excerpt */}
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {item.sampleDescription}
                </p>

                {/* Tactics Tag List */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.topTactics.map((tactic, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700"
                    >
                      {tactic}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200/60 font-mono">
                  <span>First: {item.firstSeen}</span>
                  <span>Last: {item.lastSeen}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-2">
            <span className="text-2xl">🔍</span>
            <p className="text-xs font-bold text-slate-800">
              {hasSearched
                ? 'No matching community reports were found in the available dataset.'
                : 'No community records matching criteria.'}
            </p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Absence of community reports does NOT confirm that an entity is legitimate or safe.
              Always verify licenses on sebi.gov.in.
            </p>
          </div>
        )}
      </div>

      {/* Report Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 animate-fade-in my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">
                Submit Community Scam Report
              </h4>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Privacy Warning */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
              ⚠️ <strong>DO NOT include:</strong> OTPs, passwords, complete account numbers, or
              personal identity documents (Aadhaar/PAN).
            </div>

            {submitSuccess ? (
              <div className="p-6 text-center space-y-2">
                <span className="text-3xl">✅</span>
                <h5 className="text-sm font-bold text-emerald-950">Report Recorded</h5>
                <p className="text-xs text-slate-600">
                  Thank you for contributing to investor resilience. The identifier will be masked
                  in accordance with privacy standards.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Indicator Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as IndicatorCategory)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="phone_number">Phone Number</option>
                      <option value="domain_url">Website / Phishing URL</option>
                      <option value="upi_identifier">UPI / VPA ID</option>
                      <option value="telegram_whatsapp_group">Group Link / Name</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Scam Tactic</label>
                    <select
                      value={formScamCategory}
                      onChange={(e) => setFormScamCategory(e.target.value as ScamCategory)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="guaranteed_return">Guaranteed Return / Doubling</option>
                      <option value="fake_trading_app">Fake Trading App / Sideloaded APK</option>
                      <option value="pre_ipo_scam">Pre-IPO / Off-Market Demat Scam</option>
                      <option value="impersonation_adviser">Impersonation of Broker / Adviser</option>
                      <option value="task_job_fraud">Prepaid Task / Part-time Job Scam</option>
                      <option value="other">Other Suspicious Solicitation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Suspect Indicator Value
                  </label>
                  <input
                    type="text"
                    value={formIndicator}
                    onChange={(e) => setFormIndicator(e.target.value)}
                    placeholder="e.g. +91 9876543210, suspect@oksbi, or domain-name.com"
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Suspicious Behavior Description
                  </label>
                  <textarea
                    rows={3}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Describe what was offered, what demands were made, and why this raised concerns..."
                    className="w-full p-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Message Excerpt (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formExcerpt}
                    onChange={(e) => setFormExcerpt(e.target.value)}
                    placeholder="Paste a short sanitized text excerpt if available..."
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formDirectExperience}
                      onChange={(e) => setFormDirectExperience(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>I personally received or experienced this communication.</span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formConsent}
                      onChange={(e) => setFormConsent(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600"
                      required
                    />
                    <span className="font-medium text-slate-800">
                      I confirm this report does not contain OTPs, passwords, or private identity
                      documents, and consent to contributing masked indicator patterns to the
                      community resilience dataset.
                    </span>
                  </label>
                </div>

                {submitError && (
                  <p className="text-red-700 font-bold bg-red-50 p-2 rounded border border-red-200">
                    {submitError}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formConsent}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
