import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnalysisResult } from '../api'
import {
  evaluateSafetyGate,
  type SafetyGateInput,
  type TransactionType,
  type RecipientType,
} from '../types/safetyGate.ts'

interface PreTransactionSafetyGateProps {
  analysis?: AnalysisResult | null
  onOpenEvidenceGraph?: () => void
  onOpenCasebook?: () => void
}

export function PreTransactionSafetyGate({
  analysis,
  onOpenEvidenceGraph,
  onOpenCasebook,
}: PreTransactionSafetyGateProps) {
  const { t } = useTranslation()

  // Form input state initialized from active analysis if available
  const [transactionType, setTransactionType] = useState<TransactionType>(() => {
    if (analysis?.extracted_text && /(off-market|boid|client id|pre-ipo)/i.test(analysis.extracted_text)) {
      return 'demat_transfer'
    }
    return 'upi_payment'
  })
  const [recipientType, setRecipientType] = useState<RecipientType>('unknown')
  const [recipientIdentifier, setRecipientIdentifier] = useState(() => analysis?.extracted_phones?.[0]?.raw || '')
  const [amountInvolved, setAmountInvolved] = useState<number | undefined>(undefined)

  const [hasPromisedReturns, setHasPromisedReturns] = useState(() =>
    Boolean(analysis?.findings?.some((f) => f.indicator === 'guaranteed_returns')),
  )
  const [hasUrgencyPressure, setHasUrgencyPressure] = useState(() =>
    Boolean(analysis?.findings?.some((f) => f.indicator === 'urgency_pressure')),
  )
  const [isApkInstallRequested, setIsApkInstallRequested] = useState(() =>
    Boolean(analysis?.findings?.some((f) => f.indicator === 'unofficial_app')),
  )
  const [isOtpOrPinRequested, setIsOtpOrPinRequested] = useState(() =>
    Boolean(
      analysis?.extracted_text && /(otp|tpin|password|secret pin)/i.test(analysis.extracted_text),
    ),
  )
  const [isOffMarketDematTransfer, setIsOffMarketDematTransfer] = useState(() =>
    Boolean(
      analysis?.extracted_text && /(off-market|boid|client id|pre-ipo)/i.test(analysis.extracted_text),
    ),
  )
  const [hasVerifiedOfficialRegistry, setHasVerifiedOfficialRegistry] = useState(false)
  const [discussedWithFamily, setDiscussedWithFamily] = useState(false)

  // Cooling-off state reuses existing localStorage key
  const [coolingEndTime, setCoolingEndTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('nivesh_cooling_timer')
      if (saved) {
        const time = Number(saved)
        if (time > Date.now()) return time
      }
    } catch {
      // ignore
    }
    return null
  })

  const gateInput: SafetyGateInput = {
    transactionType,
    recipientType,
    recipientIdentifier,
    amountInvolved,
    hasPromisedReturns,
    hasUrgencyPressure,
    isApkInstallRequested,
    isOtpOrPinRequested,
    isOffMarketDematTransfer,
    hasVerifiedOfficialRegistry,
    discussedWithFamily,
  }

  const assessment = evaluateSafetyGate(gateInput, analysis)

  const handleStartCoolingPause = (hours: 12 | 24 | 48) => {
    const end = Date.now() + hours * 60 * 60 * 1000
    setCoolingEndTime(end)
    try {
      localStorage.setItem('nivesh_cooling_timer', String(end))
    } catch {
      // ignore
    }
  }

  const handleResetCoolingPause = () => {
    setCoolingEndTime(null)
    try {
      localStorage.removeItem('nivesh_cooling_timer')
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-6">
      {/* Top Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛑</span>
            <h3 className="text-base font-bold text-slate-900">
              {t('safetyGate.title', 'Pre-Transaction Safety Gate')}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-600 max-w-2xl">
            {t(
              'safetyGate.subtitle',
              'A pre-commitment friction checkpoint. Verify critical safety invariants before transmitting funds, transferring shares, or authorizing advisory payments.',
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
            Friction & Decision Engine
          </span>
        </div>
      </div>

      {/* Guided Context Inputs */}
      <div className="grid gap-4 sm:grid-cols-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <label htmlFor="tx-type-select" className="text-xs font-bold text-slate-800 block mb-1">
            Proposed Transaction Nature
          </label>
          <select
            id="tx-type-select"
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value as TransactionType)}
            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800"
          >
            <option value="upi_payment">UPI Mobile Payment</option>
            <option value="bank_transfer">Bank NEFT / IMPS / RTGS Transfer</option>
            <option value="demat_transfer">Demat Securities / Share Transfer (e-DIS)</option>
            <option value="advisory_subscription">Advisory Subscription / Tip Fee</option>
            <option value="app_authorization">Trading Account / Trading API Authorization</option>
          </select>
        </div>

        <div>
          <label htmlFor="recipient-type-select" className="text-xs font-bold text-slate-800 block mb-1">
            Beneficiary Account Classification
          </label>
          <select
            id="recipient-type-select"
            value={recipientType}
            onChange={(e) => setRecipientType(e.target.value as RecipientType)}
            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800"
          >
            <option value="unknown">Uncertain / Not Disclosed</option>
            <option value="official_broker_account">Official SEBI-Registered Broker Client Bank Account</option>
            <option value="corporate_merchant_upi">Audited Corporate Merchant UPI Account</option>
            <option value="individual_personal_upi">Individual Personal UPI Handle (e.g. name@oksbi)</option>
            <option value="individual_savings_account">Private Individual Savings Bank Account</option>
          </select>
        </div>

        <div>
          <label htmlFor="recipient-id-input" className="text-xs font-bold text-slate-800 block mb-1">
            Recipient Identifier / Name (Optional)
          </label>
          <input
            id="recipient-id-input"
            type="text"
            value={recipientIdentifier}
            onChange={(e) => setRecipientIdentifier(e.target.value)}
            placeholder="e.g. UPI ID, account name, or phone number"
            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800"
          />
        </div>

        <div>
          <label htmlFor="amount-input" className="text-xs font-bold text-slate-800 block mb-1">
            Amount Involved (₹)
          </label>
          <input
            id="amount-input"
            type="number"
            value={amountInvolved ?? ''}
            onChange={(e) =>
              setAmountInvolved(e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="e.g. 25000"
            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-mono text-slate-800"
          />
        </div>
      </div>

      {/* Critical Verification Questions */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Pre-Commitment Safety Verification Questions
        </h4>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={isOtpOrPinRequested}
              onChange={(e) => setIsOtpOrPinRequested(e.target.checked)}
              className="mt-0.5 rounded text-red-600"
            />
            <span className="text-xs text-slate-800">
              <strong>Is anyone asking for an OTP, TPIN, or account password?</strong>
            </span>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={isApkInstallRequested}
              onChange={(e) => setIsApkInstallRequested(e.target.checked)}
              className="mt-0.5 rounded text-red-600"
            />
            <span className="text-xs text-slate-800">
              <strong>Were you instructed to download an APK or remote-access app?</strong>
            </span>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={isOffMarketDematTransfer}
              onChange={(e) => setIsOffMarketDematTransfer(e.target.checked)}
              className="mt-0.5 rounded text-red-600"
            />
            <span className="text-xs text-slate-800">
              <strong>Is this a direct off-market transfer to an individual Demat BOID?</strong>
            </span>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={hasPromisedReturns}
              onChange={(e) => setHasPromisedReturns(e.target.checked)}
              className="mt-0.5 rounded text-amber-600"
            />
            <span className="text-xs text-slate-800">
              <strong>Did the sender promise guaranteed, fixed, or zero-risk profits?</strong>
            </span>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={hasUrgencyPressure}
              onChange={(e) => setHasUrgencyPressure(e.target.checked)}
              className="mt-0.5 rounded text-amber-600"
            />
            <span className="text-xs text-slate-800">
              <strong>Are you being pressured with artificial deadlines (e.g. &lt; 30 mins)?</strong>
            </span>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={hasVerifiedOfficialRegistry}
              onChange={(e) => setHasVerifiedOfficialRegistry(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600"
            />
            <span className="text-xs text-slate-800">
              <strong>Did you independently verify their SEBI / NSDL license on sebi.gov.in?</strong>
            </span>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors sm:col-span-2">
            <input
              type="checkbox"
              checked={discussedWithFamily}
              onChange={(e) => setDiscussedWithFamily(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600"
            />
            <span className="text-xs text-slate-800">
              <strong>Have you discussed this transaction with at least one family member or mentor?</strong>
            </span>
          </label>
        </div>
      </div>

      {/* Decision Engine Output */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          assessment.state === 'stop_and_protect'
            ? 'bg-red-50 border-red-300 text-red-950'
            : assessment.state === 'pause_and_verify'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="text-3xl mt-0.5">
            {assessment.state === 'stop_and_protect'
              ? '🛑'
              : assessment.state === 'pause_and_verify'
                ? '⚠️'
                : '✅'}
          </span>
          <div className="flex-1">
            <h4 className="text-base font-extrabold">{assessment.title}</h4>
            <p className="mt-1 text-xs leading-relaxed font-medium">{assessment.summary}</p>

            {/* Triggered rules list */}
            {assessment.triggeredRules.length > 0 && (
              <div className="mt-3 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider block opacity-90">
                  Triggered Safety Rules ({assessment.triggeredRules.length}):
                </span>
                {assessment.triggeredRules.map((rule) => (
                  <div
                    key={rule.code}
                    className="p-2.5 rounded-lg bg-white/80 border border-slate-200 text-xs text-slate-900"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{rule.title}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          rule.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : rule.severity === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rule.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600">{rule.reason}</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      Action: {rule.recommendedAction}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Mandatory Cooling-Off Banner if recommended */}
            {assessment.coolingOffRecommended && (
              <div className="mt-4 p-3.5 rounded-xl bg-white border border-amber-300 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <span>⏱️</span> Mandatory Cooling-Off Friction Recommended
                  </span>
                  {coolingEndTime && (
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
                      Timer Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  Scammers rely on impulse and panic. Activate a cooling-off pause before transferring funds.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  {!coolingEndTime ? (
                    <button
                      type="button"
                      onClick={() => handleStartCoolingPause(assessment.suggestedCoolingHours)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
                    >
                      Start {assessment.suggestedCoolingHours}-Hour Cooling Pause
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetCoolingPause}
                      className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 underline"
                    >
                      Reset Active Pause
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Checklist */}
            <div className="mt-4 pt-3 border-t border-slate-200/60">
              <span className="text-[11px] font-bold uppercase tracking-wider block mb-1.5">
                Recommended Actions:
              </span>
              <ul className="space-y-1 text-xs text-slate-800">
                {assessment.actionChecklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Explicit Statutory Disclaimer */}
            <p className="mt-4 text-[11px] text-slate-500 italic border-t border-slate-200/50 pt-2">
              {assessment.disclaimer}
            </p>
          </div>
        </div>
      </div>

      {/* Cross-Feature Links */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500 font-medium">Explore Further:</span>
        <div className="flex items-center gap-2">
          {onOpenEvidenceGraph && (
            <button
              type="button"
              onClick={onOpenEvidenceGraph}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              🕸️ Review Evidence Graph
            </button>
          )}
          {onOpenCasebook && (
            <button
              type="button"
              onClick={onOpenCasebook}
              className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              📋 Open Incident Casebook
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
