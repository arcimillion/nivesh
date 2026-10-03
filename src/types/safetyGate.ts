import type { AnalysisResult } from '../api'

export type TransactionType =
  | 'upi_payment'
  | 'bank_transfer'
  | 'demat_transfer'
  | 'advisory_subscription'
  | 'app_authorization'

export type RecipientType =
  | 'official_broker_account'
  | 'corporate_merchant_upi'
  | 'individual_savings_account'
  | 'individual_personal_upi'
  | 'unknown'

export interface SafetyGateInput {
  transactionType: TransactionType
  recipientType: RecipientType
  recipientIdentifier: string
  amountInvolved?: number
  hasPromisedReturns: boolean
  hasUrgencyPressure: boolean
  isApkInstallRequested: boolean
  isOtpOrPinRequested: boolean
  isOffMarketDematTransfer: boolean
  hasVerifiedOfficialRegistry: boolean
  discussedWithFamily: boolean
}

export type SafetyGateState =
  | 'stop_and_protect'
  | 'pause_and_verify'
  | 'checks_completed'

export interface TriggeredSafetyRule {
  code: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  reason: string
  supportingEvidence?: string
  recommendedAction: string
  officialSourceUrl?: string
}

export interface SafetyGateRecommendation {
  state: SafetyGateState
  title: string
  summary: string
  disclaimer: string
  coolingOffRecommended: boolean
  suggestedCoolingHours: 12 | 24 | 48
  triggeredRules: TriggeredSafetyRule[]
  actionChecklist: string[]
  officialPortals: { name: string; url: string; note: string }[]
}

export function evaluateSafetyGate(
  input: Partial<SafetyGateInput>,
  analysisEvidence?: AnalysisResult | null,
): SafetyGateRecommendation {
  const rules: TriggeredSafetyRule[] = []

  // Check 1: Critical - OTP or Secret Pin / Password disclosure
  if (input.isOtpOrPinRequested) {
    rules.push({
      code: 'CRIT_OTP_DISCLOSURE',
      severity: 'critical',
      title: 'Critical: Secret OTP or Credential Disclosure Demanded',
      reason:
        'Legitimate banks, brokers, SEBI, and NSDL NEVER request OTPs, passwords, or TPINs to credit funds or authorize trades.',
      recommendedAction:
        'DO NOT share the OTP or password. Immediate risk of total unauthorized account debit.',
      officialSourceUrl: 'https://cybercrime.gov.in',
    })
  }

  // Check 2: Critical - Sideloaded APK or remote access software
  if (input.isApkInstallRequested) {
    rules.push({
      code: 'CRIT_APK_DOWNLOAD',
      severity: 'critical',
      title: 'Critical: Unverified APK or Remote Access App Required',
      reason:
        'SEBI and state cyber police strictly warn against downloading APK files from WhatsApp, Telegram, or unknown web links. Fake trading APKs display fictitious gains while preventing withdrawals.',
      recommendedAction:
        'Delete the APK immediately. Trade exclusively through brokers registered on official Google Play Store or Apple App Store.',
      officialSourceUrl: 'https://investor.sebi.gov.in',
    })
  }

  // Check 3: Critical - Off-market Demat Share Transfer to Individual BOID
  if (
    input.isOffMarketDematTransfer ||
    (input.transactionType === 'demat_transfer' &&
      input.recipientType === 'individual_savings_account')
  ) {
    rules.push({
      code: 'CRIT_OFFMARKET_DEMAT',
      severity: 'critical',
      title: 'Critical: High-Risk Off-Market Demat Share Transfer',
      reason:
        'Direct share transfers to an individual BOID/Client ID bypass exchange clearing corporations (NSCCL/ICCL). Once debited via e-DIS, shares cannot be recovered by NSDL or SEBI.',
      recommendedAction:
        'Halt the transfer. Verify legitimate stock trades settle only through official SEBI-registered brokers on exchange platforms.',
      officialSourceUrl: 'https://eservices.nsdl.com',
    })
  }

  // Check 4: Critical - Payment to Personal UPI or Individual Savings Account for Advisory / Trading
  if (
    input.recipientType === 'individual_personal_upi' ||
    input.recipientType === 'individual_savings_account'
  ) {
    rules.push({
      code: 'CRIT_PERSONAL_BENEFICIARY',
      severity: 'critical',
      title: 'Critical: Beneficiary is a Personal Savings or Individual UPI Account',
      reason:
        'SEBI regulations strictly prohibit intermediaries from collecting client trading capital or advisory fees in individual personal savings accounts or private UPI handles.',
      recommendedAction:
        'Do not transfer money. Fee payments must be formally invoiced into audited corporate accounts of registered entities.',
      officialSourceUrl: 'https://scores.sebi.gov.in',
    })
  }

  // Check 5: Warning - Guaranteed Returns Promised
  if (input.hasPromisedReturns) {
    rules.push({
      code: 'WARN_GUARANTEED_RETURN',
      severity: 'warning',
      title: 'Warning: Guaranteed / Assured Return Claimed',
      reason:
        'SEBI Circular SEBI/HO/MIRSD/MIRSD-PoD-1/P/CIR/2023/24 prohibits any registered entity or broker from assuring fixed returns on equity or derivatives.',
      recommendedAction:
        'Treat any promise of 100% safe or fixed daily/weekly profits as an indicator of fraud.',
      officialSourceUrl: 'https://www.sebi.gov.in',
    })
  }

  // Check 6: Warning - High Artificial Urgency or Time Pressure
  if (input.hasUrgencyPressure) {
    rules.push({
      code: 'WARN_URGENCY_PRESSURE',
      severity: 'warning',
      title: 'Warning: Artificial Urgency & Time Pressure Detected',
      reason:
        'Scammers construct artificial deadlines (e.g. "slots closing in 30 mins") specifically to suppress rational skepticism and prevent users from consulting family.',
      recommendedAction:
        'Activate a mandatory 24-hour cooling-off pause before executing any transfer.',
    })
  }

  // Check 7: Info / Verification Gap - No independent official registry check
  if (!input.hasVerifiedOfficialRegistry) {
    rules.push({
      code: 'INFO_UNVERIFIED_REGISTRY',
      severity: 'info',
      title: 'Verification Pending: Entity Not Checked on SEBI / NSDL Directory',
      reason:
        'Sender claims have not yet been independently verified against official regulatory registries.',
      recommendedAction:
        'Verify the entity registration number on sebi.gov.in before transmitting any funds.',
      officialSourceUrl: 'https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13',
    })
  }

  // Check 8: Info - Family Consultation
  if (!input.discussedWithFamily) {
    rules.push({
      code: 'INFO_FAMILY_CONSULT',
      severity: 'info',
      title: 'Safety Recommendation: Discuss with Trusted Family Circle',
      reason:
        'Over 80% of retail cyber investment frauds succeed because victims isolate themselves out of FOMO or fear.',
      recommendedAction:
        'Share a Nivesh Parivar Warning Card with a family member or mentor before proceeding.',
    })
  }

  // Incorporate analysis evidence if present
  if (analysisEvidence?.overall_status === 'warning_signs_found') {
    rules.push({
      code: 'ANALYSIS_WARNING_MATCH',
      severity: 'warning',
      title: 'AI Analysis Warning Indicators Present',
      reason: analysisEvidence.summary,
      supportingEvidence: analysisEvidence.findings?.[0]?.original_excerpt,
      recommendedAction: 'Review the Evidence Graph before making any transfer.',
    })
  }

  const hasCritical = rules.some((r) => r.severity === 'critical')
  const hasWarning = rules.some((r) => r.severity === 'warning')

  if (hasCritical) {
    return {
      state: 'stop_and_protect',
      title: 'STOP AND PROTECT: High-Risk Fraud Pattern Identified',
      summary:
        'Critical statutory safety violations detected. Proceeding with this transaction carries an extreme risk of irreversible financial loss.',
      disclaimer:
        'Notice: This assessment is an educational safety tool and does not constitute financial advice or technical blockage of your bank account.',
      coolingOffRecommended: true,
      suggestedCoolingHours: 24,
      triggeredRules: rules,
      actionChecklist: [
        'Halt this transaction immediately.',
        'Do not share OTPs, TPINs, passwords, or install unverified APK files.',
        'If money was already debited within the last 2 hours, immediately dial 1930 (Golden Hour response).',
        'Verify the entity on the official SEBI registered intermediary portal.',
      ],
      officialPortals: [
        {
          name: 'National Cyber Crime Helpline',
          url: 'https://cybercrime.gov.in',
          note: 'Dial 1930 for immediate financial cyber fraud freezing.',
        },
        {
          name: 'SEBI SCORES 2.0',
          url: 'https://scores.sebi.gov.in',
          note: 'Official grievance redressal against fraudulent securities solicitations.',
        },
      ],
    }
  }

  if (hasWarning || !input.hasVerifiedOfficialRegistry) {
    return {
      state: 'pause_and_verify',
      title: 'PAUSE AND VERIFY: Crucial Verification Steps Incomplete',
      summary:
        'Suspicious indicators or unverified entity details detected. Do not proceed until independent regulatory confirmation has been achieved.',
      disclaimer:
        'Notice: Passing individual checklist items does not guarantee the legitimacy of the recipient. Independent verification is required.',
      coolingOffRecommended: true,
      suggestedCoolingHours: 12,
      triggeredRules: rules,
      actionChecklist: [
        'Search the recipient registration number on sebi.gov.in.',
        'Discuss this investment with a family member or trusted financial mentor.',
        'Check whether the beneficiary account name matches the registered corporate entity.',
        'Activate a 12-hour cooling-off pause before releasing funds.',
      ],
      officialPortals: [
        {
          name: 'SEBI Intermediary Registry',
          url: 'https://www.sebi.gov.in',
          note: 'Verify Research Analyst (RA) or Investment Adviser (IA) license.',
        },
        {
          name: 'NSDL e-Services',
          url: 'https://eservices.nsdl.com',
          note: 'Confirm Demat holdings and authorized clearing bank details.',
        },
      ],
    }
  }

  return {
    state: 'checks_completed',
    title: 'Checks Completed — Review Diligently Before Proceeding',
    summary:
      'The pre-transaction safety checklist has been completed and no configured critical indicators were reported. Always exercise prudent judgment.',
    disclaimer:
      'Notice: Completing this safety checklist DOES NOT guarantee the legitimacy of the recipient, investment outcome, or transaction safety. Markets carry statutory risks and NiveshShield does not approve or endorse transactions.',
    coolingOffRecommended: false,
    suggestedCoolingHours: 12,
    triggeredRules: rules,
    actionChecklist: [
      'Ensure trade settles exclusively through official Exchange Clearing Corporations.',
      'Maintain transaction receipts and contract notes for reconciliation.',
      'Check your monthly NSDL/CDSL CAS statement upon execution.',
    ],
    officialPortals: [
      {
        name: 'SEBI Official Portal',
        url: 'https://www.sebi.gov.in',
        note: 'Investor awareness and regulatory guidelines.',
      },
    ],
  }
}
