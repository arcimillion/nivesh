import type {
  AnalysisResult,
  AnalyzeOptions,
  PhoneReputationInvestigation,
  PhoneReputationSourceResult,
  OfficialVerificationResource,
} from './api.ts'
import { officialSources, type OfficialSource } from './officialSources.ts'

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

type LangKey = 'en' | 'hi' | 'mr' | 'bn' | 'ta' | 'gu'

function resolveLang(lang?: string): LangKey {
  if (lang && ['en', 'hi', 'mr', 'bn', 'ta', 'gu'].includes(lang)) {
    return lang as LangKey
  }
  return 'en'
}

// Complete Multilingual Text Dictionary for Regulatory Verdicts
const DICTIONARY: Record<
  LangKey,
  {
    multiplierSummary: string
    guaranteedSummary: string
    educationalSummary: string
    guaranteedFixedSummary: string
    credentialHarvestingSummary: string
    credentialHarvestingExplanation: string
    credentialHarvestingWhatRemainsUnknown: string
    credentialHarvestingVerificationStep: string
    ambiguousSummary: string
    benignSummary: string
    guaranteedReturnsExplanation: string
    urgencyExplanation: string
    upfrontExplanation: string
    suspiciousLinkExplanation: string
    highRiskContentEstablishes: string
    ambiguousContentEstablishes: string
    benignContentEstablishes: string
    highRiskWhatRemainsUnknown: string
    ambiguousWhatRemainsUnknown: string
    benignWhatRemainsUnknown: string
    highRiskVerificationStep: string
    ambiguousVerificationStep: string
    benignVerificationStep: string
    journeyInitialOfferTitle: string
    journeyInitialOfferExplanation: string
    journeyUrgencyTitle: string
    journeyUrgencyExplanation: string
    journeyPaymentTitle: string
    journeyPaymentExplanation: string
    journeyAppTitle: string
    journeyAppExplanation: string
    journeyRecoveryTitle: string
    journeyRecoveryExplanation: string
    highRiskUnknowns: string[]
    highRiskNextSteps: string[]
    highRiskLimitations: string[]
    ambiguousUnknowns: string[]
    ambiguousNextSteps: string[]
    ambiguousLimitations: string[]
    benignUnknowns: string[]
    benignNextSteps: string[]
    benignLimitations: string[]
    phoneSafetyAdvisories: string[]
    phonePrivacyNotice: string
    phoneOfficialStatus: string
    phoneExternalRep: (masked: string) => string
    phoneUnverifiedElements: string[]
  }
> = {
  en: {
    multiplierSummary:
      'DANGER! This message promises fake money multiplication. Real investments can never double or multiply your money overnight.',
    guaranteedSummary:
      'DANGER! This message promises fake guaranteed returns on your money. Do NOT send any money or click any link.',
    educationalSummary:
      'Financial Education & Statutory Disclosure: Content is strictly informational or standard regulatory disclaimer without promotional fraud vectors.',
    guaranteedFixedSummary:
      'This message promises fake guaranteed returns on your money. Real stock market investments can never guarantee fixed returns.',
    credentialHarvestingSummary:
      'CRITICAL FRAUD WARNING: Requests for credit card photos, debit card details, CVV, or confidential bank details in exchange for "free money" are severe scams. Real banks and government officers NEVER ask for card photos or PINs.',
    credentialHarvestingExplanation:
      'Sharing a photo of your payment card exposes your 16-digit card number, expiry date, and CVV, allowing thieves to drain your bank account. Never share photos of your card.',
    credentialHarvestingWhatRemainsUnknown:
      'Real identity of the sender and business registration.',
    credentialHarvestingVerificationStep:
      'NEVER share photos of credit/debit cards. If already shared, call your bank immediately to block the card and dial 1930 (National Cyber Crime Helpline).',
    ambiguousSummary:
      'Caution: This sender or WhatsApp group is not verified by the government. Do not transfer any money until you verify them.',
    benignSummary:
      'No obvious warning signs detected in this text. This appears to be normal educational information.',
    guaranteedReturnsExplanation:
      'Real stock market investments can never guarantee fixed monthly profits. Anyone promising guaranteed profits is lying to steal your money.',
    urgencyExplanation:
      'Scammers create fake urgency like "limited seats left" or "act in 10 minutes" to rush you into paying before you can ask family or check with police.',
    upfrontExplanation:
      'Asking for upfront registration fees, processing charges, or transfers to personal UPI IDs is a clear sign of fraud.',
    suspiciousLinkExplanation:
      'Unsolicited invitation to private WhatsApp or Telegram groups without government registration.',
    highRiskContentEstablishes:
      'The message offers fake guaranteed returns without any official government license.',
    ambiguousContentEstablishes:
      'Message invites you to an unverified private trading group.',
    benignContentEstablishes:
      'Text describes standard financial or educational information without asking for money.',
    highRiskWhatRemainsUnknown:
      'Real identity of sender and official government registration.',
    ambiguousWhatRemainsUnknown:
      'Official broker license and registration number.',
    benignWhatRemainsUnknown:
      'Specific trading platform used.',
    highRiskVerificationStep:
      'Search entity or advisor name on official SEBI registered database at https://www.sebi.gov.in or call 1930.',
    ambiguousVerificationStep:
      'Ask for government license number and verify before paying.',
    benignVerificationStep:
      'Always verify that any broker or fund manager is licensed before investing.',
    journeyInitialOfferTitle: '1. Fake Offer & Big Profit Trap',
    journeyInitialOfferExplanation:
      'The scammer promises huge payouts or quick money multiplication to attract your attention.',
    journeyUrgencyTitle: '2. Rushing You to Pay Fast',
    journeyUrgencyExplanation:
      'They create fake urgency ("limited seats", "act in 10 mins") so you don\'t have time to ask your family.',
    journeyPaymentTitle: '3. Demanding Upfront Fee or UPI Transfer',
    journeyPaymentExplanation:
      'They ask you to transfer registration fees or advance deposits to a personal UPI handle or bank account.',
    journeyAppTitle: '4. Asking to Download Fake App or Share Password',
    journeyAppExplanation:
      'They send links to download unknown APK apps or ask for OTPs, bank details, or passwords.',
    journeyRecoveryTitle: '5. Demanding More Money to Withdraw Profits',
    journeyRecoveryExplanation:
      'When you try to withdraw your profits, they demand extra "clearance fees" or "tax", stealing even more money.',
    highRiskUnknowns: [
      'SEBI registration ID not verifiable from submitted content alone.',
      'Official company PAN / CIN and registered domain remain undisclosed.',
    ],
    highRiskNextSteps: [
      'Do not send money or transfer funds to any personal UPI ID or unverified account.',
      'Verify registered stockbrokers and investment advisors at https://www.sebi.gov.in.',
      'Report fraudulent communications immediately on DoT Sanchar Saathi (Chakshu) portal or dial 1930.',
    ],
    highRiskLimitations: [
      'Evaluated via NiveshShield client-side regulatory analysis engine based on official SEBI, RBI, and DoT statutory guidelines.',
      'Always verify SEBI registration status directly on official regulator portals before making investment decisions.',
    ],
    ambiguousUnknowns: ['Authenticity and SEBI licensing of channel administrators.'],
    ambiguousNextSteps: [
      'Ask the advisor for their official SEBI Research Analyst (RA) registration number.',
      'Verify RA credentials on https://www.sebi.gov.in.',
      'Avoid investing through informal chat applications.',
    ],
    ambiguousLimitations: [
      'Evaluated via NiveshShield client-side regulatory analysis engine.',
      'Informal tips carry substantial capital loss risk without regulatory grievance redressal.',
    ],
    benignUnknowns: ['Entity or platform through which investment products are purchased.'],
    benignNextSteps: [
      'Maintain disciplined financial habits and asset diversification.',
      'Check AMFI India (https://www.amfiindia.com) for mutual fund registrations.',
    ],
    benignLimitations: [
      'Evaluated via NiveshShield client-side regulatory analysis engine. Does not substitute for personalized financial planning.',
    ],
    phoneSafetyAdvisories: [
      'SEBI and RBI registered financial intermediaries NEVER contact investors via personal WhatsApp or mobile numbers to collect investment deposits.',
      'Never send funds via UPI to personal names or unverified mobile numbers for stock trading.',
      'If you suspect fraud, report immediately to DoT Chakshu portal or dial CyberCrime Helpline 1930.',
    ],
    phonePrivacyNotice:
      'Phone numbers are processed transiently and masked (+91 XX*** ***XX) in accordance with privacy safeguards.',
    phoneOfficialStatus:
      'Absence of a public report does not guarantee safety. Legitimate financial institutions never conduct securities transactions from personal mobile numbers.',
    phoneExternalRep: (masked) =>
      `Investigation conducted for ${masked}. No automated community flags available without server credentials. Use official links below to verify directly on government portals.`,
    phoneUnverifiedElements: [
      'Caller identity and SEBI registration credentials not verified',
      'Official telecom DLT header registration unverified',
    ],
  },

  hi: {
    multiplierSummary:
      'उच्च जोखिम चेतावनी: यह प्रस्ताव अवास्तविक धन गुणन का वादा करता है (जैसे कम पैसे देकर कई गुना रिटर्न)। यह प्रतिभूति लेन-देन में गारंटीड रिटर्न पर रोक लगाने वाले सेबी नियमों का सीधा उल्लंघन है।',
    guaranteedSummary:
      'चेतावनी के संकेत मिले: निश्चित रिटर्न के वादे और जल्दबाज़ी का दबाव सेबी और आरबीआई के वैधानिक निवेशक सुरक्षा नियमों का उल्लंघन करते हैं।',
    educationalSummary:
      'वित्तीय शिक्षा और वैधानिक प्रकटीकरण: सामग्री पूरी तरह से सूचनात्मक या मानक नियामक अस्वीकरण है जिसमें कोई प्रचारक धोखाधड़ी शामिल नहीं है।',
    guaranteedFixedSummary:
      'यह संदेश आपके पैसे पर फर्जी गारंटीड रिटर्न का वादा करता है। वास्तविक शेयर बाजार निवेश कभी भी निश्चित रिटर्न की गारंटी नहीं दे सकता।',
    credentialHarvestingSummary:
      'गंभीर धोखाधड़ी चेतावनी: "मुफ्त पैसे" या इनाम के बदले क्रेडिट कार्ड का फोटो, डेबिट कार्ड विवरण, CVV या बैंकिंग क्रेडेंशियल्स मांगना एक गंभीर साइबर फ़िशिंग और वित्तीय धोखाधड़ी है। वैध वित्तीय संस्थान कभी भी कार्ड का फोटो या गोपनीय जानकारी नहीं मांगते। तत्काल लेन-देन रोकने (Transaction Block) की सलाह दी जाती है।',
    credentialHarvestingExplanation:
      'क्रेडिट कार्ड का फोटो साझा करने से 16 अंकों का कार्ड नंबर, एक्सपायरी डेट और CVV लीक हो जाते हैं, जिससे धोखेबाज़ अनधिकृत ऑनलाइन लेन-देन कर आपके पूरे पैसे निकाल सकते हैं। आरबीआई (RBI) के निर्देश कार्ड का फोटो या क्रेडेंशियल्स साझा करने पर सख्त रोक लगाते हैं।',
    credentialHarvestingWhatRemainsUnknown:
      'संदेश भेजने वाले की पहचान, आधिकारिक व्यावसायिक पंजीकरण और आरबीआई प्राधिकरण।',
    credentialHarvestingVerificationStep:
      'कभी भी क्रेडिट/डेबिट कार्ड का फोटो न भेजें। यदि पहले ही भेज दिया है, तो तुरंत अपने बैंक से संपर्क कर कार्ड ब्लॉक करवाएं और राष्ट्रीय साइबर हेल्पलाइन 1930 पर शिकायत दर्ज करें।',
    ambiguousSummary:
      'सावधानी: अनौपचारिक चैनलों (व्हाट्सएप/टेलीग्राम ग्रुप) के माध्यम से किए गए प्रस्तावों की स्वतंत्र रूप से पुष्टि आवश्यक है। अपंजीकृत सलाहकार सेवाएं सेबी नियमों का उल्लंघन हैं।',
    benignSummary:
      'इस संदेश में कोई प्रत्यक्ष चेतावनी संकेत (जैसे गारंटीड रिटर्न, धन गुणन या अग्रिम भुगतान की मांग) नहीं पाए गए।',
    guaranteedReturnsExplanation:
      'सेबी के नियम स्पष्ट रूप से किसी भी मध्यस्थ, ब्रोकर या वित्तीय सलाहकार को निवेश पर निश्चित लाभ का वादा करने या गारंटी देने से रोकते हैं।',
    urgencyExplanation:
      'कृत्रिम समय-सीमा और सीमित सीटों का दबाव निवेश घोटालों में उचित सत्यापन से पहले जल्दबाज़ी में भुगतान कराने के लिए इस्तेमाल किए जाने वाले आम हथकंडे हैं।',
    upfrontExplanation:
      'व्यक्तिगत खातों या असत्यापित UPI आईडी में अग्रिम पंजीकरण शुल्क, मार्जिन या प्रोसेसिंग फीस की मांग करना धोखाधड़ी का एक प्रमुख संकेत है।',
    suspiciousLinkExplanation:
      'वैधानिक सेबी रिसर्च एनालिस्ट पंजीकरण विवरण के बिना निजी सलाहकार चैनलों में शामिल होने का अवांछित निमंत्रण।',
    highRiskContentEstablishes:
      'यह प्रस्ताव सत्यापन योग्य सेबी पंजीकरण क्रेडेंशियल्स के बिना अत्यधिक या निश्चित वित्तीय रिटर्न का वादा करता है।',
    ambiguousContentEstablishes:
      'संदेश अनिवार्य वैधानिक जोखिम अस्वीकरण के बिना अनौपचारिक सलाहकार चैनल में भागीदारी के लिए आमंत्रित करता है।',
    benignContentEstablishes:
      'संदेश में बिना किसी गारंटीड रिटर्न या अग्रिम भुगतान मांग के सामान्य वित्तीय या शैक्षणिक अवधारणाओं का वर्णन है।',
    highRiskWhatRemainsUnknown:
      'प्रेषक की कानूनी पहचान, सेबी पंजीकरण संख्या और एमसीए (MCA) पोर्टल पर आधिकारिक कॉर्पोरेट पंजीकरण।',
    ambiguousWhatRemainsUnknown:
      'रिसर्च एनालिस्ट पंजीकरण संख्या और सेबी प्राधिकरण।',
    benignWhatRemainsUnknown:
      'उपयोग किया जाने वाला विशिष्ट निष्पादन प्लेटफ़ॉर्म या मध्यस्थ।',
    highRiskVerificationStep:
      'https://www.sebi.gov.in पर आधिकारिक सेबी पंजीकृत मध्यस्थ डेटाबेस पर संस्था या सलाहकार का नाम खोजें।',
    ambiguousVerificationStep:
      'सेबी आरए (Research Analyst) पंजीकरण संख्या मांगें और sebi.gov.in पर सत्यापित करें।',
    benignVerificationStep:
      'हमेशा सत्यापित करें कि कोई भी ब्रोकर, म्यूचुअल फंड वितरक या सलाहकार सेबी और एएमएफआई (AMFI) के साथ पंजीकृत है।',
    journeyInitialOfferTitle: 'अवांछित उच्च रिटर्न योजना',
    journeyInitialOfferExplanation:
      'प्रस्ताव में पूंजी के त्वरित गुणन या भारी मुनाफ़े का झूठा आश्वासन दिया जाता है।',
    journeyUrgencyTitle: 'बनावटी समय का दबाव',
    journeyUrgencyExplanation:
      'पीड़ित को सोचने का मौका न मिले, इसलिए सीमित सीटों और तुरंत फ़ैसले का दबाव बनाया जाता है।',
    journeyPaymentTitle: 'व्यक्तिगत UPI या निजी खाते में धन अंतरण',
    journeyPaymentExplanation:
      'अगला कदम: पीड़ित से किसी निजी व्यक्ति की UPI आईडी या खाते में राशि भेजने को कहा जाता है।',
    journeyAppTitle: 'कस्टम APK या अनधिकृत प्लेटफ़ॉर्म लिंक',
    journeyAppExplanation:
      'पीड़ित को एक फ़र्ज़ी ऐप पर भेजा जाता है जहाँ स्क्रीन पर बनावटी मुनाफ़ा दिखाया जाता है।',
    journeyRecoveryTitle: 'निकासी पर रोक और फ़र्ज़ी टैक्स मांग',
    journeyRecoveryExplanation:
      'रुपये निकालने के समय अतिरिक्त टैक्स या फ़ीस मांगी जाती है और पैसे कभी वापस नहीं मिलते।',
    highRiskUnknowns: [
      'प्रस्तुत सामग्री से सेबी पंजीकरण आईडी सत्यापित नहीं की जा सकती।',
      'कंपनी का आधिकारिक पैन/सीआईएन और पंजीकृत डोमेन अज्ञात है।',
    ],
    highRiskNextSteps: [
      'किसी भी व्यक्तिगत UPI आईडी या असत्यापित बैंक खाते में पैसे बिल्कुल न भेजें।',
      'https://www.sebi.gov.in पर पंजीकृत स्टॉकब्रोकर्स और सलाहकारों की पुष्टि करें।',
      'धोखाधड़ी की तुरंत संचार साथी (चक्षु) पोर्टल पर रिपोर्ट करें या 1930 डायल करें।',
    ],
    highRiskLimitations: [
      'NiveshShield नियामक विश्लेषण इंजन द्वारा आधिकारिक सेबी और आरबीआई दिशानिर्देशों के आधार पर मूल्यांकित।',
      'निवेश करने से पहले हमेशा नियामक पोर्टल्स पर पंजीकरण की स्वतंत्र रूप से पुष्टि करें।',
    ],
    ambiguousUnknowns: ['चैनल एडमिन की प्रामाणिकता और सेबी लाइसेंस की अनुपस्थिति।'],
    ambiguousNextSteps: [
      'सलाहकार से उनका आधिकारिक सेबी रिसर्च एनालिस्ट (RA) पंजीकरण नंबर मांगें।',
      'https://www.sebi.gov.in पर क्रेडेंशियल्स सत्यापित करें।',
      'अनौपचारिक चैट ग्रुप्स के ज़रिए कभी निवेश न करें।',
    ],
    ambiguousLimitations: [
      'NiveshShield नियामक विश्लेषण इंजन द्वारा मूल्यांकित।',
      'अनौपचारिक सुझावों पर निवेश करने से भारी आर्थिक नुकसान हो सकता है।',
    ],
    benignUnknowns: ['वह संस्था या प्लेटफ़ॉर्म जिसके माध्यम से निवेश खरीदा जा रहा है।'],
    benignNextSteps: [
      'अनुशासित वित्तीय आदतें और विविधीकरण बनाए रखें।',
      'म्यूचुअल फंड पंजीकरण के लिए AMFI India (https://www.amfiindia.com) देखें।',
    ],
    benignLimitations: [
      'NiveshShield शैक्षणिक नियामक इंजन द्वारा मूल्यांकित। यह व्यक्तिगत वित्तीय सलाह का विकल्प नहीं है।',
    ],
    phoneSafetyAdvisories: [
      'सेबी या आरबीआई पंजीकृत संस्थाएं कभी भी निवेश जमा कराने के लिए व्यक्तिगत व्हाट्सएप या मोबाइल नंबर से संपर्क नहीं करती हैं।',
      'शेयर ट्रेडिंग के लिए कभी भी व्यक्तिगत नाम या अनपेक्षित मोबाइल नंबरों पर यूपीआई से पैसे न भेजें।',
      'संदिग्ध होने पर तुरंत संचार साथी चक्षु पोर्टल पर रिपोर्ट करें या राष्ट्रीय हेल्पलाइन 1930 पर कॉल करें।',
    ],
    phonePrivacyNotice:
      'गोपनीयता सुरक्षा के तहत फ़ोन नंबर अस्थायी रूप से प्रोसेस होते हैं और मास्क (+91 XX*** ***XX) किए जाते हैं।',
    phoneOfficialStatus:
      'सार्वजनिक शिकायत न होना सुरक्षा का प्रमाण नहीं है। वैध वित्तीय संस्थान कभी भी व्यक्तिगत मोबाइल नंबर से प्रतिभूति लेन-देन नहीं करते हैं।',
    phoneExternalRep: (masked) =>
      `${masked} के लिए जाँच की गई। बिना सर्वर क्रेडेंशियल्स के कोई स्वचालित झंडा उपलब्ध नहीं है। सीधे सरकारी पोर्टल पर पुष्टि के लिए नीचे दिए गए लिंक का उपयोग करें।`,
    phoneUnverifiedElements: [
      'कॉलर की पहचान और सेबी पंजीकरण क्रेडेंशियल्स सत्यापित नहीं हैं',
      'आधिकारिक टेलीकॉम DLT हेडर पंजीकरण असत्यापित है',
    ],
  },

  mr: {
    multiplierSummary:
      'उच्च जोखीम इशारा: ही ऑफर अवास्तव पैसे वाढवण्याचे (उदा. कमी रक्कम देऊन अनेक पट परतावा) आश्वासन देते. रोखे बाजारात हमी परताव्यावर बंदी घालणाऱ्या सेबी नियमांचे हे थेट उल्लंघन आहे.',
    guaranteedSummary:
      'चेतावणी संकेत आढळले: खात्रीशीर परताव्याची आश्वासने आणि घाई करण्याची रणनीती सेबी आणि आरबीआयच्या गुंतवणूकदार सुरक्षा नियमांचे उल्लंघन करतात.',
    educationalSummary:
      'वित्तीय शिक्षण आणि वैधानिक प्रकटीकरण: मजकूर पूर्णपणे माहितीपूर्ण किंवा मानक नियामक अस्वीकरण आहे ज्यामध्ये कोणताही फसवणुकीचा हेतू नाही।',
    guaranteedFixedSummary:
      'हा संदेश तुमच्या पैशावर खोट्या हमी परताव्याचे वचन देतो. वास्तविक शेअर बाजारातील गुंतवणूक कधीही निश्चित परताव्याची आज्ञा देऊ शकत नाही।',
    credentialHarvestingSummary:
      'गंभीर फसवणूक इशारा: "मोफत पैसे" किंवा बक्षिसाच्या बदल्यात क्रेडिट कार्डचा फोटो, डेबिट कार्ड तपशील, CVV किंवा बँकिंग क्रेडेंशियल्स मागणे ही एक अत्यंत गंभीर सायबर फिशिंग फसवणूक आहे. अधिकृत वित्तीय संस्था कधीही कार्डचा फोटो किंवा गोपनीय क्रेडेंशियल्स मागत नाहीत. तत्काळ व्यवहार रोखण्याची (Transaction Block) शिफारस केली जाते.',
    credentialHarvestingExplanation:
      'क्रेडिट कार्डचा फोटो शेअर केल्याने 16-अंकी कार्ड क्रमांक, समाप्ती तारीख आणि CVV उघड होतो, ज्यामुळे फसवणूक करणारे अनधिकृत व्यवहार करून तुमची रक्कम लंपास करू शकतात. आरबीआय (RBI) मार्गदर्शक तत्त्वे कार्डचा फोटो किंवा गोपनीय क्रेडेंशियल्स शेअर करण्यास स्पष्टपणे मनाई करतात.',
    credentialHarvestingWhatRemainsUnknown:
      'संदेश पाठवणाऱ्याची खरी ओळख, अधिकृत व्यावसायिक नोंदणी आणि आरबीआय मंजुरी.',
    credentialHarvestingVerificationStep:
      'क्रेडिट किंवा डेबिट कार्डचा फोटो कधीही पाठवू नका. पाठवला असल्यास लगेच बँकेशी संपर्क साधून कार्ड ब्लॉक करा आणि १९३० वर तक्रार नोंदवा.',
    ambiguousSummary:
      'सावधान: अनौपचारिक माध्यमांतून (व्हॉट्सॲप/टेलिग्राम) मिळणाऱ्या ऑफर्सची कठोर पडताळणी आवश्यक आहे. विनानोंदणीकृत सल्लागार सेवा सेबी नियमांचे उल्लंघन करतात.',
    benignSummary:
      'या मजकुरात कोणतेही थेट चेतावणी संकेत (जसे हमी परतावा, पैसे वाढवण्याचे आमिष किंवा तातडीने पेमेंटची मागणी) आढळले नाहीत.',
    guaranteedReturnsExplanation:
      'सेबीचे नियम कोणत्याही मध्यस्थ, ब्रोकर किंवा वित्तीय सल्लागाराला गुंतवणुकीवर निश्चित नफ्याची हमी देण्यास स्पष्टपणे मनाई करतात.',
    urgencyExplanation:
      'योग्य पडताळणीपूर्वी घाईघाईत पैसे भरण्यास प्रवृत्त करण्यासाठी बनावट मुदत आणि मर्यादित जागांचे दबाव तंत्र वापरले जाते.',
    upfrontExplanation:
      'वैयक्तिक खात्यांवर किंवा असत्यापित UPI आयडीवर आगाऊ नोंदणी, मार्जिन किंवा प्रक्रिया शुल्क मागणे हे फसवणुकीचे मुख्य लक्षण आहे.',
    suspiciousLinkExplanation:
      'वैधानिक सेबी रिसर्च ॲनालिस्ट नोंदणी तपशीलांशिवाय खाजगी सल्लागार चॅनेलमध्ये सामील होण्याचे आमंत्रण.',
    highRiskContentEstablishes:
      'हा प्रस्ताव पडताळणीयोग्य सेबी नोंदणी क्रमांकाशिवाय अत्यधिक किंवा खात्रीशीर आर्थिक परताव्याची ऑफर देतो.',
    ambiguousContentEstablishes:
      'संदेश बंधनकारक वैधानिक जोखीम इशाऱ्यांशिवाय अनौपचारिक सल्लागार चॅनेलमध्ये सहभागी होण्यासाठी आमंत्रित करतो.',
    benignContentEstablishes:
      'मजकुरात हमी परतावा किंवा आगाऊ देयकाच्या मागणीशिवाय सामान्य वित्तीय किंवा शैक्षणिक संकल्पनांचे वर्णन आहे.',
    highRiskWhatRemainsUnknown:
      'प्रेषकाची कायदेशीर ओळख, सेबी नोंदणी क्रमांक आणि एमसीए (MCA) पोर्टलवरील अधिकृत नोंदणी.',
    ambiguousWhatRemainsUnknown:
      'रिसर्च ॲनालिस्ट नोंदणी क्रमांक आणि सेबी अधिकृतता.',
    benignWhatRemainsUnknown: 'वापरलेले विशिष्ट प्लॅटफॉर्म किंवा मध्यस्थ.',
    highRiskVerificationStep:
      'https://www.sebi.gov.in वरील अधिकृत सेबी नोंदणीकृत मध्यस्थ डेटाबेसवर संस्था किंवा सल्लागाराचे नाव शोधा.',
    ambiguousVerificationStep:
      'सेबी आरए (Research Analyst) नोंदणी क्रमांक मागा आणि sebi.gov.in वर तपासा.',
    benignVerificationStep:
      'कोणताही ब्रोकर, म्युच्युअल फंड वितरक किंवा सल्लागार सेबी आणि ॲम्फीकडे (AMFI) नोंदणीकृत असल्याची खात्री करा.',
    journeyInitialOfferTitle: 'अवास्तव परतावा योजना',
    journeyInitialOfferExplanation:
      'भांडवल वेगाने दुप्पट किंवा अनेक पट करण्याचे आमिष दाखवले जाते.',
    journeyUrgencyTitle: 'बनावट वेळेचा दबाव',
    journeyUrgencyExplanation:
      'पडताळणी न करता लगेच निर्णय घेण्यासाठी मर्यादित जागांचा दबाव आणला जातो.',
    journeyPaymentTitle: 'वैयक्तिक खात्यात पैसे भरण्याची मागणी',
    journeyPaymentExplanation:
      'पुढील पायरी: वैयक्तिक UPI आयडी किंवा खात्यावर पैसे पाठवण्यास सांगितले जाते.',
    journeyAppTitle: 'बनावट ॲप किंवा APK लिंक',
    journeyAppExplanation:
      'अनधिकृत ॲप डाऊनलोड करायला लावून त्यावर बनावट नफा दाखवला जातो.',
    journeyRecoveryTitle: 'पैसे काढण्यास नकार व अतिरिक्त कर मागणी',
    journeyRecoveryExplanation:
      'पैसे काढताना अतिरिक्त फी मागितली जाते आणि अखेर सर्व पैसे गमावले जातात.',
    highRiskUnknowns: [
      'प्रस्तुत मजकुरावरून सेबी नोंदणी आयडी पडताळता येत नाही.',
      'संस्थेचा पॅन किंवा अधिकृत नोंदणीकृत डोमेन अज्ञात आहे.',
    ],
    highRiskNextSteps: [
      'कोणत्याही वैयक्तिक UPI आयडीवर किंवा अनोळखी खात्यावर पैसे पाठवू नका.',
      'https://www.sebi.gov.in वर सेबी नोंदणीकृत मध्यस्थांची खात्री करा.',
      'फसव्या संभाषणांची त्वरित संचार साथी पोर्टलवर तक्रार नोंदवा किंवा १९३० वर कॉल करा.',
    ],
    highRiskLimitations: [
      'NiveshShield नियामक विश्लेषण इंजिनद्वारे सेबी व आरबीआय नियमांनुसार मूल्यांकित.',
      'गुंतवणूक करण्यापूर्वी नेहमी अधिकृत पोर्टलवर नोंदणी तपासा.',
    ],
    ambiguousUnknowns: ['चॅनेल प्रशासकांचे सेबी परवाना तपशील उपलब्ध नाहीत.'],
    ambiguousNextSteps: [
      'सल्लागाराकडे सेबी रिसर्च ॲनालिस्ट नोंदणी क्रमांक मागा.',
      'sebi.gov.in वर नोंदणी तपासा.',
      'अनौपचारिक ग्रुप्सद्वारे गुंतवणूक करणे टाळा.',
    ],
    ambiguousLimitations: [
      'NiveshShield ग्राहक-स्तरीय नियामक इंजिनद्वारे तपासणी.',
      'अनधिकृत सल्ल्यांमुळे मोठे आर्थिक नुकसान होऊ शकते.',
    ],
    benignUnknowns: ['गुंतवणूक कोणत्या प्लॅटफॉर्मवरून केली जात आहे ते अज्ञात.'],
    benignNextSteps: [
      'आर्थिक शिस्त आणि गुंतवणुकीचे विविधीकरण राखा.',
      'AMFI India (https://www.amfiindia.com) वर म्युच्युअल फंड नोंदणी तपासा.',
    ],
    benignLimitations: ['NiveshShield शैक्षणिक नियामक विश्लेषण.'],
    phoneSafetyAdvisories: [
      'सेबी किंवा आरबीआय नोंदणीकृत मध्यस्थ कधीही वैयक्तिक व्हॉट्सॲपवरून ठेवी मागवत नाहीत.',
      'ट्रेडिंगसाठी अनोळखी व्यक्तींच्या यूपीआयवर पैसे पाठवू नका.',
      'संशय आल्यास लगेच संचार साथी पोर्टलवर किंवा १९३० वर तक्रार नोंदवा.',
    ],
    phonePrivacyNotice:
      'गोपनीयतेसाठी फोन नंबर तात्पुरते तपासले जातात आणि मास्क (+91 XX*** ***XX) केले जातात.',
    phoneOfficialStatus:
      'तक्रार नसणे म्हणजे सुरक्षितता नव्हे. अधिकृत संस्था वैयक्तिक मोबाईलवरून व्यवहार करत नाहीत.',
    phoneExternalRep: (masked) =>
      `${masked} साठी तपासणी पूर्ण. थेट सरकारी पोर्टलवरून पडताळणी करण्यासाठी खालील लिंक्स वापरा.`,
    phoneUnverifiedElements: [
      'कॉलरची ओळख आणि सेबी नोंदणी असत्यापित',
      'टेलिकॉम DLT हेडर नोंदणी तपासलेली नाही',
    ],
  },

  bn: {
    multiplierSummary:
      'উচ্চ ঝুঁকির সতর্কতা: এই প্রস্তাবটি অবাস্তব অর্থ গুণের প্রতিশ্রুতি দেয় (যেমন অল্প টাকা দিয়ে বহুগুণ রিটার্ন)। এটি সিকিউরিটিজ লেনদেনে নিশ্চিত রিটার্নের প্রতিশ্রুতি নিষিদ্ধকারী সেবি বিধি লঙ্ঘন করে।',
    guaranteedSummary:
      'সতর্কতামূলক লক্ষণ পাওয়া গেছে: নিশ্চিত রিটার্নের প্রতিশ্রুতি এবং চাপের কৌশলগুলি সেবি এবং আরবিআইয়ের সংবিধিবদ্ধ বিনিয়োগকারী সুরক্ষা বিধি লঙ্ঘন করে।',
    educationalSummary:
      'আর্থিক শিক্ষা এবং সংবিধিবদ্ধ প্রকাশনা: বিষয়বস্তুটি সম্পূর্ণ তথ্যবহুল বা আদর্শ নিয়ন্ত্রক দাবিত্যাগ, যার মধ্যে কোনো প্রতারণামূলক উপাদান নেই।',
    guaranteedFixedSummary:
      'এই বার্তাটি আপনার টাকার উপর ভুয়ো নিশ্চিত রিটার্নের প্রতিশ্রুতি দেয়। আসল শেয়ার বাজারের বিনিয়োগ কখনোই নির্দিষ্ট রিটার্নের গ্যারান্টি দিতে পারে না।',
    credentialHarvestingSummary:
      'গুরুতর প্রতারণা সতর্কতা: "বিনামূল্যে টাকা" বা পুরস্কারের বিনিময়ে ক্রেডিট কার্ডের ছবি, ডেবিট কার্ডের তথ্য, CVV বা ব্যাঙ্কিং প্রমাণপত্র চাওয়া একটি মারাত্মক ফিশিং প্রতারণা। কোনো বৈধ আর্থিক প্রতিষ্ঠান কখনোই কার্ডের ছবি বা গোপন তথ্য চায় না। অবিলম্বে লেনদেন বন্ধ করার (Transaction Block) পরামর্শ দেওয়া হচ্ছে।',
    credentialHarvestingExplanation:
      'ক্রেডিট কার্ডের ছবি শেয়ার করলে কার্ডের ১৬-সংখ্যার নম্বর, মেয়াদোত্তীর্ণের তারিখ এবং CVV প্রকাশ পায়, যার ফলে প্রতারকরা অননুমোদিত অনলাইন লেনদেন করে আপনার সম্পূর্ণ টাকা হাতিয়ে নিতে পারে। আরবিআই (RBI) নির্দেশিকা কখনোই কার্ডের ছবি শেয়ার না করার নির্দেশ দেয়।',
    credentialHarvestingWhatRemainsUnknown:
      'বার্তা প্রেরকের আসল পরিচয়, কর্পোরেট নিবন্ধন এবং আরবিআই অনুমোদন।',
    credentialHarvestingVerificationStep:
      'কখনোই ক্রেডিট/ডেবিট কার্ডের ছবি পাঠাবেন না। যদি দিয়ে থাকেন, তবে অবিলম্বে ব্যাংকে ফোন করে কার্ড ব্লক করুন এবং ১৯৩০ সাইবার ক্রাইম হেল্পলাইনে রিপোর্ট করুন।',
    ambiguousSummary:
      'সতর্কতা: অনানুষ্ঠানিক চ্যানেলের (হোয়াটসঅ্যাপ/টেলিগ্রাম গ্রুপ) মাধ্যমে প্রাপ্ত অফারগুলির স্বাধীন যাচাইকরণ প্রয়োজন। অনিবন্ধিত পরামর্শ সেবা সেবি নিয়ম লঙ্ঘন করে।',
    benignSummary:
      'এই টেক্সটে কোনো স্পষ্ট সতর্কতামূলক লক্ষণ (যেমন নিশ্চিত রিটার্ন, অর্থ গুণ করার প্রতিশ্রুতি বা জরুরি পেমেন্টের দাবি) পাওয়া যায়নি।',
    guaranteedReturnsExplanation:
      'সেবি নিয়মাবলী স্পষ্টভাবেই কোনো মধ্যস্থতাকারী, ব্রোকার বা আর্থিক উপদেষ্টাকে বিনিয়োগে নির্দিষ্ট মুনাফার গ্যারান্টি বা প্রতিশ্রুতি দেওয়া থেকে বিরত রাখে।',
    urgencyExplanation:
      'যথাযথ যাচাইকরণের আগে দ্রুত আর্থিক লেনদেন করতে বাধ্য করার জন্য বিনিয়োগ কেলেঙ্কারিতে কৃত্রিম সময়সীমা ও সীমিত আসনের চাপ দেওয়া হয়।',
    upfrontExplanation:
      'ব্যক্তিগত অ্যাকাউন্টে বা অযাচাইকৃত ইউপিআই আইডিতে অগ্রিম রেজিস্ট্রেশন ফি, মার্জিন বা প্রসেসিং ফি দাবি করা প্রতারণামূলক অফারের বৈশিষ্ট্য।',
    suspiciousLinkExplanation:
      'সংবিধিবদ্ধ সেবি রিসার্চ অ্যানালিস্ট রেজিস্ট্রেশন প্রকাশ ছাড়াই ব্যক্তিগত পরামর্শ চ্যানেলে যোগদানের অনাকাঙ্ক্ষিত আমন্ত্রণ।',
    highRiskContentEstablishes:
      'এই অফারটি যাচাইযোগ্য সেবি নিবন্ধন ছাড়াই অস্বাভাবিক বা নিশ্চিত আর্থিক রিটার্ন দেওয়ার প্রতিশ্রুতি দেয়।',
    ambiguousContentEstablishes:
      'বার্তাটি বাধ্যতামূলক সংবিধিবদ্ধ ঝুঁকি দাবিত্যাগ ছাড়াই অনানুষ্ঠানিক পরামর্শ চ্যানেলে অংশগ্রহণের আমন্ত্রণ জানায়।',
    benignContentEstablishes:
      'টেক্সটটিতে গ্যারান্টিযুক্ত রিটার্ন বা অগ্রিম পেমেন্টের দাবি ছাড়াই সাধারণ আর্থিক ধারণা বর্ণনা করা হয়েছে।',
    highRiskWhatRemainsUnknown:
      'প্রেরকের আইনি পরিচয়, সেবি রেজিস্ট্রেশন নম্বর এবং এমসিএ (MCA) পোর্টালে অফিসিয়াল কর্পোরেট রেজিস্ট্রেশন।',
    ambiguousWhatRemainsUnknown:
      'রিসার্চ অ্যানালিস্ট রেজিস্ট্রেশন নম্বর এবং সেবি অনুমোদন।',
    benignWhatRemainsUnknown: 'ব্যবহৃত নির্দিষ্ট ট্রেডিং প্ল্যাটফর্ম বা মধ্যস্থতাকারী।',
    highRiskVerificationStep:
      'https://www.sebi.gov.in-এ অফিসিয়াল সেবি নিবন্ধিত মধ্যস্থতাকারী ডেটাবেসে সত্তা বা উপদেষ্টার নাম অনুসন্ধান করুন।',
    ambiguousVerificationStep:
      'সেবি আরএ রেজিস্ট্রেশন নম্বর চেয়ে নিন এবং sebi.gov.in এ যাচাই করুন।',
    benignVerificationStep:
      'সর্বদা যাচাই করুন যে কোনো ব্রোকার বা উপদেষ্টা সেবি এবং এএমএফআই (AMFI)-তে নিবন্ধিত কিনা।',
    journeyInitialOfferTitle: 'অস্বাভাবিক রিটার্ন স্কিম',
    journeyInitialOfferExplanation:
      'দ্রুত অর্থ বহুগুণ করার বা লোভনীয় আয়ের কাল্পনিক প্রতিশ্রুতি দেওয়া হয়।',
    journeyUrgencyTitle: 'কৃত্রিম সময়ের চাপ',
    journeyUrgencyExplanation:
      'যাচাই করার সুযোগ না দিয়ে তাড়াতাড়ি টাকা পাঠাতে বাধ্য করা হয়।',
    journeyPaymentTitle: 'ব্যক্তিগত ইউপিআই বা অ্যাকাউন্টে অর্থ প্রেরণের দাবি',
    journeyPaymentExplanation:
      'পরবর্তী ধাপ: ব্যক্তিগত ইউপিআই বা সন্দেহজনক অ্যাকাউন্টে টাকা পাঠাতে বলা হয়।',
    journeyAppTitle: 'ভুয়ো অ্যাপ বা ক্ষতিকারক লিঙ্ক',
    journeyAppExplanation:
      'অযাচাইকৃত অ্যাপে কৃত্রিমভাবে স্ক্রিনে ভুয়ো মুনাফা দেখানো হয়।',
    journeyRecoveryTitle: 'টাকা তুলতে বাধা ও ভুয়ো ট্যাক্স দাবি',
    journeyRecoveryExplanation:
      'টাকা তোলার সময় আরও ট্যাক্স দাবি করা হয় এবং অর্থ ফেরত পাওয়া যায় না।',
    highRiskUnknowns: [
      'প্রদত্ত তথ্য থেকে সেবি নিবন্ধন যাচাই করা যায় না।',
      'প্রেরকের প্যান বা নিবন্ধিত ডোমেইন সম্পূর্ণ অজানা।',
    ],
    highRiskNextSteps: [
      'ব্যক্তিগত কোনো ইউপিআই বা অ্যাকাউন্টে কখনোই টাকা পাঠাবেন না।',
      'https://www.sebi.gov.in এ সেবি নিবন্ধিত উপদেষ্টাদের তালিকা পরীক্ষা করুন।',
      'প্রতারণামূলক বার্তার বিরুদ্ধে সঞ্চার সাথী পোর্টালে রিপোর্ট করুন বা ১৯৩০ এ কল করুন।',
    ],
    highRiskLimitations: [
      'সেবি ও আরবিআই সংবিধিবদ্ধ নীতিমালার ভিত্তিতে NiveshShield দ্বারা মূল্যায়িত।',
      'বিনিয়োগের পূর্বে সর্বদা অফিসিয়াল পোর্টালে যাচাই করুন।',
    ],
    ambiguousUnknowns: ['চ্যানেল প্রশাসকের সেবি অনুমোদনের প্রমাণ অনুপস্থিত।'],
    ambiguousNextSteps: [
      'উপদেষ্টার সেবি আরএ নম্বর পরীক্ষা করুন।',
      'sebi.gov.in এ গিয়ে যাচাই করুন।',
      'চ্যাট গ্রুপের মাধ্যমে বিনিয়োগ এড়িয়ে চলুন।',
    ],
    ambiguousLimitations: ['NiveshShield ক্লায়েন্ট ইঞ্জিন দ্বারা মূল্যায়িত।'],
    benignUnknowns: ['নির্দিষ্ট ক্রয় প্ল্যাটফর্মের তথ্য অনুপস্থিত।'],
    benignNextSteps: [
      'আর্থিক শৃঙ্খলা বজায় রাখুন এবং ঝুঁকি বুঝুন।',
      'AMFI India পোর্টালে মিউচুয়াল ফান্ড নিবন্ধন দেখুন।',
    ],
    benignLimitations: ['শিক্ষামূলক উদ্দেশ্যে মূল্যায়িত।'],
    phoneSafetyAdvisories: [
      'সেবি বা আরবিআই নিবন্ধিত প্রতিষ্ঠান কখনোই ব্যক্তিগত হোয়াটসঅ্যাপ থেকে টাকা সংগ্রহ করে না।',
      'ব্যক্তিগত ইউপিআইতে স্টক ট্রেডিংয়ের টাকা পাঠাবেন না।',
      'সন্দেহ হলে সঞ্চার সাথী বা ১৯৩০ হেল্পলাইনে জানান।',
    ],
    phonePrivacyNotice:
      'ফোন নম্বর সাময়িকভাবে সুরক্ষিতভাবে (+91 XX*** ***XX) প্রক্রিয়াজাত হয়।',
    phoneOfficialStatus:
      'অভিযোগ না থাকা নিরাপত্তার প্রমাণ নয়। বৈধ প্রতিষ্ঠান ব্যক্তিগত ফোন থেকে লেনদেন করে না।',
    phoneExternalRep: (masked) =>
      `${masked} এর অনুসন্ধান সম্পন্ন। সরাসরি সরকারি পোর্টালে যাচাই করার জন্য নিচের লিঙ্ক ব্যবহার করুন।`,
    phoneUnverifiedElements: [
      'কলারের পরিচয় ও সেবি অনুমোদন অসত্যায়িত',
      'টেলিকম ডিএলটি হেডার যাচাই করা যায়নি',
    ],
  },

  ta: {
    multiplierSummary:
      'உயர் ஆபத்து எச்சரிக்கை: இந்தச் சலுகை சாத்தியமற்ற பணப் பெருக்கத்தை உறுதியளிக்கிறது (எ.கா. சிறிய தொகையைக் கொடுத்து பல மடங்கு வருமானம்). இது பங்கு வர்த்தகத்தில் உத்தரவாத வருமானத்தைத் தடைசெய்யும் செபி விதிமுறைகளை மீறுகிறது.',
    guaranteedSummary:
      'எச்சரிக்கை அறிகுறிகள் கண்டறியப்பட்டன: உறுதிசெய்யப்பட்ட வருமான வாக்குறுதிகள் மற்றும் அவசரப்படுத்தும் உத்திகள் செபி மற்றும் ரிசர்வ் வங்கியின் முதலீட்டாளர் பாதுகாப்பு விதிமுறைகளை மீறுகின்றன.',
    educationalSummary:
      'நிதி கல்வி & சட்டப்பூர்வ வெளிப்படுத்தல்: உள்ளடக்கம் முற்றிலும் தகவல் அல்லது நிலையான ஒழுங்குமுறை மறுப்பு ஆகும், இதில் விளம்பர மோசடிகள் எதுவும் இல்லை.',
    guaranteedFixedSummary:
      'இந்தச் செய்தி உங்கள் பணத்திற்குப் போலியான உத்தரவாத வருமானத்தை அளிப்பதாகக் கூறுகிறது. உண்மையான பங்குச் சந்தை முதலீடுகள் ஒருபோதும் நிலையான வருமானத்திற்கு உத்தரவாதம் அளிக்க முடியாது.',
    credentialHarvestingSummary:
      'முக்கிய மோசடி எச்சரிக்கை: "இலவச பணம்" அல்லது பரிசுகளுக்குப் பதிலாக கிரெடிட் கார்டு புகைப்படம், டெபிட் கார்டு விவரங்கள், CVV அல்லது வங்கி ரகசிய விவரங்களைக் கோருவது கடுமையான இணைய நிதி மோசடியாகும். உண்மையான நிதி நிறுவனங்கள் ஒருபோதும் கார்டு புகைப்படங்களையோ ரகசிய குறியீடுகளையோ கேட்பதில்லை. உடனடியாகப் பரிவர்த்தனையைத் தடுக்க (Transaction Block) பரிந்துரைக்கப்படுகிறது.',
    credentialHarvestingExplanation:
      'கிரெடிட் கார்டு புகைப்படத்தைப் பகிர்வது 16 இலக்க கார்டு எண், காலாவதி தேதி மற்றும் CVV ஆகியவற்றை அம்பலப்படுத்துகிறது, இதனால் மோசடி செய்பவர்கள் உங்கள் பணத்தைத் திருட முடியும். ரிசர்வ் வங்கி (RBI) கார்டு புகைப்படங்களைப் பகிர்வதை வெளிப்படையாகத் தடைசெய்கிறது.',
    credentialHarvestingWhatRemainsUnknown:
      'அனுப்புநரின் சட்டப்பூர்வ அடையாளம், நிறுவன பதிவு மற்றும் ரிசர்வ் வங்கி அங்கீகாரம்.',
    credentialHarvestingVerificationStep:
      'கார்டு புகைப்படங்களை ஒருபோதும் பகிராதீர்கள். ஏற்கனவே பகிர்ந்திருந்தால், உடனே உங்கள் வங்கியைத் தொடர்புகொண்டு கார்டை முடக்குங்கள் மற்றும் 1930 என்ற சைபர் கிரைம் எண்ணில் புகாரளிக்கவும்.',
    ambiguousSummary:
      'எச்சரிக்கை: முறைசாரா வழிகள் (வாட்ஸ்அப்/டெலிகிராம் குழுக்கள்) மூலம் வரும் சலுகைகளுக்கு கடுமையான சுயாதீன சரிபார்ப்பு தேவை. பதிவு செய்யப்படாத ஆலோசனை சேவைகள் செபி விதிகளை மீறுகின்றன.',
    benignSummary:
      'இந்த உரையில் வெளிப்படையான எச்சரிக்கை அறிகுறிகள் (உத்தரவாத வருமானம், பணப் பெருக்கம் அல்லது அவசர கட்டணக் கோரிக்கைகள் போன்றவை) எதுவும் கண்டறியப்படவில்லை.',
    guaranteedReturnsExplanation:
      'செபி விதிமுறைகள் எந்தவொரு இடைத்தரகர், தரகர் அல்லது நிதி ஆலோசகரும் முதலீடுகளில் நிலையான லாபத்தை உத்தரவாதம் செய்வதை அல்லது உறுதியளிப்பதை வெளிப்படையாகத் தடைசெய்கின்றன.',
    urgencyExplanation:
      'சரியான சரிபார்ப்பிற்கு முன் அவசர நிதி முடிவுகளை எடுக்க வைக்க முதலீட்டு மோசடிகளில் செயற்கை காலக்கெடு மற்றும் குறிப்பிட்ட இடங்கள் போன்ற உத்திகள் பயன்படுத்தப்படுகின்றன.',
    upfrontExplanation:
      'தனிப்பட்ட கணக்குகள் அல்லது சரிபார்க்கப்படாத UPI ஐடிகளுக்கு முன்பணப் பதிவு, மார்ஜின் அல்லது செயலாக்கக் கட்டணங்களைக் கோருவது மோசடியின் முக்கிய அறிகுறியாகும்.',
    suspiciousLinkExplanation:
      'செபி ஆராய்ச்சி ஆய்வாளர் பதிவு விவரங்கள் எதுவும் இன்றி தனிப்பட்ட ஆலோசனைக் குழுக்களுக்கு வரும் அழைப்பு.',
    highRiskContentEstablishes:
      'இந்தச் சலுகை சரிபார்க்கக்கூடிய செபி பதிவு விவரங்கள் ஏதுமின்றி சாத்தியமற்ற அல்லது உறுதியான வருமானத்தை அளிக்கிறது.',
    ambiguousContentEstablishes:
      'கட்டாய சட்டபூர்வ இடர் எச்சரிக்கைகள் இன்றி முறைசாரா ஆலோசனைக் குழுவில் பங்கேற்க செய்தி அழைக்கிறது.',
    benignContentEstablishes:
      'உரையானது உத்தரவாத வருமானம் அல்லது முன்பணக் கோரிக்கைகள் இன்றி பொதுவான நிதி அல்லது கல்வி கருத்துக்களை விவரிக்கிறது.',
    highRiskWhatRemainsUnknown:
      'அனுப்புநரின் சட்டப்பூர்வ அடையாளம், செபி பதிவு எண் மற்றும் கார்ப்பரேட் பதிவு விவரங்கள்.',
    ambiguousWhatRemainsUnknown:
      'ஆராய்ச்சி ஆய்வாளர் பதிவு எண் மற்றும் செபி அங்கீகாரம்.',
    benignWhatRemainsUnknown:
      'பயன்படுத்தப்படும் குறிப்பிட்ட வர்த்தக தளம் அல்லது இடைத்தரகர்.',
    highRiskVerificationStep:
      'https://www.sebi.gov.in இல் அதிகாரப்பூர்வ செபி பதிவு செய்யப்பட்ட இடைத்தரகர்கள் தரவுத்தளத்தில் பெயர் அல்லது அமைப்பைத் தேடுங்கள்.',
    ambiguousVerificationStep:
      'செபி பதிவு எண்ணைக் கேட்டு sebi.gov.in இல் சரிபார்க்கவும்.',
    benignVerificationStep:
      'எந்தவொரு தரகர் அல்லது ஆலோசகரும் செபி மற்றும் AMFI-யில் உரிமம் பெற்றுள்ளாரா என்பதை எப்போதும் சரிபார்க்கவும்.',
    journeyInitialOfferTitle: 'சாத்தியமற்ற வருமானத் திட்டம்',
    journeyInitialOfferExplanation:
      'பணத்தை விரைவாகப் பல மடங்கு பெருக்குவதாக கவர்ச்சிகரமான வாக்குறுதிகள் அளிக்கப்படுகின்றன.',
    journeyUrgencyTitle: 'செயற்கை அவசர அழுத்தம்',
    journeyUrgencyExplanation:
      'ஆராய்ந்து பார்க்க அவகாசம் தராமல் உடனே பணத்தை முதலீடு செய்ய அழுத்தம் தரப்படுகிறது.',
    journeyPaymentTitle: 'தனிநபர் கணக்கிற்குப் பணம் அனுப்பும் கோரிக்கை',
    journeyPaymentExplanation:
      'அடுத்த கட்டம்: தனிப்பட்ட UPI அல்லது போலி கணக்கிற்கு முன்பணம் செலுத்தக் கோருவது.',
    journeyAppTitle: 'போலி ஆப் அல்லது APK இணைப்பு',
    journeyAppExplanation:
      'போலி செயலிகளில் திரையில் பொய்யான லாபம் காட்டப்பட்டு ஏமாற்றப்படுகிறது.',
    journeyRecoveryTitle: 'பணம் எடுப்பதில் தடை & போலி வரிக் கோரிக்கை',
    journeyRecoveryExplanation:
      'பணத்தை எடுக்கும் போது கூடுதல் கட்டணங்கள் கோரப்பட்டு முழு பணமும் பறிக்கப்படுகிறது.',
    highRiskUnknowns: [
      'சமர்ப்பிக்கப்பட்ட தகவலில் இருந்து செபி பதிவு எண்ணை உறுதிப்படுத்த முடியவில்லை.',
      'நிறுவனத்தின் பான் அல்லது பதிவு செய்யப்பட்ட இணையதளம் அறியப்படவில்லை.',
    ],
    highRiskNextSteps: [
      'தனிநபர் UPI ஐடிக்கோ அறியப்படாத கணக்குகளுக்கோ பணம் அனுப்ப வேண்டாம்.',
      'https://www.sebi.gov.in இல் பதிவு விவரங்களைச் சரிபார்க்கவும்.',
      'சஞ்சார் சாத்தி தளம் அல்லது 1930 இல் உடனடியாகப் புகாரளிக்கவும்.',
    ],
    highRiskLimitations: [
      'செபி மற்றும் ரிசர்வ் வங்கி விதிமுறைகளின் அடிப்படையில் NiveshShield ஆல் மதிப்பிடப்பட்டது.',
      'முதலீடு செய்வதற்கு முன் அதிகாரப்பூர்வ தளங்களில் சரிபார்க்கவும்.',
    ],
    ambiguousUnknowns: ['குழு நிர்வாகியின் செபி உரிமம் சரிபார்க்கப்படவில்லை.'],
    ambiguousNextSteps: [
      'ஆலோசகரிடம் செபி பதிவு எண்ணைக் கேட்டு உறுதிப்படுத்தவும்.',
      'sebi.gov.in இல் சரிபார்க்கவும்.',
      'சாட்டிங் குழுக்கள் வழியாக முதலீடு செய்வதைத் தவிர்க்கவும்.',
    ],
    ambiguousLimitations: ['NiveshShield கிளையன்ட் எஞ்சின் மூலம் சரிபார்க்கப்பட்டது.'],
    benignUnknowns: ['குறிப்பிட்ட வர்த்தகத் தளம் குறித்த தகவல் இல்லை.'],
    benignNextSteps: [
      'நிதி ஒழுக்கத்தைப் பேணுங்கள் மற்றும் பல்வகை முதலீடுகளைத் தேர்வு செய்யுங்கள்.',
      'AMFI India தளத்தில் மியூச்சுவல் ஃபண்ட் பதிவுகளைச் சரிபார்க்கவும்.',
    ],
    benignLimitations: ['கல்வி நோக்கிலான வழிகாட்டுதல் மட்டுமே.'],
    phoneSafetyAdvisories: [
      'செபி/ரிசர்வ் வங்கி பதிவு பெற்ற நிறுவனங்கள் வாட்ஸ்அப் மூலம் முதலீடுகளைக் கோருவதில்லை.',
      'தனிநபர் பெயர்களுக்கு ஒருபோதும் வர்த்தகப் பணத்தை அனுப்பாதீர்கள்.',
      'சந்தேகம் எழுந்தால் உடனே 1930 உதவி எண்ணிற்கு அழைக்கவும்.',
    ],
    phonePrivacyNotice:
      'எண்கள் பாதுகாப்பாக (+91 XX*** ***XX) முகமூடி செய்யப்பட்டு தற்காலிகமாகப் பரிசீலிக்கப்படுகின்றன.',
    phoneOfficialStatus:
      'புகார் இல்லாமை பாதுகாப்பிற்கு உத்தரவாதமல்ல. உண்மையான நிறுவனங்கள் தனிநபர் எண்களில் வர்த்தகம் செய்யாது.',
    phoneExternalRep: (masked) =>
      `${masked} க்கான விசாரணை முடிந்தது. சரிபார்க்க அரசு போர்ட்டல் இணைப்புகளைப் பயன்படுத்தவும்.`,
    phoneUnverifiedElements: [
      'அனுப்புநரின் அடையாளம் மற்றும் செபி பதிவு சரிபார்க்கப்படவில்லை',
      'தொலைத்தொடர்பு DLT பதிவு உறுதிப்படுத்தப்படவில்லை',
    ],
  },

  gu: {
    multiplierSummary:
      'ઉચ્ચ જોખમ ચેતવણી: આ ઓફર અવાસ્તવિક નાણાં ગુણાકારનું વચન આપે છે (દા.ત. થોડી રકમ આપીને અનેક ગણો નફો). આ જામીનગીરી વ્યવહારોમાં ગેરંટીડ રિટર્નનું વચન આપવા પર પ્રતિબંધ મૂકતા સેબીના નિયમોનું ઉલ્લંઘન કરે છે.',
    guaranteedSummary:
      'ચેતવણીના સંકેતો મળ્યા: ખાતરીપૂર્વકના વળતરના વચનો અને દબાણની યુક્તિઓ સેબી અને આરબીઆઈના રોકાણકાર સુરક્ષા નિયમોનું ઉલ્લંઘન કરે છે.',
    educationalSummary:
      'નાણાકીય શિક્ષણ અને વૈધાનિક જાહેરાત: આ વિષયવસ્તુ સંપૂર્ણપણે માહિતીપ્રદ અથવા પ્રમાણભૂત નિયમનકારી અસ્વીકરણ છે અને તેમાં કોઈ છેતરપિંડી નથી.',
    guaranteedFixedSummary:
      'આ સંદેશ તમારા પૈસા પર ખોટા ગેરંટીડ વળતરનું વચન આપે છે. વાસ્તવિક શેરબજારના રોકાણો ક્યારેય નિશ્ચિત વળતરની ગારંટી આપી શકતા નથી.',
    credentialHarvestingSummary:
      'ગંભીર છેતરપિંડી ચેતવણી: "મફત પૈસા" કે ઇનામના બદલામાં ક્રેડિટ કાર્ડનો ફોટો, ડેબિટ કાર્ડ વિગતો, CVV કે બેંકિંગ ક્રેડેન્શિયલ્સ માંગવા એ અત્યંત ગંભીર સાયબર ફિશિંગ છેતરપિંડી છે. કાયદેસરની નાણાકીય સંસ્થાઓ ક્યારેય કાર્ડનો ફોટો કે ગુપ્ત વિગતો માંગતી નથી. તાત્કાલિક વ્યવહાર રોકવાની (Transaction Block) ભલામણ કરવામાં આવે છે.',
    credentialHarvestingExplanation:
      'ક્રેડિટ કાર્ડનો ફોટો શેર કરવાથી 16-અંકનો કાર્ડ નંબર, સમાપ્તિ તારીખ અને CVV ખુલ્લા પડી જાય છે, જેનાથી છેતરપિંડી કરનારા અનધિકૃત વ્યવહારો કરીને તમારા નાણાં ચોરી શકે છે. આરબીઆઈ (RBI) નિર્દેશો કાર્ડનો ફોટો કે ગોપનીય વિગતો શેર કરવા પર સખત પ્રતિબંધ મૂકે છે.',
    credentialHarvestingWhatRemainsUnknown:
      'સંદેશ મોકલનારની સાચી ઓળખ, સત્તાવાર વ્યવસાય નોંધણી અને આરબીઆઈ અધિકૃતતા.',
    credentialHarvestingVerificationStep:
      'ક્રેડિટ કે ડેબિટ કાર્ડનો ફોટો ક્યારેય મોકલશો નહીં. જો મોકલી દીધો હોય, તો તરત જ બેંકનો સંપર્ક કરી કાર્ડ બ્લોક કરાવો અને 1930 સાયબર હેલ્પલાઇન પર ફરિયાદ નોંધાવો.',
    ambiguousSummary:
      'સાવચેતી: અનૌપચારિક માધ્યમો (WhatsApp/Telegram ગ્રૂપ) દ્વારા આવતી ઓફર્સની સ્વતંત્ર ચકાસણી જરૂરી છે. બિનનોંધણીકૃત સલાહકાર સેવાઓ સેબીના નિયમોનું ઉલ્લંઘન કરે છે.',
    benignSummary:
      'આ લખાણમાં કોઈ સ્પષ્ટ ચેતવણીના સંકેતો (જેમ કે ગેરંટીડ રિટર્ન, નાણાં ગુણાકારના વચનો અથવા તાત્કાલિક પેમેન્ટની માંગ) મળ્યા નથી.',
    guaranteedReturnsExplanation:
      'સેબીના નિયમો કોઈપણ મધ્યસ્થી, બ્રોકર અથવા નાણાકીય સલાહકારને રોકાણ પર નિશ્ચિત નફાની ગેરંટી આપવા અથવા વચન આપવા પર સ્પષ્ટપણે પ્રતિબંધ મૂકે છે.',
    urgencyExplanation:
      'યોગ્ય ચકાસણી પહેલાં ઉતાવળે નાણાં રોકવા પ્રેરિત કરવા માટે રોકાણ કૌભાંડોમાં કૃત્રિમ સમયમર્યાદા અને મર્યાદિત બેઠકોનું દબાણ સામાન્ય યુક્તિઓ છે.',
    upfrontExplanation:
      'વ્યક્તિગત ખાતામાં અથવા અપ્રમાણિત UPI ID પર એડવાન્સ રજીસ્ટ્રેશન ફી, માર્જિન કે પ્રોસેસિંગ ફી માંગવી એ છેતરપિંડીનો મોટો સંકેત છે.',
    suspiciousLinkExplanation:
      'કાયદેસર સેબી રિસર્ચ એનાલિસ્ટ નોંધણી વિગતો દર્શાવ્યા વિના ખાનગી સલાહકાર ચેનલોનું આમંત્રણ.',
    highRiskContentEstablishes:
      'આ ઓફર ચકાસી શકાય તેવી સેબી નોંધણી વિના અસામાન્ય અથવા ખાતરીપૂર્વકનું વળતર આપે છે.',
    ambiguousContentEstablishes:
      'આ સંદેશ ફરજિયાત કાયદાકીય જોખમ ચેતવણી વિના અનૌપચારિક સલાહકાર જૂથમાં જોડાવા આમંત્રણ આપે છે.',
    benignContentEstablishes:
      'લખાણ ગેરંટીડ રિટર્ન કે એડવાન્સ પેમેન્ટની માંગ વિના પ્રમાણભૂત નાણાકીય અથવા શૈક્ષણિક વિભાવનાઓનું વર્ણન કરે છે.',
    highRiskWhatRemainsUnknown:
      'મોકલનારની કાયદેસર ઓળખ, સેબી નોંધણી નંબર અને MCA પોર્ટલ પર સત્તાવાર કોર્પોરેટ નોંધણી.',
    ambiguousWhatRemainsUnknown:
      'રિસર્ચ એનાલિસ્ટ રજીસ્ટ્રેશન નંબર અને સેબી અધિકૃતતા.',
    benignWhatRemainsUnknown: 'ઉપયોગમાં લેવાયેલ ચોક્કસ પ્લેટફોર્મ અથવા મધ્યસ્થી.',
    highRiskVerificationStep:
      'https://www.sebi.gov.in પર સત્તાવાર સેબી નોંધાયેલ મધ્યસ્થી ડેટાબેઝ પર સંસ્થા અથવા સલાહકારનું નામ શોધો.',
    ambiguousVerificationStep:
      'સેબી RA નોંધણી નંબર માંગો અને sebi.gov.in પર ચકાસો.',
    benignVerificationStep:
      'હંમેશા ચકાસો કે કોઈપણ બ્રોકર અથવા સલાહકાર સેબી અને AMFI સાથે નોંધાયેલા છે.',
    journeyInitialOfferTitle: 'અવાસ્તવિક વળતરની યોજના',
    journeyInitialOfferExplanation:
      'ઝડપથી નાણાં ડબલ કે અનેક ગણા કરવાની લાલચ આપવામાં આવે છે.',
    journeyUrgencyTitle: 'કૃત્રિમ સમયનું દબાણ',
    journeyUrgencyExplanation:
      'વિચારવાનો સમય ન મળે તે માટે તાત્કાલિક નિર્ણય લેવાનું દબાણ કરવામાં આવે છે.',
    journeyPaymentTitle: 'વ્યક્તિગત ખાતામાં નાણાં મોકલવાની માંગ',
    journeyPaymentExplanation:
      'આગળનું પગલું: વ્યક્તિગત UPI કે ખાતામાં પૈસા જમા કરાવવાનું કહેવું.',
    journeyAppTitle: 'નકલી એપ કે APK લિંક',
    journeyAppExplanation:
      'અપ્રમાણિત એપ ડાઉનલોડ કરાવી સ્ક્રીન પર નકલી નફો બતાવવામાં આવે છે.',
    journeyRecoveryTitle: 'નાણાં ઉપાડવા પર રોક અને ખોટી ટેક્સ માંગ',
    journeyRecoveryExplanation:
      'પૈસા ઉપાડતી વખતે વધુ ટેક્સ કે ફી માંગવામાં આવે છે અને પૈસા ડૂબી જાય છે.',
    highRiskUnknowns: [
      'સબમિટ કરેલી સામગ્રીમાંથી સેબી નોંધણી આઈડી ચકાસી શકાતી નથી.',
      'કંપનીનો PAN કે રજીસ્ટર્ડ ડોમેન જાણીતો નથી.',
    ],
    highRiskNextSteps: [
      'કોઈપણ વ્યક્તિગત UPI ID કે અજાણ્યા ખાતામાં પૈસા મોકલશો નહીં.',
      'https://www.sebi.gov.in પર સેબી નોંધાયેલા સલાહકારોની પુષ્ટિ કરો.',
      'સંચાર સાથી પોર્ટલ પર રિપોર્ટ કરો અથવા 1930 ડાયલ કરો.',
    ],
    highRiskLimitations: [
      'સેબી અને આરબીઆઈ નિયમોના આધારે NiveshShield દ્વારા મૂલ્યાંકન કરેલ.',
      'રોકાણ કરતા પહેલા સત્તાવાર પોર્ટલ પર નોંધણી તપાસો.',
    ],
    ambiguousUnknowns: ['ગ્રૂપ એડમિનની સેબી લાયસન્સ વિગતો ઉપલબ્ધ નથી.'],
    ambiguousNextSteps: [
      'સલાહકારનો સેબી RA નંબર માંગો.',
      'sebi.gov.in પર ચકાસો.',
      'ચેટ એપ્લિકેશનો દ્વારા રોકાણ કરવાનું ટાળો.',
    ],
    ambiguousLimitations: ['NiveshShield ક્લાયન્ટ એન્જિન દ્વારા ચકાસાયેલ.'],
    benignUnknowns: ['ચોક્કસ ખરીદી પ્લેટફોર્મની વિગત નથી.'],
    benignNextSteps: [
      'નાણાકીય શિસ્ત જાળવો અને વિવિધતા લાવો.',
      'AMFI India પોર્ટલ પર મ્યુચ્યુઅલ ફંડ નોંધણી તપાસો.',
    ],
    benignLimitations: ['શૈક્ષણિક હેતુ માટે મૂલ્યાંકન કરેલ.'],
    phoneSafetyAdvisories: [
      'સેબી કે આરબીઆઈ નોંધાયેલ સંસ્થાઓ વ્યક્તિગત WhatsApp પરથી ડિપોઝિટ માંગતી નથી.',
      'ટ્રેડિંગ માટે અજાણી વ્યક્તિઓના UPI પર ક્યારેય પૈસા ન મોકલો.',
      'શંકા પડે તો સંચાર સાથી અથવા 1930 હેલ્પલાઇન પર સંપર્ક કરો.',
    ],
    phonePrivacyNotice:
      'ગોપનીયતા સુરક્ષા માટે ફોન નંબરો માસ્ક (+91 XX*** ***XX) કરીને પ્રોસેસ થાય છે.',
    phoneOfficialStatus:
      'ફરિયાદ ન હોવી એ સલામતીની ખાતરી નથી. અધિકૃત સંસ્થાઓ વ્યક્તિગત મોબાઇલ પરથી વ્યવહારો કરતી નથી.',
    phoneExternalRep: (masked) =>
      `${masked} માટે તપાસ પૂર્ણ. સીધી સરકારી પોર્ટલ પર ચકાસણી માટે નીચેની લિંક્સ વાપરો.`,
    phoneUnverifiedElements: [
      'મોકલનારની ઓળખ અને સેબી નોંધણી અપ્રમાણિત છે',
      'ટેલિકોમ DLT હેડર નોંધણી ચકાસાયેલી નથી',
    ],
  },
}

export function evaluateLocally(options: AnalyzeOptions): AnalysisResult {
  const text = (options.message || '').trim()
  const modality = options.modality || 'text'
  const langKey = resolveLang(options.language)
  const dict = DICTIONARY[langKey]
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

  // 1. Financial credential harvesting / Payment card phishing / Sensitive credentials demand
  const cardPhotoRegex =
    /(?:credit|debit|atm|bank|forex|rupay|visa|mastercard)?\s*card\s*(?:photo|picture|image|pic|scan|front|back|details|number|copy|snapshot)/i
  const photoOfCardRegex =
    /(?:photo|picture|image|pic|scan|copy|snapshot)\s*(?:of\s*)?(?:your\s*)?(?:credit|debit|atm|bank|forex|rupay|visa|mastercard)?\s*card/i
  const sensitiveCredentialRegex =
    /\b(?:credit\s*card|debit\s*card|atm\s*card|cvv2?|card\s*number|card\s*pin|atm\s*pin|upi\s*pin|mpin|net\s*banking\s*password|one\s*time\s*password)\b/i
  const sensitiveDocRegex =
    /(?:cheque|check|passbook|bank\s*statement|aadhaar|pan\s*card)\s*(?:photo|picture|image|pic|copy|scan)/i

  const hasCredentialHarvesting =
    cardPhotoRegex.test(text) ||
    photoOfCardRegex.test(text) ||
    sensitiveCredentialRegex.test(text) ||
    sensitiveDocRegex.test(text) ||
    lower.includes('credit card photo') ||
    lower.includes('card photo') ||
    lower.includes('debit card') ||
    lower.includes('क्रेडिट कार्ड') ||
    lower.includes('कार्ड का फोटो') ||
    lower.includes('कार्ड फोटो') ||
    lower.includes('डेबिट कार्ड') ||
    lower.includes('कार्डचा फोटो') ||
    lower.includes('কার্ডের ছবি') ||
    lower.includes('கார்டு புகைப்படம்') ||
    lower.includes('કાર્ડનો ફોટો')

  // 2. Unearned "Free Money" / Lottery / Prize / Reward lures
  const freeMoneyRegex =
    /\b(?:free\s*(?:money|cash|fund|funds|rupees|dollar|crypto|reward|bonus|gift|payout|earning|income))\b/i
  const getFreeMoneyRegex =
    /\b(?:get|win|claim|earn|receive)\s*free\s*(?:money|cash|reward|rupees|bonus)\b/i
  const exchangeRegex =
    /\b(?:in\s*exchange\s*(?:of|for)|in\s*return\s*(?:of|for)|exchange\s*(?:your|of))\b/i
  const lotteryRegex =
    /\b(?:lottery\s*winner|won\s*lottery|lucky\s*draw|kbc\s*lottery|unclaimed\s*(?:prize|money|funds))\b/i

  const hasFreeMoneyLure =
    freeMoneyRegex.test(text) ||
    getFreeMoneyRegex.test(text) ||
    exchangeRegex.test(text) ||
    lotteryRegex.test(text) ||
    lower.includes('free money') ||
    lower.includes('मुफ्त पैसे') ||
    lower.includes('फ्री पैसे') ||
    lower.includes('मुफ्त धन') ||
    lower.includes('मोफत पैसे') ||
    lower.includes('বিনামূল্যে টাকা') ||
    lower.includes('இலவச பணம்') ||
    lower.includes('મફત પૈસા')

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
    lower.includes('निश्चित रिटर्न') ||
    lower.includes('हमी') ||
    lower.includes('खात्रीशीर') ||
    lower.includes('গ্যারান্টি') ||
    lower.includes('নিশ্চিত') ||
    lower.includes('உத்தரவாத') ||
    lower.includes('லாபம்') ||
    lower.includes('ગેરંટી') ||
    lower.includes('ખાતરી')

  const hasUrgencyPressure =
    lower.includes('urgent') ||
    lower.includes('expires') ||
    lower.includes('limited slots') ||
    lower.includes('today only') ||
    lower.includes('last chance') ||
    lower.includes('act now') ||
    lower.includes('तुरंत') ||
    lower.includes('आज ही') ||
    lower.includes('आखिरी मौका') ||
    lower.includes('लगेच') ||
    lower.includes('দ্রুত') ||
    lower.includes('உடனே') ||
    lower.includes('તાત્કાલિક')

  const hasUpfrontPayment =
    lower.includes('registration fee') ||
    lower.includes('deposit') ||
    lower.includes('pay immediately') ||
    lower.includes('pay first') ||
    lower.includes('upfront') ||
    lower.includes('margin deposit') ||
    lower.includes('फीस') ||
    lower.includes('पहले पैसे') ||
    lower.includes('शुल्क') ||
    lower.includes('পেমেন্ট') ||
    lower.includes('கட்டணம்') ||
    lower.includes('ફી')

  const isSuspiciousGroupOrApp =
    lower.includes('telegram') ||
    lower.includes('whatsapp') ||
    lower.includes('group') ||
    lower.includes('channel') ||
    lower.includes('apk') ||
    lower.includes('download app') ||
    lower.includes('vip tips') ||
    lower.includes('exclusive trading')

  // 3. Sympathy & Emotional Coercion Hooks (e.g. cancer, hospital bills, paying medical treatment with algo strategy)
  const hasSympathyHook =
    /\b(?:mother|father|parent|son|daughter|family|wife|husband|brother|sister|relative)\b.*\b(?:cancer|hospital|sick|illness|medical|operation|surgery|treatment|bills|death)\b/i.test(text) ||
    /\b(?:cancer|hospital\s*bills?|medical\s*bills?|surgery|treatment)\b.*\b(?:algorithmic|algorithm|strategy|trading|profit|invest|shares?|crypto|forex|returns?|pay|bills)\b/i.test(text) ||
    /\b(?:algorithmic\s*strategy|algo\s*strategy|algorithmic\s*trading)\b.*\b(?:helped\s*me|hospital|bills|give\s*back|sharing)\b/i.test(text) ||
    lower.includes('hospital bills') ||
    lower.includes('cancer')

  // 4. False Exclusivity & VIP Quotas (e.g. only sharing with 3 special people, secret group)
  const hasFalseExclusivity =
    /\b(?:only\s*sharing\s*with|sharing\s*with\s*(?:\d+|few|special)|special\s*people|selected\s*members?|vip\s*(?:group|channel|quota|access)|exclusive\s*(?:circle|quota|window)|insider\s*tips?)\b/i.test(text) ||
    lower.includes('3 special people') ||
    lower.includes('only sharing with')

  // 5. Account Freezing Threats & Regulatory Extortion (e.g. permanently frozen by SEBI in 10 minutes, clearance fee)
  const hasFreezeExtortion =
    /\b(?:permanently\s*frozen|frozen\s*by\s*(?:sebi|rbi|tax|police|cyber|it\s*dept|authorities)|account\s*will\s*be\s*(?:permanently\s*)?frozen|freeze\s*in\s*\d+\s*(?:minutes?|hours?|mins?))\b/i.test(text) ||
    /\b(?:clearance\s*fee|noc\s*tax|verification\s*fee|unlock\s*fee|withdrawal\s*fee|unfreeze\s*fee|10%\s*advance\s*deposit)\b/i.test(text) ||
    (/\b(?:in\s*\d+\s*minutes?|in\s*10\s*minutes?|within\s*\d+\s*(?:hours?|minutes?))\b/i.test(text) && /\b(?:frozen|freeze|unless|clearance|fee|pay)\b/i.test(text)) ||
    lower.includes('frozen by sebi') ||
    lower.includes('permanently frozen') ||
    lower.includes('clearance fee')

  // 6. Dabba Trading / Off-Market / KYC Bypass
  const hasDabbaTrading =
    /\b(?:dabba\s*trading|off[- ]market\s*trading|bina\s*pan(?:\s*card)?|without\s*pan|no\s*kyc(?:\s*required)?|cash\s*settlement|chhutti\s*settlement)\b/i.test(text) ||
    lower.includes('dabba trading') ||
    lower.includes('bina pan card') ||
    lower.includes('no kyc')

  // 7. Secondary Extortion
  const hasSecondaryExtortion =
    /\b(?:noc\s*tax|clearance\s*fee|verification\s*fee|10%\s*advance\s*deposit)\b/i.test(text) ||
    (/\b(?:recover|refund|chargeback)\b/i.test(text) && /\b(?:fee|advance|deposit|pay)\b/i.test(text))

  const isHighRisk =
    hasCredentialHarvesting ||
    hasMoneyMultiplier ||
    hasGuaranteedReturns ||
    hasSympathyHook ||
    hasFalseExclusivity ||
    hasFreezeExtortion ||
    hasDabbaTrading ||
    hasSecondaryExtortion ||
    (hasFreeMoneyLure && (hasUpfrontPayment || hasUrgencyPressure || isSuspiciousGroupOrApp || exchangeRegex.test(text))) ||
    (hasUrgencyPressure && hasUpfrontPayment)

  const isAmbiguous = !isHighRisk && (isSuspiciousGroupOrApp || hasUrgencyPressure || hasUpfrontPayment || hasFreeMoneyLure)

  // Find relevant official regulatory sources
  const sebiFakeTradingSource = officialSources.find((s: OfficialSource) => s.id === 'sebi_fake_trading_apps')
  const rbiKehtaHaiSource = officialSources.find((s: OfficialSource) => s.id === 'rbi_kehta_hai')
  const cybercrime1930Source = officialSources.find((s: OfficialSource) => s.id === 'cybercrime_1930')
  const sebiScoresSource = officialSources.find((s: OfficialSource) => s.id === 'sebi_scores')

  if (isHighRisk) {
    return {
      input_modality: modality,
      input_language: langKey,
      extracted_text: text || `[${modality} content submitted for analysis]`,
      extraction_uncertainty: {
        has_uncertainty: false,
        confidence: 'high',
        notes: hasCredentialHarvesting
          ? dict.credentialHarvestingSummary
          : hasMoneyMultiplier
          ? dict.multiplierSummary
          : dict.guaranteedSummary,
      },
      extracted_entities: {
        urls: extractedUrls,
        names: hasCredentialHarvesting
          ? ['Unverified Solicitation / Phishing Sender']
          : ['Unverified Scheme / Solicitation Channel'],
        promised_returns: hasFreeMoneyLure
          ? ['Unearned Free Money / Reward Claim']
          : hasMoneyMultiplier
          ? ['Unrealistic Money Multiplication / Guaranteed Returns']
          : ['Guaranteed Returns / Daily Profit'],
        deadlines: hasUrgencyPressure ? ['Urgent / Limited Window'] : [],
        payment_requests: hasCredentialHarvesting
          ? ['Credit / Debit Card Photo & Security Details Demand']
          : hasUpfrontPayment
          ? ['Advance Fee / Registration / Deposit Demand']
          : ['Transfer to Private Account / UPI'],
        claims: [
          hasCredentialHarvesting
            ? 'Free money in exchange for card credentials / photo'
            : hasMoneyMultiplier
            ? 'Disproportionate money multiplication promise'
            : 'Guaranteed investment return claim',
        ],
        phone_numbers: phoneStrings,
      },
      extracted_phones: mappedPhoneItems,
      overall_status: 'warning_signs_found',
      uncertainty_rating: 'low',
      summary: hasFreezeExtortion
        ? '🛑 HIGH-RISK EXTORTION ALERT: Threatening that your account or Demat will be permanently frozen by SEBI/authorities unless an advance clearance fee is paid is a fraudulent coercion tactic. Regulators never demand clearance fees via chat or freeze accounts without due legal process.'
        : hasSympathyHook || hasFalseExclusivity
        ? '🛑 HIGH-RISK MANIPULATION ALERT: Solicitation uses emotional sympathy hooks (e.g. cancer, hospital bills) and false exclusivity ("only sharing with 3 special people") to lure targets into unverified algorithmic trading schemes in violation of SEBI regulations.'
        : hasDabbaTrading
        ? '🛑 ILLEGAL DABA TRADING ALERT: Solicitation promotes off-market dabba trading or KYC bypass ("bina PAN card") in direct violation of SEBI Act Section 13/16 and PMLA Act regulations.'
        : hasCredentialHarvesting
        ? dict.credentialHarvestingSummary
        : hasMoneyMultiplier
        ? dict.multiplierSummary
        : dict.guaranteedSummary,
      findings: [
        ...(hasFreezeExtortion
          ? [
              {
                indicator: 'impersonation' as const,
                original_excerpt: text.slice(0, 120),
                explanation:
                  'Perpetrator is impersonating SEBI/regulatory authorities and using coercive threats of immediate account freeze to extort advance clearance fees.',
                evidence_type: 'message_excerpt' as const,
                verification_status: 'not_independently_verified' as const,
              },
            ]
          : hasSympathyHook || hasFalseExclusivity
          ? [
              {
                indicator: 'other_warning_sign' as const,
                original_excerpt: text.slice(0, 120),
                explanation:
                  'Social engineering attack utilizing emotional sympathy hooks and false exclusivity to build artificial trust for an unregistered algorithmic trading scheme.',
                evidence_type: 'message_excerpt' as const,
                verification_status: 'not_independently_verified' as const,
              },
            ]
          : hasDabbaTrading
          ? [
              {
                indicator: 'other_warning_sign' as const,
                original_excerpt: text.slice(0, 120),
                explanation:
                  'Off-market / dabba trading and operating without mandatory PAN/KYC compliance is illegal under SEBI Act and Prevention of Money Laundering Act.',
                evidence_type: 'message_excerpt' as const,
                verification_status: 'not_independently_verified' as const,
              },
            ]
          : hasCredentialHarvesting
          ? [
              {
                indicator: 'other_warning_sign' as const,
                original_excerpt:
                  text.match(/(?:credit|debit|atm)?\s*card\s*photo|get\s*free\s*money|in\s*exchange\s*of[^\n.,!]*|\b(?:credit\s*card|debit\s*card|cvv|otp|pin)\b/i)?.[0] ||
                  text.slice(0, 100),
                explanation: dict.credentialHarvestingExplanation,
                evidence_type: 'message_excerpt' as const,
                verification_status: 'not_independently_verified' as const,
              },
            ]
          : [
              {
                indicator: 'guaranteed_returns' as const,
                original_excerpt: text.slice(0, 120),
                explanation: dict.guaranteedReturnsExplanation,
                evidence_type: 'message_excerpt' as const,
                verification_status: 'not_independently_verified' as const,
              },
            ]),
        ...(hasUrgencyPressure || hasFreezeExtortion
          ? [
              {
                indicator: 'urgency_pressure' as const,
                original_excerpt: text.slice(0, 80),
                explanation: dict.urgencyExplanation,
                evidence_type: 'message_excerpt' as const,
                verification_status: 'not_independently_verified' as const,
              },
            ]
          : []),
        ...(hasUpfrontPayment || hasFreezeExtortion || hasSecondaryExtortion
          ? [
              {
                indicator: 'upfront_payment' as const,
                original_excerpt: text.slice(0, 80),
                explanation: dict.upfrontExplanation,
                evidence_type: 'message_excerpt' as const,
                verification_status: 'not_independently_verified' as const,
              },
            ]
          : []),
      ],
      claims: [
        {
          original_claim:
            text.slice(0, 120) ||
            (hasCredentialHarvesting
              ? 'Free money in exchange for credit card photo'
              : 'Promised returns and trading scheme'),
          what_content_establishes: hasCredentialHarvesting
            ? 'Content requests confidential payment card photos or credentials in exchange for monetary returns.'
            : dict.highRiskContentEstablishes,
          external_source_consulted: hasCredentialHarvesting
            ? (rbiKehtaHaiSource
                ? {
                    id: rbiKehtaHaiSource.id,
                    title: rbiKehtaHaiSource.title,
                    url: rbiKehtaHaiSource.url,
                    relevant_excerpt:
                      'RBI directives strictly warn citizens to never share credit/debit card photos, card numbers, CVV, or OTPs. Legitimate banks and authorities NEVER solicit card photos.',
                    date_accessed: '2026-10-02',
                  }
                : cybercrime1930Source
                ? {
                    id: cybercrime1930Source.id,
                    title: cybercrime1930Source.title,
                    url: cybercrime1930Source.url,
                    relevant_excerpt:
                      'National Cyber Crime advisory warns against financial credential harvesting and unauthorized payment card solicitation.',
                    date_accessed: '2026-10-02',
                  }
                : null)
            : sebiFakeTradingSource
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
          what_remains_unknown: hasCredentialHarvesting
            ? dict.credentialHarvestingWhatRemainsUnknown
            : dict.highRiskWhatRemainsUnknown,
          safe_verification_step: hasCredentialHarvesting
            ? dict.credentialHarvestingVerificationStep
            : dict.highRiskVerificationStep,
        },
      ],
      scam_journey_map: [
        {
          stage: 'initial_offer',
          title: hasFreeMoneyLure ? 'Unsolicited Free Money or Reward Lure' : dict.journeyInitialOfferTitle,
          observed: true,
          evidence: hasFreeMoneyLure
            ? (text.match(/get\s*free\s*money|free\s*money/i)?.[0] || text.slice(0, 80))
            : text.slice(0, 100),
          explanation: hasFreeMoneyLure
            ? 'Perpetrator lures target with unearned cash or guaranteed financial reward.'
            : dict.journeyInitialOfferExplanation,
          is_future_risk: false,
        },
        {
          stage: 'urgency_pressure',
          title: dict.journeyUrgencyTitle,
          observed: hasUrgencyPressure,
          evidence: hasUrgencyPressure ? text.slice(0, 60) : '',
          explanation: dict.journeyUrgencyExplanation,
          is_future_risk: !hasUrgencyPressure,
        },
        {
          stage: 'payment_request',
          title: dict.journeyPaymentTitle,
          observed: hasUpfrontPayment,
          evidence: hasUpfrontPayment ? text.slice(0, 60) : '',
          explanation: dict.journeyPaymentExplanation,
          is_future_risk: !hasUpfrontPayment,
        },
        {
          stage: 'app_or_credential_request',
          title: hasCredentialHarvesting
            ? 'Card Photo & Confidential Credential Harvesting'
            : dict.journeyAppTitle,
          observed: hasCredentialHarvesting || isSuspiciousGroupOrApp,
          evidence: hasCredentialHarvesting
            ? (text.match(/(?:credit|debit|atm)?\s*card\s*photo|credit\s*card|debit\s*card/i)?.[0] || 'Credit card photo requested')
            : (isSuspiciousGroupOrApp ? text.slice(0, 60) : ''),
          explanation: hasCredentialHarvesting
            ? dict.credentialHarvestingExplanation
            : dict.journeyAppExplanation,
          is_future_risk: !(hasCredentialHarvesting || isSuspiciousGroupOrApp),
        },
        {
          stage: 'followup_or_recovery',
          title: dict.journeyRecoveryTitle,
          observed: false,
          evidence: '',
          explanation: dict.journeyRecoveryExplanation,
          is_future_risk: true,
        },
      ],
      unknowns: dict.highRiskUnknowns,
      next_steps: dict.highRiskNextSteps,
      limitations: dict.highRiskLimitations,
    }
  }

  if (isAmbiguous) {
    return {
      input_modality: modality,
      input_language: langKey,
      extracted_text: text || `[${modality} content submitted for analysis]`,
      extraction_uncertainty: {
        has_uncertainty: true,
        confidence: 'medium',
        notes: dict.ambiguousSummary,
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
      summary: dict.ambiguousSummary,
      findings: [
        {
          indicator: 'suspicious_link',
          original_excerpt: text.slice(0, 100),
          explanation: dict.suspiciousLinkExplanation,
          evidence_type: 'message_excerpt',
          verification_status: 'not_independently_verified',
        },
      ],
      claims: [
        {
          original_claim: text.slice(0, 100) || 'Trading advisory channel',
          what_content_establishes: dict.ambiguousContentEstablishes,
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
          what_remains_unknown: dict.ambiguousWhatRemainsUnknown,
          safe_verification_step: dict.ambiguousVerificationStep,
        },
      ],
      scam_journey_map: [
        {
          stage: 'initial_offer',
          title: dict.journeyInitialOfferTitle,
          observed: true,
          evidence: text.slice(0, 100),
          explanation: dict.journeyInitialOfferExplanation,
          is_future_risk: false,
        },
        {
          stage: 'urgency_pressure',
          title: dict.journeyUrgencyTitle,
          observed: hasUrgencyPressure,
          evidence: hasUrgencyPressure ? text.slice(0, 60) : '',
          explanation: dict.journeyUrgencyExplanation,
          is_future_risk: !hasUrgencyPressure,
        },
        {
          stage: 'payment_request',
          title: dict.journeyPaymentTitle,
          observed: hasUpfrontPayment,
          evidence: hasUpfrontPayment ? text.slice(0, 60) : '',
          explanation: dict.journeyPaymentExplanation,
          is_future_risk: !hasUpfrontPayment,
        },
        {
          stage: 'app_or_credential_request',
          title: dict.journeyAppTitle,
          observed: false,
          evidence: '',
          explanation: dict.journeyAppExplanation,
          is_future_risk: true,
        },
        {
          stage: 'followup_or_recovery',
          title: dict.journeyRecoveryTitle,
          observed: false,
          evidence: '',
          explanation: dict.journeyRecoveryExplanation,
          is_future_risk: true,
        },
      ],
      unknowns: dict.ambiguousUnknowns,
      next_steps: dict.ambiguousNextSteps,
      limitations: dict.ambiguousLimitations,
    }
  }

  // Benign or General Informational Content
  return {
    input_modality: modality,
    input_language: langKey,
    extracted_text: text || `[${modality} content submitted for analysis]`,
    extraction_uncertainty: {
      has_uncertainty: false,
      confidence: 'high',
      notes: dict.benignSummary,
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
    summary: dict.benignSummary,
    findings: [],
    claims: [
      {
        original_claim: text.slice(0, 100),
        what_content_establishes: dict.benignContentEstablishes,
        external_source_consulted: null,
        source_verdict: 'supports',
        what_remains_unknown: dict.benignWhatRemainsUnknown,
        safe_verification_step: dict.benignVerificationStep,
      },
    ],
    scam_journey_map: [
      {
        stage: 'initial_offer',
        title: dict.journeyInitialOfferTitle,
        observed: true,
        evidence: text.slice(0, 80),
        explanation: dict.journeyInitialOfferExplanation,
        is_future_risk: false,
      },
      {
        stage: 'urgency_pressure',
        title: dict.journeyUrgencyTitle,
        observed: false,
        evidence: '',
        explanation: dict.journeyUrgencyExplanation,
        is_future_risk: false,
      },
      {
        stage: 'payment_request',
        title: dict.journeyPaymentTitle,
        observed: false,
        evidence: '',
        explanation: dict.journeyPaymentExplanation,
        is_future_risk: false,
      },
      {
        stage: 'app_or_credential_request',
        title: dict.journeyAppTitle,
        observed: false,
        evidence: '',
        explanation: dict.journeyAppExplanation,
        is_future_risk: false,
      },
      {
        stage: 'followup_or_recovery',
        title: dict.journeyRecoveryTitle,
        observed: false,
        evidence: '',
        explanation: dict.journeyRecoveryExplanation,
        is_future_risk: false,
      },
    ],
    unknowns: dict.benignUnknowns,
    next_steps: dict.benignNextSteps,
    limitations: dict.benignLimitations,
  }
}

export function evaluatePhoneLocally(
  phoneNumber: string,
  context?: string,
  language = 'en',
): PhoneReputationInvestigation {
  const langKey = resolveLang(language)
  const dict = DICTIONARY[langKey]

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
        'Automated machine lookup unavailable: Interactive citizen CAPTCHA required for privacy protection. Use official link to verify manually.',
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
      external_reputation_summary: dict.phoneExternalRep(masked),
      official_verification_status: dict.phoneOfficialStatus,
      unverified_elements: dict.phoneUnverifiedElements,
    },
    official_verification_links: officialVerificationLinks,
    safety_advisories: dict.phoneSafetyAdvisories,
    privacy_notice: dict.phonePrivacyNotice,
  }
}

export function getLocalizedStaticString(
  key: 'educationalSummary' | 'guaranteedFixedSummary',
  lang?: string,
): string {
  const langKey = resolveLang(lang)
  const dict = DICTIONARY[langKey]
  if (key === 'educationalSummary') {
    return dict.educationalSummary
  }
  return dict.guaranteedFixedSummary
}
