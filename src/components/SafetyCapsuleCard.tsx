import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnalysisResult } from '../api'
import {
  type SafetyCapsule,
  type SafetyCapsuleVideo,
  findRecommendedCapsule,
  normalizeLanguageCode,
  LANGUAGE_LABELS,
} from '../data/safetyCapsules'
import { SafetyCapsuleModal } from './SafetyCapsuleModal'

interface SafetyCapsuleCardProps {
  analysis?: AnalysisResult | null
  capsule?: SafetyCapsule
  onExploreLibrary?: () => void
}

const LANG_VOICE_CODES: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
}

const LISTEN_LABELS: Record<string, string> = {
  en: 'Listen',
  hi: 'सुनें (Suno)',
  bn: 'শুনুন (Shunun)',
  mr: 'ऐका (Aika)',
  gu: 'સાંભળો (Saambhalo)',
  ta: 'கேளுங்கள் (Kelungal)',
}

export const SafetyCapsuleCard: React.FC<SafetyCapsuleCardProps> = ({
  analysis,
  capsule: customCapsule,
  onExploreLibrary,
}) => {
  const { t, i18n } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  // Map to one of the 6 supported languages: en, hi, bn, mr, gu, ta
  const currentLang = normalizeLanguageCode(i18n.language)

  // Determine which capsule to recommend based on analysis or custom prop
  const capsule: SafetyCapsule = customCapsule || findRecommendedCapsule(analysis)

  const video: SafetyCapsuleVideo | undefined = capsule.videosByLanguage[currentLang]
  const title = capsule.localizedTitle[currentLang] || capsule.localizedTitle.en
  const shortRule = capsule.localizedShortRule[currentLang] || capsule.localizedShortRule.en
  const mainRule = capsule.localizedMainRule[currentLang] || capsule.localizedMainRule.en
  const audioExplanation =
    capsule.localizedAudioExplanation[currentLang] || capsule.localizedAudioExplanation.en

  // Multilingual voice speech synthesis
  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window)) return

    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
      return
    }

    window.speechSynthesis.cancel()

    // Plain localized safety advice read aloud
    const speechText = `${title}. ${shortRule}. ${mainRule}`
    const utterance = new SpeechSynthesisUtterance(speechText)
    const targetLangCode = LANG_VOICE_CODES[currentLang] || 'en-IN'
    utterance.lang = targetLangCode
    utterance.rate = 0.95

    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)

    setIsPlayingAudio(true)
    window.speechSynthesis.speak(utterance)
  }

  const listenButtonText = isPlayingAudio
    ? t('capsules.stopAudio', 'Stop Audio')
    : `🔊 ${LISTEN_LABELS[currentLang] || 'Listen'}`

  const hasOfficialVideoInCurrentLang = Boolean(video?.embedUrl)

  return (
    <>
      <div
        className="w-full rounded-3xl border-2 border-emerald-500 bg-white p-5 sm:p-7 shadow-lg space-y-4 animate-fade-in relative overflow-hidden"
        role="region"
        aria-label="Contextual Official Safety Education"
      >
        {/* Subtle decorative background banner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -z-10 pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl select-none" aria-hidden="true">
              🎥
            </span>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">
                {t('capsules.contextualBadge', 'Contextual Official Safety Education')}
              </span>
              <p className="text-xs text-slate-500">
                {t(
                  'capsules.subtitle',
                  'Recognize this exact danger next time — verified public education in your language',
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-200">
              <span>🏛️ {capsule.officialOrganization}</span>
              <span>•</span>
              <span className="text-emerald-800 font-extrabold">
                {LANGUAGE_LABELS[currentLang]}
              </span>
            </span>

            {onExploreLibrary && (
              <button
                type="button"
                onClick={onExploreLibrary}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 underline py-1 px-2"
              >
                {t('capsules.allTopics', 'All Topics →')}
              </button>
            )}
          </div>
        </div>

        {/* Capsule Title & Short Rule */}
        <div className="space-y-1.5">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            {title}
          </h3>
          <p className="text-sm sm:text-base font-semibold text-slate-700 leading-relaxed">
            {shortRule}
          </p>
        </div>

        {/* ELDERLY-FIRST PRIMARY INTERFACE (Watch Video + Listen Buttons) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          {/* 🎥 Watch Video Button */}
          {hasOfficialVideoInCurrentLang ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-initial px-6 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2.5 focus:outline-none focus:ring-4 focus:ring-emerald-200"
            >
              <span className="text-lg">🎥</span>
              <span>
                {t('capsules.watchVideo', 'Watch Video')} ({LANGUAGE_LABELS[currentLang]})
              </span>
            </button>
          ) : (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 text-xs font-bold text-amber-950 flex items-center gap-2">
              <span>⚠️</span>
              <span>
                {t(
                  'capsules.videoUnavailableYet',
                  `Official video not available in ${LANGUAGE_LABELS[currentLang]} yet.`,
                )}
              </span>
            </div>
          )}

          {/* 🔊 Suno / Listen Audio Button */}
          <button
            type="button"
            onClick={handleToggleSpeak}
            className={`flex-1 sm:flex-initial px-5 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base border-2 transition flex items-center justify-center gap-2 shadow-xs active:scale-95 ${
              isPlayingAudio
                ? 'bg-amber-600 text-white border-amber-600 animate-pulse'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-300'
            }`}
          >
            <span>{listenButtonText}</span>
          </button>

          {/* Official Source Link Button */}
          <a
            href={capsule.officialSourcePage}
            target="_blank"
            rel="noopener noreferrer"
            className="sm:ml-auto px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition text-center"
          >
            <span>🏛️ Official Source ({capsule.officialOrganization})</span>
            <span>↗</span>
          </a>
        </div>

        {/* ✅ Main Rule (Elderly-First Highlight) */}
        <div className="p-4 rounded-2xl bg-emerald-50/90 border-2 border-emerald-400 text-emerald-950 font-bold text-xs sm:text-sm shadow-2xs leading-relaxed flex items-start gap-2.5">
          <span className="text-xl shrink-0" aria-hidden="true">
            🛡️
          </span>
          <p>{mainRule}</p>
        </div>

        {/* Fallback Display When Official Video is unmapped for a specific language */}
        {!hasOfficialVideoInCurrentLang && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>Official source video: English</span>
              <span>NiveshShield explanation: {LANGUAGE_LABELS[currentLang]}</span>
            </div>
            <p className="text-slate-700 italic">"{audioExplanation}"</p>
          </div>
        )}

        {/* Disclaimer / Transparency Footnote */}
        <p className="text-[10px] text-slate-400 font-medium text-center sm:text-left">
          Official Awareness Campaign: <strong>{capsule.campaignName}</strong> ({capsule.officialOrgFullName}).
          NiveshShield surfaces public educational material from official Indian regulatory initiatives and is not an official RBI/SEBI application.
        </p>
      </div>

      {/* Video Modal Player */}
      <SafetyCapsuleModal
        capsule={capsule}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialLanguage={currentLang}
      />
    </>
  )
}
