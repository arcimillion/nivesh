import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnalysisResult } from '../api'
import {
  type SafetyCapsule,
  findRecommendedCapsule,
  normalizeLanguageCode,
} from '../data/safetyCapsules'
import { SafetyCapsuleModal } from './SafetyCapsuleModal'

interface SafetyCapsuleCardProps {
  analysis?: AnalysisResult | null
  capsule?: SafetyCapsule
  onExploreLibrary?: () => void
}

export const SafetyCapsuleCard: React.FC<SafetyCapsuleCardProps> = ({
  analysis,
  capsule: customCapsule,
}) => {
  const { i18n, t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const currentLang = normalizeLanguageCode(i18n.language)
  const capsule: SafetyCapsule = customCapsule || findRecommendedCapsule(analysis)

  const title = capsule.localizedTitle[currentLang] || capsule.localizedTitle.en
  const mainRule = capsule.localizedMainRule[currentLang] || capsule.localizedMainRule.en

  return (
    <>
      <div className="w-full rounded-2xl border-2 border-emerald-500 bg-emerald-50/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-fade-in">
        <div className="flex items-start gap-3">
          <span className="text-3xl shrink-0 select-none" aria-hidden="true">
            🎥
          </span>
          <div className="space-y-1 text-left">
            <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {title}
            </h4>
            <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">
              🛡️ {mainRule}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm shadow-xs shrink-0 transition cursor-pointer active:scale-95 flex items-center justify-center gap-2"
        >
          <span className="text-lg">🎥</span>
          <span>{t('capsules.watchVideo', 'वीडियो देखें (Watch Video)')}</span>
        </button>
      </div>

      <SafetyCapsuleModal
        capsule={capsule}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialLanguage={currentLang}
      />
    </>
  )
}
