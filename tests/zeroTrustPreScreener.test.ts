import {
  evaluateFatalRedLines,
  isValidLuhn,
  hasCardIssuerPrefix,
  fastImagePreScreener,
  runZeroTrustPreScreen,
} from '../src/zeroTrustPreScreener.ts'
import {
  isEducationalOrDisclaimer,
  executeNiveshShieldPipeline,
} from '../src/pipeline.ts'

console.log('===========================================================')
console.log('🛡️  STAGE 1 ZERO-TRUST GUARDRAIL PRE-SCREENER TEST SUITE')
console.log('===========================================================\n')

let passed = 0
let failed = 0

function assert(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${name}`)
    passed++
  } else {
    console.error(`❌ [FAIL] ${name} — ${details || ''}`)
    failed++
  }
}

// 1. Luhn Algorithm Validation
assert('Luhn: Valid Visa card passes checksum', isValidLuhn('4532015112830366'))
assert('Luhn: Invalid checksum fails', !isValidLuhn('4532015112830367'))
assert('Luhn: Short digit sequence fails', !isValidLuhn('123456'))
assert('Card Issuer: Recognized Visa prefix', hasCardIssuerPrefix('4532015112830366'))
assert('Card Issuer: Recognized Mastercard prefix', hasCardIssuerPrefix('5105105105105100'))
assert('Card Issuer: Recognized RuPay prefix', hasCardIssuerPrefix('6080123456789012'))

// 2. Fatal Red Line: Live Formatted Credit Card in Text
const cardTextMatch = evaluateFatalRedLines('Please charge my card 4532 0151 1283 0366 now')
assert(
  'Pre-Screener: Formatted live credit card number detected',
  cardTextMatch !== null && cardTextMatch.category === 'CREDIT_CARD_NUMBER',
  `Expected CREDIT_CARD_NUMBER, got ${cardTextMatch?.category}`,
)

// 3. Negative check: Normal Indian mobile number or pincode does NOT false positive as a credit card
const benignPhoneMatch = evaluateFatalRedLines('Call me at +91 98765 43210 for stock advisory')
assert('Pre-Screener: Normal mobile number does NOT trigger card number fatal red line', benignPhoneMatch === null)

const benignPincodeMatch = evaluateFatalRedLines('Office located at Connaught Place, New Delhi 110001')
assert('Pre-Screener: 6-digit Pincode does NOT trigger card number fatal red line', benignPincodeMatch === null)

// 4. Fatal Red Line: CVV Harvesting
const cvvMatch1 = evaluateFatalRedLines('Enter your CVV: 892 to verify account')
assert(
  'Pre-Screener: CVV value exposure intercepted',
  cvvMatch1 !== null && cvvMatch1.category === 'CVV_HARVESTING',
)

const cvvMatch2 = evaluateFatalRedLines('Please share your 3 digit security code on the back of your card')
assert(
  'Pre-Screener: CVV request intercepted',
  cvvMatch2 !== null && cvvMatch2.category === 'CVV_HARVESTING',
)

// 5. Fatal Red Line: OTP Harvesting
const otpMatch1 = evaluateFatalRedLines('Your verification OTP is 739104')
assert(
  'Pre-Screener: OTP value exposure intercepted',
  otpMatch1 !== null && otpMatch1.category === 'OTP_HARVESTING',
)

const otpMatch2 = evaluateFatalRedLines('Forward the SMS code and tell your OTP to customer executive to unblock card')
assert(
  'Pre-Screener: OTP sharing solicitation intercepted',
  otpMatch2 !== null && otpMatch2.category === 'OTP_HARVESTING',
)

// 6. Fatal Red Line: PIN Harvesting
const pinMatch = evaluateFatalRedLines('Enter your ATM PIN and UPI PIN to claim 5000 cashback')
assert(
  'Pre-Screener: ATM/UPI PIN solicitation intercepted',
  pinMatch !== null && pinMatch.category === 'PIN_HARVESTING',
)

// 7. Fatal Red Line: Credit Card Photo & User's Specific Prompt
const userPromptMatch = evaluateFatalRedLines('GET FREE MONEY!!!! IN EXCHANGE OF YOUR CREDIT CARD PHOTO')
assert(
  'Pre-Screener: "GET FREE MONEY!!!! IN EXCHANGE OF YOUR CREDIT CARD PHOTO" intercepted as CARD_PHOTO_HARVESTING or FREE_MONEY_CREDENTIAL_LURE',
  userPromptMatch !== null &&
    (userPromptMatch.category === 'CARD_PHOTO_HARVESTING' || userPromptMatch.category === 'FREE_MONEY_CREDENTIAL_LURE'),
  `Got category: ${userPromptMatch?.category}`,
)

const photoMatch2 = evaluateFatalRedLines('Send photo of your credit card front and back')
assert(
  'Pre-Screener: Explicit card photo request intercepted',
  photoMatch2 !== null && photoMatch2.category === 'CARD_PHOTO_HARVESTING',
)

// 8. Fatal Red Line: Sensitive Financial Documents
const docMatch = evaluateFatalRedLines('Send cancelled cheque photo and passbook picture for instant money')
assert(
  'Pre-Screener: Cheque/passbook photo request intercepted',
  docMatch !== null && docMatch.category === 'SENSITIVE_DOCUMENT_HARVESTING',
)

// 9. Vernacular Fatal Red Lines
const hiMatch = evaluateFatalRedLines('मुफ्त इनाम के लिए अपने क्रेडिट कार्ड का फोटो भेजें')
assert(
  'Pre-Screener: Hindi credit card photo solicitation intercepted',
  hiMatch !== null,
)

const mrMatch = evaluateFatalRedLines('बँक खात्यासाठी कार्डचा फोटो पाठवा')
assert(
  'Pre-Screener: Marathi card photo solicitation intercepted',
  mrMatch !== null,
)

// 10. Image Fast-Pass Interceptor
async function runAsyncTests() {
  const imageFastPass = await fastImagePreScreener({
    fileName: 'credit_card_front_photo.jpg',
  })
  assert(
    'Image Fast-Pass: Sensitive file metadata intercepted before network dispatch',
    imageFastPass.intercepted && imageFastPass.fatalMatch?.category === 'CARD_PHOTO_HARVESTING',
  )

  const cleanImage = await fastImagePreScreener({
    fileName: 'market_closing_bell_chart.png',
  })
  assert('Image Fast-Pass: Neutral chart image metadata passes cleanly', !cleanImage.intercepted)

  // 11. Full Pipeline & Latency Benchmark
  const t0 = Date.now()
  const pipelineResult = await runZeroTrustPreScreen({
    message: 'GET FREE MONEY!!!! IN EXCHANGE OF YOUR CREDIT CARD PHOTO',
    language: 'en',
    modality: 'text',
  })
  const t1 = Date.now()
  const duration = t1 - t0

  assert(
    'Pipeline: Hard RED Block triggered with synthetic analysis',
    pipelineResult.intercepted &&
      pipelineResult.syntheticAnalysis?.overall_status === 'warning_signs_found',
  )
  assert(
    'Pipeline: Zero-Trust Pre-Screener executed in 0ms (< 15ms benchmark)',
    duration < 15,
    `Duration was ${duration}ms`,
  )
  assert(
    'Pipeline: Journey map reflects observed credential harvesting',
    pipelineResult.syntheticAnalysis?.scam_journey_map.some(
      (s) => s.stage === 'app_or_credential_request' && s.observed,
    ) === true,
  )

  // 12. Clean Pass-Through Test for Stage 2
  const cleanPassThrough = await runZeroTrustPreScreen({
    message: 'Index funds track the Nifty 50 or Sensex index with low expense ratios.',
    language: 'en',
    modality: 'text',
  })
  assert(
    'Clean Pass-Through: Neutral financial educational content hands over cleanly to Stage 2',
    !cleanPassThrough.intercepted && cleanPassThrough.fatalMatch === null,
  )

  // 13. Educational & Statutory Disclaimer Exemption Tests
  assert(
    'Educational Exemption: "What is a Mutual Fund?" detected as educational',
    isEducationalOrDisclaimer('What is a Mutual Fund?'),
  )
  assert(
    'Educational Exemption: "Difference between ETF and Mutual Fund" detected as educational',
    isEducationalOrDisclaimer('Difference between ETF and Mutual Fund'),
  )
  assert(
    'Statutory Disclaimer Exemption: Standard market risk disclaimer detected',
    isEducationalOrDisclaimer('Disclaimer: Mutual funds are subject to market risk. Read all scheme documents carefully.'),
  )

  // 14. Pipeline Green Routing
  const eduPipelineResult = await executeNiveshShieldPipeline('What is a SIP in mutual funds?')
  assert(
    'Pipeline: Educational query routes to 🟢 GREEN verdict with 0 scam score',
    eduPipelineResult.verdict === '🟢 GREEN' && eduPipelineResult.scam_detected === false,
    `Got verdict: ${eduPipelineResult.verdict}`,
  )

  // 15. Casual Non-Financial Chatter Test
  const casualResult = await executeNiveshShieldPipeline('Hello, good morning! How are you doing today?')
  assert(
    'Pipeline: Non-financial casual chatter routes to 🟢 GREEN with is_financial_context = false',
    casualResult.verdict === '🟢 GREEN' && casualResult.scam_detected === false,
    `Got verdict: ${casualResult.verdict}`,
  )

  // 16. Vernacular Devanagari Guaranteed Return Test
  const vernacularRedResult = await executeNiveshShieldPipeline('विशेष ऑफर! गारंटीड 40% मासिक रिटर्न')
  assert(
    'Pipeline: Vernacular Devanagari guaranteed return routes to 🔴 RED verdict',
    vernacularRedResult.verdict === '🔴 RED' && vernacularRedResult.scam_detected === true,
    `Got verdict: ${vernacularRedResult.verdict}`,
  )

  // 17. Universal Verification Matrix Across All Languages
  const matrix = [
    { lang: 'Hindi', text: 'विशेष ऑफर! गारंटीड 40% मासिक रिटर्न' },
    { lang: 'Marathi', text: 'खास ऑफर! ४०% दरमहा परताव्याची हमी' },
    { lang: 'Gujarati', text: 'વિશેષ ઓફર! ગેરંટીડ 40% માસિક વળતર' },
    { lang: 'Bengali', text: 'বিশেষ অফার! গ্যারান্টিযুক্ত 40% মাসিক রিটার্ন' },
    { lang: 'Tamil', text: 'சிறப்பு ஆஃபர்! உத்தரவாதம் அளிக்கப்பட்ட 40% மாதாந்திர வருமானம்' },
    { lang: 'Telugu', text: 'ప్రత్యేక ఆఫర్! 40% నెలవారీ రిటర్న్ హామీ' },
  ]

  for (const item of matrix) {
    const res = await executeNiveshShieldPipeline(item.text)
    assert(
      `Verification Matrix (${item.lang}): routes to 🔴 RED (lure_contact)`,
      res.verdict === '🔴 RED' && res.scam_detected === true,
      `Language ${item.lang} got verdict: ${res.verdict}`,
    )
  }

  // 18. Hinglish & Vernacular Educational Exemption & Non-Investment Expense Tests
  assert(
    'Hinglish Educational Exemption: "Mutual fund aur stock me kya antar hai?" detected as educational',
    isEducationalOrDisclaimer('Mutual fund aur stock me kya antar hai?'),
  )

  const nonInvestmentExpenseResult = await executeNiveshShieldPipeline('bought groceries and movie tickets for dinner tonight')
  assert(
    'Pipeline: Non-investment personal expense routes to 🟢 GREEN with is_financial_context = false',
    nonInvestmentExpenseResult.verdict === '🟢 GREEN' && nonInvestmentExpenseResult.scam_detected === false,
    `Got verdict: ${nonInvestmentExpenseResult.verdict}`,
  )

  // 19. Audio / Voice Note Intake & Judging Test
  const voiceNoteResult = await executeNiveshShieldPipeline({
    message: 'Bhai guaranteed 40% daily profit scheme hai, aaj hi registration fee bhej do.',
    modality: 'voice',
    file_data: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEA...',
    file_mime_type: 'audio/wav',
    language: 'hi',
  })
  assert(
    'Pipeline: Voice note intake payload evaluated and routes to 🔴 RED verdict',
    voiceNoteResult.verdict === '🔴 RED' && voiceNoteResult.scam_detected === true,
    `Voice note got verdict: ${voiceNoteResult.verdict}`,
  )

  // 20. Spoken Phonetic Percentage Voice Transcript Test
  const spokenVoiceTranscriptResult = await executeNiveshShieldPipeline('bhai guaranteed chalis percent milega aaj hi paisa daal do')
  assert(
    'Pipeline: Unpunctuated spoken percentage voice transcript routes to 🔴 RED verdict',
    spokenVoiceTranscriptResult.verdict === '🔴 RED' && spokenVoiceTranscriptResult.scam_detected === true,
    `Spoken transcript got verdict: ${spokenVoiceTranscriptResult.verdict}`,
  )

  // 21. Percentage Yield Without Time Frame Requirement Test
  const percentageReturnNoTimeframeResult = await executeNiveshShieldPipeline('Get 100 percent return on your investment today')
  assert(
    'Pipeline: "100 percent return" without time period routes to 🔴 RED verdict',
    percentageReturnNoTimeframeResult.verdict === '🔴 RED' && percentageReturnNoTimeframeResult.scam_detected === true,
    `Percentage return without timeframe got verdict: ${percentageReturnNoTimeframeResult.verdict}`,
  )

  console.log('\n===========================================================')
  console.log(`ZERO-TRUST PRE-SCREENER TESTS: ${passed}/${passed + failed} PASSED (${failed} FAILED)`)
  console.log('===========================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runAsyncTests()
