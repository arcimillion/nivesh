import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FINANCIAL_GLOSSARY } from '../data/financialGlossary'

// BCP 47 Map for audio voice output
const BCP47_LANGUAGE_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
}

interface FinancialTermProps {
  termKey: string
  children: React.ReactNode
}

export function FinancialTerm({ termKey, children }: FinancialTermProps) {
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
  const termData = FINANCIAL_GLOSSARY.find((g) => g.key === termKey)

  if (!termData) {
    return <>{children}</>
  }

  const translation = termData.translations[currentLang] || termData.translations.en
  const targetBcp47Tag = BCP47_LANGUAGE_MAP[currentLang] || 'en-IN'

  const handleListenAloud = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    if (isPlayingAudio) {
      setIsPlayingAudio(false)
      return
    }

    const speechText = `${translation.term}. Simple meaning: ${translation.simpleMeaning}. Why it matters: ${translation.whyItMatters}. Remember: ${translation.remember}`
    const utterance = new SpeechSynthesisUtterance(speechText)
    utterance.lang = targetBcp47Tag
    utterance.rate = 0.85
    utterance.pitch = 1.0

    const availableVoices = window.speechSynthesis.getVoices()
    const nativeVoice = availableVoices.find((voice) => {
      const vLang = voice.lang.replace('_', '-').toLowerCase()
      const tLang = targetBcp47Tag.toLowerCase()
      return vLang === tLang || vLang.startsWith(currentLang) || voice.lang.toLowerCase().startsWith(currentLang)
    })

    if (nativeVoice) utterance.voice = nativeVoice

    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)

    // Save local reference to prevent browser garbage collection
    activeUtteranceRef.current = utterance

    setIsPlayingAudio(true)
    setTimeout(() => {
      window.speechSynthesis.speak(utterance)
    }, 50)
  }

  const handleClose = () => {
    setIsOpen(false)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsPlayingAudio(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-1 rounded-sm bg-amber-50 hover:bg-amber-100 text-amber-950 font-black border-b-2 border-dashed border-amber-600 cursor-help outline-none transition focus:ring-2 focus:ring-amber-500 select-none align-baseline text-inherit"
        title={t('clickToExplain', 'क्लिक करें - मतलब समझें (Click to explain)')}
      >
        {children}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 relative border-2 border-amber-400">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl select-none">📖</span>
                <h3 className="text-xl sm:text-2xl font-black text-amber-950">
                  {translation.term}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-900 font-black text-2xl p-1 cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Explanation Content */}
            <div className="space-y-4 text-left">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-amber-800 font-black mb-1">
                  💡 {t('glossary.simpleMeaning', 'सरल मतलब (Simple Meaning)')}
                </h4>
                <p className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed">
                  {translation.simpleMeaning}
                </p>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider text-amber-800 font-black mb-1">
                  🔍 {t('glossary.whyItMatters', 'यह क्यों ज़रूरी है? (Why It Matters)')}
                </h4>
                <p className="text-sm sm:text-base font-semibold text-slate-700 leading-relaxed">
                  {translation.whyItMatters}
                </p>
              </div>

              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200">
                <h4 className="text-xs uppercase tracking-wider text-amber-900 font-black mb-1">
                  ⚠️ {t('glossary.remember', 'हमेशा याद रखें (Always Remember)')}
                </h4>
                <p className="text-xs sm:text-sm font-black text-amber-950 leading-relaxed">
                  {translation.remember}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleListenAloud}
                className="px-5 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-black text-xs sm:text-sm shadow-xs transition cursor-pointer active:scale-95 flex items-center justify-center gap-2 focus:ring-2 focus:ring-amber-500"
              >
                <span className="text-lg">{isPlayingAudio ? '⏹️' : '🔊'}</span>
                <span>
                  {isPlayingAudio
                    ? t('verdict.stopVoice', 'आवाज़ रोकें (Stop Voice)')
                    : t('verdict.listenAloud', 'बोलकर सुनें (Listen Aloud)')}
                </span>
              </button>

              {termData.officialSourceUrl && (
                <a
                  href={termData.officialSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black text-xs sm:text-sm transition flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-slate-900"
                >
                  <span>🏛️</span>
                  <span>{t('officialSource', 'सरकारी वेबसाइट (Official Source) ↗')}</span>
                </a>
              )}
            </div>

            {/* independent disclosure */}
            <p className="text-[10px] text-slate-400 font-medium text-center pt-1 leading-none select-none">
              {t('glossary.independentDisclosure', 'NiveshShield is an independent educational helper.')}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * GlossaryHighlighter Component
 * Automatically finds financial terms (matching case-insensitively in multiple languages)
 * and replaces them with the interactive <FinancialTerm> component.
 */
interface GlossaryHighlighterProps {
  text: string | null | undefined
}

export function GlossaryHighlighter({ text }: GlossaryHighlighterProps) {
  if (!text) return null

  // Collect all glossary terms
  const termsList: { key: string; termString: string }[] = []
  FINANCIAL_GLOSSARY.forEach((item) => {
    // Collect all unique variations of the term strings in all languages
    Object.values(item.translations).forEach((trans) => {
      const displayString = trans.term.split('(')[0].trim() // Strip brackets
      if (displayString && displayString.length > 2) {
        termsList.push({ key: item.key, termString: displayString })
      }
      // Also add the pure English term key
      termsList.push({ key: item.key, termString: item.key })
    })
  })

  // Sort terms by length descending to match longer multi-word terms first (e.g. "Demat Account" before "Demat")
  termsList.sort((a, b) => b.termString.length - a.termString.length)

  // Remove duplicates
  const seenStrings = new Set<string>()
  const uniqueTerms = termsList.filter((item) => {
    const cleanStr = item.termString.toLowerCase()
    if (seenStrings.has(cleanStr)) return false
    seenStrings.add(cleanStr)
    return true
  })

  if (uniqueTerms.length === 0) {
    return <>{text}</>
  }

  // Escape special regex characters in terms
  const escapedTerms = uniqueTerms.map((t) =>
    t.termString.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  )

  // Build a single global regex matching word boundaries
  // e.g. \b(Nominee|KYC|डीमैट)\b
  const regex = new RegExp(`\\b(${escapedTerms.join('|')})\\b`, 'gi')

  const parts = text.split(regex)
  if (parts.length <= 1) {
    return <>{text}</>
  }

  return (
    <>
      {parts.map((part, index) => {
        const lowerPart = part.toLowerCase()
        const matchedTerm = uniqueTerms.find(
          (t) => t.termString.toLowerCase() === lowerPart
        )

        if (matchedTerm) {
          return (
            <FinancialTerm key={`${matchedTerm.key}-${index}`} termKey={matchedTerm.key}>
              {part}
            </FinancialTerm>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}
