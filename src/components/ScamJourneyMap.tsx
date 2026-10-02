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
  initial_offer: '1. Unsolicited / Attractive Offer',
  urgency_pressure: '2. Artificial Urgency & Pressure',
  payment_request: '3. Upfront Fee or Payment Request',
  app_or_credential_request: '4. App / APK Installation or Credential Ask',
  followup_or_recovery: '5. Follow-up Payment or Recovery Scam',
}

export const ScamJourneyMap: React.FC<Props> = ({ stages }) => {
  const { t } = useTranslation()
  const [expandedStage, setExpandedStage] = useState<string | null>(null)

  if (!stages || stages.length === 0) {
    return null
  }

  const observedCount = stages.filter((s) => s.observed).length

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4 mb-5">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span>🗺️</span> {t('journey.title', 'Scam Journey Tactic Map')}
          </h4>
          <p className="mt-0.5 text-xs text-slate-500">
            {t(
              'journey.subtitle',
              'Sequenced tactic analysis. Observed stages are backed by direct evidence; unobserved stages indicate possible future escalation risks.',
            )}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-200">
            {t('journey.observedBadge', {
              count: observedCount,
              defaultValue: `${observedCount} Observed in Content`,
            })}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
            {t('journey.futureBadge', {
              count: stages.length - observedCount,
              defaultValue: `${stages.length - observedCount} Future Escalation Risks`,
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
              className={`rounded-xl border transition ${
                stg.observed
                  ? 'border-amber-300 bg-amber-50/50 shadow-2xs'
                  : 'border-slate-200 bg-slate-50/40 opacity-90'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedStage(isExpanded ? null : stg.stage)}
                className="w-full flex items-center justify-between p-4 text-left focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold shadow-2xs ${
                      stg.observed
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">
                        {defaultTitle}
                      </span>
                      {stg.observed ? (
                        <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-950 uppercase tracking-wide">
                          {t('journey.observedTactic', '✓ Observed Tactic')}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                          {t('journey.futureTactic', 'Possible Future Tactic')}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">
                      {stg.observed
                        ? stg.evidence
                          ? `${t('journey.evidencePrefix', 'Evidence:')} "${stg.evidence}"`
                          : stg.explanation
                        : `${t('journey.nextRiskPrefix', 'Next risk:')} ${stg.explanation}`}
                    </p>
                  </div>
                </div>

                <div className="ml-2 text-slate-400 font-bold text-sm">
                  {isExpanded ? '▲' : '▼'}
                </div>
              </button>

              {/* Expandable Evidence & Details */}
              {isExpanded && (
                <div className="border-t border-slate-200/80 p-4 bg-white rounded-b-xl space-y-3 text-xs">
                  {stg.observed && stg.evidence && (
                    <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                      <p className="font-bold text-amber-900 uppercase text-[10px] tracking-wider">
                        {t('journey.observedEvidenceExcerpt', 'Observed Evidence Excerpt')}
                      </p>
                      <p className="mt-1 font-mono text-slate-900 font-semibold">
                        “{stg.evidence}”
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                      {t('journey.tacticExplanation', 'Analysis & Tactic Explanation')}
                    </p>
                    <p className="mt-1 leading-relaxed text-slate-700 font-medium">
                      {stg.explanation}
                    </p>
                  </div>

                  {!stg.observed && (
                    <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-slate-600">
                      <p className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>💡</span> {t('journey.howToProtect', 'How to Protect Yourself at This Stage:')}
                      </p>
                      <p className="mt-1 leading-relaxed">
                        {t(
                          'journey.protectStep',
                          'If the sender asks for payments, registration fees, or app downloads next, stop immediately and verify with SEBI/RBI.',
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
