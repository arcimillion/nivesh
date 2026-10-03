import React from 'react'
import { useTranslation } from 'react-i18next'

interface HowItWorksModalProps {
  isOpen: boolean
  onClose: () => void
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div
        className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 relative my-8 border border-slate-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-it-works-title"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <h3 id="how-it-works-title" className="text-lg font-black text-slate-900">
              {t('howItWorksTitle', 'How it works')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold text-lg p-1"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-semibold text-xs sm:text-sm leading-relaxed">
          {t('howItWorksContent', 'Paste a suspicious message, upload a WhatsApp screenshot, drop a URL, or use the microphone to scan for potential fraud.')}
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-bold text-slate-900">
                {t('howItWorks.step1Title', 'Submit Any Suspicious Offer')}
              </p>
              <p className="mt-0.5 text-slate-600 text-xs">
                {t(
                  'howItWorks.step1Text',
                  'Paste text messages, upload WhatsApp screenshots, enter web links, or speak in your own language.',
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-bold text-slate-900">
                {t('howItWorks.step2Title', 'Evidence Checked Against SEBI & RBI Rules')}
              </p>
              <p className="mt-0.5 text-slate-600 text-xs">
                {t(
                  'howItWorks.step2Text',
                  'Our engine looks for statutory red flags like guaranteed profit promises, artificial urgency, and demands for money into private UPI accounts.',
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-bold text-slate-900">
                {t('howItWorks.step3Title', 'Instant, High-Contrast Verdict')}
              </p>
              <p className="mt-0.5 text-slate-600 text-xs">
                {t(
                  'howItWorks.step3Text',
                  'Get a massive plain-language verdict (Green, Amber, or Red) with voice narration and 1-click police helpline reporting tools.',
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
            <span className="text-xl">🔒</span>
            <div>
              <p className="font-bold">
                {t('howItWorks.privacyTitle', 'Zero Personal Data Stored')}
              </p>
              <p className="mt-0.5 text-emerald-900 text-xs">
                {t(
                  'howItWorks.privacyText',
                  'Your submitted messages, photos, and recordings are analyzed strictly in-memory and are never stored or shared with advertisers.',
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition"
          >
            {t('howItWorks.gotIt', 'Got It, Let’s Scan')}
          </button>
        </div>
      </div>
    </div>
  )
}
