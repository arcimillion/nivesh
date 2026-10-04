export type OfficialSource = {
  id: string
  title: string
  description: string
  url: string
  relevantIndicators: string[]
}

export const officialSources: OfficialSource[] = [
  {
    id: 'sebi_fake_trading_apps',
    title: 'SEBI Investor — Fake Trading App Scams',
    description:
      'Official SEBI guidance on fake trading apps, unrealistic returns, unverified app links and suspicious payment requests.',
    url: 'https://investor.sebi.gov.in/pdf/Fake%20trading%20app%20scam%20Landscape.pdf',
    relevantIndicators: [
      'guaranteed_returns',
      'suspicious_link',
      'unofficial_app',
      'upfront_payment',
    ],
  },

  {
    id: 'sebi_scores',
    title: 'SEBI SCORES',
    description:
      'SEBI’s online grievance redressal platform for eligible securities-market complaints.',
    url: 'https://scores.sebi.gov.in/',
    relevantIndicators: [
      'other_warning_sign',
      'impersonation',
      'guaranteed_returns',
      'upfront_payment',
    ],
  },

  {
    id: 'cybercrime_1930',
    title: 'National Cyber Crime Reporting Portal',
    description:
      'Official portal for reporting cybercrime and online financial fraud. The national helpline is 1930.',
    url: 'https://cybercrime.gov.in/Webform/Accept.aspx',
    relevantIndicators: [
      'suspicious_link',
      'unofficial_app',
      'upfront_payment',
      'impersonation',
      'other_warning_sign',
    ],
  },

  {
    id: 'chakshu',
    title: 'Sanchar Saathi — Chakshu',
    description:
      'Government facility for reporting suspected fraudulent communications.',
    url: 'https://www.sancharsaathi.gov.in/',
    relevantIndicators: [
      'suspicious_link',
      'impersonation',
      'urgency_pressure',
      'other_warning_sign',
    ],
  },
  {
    id: 'rbi_kehta_hai',
    title: 'RBI Kehta Hai — Financial Credential & Card Phishing Alerts',
    description:
      'Official Reserve Bank of India consumer safety directives. Explicitly warns against sharing credit/debit card photos, CVV, OTP, or PIN under any pretext.',
    url: 'https://rbikehtahai.rbi.org.in/',
    relevantIndicators: [
      'other_warning_sign',
      'upfront_payment',
      'unofficial_app',
      'impersonation',
    ],
  },
]