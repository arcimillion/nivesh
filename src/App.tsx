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
import { SafetyCapsuleCard } from './components/SafetyCapsuleCard'
import { SafetyCapsulesLibrary } from './components/SafetyCapsulesLibrary'
import { VoiceNavigation } from './components/VoiceNavigation'
import { GuidedTour } from './components/GuidedTour'

export default function App() {
  const { t, i18n } = useTranslation()

  // Core State
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoText, setDemoText] = useState('')
  const [activeDemoKey, setActiveDemoKey] = useState<'ex1Text' | 'ex2Text' | 'ex3Text' | null>(null)
  const [lastAnalyzeOptions, setLastAnalyzeOptions] = useState<AnalyzeOptions | null>(null)

  // Abstraction & Collapsible states for village-first UX
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [showCapsulesModal, setShowCapsulesModal] = useState(false)
  const [showDetailsAccordion, setShowDetailsAccordion] = useState(false)
  const [showGuidedTour, setShowGuidedTour] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('niveshshield-onboarding-completed')
    }
    return false
  })

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
    setShowDetailsAccordion(false)
    setLastAnalyzeOptions(options)

    try {
      const result = await analyzeMessage(options)
      setAnalysis(result)
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error
          ? err.message
          : t('analysis.analysisErrorTitle', 'जाँच पूरी नहीं हो सकी / Could not complete check'),
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
    setShowDetailsAccordion(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans selection:bg-emerald-100">
      {/* Super Simple Clean Header */}
      <header className="w-full border-b border-slate-200 bg-white shadow-2xs py-3 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Logo / Brand */}
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
            title="मुख्य पृष्ठ पर जाएँ / Return to Home"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-xl shadow-md group-hover:bg-emerald-800 transition shrink-0">
              🛡️
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 block leading-none">
                NiveshShield
              </span>
              <span className="text-xs font-bold text-emerald-800 tracking-wide block mt-0.5">
                {t('badge', 'Truth Check')}
              </span>
            </div>
          </button>

          {/* Right Header: Safety Video Library & Vernacular Selector */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="onboarding-btn-capsules"
              onClick={() => setShowCapsulesModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border-2 border-emerald-600 bg-emerald-700 text-white font-black text-xs sm:text-sm hover:bg-emerald-800 transition shadow-xs cursor-pointer active:scale-95"
            >
              <span className="text-base">🎥</span>
              <span>{t('capsulesTitle', 'Safety Videos')}</span>
            </button>

            <VoiceNavigation
              onCheckSafety={handleReset}
              onExplainCurrentContent={() => setShowDetailsAccordion(true)}
              onOpenSafetyCapsules={() => setShowCapsulesModal(true)}
              onOpenHowItWorks={() => setShowHowItWorks(true)}
              currentAnalysisPresent={!!analysis}
            />

            <div id="onboarding-lang-select" className="flex items-center gap-1 bg-slate-100 border-2 border-slate-300 rounded-2xl px-2.5 py-1.5 shadow-2xs">
              <span className="text-base select-none" aria-hidden="true">🌐</span>
              <select
                value={i18n.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-black text-slate-900 outline-none cursor-pointer pr-1"
                aria-label={t('language', 'भाषा चुनें / Select Language')}
              >
                <option value="hi">हिन्दी</option>
                <option value="en">English</option>
                <option value="mr">मराठी</option>
                <option value="gu">ગુજરાતી</option>
                <option value="bn">বাংলা</option>
                <option value="ta">தமிழ்</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Screen: Center Hero Area */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-6 sm:py-10 max-w-4xl mx-auto w-full">
        {/* STATE 1: DEFAULT STATE (Ultra Simple Input Hero) */}
        {!loading && !analysis && (
          <div className="w-full flex flex-col items-center justify-center animate-fade-in text-center my-auto">
            <div className="mb-6 flex flex-col items-center space-y-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-700 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-xl ring-4 ring-emerald-100 select-none">
                🛡️
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {t('appTitle', 'NiveshShield')}
              </h1>
              <p className="text-base sm:text-xl font-bold text-slate-700 max-w-xl leading-relaxed">
                {t(
                  'heroSubtitle',
                  'कोई भी मैसेज, फोटो या लिंक डालें — हम बताएँगे कि यह असली है या धोखा।',
                )}
              </p>
            </div>

            {/* Central Multimodal Scam Scanner */}
            <div className="w-full">
              <MultimodalScamScanner
                onAnalyze={handleAnalyze}
                loading={loading}
                initialText={demoText}
              />
            </div>

            {/* Error display if any */}
            {error && (
              <div className="mt-4 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-base font-bold w-full text-left shadow-2xs">
                ⚠️ {error}
              </div>
            )}

            {/* Simple Demo Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 w-full text-xs sm:text-sm">
              <span className="font-bold text-slate-600 text-sm select-none">
                {t('demoExamples.quickTry', '💡 उदाहरण देखें:')}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoSelect('ex1Text')}
                  className="px-4 py-2 rounded-xl bg-white border-2 border-rose-400 text-rose-950 hover:bg-rose-50 font-black shadow-2xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm"
                >
                  <span>🛑</span>
                  <span>{t('demoExamples.ex1Title', '40% पक्का मुनाफा मैसेज')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSelect('ex2Text')}
                  className="px-4 py-2 rounded-xl bg-white border-2 border-amber-400 text-amber-950 hover:bg-amber-50 font-black shadow-2xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm"
                >
                  <span>⚠️</span>
                  <span>{t('demoExamples.ex2Title', 'अंजान वॉट्सऐप ग्रुप')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSelect('ex3Text')}
                  className="px-4 py-2 rounded-xl bg-white border-2 border-emerald-400 text-emerald-950 hover:bg-emerald-50 font-black shadow-2xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm"
                >
                  <span>✅</span>
                  <span>{t('demoExamples.ex3Title', 'बैंक का सही मैसेज')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STATE 2: LOADING STATE */}
        {loading && (
          <div
            className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in space-y-6 my-auto"
            role="status"
            aria-live="polite"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-emerald-200 animate-ping opacity-60 absolute" />
              <div className="w-24 h-24 rounded-full bg-white border-4 border-emerald-700 flex items-center justify-center text-5xl shadow-xl relative z-10 animate-pulse">
                🛡️
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {t('loading.analyzing', 'जाँच जारी है... थोड़ा इंतज़ार करें')}
              </h2>
              <p className="text-base sm:text-lg text-slate-700 max-w-md font-bold mx-auto">
                {t(
                  'loading.subtext',
                  'सरकारी नियमों और फर्जी दावों से मिलान किया जा रहा है...',
                )}
              </p>
            </div>

            <div className="w-64 h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
              <div className="h-full bg-emerald-700 rounded-full animate-pulse w-4/5" />
            </div>
          </div>
        )}

        {/* STATE 3: RESULT STATE (Abstracted Village-First UX) */}
        {!loading && analysis && (
          <div className="w-full max-w-3xl flex flex-col items-center justify-center animate-fade-in space-y-5 my-auto">
            {/* 1. Main High-Contrast Verdict Card */}
            <VerdictCard
              analysis={analysis}
              onReset={handleReset}
              onToggleJourneyMap={() => setShowDetailsAccordion(true)}
              onToggleDossier={() => setShowDetailsAccordion(true)}
              showJourneyMap={showDetailsAccordion}
              showDossier={showDetailsAccordion}
            />

            {/* 2. Primary 1-Click Action Buttons for Villagers */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NiveshParivarCard
                analysis={analysis}
                extractedText={lastAnalyzeOptions?.message || demoText}
              />

              <a
                href="tel:1930"
                className="py-4 px-6 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white font-black text-base sm:text-lg shadow-md transition flex items-center justify-center gap-3 border-2 border-rose-800 active:scale-98"
              >
                <span className="text-2xl shrink-0">📞</span>
                <span>{t('cyberHelpline', 'National Cyber Crime Helpline: 1930 (Toll Free)')}</span>
              </a>
            </div>

            {/* 3. Single Contextual 1-Min Safety Video Callout */}
            <SafetyCapsuleCard
              analysis={analysis}
              onExploreLibrary={() => setShowCapsulesModal(true)}
            />

            {/* 4. Abstracted / Collapsible Details Accordion */}
            <div className="w-full border-t-2 border-slate-200 pt-3">
              <button
                type="button"
                onClick={() => setShowDetailsAccordion((prev) => !prev)}
                className="w-full py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm sm:text-base transition flex items-center justify-between cursor-pointer border border-slate-300"
              >
                <span className="flex items-center gap-2">
                  <span>{showDetailsAccordion ? '🔼' : '🔽'}</span>
                  <span>{t('showDetails', 'More Details & Complaint Paper')}</span>
                </span>
                <span className="text-xs text-slate-500 font-bold">{showDetailsAccordion ? 'Hide' : 'Show'}</span>
              </button>

              {showDetailsAccordion && (
                <div className="mt-4 space-y-4 animate-fade-in p-4 sm:p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs text-left">
                  {/* 5-Step Scam Breakdown */}
                  {analysis.scam_journey_map && (
                    <div className="w-full space-y-2">
                      <h4 className="font-black text-slate-900 text-base">🗺️ {t('breakdownTitle', 'How Scammers Trick People (5 Steps)')}:</h4>
                      <ScamJourneyMap stages={analysis.scam_journey_map} />
                    </div>
                  )}

                  {/* Complaint Paper Generator */}
                  <div className="w-full space-y-2 pt-2 border-t border-slate-100">
                    <h4 className="font-black text-slate-900 text-base">📋 {t('complaintPaperTitle', '1930 Police Complaint Paper')}:</h4>
                    <ComplaintDossierGenerator
                      analysis={analysis}
                      extractedText={lastAnalyzeOptions?.message || demoText}
                    />
                  </div>

                  {/* Phone Number Reputation */}
                  {analysis.extracted_phones && analysis.extracted_phones.length > 0 && (
                    <div className="w-full space-y-2 pt-2 border-t border-slate-100">
                      <PhoneNumberReputation
                        extractedPhones={analysis.extracted_phones}
                        originalText={lastAnalyzeOptions?.message || demoText}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Simple Footer */}
      <footer className="w-full py-4 px-4 text-center border-t border-slate-200 bg-white">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-3">
          <a
            href="tel:1930"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white font-black text-sm shadow-md transition active:scale-95"
          >
            <span>📞</span>
            <span>{t('cyberHelpline', 'National Cyber Crime Helpline: 1930 (Toll Free)')}</span>
          </a>

          <button
            type="button"
            onClick={() => setShowHowItWorks(true)}
            className="text-sm font-bold text-slate-600 hover:text-slate-900 transition underline py-1 px-3 focus:outline-none cursor-pointer"
          >
            {t('howItWorksTitle', 'यह कैसे काम करता है? (How it works)')}
          </button>

          <button
            type="button"
            onClick={() => setShowGuidedTour(true)}
            className="text-xs font-black text-emerald-800 hover:text-emerald-950 transition flex items-center gap-1.5 py-2 px-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50 cursor-pointer shadow-3xs active:scale-95 mt-1"
          >
            <span>🔊</span>
            <span>{t('onboarding.replay', 'Show me how NiveshShield works')}</span>
          </button>
        </div>
      </footer>

      {/* How It Works Clean Modal */}
      <HowItWorksModal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />

      {/* Safety Capsules Library Modal */}
      {showCapsulesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-4xl rounded-3xl bg-white p-4 sm:p-6 shadow-2xl space-y-4 relative my-6 border-2 border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎥</span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {t('capsules.title', 'सुरक्षा वीडियो / Safety Videos')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCapsulesModal(false)}
                className="text-slate-500 hover:text-slate-900 font-black text-2xl p-1 cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <SafetyCapsulesLibrary onClose={() => setShowCapsulesModal(false)} />
          </div>
        </div>
      )}

      {/* Guided Tour Overlay */}
      <GuidedTour
        isOpen={showGuidedTour}
        onComplete={() => {
          setShowGuidedTour(false)
          localStorage.setItem('niveshshield-onboarding-completed', 'true')
        }}
        currentLanguage={i18n.language}
        onLanguageChange={handleLanguageChange}
      />
    </div>
  )
}
