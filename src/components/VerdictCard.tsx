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

// Clean up any residual developer jargon from summary text for elderly villagers
function sanitizeSummaryText(summary: string | undefined, isRed: boolean, isAmber: boolean, isGreen: boolean): string {
  if (!summary) return ''

  // Replace developer jargon strings
  const text = summary
    .replace(/Zero-Trust Alert:\s*/gi, '')
    .replace(/Zero-Trust Rule:\s*/gi, '')
    .replace(/regional language\/script,/gi, '')
    .replace(/violating SEBI\/RBI regulations\.?/gi, '')
    .trim()

  if (isRed && (text.includes('Guaranteed investment returns') || text.length < 20)) {
    return 'This message is a fake offer. It promises guaranteed profits to trick you into sending money. Do NOT send any money or click any links.'
  }

  if (isAmber && text.length < 20) {
    return 'Be careful! This sender is not verified by the government. Check carefully before sending any money.'
  }

  if (isGreen && text.length < 20) {
    return 'This looks like a normal message or safe guide. No fake profit promises or money demands were found.'
  }

  return text
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

  const getVerdictDetails = () => {
    if (isRed) {
      return {
        icon: '🚨',
        badge: t('verdict.redBadge', 'DANGER - SCAM!'),
        headline: t('verdict.redHeadline', 'DANGER! This is a Scam — Do NOT Send Money!'),
        subhead: t(
          'verdict.redSubhead',
          'Do NOT send money, share OTPs, or click any app link. This message is trying to trick you and steal your savings.',
        ),
        actionRule: t(
          'verdict.redRule',
          'Important Rule: Under government regulations, NO ONE is legally allowed to promise guaranteed fixed profits on your money.',
        ),
        bgClass: 'bg-rose-50 border-rose-600 text-rose-950',
        badgeClass: 'bg-rose-700 text-white',
        borderClass: 'border-rose-500',
      }
    }

    if (isAmber) {
      return {
        icon: '⚠️',
        badge: t('verdict.amberBadge', 'BE CAREFUL'),
        headline: t('verdict.amberHeadline', 'CAUTION! Verify Before Sending Any Money'),
        subhead: t(
          'verdict.amberSubhead',
          'This sender or WhatsApp group is NOT verified by the government. Do not transfer any money until you verify them.',
        ),
        actionRule: t(
          'verdict.amberRule',
          'Important Rule: Never invest money through informal WhatsApp or Telegram groups.',
        ),
        bgClass: 'bg-amber-50 border-amber-500 text-amber-950',
        badgeClass: 'bg-amber-700 text-white',
        borderClass: 'border-amber-400',
      }
    }

    return {
      icon: isGreen ? '✅' : 'ℹ️',
      badge: t('verdict.greenBadge', 'SAFE'),
      headline: t('verdict.greenHeadline', 'Safe — No Warning Signs Found'),
      subhead: t(
        'verdict.greenSubhead',
        'This appears to be a normal educational or official message. No urgent money demands or fake profit promises were found.',
      ),
      actionRule: t(
        'verdict.greenRule',
        'Safety Rule: All stock market investments have risk. Always verify your broker before giving money.',
      ),
      bgClass: 'bg-emerald-50 border-emerald-600 text-emerald-950',
      badgeClass: 'bg-emerald-700 text-white',
      borderClass: 'border-emerald-400',
    }
  }

  const details = getVerdictDetails()
  const displaySummary = sanitizeSummaryText(analysis.summary, isRed, isAmber, isGreen) || details.subhead

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return

    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
      return
    }

    window.speechSynthesis.cancel()

    const speechText = `${details.headline}. ${displaySummary}. ${details.actionRule}`

    const utterance = new SpeechSynthesisUtterance(speechText)
    const targetLangCode = LANG_VOICE_CODES[i18n.language] || 'en-IN'
    utterance.lang = targetLangCode
    utterance.rate = 0.9

    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)

    setIsPlayingAudio(true)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Massive High-Contrast Verdict Card */}
      <div
        className={`rounded-3xl border-4 p-6 sm:p-8 shadow-2xl transition-all ${details.bgClass}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-5">
          <div className="flex items-start sm:items-center gap-3">
            <span className="text-5xl sm:text-6xl select-none" aria-hidden="true">
              {details.icon}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`inline-block px-3.5 py-1 rounded-full text-xs sm:text-sm font-black tracking-wider uppercase ${details.badgeClass}`}
                >
                  {details.badge}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                {details.headline}
              </h2>
            </div>
          </div>

          {/* Quick Voice Readout & Reset Buttons */}
          <div className="flex items-center gap-2.5 self-stretch sm:self-center">
            <button
              type="button"
              onClick={handleSpeak}
              className="flex-1 sm:flex-none px-4 py-3 text-xs sm:text-sm font-black bg-white hover:bg-slate-100 text-slate-900 rounded-2xl border-2 border-slate-300 shadow-xs transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-900 active:scale-95 cursor-pointer"
              title={t('verdict.voiceTitle', 'Listen to the explanation in your language')}
            >
              <span className="text-lg">{isPlayingAudio ? '⏹️' : '🔊'}</span>
              <span>
                {isPlayingAudio
                  ? t('verdict.stopVoice', 'Stop Voice')
                  : t('verdict.listenAloud', 'Listen Aloud')}
              </span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="px-4 py-3 text-xs sm:text-sm font-black bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-xs transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-900 active:scale-95 cursor-pointer"
            >
              <span className="text-lg">🔄</span>
              <span>{t('verdict.checkAnother', 'Check Another Message')}</span>
            </button>
          </div>
        </div>

        {/* Verdict Explanation in Plain Language (Zero Jargon) */}
        <div className="mt-6 space-y-4">
          <p className="text-base sm:text-xl font-black leading-relaxed text-slate-900">
            {displaySummary}
          </p>

          <div className="p-4 rounded-2xl bg-white/90 border-2 border-black/10 text-sm sm:text-base font-bold flex items-start gap-3 shadow-xs">
            <span className="text-2xl shrink-0">🛡️</span>
            <span className="text-slate-900 leading-normal">{details.actionRule}</span>
          </div>

          {/* Top key warning indicator quotes if red */}
          {isRed && analysis.findings && analysis.findings.length > 0 && (
            <div className="p-4 rounded-2xl bg-white border-2 border-rose-300 space-y-2.5 shadow-xs">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-900 block">
                {t('verdict.suspiciousPhrase', 'Dangerous words found in this message:')}
              </span>
              <p className="text-sm sm:text-base font-extrabold text-rose-950 bg-rose-50 p-3 rounded-xl border border-rose-200">
                “{analysis.findings[0].original_excerpt}”
              </p>
              <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
                {analysis.findings[0].explanation.replace(/SEBI regulations explicitly prohibit any intermediary, broker, or financial advisor from guaranteeing or promising fixed profits on investments\./gi, 'Real stock market investments can never guarantee fixed monthly profits. Anyone promising guaranteed profits is lying to steal your money.')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {(isRed || isAmber) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onToggleJourneyMap}
            className={`w-full sm:w-auto px-6 py-4 rounded-2xl text-sm sm:text-base font-black transition-all shadow-md flex items-center justify-center gap-2.5 border-2 cursor-pointer ${
              showJourneyMap
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-900 border-slate-300 hover:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <span className="text-xl">🗺️</span>
            <span>
              {showJourneyMap
                ? t('verdict.hideJourneyMap', 'Hide 5 Steps')
                : t('verdict.viewJourneyMap', 'How Scammers Trick People (5 Steps)')}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleDossier}
            className={`w-full sm:w-auto px-6 py-4 rounded-2xl text-sm sm:text-base font-black transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer ${
              showDossier
                ? 'bg-emerald-800 text-white'
                : 'bg-rose-800 hover:bg-rose-900 text-white'
            }`}
          >
            <span className="text-xl">📋</span>
            <span>
              {showDossier
                ? t('verdict.hideDossier', 'Hide Complaint Paper')
                : t('verdict.generateDossier', 'Generate Police Complaint Paper (1930)')}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
