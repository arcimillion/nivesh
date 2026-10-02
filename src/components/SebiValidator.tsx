import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface SebiValidationResult {
  isValidFormat: boolean
  prefix: string
  categoryName: string
  description: string
  officialSearchUrl: string
  mandateWarnings: string[]
  statutoryReminders: string[]
}

const SEBI_PREFIX_MAP: Record<string, { name: string; desc: string; intmId: string }> = {
  INH: {
    name: 'Research Analyst (RA)',
    desc: 'Authorized solely to publish objective research reports on securities. STRICTLY PROHIBITED from managing funds, executing trades on behalf of clients, or assuring profits.',
    intmId: '14',
  },
  INA: {
    name: 'Investment Adviser (IA)',
    desc: 'Authorized to provide customized financial planning and advice after formal risk profiling and written agreement. PROHIBITED from receiving commissions from product distribution.',
    intmId: '13',
  },
  INZ: {
    name: 'Stock Broker / Clearing Member',
    desc: 'Registered to execute trades on stock exchanges (NSE/BSE). Client funds must only be routed through authorized clearing banks, never personal accounts.',
    intmId: '1',
  },
  INP: {
    name: 'Portfolio Manager (PMS)',
    desc: 'Regulated portfolio management service. SEBI mandates a statutory minimum client investment threshold of ₹50 Lakhs.',
    intmId: '9',
  },
  INM: {
    name: 'Merchant Banker',
    desc: 'Regulated intermediary managing public issues, IPO underwriting, and capital market offerings.',
    intmId: '4',
  },
  INF: {
    name: 'Mutual Fund',
    desc: 'SEBI-registered pooled investment vehicle operated by Asset Management Companies (AMCs).',
    intmId: '10',
  },
}

export function SebiValidator() {
  const { t } = useTranslation()
  const [regNumber, setRegNumber] = useState('')
  const [entityName, setEntityName] = useState('')
  const [promisedReturnsChecked, setPromisedReturnsChecked] = useState(false)
  const [personalAccountChecked, setPersonalAccountChecked] = useState(false)
  const [unmonitoredAppChecked, setUnmonitoredAppChecked] = useState(false)
  const [result, setResult] = useState<SebiValidationResult | null>(null)

  const quickExamples = [
    { label: 'Sample RA License', num: 'INH000008921', name: 'Alpha Research Desk' },
    { label: 'Sample IA License', num: 'INA000014520', name: 'Lakshya Financial Advisory' },
    { label: 'Fake/Malformed License', num: 'SEBI-PRO-9981', name: 'VIP Super Wealth' },
  ]

  const handleValidate = (numToTest?: string) => {
    const raw = (numToTest !== undefined ? numToTest : regNumber).trim().toUpperCase()
    if (!raw) return

    const match = raw.match(/^(IN[A-Z])(\d{9}|\d{8})$/)

    const mandateWarnings: string[] = []
    if (promisedReturnsChecked) {
      mandateWarnings.push(
        'CRITICAL VIOLATION: SEBI Regulations strictly prohibit ANY registered intermediary (including Research Analysts and Investment Advisers) from guaranteeing fixed returns or assured profits in securities trading.',
      )
    }
    if (personalAccountChecked) {
      mandateWarnings.push(
        'FRAUD WARNING: Official intermediaries never collect investment capital or trading funds into personal individual savings or UPI accounts. Fee payments must be formally invoiced into official entity accounts.',
      )
    }
    if (unmonitoredAppChecked) {
      mandateWarnings.push(
        'UNAUTHORIZED CHANNEL: SEBI advisory rules require formal risk profiling and KYC documentation before providing financial advice, which cannot be satisfied via anonymous Telegram or WhatsApp groups.',
      )
    }

    if (match) {
      const prefix = match[1]
      const info = SEBI_PREFIX_MAP[prefix] || {
        name: `SEBI Intermediary (${prefix})`,
        desc: 'SEBI registered entity category.',
        intmId: '1',
      }

      setResult({
        isValidFormat: true,
        prefix,
        categoryName: info.name,
        description: info.desc,
        officialSearchUrl: `https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=${info.intmId}`,
        mandateWarnings,
        statutoryReminders: [
          `Valid format standard matched: ${raw}. Note that fraudsters often steal genuine SEBI registration numbers of legitimate firms. Always verify the registered corporate email domain and phone on sebi.gov.in.`,
          'SEBI maintains a public list of Debarred Entities & Individuals prohibited from accessing capital markets.',
        ],
      })
    } else {
      setResult({
        isValidFormat: false,
        prefix: 'UNKNOWN',
        categoryName: 'Invalid Registration Format',
        description:
          'SEBI registration numbers for capital market intermediaries strictly begin with standard 3-letter codes like INH (Research Analyst), INA (Investment Adviser), or INZ (Stock Broker), followed by 8–9 digits.',
        officialSearchUrl: 'https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13',
        mandateWarnings: [
          'The provided identifier does not conform to official SEBI registration naming conventions. Fraudulent operators frequently invent fake certificate numbers like "SEBI/2026/VIP" or "GOV-SEBI-REG".',
          ...mandateWarnings,
        ],
        statutoryReminders: [
          'Never invest through unregistered entities. Claims of being "exempt from SEBI regulations" or "operating offshore" are hallmark warning signs of unregulated investment schemes.',
        ],
      })
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h3 className="text-base font-bold text-slate-900">
              {t('sebiValidator.title', 'SEBI Intermediary License & Mandate Quick-Validator')}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-600 max-w-2xl">
            {t(
              'sebiValidator.subtitle',
              'Check whether claimed advisory or broker licenses match official SEBI formats (INA, INH, INZ) and cross-examine whether their actions violate statutory regulatory mandates.',
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          <span>SEBI Regulatory Standard</span>
        </div>
      </div>

      {/* Quick Example Buttons */}
      <div className="mt-4">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
          {t('sebiValidator.quickExamples', 'Try Sample License Formats')}
        </label>
        <div className="flex flex-wrap gap-2">
          {quickExamples.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setRegNumber(ex.num)
                setEntityName(ex.name)
                handleValidate(ex.num)
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono font-medium hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
            >
              <span className="font-bold text-slate-900">{ex.num}</span> ({ex.label})
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sebi-reg" className="text-xs font-bold text-slate-700 block mb-1">
            SEBI Registration Number
          </label>
          <input
            id="sebi-reg"
            type="text"
            value={regNumber}
            onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
            placeholder="e.g. INH000008921 or INA000014520"
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none uppercase"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Standard: INH (Research Analyst), INA (Investment Adviser), INZ (Stock Broker)
          </p>
        </div>

        <div>
          <label htmlFor="entity-name" className="text-xs font-bold text-slate-700 block mb-1">
            Entity or Advisor Name (Optional)
          </label>
          <input
            id="entity-name"
            type="text"
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            placeholder="e.g. Wealth Growth Advisory Ltd"
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
          />
        </div>
      </div>

      {/* Mandate Cross-Examination Checkboxes */}
      <div className="mt-4 p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
          Mandate Red-Flag Cross Check (Did the sender do any of the following?)
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
          <input
            type="checkbox"
            checked={promisedReturnsChecked}
            onChange={(e) => setPromisedReturnsChecked(e.target.checked)}
            className="mt-0.5 rounded text-emerald-600"
          />
          <span>
            <strong>Promised fixed or assured profits</strong> (e.g. "10% weekly profit guarantee" or "loss-free trading")
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
          <input
            type="checkbox"
            checked={personalAccountChecked}
            onChange={(e) => setPersonalAccountChecked(e.target.checked)}
            className="mt-0.5 rounded text-emerald-600"
          />
          <span>
            <strong>Requested funds to be transferred into a private savings or UPI account</strong> (rather than official broker trading account)
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
          <input
            type="checkbox"
            checked={unmonitoredAppChecked}
            onChange={(e) => setUnmonitoredAppChecked(e.target.checked)}
            className="mt-0.5 rounded text-emerald-600"
          />
          <span>
            <strong>Delivering tips via informal Telegram / WhatsApp group</strong> without client KYC or signed service agreement
          </span>
        </label>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={!regNumber.trim()}
          onClick={() => handleValidate()}
          className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-xs"
        >
          Validate License & Mandate
        </button>
      </div>

      {/* Result Display */}
      {result && (
        <div className="mt-5 pt-5 border-t border-slate-200 animate-fade-in space-y-4">
          <div
            className={`p-4 rounded-xl border ${
              result.isValidFormat && result.mandateWarnings.length === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{result.isValidFormat ? '🏛️' : '⚠️'}</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-extrabold">{result.categoryName}</h4>
                  <span className="font-mono text-xs font-bold bg-white/80 px-2 py-0.5 rounded border border-slate-300">
                    {regNumber}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed font-medium">{result.description}</p>
              </div>
            </div>
          </div>

          {/* Mandate Warnings if any */}
          {result.mandateWarnings.length > 0 && (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-950 space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-red-900">
                <span>🚨</span> Mandate Violations Identified
              </h5>
              <ul className="space-y-1.5 text-xs">
                {result.mandateWarnings.map((warn, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Statutory Verification Deep Link */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900">Verify Directly on Official SEBI Database</p>
              <p className="text-[11px] text-slate-600">
                Confirm whether registration is active and compare the registered contact email with the person contacting you.
              </p>
            </div>
            <a
              href={result.officialSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
            >
              Search SEBI Directory ↗
            </a>
          </div>

          {/* Statutory Reminders */}
          <div className="text-[11px] text-slate-500 space-y-1">
            {result.statutoryReminders.map((rem, i) => (
              <p key={i}>• {rem}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
