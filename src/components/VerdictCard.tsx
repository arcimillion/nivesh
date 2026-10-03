import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnalysisResult } from '../api'

interface VerdictCardProps {
  analysis: AnalysisResult
  onReset: () => void
  onToggleJourneyMap: () => void
  onToggleDossier: () => void
  showJourneyMap: boolean
  showDossier: boolean
}

const LANG_VOICE_CODES: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
}

export const VerdictCard: React.FC<VerdictCardProps> = ({
  analysis,
  onReset,
  onToggleJourneyMap,
  onToggleDossier,
  showJourneyMap,
  showDossier,
}) => {
  const { t, i18n } = useTranslation()
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const isRed = analysis.overall_status === 'warning_signs_found'
  const isAmber = analysis.overall_status === 'insufficient_evidence'
  const isGreen = analysis.overall_status === 'no_obvious_warning_signs'

  // Plain-language, senior-friendly verdict texts
  const getVerdictDetails = () => {
    if (isRed) {
      return {
        icon: '🛑',
        badge: t('verdict.redBadge', 'HIGH RISK'),
        headline: t('verdict.redHeadline', 'Transaction Block Recommended'),
        subhead: t(
          'verdict.redSubhead',
          'Do NOT send money, share OTPs, or click app links. This message shows clear signs of financial fraud.',
        ),
        actionRule: t(
          'verdict.redRule',
          'Key Safety Rule: Under SEBI regulations, NO ONE is legally allowed to guarantee fixed profits on investments.',
        ),
        bgClass: 'bg-rose-50 border-rose-500 text-rose-950',
        badgeClass: 'bg-rose-600 text-white',
        borderClass: 'border-rose-400',
      }
    }

    if (isAmber) {
      return {
        icon: '⚠️',
        badge: t('verdict.amberBadge', 'NEEDS VERIFICATION'),
        headline: t('verdict.amberHeadline', 'High Caution Advised'),
        subhead: t(
          'verdict.amberSubhead',
          'This sender or group is not verified on official government directories. Do not transfer funds until their license is verified.',
        ),
        actionRule: t(
          'verdict.amberRule',
          'Key Safety Rule: Never invest through informal WhatsApp, Telegram, or social media groups.',
        ),
        bgClass: 'bg-amber-50 border-amber-500 text-amber-950',
        badgeClass: 'bg-amber-600 text-white',
        borderClass: 'border-amber-400',
      }
    }

    // Default to green / permissible state
    return {
      icon: isGreen ? '✅' : 'ℹ️',
      badge: t('verdict.greenBadge', 'PERMISSIBLE'),
      headline: t('verdict.greenHeadline', 'No Obvious Warning Signs'),
      subhead: t(
        'verdict.greenSubhead',
        'Standard educational or regulated guidance observed. No urgent payment pressure or guaranteed return claims were detected.',
      ),
      actionRule: t(
        'verdict.greenRule',
        'Reminder: All securities investments carry market risk. Always confirm your broker is registered on sebi.gov.in.',
      ),
      bgClass: 'bg-emerald-50 border-emerald-500 text-emerald-950',
      badgeClass: 'bg-emerald-700 text-white',
      borderClass: 'border-emerald-400',
    }
  }

  const details = getVerdictDetails()

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return

    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
      return
    }

    window.speechSynthesis.cancel()

    // Plain text speech tailored for seniors in their language
    const speechText = `${details.headline}. ${analysis.summary || details.subhead}. ${details.actionRule}`

    const utterance = new SpeechSynthesisUtterance(speechText)
    const targetLangCode = LANG_VOICE_CODES[i18n.language] || 'en-IN'
    utterance.lang = targetLangCode
    utterance.rate = 0.95

    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)

    setIsPlayingAudio(true)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Massive High-Contrast Verdict Card */}
      <div
        className={`rounded-3xl border-4 p-6 sm:p-10 shadow-xl transition-all ${details.bgClass}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-5">
          <div className="flex items-center gap-3">
            <span className="text-5xl sm:text-6xl select-none" aria-hidden="true">
              {details.icon}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${details.badgeClass}`}
                >
                  {details.badge}
                </span>
                {(analysis.pre_screener_intercepted ||
                  analysis.extraction_uncertainty?.notes?.includes('Deterministic Zero-Trust')) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-900 text-rose-100 border border-rose-700 shadow-2xs">
                    ⚡ 0ms Zero-Trust Bouncer
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight mt-1 leading-tight">
                {details.headline}
              </h2>
            </div>
          </div>

          {/* Quick Voice Readout & Reset Buttons */}
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

        {/* Verdict Explanation in Plain Language (Zero Jargon) */}
        <div className="mt-6 space-y-4">
          <p className="text-base sm:text-xl font-semibold leading-relaxed">
            {analysis.summary || details.subhead}
          </p>

          <div className="p-4 rounded-2xl bg-white/80 border border-black/10 text-sm sm:text-base font-bold flex items-start gap-2.5">
            <span className="text-lg">🛡️</span>
            <span>{details.actionRule}</span>
          </div>

          {/* Top key warning indicator quotes if red */}
          {isRed && analysis.findings && analysis.findings.length > 0 && (
            <div className="p-4 rounded-2xl bg-white/90 border border-rose-200 space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-900 block">
                {t('verdict.suspiciousPhrase', 'Suspicious phrase found in message:')}
              </span>
              <p className="font-mono text-xs sm:text-sm font-bold text-rose-950 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                “{analysis.findings[0].original_excerpt}”
              </p>
              <p className="text-xs text-rose-900 font-medium">
                {analysis.findings[0].explanation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Actions for Red and Amber Verdicts */}
      {(isRed || isAmber) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onToggleJourneyMap}
            className={`w-full sm:w-auto px-6 py-4 rounded-2xl text-sm sm:text-base font-extrabold transition-all shadow-md flex items-center justify-center gap-2 border-2 ${
              showJourneyMap
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-900 border-slate-300 hover:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <span>🗺️</span>
            <span>
              {showJourneyMap
                ? t('verdict.hideJourneyMap', 'Hide Scam Journey Map')
                : t('verdict.viewJourneyMap', 'View Scam Journey Map (5-Stage Breakdown)')}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleDossier}
            className={`w-full sm:w-auto px-6 py-4 rounded-2xl text-sm sm:text-base font-extrabold transition-all shadow-md flex items-center justify-center gap-2 ${
              showDossier
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <span>📋</span>
            <span>
              {showDossier
                ? t('verdict.hideDossier', 'Hide Complaint Dossier')
                : t('verdict.generateDossier', 'Generate 1930 Complaint Dossier')}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
