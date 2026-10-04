import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

export const IncidentResponse: React.FC = () => {
  const { t } = useTranslation()
  const [incidentType, setIncidentType] = useState<
    'not_sent' | 'sent_money' | 'installed_app' | null
  >(null)

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 shadow-xs">
      <div>
        <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>🚨</span> {t('incident.title', 'Personalized Incident Response')}
        </h4>
        <p className="mt-1 text-xs text-slate-600">
          {t(
            'incident.description',
            'Select your exact situation below for immediate official response steps and reporting channels.',
          )}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {/* Branch 1: Not sent money */}
        <button
          type="button"
          onClick={() => setIncidentType('not_sent')}
          className={`rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            incidentType === 'not_sent'
              ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200'
              : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
          }`}
        >
          <div className="text-2xl">🛡️</div>
          <p className="mt-2 text-sm font-bold text-slate-900">
            {t('incident.notSent', "I haven't sent money")}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {t(
              'incident.notSentDescription',
              'I received the message or scheme offer but have not transferred any money.',
            )}
          </p>
        </button>

        {/* Branch 2: Sent money */}
        <button
          type="button"
          onClick={() => setIncidentType('sent_money')}
          className={`rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
            incidentType === 'sent_money'
              ? 'border-red-600 bg-red-50 ring-2 ring-red-200'
              : 'border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/50'
          }`}
        >
          <div className="text-2xl">💸</div>
          <p className="mt-2 text-sm font-bold text-slate-900">
            {t('incident.sentMoney', 'I already sent money')}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {t(
              'incident.sentMoneyDescription',
              'I have transferred funds via UPI, bank transfer, or crypto.',
            )}
          </p>
        </button>

        {/* Branch 3: Installed app / link */}
        <button
          type="button"
          onClick={() => setIncidentType('installed_app')}
          className={`rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-amber-500 ${
            incidentType === 'installed_app'
              ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-200'
              : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/50'
          }`}
        >
          <div className="text-2xl">📱</div>
          <p className="mt-2 text-sm font-bold text-slate-900">
            {t('incident.installedApp', 'I installed an app / opened link')}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {t(
              'incident.installedAppDescription',
              'I downloaded an APK file, installed an app, or entered details on a site.',
            )}
          </p>
        </button>
      </div>

      {/* Branch 1 Details */}
      {incidentType === 'not_sent' && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5 animate-fade-in">
          <h5 className="font-bold text-emerald-950 text-base flex items-center gap-2">
            <span>🛡️</span> {t('incident.notSentTitle', 'Stay Cautious & Verify')}
          </h5>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-emerald-900 font-medium">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>{t('incident.notSentStep1', 'Do not send money, OTPs, passwords, or banking credentials under any circumstances.')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>{t('incident.notSentStep2', 'Verify the entity on the official SEBI directory (sebi.gov.in) or RBI Sachet portal.')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>{t('incident.notSentStep3', 'Avoid installing apps or opening links until independently verified.')}</span>
            </li>
          </ul>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://www.sancharsaathi.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-900"
            >
              <span>{t('incident.reportChakshu', 'Report on Sanchar Saathi Chakshu')}</span>
              <span>↗</span>
            </a>
            <a
              href="https://scores.sebi.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-emerald-300 px-3.5 py-2 text-xs font-bold text-emerald-900 shadow-2xs hover:bg-emerald-100"
            >
              <span>{t('incident.scoresDirectory', 'SEBI SCORES Directory')}</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      )}

      {/* Branch 2 Details */}
      {incidentType === 'sent_money' && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5 animate-fade-in">
          <h5 className="font-bold text-red-950 text-base flex items-center gap-2">
            <span>🚨</span> {t('incident.sentMoneyTitle', 'Act Immediately to Block & Report')}
          </h5>
          <p className="mt-1 text-xs text-red-900 font-semibold">
            {t('incident.goldenHourNote', 'Note: Recovery cannot be guaranteed, but rapid reporting within 1-2 hours ("Golden Hour") increases the chance of freezing funds in destination bank accounts.')}
          </p>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-red-900 font-medium">
            <li className="flex items-start gap-2">
              <span>1.</span>
              <span>{t('incident.sentMoneyStep1', 'Contact your bank or payment provider immediately through its official channel.')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span>2.</span>
              <span>{t('incident.sentMoneyStep2', 'Preserve transaction details, chat logs, UPI IDs, and evidence.')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span>3.</span>
              <span>{t('incident.sentMoneyStep3', 'Report suspected cyber financial fraud through the official cybercrime reporting portal (Call 1930).')}</span>
            </li>
          </ul>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://cybercrime.gov.in/Webform/Accept.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-red-800"
            >
              <span>{t('incident.cybercrimePortal', 'Open Cyber Crime Portal (cybercrime.gov.in) →')}</span>
            </a>
          </div>
        </div>
      )}

      {/* Branch 3 Details */}
      {incidentType === 'installed_app' && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5 animate-fade-in">
          <h5 className="font-bold text-amber-950 text-base flex items-center gap-2">
            <span>📱</span> {t('incident.installedAppTitle', 'Device & Security Remediation Steps')}
          </h5>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-amber-900 font-medium">
            <li className="flex items-start gap-2">
              <span>1.</span>
              <span>{t('incident.installedAppStep1', 'Do not enter passwords, OTPs, or banking credentials into the app or website.')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span>2.</span>
              <span>{t('incident.installedAppStep2', 'Avoid granting additional permissions to untrusted apps.')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span>3.</span>
              <span>{t('incident.installedAppStep3', 'If sensitive information was entered, contact your bank/service provider immediately.')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span>4.</span>
              <span>{t('incident.installedAppStep4', 'Report financial loss or cybercrime to the official Cyber Crime Reporting Portal.')}</span>
            </li>
          </ul>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://cybercrime.gov.in/Webform/Accept.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-800 px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-amber-900"
            >
              <span>{t('incident.reportDeviceCompromise', 'Report Device Compromise to Cyber Crime →')}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
