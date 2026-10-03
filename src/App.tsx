import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  analyzeMessage,
  type AnalysisResult,
  type AnalyzeOptions,
} from './api'
import { evaluateLocally } from './localRegulatoryEngine'
import { officialSources } from './officialSources'
import { MultimodalInput } from './components/MultimodalInput'
import { ClaimInvestigation } from './components/ClaimInvestigation'
import { ScamJourneyMap } from './components/ScamJourneyMap'
import { VoiceAssistant } from './components/VoiceAssistant'
import { IncidentResponse } from './components/IncidentResponse'
import { PhoneNumberReputation } from './components/PhoneNumberReputation'
import { DematSafetyChecker } from './components/DematSafetyChecker'
import { SebiValidator } from './components/SebiValidator'
import { NiveshParivarCard } from './components/NiveshParivarCard'
import { CoolingOffCalculator } from './components/CoolingOffCalculator'
import { ComplaintDossierGenerator } from './components/ComplaintDossierGenerator'
import { SpotTheScamSimulation } from './components/SpotTheScamSimulation'
import { EvidenceGraph } from './components/EvidenceGraph'
import { PreTransactionSafetyGate } from './components/PreTransactionSafetyGate'
import { ScamIncidentCasebook } from './components/ScamIncidentCasebook'
import { CommunityIntelligence } from './components/CommunityIntelligence'

type ActiveFeatureTab =
  | 'multimodal'
  | 'graph'
  | 'safety_gate'
  | 'casebook'
  | 'community'
  | 'demat'
  | 'sebi'
  | 'cooling'
  | 'sandbox'
  | 'dossier'

function App() {
  const { t, i18n } = useTranslation()

  const [activeTab, setActiveTab] = useState<ActiveFeatureTab>('multimodal')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoText, setDemoText] = useState('')
  const [activeDemoKey, setActiveDemoKey] = useState<'ex1Text' | 'ex2Text' | 'ex3Text' | null>(null)
  const [lastAnalyzeOptions, setLastAnalyzeOptions] = useState<AnalyzeOptions | null>(null)

  const handleLanguageChange = (newLang: string) => {
    i18n.changeLanguage(newLang)

    if (activeDemoKey) {
      const text = i18n.t(`demoExamples.${activeDemoKey}`, { lng: newLang })
      setDemoText(text)
    }

    if (lastAnalyzeOptions && analysis) {
      const updatedOptions: AnalyzeOptions = {
        ...lastAnalyzeOptions,
        language: newLang,
        message: activeDemoKey
          ? i18n.t(`demoExamples.${activeDemoKey}`, { lng: newLang })
          : lastAnalyzeOptions.message,
      }
      setLastAnalyzeOptions(updatedOptions)
      const updatedAnalysis = evaluateLocally(updatedOptions)
      setAnalysis(updatedAnalysis)
    }
  }

  const handleAnalyze = async (options: AnalyzeOptions) => {
    setLoading(true)
    setError('')
    setAnalysis(null)
    setLastAnalyzeOptions(options)

    try {
      const result = await analyzeMessage(options)
      setAnalysis(result)
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error
          ? err.message
          : t('analysis.analysisErrorTitle', 'Analysis could not be completed'),
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDemoSelect = (exampleKey: 'ex1Text' | 'ex2Text' | 'ex3Text') => {
    setActiveDemoKey(exampleKey)
    const text = t(`demoExamples.${exampleKey}`)
    setDemoText(text)
    setError('')
  }

  const handleClear = () => {
    setDemoText('')
    setActiveDemoKey(null)
    setLastAnalyzeOptions(null)
    setError('')
    setAnalysis(null)
  }

  const getStatusTitle = () => {
    if (!analysis) return ''

    if (analysis.overall_status === 'warning_signs_found') {
      return t('analysis.warning', 'Warning signs identified')
    }
    if (analysis.overall_status === 'no_obvious_warning_signs') {
      return t('analysis.noWarning', 'No obvious warning signs identified')
    }
    return t('analysis.insufficientEvidence', 'More information required')
  }

  const getUncertaintyBadge = (rating?: string) => {
    switch (rating) {
      case 'low':
        return (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-900 border border-emerald-300">
            {t('analysis.highConfidence', 'High Confidence Analysis')}
          </span>
        )
      case 'medium':
        return (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-300">
            {t('analysis.moderateUncertainty', 'Moderate Uncertainty')}
          </span>
        )
      case 'high':
      default:
        return (
          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-800 border border-slate-300">
            {t('analysis.highUncertainty', 'High Uncertainty / Limited Evidence')}
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-xl font-bold text-white shadow-sm ring-1 ring-emerald-800">
              🛡️
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                  {t('brand', 'NiveshShield 2.0')}
                </h1>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                  {t('multimodalBadge', 'Multimodal')}
                </span>
              </div>

              <p className="text-xs font-medium text-slate-500 hidden sm:block">
                {t('tagline', 'Understand evidence before you trust.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold tracking-wide text-emerald-800 md:inline-block">
              {t('investorResilienceBadge', '🇮🇳 INVESTOR RESILIENCE PLATFORM')}
            </span>

            <select
              value={i18n.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              aria-label={t('language', 'Language')}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
              <option value="bn">বাংলা</option>
              <option value="ta">தமிழ்</option>
              <option value="gu">ગુજરાતી</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {/* Hero Section */}
        <section className="mb-6 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              <span>🛡️</span>
              <span>{t('hero.tag', 'Multimodal AI & Official Source Verification')}</span>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-2xs">
              {t('sangyanBadge', '🏛️ IIT (BHU) SANGYAN Hackathon • SEBI & NSDL Investor Protection')}
            </span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {t('hero.title', 'Verify investment claims with evidence, not assumptions.')}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            {t(
              'hero.description',
              'Analyze messages, uploaded screenshots, web links, or voice notes against official SEBI, RBI, and CyberCrime reporting guidelines.',
            )}
          </p>
        </section>

        {/* Feature Navigation Tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-8 border-b border-slate-200" aria-label="Feature navigation">
          <button
            type="button"
            onClick={() => setActiveTab('multimodal')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'multimodal'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>🛡️</span>
            <span>{t('nav.multimodal', 'Multimodal Scanner')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'graph'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>🕸️</span>
            <span>{t('nav.graph', 'Evidence Graph')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('safety_gate')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'safety_gate'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>🛑</span>
            <span>{t('nav.safetyGate', 'Safety Gate')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('casebook')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'casebook'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>📁</span>
            <span>{t('nav.casebook', 'Incident Casebook')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('community')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'community'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>🌐</span>
            <span>{t('nav.community', 'Community Intel')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('demat')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'demat'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>🏛️</span>
            <span>{t('nav.demat', 'NSDL Demat Shield')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sebi')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'sebi'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>📜</span>
            <span>{t('nav.sebi', 'SEBI Validator')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cooling')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'cooling'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>⏱️</span>
            <span>{t('nav.cooling', 'Cooling-Off Shield')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sandbox')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'sandbox'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>🎯</span>
            <span>{t('nav.sandbox', 'Spot-the-Scam Sandbox')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dossier')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'dossier'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>📋</span>
            <span>{t('nav.dossier', '1930 / Chakshu Dossier')}</span>
          </button>
        </nav>

        {/* Tab: Evidence Graph */}
        {activeTab === 'graph' && (
          <div className="space-y-6">
            <EvidenceGraph
              analysis={analysis}
              submittedText={demoText}
              onOpenSafetyGate={() => setActiveTab('safety_gate')}
              onOpenCasebook={() => setActiveTab('casebook')}
            />
          </div>
        )}

        {/* Tab: Pre-Transaction Safety Gate */}
        {activeTab === 'safety_gate' && (
          <div className="space-y-6">
            <PreTransactionSafetyGate
              analysis={analysis}
              onOpenEvidenceGraph={() => setActiveTab('graph')}
              onOpenCasebook={() => setActiveTab('casebook')}
            />
          </div>
        )}

        {/* Tab: Scam Incident Casebook */}
        {activeTab === 'casebook' && (
          <div className="space-y-6">
            <ScamIncidentCasebook analysis={analysis} extractedText={demoText} />
          </div>
        )}

        {/* Tab: Community Scam Intelligence */}
        {activeTab === 'community' && (
          <div className="space-y-6">
            <CommunityIntelligence analysis={analysis} extractedText={demoText} />
          </div>
        )}

        {/* Tab: NSDL Demat Shield */}
        {activeTab === 'demat' && (
          <div className="space-y-6">
            <DematSafetyChecker />
          </div>
        )}

        {/* Tab: SEBI Validator */}
        {activeTab === 'sebi' && (
          <div className="space-y-6">
            <SebiValidator />
          </div>
        )}

        {/* Tab: Cooling-Off Shield */}
        {activeTab === 'cooling' && (
          <div className="space-y-6">
            <CoolingOffCalculator />
          </div>
        )}

        {/* Tab: Spot-the-Scam Sandbox */}
        {activeTab === 'sandbox' && (
          <div className="space-y-6">
            <SpotTheScamSimulation />
          </div>
        )}

        {/* Tab: 1930 / Chakshu Dossier Generator */}
        {activeTab === 'dossier' && (
          <div className="space-y-6">
            <ComplaintDossierGenerator analysis={analysis} extractedText={demoText} />
          </div>
        )}

        {/* Tab 1: Multimodal Scanner Core Flow */}
        {activeTab === 'multimodal' && (
          <>
            {/* Checker & Demo Grid */}
            <section className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-6">
            {/* Demo Examples Selector */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
              <div className="mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <span>💡</span> {t('demoExamples.title', 'Try a Demo Case')}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t(
                    'demoExamples.subtitle',
                    'Click an example below to test multimodal analysis capability.',
                  )}
                </p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleDemoSelect('ex1Text')}
                  className="group rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-amber-400 hover:bg-amber-50/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {t('demoExamples.ex1Title', 'Guaranteed Returns')}
                    </span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      {t('demoExamples.ex1Badge', 'High Risk')}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">
                    "{t('demoExamples.ex1Text')}"
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoSelect('ex2Text')}
                  className="group rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-blue-400 hover:bg-blue-50/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {t('demoExamples.ex2Title', 'Ambiguous Scheme')}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                      {t('demoExamples.ex2Badge', 'Needs Verification')}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">
                    "{t('demoExamples.ex2Text')}"
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoSelect('ex3Text')}
                  className="group rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {t('demoExamples.ex3Title', 'Benign Educational')}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {t('demoExamples.ex3Badge', 'Educational')}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">
                    "{t('demoExamples.ex3Text')}"
                  </p>
                </button>
              </div>
            </div>

            {/* Multimodal Input Form */}
            <MultimodalInput
              onAnalyze={handleAnalyze}
              loading={loading}
              onClear={handleClear}
              initialText={demoText}
            />

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
                <p className="text-sm font-bold text-red-900 flex items-center gap-1.5">
                  <span>⚠️</span> {t('analysis.errorHeading', 'Analysis Error')}
                </p>
                <p className="mt-1 text-xs leading-5 text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Safety Sidebar */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-xl text-white shadow-xs">
                🛡️
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-900">
                {t('sidebar.title', 'Core Safety & Principles')}
              </h3>

              <p className="mt-1 text-xs leading-relaxed text-slate-700">
                {t(
                  'sidebar.subtitle',
                  'NiveshShield 2.0 evaluates claims against official regulatory standards to protect retail investors from manipulation.',
                )}
              </p>

              <div className="mt-5 space-y-2.5">
                <div className="rounded-xl border border-emerald-100 bg-white p-3.5 shadow-2xs">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>🔬</span> {t('sidebar.evidenceGroundingTitle', 'Evidence Grounding')}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
                    {t(
                      'sidebar.evidenceGroundingText',
                      'Claims are mapped directly to quotes and verified against SEBI & RBI rules.',
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-white p-3.5 shadow-2xs">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>🗺️</span> {t('sidebar.scamJourneyTitle', 'Scam Journey Tactic Map')}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
                    {t(
                      'sidebar.scamJourneyText',
                      'Visualizes observed tactics vs future escalation risks.',
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-white p-3.5 shadow-2xs">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>🔒</span> {t('sidebar.dataMinimizationTitle', 'Data Minimization')}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
                    {t(
                      'sidebar.dataMinimizationText',
                      'Uploaded screenshots and audio notes are processed in-memory and never stored.',
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-emerald-200/60 pt-4 text-xs text-emerald-900 font-semibold">
              <span>{t('sidebar.helpline', 'Helpline 1930 • CyberCrime Portal')}</span>
            </div>
          </div>
        </section>

        {/* ANALYSIS RESULTS DISPLAY SECTION */}
        {analysis && (
          <section className="mt-10 animate-fade-in" aria-live="polite">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-8">
              {/* Overall Assessment Status Banner */}
              <div
                className={`rounded-2xl border p-6 ${
                  analysis.overall_status === 'warning_signs_found'
                    ? 'border-amber-300 bg-amber-50/90 text-amber-950'
                    : analysis.overall_status === 'no_obvious_warning_signs'
                      ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950'
                      : 'border-slate-300 bg-slate-50 text-slate-900'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">
                      {analysis.overall_status === 'warning_signs_found'
                        ? '⚠️'
                        : analysis.overall_status === 'no_obvious_warning_signs'
                          ? '✅'
                          : 'ℹ️'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                          {t('analysis.assessment', 'Analysis Assessment')}
                        </span>
                        {getUncertaintyBadge(analysis.uncertainty_rating)}
                        <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                          {t('analysis.modalityLabel', {
                            modality: analysis.input_modality || 'Text',
                            defaultValue: `Modality: ${analysis.input_modality || 'Text'}`,
                          })}
                        </span>
                      </div>

                      <h3 className="mt-1 text-2xl font-extrabold tracking-tight">
                        {getStatusTitle()}
                      </h3>

                      <p className="mt-1.5 text-xs sm:text-sm font-medium leading-relaxed">
                        {analysis.summary ||
                          t(
                            'analysis.review',
                            'Review findings below. Always verify entity credentials on official SEBI or RBI directories before acting.',
                          )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Multilingual Voice Assistant Banner */}
                <div className="mt-5 border-t border-slate-200/60 pt-4">
                  <VoiceAssistant analysis={analysis} />
                </div>
              </div>

              {/* QUICK ACTION ADVANCED SUITE LAUNCHER */}
              <div className="flex items-center justify-between flex-wrap gap-2.5 p-3 rounded-xl bg-slate-100 border border-slate-200">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>⚡</span> Deep Investigation & Safety Tools:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveTab('graph')}
                    className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1"
                  >
                    <span>🕸️</span> Evidence Graph
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('safety_gate')}
                    className="px-3 py-1.5 text-xs font-bold text-red-900 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors shadow-2xs flex items-center gap-1"
                  >
                    <span>🛑</span> Safety Gate
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('casebook')}
                    className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1"
                  >
                    <span>📁</span> Casebook
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('community')}
                    className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1"
                  >
                    <span>🌐</span> Community Intel
                  </button>
                </div>
              </div>

              {/* FEATURE 1: Interactive Scam Evidence Graph */}
              <EvidenceGraph
                analysis={analysis}
                submittedText={demoText}
                onOpenSafetyGate={() => setActiveTab('safety_gate')}
                onOpenCasebook={() => setActiveTab('casebook')}
              />

              {/* Extracted Content Review Box (if extracted from OCR/Audio/URL) */}
              {analysis.extracted_text && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span>📄</span> {t('analysis.contentAnalyzed', 'Content Analyzed')}
                    </span>
                    {analysis.extraction_uncertainty?.has_uncertainty && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                        {t('analysis.extractionNote', {
                          notes: analysis.extraction_uncertainty.notes,
                          defaultValue: `Extraction Note: ${analysis.extraction_uncertainty.notes}`,
                        })}
                      </span>
                    )}
                  </div>
                  <div className="max-h-36 overflow-y-auto font-mono text-xs text-slate-800 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap">
                    {analysis.extracted_text}
                  </div>
                </div>
              )}

              {/* FEATURE 2: Evidence-Grounded Claim Investigation */}
              <ClaimInvestigation claims={analysis.claims || []} />

              {/* FEATURE 4: Scam Journey Tactic Map */}
              <ScamJourneyMap stages={analysis.scam_journey_map || []} />

              {/* FEATURE 6: Phone Number Reputation & Scam Contact Investigation */}
              <PhoneNumberReputation
                extractedPhones={analysis.extracted_phones || []}
                originalText={analysis.extracted_text || ''}
              />

              {/* SPECIFIC WARNING INDICATOR FINDINGS */}
              {analysis.findings && analysis.findings.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-4">
                    <span>🔍</span> {t('analysis.specificWarnings', 'Specific Warning Indicators Identified')}
                  </h4>

                  <div className="grid gap-4">
                    {analysis.findings.map((finding, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 transition hover:border-slate-300"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-800">
                            !
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <h5 className="text-sm font-bold text-slate-900 capitalize">
                                {t(`analysis.${finding.indicator}`, finding.indicator.replace(/_/g, ' '))}
                              </h5>
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                {t(`analysis.${finding.verification_status}`, finding.verification_status.replace(/_/g, ' '))}
                              </span>
                            </div>

                            <p className="mt-2 text-xs font-mono text-slate-900 bg-white p-2.5 rounded border border-slate-200">
                              “{finding.original_excerpt}”
                            </p>

                            <p className="mt-2 text-xs text-slate-700 leading-relaxed font-medium">
                              {finding.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FEATURE 5: Personalized Incident Response */}
              <IncidentResponse />

              {/* BHARAT-FIRST: Nivesh Parivar Family Warning Card & Vernacular Reader */}
              <NiveshParivarCard analysis={analysis} extractedText={analysis.extracted_text} />

              {/* ACTIONABLE: 1-Click Official Complaint Dossier Generator */}
              <ComplaintDossierGenerator analysis={analysis} extractedText={analysis.extracted_text} />

              {/* Unknowns & Limitations */}
              <div className="grid gap-4 sm:grid-cols-2">
                {analysis.unknowns && analysis.unknowns.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                      <span>❓</span> {t('analysis.whatCouldNotBeVerified', 'What Could Not Be Verified')}
                    </h5>
                    <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                      {analysis.unknowns.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-slate-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.limitations && analysis.limitations.length > 0 && (
                  <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
                    <h5 className="text-xs font-bold text-amber-950 flex items-center gap-1.5 mb-2">
                      <span>⚠️</span> {t('analysis.limitationsAndScope', 'Analysis Limitations & Scope')}
                    </h5>
                    <ul className="space-y-1.5 text-xs text-amber-900 leading-relaxed">
                      {analysis.limitations.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Official Investor Resources List */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  {t(
                    'analysis.officialGuidanceHeading',
                    'Official Regulatory Guidance & Verification Channels',
                  )}
                </h5>

                <div className="grid gap-3 sm:grid-cols-2">
                  {officialSources.map((source) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-lg border border-slate-200 bg-white p-3 transition hover:border-emerald-400 hover:bg-emerald-50/40"
                    >
                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                        {t(`officialSources.${source.id}.title`, source.title)} ↗
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500 leading-normal line-clamp-2">
                        {t(`officialSources.${source.id}.description`, source.description)}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </>
    )}

        {/* Privacy Principles */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-700">
              🔒
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('privacy.title', 'Privacy, Data Minimization & Security Principles')}
              </h3>
              <p className="mt-0.5 text-xs text-slate-600">
                {t(
                  'privacy.short',
                  'Submitted text, screenshots, URLs, and voice recordings are processed in-memory solely for real-time analysis and are never persisted or shared.',
                )}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <p className="text-xs text-slate-500 max-w-3xl mx-auto">
            {t(
              'disclaimer',
              'NiveshShield 2.0 provides educational safety guidance based on official Indian investor protection resources. It does not provide financial advice or definitive legal fraud verdicts.',
            )}
          </p>
          <p className="mt-2 text-[11px] text-slate-400 font-medium">
            {t(
              'footer.platform',
              'NiveshShield 2.0 — Multimodal AI Investor-Resilience Platform',
            )}
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
