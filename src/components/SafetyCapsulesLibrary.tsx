import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type SafetyCapsule,
  getUniversalSafetyCapsules,
  normalizeLanguageCode,
} from '../data/safetyCapsules'
import { SafetyCapsuleModal } from './SafetyCapsuleModal'

interface SafetyCapsulesLibraryProps {
  onClose?: () => void
}

export const SafetyCapsulesLibrary: React.FC<SafetyCapsulesLibraryProps> = () => {
  const { t, i18n } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeCapsuleForModal, setActiveCapsuleForModal] = useState<SafetyCapsule | null>(null)

  const currentLang = normalizeLanguageCode(i18n.language)
  const allCapsules = getUniversalSafetyCapsules()

  const categories = [
    { id: 'all', label: t('capsules.categories.all', 'All Topics') },
    { id: 'otp_credentials', label: t('capsules.categories.otp_credentials', '🔐 OTP & Passwords') },
    { id: 'upi_payments', label: t('capsules.categories.upi_payments', '💳 UPI & Payments') },
    { id: 'guaranteed_returns', label: t('capsules.categories.guaranteed_returns', '📈 Guaranteed Returns') },
    { id: 'fake_apps', label: t('capsules.categories.fake_apps', '📱 Fake APKs') },
    { id: 'impersonation', label: t('capsules.categories.impersonation', '👮 Digital Arrest') },
  ]

  const filteredCapsules = allCapsules.filter((capsule) => {
    if (selectedCategory !== 'all' && capsule.category !== selectedCategory) {
      return false
    }
    return true
  })

  return (
    <div className="w-full space-y-5 animate-fade-in">
      {/* Simple Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition cursor-pointer border-2 ${
              selectedCategory === cat.id
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Clean Video Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCapsules.map((capsule) => {
          const title = capsule.localizedTitle[currentLang] || capsule.localizedTitle.en
          const mainRule = capsule.localizedMainRule[currentLang] || capsule.localizedMainRule.en

          return (
            <div
              key={capsule.id}
              className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {title}
                </h3>

                <p className="text-xs sm:text-sm font-bold text-slate-700 bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 leading-relaxed">
                  🛡️ {mainRule}
                </p>
              </div>

              {/* Single Prominent Watch Video Button */}
              <button
                type="button"
                onClick={() => setActiveCapsuleForModal(capsule)}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span className="text-lg">🎥</span>
                <span>{t('capsules.watchVideo', 'Watch Video')}</span>
              </button>
            </div>
          )
        })}
      </div>

      {/* Video Player Modal */}
      {activeCapsuleForModal && (
        <SafetyCapsuleModal
          capsule={activeCapsuleForModal}
          isOpen={Boolean(activeCapsuleForModal)}
          onClose={() => setActiveCapsuleForModal(null)}
          initialLanguage={currentLang}
        />
      )}
    </div>
  )
}
