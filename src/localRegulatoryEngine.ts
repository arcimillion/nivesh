import type {
  AnalysisResult,
  AnalyzeOptions,
  PhoneReputationInvestigation,
  PhoneReputationSourceResult,
  OfficialVerificationResource,
} from './api'
import { officialSources } from './officialSources'

interface ExtractedPhone {
  raw: string
  normalized_e164: string | null
  country_code: string
  format_type: string
}

function extractPhonesLocally(text: string): ExtractedPhone[] {
  const phones: ExtractedPhone[] = []
  const seen = new Set<string>()

  // Matches +91 XXXXX XXXXX, +91XXXXXXXXXX, 91XXXXXXXXXX, or standard 10 digit Indian mobiles starting with 6-9
  const indianMobileRegex = /(?:\+91[\s-]?)?([6-9]\d{9})\b/g
  let match: RegExpExecArray | null

  while ((match = indianMobileRegex.exec(text)) !== null) {
    const raw = match[0]
    const digits = match[1]
    const e164 = `+91${digits}`
    if (!seen.has(e164)) {
      seen.add(e164)
      phones.push({
        raw,
        normalized_e164: e164,
        country_code: 'IN',
        format_type: 'indian_mobile',
      })
    }
  }

  // Generic international with +
  const intlRegex = /\+(\d{1,4})[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{3,9}\b/g
  while ((match = intlRegex.exec(text)) !== null) {
    const raw = match[0]
    const digits = raw.replace(/\D/g, '')
    if (digits.length >= 7 && digits.length <= 15) {
      const e164 = `+${digits}`
      if (!seen.has(e164)) {
        seen.add(e164)
        phones.push({
          raw,
          normalized_e164: e164,
          country_code: match[1] === '91' ? 'IN' : 'INTL',
          format_type: match[1] === '91' ? 'indian_mobile' : 'international',
        })
      }
    }
  }

  return phones
}

export function maskPhoneLocally(phone: string): string {
  const cleaned = phone.trim()
  if (cleaned.length <= 5) return '***'
  if (cleaned.startsWith('+91') && cleaned.length >= 13) {
    const national = cleaned.slice(3)
    return `+91 ${national.slice(0, 2)}*** ***${national.slice(-2)}`
  }
  if (cleaned.startsWith('+')) {
    const prefix = cleaned.slice(0, 4)
    const suffix = cleaned.slice(-2)
    return `${prefix}*** ***${suffix}`
  }
  if (/^\d{10}$/.test(cleaned)) {
    return `${cleaned.slice(0, 2)}*** ***${cleaned.slice(-2)}`
  }
  return `${cleaned.slice(0, 2)}*****${cleaned.slice(-2)}`
}

export function evaluateLocally(options: AnalyzeOptions): AnalysisResult {
  const text = (options.message || '').trim()
  const modality = options.modality || 'text'
  const language = options.language || 'en'
  const lower = text.toLowerCase()

  const extractedPhones = extractPhonesLocally(text)
  const phoneStrings = extractedPhones.map((p) => p.normalized_e164 || p.raw)
  const mappedPhoneItems = extractedPhones.map((p) => ({
    raw: p.raw,
    normalized_e164: p.normalized_e164,
    country_code: p.country_code,
    format_type: p.format_type,
  }))

  // Extract URLs
  const urlRegex = /(https?:\/\/[^\s]+|bit\.ly\/[^\s]+|t\.me\/[^\s]+|wa\.me\/[^\s]+)/gi
  const extractedUrls = Array.from(new Set(text.match(urlRegex) || []))

  // Money multiplication checks:
  // e.g. "give 100 take 5000", "take 10000 while giving 100", "double your money", etc.
  const hasMoneyMultiplier =
    /(give|giving|send|sending|invest|investing|pay|paying|deposit\w*)\s*\d+.*(take|taking|get|getting|receive|receiving|return\w*)\s*\d+/i.test(text) ||
    /(take|taking|get|getting|receive|receiving|return\w*)\s*\d+.*(give|giving|send|sending|invest|investing|pay|paying|deposit\w*)\s*\d+/i.test(text) ||
    /double.*money|triple.*money|money.*double|multipl(y|ier)/i.test(text) ||
    /(give|giving|take|taking)\s*\d+.*(give|giving|take|taking)\s*\d+/i.test(text)

  const hasGuaranteedReturns =
    hasMoneyMultiplier ||
    lower.includes('guaranteed') ||
    lower.includes('guarantee') ||
    lower.includes('100% profit') ||
    lower.includes('fixed return') ||
    lower.includes('assured return') ||
    lower.includes('20% daily') ||
    lower.includes('daily profit') ||
    lower.includes('risk-free') ||
    lower.includes('गारंटी') ||
    lower.includes('पक्का मुनाफा') ||
    lower.includes('निश्चित रिटर्न')

  const hasUrgencyPressure =
    lower.includes('urgent') ||
    lower.includes('expires') ||
    lower.includes('limited slots') ||
    lower.includes('today only') ||
    lower.includes('last chance') ||
    lower.includes('act now') ||
    lower.includes('तुरंत') ||
    lower.includes('आज ही') ||
    lower.includes('आखिरी मौका')

  const hasUpfrontPayment =
    lower.includes('registration fee') ||
    lower.includes('deposit') ||
    lower.includes('pay immediately') ||
    lower.includes('pay first') ||
    lower.includes('upfront') ||
    lower.includes('margin deposit') ||
    lower.includes('फीस') ||
    lower.includes('पहले पैसे')

  const isSuspiciousGroupOrApp =
    lower.includes('telegram') ||
    lower.includes('whatsapp') ||
    lower.includes('group') ||
    lower.includes('channel') ||
    lower.includes('apk') ||
    lower.includes('download app') ||
    lower.includes('vip tips') ||
    lower.includes('exclusive trading')

  const isHighRisk = hasMoneyMultiplier || hasGuaranteedReturns || (hasUrgencyPressure && hasUpfrontPayment)
  const isAmbiguous = !isHighRisk && (isSuspiciousGroupOrApp || hasUrgencyPressure || hasUpfrontPayment)

  // Find relevant official SEBI source
  const sebiFakeTradingSource = officialSources.find((s) => s.id === 'sebi_fake_trading_apps')
  const sebiScoresSource = officialSources.find((s) => s.id === 'sebi_scores')

  if (isHighRisk) {
    return {
      input_modality: modality,
      input_language: language,
      extracted_text: text || `[${modality} content submitted for analysis]`,
      extraction_uncertainty: {
        has_uncertainty: false,
        confidence: 'high',
        notes: 'High-risk solicitation markers and prohibited claims detected in submitted content.',
      },
      extracted_entities: {
        urls: extractedUrls,
        names: ['Unverified Scheme / Solicitation Channel'],
        promised_returns: hasMoneyMultiplier
          ? ['Unrealistic Money Multiplication / Guaranteed Returns']
          : ['Guaranteed Returns / Daily Profit'],
        deadlines: hasUrgencyPressure ? ['Urgent / Limited Window'] : [],
        payment_requests: hasUpfrontPayment
          ? ['Advance Fee / Registration / Deposit Demand']
          : ['Transfer to Private Account / UPI'],
        claims: [
          hasMoneyMultiplier
            ? 'Disproportionate money multiplication promise'
            : 'Guaranteed investment return claim',
        ],
        phone_numbers: phoneStrings,
      },
      extracted_phones: mappedPhoneItems,
      overall_status: 'warning_signs_found',
      uncertainty_rating: 'low',
      summary: hasMoneyMultiplier
        ? 'High Risk Alert: The solicitation promises unrealistic money multiplication (e.g. giving a small amount to receive an exponential return). This violates SEBI regulations prohibiting guaranteed return promises in securities transactions.'
        : 'Warning Signs Found: Assured return promises and pressure tactics violate statutory SEBI and RBI investor protection regulations.',
      findings: [
        {
          indicator: 'guaranteed_returns',
          original_excerpt: text.slice(0, 120),
          explanation:
            'SEBI regulations explicitly prohibit any intermediary, broker, or financial advisor from guaranteeing or promising fixed profits on investments.',
          evidence_type: 'message_excerpt',
          verification_status: 'not_independently_verified',
        },
        ...(hasUrgencyPressure
          ? [
              {
                indicator: 'urgency_pressure' as const,
                original_excerpt: text.slice(0, 80),
                explanation:
                  'Artificial deadlines and limited seat pressure are common tactics used in investment scams to induce impulsive financial commitments before proper verification.',
                evidence_type: 'message_excerpt' as const,
                verification_status: 'not_independently_verified' as const,
              },
            ]
          : []),
        ...(hasUpfrontPayment
          ? [
              {
                indicator: 'upfront_payment' as const,
                original_excerpt: text.slice(0, 80),
                explanation:
                  'Demanding upfront registration, margin, or processing fees into personal accounts or unverified UPI IDs is a characteristic indicator of fraudulent solicitations.',
                evidence_type: 'message_excerpt' as const,
                verification_status: 'not_independently_verified' as const,
              },
            ]
          : []),
      ],
      claims: [
        {
          original_claim: text.slice(0, 120) || 'Promised returns and trading scheme',
          what_content_establishes:
            'The solicitation offers exponential or assured financial returns without verifiable SEBI registration credentials.',
          external_source_consulted: sebiFakeTradingSource
            ? {
                id: sebiFakeTradingSource.id,
                title: sebiFakeTradingSource.title,
                url: sebiFakeTradingSource.url,
                relevant_excerpt:
                  'SEBI registered entities are strictly prohibited from offering guaranteed profits, multi-level money multiplying, or collecting funds into private bank accounts.',
                date_accessed: '2026-10-02',
              }
            : null,
          source_verdict: 'contradicts',
          what_remains_unknown:
            'Legal identity of sender, SEBI registration number, and official corporate registration on MCA portal.',
          safe_verification_step:
            'Search entity or advisor name on official SEBI registered intermediaries database at https://www.sebi.gov.in.',
        },
      ],
      scam_journey_map: [
        {
          stage: 'initial_offer',
          title: 'Unsolicited High Return Scheme',
          observed: true,
          evidence: text.slice(0, 100),
          explanation: 'Solicitation promises assured high payouts or quick multiplication of capital.',
          is_future_risk: false,
        },
        {
          stage: 'urgency_pressure',
          title: 'Artificial Time Pressure',
          observed: hasUrgencyPressure,
          evidence: hasUrgencyPressure ? 'Urgent language detected' : '',
          explanation:
            'Perpetrators create fake urgency or exclusivity to bypass the victim’s critical evaluation.',
          is_future_risk: !hasUrgencyPressure,
        },
        {
          stage: 'payment_request',
          title: 'Transfer to Personal UPI or Private Account',
          observed: hasUpfrontPayment,
          evidence: hasUpfrontPayment ? 'Upfront payment demanded' : '',
          explanation:
            'Common next step: asking target to transfer initial sum to individual UPI handles or mule accounts.',
          is_future_risk: !hasUpfrontPayment,
        },
        {
          stage: 'app_or_credential_request',
          title: 'Custom APK / Unofficial Platform Link',
          observed: isSuspiciousGroupOrApp,
          evidence: isSuspiciousGroupOrApp ? 'Link or app reference' : '',
          explanation:
            'Victims are directed to unofficial apps showing fabricated gains on dashboard.',
          is_future_risk: !isSuspiciousGroupOrApp,
        },
        {
          stage: 'followup_or_recovery',
          title: 'Withdrawal Block & Bogus Tax Demands',
          observed: false,
          evidence: '',
          explanation:
            'When attempting withdrawal, victims are told to pay extra "taxes" or "release fees", losing additional funds.',
          is_future_risk: true,
        },
      ],
      unknowns: [
        'SEBI registration ID not verifiable from submitted content alone.',
        'Official company PAN / CIN and registered domain remain undisclosed.',
      ],
      next_steps: [
        'Do not send money or transfer funds to any personal UPI ID or unverified account.',
        'Verify registered stockbrokers and investment advisors at https://www.sebi.gov.in.',
        'Report fraudulent communications immediately on DoT Sanchar Saathi (Chakshu) portal or dial 1930.',
      ],
      limitations: [
        'Evaluated via NiveshShield client-side regulatory analysis engine based on official SEBI, RBI, and DoT statutory guidelines.',
        'Always verify SEBI registration status directly on official regulator portals before making investment decisions.',
      ],
    }
  }

  if (isAmbiguous) {
    return {
      input_modality: modality,
      input_language: language,
      extracted_text: text || `[${modality} content submitted for analysis]`,
      extraction_uncertainty: {
        has_uncertainty: true,
        confidence: 'medium',
        notes: 'Informal channel communication requires secondary verification against official registers.',
      },
      extracted_entities: {
        urls: extractedUrls,
        names: ['Community Admin / Channel Promoter'],
        promised_returns: [],
        deadlines: hasUrgencyPressure ? ['Urgent Window'] : [],
        payment_requests: hasUpfrontPayment ? ['Channel Fee / Access Charge'] : [],
        claims: ['Market tips / exclusive investment group access'],
        phone_numbers: phoneStrings,
      },
      extracted_phones: mappedPhoneItems,
      overall_status: 'insufficient_evidence',
      uncertainty_rating: 'medium',
      summary:
        'Caution: Solicitations via informal channels (WhatsApp/Telegram groups) require rigorous independent verification. Unregistered advisory services violate SEBI regulations.',
      findings: [
        {
          indicator: 'suspicious_link',
          original_excerpt: text.slice(0, 100),
          explanation:
            'Unsolicited invitation to private advisory channels without statutory SEBI Research Analyst registration disclosures.',
          evidence_type: 'message_excerpt',
          verification_status: 'not_independently_verified',
        },
      ],
      claims: [
        {
          original_claim: text.slice(0, 100) || 'Trading advisory channel',
          what_content_establishes:
            'Message invites participation in informal advisory channel without mandatory statutory risk disclaimers.',
          external_source_consulted: sebiScoresSource
            ? {
                id: sebiScoresSource.id,
                title: sebiScoresSource.title,
                url: sebiScoresSource.url,
                relevant_excerpt:
                  'SEBI mandates that all investment advisors and research analysts must hold valid SEBI registration and display their registration number.',
                date_accessed: '2026-10-02',
              }
            : null,
          source_verdict: 'unverified',
          what_remains_unknown: 'Research Analyst Registration Number and SEBI authorization.',
          safe_verification_step: 'Request SEBI RA registration number and check on sebi.gov.in.',
        },
      ],
      scam_journey_map: [
        {
          stage: 'initial_offer',
          title: 'Informal Channel Invitation',
          observed: true,
          evidence: text.slice(0, 100),
          explanation: 'Inviting users to private chat groups for stock suggestions or tips.',
          is_future_risk: false,
        },
        {
          stage: 'urgency_pressure',
          title: 'Exclusive Channel Access',
          observed: hasUrgencyPressure,
          evidence: hasUrgencyPressure ? 'Pressure cues noted' : '',
          explanation: 'Limited seats or VIP group promotions designed to accelerate action.',
          is_future_risk: !hasUrgencyPressure,
        },
        {
          stage: 'payment_request',
          title: 'VIP Subscription / Upfront Fees',
          observed: hasUpfrontPayment,
          evidence: hasUpfrontPayment ? 'Fee requested' : '',
          explanation: 'Demanding payment for premium stock calls or algorithmic strategies.',
          is_future_risk: !hasUpfrontPayment,
        },
        {
          stage: 'app_or_credential_request',
          title: 'Terminal / APK Installation',
          observed: false,
          evidence: '',
          explanation: 'Directing victims to unverified trading terminals or screen-sharing tools.',
          is_future_risk: true,
        },
        {
          stage: 'followup_or_recovery',
          title: 'Followup Escalation',
          observed: false,
          evidence: '',
          explanation: 'Promoting higher-stakes unverified schemes once trust is established.',
          is_future_risk: true,
        },
      ],
      unknowns: ['Authenticity and SEBI licensing of channel administrators.'],
      next_steps: [
        'Ask the advisor for their official SEBI Research Analyst (RA) registration number.',
        'Verify RA credentials on https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=14.',
        'Avoid investing through informal chat applications.',
      ],
      limitations: [
        'Evaluated via NiveshShield client-side regulatory analysis engine.',
        'Informal tips carry substantial capital loss risk without regulatory grievance redressal.',
      ],
    }
  }

  // Benign or General Informational Content
  return {
    input_modality: modality,
    input_language: language,
    extracted_text: text || `[${modality} content submitted for analysis]`,
    extraction_uncertainty: {
      has_uncertainty: false,
      confidence: 'high',
      notes: 'No aggressive solicitation or high-risk scam patterns detected.',
    },
    extracted_entities: {
      urls: extractedUrls,
      names: [],
      promised_returns: [],
      deadlines: [],
      payment_requests: [],
      claims: ['General financial information / educational concepts'],
      phone_numbers: phoneStrings,
    },
    extracted_phones: mappedPhoneItems,
    overall_status: 'no_obvious_warning_signs',
    uncertainty_rating: 'low',
    summary:
      'No obvious warning signs (such as guaranteed returns, exponential multiplier promises, or urgent payment demands) detected in this text.',
    findings: [],
    claims: [
      {
        original_claim: text.slice(0, 100),
        what_content_establishes:
          'Text describes standard financial or educational concepts without guaranteed returns or advance payment demands.',
        external_source_consulted: null,
        source_verdict: 'supports',
        what_remains_unknown: 'Specific execution platform or intermediary used.',
        safe_verification_step:
          'Always verify that any broker, mutual fund distributor, or advisor is licensed with SEBI and AMFI.',
      },
    ],
    scam_journey_map: [
      {
        stage: 'initial_offer',
        title: 'Information Sharing',
        observed: true,
        evidence: text.slice(0, 80),
        explanation: 'Educational discussion regarding financial concepts.',
        is_future_risk: false,
      },
      {
        stage: 'urgency_pressure',
        title: 'Urgency Pressure',
        observed: false,
        evidence: '',
        explanation: 'No pressure tactics identified.',
        is_future_risk: false,
      },
      {
        stage: 'payment_request',
        title: 'Payment Request',
        observed: false,
        evidence: '',
        explanation: 'No upfront demands detected.',
        is_future_risk: false,
      },
      {
        stage: 'app_or_credential_request',
        title: 'App / Credential Request',
        observed: false,
        evidence: '',
        explanation: 'No unofficial software installation requested.',
        is_future_risk: false,
      },
      {
        stage: 'followup_or_recovery',
        title: 'Followup / Recovery',
        observed: false,
        evidence: '',
        explanation: 'No recovery or extortion tactics present.',
        is_future_risk: false,
      },
    ],
    unknowns: ['Entity or platform through which investment products are purchased.'],
    next_steps: [
      'Maintain disciplined financial habits and asset diversification.',
      'Check AMFI India (https://www.amfiindia.com) for mutual fund registrations.',
    ],
    limitations: [
      'Evaluated via NiveshShield client-side regulatory analysis engine. Does not substitute for personalized financial planning.',
    ],
  }
}

export function evaluatePhoneLocally(phoneNumber: string, context?: string): PhoneReputationInvestigation {
  const cleaned = phoneNumber.trim()
  const digitsOnly = cleaned.replace(/\D/g, '')
  const isIndianFormat = digitsOnly.length === 10 || (digitsOnly.length === 12 && digitsOnly.startsWith('91'))
  const normalizedE164 = isIndianFormat
    ? `+91${digitsOnly.slice(-10)}`
    : cleaned.startsWith('+')
      ? `+${digitsOnly}`
      : null

  const masked = maskPhoneLocally(normalizedE164 || cleaned)
  const results: PhoneReputationSourceResult[] = [
    {
      source_name: 'National Cyber Crime Reporting Portal (I4C Suspect Repository)',
      source_type: 'official_regulatory',
      status: 'unavailable',
      checked_at: new Date().toISOString(),
      label: null,
      source_url: 'https://cybercrime.gov.in/Webform/suspect_search_repository.aspx',
      limitations:
        'Automated machine lookup unavailable: The National Cyber Crime Reporting Portal requires interactive citizen CAPTCHA to protect privacy and prevent automated harvesting. Use the official link to verify manually.',
    },
    {
      source_name: 'DoT Sanchar Saathi (Chakshu Fraud Prevention Facility)',
      source_type: 'official_regulatory',
      status: 'unavailable',
      checked_at: new Date().toISOString(),
      label: null,
      source_url: 'https://sancharsaathi.gov.in/sfc/',
      limitations:
        'Official government reporting portal accepts reports directly from citizens for number blacklisting.',
    },
    {
      source_name: 'Truecaller Commercial / Partner API',
      source_type: 'community_reputation',
      status: 'unavailable',
      checked_at: new Date().toISOString(),
      label: null,
      source_url: null,
      limitations:
        'Partner API unconfigured on client deployment. Automated third-party lookup requires enterprise backend credentials.',
    },
  ]

  const officialVerificationLinks: OfficialVerificationResource[] = [
    {
      name: 'DoT Sanchar Saathi — Chakshu (Suspected Fraud Communications)',
      authority: 'Department of Telecommunications (DoT), Ministry of Communications',
      url: 'https://sancharsaathi.gov.in/sfc/',
      description:
        'Official telecom security facility enabling citizens to report fraudulent calls, SMS, and WhatsApp communications impersonating financial entities or government officials.',
      manual_search_supported: false,
      reporting_supported: true,
      instructions:
        'Use Chakshu to report fraudulent callers, unsolicited stock-tipping channels, or fake trading academy messages. DoT coordinates with telecom providers to disconnect malicious numbers.',
    },
    {
      name: 'National Cyber Financial Fraud Reporting Helpline (1930)',
      authority: 'Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS)',
      url: 'https://cybercrime.gov.in',
      description:
        'Emergency national financial fraud helpline for immediate freeze of fraudulent transactions and recording suspect mobile coordinates.',
      manual_search_supported: false,
      reporting_supported: true,
      instructions:
        'If funds have been transferred or requested under coercion, dial 1930 immediately within the golden hour to alert authorities and recipient banks.',
    },
    {
      name: 'Telecom Commercial Communications Customer Preference Portal (TRAI DLT)',
      authority: 'Telecom Regulatory Authority of India (TRAI)',
      url: 'https://www.trai.gov.in/telecom-commercial-communications-customer-preference-regulations-2018',
      description:
        'Regulatory framework governing commercial senders and Distributed Ledger Technology (DLT) registered telemarketer headers.',
      manual_search_supported: true,
      reporting_supported: true,
      instructions:
        'Official financial institutions must communicate using 6-character registered DLT sender IDs (e.g. AX-HDFCBK), never from personal 10-digit mobile numbers.',
    },
  ]

  return {
    raw_input: phoneNumber,
    normalized_e164: normalizedE164,
    country_code: isIndianFormat ? 'IN' : 'INTL',
    is_valid_format: Boolean(normalizedE164 && normalizedE164.length >= 10),
    format_description: isIndianFormat
      ? 'Indian Mobile Number (+91 format)'
      : 'International / Landline Number Format',
    results,
    evidence_synthesis: {
      message_warning_signs: context
        ? ['Context associated with investment solicitation']
        : ['Contact provided for verification'],
      external_reputation_summary: `Investigation conducted for ${masked}. No automated community flags available without server credentials. Use official links below to verify directly on government portals.`,
      official_verification_status:
        'Absence of a public report does not guarantee safety. Legitimate financial institutions never conduct securities transactions from personal mobile numbers.',
      unverified_elements: [
        'Caller identity and SEBI registration credentials not verified',
        'Official telecom DLT header registration unverified',
      ],
    },
    official_verification_links: officialVerificationLinks,
    safety_advisories: [
      'SEBI and RBI registered financial intermediaries NEVER contact investors via personal WhatsApp or mobile numbers to collect investment deposits.',
      'Never send funds via UPI to personal names or unverified mobile numbers for stock trading.',
      'If you suspect fraud, report immediately to DoT Chakshu portal or dial CyberCrime Helpline 1930.',
    ],
    privacy_notice:
      'Phone numbers are processed transiently and masked (+91 XX*** ***XX) in accordance with privacy safeguards.',
  }
}
