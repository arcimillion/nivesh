/**
 * NiveshShield Contextual Official Safety Education (Safety Capsules)
 * Curated static registry of official awareness videos and educational resources
 * from RBI, SEBI, I4C, NSE, and NPCI.
 *
 * NON-NEGOTIABLE PRINCIPLES:
 * 1. Six-Language Support: en, hi, bn, mr, gu, ta.
 * 2. Every video ID is tested and confirmed active on official YouTube channels.
 * 3. Never invent language availability or dynamically generate random URLs.
 * 4. Transparent attribution: clearly show official organization, language, and official source link.
 * 5. Automatic fallback to NiveshShield audio/explanation when a specific regional video is pending from regulators.
 */

import type { AnalysisResult } from '../api'

export type SupportedLanguage = 'en' | 'hi' | 'bn' | 'mr' | 'gu' | 'ta'

export type OfficialOrganization = 'RBI' | 'SEBI' | 'I4C' | 'NSE' | 'BSE' | 'NPCI'

export interface SafetyCapsuleVideo {
  embedUrl: string
  watchUrl: string
  sourceOrg: OfficialOrganization
  sourceOrgFullName: string
  language: SupportedLanguage
  languageLabel: string
  duration: string
  isVerified: boolean
  officialVideoTitle: string
}

export interface SafetyCapsule {
  id: string
  category:
    | 'otp_credentials'
    | 'upi_payments'
    | 'guaranteed_returns'
    | 'fake_apps'
    | 'impersonation'
    | 'phishing_links'
  officialOrganization: OfficialOrganization
  officialOrgFullName: string
  officialSourcePage: string
  campaignName: string

  // Multilingual display fields
  localizedTitle: Record<SupportedLanguage, string>
  localizedShortRule: Record<SupportedLanguage, string>
  localizedDescription: Record<SupportedLanguage, string>
  localizedMainRule: Record<SupportedLanguage, string>
  localizedAudioExplanation: Record<SupportedLanguage, string>
  takeaways: Record<SupportedLanguage, string[]>

  // Videos verified per language
  videosByLanguage: Partial<Record<SupportedLanguage, SafetyCapsuleVideo>>

  primaryRiskTriggers: string[]
  tags: string[]
}

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'हिन्दी (Hindi)',
  bn: 'বাংলা (Bengali)',
  mr: 'मराठी (Marathi)',
  gu: 'ગુજરાતી (Gujarati)',
  ta: 'தமிழ் (Tamil)',
}

export const ALL_SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'hi', 'bn', 'mr', 'gu', 'ta']

/**
 * 100% Tested & Verified Safety Capsules
 * All video IDs below are verified directly via YouTube oEmbed API from official accounts.
 */
export const SAFETY_CAPSULES_CATALOG: SafetyCapsule[] = [
  {
    id: 'otp_credentials',
    category: 'otp_credentials',
    officialOrganization: 'RBI',
    officialOrgFullName: 'Reserve Bank of India (RBI Kehta Hai)',
    officialSourcePage: 'https://rbikehtahai.rbi.org.in',
    campaignName: 'RBI Kehta Hai — Jaankar Baniye, Satark Rahiye',
    primaryRiskTriggers: [
      'credential_harvesting',
      'app_or_credential_request',
      'card_photo',
      'cvv',
      'otp',
      'pin',
      'password',
      'CARD_PHOTO_HARVESTING',
      'OTP_SOLICITATION',
    ],
    tags: ['OTP', 'CVV', 'ATM PIN', 'Banking Credentials', 'Card Phishing'],
    localizedTitle: {
      en: '🔐 Secret OTP & Credential Safety',
      hi: '🔐 गोपनीय OTP एवं पासवर्ड सुरक्षा',
      bn: '🔐 গোপনীয় OTP ও পাসওয়ার্ড সুরক্ষা',
      mr: '🔐 गोपनीय OTP व पासवर्ड सुरक्षितता',
      gu: '🔐 ગુપ્ત OTP અને પાસવર્ડ સુરક્ષા',
      ta: '🔐 இரகசிய OTP மற்றும் கடவுச்சொல் பாதுகாப்பு',
    },
    localizedShortRule: {
      en: 'Never share OTP, PIN, or card photos with anyone.',
      hi: 'अपना OTP, पिन या कार्ड की फोटो किसी के साथ शेयर न करें।',
      bn: 'কখনোই আপনার OTP, পিন বা কার্ডের ছবি কাউকে দেবেন না।',
      mr: 'तुमचा OTP, पिन किंवा कार्डचा फोटो कोणालाही देऊ नका.',
      gu: 'ક્યારેય તમારો OTP, પિન અથવા કાર્ડનો ફોટો કોઈને આપશો નહીં.',
      ta: 'உங்கள் OTP, பின் அல்லது அட்டை புகைப்படத்தை யாருடனும் பகிர வேண்டாம்.',
    },
    localizedDescription: {
      en: 'Official RBI awareness guide explaining why legitimate banks, authorities, and stock brokers never ask for OTPs or debit/credit card photos.',
      hi: 'भारतीय रिज़र्व बैंक का आधिकारिक जागरूकता वीडियो: बैंक, पुलिस या ब्रोकर कभी भी आपसे OTP या कार्ड की जानकारी नहीं मांगते।',
      bn: 'ভারতীয় রিজার্ভ ব্যাংকের অফিসিয়াল সচেতনতামূলক নির্দেশিকা: ব্যাংক বা নিয়ন্ত্রক সংস্থা কখনোই OTP বা কার্ডের বিবরণ জানতে চায় না।',
      mr: 'रिझर्व्ह बँक ऑफ इंडियाचे अधिकृत मार्गदर्शन: बँक, पोलीस किंवा ब्रोकर कधीही OTP किंवा कार्डचे तपशील मागत नाहीत.',
      gu: 'રિઝર્વ બેંક ઑફ ઈન્ડિયાનું સત્તાવાર માર્ગદર્શન: બેંક, પોલીસ કે બ્રોકર ક્યારેય OTP કે કાર્ડની વિગતો માંગતા નથી.',
      ta: 'இந்திய ரிசர்வ் வங்கியின் அதிகாரப்பூர்வ விழிப்புணர்வு: வங்கிகள், காவல்துறை அல்லது புரோக்கர்கள் ஒருபோதும் OTP அல்லது அட்டை விவரங்களைக் கேட்க மாட்டார்கள்.',
    },
    localizedMainRule: {
      en: '✅ MAIN RULE: OTP and PIN are strictly for your eyes only. No genuine bank official, cyber police, or SEBI officer will EVER ask for them.',
      hi: '✅ मुख्य नियम: OTP और पिन केवल आपके उपयोग के लिए हैं। कोई भी असली बैंक अधिकारी, साइबर पुलिस या सेबी कर्मचारी इन्हें कभी नहीं मांगता।',
      bn: '✅ মূল নিয়ম: OTP ও পিন সম্পূর্ণ আপনার নিজস্ব। কোনো প্রকৃত ব্যাংক কর্মকর্তা, সাইবার পুলিশ বা সেবি আধিকারিক কখনোই এগুলো চাইবেন না।',
      mr: '✅ मुख्य नियम: OTP आणि पिन फक्त तुमच्यासाठीच आहे. कोणतीही बँक, सायबर पोलीस किंवा सेबी अधिकारी हे कधीही मागत नाहीत.',
      gu: '✅ મુખ્ય નિયમ: OTP અને પિન માત્ર તમારા માટે જ છે. કોઈ વાસ્તવિક બેંક અધિકારી, સાયબર પોલીસ કે સેબી અધિકારી ક્યારેય તેને માંગશે નહીં.',
      ta: '✅ முக்கிய விதி: OTP மற்றும் பின் உங்களுக்கானது மட்டுமே. எந்தவொரு உண்மையான வங்கி அதிகாரி, காவல்துறை அல்லது செபி அலுவலர் ஒருபோதும் இதைக் கேட்க மாட்டார்கள்.',
    },
    localizedAudioExplanation: {
      en: 'NiveshShield Safety Capsule: If anyone calls or messages requesting your OTP, ATM PIN, CVV, or card photo, refuse immediately. RBI strictly prohibits banks from asking for credentials.',
      hi: 'निवेशशील्ड सुरक्षा कैप्सूल: यदि कोई भी फोन या मैसेज करके आपसे OTP, एटीएम पिन, सीवीवी या कार्ड की फोटो मांगता है, तो तुरंत मना कर दें। रिज़र्व बैंक के अनुसार बैंक कभी क्रेडेंशियल नहीं मांगते।',
      bn: 'নিবেশশীল্ড সুরক্ষা ক্যাপসুল: যদি কেউ ফোন বা মেসেজে আপনার OTP, এটিএম পিন, সিভিভি বা কার্ডের ছবি চায়, সঙ্গে সঙ্গে প্রত্যাখ্যান করুন। আরবিআই নিয়ম অনুযায়ী ব্যাংক কখনো গোপন কোড চায় না।',
      mr: 'निवेशशील्ड सुरक्षा कॅप्सूल: जर कोणी फोन किंवा मेसेज करून तुमच्याकडे OTP, एटीएम पिन, सीव्हीव्ही किंवा कार्डचा फोटो मागितला तर त्वरित नकार द्या. बँक कधीही अशा गोष्टी मागत नाही.',
      gu: 'નિવેશશીલ્ડ સુરક્ષા કેપ્સ્યુલ: જો કોઈ ફોન કે મેસેજ દ્વારા તમારી પાસે OTP, એટીએમ પિન, સીવીવી અથવા કાર્ડનો ફોટો માંગે તો તરત જ નકારી કાઢો.',
      ta: 'நிவேஷ்ஷீல்டு பாதுகாப்பு காப்ஸ்யூல்: எவரேனும் அழைப்பு அல்லது குறுஞ்செய்தி மூலம் உங்கள் OTP, ஏடிஎம் பின் அல்லது அட்டை புகைப்படத்தைக் கேட்டால் உடனடியாக மறுத்துவிடுங்கள்.',
    },
    takeaways: {
      en: [
        'Never forward SMS OTPs to anyone, even if they claim to be from your bank.',
        'Never upload photos of your debit or credit card on WhatsApp or Telegram.',
        'If compromised, call 1930 immediately or block your card via banking app.',
      ],
      hi: [
        'बैंक या पुलिस का नाम लेकर भी कोई OTP मांगे तो कभी न बताएं।',
        'डेबिट या क्रेडिट कार्ड की फोटो कभी सोशल मीडिया या चैट पर न भेजें।',
        'यदि गलती से शेयर हो जाए, तो तुरंत 1930 पर कॉल करें और कार्ड ब्लॉक कराएं।',
      ],
      bn: [
        'ব্যাংক বা পুলিশের নাম করে চাইলেও কাউকে কখনো OTP পাঠাবেন না।',
        'ডেবিট বা ক্রেডিট কার্ডের ছবি হোয়াটসঅ্যাপ বা টেলিগ্রামে কখনো পাঠাবেন না।',
        'যদি ভুলবশত দেওয়া হয়, অবিলম্বে ১৯৩০ নম্বরে ফোন করে কার্ড ব্লক করুন।',
      ],
      mr: [
        'बँक किंवा पोलिसांचे नाव घेऊन कोणी विचारले तरी कधीही OTP सांगू नका.',
        'डेबिट किंवा क्रेडिट कार्डचे फोटो व्हॉट्सअॅपवर कधीही पाठवू नका.',
        'चुकून दिल्यास, त्वरित १९३० वर संपर्क साधा आणि कार्ड ब्लॉक करा.',
      ],
      gu: [
        'બેંક કે પોલીસનું નામ લઈને કોઈ OTP માંગે તો પણ ક્યારેય આપશો નહીં.',
        'ડેબિટ કે ક્રેડિટ કાર્ડનો ફોટો વોટ્સએપ પર ક્યારેય મોકલશો નહીં.',
        'જો ભૂલથી અપાઈ જાય, તો તરત જ ૧૯૩૦ પર ફોન કરો અને કાર્ડ બ્લોક કરાવો.',
      ],
      ta: [
        'வங்கி அல்லது காவல்துறை என்று கூறி கேட்டாலும் OTP-ஐ யாரிடமும் கூறாதீர்கள்.',
        'டெபிட் அல்லது கிரெடிட் அட்டை புகைப்படங்களை சமூக ஊடகங்களில் பகிராதீர்கள்.',
        'தவறுதலாக பகிர்ந்தால், உடனடியாக 1930 எண்ணை அழைத்து அட்டையை முடக்குங்கள்.',
      ],
    },
    videosByLanguage: {
      en: {
        embedUrl: 'https://www.youtube-nocookie.com/embed/00SIr-Nqut0',
        watchUrl: 'https://www.youtube.com/watch?v=00SIr-Nqut0',
        sourceOrg: 'RBI',
        sourceOrgFullName: 'Reserve Bank of India',
        language: 'en',
        languageLabel: 'English',
        duration: 'Official Awareness',
        isVerified: true,
        officialVideoTitle: 'RBI Talks: From Paisa to Policy | Decoding Digital Frauds',
      },
      hi: {
        embedUrl: 'https://www.youtube-nocookie.com/embed/3RMWM4oNQ8A',
        watchUrl: 'https://www.youtube.com/watch?v=3RMWM4oNQ8A',
        sourceOrg: 'RBI',
        sourceOrgFullName: 'Reserve Bank of India',
        language: 'hi',
        languageLabel: 'हिन्दी (Hindi)',
        duration: '0:30',
        isVerified: true,
        officialVideoTitle: 'RBI CYBER SECURITY 30secs Hindi',
      },
      bn: {
        embedUrl: 'https://www.youtube-nocookie.com/embed/cZtrPFK0lbI',
        watchUrl: 'https://www.youtube.com/watch?v=cZtrPFK0lbI',
        sourceOrg: 'RBI',
        sourceOrgFullName: 'Reserve Bank of India',
        language: 'bn',
        languageLabel: 'বাংলা (Bengali)',
        duration: 'Official Awareness',
        isVerified: true,
        officialVideoTitle: 'RBI Cyber Security - BENGALI',
      },
      mr: {
        embedUrl: 'https://www.youtube-nocookie.com/embed/3uxOioF_FG4',
        watchUrl: 'https://www.youtube.com/watch?v=3uxOioF_FG4',
        sourceOrg: 'RBI',
        sourceOrgFullName: 'Reserve Bank of India',
        language: 'mr',
        languageLabel: 'मराठी (Marathi)',
        duration: 'Official Awareness',
        isVerified: true,
        officialVideoTitle: 'RBI Cyber Security - MARATHI',
      },
      gu: {
        embedUrl: 'https://www.youtube-nocookie.com/embed/EUCdpBMrYY4',
        watchUrl: 'https://www.youtube.com/watch?v=EUCdpBMrYY4',
        sourceOrg: 'RBI',
        sourceOrgFullName: 'Reserve Bank of India',
        language: 'gu',
        languageLabel: 'ગુજરાતી (Gujarati)',
        duration: 'Official Awareness',
        isVerified: true,
        officialVideoTitle: 'RBI Cyber Security - GUJARATHI',
      },
      ta: {
        embedUrl: 'https://www.youtube-nocookie.com/embed/W_wgq8koPV8',
        watchUrl: 'https://www.youtube.com/watch?v=W_wgq8koPV8',
        sourceOrg: 'RBI',
        sourceOrgFullName: 'Reserve Bank of India',
        language: 'ta',
        languageLabel: 'தமிழ் (Tamil)',
        duration: 'Official Awareness',
        isVerified: true,
        officialVideoTitle: 'RBI Card Security - Tamil',
      },
    },
  },

  {
    id: 'guaranteed_returns',
    category: 'guaranteed_returns',
    officialOrganization: 'NSE',
    officialOrgFullName: 'National Stock Exchange of India (NSE India)',
    officialSourcePage: 'https://www.nseindia.com/invest/investor-education',
    campaignName: 'NSE India — Say NO to Guaranteed Return Schemes',
    primaryRiskTriggers: [
      'guaranteed_returns',
      'artificial_profit',
      'daily_profit',
      'double_money',
      'risk_free',
      'fixed_yield',
      '40%',
      '100%',
    ],
    tags: ['SEBI Regulations', 'Guaranteed Returns', 'Stock Tips', 'Ponzi Scheme'],
    localizedTitle: {
      en: '📈 Guaranteed Returns Are Strictly Illegal',
      hi: '📈 गारंटीड रिटर्न का वादा कानूनी रूप से अवैध है',
      bn: '📈 নিশ্চিত রিটার্নের প্রতিশ্রুতি আইনত নিষিদ্ধ',
      mr: '📈 हमीदार परताव्याचे (Guaranteed Return) दावे बेकायदेशीर आहेत',
      gu: '📈 ખાતરીપૂર્વકનું વળતર (Guaranteed Return) કાયદેસર રીતે ગેરકાયદે છે',
      ta: '📈 உத்தரவாதமான வருமானம் சட்டவிரோதமானது',
    },
    localizedShortRule: {
      en: 'Under SEBI rules, NO ONE can guarantee fixed returns in the stock market.',
      hi: 'सेबी के नियमों के तहत शेयर बाज़ार में कोई भी निश्चित मुनाफे की गारंटी नहीं दे सकता।',
      bn: 'সেবি নিয়মানুযায়ী শেয়ার বাজারে কেউই নিশ্চিত লাভের গ্যারান্টি দিতে পারে না।',
      mr: 'सेबीच्या नियमांनुसार शेअर बाजारात कोणीही ठराविक नफ्याची हमी देऊ शकत नाही.',
      gu: 'સેબીના નિયમો અનુસાર શેરબજારમાં કોઈ નિશ્ચિત નફાની ગેરંટી આપી શકતું નથી.',
      ta: 'செபி விதிகளின்படி பங்குச்சந்தையில் எவரும் நிலையான லாபத்திற்கு உத்தரவாதம் அளிக்க முடியாது.',
    },
    localizedDescription: {
      en: 'Official NSE India regulatory video: SEBI regulations strictly prohibit any registered or unregistered person from offering guaranteed or assured profits.',
      hi: 'NSE इंडिया का आधिकारिक विनियामक वीडियो: सेबी के नियमों के अनुसार कोई भी व्यक्ति या संस्था शेयर बाजार में पक्के मुनाफे का वादा नहीं कर सकती।',
      bn: 'NSE ইন্ডিয়ার অফিসিয়াল সচেতনতা ভিডিও: সেবি বিধিমালার অধীনে কোনো নিবন্ধিত বা অনিবন্ধিত সংস্থা নির্দিষ্ট মুনাফার প্রতিশ্রুতি দিতে পারে না।',
      mr: 'NSE इंडियाचे अधिकृत मार्गदर्शन: सेबीच्या नियमांनुसार कोणालाही शेअर बाजारात हमीदार परतावा देण्याची परवानगी नाही.',
      gu: 'NSE ઈન્ડિયાનું સત્તાવાર વિડીયો: સેબીના નિયમો મુજબ કોઈપણ વ્યક્તિ કે સંસ્થા શેરબજારમાં નિશ્ચિત વળતરનું વચન આપી શકે નહીં.',
      ta: 'NSE இந்தியாவின் அதிகாரப்பூர்வ விழிப்புணர்வு: பங்குச்சந்தையில் நிலையான லாபத்தை உறுதியளிப்பது சட்டப்படி குற்றமாகும்.',
    },
    localizedMainRule: {
      en: '✅ MAIN RULE: Any scheme promising "guaranteed 20% / 40% monthly returns" or "double your money" is a fraudulent Ponzi scam.',
      hi: '✅ मुख्य नियम: "महीने में 40% गारंटीड मुनाफा" या "पैसे दोगुना" करने का दावा करने वाली हर योजना 100% फर्जी और गैरकानूनी है।',
      bn: '✅ মূল নিয়ম: "মাসে ২০%/৪০% নিশ্চিত লাভ" বা "টাকা দ্বিগুণ" করার যেকোনো দাবি সম্পূর্ণ জাল ও বেআইনি।',
      mr: '✅ मुख्य नियम: "महिन्याला २०% किंवा ४०% हमीदार नफा" किंवा "पैसे दुप्पट" करण्याचे दावे पूर्णपणे बनावट आहेत.',
      gu: '✅ મુખ્ય નિયમ: "દર મહિને ૨૦% કે ૪૦% ખાતરીપૂર્વકનું વળતર" અથવા "પૈસા ડબલ" કરવાનો દાવો સંપૂર્ણ છેતરપિંડી છે.',
      ta: '✅ முக்கிய விதி: "மாதாந்திர 20% / 40% உத்தரவாத லாபம்" அல்லது "பணம் இரட்டிப்பு" என்ற அனைத்து திட்டங்களும் மோசடியானவை.',
    },
    localizedAudioExplanation: {
      en: 'NiveshShield Safety Capsule: All securities investments are subject to market risks. Under SEBI regulations, no registered entity is permitted to promise assured returns. Do not transfer funds to anyone promising risk-free stock gains.',
      hi: 'निवेशशील्ड सुरक्षा कैप्सूल: शेयर बाजार का हर निवेश जोखिम के अधीन है। सेबी के नियमों के तहत कोई भी ब्रोकर या सलाहकार पक्के मुनाफे की गारंटी नहीं दे सकता। ऐसे झांसों में न आएं।',
      bn: 'নিবেশশীল্ড সুরক্ষা ক্যাপসুল: শেয়ার বাজারের সমস্ত বিনিয়োগেই বাজারগত ঝুঁকি রয়েছে। সেবির নিয়ম অনুযায়ী কোনো নিয়ন্ত্রিত সংস্থাই নির্দিষ্ট লাভের আশ্বাস দিতে পারে না।',
      mr: 'निवेशशील्ड सुरक्षा कॅप्सूल: शेअर बाजारातील सर्व गुंतवणुकी बाजाराच्या जोखमीच्या अधीन असतात. सेबीनुसार कोणालाही निश्चित नफ्याची हमी देण्याची परवानगी नाही.',
      gu: 'નિવેશશીલ્ડ સુરક્ષા કેપ્સ્યુલ: સિક્યોરિટીઝ માર્કેટમાં તમામ રોકાણો બજારના જોખમોને આધીન છે. સેબીના નિયમો અનુસાર કોઈ સંસ્થા ચોક્કસ વળતરની ગેરંટી આપી શકતી નથી.',
      ta: 'நிவேஷ்ஷீல்டு பாதுகாப்பு காப்ஸ்யூல்: பங்குச்சந்தை முதலீடுகள் அனைத்தும் சந்தை அபாயங்களுக்கு உட்பட்டவை. செபி விதிகளின்படி யாரும் நிலையான லாபத்தை உறுதியளிக்க முடியாது.',
    },
    takeaways: {
      en: [
        'Legitimate SEBI-registered brokers NEVER guarantee profits.',
        'High returns with zero risk is the hallmark of an illegal financial scam.',
        'Always check the intermediary license on sebi.gov.in before investing.',
      ],
      hi: [
        'सेबी में पंजीकृत असली ब्रोकर कभी भी मुनाफे की गारंटी नहीं देते।',
        'बिना किसी जोखिम के भारी मुनाफे का दावा वित्तीय धोखाधड़ी की पहचान है।',
        'निवेश करने से पहले हमेशा sebi.gov.in पर संस्था का लाइसेंस जांचें।',
      ],
      bn: [
        'সেবি-নিবন্ধিত আসল ব্রোকাররা কখনোই নিশ্চিত লাভের প্রতিশ্রুতি দেন না।',
        'কোনো ঝুঁকি ছাড়াই বিশাল লাভের আশ্বাসই হলো আর্থিক জালিয়াতির লক্ষণ।',
        'বিনিয়োগ করার আগে সর্বদা sebi.gov.in-এ নিবন্ধন নম্বর যাচাই করুন।',
      ],
      mr: [
        'सेबी नोंदणीकृत अधिकृत ब्रोकर कधीही नफ्याची हमी देत नाहीत.',
        'कोणत्याही जोखमीशिवाय मोठा नफा मिळणे हा फसवणुकीचा मुख्य संकेत आहे.',
        'गुंतवणूक करण्यापूर्वी नेहमी sebi.gov.in वर परवाना तपासा.',
      ],
      gu: [
        'સેબી રજિસ્ટર્ડ અસલી બ્રોકરો ક્યારેય નફાની ગેરંટી આપતા નથી.',
        'કોઈપણ જોખમ વિના મોટા નફાનો દાવો એ આર્થિક કૌભાંડનું સ્પષ્ટ લક્ષણ છે.',
        'રોકાણ કરતાં પહેલાં હંમેશાં sebi.gov.in પર સંસ્થાનું લાઇસન્સ ચકાસો.',
      ],
      ta: [
        'செபி பதிவு பெற்ற புரோக்கர்கள் ஒருபோதும் லாபத்திற்கு உத்தரவாதம் அளிப்பதில்லை.',
        'அபாயமின்றி அதிக லாபம் என்ற வாக்குறுதியே மோசடியின் முக்கிய அடையாளம்.',
        'முதலீடு செய்யும் முன் sebi.gov.in இணையதளத்தில் உரிமத்தை சரிபார்க்கவும்.',
      ],
    },
    videosByLanguage: {
      en: {
        embedUrl: 'https://www.youtube-nocookie.com/embed/3pvysUNgkSw',
        watchUrl: 'https://www.youtube.com/watch?v=3pvysUNgkSw',
        sourceOrg: 'NSE',
        sourceOrgFullName: 'National Stock Exchange of India',
        language: 'en',
        languageLabel: 'English',
        duration: '1:00',
        isVerified: true,
        officialVideoTitle: 'Beware of Assured Returns | #WeAtNSE',
      },
      hi: {
        embedUrl: 'https://www.youtube-nocookie.com/embed/AYIsqkXX4lc',
        watchUrl: 'https://www.youtube.com/watch?v=AYIsqkXX4lc',
        sourceOrg: 'NSE',
        sourceOrgFullName: 'National Stock Exchange of India',
        language: 'hi',
        languageLabel: 'हिन्दी (Hindi)',
        duration: '1:15',
        isVerified: true,
        officialVideoTitle: 'Stock Tips & Assured Returns? A Trap You Should Avoid',
      },
    },
  },

  {
    id: 'impersonation',
    category: 'impersonation',
    officialOrganization: 'I4C',
    officialOrgFullName: 'Indian Cybercrime Coordination Centre (I4C / CyberDost)',
    officialSourcePage: 'https://cybercrime.gov.in',
    campaignName: 'CyberDost (MHA) & RBI — Beware of Digital Arrest & Fake Officials',
    primaryRiskTriggers: [
      'impersonation',
      'grooming_authority',
      'digital_arrest',
      'police',
      'cbi',
      'customs',
      'sebi_officer',
      'court',
      'freeze_account',
    ],
    tags: ['Digital Arrest', 'Police Impersonation', 'Fake Court Order', 'Extortion'],
    localizedTitle: {
      en: '👮 "Digital Arrest" Does Not Exist In Law',
      hi: '👮 "डिजिटल अरेस्ट" जैसा कोई कानून नहीं होता',
      bn: '👮 আইনে "ডিজিটাল অ্যারেস্ট" বলে কিছু নেই',
      mr: '👮 कायद्यात "डिजिटल अरेस्ट" नावाचा कोणताही प्रकार नाही',
      gu: '👮 કાયદામાં "ડિજિટલ અરેસ્ટ" જેવું કશું જ નથી',
      ta: '👮 சட்டத்தில் "டிஜிட்டல் அரெஸ்ட்" என்ற ஒன்றே இல்லை',
    },
    localizedShortRule: {
      en: 'Police, CBI, or SEBI NEVER arrest people over Skype or WhatsApp video calls.',
      hi: 'पुलिस, सीबीआई या सेबी कभी भी व्हाट्सएप या स्काइप वीडियो कॉल पर गिरफ्तारी नहीं करती।',
      bn: 'পুলিশ, সিবিআই বা সেবি কখনোই হোয়াটসঅ্যাপ বা স্কাইপ ভিডিও কলে কাউকে গ্রেপ্তার করে না।',
      mr: 'पोलीस, सीबीआय किंवा सेबी कधीही व्हॉट्सअॅप किंवा स्काईप व्हिडिओ कॉलवर अटक करत नाहीत.',
      gu: 'પોલીસ, સીબીઆઈ કે સેબી ક્યારેય વોટ્સએપ કે સ્કાયપે વિડીયો કોલ પર ધરપકડ કરતી નથી.',
      ta: 'காவல்துறை, சிபிஐ அல்லது செபி ஒருபோதும் வாட்ஸ்அப் அல்லது ஸ்கைப் வீடியோ அழைப்பில் கைது செய்யாது.',
    },
    localizedDescription: {
      en: 'Official Ministry of Home Affairs (MHA / I4C) warning: Scammers impersonating law enforcement officers threaten citizens with "Digital Arrest" to extort funds into private bank accounts.',
      hi: 'गृह मंत्रालय (I4C) का आधिकारिक परामर्श: साइबर अपराधी पुलिस या जांच अधिकारी बनकर वीडियो कॉल पर लोगों को डराते हैं और पैसे ट्रांसफर करवाते हैं।',
      bn: 'স্বরাষ্ট্র মন্ত্রকের (I4C) সতর্কতা: জালিয়াতরা তদন্তকারী কর্মকর্তা সেজে ভিডিও কলে ভয় দেখায় এবং টাকা দাবি করে। এটি সম্পূর্ণ ভুয়া।',
      mr: 'केंद्रीय गृह मंत्रालयाचा (I4C) इशारा: सायबर गुन्हेगार अधिकारी असल्याचे भासवून व्हिडिओ कॉलवर भीती दाखवून पैसे उकळतात.',
      gu: 'ગૃહ મંત્રાલય (I4C) ની ચેતવણી: સાયબર ગુનેગારો પોલીસ બનીને વિડીયો કોલ પર ધમકાવે છે અને પૈસા પડાવે છે. આ ગુનો છે.',
      ta: 'மத்திய உள்துறை அமைச்சகத்தின் (I4C) எச்சரிக்கை: மோசடி செய்பவர்கள் அதிகாரிகளைப் போல நடித்து வீடியோ அழைப்பில் மிரட்டி பணம் பறிக்கிறார்கள்.',
    },
    localizedMainRule: {
      en: '✅ MAIN RULE: There is NO provision for "Digital Arrest" under Indian law. Law enforcement NEVER asks you to transfer money to "security" or "clearance" accounts.',
      hi: '✅ मुख्य नियम: भारतीय कानून में "डिजिटल अरेस्ट" जैसा कोई प्रावधान नहीं है। पुलिस या कोर्ट कभी भी आपसे किसी खाते में पैसे ट्रांसफर करने को नहीं कहते।',
      bn: '✅ मूल नियम: भारतीय আইনে "ডিজিটাল অ্যারেস্ট"-এর কোনো অস্তিত্ব নেই। পুলিশ কখনোই কোনো "ক্লিয়ারেন্স" অ্যাকাউন্টে টাকা পাঠাতে বলে না।',
      mr: '✅ मुख्य नियम: भारतीय कायद्यात "डिजिटल अरेस्ट" अशी कोणतीही तरतूद नाही. पोलीस कधीही पैसे ट्रान्सफर करण्यास सांगत नाहीत.',
      gu: '✅ મુખ્ય નિયમ: ભારતીય કાયદામાં "ડિજિટલ અરેસ્ટ" ની કોઈ જોગવાઈ નથી. પોલીસ ક્યારેય કોઈ ખાતામાં પૈસા મોકલવાનું કહેતી નથી.',
      ta: '✅ முக்கிய விதி: இந்திய சட்டத்தில் "டிஜிட்டல் அரெஸ்ட்" என்ற நடைமுறையே இல்லை. காவல்துறை ஒருபோதும் கணக்கிற்கு பணம் அனுப்பக் கோராது.',
    },
    localizedAudioExplanation: {
      en: 'NiveshShield Safety Capsule: If anyone claiming to be from Mumbai Police, CBI, ED, or SEBI calls on video and threatens you with an arrest warrant unless you pay money, disconnect immediately and dial 1930.',
      hi: 'निवेशशील्ड सुरक्षा कैप्सूल: यदि कोई व्यक्ति खुद को पुलिस, सीबीआई, नारकोटिक्स या सेबी का अधिकारी बताकर वीडियो कॉल करे और गिरफ्तारी का डर दिखाकर पैसे मांगे, तो तुरंत कॉल काटें और 1930 पर फोन करें।',
      bn: 'নিবেশশীল্ড সুরক্ষা ক্যাপসুল: যদি কেউ নিজেকে পুলিশ, সিবিআই বা সেবি কর্মকর্তা দাবি করে ভিডিও কলে গ্রেপ্তারের ভয় দেখিয়ে টাকা চায়, অবিলম্বে কল কেটে দিন এবং ১৯৩০ নম্বরে জানান।',
      mr: 'निवेशशील्ड सुरक्षा कॅप्सूल: जर कोणी स्वतःला पोलीस किंवा सीबीआय अधिकारी असल्याचे सांगून व्हिडिओ कॉलवर अटकेची धमकी देऊन पैसे मागितले, तर फोन कट करा आणि १९३० वर तक्रार करा.',
      gu: 'નિવેશશીલ્ડ સુરક્ષા કેપ્સ્યુલ: જો કોઈ વ્યક્તિ પોલીસ કે સીબીઆઈ અધિકારી હોવાનો દાવો કરીને વિડીયો કોલ પર ધરપકડની ધમકી આપીને પૈસા માંગે, તો તરત જ કોલ કાપીને ૧૯૩૦ પર ફોન કરો.',
      ta: 'நிவேஷ்ஷீல்டு பாதுகாப்பு காப்ஸ்யூல்: எவரேனும் காவல்துறை அல்லது சிபிஐ அதிகாரி என்று கூறி வீடியோ காலில் கைது செய்வதாக மிரட்டி பணம் கேட்டால், உடனடியாக அழைப்பைத் துண்டித்து 1930-ல் புகாரளிக்கவும்.',
    },
    takeaways: {
      en: [
        'No government agency conducts judicial proceedings or arrests over video calls.',
        'Never transfer your life savings to any "escrow" or "supervisory" bank account.',
        'Immediately disconnect and report the calling number to cybercrime.gov.in or 1930.',
      ],
      hi: [
        'कोई भी सरकारी एजेंसी वीडियो कॉल पर अदालती कार्रवाई या गिरफ्तारी नहीं करती।',
        'किसी भी अनजान "निगरानी" या "सरकारी" खाते में अपनी जमा पूंजी ट्रांसफर न करें।',
        'तुरंत कॉल काटें और उस नंबर की शिकायत cybercrime.gov.in या 1930 पर दर्ज करें।',
      ],
      bn: [
        'কোনো সরকারি সংস্থাই ভিডিও কলের মাধ্যমে বিচার বা গ্রেপ্তার করে না।',
        'কখনোই কোনো তথাকথিত "তদন্ত" অ্যাকাউন্টে নিজের টাকা পাঠাবেন না।',
        'অবিলম্বে কল কেটে দিয়ে cybercrime.gov.in বা ১৯৩০ নম্বরে রিপোর্ট করুন।',
      ],
      mr: [
        'कोणतीही सरकारी यंत्रणा व्हिडिओ कॉलवर अटक करत नाही.',
        'कोणत्याही "सुरक्षित" किंवा "तपास" खात्यात आपले कष्टाचे पैसे पाठवू नका.',
        'त्वरित कॉल कट करा आणि १९३० वर किंवा cybercrime.gov.in वर तक्रार नोंदवा.',
      ],
      gu: [
        'કોઈ સરકારી એજન્સી વિડીયો કોલ પર કાનૂની કાર્યવાહી કે ધરપકડ કરતી નથી.',
        'કોઈપણ "સુપરવાઇઝરી" ખાતામાં ક્યારેય તમારા પૈસા ટ્રાન્સફર કરશો નહીં.',
        'તરત જ કોલ કાપો અને તે નંબરની જાણ cybercrime.gov.in અથવા ૧૯૩૦ પર કરો.',
      ],
      ta: [
        'எந்தவொரு அரசு அமைப்பும் வீடியோ அழைப்புகள் மூலம் கைது செய்வதில்லை.',
        'எந்தவொரு "சரிபார்ப்பு" வங்கிக் கணக்கிற்கும் உங்கள் சேமிப்பை மாற்றாதீர்கள்.',
        'உடனடியாக அழைப்பைத் துண்டித்து 1930 எண்ணில் அல்லது cybercrime.gov.in-ல் புகாரளிக்கவும்.',
      ],
    },
    videosByLanguage: {
      en: {
        embedUrl: 'https://www.youtube-nocookie.com/embed/3jUyJYKH8bM',
        watchUrl: 'https://www.youtube.com/watch?v=3jUyJYKH8bM',
        sourceOrg: 'I4C',
        sourceOrgFullName: 'Indian Cybercrime Coordination Centre (MHA)',
        language: 'en',
        languageLabel: 'English',
        duration: '1:00',
        isVerified: true,
        officialVideoTitle: 'The Digital Arrest Scam That’s Tricking Thousands!',
      },
      hi: {
        embedUrl: 'https://www.youtube-nocookie.com/embed/RQ46CJBe3NQ',
        watchUrl: 'https://www.youtube.com/watch?v=RQ46CJBe3NQ',
        sourceOrg: 'RBI',
        sourceOrgFullName: 'Reserve Bank of India',
        language: 'hi',
        languageLabel: 'हिन्दी (Hindi)',
        duration: '0:45',
        isVerified: true,
        officialVideoTitle: 'RBI Digital Arrest – Handcuff',
      },
    },
  },

  {
    id: 'upi_payments',
    category: 'upi_payments',
    officialOrganization: 'NPCI',
    officialOrgFullName: 'National Payments Corporation of India (NPCI)',
    officialSourcePage: 'https://upichalega.com',
    campaignName: 'NPCI & UPI Chalega — Safe Digital Payments',
    primaryRiskTriggers: [
      'payment_request',
      'upfront_payment',
      'upi_transfer',
      'deposit',
      'registration_fee',
      'advance_fee',
      'pay_now',
    ],
    tags: ['UPI PIN', 'Payment Fraud', 'QR Code Scam', 'Money Request'],
    localizedTitle: {
      en: '💳 UPI PIN Is Only To Send Money',
      hi: '💳 UPI पिन सिर्फ पैसे भेजने के लिए होता है',
      bn: '💳 UPI পিন শুধুমাত্র টাকা পাঠানোর জন্য',
      mr: '💳 UPI पिन फक्त पैसे पाठवण्यासाठी असतो',
      gu: '💳 UPI પિન માત્ર પૈસા મોકલવા માટે જ છે',
      ta: '💳 UPI பின் பணம் அனுப்ப மட்டுமே தேவை',
    },
    localizedShortRule: {
      en: 'You NEVER enter your UPI PIN to receive money or lottery prizes.',
      hi: 'पैसे प्राप्त करने के लिए कभी भी UPI पिन दर्ज करने की आवश्यकता नहीं होती।',
      bn: 'টাকা গ্রহণ বা পুরস্কার পাওয়ার জন্য কখনোই UPI পিন দেওয়ার প্রয়োজন হয় না।',
      mr: 'पैसे मिळवण्यासाठी किंवा लॉटरी जिंकण्यासाठी कधीही UPI पिन टाकण्याची गरज नसते.',
      gu: 'પૈસા મેળવવા કે ઈનામ લેવા માટે ક્યારેય UPI પિન નાખવાની જરૂર નથી.',
      ta: 'பணம் பெற அல்லது பரிசுகளைப் பெற ஒருபோதும் UPI பின்னை உள்ளிட வேண்டியதில்லை.',
    },
    localizedDescription: {
      en: 'Official NPCI & RBI educational animation on the golden rule of UPI: entering a PIN always deducts money from your bank account.',
      hi: 'NPCI और भारतीय रिज़र्व बैंक का आधिकारिक नियम: UPI पिन डालने का मतलब हमेशा आपके खाते से पैसे कटना है, कभी पैसे आना नहीं।',
      bn: 'NPCI এবং আরবিআই-এর সুবর্ণ নিয়ম: UPI পিন দেওয়ার অর্থ হলো আপনার ব্যাংক অ্যাকাউন্ট থেকে টাকা কাটা, কখনোই টাকা জমা হওয়া নয়।',
      mr: 'NPCI आणि RBI चा सुवर्ण नियम: UPI पिन टाकण्याचा अर्थ तुमच्या खात्यातून पैसे डेबिट होणे असाच होतो.',
      gu: 'NPCI અને RBI નો સુવર્ણ નિયમ: UPI પિન નાખવાનો અર્થ એ છે કે તમારા ખાતામાંથી પૈસા કપાય છે, ક્યારેય પૈસા જમા થતા નથી.',
      ta: 'NPCI மற்றும் RBI-ன் பொன்விதி: UPI பின்னை உள்ளிடுவது உங்கள் கணக்கிலிருந்து பணத்தை கழிப்பதற்கே தவிர, பணம் பெறுவதற்கு அல்ல.',
    },
    localizedMainRule: {
      en: '✅ MAIN RULE: UPI PIN = Money Goes OUT. Scanning a QR code or entering your PIN to "receive money" will drain your account.',
      hi: '✅ मुख्य नियम: UPI पिन = पैसा बाहर जाता है। पैसा "प्राप्त" करने के लिए QR कोड स्कैन करना या पिन डालना धोखाधड़ी है।',
      bn: '✅ মূল নিয়ম: UPI পিন = টাকা চলে যায়। টাকা "পাওয়ার" জন্য QR কোড স্ক্যান করা বা পিন দেওয়া স্পষ্ট প্রতারণা।',
      mr: '✅ मुख्य नियम: UPI पिन = पैसे खात्यातून बाहेर जातात. पैसे "मिळवण्यासाठी" QR कोड स्कॅन करणे ही फसवणूक आहे.',
      gu: '✅ મુખ્ય નિયમ: UPI પિન = પૈસા બહાર જાય છે. પૈસા "મેળવવા" માટે QR કોડ સ્કેન કરવો એ છેતરપિંડી છે.',
      ta: '✅ முக்கிய விதி: UPI பின் = பணம் வெளியேறும். பணம் "பெறுவதற்காக" QR குறியீட்டை ஸ்கேன் செய்வது மோசடி.',
    },
    localizedAudioExplanation: {
      en: 'NiveshShield Safety Capsule: Remember the NPCI rule. You enter your UPI PIN only to transfer money out. If someone promises to send you money or a refund and asks you to enter your PIN, do not enter it.',
      hi: 'निवेशशील्ड सुरक्षा कैप्सूल: NPCI का नियम याद रखें। UPI पिन केवल पैसे भेजने के लिए होता है। यदि कोई कहे कि पैसे पाने के लिए पिन डालें, तो कभी न डालें।',
      bn: 'নিবেশশীল্ড সুরক্ষা ক্যাপসুল: NPCI-এর নিয়ম মনে রাখুন। UPI পিন কেবল টাকা পাঠানোর জন্য। টাকা পাওয়ার জন্য কখনোই পিন দেবেন না।',
      mr: 'निवेशशील्ड सुरक्षा कॅप्सूल: NPCI चा नियम नेहमी लक्षात ठेवा. पैसे पाठवतानाच UPI पिन लागतो. पैसे मिळवण्यासाठी पिन कधीही टाकू नका.',
      gu: 'નિવેશશીલ્ડ સુરક્ષા કેપ્સ્યુલ: NPCI નો નિયમ યાદ રાખો. UPI પિન માત્ર પૈસા મોકલવા માટે જ છે. પૈસા મેળવવા માટે ક્યારેય પિન નાખશો નહીં.',
      ta: 'நிவேஷ்ஷீல்டு பாதுகாப்பு காப்ஸ்யூல்: NPCI விதியை நினைவில் கொள்ளுங்கள். UPI பின் பணம் அனுப்ப மட்டுமே. பணம் பெற ஒருபோதும் பின் உள்ளிடாதீர்கள்.',
    },
    takeaways: {
      en: [
        'Entering your UPI PIN ALWAYS transfers money OUT of your account.',
        'Legitimate refunds and prizes NEVER require you to enter a PIN or scan a QR code.',
        'Never send advance registration fees to personal UPI handles.',
      ],
      hi: [
        'UPI पिन डालने का मतलब हमेशा पैसे कटना होता है।',
        'रिफंड या प्राइज प्राप्त करने के लिए कभी भी पिन या QR कोड की आवश्यकता नहीं होती।',
        'व्यक्तिगत UPI आईडी पर कभी भी अग्रिम रजिस्ट्रेशन शुल्क न भेजें।',
      ],
      bn: [
        'UPI পিন দেওয়ার মানে সবসময় আপনার অ্যাকাউন্ট থেকে টাকা কেটে নেওয়া।',
        'কোনো পুরস্কার বা রিফান্ডের জন্য পিন বা QR কোড স্ক্যান করতে হয় না।',
        'ব্যক্তিগত UPI আইডিতে কখনোই অগ্রিম ফি পাঠাবেন না।',
      ],
      mr: [
        'UPI पिन टाकल्यास तुमच्या खात्यातून पैसे कट होतात.',
        'रिफंड किंवा बक्षीस मिळवण्यासाठी पिन किंवा QR कोडची गरज नसते.',
        'वैयक्तिक UPI आयडीवर कधीही आगाऊ नोंदणी शुल्क पाठवू नका.',
      ],
      gu: [
        'UPI પિન નાખવાથી હંમેશા તમારા ખાતામાંથી પૈસા કપાય છે.',
        'રિફંડ કે ઇનામ મેળવવા માટે ક્યારેય પિન કે QR કોડની જરૂર હોતી નથી.',
        'વ્યક્તિગત UPI ID પર ક્યારેય એડવાન્સ રજીસ્ટ્રેશન ફી મોકલશો નહીં.',
      ],
      ta: [
        'UPI பின்னை உள்ளிட்டால் எப்போதும் உங்கள் கணக்கிலிருந்து பணம் கழியும்.',
        'பணம் அல்லது பரிசுகளைப் பெற பின் அல்லது QR குறியீடு தேவையில்லை.',
        'தனிப்பட்ட UPI ஐடிகளுக்கு முன்கூட்டியே கட்டணம் செலுத்தாதீர்கள்.',
      ],
    },
    videosByLanguage: {
      en: {
        embedUrl: 'https://www.youtube-nocookie.com/embed/J6OoGGkohX4',
        watchUrl: 'https://www.youtube.com/watch?v=J6OoGGkohX4',
        sourceOrg: 'NPCI',
        sourceOrgFullName: 'National Payments Corporation of India',
        language: 'en',
        languageLabel: 'English',
        duration: '1:00',
        isVerified: true,
        officialVideoTitle: 'Stay Ahead of Scammers: Protect Your UPI Payments',
      },
      hi: {
        embedUrl: 'https://www.youtube-nocookie.com/embed/BaePgTuKlH8',
        watchUrl: 'https://www.youtube.com/watch?v=BaePgTuKlH8',
        sourceOrg: 'NPCI',
        sourceOrgFullName: 'National Payments Corporation of India',
        language: 'hi',
        languageLabel: 'हिन्दी (Hindi)',
        duration: '0:45',
        isVerified: true,
        officialVideoTitle: 'Introducing UPI Safety Shield for safe and secure UPI payments',
      },
    },
  },

  {
    id: 'fake_apps',
    category: 'fake_apps',
    officialOrganization: 'NSE',
    officialOrgFullName: 'National Stock Exchange of India (NSE) & SEBI',
    officialSourcePage: 'https://investor.sebi.gov.in',
    campaignName: 'NSE & SEBI Investor Protection — Beware of Online Traps & Fake APKs',
    primaryRiskTriggers: [
      'unofficial_app',
      'apk',
      'sideload',
      'vip_app',
      'custom_link',
      'download_app',
      'install',
    ],
    tags: ['Fake APK', 'Telegram Groups', 'Fictitious Balance', 'Unregistered Apps'],
    localizedTitle: {
      en: '📱 Fake Trading Apps & Online Traps',
      hi: '📱 फर्जी ट्रेडिंग ऐप्स एवं अनधिकृत APK से सावधान',
      bn: '📱 ভুয়া ট্রেডিং অ্যাপ ও অনিবন্ধিত APK থেকে সাবধান',
      mr: '📱 बनावट ट्रेडिंग ॲप्स आणि अनधिकृत APK पासून सावध राहा',
      gu: '📱 બનાવટી ટ્રેડિંગ એપ્સ અને અનધિકૃત APK થી સાવધાન',
      ta: '📱 போலி டிரேடிங் செயலிகள் மற்றும் ஆபத்தான APK-கள்',
    },
    localizedShortRule: {
      en: 'Never install APK files sent via WhatsApp or Telegram groups.',
      hi: 'व्हाट्सएप या टेलीग्राम ग्रुप्स में भेजे गए APK फाइल्स को कभी इंस्टॉल न करें।',
      bn: 'হোয়াটসঅ্যাপ বা টেলিগ্রাম গ্রুপে পাঠানো কোনো APK ফাইল কখনো ইনস্টল করবেন না।',
      mr: 'व्हॉट्सअॅप किंवा टेलिग्राम ग्रुपमध्ये पाठवलेली APK फाईल कधीही इन्स्टॉल करू नका.',
      gu: 'વોટ્સએપ કે ટેલિગ્રામ ગ્રુપમાં મોકલેલી APK ફાઈલ ક્યારેય ઈન્સ્ટોલ ન કરો.',
      ta: 'வாட்ஸ்அப் அல்லது டெலிகிராம் குழுக்களில் அனுப்பப்படும் APK கோப்புகளை பதிவிறக்காதீர்கள்.',
    },
    localizedDescription: {
      en: 'Official NSE India & SEBI guidance: Cyber fraudsters create fake broker apps displaying simulated huge profits, but freeze withdrawals until victims deposit more money.',
      hi: 'NSE और सेबी का आधिकारिक परामर्श: धोखेबाज फर्जी ऐप्स बनाकर स्क्रीन पर लाखों का नकली मुनाफा दिखाते हैं, लेकिन पैसे निकालने के समय और टैक्स की मांग करते हैं।',
      bn: 'NSE ও সেবির আনুষ্ঠানিক সতর্কবার্তা: প্রতারকরা নকল অ্যাপ তৈরি করে স্ক্রিনে ভুয়া মুনাফা দেখায়, কিন্তু টাকা তোলার সময় আরও টাকা দাবি করে।',
      mr: 'NSE व सेबीचे अधिकृत आवाहन: फसवणूक करणारे बनावट ॲप्सवर खोटा नफा दाखवतात, पण पैसे काढताना अधिक पैसे मागून अडकवून ठेवतात.',
      gu: 'NSE અને સેબીનું સત્તાવાર માર્ગદર્શન: છેતરપિંડી કરનારાઓ નકલી એપ બનાવીને સ્ક્રીન પર નકલી નફો બતાવે છે, પરંતુ પૈસા ઉપાડવા દેતા નથી.',
      ta: 'NSE மற்றும் செபி வழிகாட்டுதல்: மோசடி செய்பவர்கள் போலியான செயலிகளை உருவாக்கி போலியான லாபத்தைக் காட்டுவார்கள், ஆனால் பணத்தை எடுக்க விடமாட்டார்கள்.',
    },
    localizedMainRule: {
      en: '✅ MAIN RULE: Trade exclusively through SEBI-registered brokers downloaded from official Google Play Store or Apple App Store. Never click .apk download links.',
      hi: '✅ मुख्य नियम: केवल आधिकारिक प्ले स्टोर या ऐप स्टोर से डाउनलोड किए गए सेबी-पंजीकृत ब्रोकर्स के जरिए ही निवेश करें। किसी भी .apk लिंक पर क्लिक न करें।',
      bn: '✅ মূল নিয়ম: শুধুমাত্র গুগল প্লে স্টোর বা অ্যাপল অ্যাপ স্টোর থেকে ডাউনলোড করা সেবি-নিবন্ধিত ব্রোকারদের মাধ্যমেই ট্রেড করুন। .apk লিংকে ক্লিক করবেন না।',
      mr: '✅ मुख्य नियम: फक्त अधिकृत प्ले स्टोअरवरून डाऊनलोड केलेल्या सेबी नोंदणीकृत ब्रोकर ॲप्सद्वारेच व्यवहार करा.',
      gu: '✅ મુખ્ય નિયમ: માત્ર સત્તાવાર ગૂગલ પ્લે સ્ટોર કે એપલ એપ સ્ટોર પરથી ડાઉનલોડ કરેલ સેબી રજિસ્ટર્ડ બ્રોકર દ્વારા જ ટ્રેડ કરો.',
      ta: '✅ முக்கிய விதி: அதிகாரப்பூர்வ கூகுள் ப்ளே ஸ்டோர் அல்லது ஆப்பிள் ஆப் ஸ்டோரிலிருந்து மட்டுமே செபி பதிவு பெற்ற புரோக்கர் செயலிகளைப் பதிவிறக்குங்கள்.',
    },
    localizedAudioExplanation: {
      en: 'NiveshShield Safety Capsule: If an online stock trading group shares a link to download an APK file, delete it immediately. Legitimate Indian stock brokers only distribute software via verified app stores.',
      hi: 'निवेशशील्ड सुरक्षा कैप्सूल: यदि कोई व्हाट्सएप या टेलीग्राम ग्रुप आपको ऐप या एपीके फाइल डाउनलोड करने को कहे, तो सावधान हो जाएं। असली ब्रोकर कभी एपीके फाइल नहीं भेजते।',
      bn: 'নিবেশশীল্ড সুরক্ষা ক্যাপসুল: যদি কোনো অনলাইন গ্রুপ আপনাকে কোনো APK ফাইল ডাউনলোড করতে বলে, তবে সেটি অবিলম্বে মুছে ফেলুন। প্রকৃত ব্রোকাররা শুধু অফিসিয়াল স্টোরেই অ্যাপ রাখেন।',
      mr: 'निवेशशील्ड सुरक्षा कॅप्सूल: व्हॉट्सअॅपवर किंवा टेलिग्रामवर आलेली कोणतीही APK फाईल डाऊनलोड करू नका. अधिकृत ब्रोकर कधीही अशा लिंक्स देत नाहीत.',
      gu: 'નિવેશશીલ્ડ સુરક્ષા કેપ્સ્યુલ: જો કોઈ ગ્રુપ તમને APK ફાઈલ ડાઉનલોડ કરવાની લિંક આપે, તો તરત જ સાવધ થઈ જાવ. વાસ્તવિક બ્રોકરો માત્ર ઓફિશિયલ એપ સ્ટોર પર જ ઉપલબ્ધ હોય છે.',
      ta: 'நிவேஷ்ஷீல்டு பாதுகாப்பு காப்ஸ்யூல்: ஆன்லைன் பங்கு வர்த்தக குழுக்கள் APK கோப்பைப் பதிவிறக்கக் கூறினால் உடனே தவிர்க்கவும். உண்மையான புரோக்கர்கள் அதிகாரப்பூர்வ ஆப் ஸ்டோரில் மட்டுமே இருப்பார்கள்.',
    },
    takeaways: {
      en: [
        'Sideloaded APKs can read your SMS, intercept banking OTPs, and steal passwords.',
        'The profits shown on unverified apps are simulated graphics, not real money.',
        'Report malicious APK links to sancharsaathi.gov.in (Chakshu portal).',
      ],
      hi: [
        'अनधिकृत APK आपके फोन के SMS और बैंक OTP चोरी कर सकते हैं।',
        'फर्जी ऐप पर दिखने वाला मुनाफा केवल कंप्यूटर पर बना नकली नंबर होता है।',
        'ऐसे लिंक की शिकायत संचार साथी (Chakshu) या 1930 पर दर्ज करें।',
      ],
      bn: [
        'অনিবন্ধিত APK আপনার ফোনের SMS ও ব্যাংকের OTP চুরি করতে পারে।',
        'নকল অ্যাপে প্রদর্শিত লাভ আসলে গ্রাফিক্স, বাস্তব টাকা নয়।',
        'সন্দেহজনক লিংক পেলে সঞ্চার সাথী বা ১৯৩০ নম্বরে রিপোর্ট করুন।',
      ],
      mr: [
        'अनधिकृत APK तुमच्या मोबाईलमधील मेसेज आणि बँक OTP चोरू शकतात.',
        'बनावट ॲपवर दिसणारा नफा हा खोटा असतो, खरे पैसे नसतात.',
        'अशा संशयास्पद लिंक्सची तक्रार sancharsaathi.gov.in किंवा १९३० वर करा.',
      ],
      gu: [
        'અનધિકૃત APK તમારા ફોનના SMS અને બેંકિંગ OTP ચોરી શકે છે.',
        'નકલી એપ પર દેખાતો નફો માત્ર કમ્પ્યુટર ગ્રાફિક્સ છે, વાસ્તવિક પૈસા નથી.',
        'શંકાસ્પદ લિંક્સની જાણ sancharsaathi.gov.in અથવા ૧૯૩૦ પર કરો.',
      ],
      ta: [
        'அங்கீகரிக்கப்படாத APK உங்கள் SMS மற்றும் வங்கி OTP-களை திருடக்கூடும்.',
        'போலி செயலிகளில் காட்டப்படும் லாபம் ஒரு கணினி வரைகலை மட்டுமே, உண்மை பணம் அல்ல.',
        'சந்தேகத்திற்கிடமான இணைப்புகளை sancharsaathi.gov.in அல்லது 1930-ல் புகாரளிக்கவும்.',
      ],
    },
    videosByLanguage: {
      en: {
        embedUrl: 'https://www.youtube-nocookie.com/embed/6653Rg8Uj5A',
        watchUrl: 'https://www.youtube.com/watch?v=6653Rg8Uj5A',
        sourceOrg: 'NSE',
        sourceOrgFullName: 'National Stock Exchange of India',
        language: 'en',
        languageLabel: 'English',
        duration: '1:30',
        isVerified: true,
        officialVideoTitle: 'Invest Safely: Beware of Online Influencers while investing in Capital Markets',
      },
      hi: {
        embedUrl: 'https://www.youtube-nocookie.com/embed/90LfUk9hgdc',
        watchUrl: 'https://www.youtube.com/watch?v=90LfUk9hgdc',
        sourceOrg: 'NSE',
        sourceOrgFullName: 'National Stock Exchange of India',
        language: 'hi',
        languageLabel: 'हिन्दी (Hindi)',
        duration: '1:00',
        isVerified: true,
        officialVideoTitle: 'Beware of Guaranteed Returns!',
      },
    },
  },

  {
    id: 'phishing_links',
    category: 'phishing_links',
    officialOrganization: 'RBI',
    officialOrgFullName: 'Reserve Bank of India & I4C CyberDost',
    officialSourcePage: 'https://rbikehtahai.rbi.org.in',
    campaignName: 'RBI Kehta Hai — Beware of Phishing SMS and Suspicious Links',
    primaryRiskTriggers: [
      'suspicious_link',
      'phishing',
      'url',
      'short_url',
      'bitly',
      'tinyurl',
      'kyc_update',
      'lottery',
      'electricity_bill',
    ],
    tags: ['Phishing Links', 'Fake SMS', 'KYC Fraud', 'Shortened URLs'],
    localizedTitle: {
      en: '🔗 Phishing Links & Fake Reward SMS',
      hi: '🔗 संदेहास्पद लिंक एवं फर्जी मैसेज से बचाव',
      bn: '🔗 ক্ষতিকারক লিংক ও ভুয়া এসএমএস থেকে সুরক্ষা',
      mr: '🔗 संशयास्पद लिंक्स आणि बनावट एसएमएसपासून सावध',
      gu: '🔗 શંકાસ્પદ લિંક્સ અને નકલી એસએમએસથી સાવચેતી',
      ta: '🔗 ஆபத்தான இணைப்புகள் மற்றும் போலி குறுஞ்செய்திகள்',
    },
    localizedShortRule: {
      en: 'Never click on shortened links sent via SMS claiming your account or SIM will be blocked.',
      hi: 'अकाउंट ब्लॉक होने या लॉटरी जीतने का दावा करने वाले किसी भी अनजान लिंक पर क्लिक न करें।',
      bn: 'অ্যাকাউন্ট ব্লক বা লটারি জেতার দাবি করে পাঠানো কোনো লিংকে কখনোই ক্লিক করবেন না।',
      mr: 'अकाउंट बंद होईल अशी भीती दाखवणाऱ्या कोणत्याही अनोळखी लिंकवर क्लिक करू नका.',
      gu: 'ખાતું બ્લોક થવાની કે ઇનામ જીતવાની લાલચ આપતી કોઈપણ અજાણી લિંક પર ક્લિક ન કરો.',
      ta: 'வங்கி கணக்கு முடக்கப்படும் அல்லது பரிசு வென்றதாகக் கூறும் இணைப்புகளைத் தொடாதீர்கள்.',
    },
    localizedDescription: {
      en: 'Official RBI & CyberDost security video on deceptive SMS messages mimicking banks, electricity departments, or lottery agencies designed to harvest credentials.',
      hi: 'रिज़र्व बैंक और साइबर दोस्त का आधिकारिक वीडियो: बैंक या बिजली बिल के नाम पर फर्जी लिंक भेजकर पासवर्ड चुराने वाले साइबर फ्रॉड से कैसे बचें।',
      bn: 'আরবিআই ও সাইবার দোস্তের সচেতনতা ভিডিও: ব্যাংক বা বিদ্যুৎ বিলের নামে ভুয়া লিংক পাঠিয়ে পাসওয়ার্ড হাতিয়ে নেওয়ার প্রতারণা থেকে সাবধান থাকুন।',
      mr: 'आरबीआय आणि सायबर दोस्तचे मार्गदर्शन: बँक किंवा वीज बिलाच्या नावाखाली संशयास्पद लिंक्स पाठवून पासवर्ड चोरणाऱ्यांपासून सुरक्षित राहा.',
      gu: 'આરબીઆઈ અને સાયબર દોસ્તનો સત્તાવાર વિડીયો: બેંક કે વીજળી બિલના નામે નકલી લિંક મોકલીને પાસવર્ડ ચોરનારાઓથી સાવચેત રહો.',
      ta: 'ரிசர்வ் வங்கி மற்றும் சைபர் தோஸ்த் எச்சரிக்கை: வங்கி அல்லது மின்சார கட்டணம் என்ற பெயரில் போலி இணைப்புகளை அனுப்பி கடவுச்சொற்களை திருடும் மோசடி.',
    },
    localizedMainRule: {
      en: '✅ MAIN RULE: Banks and government departments communicate ONLY from official 6-character registered DLT sender IDs, never from personal 10-digit mobile numbers with shortened bit.ly links.',
      hi: '✅ मुख्य नियम: बैंक हमेशा 6-अक्षरों वाले रजिस्टर्ड सेंडर आईडी (जैसे AX-HDFCBK) से मैसेज भेजते हैं, कभी भी 10-अंकों वाले मोबाइल नंबर या bit.ly लिंक से नहीं।',
      bn: '✅ মূল नियम: ব্যাংক সর্বদা ৬ অক্ষরের রেজিস্টার্ড আইডি থেকে মেসেজ পাঠায়, কখনোই সাধারণ ১০ সংখ্যার মোবাইল নম্বর বা bit.ly লিংক থেকে নয়।',
      mr: '✅ मुख्य नियम: अधिकृत बँका नेहमी ६-अक्षरी नोंदणीकृत सेंडर आयडीवरून मेसेज पाठवतात, १०-अंकी वैयक्तिक मोबाईल नंबरवरून नाही.',
      gu: '✅ મુખ્ય નિયમ: બેંકો હંમેશાં ૬-અક્ષરવાળા સત્તાવાર સિક્યોર સેન્ડર ID પરથી સંદેશા મોકલે છે, ૧૦-અંકના સામાન્ય મોબાઈલ નંબરથી નહીં.',
      ta: '✅ முக்கிய விதி: வங்கிகள் எப்போதும் 6 எழுத்துக்கள் கொண்ட அதிகாரப்பூர்வ ஐடியிலிருந்து மட்டுமே குறுஞ்செய்தி அனுப்பும், 10 இலக்க எண்களிலிருந்து அல்ல.',
    },
    localizedAudioExplanation: {
      en: 'NiveshShield Safety Capsule: If you receive a text message claiming your bank account or PAN card is blocked and asking you to click a link to update KYC, do not click. Contact your bank directly.',
      hi: 'निवेशशील्ड सुरक्षा कैप्सूल: यदि कोई मैसेज आए कि आपका बैंक अकाउंट या पैन कार्ड बंद होने वाला है और KYC अपडेट के लिए लिंक पर क्लिक करें, तो कभी क्लिक न करें। अपनी बैंक शाखा से संपर्क करें।',
      bn: 'নিবেশশীল্ড সুরক্ষা ক্যাপসুল: যদি কোনো মেসেজে বলা হয় আপনার ব্যাংক অ্যাকাউন্ট বন্ধ হয়ে যাবে এবং KYC করতে লিংকে ক্লিক করতে হবে, তবে কখনোই ক্লিক করবেন না। সরাসরি ব্যাংকে যান।',
      mr: 'निवेशशील्ड सुरक्षा कॅप्सूल: तुमचे बँक खाते किंवा पॅन कार्ड बंद होईल अशी भीती दाखवून KYC अपडेट करण्यासाठी लिंकवर क्लिक करण्यास सांगितले तर कधीही करू नका.',
      gu: 'નિવેશશીલ્ડ સુરક્ષા કેપ્સ્યુલ: જો કોઈ મેસેજ આવે કે તમારું બેંક એકાઉન્ટ કે પાન કાર્ડ બ્લોક થઈ જશે અને KYC અપડેટ કરવા લિંક આપેલ હોય, તો ક્યારેય ક્લિક ન કરો.',
      ta: 'நிவேஷ்ஷீல்டு பாதுகாப்பு காப்ஸ்யூல்: உங்கள் வங்கிக் கணக்கு முடக்கப்படும் என்றும் KYC புதுப்பிக்க இணைப்பை கிளிக் செய்யுமாறும் வரும் செய்திகளை நம்பாதீர்கள்.',
    },
    takeaways: {
      en: [
        'Inspect the sender ID: Official financial institutions never text from personal 10-digit mobile numbers.',
        'Never enter net banking credentials on pages reached through SMS links.',
        'Forward fraudulent SMS to 1909 or report on sancharsaathi.gov.in (Chakshu facility).',
      ],
      hi: [
        'सेंडर आईडी जांचें: बैंक कभी भी सामान्य 10-अंकों वाले मोबाइल नंबर से मैसेज नहीं भेजते।',
        'एसएमएस में आए लिंक पर जाकर कभी भी अपनी नेट बैंकिंग आईडी या पासवर्ड न डालें।',
        'ऐसे धोखेबाज मैसेज की शिकायत 1909 पर या sancharsaathi.gov.in पर करें।',
      ],
      bn: [
        'স্যান্ডার আইডি পরীক্ষা করুন: ব্যাংক কখনোই ব্যক্তিগত ১০ সংখ্যার নম্বর থেকে বার্তা পাঠায় না।',
        'এসএমএসের লিংকে গিয়ে কখনোই আপনার নেট ব্যাংকিং পাসওয়ার্ড দেবেন না।',
        'প্রতারণামূলক এসএমএসের তথ্য সঞ্চার সাথী বা ১৯০৯ নম্বরে জানান।',
      ],
      mr: [
        'सेंडर आयडी तपासा: अधिकृत बँका १०-अंकी मोबाईल नंबरवरून कधीही मेसेज करत नाहीत.',
        'मेसेजमधील लिंकवर जाऊन कधीही तुमचा पासवर्ड किंवा नेट बँकिंग तपशील भरू नका.',
        'अशा संशयास्पद मेसेजची तक्रार sancharsaathi.gov.in वर करा.',
      ],
      gu: [
        'સેન્ડર ID તપાસો: બેંક ક્યારેય સામાન્ય ૧૦-અંકના મોબાઈલ નંબર પરથી મેસેજ કરતી નથી.',
        'મેસેજમાં આવેલી લિંક પર જઈને ક્યારેય તમારો નેટ બેંકિંગ પાસવર્ડ નાખશો નહીં.',
        'આવા છેતરપિંડીવાળા સંદેશાઓની ફરિયાદ sancharsaathi.gov.in પર કરો.',
      ],
      ta: [
        'அனுப்புநர் ஐடியை சரிபார்க்கவும்: வங்கிகள் தனிப்பட்ட 10 இலக்க எண்களிலிருந்து செய்திகளை அனுப்புவதில்லை.',
        'குறுஞ்செய்தி இணைப்புகள் வழியாக இணைய வங்கி கடவுச்சொற்களை ஒருபோதும் உள்ளிடாதீர்கள்.',
        'சந்தேகத்திற்கிடமான செய்திகளை sancharsaathi.gov.in-ல் புகாரளிக்கவும்.',
      ],
    },
    videosByLanguage: {
      en: {
        embedUrl: 'https://www.youtube-nocookie.com/embed/8-PvJCKhIaw',
        watchUrl: 'https://www.youtube.com/watch?v=8-PvJCKhIaw',
        sourceOrg: 'RBI',
        sourceOrgFullName: 'Reserve Bank of India',
        language: 'en',
        languageLabel: 'English',
        duration: 'Official Awareness',
        isVerified: true,
        officialVideoTitle: '🎙 RBI Talks: From Paisa to Policy | Demystifying KYC',
      },
      hi: {
        embedUrl: 'https://www.youtube-nocookie.com/embed/AABDnX2xhs8',
        watchUrl: 'https://www.youtube.com/watch?v=AABDnX2xhs8',
        sourceOrg: 'RBI',
        sourceOrgFullName: 'Reserve Bank of India',
        language: 'hi',
        languageLabel: 'हिन्दी (Hindi)',
        duration: 'Official Awareness',
        isVerified: true,
        officialVideoTitle: 'RBI Security of Digital Transaction - Hindi',
      },
    },
  },
]

/**
 * Normalizes input language code to one of our 6 supported languages.
 * Default fallback is 'en' if not recognized.
 */
export function normalizeLanguageCode(lang?: string): SupportedLanguage {
  if (!lang) return 'en'
  const lower = lang.toLowerCase().trim()
  if (lower === 'hi' || lower.startsWith('hi-')) return 'hi'
  if (lower === 'bn' || lower.startsWith('bn-')) return 'bn'
  if (lower === 'mr' || lower.startsWith('mr-')) return 'mr'
  if (lower === 'gu' || lower.startsWith('gu-')) return 'gu'
  if (lower === 'ta' || lower.startsWith('ta-')) return 'ta'
  return 'en'
}

/**
 * Contextual recommendation engine:
 * Evaluates the analysis findings, scam stage, and entities to immediately select
 * the highest-priority official Safety Capsule matching the danger the user is facing.
 */
export function findRecommendedCapsule(
  analysis: AnalysisResult | null | undefined,
): SafetyCapsule {
  if (!analysis) {
    // Default high-value capsule
    return SAFETY_CAPSULES_CATALOG[0] // OTP & Credential Security
  }

  const indicators = (analysis.findings || []).map((f) => f.indicator.toLowerCase())
  const textBlob = `${analysis.extracted_text || ''} ${analysis.summary || ''} ${
    analysis.fatal_category || ''
  } ${indicators.join(' ')}`.toLowerCase()

  // 1. Critical Check: OTP or Credential / Card Phishing
  if (
    indicators.includes('other_warning_sign') ||
    textBlob.includes('otp') ||
    textBlob.includes('cvv') ||
    textBlob.includes('atm pin') ||
    textBlob.includes('card photo') ||
    textBlob.includes('cheque photo') ||
    textBlob.includes('card_photo') ||
    analysis.fatal_category === 'CARD_PHOTO_HARVESTING' ||
    analysis.fatal_category === 'OTP_SOLICITATION'
  ) {
    const capsule = SAFETY_CAPSULES_CATALOG.find((c) => c.id === 'otp_credentials')
    if (capsule) return capsule
  }

  // 2. Check: Fake APK / Sideloaded App
  if (
    indicators.includes('unofficial_app') ||
    textBlob.includes('apk') ||
    textBlob.includes('.apk') ||
    textBlob.includes('sideload') ||
    textBlob.includes('app download') ||
    textBlob.includes('terminal app')
  ) {
    const capsule = SAFETY_CAPSULES_CATALOG.find((c) => c.id === 'fake_apps')
    if (capsule) return capsule
  }

  // 3. Check: Impersonation / Digital Arrest / Law Enforcement
  if (
    indicators.includes('impersonation') ||
    textBlob.includes('digital arrest') ||
    textBlob.includes('police') ||
    textBlob.includes('cbi') ||
    textBlob.includes('officer') ||
    textBlob.includes('customs') ||
    textBlob.includes('narcotics') ||
    textBlob.includes('sebi officer') ||
    textBlob.includes('court')
  ) {
    const capsule = SAFETY_CAPSULES_CATALOG.find((c) => c.id === 'impersonation')
    if (capsule) return capsule
  }

  // 4. Check: Guaranteed Returns / High Yield
  if (
    indicators.includes('guaranteed_returns') ||
    textBlob.includes('guaranteed') ||
    textBlob.includes('40%') ||
    textBlob.includes('double') ||
    textBlob.includes('fixed return') ||
    textBlob.includes('daily profit') ||
    textBlob.includes('monthly profit') ||
    textBlob.includes('risk-free')
  ) {
    const capsule = SAFETY_CAPSULES_CATALOG.find((c) => c.id === 'guaranteed_returns')
    if (capsule) return capsule
  }

  // 5. Check: UPI or Payment Request
  if (
    indicators.includes('upfront_payment') ||
    textBlob.includes('upi') ||
    textBlob.includes('advance fee') ||
    textBlob.includes('deposit') ||
    textBlob.includes('registration fee') ||
    textBlob.includes('qr code')
  ) {
    const capsule = SAFETY_CAPSULES_CATALOG.find((c) => c.id === 'upi_payments')
    if (capsule) return capsule
  }

  // 6. Check: Suspicious Link / Phishing
  if (
    indicators.includes('suspicious_link') ||
    textBlob.includes('http') ||
    textBlob.includes('link') ||
    textBlob.includes('bit.ly') ||
    textBlob.includes('tinyurl') ||
    textBlob.includes('kyc')
  ) {
    const capsule = SAFETY_CAPSULES_CATALOG.find((c) => c.id === 'phishing_links')
    if (capsule) return capsule
  }

  // Default to OTP / Credential Security capsule
  return SAFETY_CAPSULES_CATALOG[0]
}

/**
 * Returns all capsules in the catalog.
 */
export function getUniversalSafetyCapsules(): SafetyCapsule[] {
  return SAFETY_CAPSULES_CATALOG
}
