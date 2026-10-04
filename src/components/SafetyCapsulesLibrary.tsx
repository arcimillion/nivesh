import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type SafetyCapsule,
  getUniversalSafetyCapsules,
  normalizeLanguageCode,
  LANGUAGE_LABELS,
} from '../data/safetyCapsules'
import { SafetyCapsuleModal } from './SafetyCapsuleModal'

interface SafetyCapsulesLibraryProps {
  onClose?: () => void
}

export const SafetyCapsulesLibrary: React.FC<SafetyCapsulesLibraryProps> = ({ onClose }) => {
  const { t, i18n } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCapsuleForModal, setActiveCapsuleForModal] = useState<SafetyCapsule | null>(null)

  const currentLang = normalizeLanguageCode(i18n.language)
  const allCapsules = getUniversalSafetyCapsules()

  const categories = [
    { id: 'all', label: t('capsules.categories.all', 'All Topics') },
    { id: 'otp_credentials', label: '🔐 OTP & Passwords' },
    { id: 'upi_payments', label: '💳 UPI & Payments' },
    { id: 'guaranteed_returns', label: '📈 Guaranteed Returns' },
    { id: 'fake_apps', label: '📱 Fake Trading APKs' },
    { id: 'impersonation', label: '👮 Digital Arrest' },
    { id: 'phishing_links', label: '🔗 Phishing Links' },
  ]

  const filteredCapsules = allCapsules.filter((capsule) => {
    if (selectedCategory !== 'all' && capsule.category !== selectedCategory) {
      return false
    }
    if (!searchQuery.trim()) return true

    const q = searchQuery.toLowerCase()
    const title = (capsule.localizedTitle[currentLang] || '').toLowerCase()
    const rule = (capsule.localizedShortRule[currentLang] || '').toLowerCase()
    const org = capsule.officialOrganization.toLowerCase()
    const tags = capsule.tags.join(' ').toLowerCase()

    return title.includes(q) || rule.includes(q) || org.includes(q) || tags.includes(q)
  })

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 space-y-3 relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-700 text-white">
                🏛️ Official Awareness Library
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">
                Language: <strong className="text-white">{LANGUAGE_LABELS[currentLang]}</strong>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              NiveshShield Safety Capsules
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl font-medium">
              Verified public education videos from <strong>RBI</strong>, <strong>SEBI</strong>,{' '}
              <strong>NSE</strong>, <strong>I4C</strong>, and <strong>NPCI</strong> in all six
              languages. Learn how to recognize and avoid financial fraud before sending money.
            </p>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="self-start sm:self-center px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
            >
              ← Back
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="pt-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              'capsules.searchPlaceholder',
              'Search by topic (e.g. OTP, UPI, guaranteed returns, digital arrest)...',
            )}
            className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition shadow-2xs ${
              selectedCategory === cat.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Capsules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCapsules.map((capsule) => {
          const video = capsule.videosByLanguage[currentLang]
          const title = capsule.localizedTitle[currentLang] || capsule.localizedTitle.en
          const shortRule = capsule.localizedShortRule[currentLang] || capsule.localizedShortRule.en
          const mainRule = capsule.localizedMainRule[currentLang] || capsule.localizedMainRule.en

          return (
            <div
              key={capsule.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Org & Language Badges */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-extrabold text-[11px] uppercase">
                    🏛️ {capsule.officialOrganization}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {LANGUAGE_LABELS[currentLang]} • {video?.duration || '1-2 min'}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-snug">{title}</h3>
                  <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed">
                    {shortRule}
                  </p>
                </div>

                {/* Main Rule Highlight */}
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-300 text-emerald-950 font-bold text-xs leading-relaxed">
                  {mainRule}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveCapsuleForModal(capsule)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <span>🎥 Watch Video</span>
                </button>

                <a
                  href={capsule.officialSourcePage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                  title={`Open official ${capsule.officialOrganization} page`}
                >
                  Source ↗
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {filteredCapsules.length === 0 && (
        <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-200 text-slate-500">
          <p className="text-base font-bold">No capsules found matching "{searchQuery}"</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
            }}
            className="mt-3 text-xs font-bold text-emerald-700 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Video Modal Player */}
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
