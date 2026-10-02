import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface SimulationScenario {
  id: string
  title: string
  trackLabel: string
  context: string
  senderDisplay: string
  messageBody: string
  redFlags: {
    id: string
    phrase: string
    title: string
    regulatoryRule: string
    authority: 'SEBI' | 'NSDL' | 'TRAI' | 'RBI'
  }[]
  debriefSummary: string
}

const SCENARIOS: SimulationScenario[] = [
  {
    id: 'scen1',
    title: 'Scenario 1: The VIP FII Institutional Trading Desk',
    trackLabel: 'Track A: Digital Fraud Resilience',
    context: 'You are added to a WhatsApp group named "VIP Institutional Traders Circle" by an unknown phone number.',
    senderDisplay: '+91 98451 29810 (Personal Mobile)',
    messageBody:
      'Good morning members! Today our institutional desk has secured exclusive FII block deal access. We assure 15% guaranteed daily profits on capital. Minimum investment ₹10,000. Do not search on Playstore — install our VIP Trading APK from bit.ly/fii-vip-terminal to begin immediate trading.',
    redFlags: [
      {
        id: 'rf1',
        phrase: '+91 98451 29810 (Personal Mobile)',
        title: 'Personal 10-Digit Mobile Used for Commercial Advice',
        regulatoryRule:
          'TRAI TCCCPR Regulations mandate that all genuine financial institutions must communicate through registered 6-character alpha headers (e.g. VK-HDFCBK), never via personal 10-digit mobile SIMs.',
        authority: 'TRAI',
      },
      {
        id: 'rf2',
        phrase: '15% guaranteed daily profits',
        title: 'Guaranteed Daily Return Promise',
        regulatoryRule:
          'SEBI strictly prohibits any entity from guaranteeing returns in the securities market. Equity markets carry statutory market risk and no strategy can promise fixed daily returns.',
        authority: 'SEBI',
      },
      {
        id: 'rf3',
        phrase: 'install our VIP Trading APK',
        title: 'Side-Loaded Unofficial APK',
        regulatoryRule:
          'SEBI and Cybercrime police warn against downloading APK files from messaging links. These fake trading apps display manipulated fictional balances to extract money while blocking all withdrawals.',
        authority: 'SEBI',
      },
    ],
    debriefSummary:
      'Classic "Institutional Trading" lure combining unverified mobile senders, unlawful profit guarantees, and malicious sideloaded APK software.',
  },
  {
    id: 'scen2',
    title: 'Scenario 2: The Pre-IPO Off-Market Demat Trap',
    trackLabel: 'Track B: Depository (NSDL/CDSL) Awareness',
    context: 'You receive an urgent SMS proposing an allotment in an upcoming high-profile IPO at a steep discount.',
    senderDisplay: '+91 81092 77102',
    messageBody:
      'URGENT: Guaranteed allotment for Swiggy Pre-IPO shares available at 60% discount to retail quote. Transfer 50 shares of your existing Reliance stock to BOID 1208160009876543 via e-DIS today before 3 PM to claim guaranteed unlisted allocation.',
    redFlags: [
      {
        id: 'rf4',
        phrase: '60% discount to retail quote',
        title: 'Unrealistic Deep Discount on Unlisted Shares',
        regulatoryRule:
          'Pre-IPO shares cannot be arbitrarily discounted by 60%. Scammers use fictitious discounts to lure victims into parting with valuable liquid blue-chip shares.',
        authority: 'SEBI',
      },
      {
        id: 'rf5',
        phrase: 'Transfer 50 shares of your existing Reliance stock to BOID 1208160009876543',
        title: 'Off-Market Transfer to Private Demat Account',
        regulatoryRule:
          'NSDL & SEBI mandate that genuine stock market transactions settle through Exchange Clearing Corporations (NSCCL/ICCL). Direct off-market transfers to a stranger’s BOID cannot be reversed or insured.',
        authority: 'NSDL',
      },
      {
        id: 'rf6',
        phrase: 'before 3 PM to claim guaranteed unlisted allocation',
        title: 'Artificial Time Pressure & e-DIS Coercion',
        regulatoryRule:
          'Scammers create artificial deadlines so you authorize e-DIS OTPs without verifying the recipient Demat account details on NSDL IDeAS.',
        authority: 'NSDL',
      },
    ],
    debriefSummary:
      'Off-market share transfers bypass official exchange clearing. Once shares leave your Demat account via e-DIS to a third-party BOID, NSDL cannot reverse the transaction.',
  },
  {
    id: 'scen3',
    title: 'Scenario 3: The Fake SEBI Research Analyst Impersonator',
    trackLabel: 'Track E: Misinformation & Content Literacy',
    context: 'A profile on Telegram displays the SEBI national emblem and claims to be an authorized advisory firm.',
    senderDisplay: 'SEBI Approved Prime Advisory (@sebi_prime_ra)',
    messageBody:
      'We are SEBI Registered Research Analyst firm INH000099812. Deposit ₹25,000 advisory fee to UPI ID sharma.wealth@oksbi to receive our 100% loss-free intraday option calls. If any loss occurs, our firm guarantees 100% capital reimbursement.',
    redFlags: [
      {
        id: 'rf7',
        phrase: 'UPI ID sharma.wealth@oksbi',
        title: 'Fee Payment to Personal Individual UPI Handle',
        regulatoryRule:
          'SEBI registered Research Analysts and Investment Advisers are strictly prohibited from receiving client funds into personal individual bank accounts or personal UPI handles. Payments must go to formally audited corporate accounts.',
        authority: 'SEBI',
      },
      {
        id: 'rf8',
        phrase: '100% loss-free intraday option calls',
        title: 'Loss-Free / Capital Reimbursement Guarantee',
        regulatoryRule:
          'SEBI research analyst regulations prohibit promising loss-free trades or capital reimbursement schemes. Derivatives trading carries high statutory risk (over 90% of retail F&O traders make net losses).',
        authority: 'SEBI',
      },
      {
        id: 'rf9',
        phrase: 'SEBI Approved Prime Advisory (@sebi_prime_ra)',
        title: 'Impersonation of SEBI and Unauthorized Name Claims',
        regulatoryRule:
          'SEBI NEVER "approves", "recommends", or "rates" any advisory firm or tipster. Using the SEBI logo or claiming "SEBI endorsement" is a criminal offense under the SEBI Act.',
        authority: 'SEBI',
      },
    ],
    debriefSummary:
      'Fraudsters regularly impersonate SEBI and claim fake registration numbers. Genuine registered analysts never guarantee capital or collect money through personal UPI IDs.',
  },
]

export function SpotTheScamSimulation() {
  const { t } = useTranslation()
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0)
  const [discoveredRedFlags, setDiscoveredRedFlags] = useState<string[]>([])
  const [activeRedFlagDetail, setActiveRedFlagDetail] = useState<{
    title: string
    regulatoryRule: string
    authority: string
  } | null>(null)

  const scenario = SCENARIOS[activeScenarioIdx]

  const handleSpot = (rf: (typeof scenario.redFlags)[0]) => {
    if (!discoveredRedFlags.includes(rf.id)) {
      setDiscoveredRedFlags([...discoveredRedFlags, rf.id])
    }
    setActiveRedFlagDetail({
      title: rf.title,
      regulatoryRule: rf.regulatoryRule,
      authority: rf.authority,
    })
  }

  const allFoundForScenario = scenario.redFlags.every((rf) => discoveredRedFlags.includes(rf.id))
  const totalFoundCount = discoveredRedFlags.length
  const totalFlagsAcrossAll = SCENARIOS.reduce((acc, s) => acc + s.redFlags.length, 0)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h3 className="text-base font-bold text-slate-900">
              {t('sandbox.title', 'Spot-the-Scam Interactive Sandbox')}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-600 max-w-2xl">
            {t(
              'sandbox.subtitle',
              'Practice detecting subtle regulatory violations in real-world Bharat investor scenarios. Click on the suspicious text elements to uncover the underlying SEBI & NSDL rules.',
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Score: {totalFoundCount} / {totalFlagsAcrossAll} Red Flags
          </span>
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {SCENARIOS.map((sc, idx) => (
          <button
            key={sc.id}
            type="button"
            onClick={() => {
              setActiveScenarioIdx(idx)
              setActiveRedFlagDetail(null)
            }}
            className={`p-3 text-left rounded-xl border transition-colors ${
              activeScenarioIdx === idx
                ? 'bg-emerald-50/70 border-emerald-400 text-slate-900'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-800">
              {sc.trackLabel}
            </span>
            <span className="text-xs font-bold text-slate-900 mt-1 block">
              {sc.title.split(':')[0]}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
              {sc.title.split(':')[1]}
            </span>
          </button>
        ))}
      </div>

      {/* Simulation Screen */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Incoming Communication Simulation
          </span>
          <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
            From: {scenario.senderDisplay}
          </span>
        </div>

        <p className="text-xs text-slate-600 italic mb-4">
          Context: {scenario.context}
        </p>

        {/* Message Bubble with Interactive Clues */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-base">💬</span>
            <span className="text-xs font-bold text-slate-900">{scenario.senderDisplay}</span>
          </div>

          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
            {/* Split and render interactive text */}
            <p className="leading-loose">
              {scenario.messageBody}
            </p>
          </div>
        </div>

        {/* Discovery Buttons */}
        <div className="mt-4">
          <span className="text-xs font-bold text-slate-800 block mb-2">
            Click to Inspect Suspect Elements ({scenario.redFlags.filter(rf => discoveredRedFlags.includes(rf.id)).length} of {scenario.redFlags.length} spotted):
          </span>
          <div className="flex flex-wrap gap-2">
            {scenario.redFlags.map((rf) => {
              const isFound = discoveredRedFlags.includes(rf.id)
              return (
                <button
                  key={rf.id}
                  type="button"
                  onClick={() => handleSpot(rf)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    isFound
                      ? 'bg-amber-100 text-amber-950 border-amber-300 font-bold'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-500'
                  }`}
                >
                  <span>{isFound ? '🚩 ' : '🔍 Inspect: '}</span>
                  <span>"{rf.phrase}"</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Red Flag Explanation Card */}
        {activeRedFlagDetail && (
          <div className="mt-4 p-4 rounded-xl border border-amber-300 bg-amber-50 animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Regulatory Violation Revealed [{activeRedFlagDetail.authority}]
              </span>
            </div>
            <h5 className="text-sm font-extrabold text-amber-950">{activeRedFlagDetail.title}</h5>
            <p className="mt-1 text-xs text-amber-900 leading-relaxed font-medium">
              {activeRedFlagDetail.regulatoryRule}
            </p>
          </div>
        )}

        {/* Scenario Completion Banner */}
        {allFoundForScenario && (
          <div className="mt-4 p-4 rounded-xl border border-emerald-300 bg-emerald-50 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                <span>🏆</span> All Red Flags Spotted in this Scenario!
              </p>
              <p className="mt-0.5 text-xs text-emerald-900 font-medium">
                {scenario.debriefSummary}
              </p>
            </div>
            {activeScenarioIdx < SCENARIOS.length - 1 && (
              <button
                type="button"
                onClick={() => {
                  setActiveScenarioIdx(activeScenarioIdx + 1)
                  setActiveRedFlagDetail(null)
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors shadow-xs"
              >
                Next Scenario ➔
              </button>
            )}
          </div>
        )}
      </div>

      {/* Satark Investor Certification Badge if all spotted */}
      {totalFoundCount === totalFlagsAcrossAll && (
        <div className="p-5 rounded-2xl border border-emerald-400 bg-gradient-to-r from-emerald-50 via-teal-50 to-white text-center space-y-2 animate-fade-in shadow-xs">
          <span className="text-3xl">🛡️ 🎖️</span>
          <h4 className="text-base font-extrabold text-slate-900">
            SANGYAN Satark Investor Master Certification
          </h4>
          <p className="text-xs text-slate-700 max-w-xl mx-auto font-medium">
            Congratulations! You successfully identified all {totalFlagsAcrossAll} critical regulatory red flags across the Digital Fraud, NSDL Demat, and Content Literacy tracks.
          </p>
          <div className="pt-2">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
              Verified Public Good Standard • SEBI & NSDL Awareness Guidelines
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
