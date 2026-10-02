/**
 * Curated Official Investor-Protection Knowledge Base (India)
 * Used by NiveshShield 2.0 for evidence-grounded claim matching and verification.
 */

const OFFICIAL_KNOWLEDGE_BASE = [
  {
    id: 'sebi_fake_trading_apps',
    title: 'SEBI Investor Alert — Fake Trading Apps & Unsolicited Stock Tips',
    issuing_authority: 'Securities and Exchange Board of India (SEBI)',
    description: 'SEBI warning on fraudsters posing as registered stockbrokers offering guaranteed profits, fake trading apps, and exclusive institutional accounts via WhatsApp/Telegram.',
    url: 'https://investor.sebi.gov.in/pdf/Fake%20trading%20app%20scam%20Landscape.pdf',
    relevant_indicators: ['guaranteed_returns', 'suspicious_link', 'unofficial_app', 'upfront_payment', 'impersonation'],
    verification_guidance: 'Verify registered stockbrokers at https://www.sebi.gov.in. SEBI registered entities never collect funds into personal UPI IDs or private bank accounts.',
    last_updated: '2025-01-15'
  },
  {
    id: 'sebi_scores',
    title: 'SEBI SCORES 2.0 — Grievance Redressal System',
    issuing_authority: 'Securities and Exchange Board of India (SEBI)',
    description: 'Official portal to file complaints against SEBI-registered entities, brokers, listed companies, and mutual funds.',
    url: 'https://scores.sebi.gov.in/',
    relevant_indicators: ['other_warning_sign', 'impersonation', 'guaranteed_returns', 'upfront_payment'],
    verification_guidance: 'Check if an entity is registered before investing. Complaints against unregistered entities should be reported to Cyber Crime.',
    last_updated: '2025-02-01'
  },
  {
    id: 'rbi_sachet',
    title: 'RBI Sachet — Portal for Illegal Money Collection & Unregistered Entities',
    issuing_authority: 'Reserve Bank of India (RBI)',
    description: 'Platform to report illegal deposit acceptance, unauthorized financial entities, and fake loan/investment schemes.',
    url: 'https://sachet.rbi.org.in/',
    relevant_indicators: ['guaranteed_returns', 'upfront_payment', 'impersonation', 'other_warning_sign'],
    verification_guidance: 'Check RBI list of authorized banks, NBFCs, and Alert List of unauthorized forex trading platforms.',
    last_updated: '2025-01-20'
  },
  {
    id: 'cybercrime_1930',
    title: 'National Cyber Crime Reporting Portal & Helpline 1930',
    issuing_authority: 'Ministry of Home Affairs (MHA), Govt. of India',
    description: 'Official national portal for reporting cyber financial fraud immediately to freeze fraudulent money transfers.',
    url: 'https://www.cybercrime.gov.in/',
    relevant_indicators: ['suspicious_link', 'unofficial_app', 'upfront_payment', 'impersonation', 'urgency_pressure'],
    verification_guidance: 'Call helpline 1930 within the golden hour if money has been transferred to suspect UPI/bank accounts.',
    last_updated: '2025-02-10'
  },
  {
    id: 'sanchar_saathi_chakshu',
    title: 'Sanchar Saathi — Chakshu (Suspected Fraudulent Communication)',
    issuing_authority: 'Department of Telecommunications (DoT), Govt. of India',
    description: 'Government facility for citizens to report suspected fraudulent calls, SMS, or WhatsApp communications.',
    url: 'https://www.sancharsaathi.gov.in/',
    relevant_indicators: ['suspicious_link', 'impersonation', 'urgency_pressure', 'other_warning_sign'],
    verification_guidance: 'Report suspicious sender numbers or URLs before taking any financial action.',
    last_updated: '2025-01-10'
  },
  {
    id: 'nse_bse_alerts',
    title: 'NSE & BSE Investor Advisory on Unsolicited SMS & Guaranteed Schemes',
    issuing_authority: 'National Stock Exchange (NSE) & BSE India',
    description: 'Advisories cautioning investors against schemes promising assured/guaranteed returns in stock market trading.',
    url: 'https://www.nseindia.com/invest/investor-advisories',
    relevant_indicators: ['guaranteed_returns', 'urgency_pressure', 'impersonation'],
    verification_guidance: 'Never trade based on unverified tips received via SMS, WhatsApp, Telegram, or social media.',
    last_updated: '2025-01-05'
  }
]

module.exports = {
  OFFICIAL_KNOWLEDGE_BASE,
}
