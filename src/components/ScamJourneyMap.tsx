import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { JourneyStage as JourneyStageType } from '../api'

interface Props {
  stages: JourneyStageType[]
}

const STAGE_ICONS: Record<string, string> = {
  initial_offer: '🎁',
  urgency_pressure: '⚡',
  payment_request: '💳',
  app_or_credential_request: '📱',
  followup_or_recovery: '💸',
}

const STAGE_TITLES: Record<string, string> = {
  initial_offer: '1. Fake Offer & Big Profit Trap',
  urgency_pressure: '2. Rushing You to Pay Fast',
  payment_request: '3. Demanding Upfront Fee or UPI Transfer',
  app_or_credential_request: '4. Asking to Download Fake App or Share Password',
  followup_or_recovery: '5. Demanding More Money to Withdraw Profits',
}

export const ScamJourneyMap: React.FC<Props> = ({ stages }) => {
  const { t } = useTranslation()
  const [expandedStage, setExpandedStage] = useState<string | null>(null)

  if (!stages || stages.length === 0) {
    return null
  }

  const observedCount = stages.filter((s) => s.observed).length

  return (
    <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4 mb-5">
        <div>
          <h4 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <span>🗺️</span> {t('journey.title', 'How Scammers Trick People (5 Steps)')}
          </h4>
          <p className="mt-1 text-xs sm:text-sm font-bold text-slate-600">
            {t(
              'journey.subtitle',
              'Scammers follow these 5 steps to trick people and steal money. Here is how they operate:',
            )}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="rounded-full bg-rose-100 px-3.5 py-1 text-xs sm:text-sm font-black text-rose-900 border border-rose-300">
            {t('journey.observedBadge', {
              count: observedCount,
              defaultValue: `${observedCount} Traps Found in Message`,
            })}
          </span>
          <span className="rounded-full bg-amber-100 px-3.5 py-1 text-xs sm:text-sm font-black text-amber-900 border border-amber-300">
            {t('journey.futureBadge', {
              count: stages.length - observedCount,
              defaultValue: `${stages.length - observedCount} Next Possible Risk`,
            })}
          </span>
        </div>
      </div>

      {/* Journey Timeline Steps */}
      <div className="relative space-y-3">
        {stages.map((stg) => {
          const isExpanded = expandedStage === stg.stage
          const icon = STAGE_ICONS[stg.stage] || '📌'
          const defaultTitle =
            t(`journey.stageTitles.${stg.stage}`, STAGE_TITLES[stg.stage] || stg.title)

          return (
            <div
              key={stg.stage}
              className={`rounded-2xl border-2 transition-all ${
                stg.observed
                  ? 'border-rose-300 bg-rose-50/60 shadow-2xs'
                  : 'border-slate-200 bg-slate-50/60'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedStage(isExpanded ? null : stg.stage)}
                className="w-full flex items-center justify-between p-4 text-left focus:outline-none rounded-2xl cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl font-black shadow-2xs ${
                      stg.observed
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-300 text-slate-800'
                    }`}
                  >
                    {icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-black text-slate-900">
                        {defaultTitle}
                      </span>
                      {stg.observed ? (
                        <span className="rounded-full bg-rose-200 px-2.5 py-0.5 text-xs font-black text-rose-950 uppercase tracking-wide">
                          {t('journey.observedTactic', 'Found in this message')}
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-black text-amber-950 uppercase tracking-wide">
                          {t('journey.futureTactic', 'Next possible risk')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs sm:text-sm font-bold text-slate-700 leading-snug">
                      {stg.observed
                        ? stg.evidence
                          ? `${t('journey.evidencePrefix', 'Found words:')} "${stg.evidence}"`
                          : stg.explanation
                        : `${t('journey.nextRiskPrefix', 'Next risk:')} ${stg.explanation}`}
                    </p>
                  </div>
                </div>

                <div className="ml-2 text-slate-500 font-black text-base shrink-0">
                  {isExpanded ? '▲' : '▼'}
                </div>
              </button>

              {/* Expandable Evidence & Details */}
              {isExpanded && (
                <div className="border-t-2 border-slate-200 p-4 bg-white rounded-b-2xl space-y-3 text-xs sm:text-sm">
                  {stg.observed && stg.evidence && (
                    <div className="rounded-xl bg-rose-50 p-3 border border-rose-200">
                      <p className="font-black text-rose-900 uppercase text-xs tracking-wider">
                        {t('journey.observedEvidenceExcerpt', 'Words found in your message')}
                      </p>
                      <p className="mt-1 font-extrabold text-rose-950">
                        “{stg.evidence}”
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="font-black text-slate-800 uppercase text-xs tracking-wider">
                      {t('journey.tacticExplanation', 'Why this is a trap')}
                    </p>
                    <p className="mt-1 leading-relaxed text-slate-800 font-bold">
                      {stg.explanation}
                    </p>
                  </div>

                  {!stg.observed && (
                    <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-amber-950 font-bold">
                      <p className="font-black flex items-center gap-1.5 text-xs uppercase">
                        <span>💡</span> {t('journey.howToProtect', 'How to Protect Yourself:')}
                      </p>
                      <p className="mt-1 leading-relaxed text-xs sm:text-sm">
                        {t(
                          'journey.protectStep',
                          'If the sender asks for payments, registration fees, or app downloads next, stop immediately and ask local police or call 1930.',
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
