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
        className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 relative my-8 border-2 border-slate-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-it-works-title"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🛡️</span>
            <h3 id="how-it-works-title" className="text-xl font-black text-slate-900">
              {t('howItWorksTitle', 'How to use this app')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 font-black text-2xl p-1"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-950 font-bold text-sm sm:text-base leading-relaxed">
          {t('howItWorksContent', 'Copy-paste any message, upload a WhatsApp screenshot, enter a link, or speak using the microphone to check if someone is trying to steal your money.')}
        </div>

        <div className="space-y-4 text-sm text-slate-800 leading-relaxed font-bold">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white font-black text-sm">
              1
            </span>
            <div>
              <p className="font-black text-slate-900 text-base">
                {t('howItWorks.step1Title', '1. Put Message, Photo, or Voice Note')}
              </p>
              <p className="mt-1 text-slate-700 text-xs sm:text-sm font-semibold">
                {t(
                  'howItWorks.step1Text',
                  'Paste any WhatsApp message, upload a photo of the message, paste a link, or speak in your own mother tongue.',
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white font-black text-sm">
              2
            </span>
            <div>
              <p className="font-black text-slate-900 text-base">
                {t('howItWorks.step2Title', '2. Checked Against Government & SEBI Rules')}
              </p>
              <p className="mt-1 text-slate-700 text-xs sm:text-sm font-semibold">
                {t(
                  'howItWorks.step2Text',
                  'Checks for fake profit claims, urgent money demands, and personal UPI requests.',
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white font-black text-sm">
              3
            </span>
            <div>
              <p className="font-black text-slate-900 text-base">
                {t('howItWorks.step3Title', '3. Clear Result & Voice Reading')}
              </p>
              <p className="mt-1 text-slate-700 text-xs sm:text-sm font-semibold">
                {t(
                  'howItWorks.step3Text',
                  'Get a big RED or GREEN result that can also be read out loud to you in your language.',
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="font-black text-base">
                {t('howItWorks.privacyTitle', 'Your Information is Private')}
              </p>
              <p className="mt-1 text-emerald-900 text-xs sm:text-sm font-semibold">
                {t('howItWorks.privacyText', 'Nothing is saved on any server. Your information stays safe.')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition"
          >
            Got it, close
          </button>
        </div>
      </div>
    </div>
  )
}
