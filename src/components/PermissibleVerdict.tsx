import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'

export interface PermissibleVerdictProps {
  summary?: string
  onReset: () => void
}

const LANG_VOICE_CODES: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
}

export const PermissibleVerdict: React.FC<PermissibleVerdictProps> = ({
  summary,
  onReset,
}) => {
  const { t, i18n } = useTranslation()
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
    }
  }, [])

  const badge = t('verdict.greenBadge', 'PERMISSIBLE')
  const headline = t('verdict.greenHeadline', 'No Obvious Warning Signs')
  const subhead =
    summary ||
    t(
      'verdict.greenSubhead',
      'Standard educational or regulated guidance observed. No urgent payment pressure or guaranteed return claims were detected.',
    )
  const sebiRule = t(
    'verdict.greenRule',
    'Reminder: All securities investments carry market risk. Always confirm your broker is registered on sebi.gov.in.',
  )

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    if (isPlayingAudio) {
      setIsPlayingAudio(false)
      return
    }

    const speechText = `${headline}. ${subhead}. ${sebiRule}`
    const utterance = new SpeechSynthesisUtterance(speechText)
    const currentLangCode = (i18n.language || 'en').split('-')[0].toLowerCase()
    const targetBcp47Tag = LANG_VOICE_CODES[currentLangCode] || 'en-IN'

    utterance.lang = targetBcp47Tag
    utterance.rate = 0.85 // Slower for elderly users
    utterance.pitch = 1.0

    const availableVoices = window.speechSynthesis.getVoices()
    const nativeVoice = availableVoices.find((voice) => {
      const vLang = voice.lang.replace('_', '-').toLowerCase()
      const tLang = targetBcp47Tag.toLowerCase()
      return vLang === tLang || vLang.startsWith(currentLangCode) || voice.lang.toLowerCase().startsWith(currentLangCode)
    })

    if (nativeVoice) {
      utterance.voice = nativeVoice
    } else {
      console.warn(`No native voice found for ${targetBcp47Tag}. Falling back to default.`)
    }

    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = (e) => {
      console.error('SpeechSynthesisUtterance error:', e)
      setIsPlayingAudio(false)
    }

    activeUtteranceRef.current = utterance
    setIsPlayingAudio(true)

    setTimeout(() => {
      window.speechSynthesis.speak(utterance)
    }, 50)
  }

  return (
    <div
      className="w-full max-w-3xl mx-auto rounded-3xl border-4 border-emerald-500 bg-emerald-50 p-6 sm:p-10 shadow-xl transition-all text-emerald-950 animate-fade-in"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-5">
        <div className="flex items-center gap-3">
          <span className="text-5xl sm:text-6xl select-none" aria-hidden="true">
            ✅
          </span>
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-700 text-white">
              {badge}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mt-1 leading-tight text-emerald-950">
              {headline}
            </h2>
          </div>
        </div>

        {/* Voice Readout & Reset Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handleSpeak}
            className="px-3.5 py-2 text-xs font-bold bg-white/90 hover:bg-white text-slate-900 rounded-xl border border-slate-300 shadow-xs transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
            title={t('verdict.voiceTitle', 'Listen to explanation in your language')}
          >
            <span>{isPlayingAudio ? '⏹️' : '🔊'}</span>
            <span>
              {isPlayingAudio
                ? t('verdict.stopVoice', 'Stop Voice')
                : t('verdict.listenAloud', 'Listen Aloud')}
            </span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            🔄 {t('verdict.checkAnother', 'Check Another')}
          </button>
        </div>
      </div>

      {/* Explanation & SEBI Market Risk Rule */}
      <div className="mt-6 space-y-4">
        <p className="text-base sm:text-xl font-semibold leading-relaxed">
          {subhead}
        </p>

        <div className="p-4 rounded-2xl bg-white/80 border border-black/10 text-sm sm:text-base font-bold flex items-start gap-2.5">
          <span className="text-lg">🛡️</span>
          <span>{sebiRule}</span>
        </div>
      </div>
    </div>
  )
}
export default PermissibleVerdict
