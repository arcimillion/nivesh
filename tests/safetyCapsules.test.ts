/**
 * NiveshShield Safety Capsules Test Suite
 * Tests six-language coverage, verified official sources, contextual recommendations,
 * elderly-friendly rules, and language switching resilience.
 */

import {
  ALL_SUPPORTED_LANGUAGES,
  getUniversalSafetyCapsules,
  findRecommendedCapsule,
  normalizeLanguageCode,
} from '../src/data/safetyCapsules.ts'
import type { AnalysisResult } from '../src/api.ts'

let passed = 0
let failed = 0

function assert(description: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${description}`)
    passed++
  } else {
    console.error(`❌ [FAIL] ${description} ${details ? `(${details})` : ''}`)
    failed++
  }
}

console.log('===========================================================')
console.log('🎥 NIVESHSHIELD SAFETY CAPSULES MULTILINGUAL TEST SUITE')
console.log('===========================================================')

// TEST GROUP 1: CATALOG INTEGRITY AND MULTILINGUAL EXPLANATIONS
const capsules = getUniversalSafetyCapsules()
assert('Catalog contains 6 high-value safety capsules', capsules.length === 6, `Found: ${capsules.length}`)

capsules.forEach((capsule) => {
  ALL_SUPPORTED_LANGUAGES.forEach((lang) => {
    const title = capsule.localizedTitle[lang]
    assert(`Capsule '${capsule.id}' has localized title in '${lang}'`, Boolean(title && title.length > 0))

    const shortRule = capsule.localizedShortRule[lang]
    assert(`Capsule '${capsule.id}' has localized short rule in '${lang}'`, Boolean(shortRule && shortRule.length > 0))

    const mainRule = capsule.localizedMainRule[lang]
    assert(`Capsule '${capsule.id}' has localized main rule in '${lang}'`, Boolean(mainRule && mainRule.includes('✅')))

    const audioExplanation = capsule.localizedAudioExplanation[lang]
    assert(`Capsule '${capsule.id}' has localized audio explanation in '${lang}'`, Boolean(audioExplanation && audioExplanation.length > 0))

    const takeaways = capsule.takeaways[lang]
    assert(`Capsule '${capsule.id}' has localized takeaways in '${lang}'`, Array.isArray(takeaways) && takeaways.length >= 2)
  })
})

// TEST GROUP 2: VERIFIED OFFICIAL VIDEO SOURCES
const otpCapsule = capsules.find((c) => c.id === 'otp_credentials')!
ALL_SUPPORTED_LANGUAGES.forEach((lang) => {
  const video = otpCapsule.videosByLanguage[lang]
  assert(
    `OTP Capsule has verified official RBI video in '${lang}'`,
    Boolean(video && video.embedUrl && video.isVerified && video.officialVideoTitle),
    `Missing in OTP capsule for ${lang}`,
  )
})

// Verify NSE Guaranteed Returns Video
const nseCapsule = capsules.find((c) => c.id === 'guaranteed_returns')!
assert('NSE Guaranteed Returns has verified English video', Boolean(nseCapsule.videosByLanguage.en?.embedUrl))
assert('NSE Guaranteed Returns has verified Hindi video', Boolean(nseCapsule.videosByLanguage.hi?.embedUrl))

// Verify CyberDost Impersonation Video
const impersonationCapsule = capsules.find((c) => c.id === 'impersonation')!
assert('CyberDost Impersonation has verified English video', Boolean(impersonationCapsule.videosByLanguage.en?.embedUrl))
assert('RBI Impersonation has verified Hindi video', Boolean(impersonationCapsule.videosByLanguage.hi?.embedUrl))

// Verify NPCI UPI Payments Video
const upiCapsule = capsules.find((c) => c.id === 'upi_payments')!
assert('NPCI UPI Payments has verified English video', Boolean(upiCapsule.videosByLanguage.en?.embedUrl))
assert('NPCI UPI Payments has verified Hindi video', Boolean(upiCapsule.videosByLanguage.hi?.embedUrl))

// TEST GROUP 3: CONTEXTUAL RECOMMENDATION MATCHING
// Test 3.1: Bengali user + OTP finding -> Bengali OTP Safety capsule
const mockOtpAnalysisBengali: AnalysisResult = {
  input_modality: 'text',
  input_language: 'bn',
  extracted_text: 'আপনার কার্ডের ছবি এবং ওটিপি পাঠান',
  extraction_uncertainty: { has_uncertainty: false, confidence: 'high', notes: '' },
  extracted_entities: { urls: [], names: [], promised_returns: [], deadlines: [], payment_requests: [], claims: [] },
  overall_status: 'warning_signs_found',
  uncertainty_rating: 'low',
  summary: 'ওটিপি জালিয়াতির ঝুঁকি সনাক্ত করা হয়েছে',
  findings: [
    {
      indicator: 'other_warning_sign',
      original_excerpt: 'কার্ডের ছবি এবং ওটিপি',
      explanation: 'ওটিপি চাওয়া হচ্ছে',
      evidence_type: 'message_excerpt',
      verification_status: 'not_independently_verified',
    },
  ],
  claims: [],
  scam_journey_map: [],
  unknowns: [],
  next_steps: [],
  limitations: [],
  fatal_category: 'CARD_PHOTO_HARVESTING',
}

const recommendedOtp = findRecommendedCapsule(mockOtpAnalysisBengali)
assert('Analysis with OTP finding maps to otp_credentials capsule', recommendedOtp.id === 'otp_credentials')
const bnVideo = recommendedOtp.videosByLanguage.bn
assert('Bengali OTP capsule resolves to official RBI Bengali video', bnVideo?.language === 'bn' && bnVideo?.sourceOrg === 'RBI')
assert('Bengali title is in Bengali script', recommendedOtp.localizedTitle.bn.includes('গোপনীয়'))

// Test 3.2: Tamil user + Guaranteed Return finding -> Tamil Guaranteed Return capsule
const mockGuaranteedTamil: AnalysisResult = {
  input_modality: 'text',
  input_language: 'ta',
  extracted_text: '40% மாதாந்திர வருமானம் உத்தரவாதம்',
  extraction_uncertainty: { has_uncertainty: false, confidence: 'high', notes: '' },
  extracted_entities: { urls: [], names: [], promised_returns: ['40%'], deadlines: [], payment_requests: [], claims: [] },
  overall_status: 'warning_signs_found',
  uncertainty_rating: 'low',
  summary: 'நிலையான லாப வாக்குறுதி',
  findings: [
    {
      indicator: 'guaranteed_returns',
      original_excerpt: '40% உத்தரவாதம்',
      explanation: 'செபி விதிமீறல்',
      evidence_type: 'message_excerpt',
      verification_status: 'not_independently_verified',
    },
  ],
  claims: [],
  scam_journey_map: [],
  unknowns: [],
  next_steps: [],
  limitations: [],
}

const recommendedGuaranteed = findRecommendedCapsule(mockGuaranteedTamil)
assert('Analysis with guaranteed returns maps to guaranteed_returns capsule', recommendedGuaranteed.id === 'guaranteed_returns')
assert('Tamil title is in Tamil script', recommendedGuaranteed.localizedTitle.ta.includes('வருமானம்'))

// Test 3.3: Marathi user + Fake Trading APK finding -> Marathi Fake App capsule
const mockApkMarathi: AnalysisResult = {
  input_modality: 'text',
  input_language: 'mr',
  extracted_text: 'आमचे VIP ॲप इन्स्टॉल करा: http://bit.ly/trade-apk',
  extraction_uncertainty: { has_uncertainty: false, confidence: 'high', notes: '' },
  extracted_entities: { urls: ['http://bit.ly/trade-apk'], names: [], promised_returns: [], deadlines: [], payment_requests: [], claims: [] },
  overall_status: 'warning_signs_found',
  uncertainty_rating: 'low',
  summary: 'अनधिकृत APK डाउनलोड लिंक',
  findings: [
    {
      indicator: 'unofficial_app',
      original_excerpt: 'trade-apk',
      explanation: 'बनावट ॲप',
      evidence_type: 'message_excerpt',
      verification_status: 'not_independently_verified',
    },
  ],
  claims: [],
  scam_journey_map: [],
  unknowns: [],
  next_steps: [],
  limitations: [],
}

const recommendedApk = findRecommendedCapsule(mockApkMarathi)
assert('Analysis with unofficial APK maps to fake_apps capsule', recommendedApk.id === 'fake_apps')
assert('Marathi title is in Marathi script', recommendedApk.localizedTitle.mr.includes('बनावट'))

// Test 3.4: Gujarati user + UPI Payment Request
const mockUpiGujarati: AnalysisResult = {
  input_modality: 'text',
  input_language: 'gu',
  extracted_text: 'રૂ. 5000 તાત્કાલિક UPI ID પર ટ્રાન્સફર કરો',
  extraction_uncertainty: { has_uncertainty: false, confidence: 'high', notes: '' },
  extracted_entities: { urls: [], names: [], promised_returns: [], deadlines: [], payment_requests: ['5000'], claims: [] },
  overall_status: 'warning_signs_found',
  uncertainty_rating: 'low',
  summary: 'અગાઉથી UPI ચુકવણીની માંગ',
  findings: [
    {
      indicator: 'upfront_payment',
      original_excerpt: 'UPI ID પર ટ્રાન્સફર',
      explanation: 'ચુકવણીની માંગ',
      evidence_type: 'message_excerpt',
      verification_status: 'not_independently_verified',
    },
  ],
  claims: [],
  scam_journey_map: [],
  unknowns: [],
  next_steps: [],
  limitations: [],
}

const recommendedUpi = findRecommendedCapsule(mockUpiGujarati)
assert('Analysis with UPI upfront payment maps to upi_payments capsule', recommendedUpi.id === 'upi_payments')
assert('Gujarati main rule explains UPI PIN goes out', recommendedUpi.localizedMainRule.gu.includes('પૈસા બહાર જાય છે'))

// Test 3.5: Hindi user + Impersonation / Digital Arrest
const mockImpersonationHindi: AnalysisResult = {
  input_modality: 'text',
  input_language: 'hi',
  extracted_text: 'CBI और पुलिस की तरफ से डिजिटल अरेस्ट का वारंट जारी हुआ है',
  extraction_uncertainty: { has_uncertainty: false, confidence: 'high', notes: '' },
  extracted_entities: { urls: [], names: [], promised_returns: [], deadlines: [], payment_requests: [], claims: [] },
  overall_status: 'warning_signs_found',
  uncertainty_rating: 'low',
  summary: 'डिजिटल अरेस्ट का फर्जी दावा',
  findings: [
    {
      indicator: 'impersonation',
      original_excerpt: 'डिजिटल अरेस्ट का वारंट',
      explanation: 'पुलिस अधिकारी का फर्जी रूप',
      evidence_type: 'message_excerpt',
      verification_status: 'not_independently_verified',
    },
  ],
  claims: [],
  scam_journey_map: [],
  unknowns: [],
  next_steps: [],
  limitations: [],
}

const recommendedImpersonation = findRecommendedCapsule(mockImpersonationHindi)
assert('Analysis with impersonation maps to impersonation capsule', recommendedImpersonation.id === 'impersonation')
const hiVideo = recommendedImpersonation.videosByLanguage.hi
assert('Hindi Impersonation capsule resolves to official RBI Hindi video', hiVideo?.language === 'hi' && hiVideo?.sourceOrg === 'RBI')
assert('Hindi rule clarifies no such law exists', recommendedImpersonation.localizedMainRule.hi.includes('डिजिटल अरेस्ट'))

// TEST GROUP 4: LANGUAGE CODE NORMALIZATION
assert('Normalize en returns en', normalizeLanguageCode('en') === 'en')
assert('Normalize hi-IN returns hi', normalizeLanguageCode('hi-IN') === 'hi')
assert('Normalize bn returns bn', normalizeLanguageCode('bn') === 'bn')
assert('Normalize mr returns mr', normalizeLanguageCode('mr') === 'mr')
assert('Normalize gu returns gu', normalizeLanguageCode('gu') === 'gu')
assert('Normalize ta returns ta', normalizeLanguageCode('ta') === 'ta')
assert('Normalize unknown language falls back safely to en', normalizeLanguageCode('de') === 'en')

console.log('===========================================================')
console.log(`SAFETY CAPSULES TESTS: ${passed} PASSED, ${failed} FAILED`)
console.log('===========================================================')

if (failed > 0) {
  process.exit(1)
}
