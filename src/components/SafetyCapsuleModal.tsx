import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type SafetyCapsule,
  type SafetyCapsuleVideo,
  normalizeLanguageCode,
  LANGUAGE_LABELS,
} from '../data/safetyCapsules'

interface SafetyCapsuleModalProps {
  capsule: SafetyCapsule
  isOpen: boolean
  onClose: () => void
  initialLanguage?: string
}

export const SafetyCapsuleModal: React.FC<SafetyCapsuleModalProps> = ({
  capsule,
  isOpen,
  onClose,
  initialLanguage,
}) => {
  const { i18n } = useTranslation()
  const activeLang = normalizeLanguageCode(initialLanguage || i18n.language)

  const video: SafetyCapsuleVideo | undefined = capsule.videosByLanguage[activeLang]
  const title = capsule.localizedTitle[activeLang] || capsule.localizedTitle.en
  const mainRule = capsule.localizedMainRule[activeLang] || capsule.localizedMainRule.en
  const takeaways = capsule.takeaways[activeLang] || capsule.takeaways.en || []

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="safety-capsule-modal-title"
    >
      <div className="w-full max-w-4xl rounded-3xl bg-white p-4 sm:p-7 shadow-2xl space-y-4 relative my-6 border border-slate-200 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-950 border border-emerald-300">
                <span>🏛️ Official Awareness Video</span>
                <span>•</span>
                <span>{video?.sourceOrg || capsule.officialOrganization}</span>
                <span>•</span>
                <span className="font-extrabold">{LANGUAGE_LABELS[activeLang]}</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {capsule.campaignName}
              </span>
            </div>
            <h3
              id="safety-capsule-modal-title"
              className="text-lg sm:text-2xl font-black text-slate-900 mt-1 leading-snug"
            >
              {title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 font-bold text-2xl p-2 rounded-xl hover:bg-slate-100 transition shrink-0"
            aria-label="Close video dialog"
          >
            ✕
          </button>
        </div>

        {/* Video Player Section */}
        {video?.embedUrl ? (
          <div className="w-full space-y-2">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-lg border border-slate-800">
              <iframe
                src={`${video.embedUrl}?autoplay=1&rel=0&modestbranding=1`}
                title={`${title} - ${video.sourceOrgFullName} (${video.languageLabel})`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                Duration: <strong className="text-slate-700">{video.duration}</strong>
              </span>
              <span className="flex items-center gap-1 text-emerald-800 font-bold">
                ✓ Verified in {LANGUAGE_LABELS[activeLang]}
              </span>
            </div>
          </div>
        ) : (
          /* Language Fallback Notice */
          <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <h4 className="font-black text-base sm:text-lg">
                Official video not available in {LANGUAGE_LABELS[activeLang]} yet.
              </h4>
            </div>
            <p className="text-sm font-medium">
              We have requested regional translation from {capsule.officialOrganization}. In the
              meantime, please review the verified NiveshShield explanation and official source page below.
            </p>
            <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs font-semibold">
              <span className="text-slate-500 block uppercase text-[10px] tracking-wider mb-1">
                NiveshShield explanation ({LANGUAGE_LABELS[activeLang]}):
              </span>
              <span>{capsule.localizedAudioExplanation[activeLang]}</span>
            </div>
          </div>
        )}

        {/* Main Rule High-Contrast Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold text-sm sm:text-base shadow-xs flex items-start gap-3">
          <span className="text-2xl select-none" aria-hidden="true">
            ✅
          </span>
          <div className="space-y-1">
            <p className="font-black text-emerald-900 leading-relaxed">{mainRule}</p>
          </div>
        </div>

        {/* Key Takeaways */}
        {takeaways.length > 0 && (
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
              📌 Key Safety Reminders
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {takeaways.map((item, index) => (
                <li
                  key={index}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 leading-relaxed flex items-start gap-2"
                >
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer & Official Transparency Link */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="text-[11px] text-slate-500 text-center sm:text-left">
            <span>Source Organization: </span>
            <strong className="text-slate-800">{capsule.officialOrgFullName}</strong>
            <p className="text-[10px] text-slate-400 mt-0.5">
              NiveshShield surfaces public educational material from official Indian regulatory initiatives and is not the author of this video.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={capsule.officialSourcePage}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition flex items-center gap-1.5"
            >
              <span>🏛️</span>
              <span>Official Source ({capsule.officialOrganization})</span>
              <span>↗</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
