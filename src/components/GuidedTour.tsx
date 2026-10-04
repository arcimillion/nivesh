import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

interface GuidedTourProps {
  isOpen: boolean
  onComplete: () => void
  currentLanguage: string
  onLanguageChange: (lang: string) => void
}

type TourStep =
  | 'lang-prompt'
  | 'welcome'
  | 'text'
  | 'photo'
  | 'website'
  | 'voice'
  | 'ask'
  | 'safetyVideos'
  | 'closing'

const STEPS: TourStep[] = [
  'welcome',
  'text',
  'photo',
  'website',
  'voice',
  'ask',
  'safetyVideos',
  'closing',
]

const LANG_VOICE_CODES: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
}

export function GuidedTour({
  isOpen,
  onComplete,
  currentLanguage,
  onLanguageChange,
}: GuidedTourProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<TourStep>('lang-prompt')
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({})
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    }
  }, [])

  const getElementIdForStep = (currentStep: TourStep): string | null => {
    switch (currentStep) {
      case 'lang-prompt':
        return 'onboarding-lang-select'
      case 'text':
        return 'onboarding-tab-text'
      case 'photo':
        return 'onboarding-tab-image'
      case 'website':
        return 'onboarding-tab-url'
      case 'voice':
        return 'onboarding-tab-voice'
      case 'ask':
        return 'onboarding-btn-ask'
      case 'safetyVideos':
        return 'onboarding-btn-capsules'
      default:
        return null
    }
  }

  // Handle highlight spotlight positioning & interaction on step changes
  useEffect(() => {
    if (!isOpen) return

    const elId = getElementIdForStep(step)
    if (!elId) {
      setHighlightStyle({ display: 'none' })
      return
    }

    const updatePosition = () => {
      const el = document.getElementById(elId)
      if (el) {
        const rect = el.getBoundingClientRect()
        setHighlightStyle({
          position: 'fixed',
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
          borderRadius: '16px',
          boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75), 0 0 20px 6px rgba(16, 185, 129, 0.95)',
          pointerEvents: 'none',
          zIndex: 100,
          transition: prefersReducedMotion ? 'none' : 'all 0.3s ease-in-out',
        })

        // Scroll to highlighted element to make sure it is in view
        el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' })

        // Programmatically trigger tabs to open to show their contents during the tour
        if (elId.startsWith('onboarding-tab-')) {
          el.click()
        }
      } else {
        setHighlightStyle({ display: 'none' })
      }
    }

    // Run slightly delayed to let tabs/view render fully
    const timer = setTimeout(updatePosition, 100)

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [step, isOpen, prefersReducedMotion])

  // Clean up speech synthesis when component unmounts or tour closed
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Speech synthesis speaker
  const speakTextSegment = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()
    setIsSpeechPlaying(false)

    if (!text) return

    const utterance = new SpeechSynthesisUtterance(text)
    const currentLangCode = currentLanguage.split('-')[0].toLowerCase()
    const targetBcp47Tag = LANG_VOICE_CODES[currentLangCode] || 'en-IN'

    utterance.lang = targetBcp47Tag
    utterance.rate = 0.85 // Accessible slow rate for senior users
    utterance.pitch = 1.0

    const availableVoices = window.speechSynthesis.getVoices()
    const nativeVoice = availableVoices.find((voice) => {
      const vLang = voice.lang.replace('_', '-').toLowerCase()
      const tLang = targetBcp47Tag.toLowerCase()
      return vLang === tLang || vLang.startsWith(currentLangCode) || voice.lang.toLowerCase().startsWith(currentLangCode)
    })

    if (nativeVoice) {
      utterance.voice = nativeVoice
    }

    utterance.onstart = () => {
      setIsSpeechPlaying(true)
    }

    utterance.onend = () => {
      setIsSpeechPlaying(false)
      advanceToNextStep()
    }

    utterance.onerror = (e) => {
      console.warn('Speech error, advancing tour step manually:', e)
      setIsSpeechPlaying(false)
    }

    activeUtteranceRef.current = utterance
    setIsSpeechPlaying(true)

    setTimeout(() => {
      window.speechSynthesis.speak(utterance)
    }, 50)
  }

  // Trigger speech on step updates
  useEffect(() => {
    if (!isOpen || step === 'lang-prompt') return

    const speakCurrentStep = () => {
      switch (step) {
        case 'welcome':
          speakTextSegment(t('onboarding.welcome'))
          break
        case 'text':
          speakTextSegment(t('onboarding.textMessage'))
          break
        case 'photo':
          speakTextSegment(t('onboarding.photo'))
          break
        case 'website':
          speakTextSegment(t('onboarding.website'))
          break
        case 'voice':
          speakTextSegment(t('onboarding.voice'))
          break
        case 'ask':
          speakTextSegment(t('onboarding.ask'))
          break
        case 'safetyVideos':
          speakTextSegment(t('onboarding.safetyVideos'))
          break
        case 'closing':
          speakTextSegment(t('onboarding.takeYourTime'))
          break
      }
    }

    // Delayed so speechSynthesis voice cache can settle
    const timer = setTimeout(speakCurrentStep, 200)
    return () => clearTimeout(timer)
  }, [step, isOpen, currentLanguage])

  const handleLanguageSelect = (lang: string) => {
    onLanguageChange(lang)
    // Advancing immediately upon selection becomes the user gesture allowing speechSynthesis
    setStep('welcome')
  }

  const advanceToNextStep = () => {
    if (step === 'lang-prompt') {
      setStep('welcome')
      return
    }

    const currentIndex = STEPS.indexOf(step)
    if (currentIndex === -1) return

    if (currentIndex < STEPS.length - 1) {
      setStep(STEPS[currentIndex + 1])
    } else {
      // Completed!
      handleComplete()
    }
  }

  const handleComplete = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    onComplete()
  }

  if (!isOpen) return null

  const getStepNumberText = (): string => {
    if (step === 'lang-prompt') return ''
    const index = STEPS.indexOf(step)
    return `${index + 1} / ${STEPS.length}`
  }

  const getSimpleGuideLabel = (): string => {
    switch (step) {
      case 'lang-prompt':
        return t('onboarding.chooseLanguagePrompt', 'First, choose your language / पहले अपनी भाषा चुनें')
      case 'welcome':
        return t('onboarding.welcome')
      case 'text':
        return t('onboarding.textMessage')
      case 'photo':
        return t('onboarding.photo')
      case 'website':
        return t('onboarding.website')
      case 'voice':
        return t('onboarding.voice')
      case 'ask':
        return t('onboarding.ask')
      case 'safetyVideos':
        return t('onboarding.safetyVideos')
      case 'closing':
        return t('onboarding.takeYourTime')
      default:
        return ''
    }
  }

  return (
    <>
      {/* 1. Dynamic Spotlight Overlay */}
      {step !== 'welcome' && step !== 'closing' && (
        <div style={highlightStyle} aria-hidden="true" />
      )}

      {/* 2. Semitransparent Backdrop when no element highlighted (Welcome and Closing) */}
      {(step === 'welcome' || step === 'closing' || step === 'lang-prompt') && (
        <div
          className="fixed inset-0 z-90 bg-slate-950/80 backdrop-blur-xs transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* 3. Onboarding Guide Box (Accessible, calm visual with clear readable actions) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] w-[calc(100%-2rem)] max-w-lg rounded-3xl bg-white border-4 border-emerald-600 shadow-2xl p-5 sm:p-6 space-y-4 text-center animate-fade-in">
        {/* Step Indicator Badge */}
        {step !== 'lang-prompt' && (
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-[10px] font-black tracking-wider uppercase text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
              {t('badge', 'Guided Start')}
            </span>
            <span className="text-xs font-black text-slate-500">
              {getStepNumberText()}
            </span>
          </div>
        )}

        {/* Big accessible readable content */}
        <div className="space-y-2">
          {step === 'lang-prompt' && (
            <div className="flex flex-col items-center space-y-3">
              <span className="text-4xl animate-bounce" aria-hidden="true">👆</span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                Choose Your Language / भाषा चुनें
              </h2>
            </div>
          )}

          <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed py-1.5 px-1 bg-slate-50 rounded-2xl border border-slate-100">
            {getSimpleGuideLabel()}
          </p>
        </div>

        {/* Buttons and Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {step === 'lang-prompt' ? (
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                type="button"
                onClick={() => handleLanguageSelect('hi')}
                className="py-3 px-4 rounded-xl border-2 border-slate-200 bg-white hover:border-emerald-600 text-sm font-black text-slate-900 cursor-pointer transition shadow-2xs active:scale-95"
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => handleLanguageSelect('en')}
                className="py-3 px-4 rounded-xl border-2 border-slate-200 bg-white hover:border-emerald-600 text-sm font-black text-slate-900 cursor-pointer transition shadow-2xs active:scale-95"
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleLanguageSelect('mr')}
                className="py-3 px-4 rounded-xl border-2 border-slate-200 bg-white hover:border-emerald-600 text-sm font-black text-slate-900 cursor-pointer transition shadow-2xs active:scale-95"
              >
                मराठी
              </button>
              <button
                type="button"
                onClick={() => handleLanguageSelect('gu')}
                className="py-3 px-4 rounded-xl border-2 border-slate-200 bg-white hover:border-emerald-600 text-sm font-black text-slate-900 cursor-pointer transition shadow-2xs active:scale-95"
              >
                ગુજરાતી
              </button>
              <button
                type="button"
                onClick={() => handleLanguageSelect('bn')}
                className="py-3 px-4 rounded-xl border-2 border-slate-200 bg-white hover:border-emerald-600 text-sm font-black text-slate-900 cursor-pointer transition shadow-2xs active:scale-95"
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => handleLanguageSelect('ta')}
                className="py-3 px-4 rounded-xl border-2 border-slate-200 bg-white hover:border-emerald-600 text-sm font-black text-slate-900 cursor-pointer transition shadow-2xs active:scale-95"
              >
                தமிழ்
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 w-full">
              <button
                type="button"
                onClick={handleComplete}
                className="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm border-2 border-slate-200 transition cursor-pointer active:scale-95"
              >
                {t('onboarding.skip', 'Skip Tour')}
              </button>

              <button
                type="button"
                onClick={advanceToNextStep}
                className="py-3 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm border-2 border-emerald-800 shadow-md transition cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <span>{step === 'closing' ? '✓ Finish' : 'Next ➔'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
