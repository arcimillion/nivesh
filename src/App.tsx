import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  analyzeMessage,
  type AnalysisResult,
  type AnalyzeOptions,
} from './api'
import { evaluateLocally } from './localRegulatoryEngine'
import { MultimodalScamScanner } from './components/MultimodalScamScanner'
import { VerdictCard } from './components/VerdictCard'
import { ScamJourneyMap } from './components/ScamJourneyMap'
import { ComplaintDossierGenerator } from './components/ComplaintDossierGenerator'
import { HowItWorksModal } from './components/HowItWorksModal'
import { NiveshParivarCard } from './components/NiveshParivarCard'
import { PhoneNumberReputation } from './components/PhoneNumberReputation'

// Advanced Tools Modal imports (accessible via discreet header link)
import { DematSafetyChecker } from './components/DematSafetyChecker'
import { SebiValidator } from './components/SebiValidator'
import { PreTransactionSafetyGate } from './components/PreTransactionSafetyGate'
import { EvidenceGraph } from './components/EvidenceGraph'
import { ScamIncidentCasebook } from './components/ScamIncidentCasebook'
import { CommunityIntelligence } from './components/CommunityIntelligence'
import { CoolingOffCalculator } from './components/CoolingOffCalculator'
import { SpotTheScamSimulation } from './components/SpotTheScamSimulation'

type AdvancedToolTab =
  | 'demat'
  | 'sebi'
  | 'safety_gate'
  | 'graph'
  | 'casebook'
  | 'community'
  | 'cooling'
  | 'sandbox'

export default function App() {
  const { t, i18n } = useTranslation()

  // Core State for Google-Search Style Minimalist UX
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoText, setDemoText] = useState('')
  const [activeDemoKey, setActiveDemoKey] = useState<'ex1Text' | 'ex2Text' | 'ex3Text' | null>(null)
  const [lastAnalyzeOptions, setLastAnalyzeOptions] = useState<AnalyzeOptions | null>(null)

  // Progressive Disclosure states under the Verdict Card
  const [showJourneyMap, setShowJourneyMap] = useState(false)
  const [showDossier, setShowDossier] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)

  // Advanced Tools Modal (Preserves all Hackathon features without cluttering homepage)
  const [showToolsModal, setShowToolsModal] = useState(false)
  const [activeToolTab, setActiveToolTab] = useState<AdvancedToolTab>('demat')

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
    setShowJourneyMap(false)
    setShowDossier(false)
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

    // Immediately trigger analysis on demo click for lightning-fast testing
    handleAnalyze({
      message: text,
      modality: 'text',
      language: i18n.language,
    })
  }

  const handleReset = () => {
    setAnalysis(null)
    setDemoText('')
    setActiveDemoKey(null)
    setError('')
    setShowJourneyMap(false)
    setShowDossier(false)
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between font-sans selection:bg-emerald-100">
      {/* Minimal Header */}
      <header className="w-full border-b border-slate-100 bg-white/95 backdrop-blur-xs py-3 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo / Brand */}
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
            title="Reset to home"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-lg shadow-xs group-hover:bg-emerald-800 transition">
              🛡️
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-none">
                {t('appTitle', 'NiveshShield 2.0')}
              </span>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                {t('badge', 'Investor Protection')}
              </span>
            </div>
          </button>

          {/* Right Header: Regional Language Switcher & Hackathon Tools Menu */}
          <div className="flex items-center gap-3">
            {/* Hackathon Badge / Tools Button */}
            <button
              type="button"
              onClick={() => setShowToolsModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
            >
              <span>🏛️</span>
              <span>SEBI & NSDL Tools</span>
              <span className="text-slate-400">▾</span>
            </button>

            {/* Vernacular Language Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <span className="text-sm select-none" aria-hidden="true">🌐</span>
              <select
                value={i18n.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 outline-none cursor-pointer pr-1"
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
        </div>
      </header>

      {/* Main Screen: Center Hero Area */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 sm:py-12 max-w-5xl mx-auto w-full">
        {/* STATE 1: DEFAULT STATE (Google Search Minimalist Hero) */}
        {!loading && !analysis && (
          <div className="w-full max-w-3xl flex flex-col items-center justify-center animate-fade-in text-center my-auto">
            {/* Brand Title Area */}
            <div className="mb-6 sm:mb-8 flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-emerald-700 text-white flex items-center justify-center text-4xl sm:text-5xl shadow-xl ring-4 ring-emerald-100 mb-4 select-none">
                🛡️
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                {t('appTitle', 'NiveshShield 2.0')}
              </h1>
              <p className="mt-2 text-sm sm:text-lg font-semibold text-slate-600 max-w-xl">
                {t(
                  'heroSubtitle',
                  'Verify any investment message, screenshot, or voice note before sending money.',
                )}
              </p>
            </div>

            {/* Central Omnibox Multimodal Scam Scanner */}
            <div className="w-full">
              <MultimodalScamScanner
                onAnalyze={handleAnalyze}
                loading={loading}
                initialText={demoText}
              />
            </div>

            {/* Error display if any */}
            {error && (
              <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-sm font-semibold w-full text-left">
                ⚠️ {error}
              </div>
            )}

            {/* Tactile 1-Click Demo Shortcut Chips */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm">
              <span className="font-bold text-slate-500 mr-1 select-none">
                {t('demoExamples.quickTry', '💡 Or test with a demo:')}
              </span>
              <button
                type="button"
                onClick={() => handleDemoSelect('ex1Text')}
                className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-rose-300 text-rose-950 hover:bg-rose-50 font-bold shadow-2xs transition active:scale-95 flex items-center gap-1.5"
              >
                <span>🛑</span>
                <span>{t('demoExamples.ex1Title', 'Guaranteed 40% Returns')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSelect('ex2Text')}
                className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-amber-300 text-amber-950 hover:bg-amber-50 font-bold shadow-2xs transition active:scale-95 flex items-center gap-1.5"
              >
                <span>⚠️</span>
                <span>{t('demoExamples.ex2Title', 'VIP IPO WhatsApp Group')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSelect('ex3Text')}
                className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-emerald-300 text-emerald-950 hover:bg-emerald-50 font-bold shadow-2xs transition active:scale-95 flex items-center gap-1.5"
              >
                <span>✅</span>
                <span>{t('demoExamples.ex3Title', 'Educational Guide')}</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 2: LOADING STATE (Simple, high-contrast, tactile animation) */}
        {loading && (
          <div
            className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in space-y-6 my-auto"
            role="status"
            aria-live="polite"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-emerald-100 animate-ping opacity-60 absolute" />
              <div className="w-24 h-24 rounded-full bg-emerald-50 border-4 border-emerald-600 flex items-center justify-center text-4xl shadow-xl relative z-10 animate-pulse">
                🛡️
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {t('loading.analyzing', 'Analyzing evidence...')}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-md font-medium mx-auto">
                {t(
                  'loading.subtext',
                  'Checking evidence against SEBI & RBI rules, statutory red flags, and licensed advisor registries...',
                )}
              </p>
            </div>

            {/* Accessible Progress Indicator */}
            <div className="w-56 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div className="h-full bg-emerald-600 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* STATE 3: RESULT STATE (The Verdict Card & Progressive Actions) */}
        {!loading && analysis && (
          <div className="w-full max-w-3xl flex flex-col items-center justify-center animate-fade-in space-y-6 my-auto">
            {/* Massive High-Contrast Verdict Card */}
            <VerdictCard
              analysis={analysis}
              onReset={handleReset}
              onToggleJourneyMap={() => setShowJourneyMap((prev) => !prev)}
              onToggleDossier={() => setShowDossier((prev) => !prev)}
              showJourneyMap={showJourneyMap}
              showDossier={showDossier}
            />

            {/* PROGRESSIVE DISCLOSURE ACTION 1: 5-Stage Scam Journey Map */}
            {showJourneyMap && analysis.scam_journey_map && (
              <div className="w-full animate-fade-in">
                <ScamJourneyMap stages={analysis.scam_journey_map} />
              </div>
            )}

            {/* PROGRESSIVE DISCLOSURE ACTION 2: 1930 / Chakshu Complaint Dossier */}
            {showDossier && (
              <div className="w-full animate-fade-in">
                <ComplaintDossierGenerator
                  analysis={analysis}
                  extractedText={lastAnalyzeOptions?.message || demoText}
                />
              </div>
            )}

            {/* Family Protection Warning Card (If High Risk) */}
            {analysis.overall_status === 'warning_signs_found' && (
              <div className="w-full animate-fade-in">
                <NiveshParivarCard
                  analysis={analysis}
                  extractedText={lastAnalyzeOptions?.message || demoText}
                />
              </div>
            )}

            {/* Phone Reputation Card (If contact number detected in message) */}
            {analysis.extracted_phones && analysis.extracted_phones.length > 0 && (
              <div className="w-full animate-fade-in">
                <PhoneNumberReputation
                  extractedPhones={analysis.extracted_phones}
                  originalText={lastAnalyzeOptions?.message || demoText}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Subtle Bottom Footer: 'How it works' link and official helpline notice */}
      <footer className="w-full py-5 px-4 text-center border-t border-slate-100 bg-white">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-2">
          {/* Subtle 'How it works' link */}
          <button
            type="button"
            onClick={() => setShowHowItWorks(true)}
            className="text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 transition hover:underline py-1 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {t('howItWorksTitle', 'How it works')}
          </button>

          {/* Official Footnote */}
          <p className="text-[11px] text-slate-400 font-medium">
            National Cybercrime Helpline: <strong className="text-slate-700 font-bold">1930</strong> • IIT (BHU) SANGYAN Hackathon • SEBI & NSDL Investor Protection
          </p>
        </div>
      </footer>

      {/* How It Works Clean Modal */}
      <HowItWorksModal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />

      {/* Full Hackathon Advanced Tools Modal */}
      {showToolsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-5xl rounded-3xl bg-white p-5 sm:p-8 shadow-2xl space-y-6 relative my-8 border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🏛️</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    SEBI & NSDL Investor Resilience Suite
                  </h3>
                  <p className="text-xs text-slate-500">
                    SANGYAN Hackathon Specialized Investor Protection Tools
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowToolsModal(false)}
                className="text-slate-400 hover:text-slate-900 font-bold text-xl p-2 rounded-xl hover:bg-slate-100 transition"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setActiveToolTab('demat')}
                className={`px-3.5 py-2 text-xs font-black rounded-xl whitespace-nowrap transition ${
                  activeToolTab === 'demat'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🏛️ NSDL Demat Shield
              </button>
              <button
                type="button"
                onClick={() => setActiveToolTab('sebi')}
                className={`px-3.5 py-2 text-xs font-black rounded-xl whitespace-nowrap transition ${
                  activeToolTab === 'sebi'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                📜 SEBI Entity Validator
              </button>
              <button
                type="button"
                onClick={() => setActiveToolTab('safety_gate')}
                className={`px-3.5 py-2 text-xs font-black rounded-xl whitespace-nowrap transition ${
                  activeToolTab === 'safety_gate'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🛑 Safety Gate
              </button>
              <button
                type="button"
                onClick={() => setActiveToolTab('graph')}
                className={`px-3.5 py-2 text-xs font-black rounded-xl whitespace-nowrap transition ${
                  activeToolTab === 'graph'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🕸️ Evidence Graph
              </button>
              <button
                type="button"
                onClick={() => setActiveToolTab('casebook')}
                className={`px-3.5 py-2 text-xs font-black rounded-xl whitespace-nowrap transition ${
                  activeToolTab === 'casebook'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                📁 Incident Casebook
              </button>
              <button
                type="button"
                onClick={() => setActiveToolTab('community')}
                className={`px-3.5 py-2 text-xs font-black rounded-xl whitespace-nowrap transition ${
                  activeToolTab === 'community'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🌐 Community Intel
              </button>
              <button
                type="button"
                onClick={() => setActiveToolTab('cooling')}
                className={`px-3.5 py-2 text-xs font-black rounded-xl whitespace-nowrap transition ${
                  activeToolTab === 'cooling'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                ⏱️ Cooling-Off Shield
              </button>
              <button
                type="button"
                onClick={() => setActiveToolTab('sandbox')}
                className={`px-3.5 py-2 text-xs font-black rounded-xl whitespace-nowrap transition ${
                  activeToolTab === 'sandbox'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🎯 Spot-the-Scam Sandbox
              </button>
            </div>

            {/* Modal Tool View Content */}
            <div className="py-2">
              {activeToolTab === 'demat' && <DematSafetyChecker />}
              {activeToolTab === 'sebi' && <SebiValidator />}
              {activeToolTab === 'safety_gate' && (
                <PreTransactionSafetyGate
                  analysis={analysis}
                  onOpenEvidenceGraph={() => setActiveToolTab('graph')}
                  onOpenCasebook={() => setActiveToolTab('casebook')}
                />
              )}
              {activeToolTab === 'graph' && (
                <EvidenceGraph
                  analysis={analysis}
                  submittedText={demoText}
                  onOpenSafetyGate={() => setActiveToolTab('safety_gate')}
                  onOpenCasebook={() => setActiveToolTab('casebook')}
                />
              )}
              {activeToolTab === 'casebook' && (
                <ScamIncidentCasebook
                  analysis={analysis}
                  extractedText={demoText}
                />
              )}
              {activeToolTab === 'community' && (
                <CommunityIntelligence
                  analysis={analysis}
                  extractedText={demoText}
                />
              )}
              {activeToolTab === 'cooling' && <CoolingOffCalculator />}
              {activeToolTab === 'sandbox' && <SpotTheScamSimulation />}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowToolsModal(false)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs hover:bg-slate-800 transition"
              >
                ← Back to Scam Scanner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
