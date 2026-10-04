import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnalysisResult } from '../api'

interface ComplaintDossierGeneratorProps {
  analysis?: AnalysisResult | null
  extractedText?: string
}

export function ComplaintDossierGenerator({ analysis, extractedText }: ComplaintDossierGeneratorProps) {
  const { t } = useTranslation()
  const [selectedTarget, setSelectedTarget] = useState<'cybercrime' | 'chakshu' | 'sebi_scores'>('cybercrime')
  const [suspectPhone, setSuspectPhone] = useState('')
  const [suspectUpi, setSuspectUpi] = useState('')
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [amountLost, setAmountLost] = useState('')
  const [copied, setCopied] = useState(false)

  // Pre-fill phone if available from analysis
  const phoneList =
    analysis?.extracted_phones?.map((p) => p.normalized_e164 || p.raw) ||
    analysis?.extracted_entities?.phone_numbers ||
    []
  const defaultPhone = suspectPhone || phoneList[0] || ''

  const evidenceText = analysis?.extracted_text || extractedText || ''

  const generateCybercrimeDossier = () => {
    return `=====================================================
NATIONAL CYBERCRIME REPORTING PORTAL (1930) EVIDENCE DOSSIER
Generated via NiveshShield 2.0 Investor Protection System
=====================================================

1. INCIDENT CLASSIFICATION:
- Category: Financial Cyber Fraud / Investment & Trading Scam
- Incident Date: ${incidentDate}
- Disputed Amount: ${amountLost ? `₹${amountLost}` : 'N/A (Attempted Fraud / Pre-Payment Prevention)'}

2. SUSPECT DETAILS IDENTIFIED:
- Suspect Contact/Caller: ${defaultPhone || 'Identified in chat transcript'}
- Suspect UPI / Account: ${suspectUpi || 'As mentioned in attached chat/screenshots'}
- Primary Channel: WhatsApp / Telegram / SMS

3. EVIDENCE SUMMARY:
${analysis?.summary || 'Suspect solicited unauthorized investments with assured return promises.'}

4. KEY RED FLAGS NOTED:
${
  analysis?.findings && analysis.findings.length > 0
    ? analysis.findings.map((f, i) => `${i + 1}. [${f.indicator}]: ${f.explanation}`).join('\n')
    : '- Assured profit guarantee violating SEBI securities regulations\n- Direct transfer demanded into private personal account'
}

5. VERBATIM COMMUNICATION EXCERPT:
"""
${evidenceText ? evidenceText.slice(0, 800) : 'Evidence transcripts attached in primary report.'}
"""

6. REQUESTED LAW ENFORCEMENT ACTION:
- Freeze beneficiary account/UPI under CFCFRMS protocol.
- Coordinate with Telecom Service Providers (TSP) to trace caller identity.
- Submit First Information Report (FIR) under relevant sections of BNS & IT Act 2000.
=====================================================`
  }

  const generateChakshuDossier = () => {
    return `=====================================================
SANCHAR SAATHI - CHAKSHU (DoT FRAUD REPORTING DOSSIER)
Department of Telecommunications, Government of India
=====================================================

1. COMMUNICATION DETAILS:
- Reported Mobile Number: ${defaultPhone || 'N/A'}
- Medium of Communication: SMS / WhatsApp / Phone Call
- Incident Date: ${incidentDate}

2. NATURE OF SUSPECTED FRAUD:
- Category: Impersonation of Financial Entity / Fake Stock Trading Tips
- Sub-category: Solicitation of funds via personal 10-digit mobile number in violation of TRAI TCCCPR standards.

3. CONTENT OF SUSPICIOUS MESSAGE:
"""
${evidenceText ? evidenceText.slice(0, 500) : 'Unsolicited investment scheme tip offering abnormal returns.'}
"""

4. REQUESTED ACTION:
- Initiate telecom verification of suspect number.
- Coordinate with TSPs for disconnection and IMEI barring of fraudulent handset.
=====================================================`
  }

  const generateSebiScoresDossier = () => {
    return `=====================================================
SEBI SCORES 2.0 GRIEVANCE / INVESTOR COMPLAINT DOSSIER
Securities and Exchange Board of India (SEBI)
=====================================================

1. COMPLAINT TYPE:
- Unregistered Investment Adviser / Fake Trading Platform / Impersonation

2. NATURE OF GRIEVANCE:
- Unsolicited stock recommendations promising guaranteed returns.
- Violation of SEBI (Prohibition of Fraudulent and Unfair Trade Practices) Regulations.
- Entity operating without valid SEBI registration (RA / IA / Broker).

3. REPORTED DETAILS:
- Contact Phone / Channel: ${defaultPhone || 'Unregistered messaging group'}
- Alleged Entity Name: ${analysis?.extracted_entities?.names?.join(', ') || 'VIP Trading Desk'}
- Date of Solicitation: ${incidentDate}

4. REGULATORY VIOLATIONS OBSERVED:
- Violation of SEBI Circular SEBI/HO/MIRSD/MIRSD-PoD-1/P/CIR/2023/24 (Prohibition of assured returns in securities).
- Collection of funds in individual savings bank accounts instead of broker client bank accounts.

5. VERBATIM SOLICITATION TRANSCRIPT:
"""
${evidenceText ? evidenceText.slice(0, 600) : 'Transcript of unauthorized financial solicitation.'}
"""
=====================================================`
  }

  const activeDossier =
    selectedTarget === 'cybercrime'
      ? generateCybercrimeDossier()
      : selectedTarget === 'chakshu'
        ? generateChakshuDossier()
        : generateSebiScoresDossier()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeDossier)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    const file = new Blob([activeDossier], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `NiveshShield_Incident_Dossier_${selectedTarget}_${incidentDate}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h3 className="text-base font-bold text-slate-900">
              {t('dossier.title', '1-Click Official Complaint Dossier Generator')}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-600 max-w-2xl">
            {t(
              'dossier.subtitle',
              'Auto-compiles verified evidence into pre-formatted submission dossiers for the National Cybercrime Portal (1930), DoT Sanchar Saathi (Chakshu), and SEBI SCORES 2.0.',
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          <span>Golden Hour Action Track</span>
        </div>
      </div>

      {/* Target Selector */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setSelectedTarget('cybercrime')}
          className={`py-2 px-3 text-xs font-bold rounded-lg transition-colors ${
            selectedTarget === 'cybercrime'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          National Cybercrime (1930)
        </button>

        <button
          type="button"
          onClick={() => setSelectedTarget('chakshu')}
          className={`py-2 px-3 text-xs font-bold rounded-lg transition-colors ${
            selectedTarget === 'chakshu'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          DoT Chakshu (Telecom)
        </button>

        <button
          type="button"
          onClick={() => setSelectedTarget('sebi_scores')}
          className={`py-2 px-3 text-xs font-bold rounded-lg transition-colors ${
            selectedTarget === 'sebi_scores'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          SEBI SCORES 2.0
        </button>
      </div>

      {/* Optional Metadata Inputs */}
      <div className="grid gap-3 sm:grid-cols-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        <div>
          <label htmlFor="suspect-phone" className="text-[11px] font-bold text-slate-700 block mb-1">
            Suspect Contact / Number
          </label>
          <input
            id="suspect-phone"
            type="text"
            value={suspectPhone || defaultPhone}
            onChange={(e) => setSuspectPhone(e.target.value)}
            placeholder="e.g. +91 9876543210"
            className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono text-slate-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="suspect-upi" className="text-[11px] font-bold text-slate-700 block mb-1">
            Suspect UPI / Bank Account
          </label>
          <input
            id="suspect-upi"
            type="text"
            value={suspectUpi}
            onChange={(e) => setSuspectUpi(e.target.value)}
            placeholder="e.g. suspect@okhdfcbank"
            className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="incident-date" className="text-[11px] font-bold text-slate-700 block mb-1">
            Incident Date
          </label>
          <input
            id="incident-date"
            type="date"
            value={incidentDate}
            onChange={(e) => setIncidentDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="amount-lost" className="text-[11px] font-bold text-slate-700 block mb-1">
            Amount Lost / Demanded (₹)
          </label>
          <input
            id="amount-lost"
            type="number"
            value={amountLost}
            onChange={(e) => setAmountLost(e.target.value)}
            placeholder="e.g. 50000"
            className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 bg-white"
          />
        </div>
      </div>

      {/* Generated Dossier Preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Ready-to-Paste Formatted Dossier
          </span>
          <span className="text-[11px] text-slate-500">
            {selectedTarget === 'cybercrime'
              ? 'Portal: cybercrime.gov.in (Helpline: 1930)'
              : selectedTarget === 'chakshu'
                ? 'Portal: sancharsaathi.gov.in/sfc'
                : 'Portal: scores.sebi.gov.in'}
          </span>
        </div>

        <pre className="max-h-60 overflow-y-auto font-mono text-xs text-slate-800 bg-slate-900 text-slate-100 p-4 rounded-xl leading-relaxed whitespace-pre-wrap select-all">
          {activeDossier}
        </pre>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-medium">Official Portal Link:</span>
          {selectedTarget === 'cybercrime' && (
            <a
              href="https://cybercrime.gov.in/Webform/Accept.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
            >
              cybercrime.gov.in (Direct Reporting) ↗
            </a>
          )}
          {selectedTarget === 'chakshu' && (
            <a
              href="https://sancharsaathi.gov.in/sfc/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
            >
              sancharsaathi.gov.in/sfc ↗
            </a>
          )}
          {selectedTarget === 'sebi_scores' && (
            <a
              href="https://scores.sebi.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
            >
              scores.sebi.gov.in ↗
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Download Dossier (.txt)
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
          >
            {copied ? '✓ Copied to Clipboard' : 'Copy Full Dossier'}
          </button>
        </div>
      </div>
    </div>
  )
}
