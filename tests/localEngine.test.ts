import { evaluateLocally, evaluatePhoneLocally } from '../src/localRegulatoryEngine.ts'

console.log('===========================================================')
console.log('🛡️  NIVESHSHIELD CLIENT-SIDE REGULATORY ENGINE TESTS')
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

// Test 1: User's exact prompt from screenshot
const res1 = evaluateLocally({
  message: 'take 10000 while giving 100',
  language: 'en',
  modality: 'text',
})
assert(
  'User screenshot test: "take 10000 while giving 100" detected as warning_signs_found',
  res1.overall_status === 'warning_signs_found',
  `Expected warning_signs_found, got ${res1.overall_status}`,
)
assert(
  'User screenshot test: 5-stage scam journey map generated',
  Array.isArray(res1.scam_journey_map) && res1.scam_journey_map.length === 5,
  `Stages count: ${res1.scam_journey_map.length}`,
)
assert(
  'User screenshot test: Findings and regulatory claims present',
  res1.findings.length > 0 && res1.claims.length > 0,
)

// Test 2: Standard guaranteed return
const res2 = evaluateLocally({
  message: 'Guaranteed 20% daily profit join VIP desk',
  language: 'en',
  modality: 'text',
})
assert('Guaranteed returns flagged', res2.overall_status === 'warning_signs_found')

// Test 3: Ambiguous Telegram channel
const res3 = evaluateLocally({
  message: 'Join our telegram group for market discussion',
  language: 'en',
  modality: 'text',
})
assert('Informal Telegram group flagged as insufficient_evidence', res3.overall_status === 'insufficient_evidence')

// Test 4: Benign educational text
const res4 = evaluateLocally({
  message: 'Index funds and diversified mutual funds invest in broad market indices over long horizon.',
  language: 'en',
  modality: 'text',
})
assert('Benign financial education flagged as no_obvious_warning_signs', res4.overall_status === 'no_obvious_warning_signs')

// Test 5: Phone extraction & local evaluation
const phoneRes = evaluatePhoneLocally('+91 98765 43210', 'Investment group admin')
assert('Phone number formatted and masked', phoneRes.is_valid_format && Boolean(phoneRes.normalized_e164))
assert('Official verification resources provided', phoneRes.official_verification_links.length >= 3)

console.log('\n===========================================================')
console.log(`CLIENT ENGINE TESTS: ${passed}/${passed + failed} PASSED (${failed} FAILED)`)
console.log('===========================================================')

if (failed > 0) {
  process.exit(1)
}
