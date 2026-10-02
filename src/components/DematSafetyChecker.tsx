import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface DematInspectionResult {
  riskLevel: 'safe' | 'warning' | 'high_risk'
  title: string
  verdict: string
  keyObservations: string[]
  nsdlGuidance: string
  actionItems: string[]
  isOffMarket: boolean
  isEdisAuthorized: boolean
}

export function DematSafetyChecker() {
  const { t } = useTranslation()
  const [inputText, setInputText] = useState('')
  const [transferType, setTransferType] = useState<'unknown' | 'market' | 'off_market' | 'edis'>('unknown')
  const [result, setResult] = useState<DematInspectionResult | null>(null)

  const sampleCases = [
    {
      label: 'Pre-IPO Off-Market Scam',
      text: 'Transfer 50 shares of Tata Tech to client ID 1208160001234567 before 4 PM for guaranteed unlisted Pre-IPO allocation at 50% discount.',
      type: 'off_market' as const,
    },
    {
      label: 'Unauthorized e-DIS Request',
      text: 'Dear Investor, an e-DIS request has been initiated for 200 shares of Reliance Ind from your Demat account. Enter OTP 749201 to authorize transfer.',
      type: 'edis' as const,
    },
    {
      label: 'Official Exchange Trade Alert',
      text: 'Executed: BUY 10 INFOSYS @ 1450.00 through NSE on 02-Oct-2026. Trade settled via NSE Clearing Corporation (NSCCL). Demat credit in T+1.',
      type: 'market' as const,
    },
  ]

  const handleEvaluate = (textToAnalyze?: string, selectedType?: 'unknown' | 'market' | 'off_market' | 'edis') => {
    const text = (textToAnalyze !== undefined ? textToAnalyze : inputText).trim()
    const type = selectedType !== undefined ? selectedType : transferType

    if (!text) return

    const lower = text.toLowerCase()

    const hasOffMarketSigns =
      type === 'off_market' ||
      lower.includes('off-market') ||
      lower.includes('off market') ||
      lower.includes('transfer to client id') ||
      lower.includes('transfer to boid') ||
      lower.includes('pre-ipo') ||
      lower.includes('unlisted share') ||
      lower.includes('client id') ||
      lower.includes('boid') ||
      lower.includes('dp id')

    const hasEdisSigns =
      type === 'edis' ||
      lower.includes('edis') ||
      lower.includes('e-dis') ||
      lower.includes('delivery instruction') ||
      lower.includes('otp') ||
      lower.includes('authorize transfer')

    const hasGuaranteedReturn =
      lower.includes('guaranteed') ||
      lower.includes('discount') ||
      lower.includes('50%') ||
      lower.includes('assured') ||
      lower.includes('double')

    const hasClearingCorporation =
      lower.includes('clearing corporation') ||
      lower.includes('nsccl') ||
      lower.includes('iccl') ||
      lower.includes('t+1') ||
      lower.includes('nse') ||
      lower.includes('bse')

    if (hasOffMarketSigns && (hasGuaranteedReturn || lower.includes('transfer'))) {
      setResult({
        riskLevel: 'high_risk',
        title: 'High Risk: Suspected Off-Market Transfer / Pre-IPO Fraud',
        verdict:
          'Direct share transfers to an individual or third-party BOID/Client ID bypass stock exchanges and clearing corporations, leaving you with zero legal protection.',
        keyObservations: [
          'Off-market transfers do not settle through official clearing houses (NSCCL or ICCL).',
          'Promises of guaranteed pre-IPO shares at steep discounts via personal Demat transfers are a widespread fraud pattern.',
          'Once shares are debited via off-market instruction, the transaction cannot be reversed by NSDL or SEBI.',
        ],
        nsdlGuidance:
          'Official NSDL Warning: Never transfer securities to unverified individuals or entities claiming to provide pre-IPO, PMS, or guaranteed profits. Always trade exclusively through SEBI-registered brokers on exchange platforms.',
        actionItems: [
          'Do NOT share your e-DIS PIN or OTP with any caller, broker executive, or WhatsApp group admin.',
          'Verify your holdings directly on NSDL IDeAS (https://eservices.nsdl.com) or CDSL Easiest.',
          'If coerced or defrauded, immediately lock your Demat account via your DP (Depository Participant) and report to 1930.',
        ],
        isOffMarket: true,
        isEdisAuthorized: false,
      })
    } else if (hasEdisSigns) {
      setResult({
        riskLevel: 'warning',
        title: 'Action Required: Verify e-DIS / TPIN Authorization Purpose',
        verdict:
          'An e-DIS (electronic Delivery Instruction Slip) or CDSL TPIN request authorizes the debit of shares from your Demat account. Only authorize if you placed a sell order yourself.',
        keyObservations: [
          'e-DIS authorizes stock debits. If you did not execute a SELL order through your trading app, this may be an unauthorized attempt.',
          'Never enter OTPs or TPINs requested by third parties claiming to "fix" your account or "rebalance" your portfolio.',
        ],
        nsdlGuidance:
          'NSDL & CDSL mandate that OTPs are sent directly to the mobile number registered in your Demat account. Always read the script name and quantity in the SMS before entering OTP.',
        actionItems: [
          'Check the SMS details: Does the share name and quantity match a trade you personally executed today?',
          'If you did not initiate this sale, do NOT enter the OTP and immediately contact your broker compliance desk.',
          'Check NSDL Speed-e or CDSL Easiest to review active authorizations.',
        ],
        isOffMarket: false,
        isEdisAuthorized: true,
      })
    } else if (hasClearingCorporation) {
      setResult({
        riskLevel: 'safe',
        title: 'Standard Exchange Trade Settlement Noted',
        verdict:
          'Content appears consistent with a standard on-market exchange trade settled via an authorized Clearing Corporation (NSCCL/ICCL).',
        keyObservations: [
          'Trade mentions recognized exchange clearing corporations (NSCCL / ICCL).',
          'Follows standard T+1 settlement cycle under SEBI guidelines.',
          'Check your monthly Consolidated Account Statement (CAS) sent by NSDL/CDSL to confirm official credit.',
        ],
        nsdlGuidance:
          'Verify your official monthly CAS received from nsdl-cas@nsdl.co.in or cdslcas@cdslindia.com to maintain portfolio vigilance.',
        actionItems: [
          'Reconcile transaction details against your broker contract note.',
          'Keep your mobile number and email updated in your Demat profile to receive instant NSDL SMS alerts.',
        ],
        isOffMarket: false,
        isEdisAuthorized: false,
      })
    } else {
      setResult({
        riskLevel: 'warning',
        title: 'Review Demat Transaction Context',
        verdict:
          'Text contains general Demat-related terms. Ensure any share transfer or pledge is verified through official depository portals.',
        keyObservations: [
          'Always distinguish between on-market exchange trades and off-market transfers.',
          'Stockbrokers cannot execute off-market transfers without explicit client approval.',
        ],
        nsdlGuidance:
          'NSDL provides the SPEED-e and IDeAS portals for direct monitoring of all Demat transactions without reliance on broker statements.',
        actionItems: [
          'Login to NSDL e-Services at https://eservices.nsdl.com to view real-time account balances.',
          'Verify your Depository Participant (DP) registration on SEBI website before delegating power of attorney.',
        ],
        isOffMarket: false,
        isEdisAuthorized: false,
      })
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏛️</span>
            <h3 className="text-base font-bold text-slate-900">
              {t('demat.title', 'NSDL & Demat Account Protection Shield')}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-600 max-w-2xl">
            {t(
              'demat.subtitle',
              'Verify share transfers, e-DIS OTP alerts, off-market Pre-IPO promises, and Consolidated Account Statement (CAS) notifications against NSDL & SEBI investor protection mandates.',
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          <span>NSDL / CDSL Awareness Track</span>
        </div>
      </div>

      {/* Quick Test Samples */}
      <div className="mt-4">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
          {t('demat.testSamples', 'Test Common Demat Scenarios')}
        </label>
        <div className="grid gap-2 sm:grid-cols-3">
          {sampleCases.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText(sample.text)
                setTransferType(sample.type)
                handleEvaluate(sample.text, sample.type)
              }}
              className="text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
            >
              <span className="text-xs font-bold text-slate-900 block">{sample.label}</span>
              <span className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{sample.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="demat-text" className="text-xs font-bold text-slate-700 block mb-1">
            {t('demat.inputLabel', 'Paste SMS Alert, WhatsApp Demat Pitch, or CAS Excerpt')}
          </label>
          <textarea
            id="demat-text"
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g. 'Transfer 100 shares to BOID 1208... for unlisted placement' or paste an e-DIS OTP authorization message..."
            className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
          />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Transfer Type:</span>
            <select
              value={transferType}
              onChange={(e) =>
                setTransferType(e.target.value as 'unknown' | 'market' | 'off_market' | 'edis')
              }
              className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700"
            >
              <option value="unknown">Auto-Detect</option>
              <option value="off_market">Off-Market Transfer (Direct BOID)</option>
              <option value="edis">e-DIS / TPIN Authorization</option>
              <option value="market">Exchange On-Market Trade</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {inputText && (
              <button
                type="button"
                onClick={() => {
                  setInputText('')
                  setResult(null)
                }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              disabled={!inputText.trim()}
              onClick={() => handleEvaluate()}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-xs"
            >
              Analyze Demat Safety
            </button>
          </div>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="mt-5 pt-5 border-t border-slate-200 animate-fade-in space-y-4">
          <div
            className={`p-4 rounded-xl border ${
              result.riskLevel === 'high_risk'
                ? 'bg-red-50 border-red-200 text-red-950'
                : result.riskLevel === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">
                {result.riskLevel === 'high_risk' ? '🚨' : result.riskLevel === 'warning' ? '⚠️' : '✅'}
              </span>
              <div>
                <h4 className="text-sm font-extrabold">{result.title}</h4>
                <p className="mt-1 text-xs leading-relaxed font-medium">{result.verdict}</p>
              </div>
            </div>
          </div>

          {/* Observations & Guidance */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>🔍</span> Key Security Observations
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {result.keyObservations.map((obs, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-slate-400 font-bold">•</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/60">
              <h5 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>🏛️</span> NSDL Official Regulatory Standard
              </h5>
              <p className="text-xs text-blue-900 leading-relaxed font-medium">
                {result.nsdlGuidance}
              </p>
            </div>
          </div>

          {/* Action Items */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🛡️</span> Recommended Action Checklist
            </h5>
            <div className="grid gap-2 sm:grid-cols-3">
              {result.actionItems.map((action, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium">
                  <span className="font-bold text-slate-900 block mb-0.5">Step {idx + 1}</span>
                  {action}
                </div>
              ))}
            </div>
          </div>

          {/* NSDL Official Portals */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-600 font-medium">Official Depository Gateways:</span>
            <div className="flex items-center gap-3">
              <a
                href="https://eservices.nsdl.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-700 hover:text-emerald-900 underline"
              >
                NSDL e-Services (IDeAS & SPEED-e) ↗
              </a>
              <span className="text-slate-300">|</span>
              <a
                href="https://www.cdslindia.com/easiest/easiestapp/login.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-700 hover:text-emerald-900 underline"
              >
                CDSL Easiest ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
