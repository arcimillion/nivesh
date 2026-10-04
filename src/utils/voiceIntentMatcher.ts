export type VoiceIntent =
  | 'EXPLAIN_CURRENT_CONTENT'
  | 'CHECK_SAFETY'
  | 'ALREADY_PAID'
  | 'COMPLAINT_GUIDANCE'
  | 'NOMINEE_GUIDANCE'
  | 'INVESTOR_RIGHTS'
  | 'DOCUMENT_EXPLANATION'
  | 'SAFETY_LEARNING'
  | 'VERIFY_PERSON_OR_ENTITY'
  | 'START_INVESTIGATION'
  | 'REPEAT_EXPLANATION'
  | 'HELP'
  | 'UNKNOWN'

export interface IntentResult {
  intent: VoiceIntent
  confidence: number
  language: string
  transcript: string
}

export function classifyIntentLocally(transcript: string, language: string): IntentResult {
  const text = transcript.trim().toLowerCase()
  const lang = (language || 'en').split('-')[0].toLowerCase()

  // 1. ALREADY_PAID (Emergency / Loss containment)
  const paidKeywords = [
    'sent money', 'paid', 'payment', 'transferred', 'sent the money',
    'bhej diye', 'bhej diya', 'payment kar', 'paisa de', 'paise de', 'paise bhej',
    'টাকা পাঠিয়েছি', 'টাকা পাঠিয়ে দিয়েছি', 'পাঠিয়ে দিয়েছি',
    'मी पैसे पाठवले', 'पैसे पाठवले', 'पेमेंट केले',
    'પૈસા મોકલી દીધા', 'પૈસા મોકલ્યા', 'પેમેન્ટ કરી દીધું',
    'பணம் அனுப்பிவிட்டேன்', 'பணம் செலுத்திவிட்டேன்', 'அனுப்பிவிட்டேன்'
  ]
  if (paidKeywords.some(keyword => text.includes(keyword))) {
    return { intent: 'ALREADY_PAID', confidence: 0.95, language: lang, transcript }
  }

  // 2. COMPLAINT_GUIDANCE
  const complaintKeywords = [
    'complain', 'complaint', 'report', 'police', 'helpline', '1930', 'fir', 'shikayat',
    'तक्रार', 'फरियाद', 'অভিযোগ', 'புகார்', 'case file', 'cyber cell', 'cybercell',
    'शिकायत', 'रिपोर्ट', 'केस', 'तक्रार कशी करायची', 'तक्रार कुठे करू', 'ફરિયાદ ક્યાં',
    'অভিযোগ কোথায় করব', 'புகார் எங்கே'
  ]
  if (complaintKeywords.some(keyword => text.includes(keyword))) {
    return { intent: 'COMPLAINT_GUIDANCE', confidence: 0.95, language: lang, transcript }
  }

  // 3. NOMINEE_GUIDANCE
  const nomineeKeywords = [
    'nominee', 'nomination', 'nomini', 'नामित', 'वारस',
    'नॉमिनी', 'नोમિની', 'নমিনি', 'நாமினி', 'नॉमिनी कैसे', 'नोમિની કેવી રીતે',
    'নমিনি কীভাবে', 'நாமினியை எப்படி'
  ]
  if (nomineeKeywords.some(keyword => text.includes(keyword))) {
    return { intent: 'NOMINEE_GUIDANCE', confidence: 0.95, language: lang, transcript }
  }

  // 4. CHECK_SAFETY
  const safetyKeywords = [
    'safe', 'scam', 'fake', 'real', 'sahi hai', 'genuine', 'trustworthy', 'dhokha',
    'सुरक्षित', 'सलामती', 'নিরাপদ', 'பாதுகாப்பானதா', 'ક્યા યે સેફ હે', 'ક્યા યે સહી હે',
    'धोखा है', 'फर्जी', 'असली है या नकली', 'हे सुरक्षित आहे का', 'શું આ સલામત છે',
    'এটা কি নিরাপদ', 'பாதுகாப்பானது'
  ]
  if (safetyKeywords.some(keyword => text.includes(keyword))) {
    return { intent: 'CHECK_SAFETY', confidence: 0.92, language: lang, transcript }
  }

  // 5. INVESTOR_RIGHTS
  const rightsKeywords = [
    'rights', 'adhikar', 'right', 'hak', 'hakk', 'अधिकार', 'हक्क', 'અધિકાર',
    'অধিকার', 'உரிமை', 'मेरे अधिकार', 'गुंतवणूकदारांचे हक्क'
  ]
  if (rightsKeywords.some(keyword => text.includes(keyword))) {
    return { intent: 'INVESTOR_RIGHTS', confidence: 0.90, language: lang, transcript }
  }

  // 6. DOCUMENT_EXPLANATION
  const docKeywords = [
    'document', 'paper', 'dastavez', 'statement', 'passbook', 'certificate',
    'कागज', 'दस्तावेज', 'पेपर', 'पासबुक', 'নথি', 'ஆவணம்'
  ]
  if (docKeywords.some(keyword => text.includes(keyword))) {
    return { intent: 'DOCUMENT_EXPLANATION', confidence: 0.90, language: lang, transcript }
  }

  // 7. SAFETY_LEARNING
  const learningKeywords = [
    'learn', 'video', 'capsule', 'otp safety', 'upi fraud', 'cybercrime help',
    'sikhein', 'सीखें', 'व्हिडिओ', 'વિડિયો', 'ভিডিও', 'வீடியோ', 'सुरक्षा नियम',
    'ओटीपी की सुरक्षा', 'यूपीआई फ्रॉड'
  ]
  if (learningKeywords.some(keyword => text.includes(keyword))) {
    return { intent: 'SAFETY_LEARNING', confidence: 0.90, language: lang, transcript }
  }

  // 8. VERIFY_PERSON_OR_ENTITY
  const verifyKeywords = [
    'verify broker', 'verify advisor', 'genuine broker', 'sebi verify', 'adviser',
    'ब्रोकर को जांचें', 'सलाहकार', 'व्हेरिफाय'
  ]
  if (verifyKeywords.some(keyword => text.includes(keyword))) {
    return { intent: 'VERIFY_PERSON_OR_ENTITY', confidence: 0.90, language: lang, transcript }
  }

  // 9. START_INVESTIGATION
  const investigationKeywords = [
    'check message', 'investigate', 'analyze', 'jaanch', 'जांच', 'तपासा',
    'ચકાસો', 'পরীক্ষা', 'சரிபார்', 'मैसेज चेक', 'मेसेज तपासा'
  ]
  if (investigationKeywords.some(keyword => text.includes(keyword))) {
    return { intent: 'START_INVESTIGATION', confidence: 0.90, language: lang, transcript }
  }

  // 10. REPEAT_EXPLANATION
  const repeatKeywords = [
    'again', 'repeat', 'dobara', 'phirse', 'फिर से', 'दुबारा', 'पुन्हा',
    'ફરીથી', 'আবার', 'மீண்டும்'
  ]
  if (repeatKeywords.some(keyword => text.includes(keyword))) {
    return { intent: 'REPEAT_EXPLANATION', confidence: 0.90, language: lang, transcript }
  }

  // 11. HELP
  const helpKeywords = [
    'help', 'madad', 'what can i do', 'main kya', 'मदद', 'सहायता',
    'काय करावे', 'શું કરવું', 'কী করব', 'என்ன செய்ய வேண்டும்'
  ]
  if (helpKeywords.some(keyword => text.includes(keyword))) {
    return { intent: 'HELP', confidence: 0.85, language: lang, transcript }
  }

  // 12. EXPLAIN_CURRENT_CONTENT (Generic/fallback questions)
  const explainKeywords = [
    'what is this', 'what does this mean', 'explain', 'ye kya hai', 'iska matlab', 'samjhao',
    'ये क्या है', 'इसका मतलब', 'समझाओ', 'हे काय आहे', 'याचा अर्थ', 'આ શું છે',
    'એનો મતલબ', 'এটা কী', 'এর মানে কী', 'இது என்ன', 'இதன் பொருள்'
  ]
  if (explainKeywords.some(keyword => text.includes(keyword))) {
    return { intent: 'EXPLAIN_CURRENT_CONTENT', confidence: 0.90, language: lang, transcript }
  }

  // Default to UNKNOWN if no strong keyword matches
  return { intent: 'UNKNOWN', confidence: 0.0, language: lang, transcript }
}
