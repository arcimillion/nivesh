import React from 'react'
import { useTranslation } from 'react-i18next'
import type { ClaimInvestigation as ClaimType } from '../api'

interface Props {
  claims: ClaimType[]
}

export const ClaimInvestigation: React.FC<Props> = ({ claims }) => {
  const { t } = useTranslation()

  if (!claims || claims.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 text-center">
        <p className="text-xs text-slate-500">
          {t(
            'claims.noClaims',
            'No distinct verifiable financial claims were isolated for itemized investigation.',
          )}
        </p>
      </div>
    )
  }

  const getVerdictBadge = (verdict: ClaimType['source_verdict']) => {
    switch (verdict) {
      case 'supports':
        return (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 border border-emerald-300">
            {t('claims.badgeSupported', '✓ Claim Supported')}
          </span>
        )
      case 'contradicts':
        return (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-900 border border-red-300">
            {t('claims.badgeContradicts', '✕ Contradicts Official Rules')}
          </span>
        )
      case 'does_not_establish':
        return (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300">
            {t('claims.badgeDoesNotProve', '⚠ Content Does Not Prove Claim')}
          </span>
        )
      case 'unverified':
      default:
        return (
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-800 border border-slate-300">
            {t('claims.badgeUnverified', '? Unverified / External Verification Needed')}
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <span>🔬</span> {t('claims.sectionTitle', 'Evidence-Grounded Claim Investigation')}
        </h4>
        <span className="text-xs font-semibold text-slate-500">
          {claims.length}{' '}
          {claims.length === 1
            ? t('claims.singular', 'Claim Analyzed')
            : t('claims.plural', 'Claims Analyzed')}
        </span>
      </div>

      <div className="grid gap-4">
        {claims.map((claim, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-slate-300"
          >
            {/* Header: Verdict & Claim # */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="text-xs font-extrabold uppercase text-slate-400">
                {t('claims.claimNumber', {
                  number: idx + 1,
                  defaultValue: `Claim #${idx + 1}`,
                })}
              </span>
              {getVerdictBadge(claim.source_verdict)}
            </div>

            {/* 1. Original Claim Excerpt */}
            <div className="mt-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {t('claims.step1', '1. Original Submitted Claim')}
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                “{claim.original_claim}”
              </p>
            </div>

            {/* 2. What Content Establishes */}
            <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {t('claims.step2', '2. What Submitted Content Establishes')}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-700 font-medium">
                  {claim.what_content_establishes}
                </p>
              </div>

              {/* 5. What Remains Unknown */}
              <div className="rounded-xl bg-amber-50/40 p-3 border border-amber-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                  {t('claims.step5', '5. What Remains Unknown')}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-amber-950 font-medium">
                  {claim.what_remains_unknown}
                </p>
              </div>
            </div>

            {/* 3 & 4. External Source Consulted */}
            {claim.external_source_consulted && (
              <div className="mt-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                  {t('claims.step3', '3. External Regulatory Source Consulted')}
                </p>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <a
                    href={claim.external_source_consulted.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <span>🏛️ {claim.external_source_consulted.title}</span>
                    <span>↗</span>
                  </a>
                  {claim.external_source_consulted.date_accessed && (
                    <span className="text-[10px] text-emerald-700 font-mono">
                      {t('claims.refDate', {
                        date: claim.external_source_consulted.date_accessed,
                        defaultValue: `Ref Date: ${claim.external_source_consulted.date_accessed}`,
                      })}
                    </span>
                  )}
                </div>
                {claim.external_source_consulted.relevant_excerpt && (
                  <p className="mt-2 text-xs italic text-emerald-950 bg-white/80 p-2 rounded border border-emerald-100">
                    "{claim.external_source_consulted.relevant_excerpt}"
                  </p>
                )}
              </div>
            )}

            {/* 6. Safe Verification Step */}
            <div className="mt-3.5 flex items-start gap-2.5 rounded-xl bg-slate-900 p-3 text-white">
              <span className="text-base">🛡️</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('claims.step6', '6. Recommended Verification Action')}
                </p>
                <p className="mt-0.5 text-xs font-medium leading-relaxed">
                  {claim.safe_verification_step}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
