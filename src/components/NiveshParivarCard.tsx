import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnalysisResult } from '../api'

interface NiveshParivarCardProps {
  analysis?: AnalysisResult | null
  extractedText?: string
}

const REGIONAL_WARNING_TEMPLATES: Record<
  string,
  {
    title: string
    alertTag: string
    rule1: string
    rule2: string
    rule3: string
    action: string
    helplineText: string
    speechText: string
  }
> = {
  hi: {
    title: 'निवेश परिवार चेतावनी कार्ड (Nivesh Parivar Shield)',
    alertTag: '🔴 चेतावनी: फर्जी निवेश व मुनाफे का झांसा',
    rule1: 'सेबी (SEBI) नियम अनुसार शेयर बाजार या ट्रेडिंग में कोई भी पक्का मुनाफा (Guaranteed Returns) नहीं दे सकता।',
    rule2: 'कभी भी किसी व्यक्तिगत बैंक खाते या पर्सनल UPI आईडी में निवेश के नाम पर पैसे न भेजें।',
    rule3: 'व्हाट्सएप या टेलीग्राम ग्रुप में मिले स्टॉक टिप्स से बचें। यह अनधिकृत और जोखिम भरा है।',
    action: 'परिवार में किसी भी निवेश से पहले बड़ों और सेबी पंजीकृत सलाहकारों से चर्चा करें।',
    helplineText: 'वित्तीय धोखाधड़ी हेल्पलाइन: 1930 | cybercrime.gov.in',
    speechText:
      'निवेश परिवार चेतावनी। ध्यान दें: सेबी के नियमों के अनुसार कोई भी व्यक्ति शेयर बाजार में पक्का मुनाफा गारंटी नहीं दे सकता। किसी भी निजी यूपीआई या खाते में पैसे न भेजें। यदि कोई समस्या हो तो तुरंत राष्ट्रीय साइबर हेल्पलाइन 1930 पर कॉल करें।',
  },
  mr: {
    title: 'गुंतवणूक कुटुंब दक्षता कार्ड (Nivesh Parivar Shield)',
    alertTag: '🔴 सावधान: हमी परताव्याच्या खोट्या योजनांपासून सावध रहा',
    rule1: 'सेबीच्या नियमांनुसार शेअर बाजारात निश्चित किंवा हमी परतावा (Guaranteed Returns) देणे बेकायदेशीर आहे.',
    rule2: 'गुंतवणुकीच्या नावाखाली कोणत्याही वैयक्तिक बँक खात्यावर किंवा खाजगी UPI वर पैसे पाठवू नका.',
    rule3: 'टेलिग्राम किंवा व्हॉट्सअॅप ग्रुपवरील अनधिकृत सल्ल्यावर विश्वास ठेवू नका.',
    action: 'पैसे गुंतवण्यापूर्वी कुटुंबाशी चर्चा करा आणि SEBI नोंदणीकृत मध्यस्थांची खात्री करा.',
    helplineText: 'सायबर फसवणूक हेल्पलाइन: 1930 | cybercrime.gov.in',
    speechText:
      'गुंतवणूक कुटुंब दक्षता सूचना. शेअर बाजारात हमी परतावा देणे बेकायदेशीर आहे. खाजगी यूपीआय वर पैसे पाठवू नका. मदतीसाठी १९३० या हेल्पलाइनवर संपर्क साधा.',
  },
  bn: {
    title: 'বিনিয়োগ পরিবার সুরক্ষা কার্ড (Nivesh Parivar Shield)',
    alertTag: '🔴 সতর্কবার্তা: নিশ্চিত মুনাফার ফাঁদ থেকে সাবধান',
    rule1: 'সেবির (SEBI) নিয়ম অনুসারে শেয়ার বাজারে কখনই নিশ্চিত রিটার্ন বা গ্যারান্টিযুক্ত লাভ দেওয়া যায় না।',
    rule2: 'বিনিয়োগের জন্য কোনো ব্যক্তিগত ব্যাংক অ্যাকাউন্ট বা ব্যক্তিগত ইউপিআই (UPI)-তে টাকা পাঠাবেন না।',
    rule3: 'হোয়াটসঅ্যাপ বা টেলিগ্রাম গ্রুপে পাওয়া স্টক টিপস সম্পূর্ণ অননুমোদিত এবং বিপজ্জনক।',
    action: 'টাকা পাঠানোর আগে পরিবারের সাথে কথা বলুন এবং অফিসিয়াল সেবি পোর্টাল চেক করুন।',
    helplineText: 'সাইবার ক্রাইম হেল্পলাইন: 1930 | cybercrime.gov.in',
    speechText:
      'বিনিয়োগ পরিবার সতর্কতা। শেয়ার বাজারে নিশ্চিত লাভের প্রলোভন বেআইনি। ব্যক্তিগত একাউন্টে টাকা পাঠাবেন না। প্রয়োজনে ১৯৩০ নম্বরে কল করুন।',
  },
  ta: {
    title: 'முதலீட்டாளர் குடும்பப் பாதுகாப்பு அட்டை (Nivesh Parivar Shield)',
    alertTag: '🔴 எச்சரிக்கை: போலி லாப வாக்குறுதிகளை நம்பாதீர்கள்',
    rule1: 'செபி (SEBI) விதிகளின்படி பங்குச்சந்தையில் உறுதிசெய்யப்பட்ட லாபம் (Guaranteed Returns) தருவது சட்டவிரோதமானது.',
    rule2: 'முதலீடு என்ற பெயரில் எந்தவொரு தனிநபர் வங்கிக் கணக்கிற்கும் அல்லது UPI-க்கும் பணம் அனுப்பாதீர்கள்.',
    rule3: 'வாட்ஸ்அப் மற்றும் டெலிகிராம் குழுக்களில் வரும் தகவல்கள் பெரும்பாலும் அங்கீகரிக்கப்படாத மோசடிகள்.',
    action: 'பணம் முதலீடு செய்வதற்கு முன் குடும்பத்தினருடன் கலந்து ஆலோசித்து செபி இணையதளத்தில் சரிபார்க்கவும்.',
    helplineText: 'சைபர் நிதி மோசடி உதவி எண்: 1930 | cybercrime.gov.in',
    speechText:
      'முதலீட்டாளர் பாதுகாப்பு எச்சரிக்கை. பங்குச்சந்தையில் உறுதிசெய்யப்பட்ட லாப வாக்குறுதி சட்டவிரோதம். தனிநபர் கணக்கிற்கு பணம் அனுப்பாதீர்கள். உதவிக்கு 1930-ஐ அழைக்கவும்.',
  },
  gu: {
    title: 'રોકાણ પરિવાર સુરક્ષા કાર્ડ (Nivesh Parivar Shield)',
    alertTag: '🔴 સાવધાન: પાકા નફાની લોભામણી સ્કીમોથી બચો',
    rule1: 'સેબી (SEBI) ના નિયમો મુજબ શેરબજારમાં કોઈ પણ ગેરંટીડ રિટર્ન કે નિશ્ચિત નફો આપી શકતું નથી.',
    rule2: 'રોકાણ કરવા માટે કોઈ પણ વ્યક્તિગત બેંક ખાતા કે પ્રાઇવેટ UPI આઈડી પર પૈસા ન મોકલો.',
    rule3: 'વોટ્સએપ કે ટેલિગ્રામ ગ્રુપમાં અપાતી ટીપ્સ અનધિકૃત અને જોખમી છે.',
    action: 'કોઈપણ જગ્યાએ નાણાં રોકતા પહેલા પરિવાર સાથે ચર્ચા કરો અને SEBI રજીસ્ટ્રેશન તપાસો.',
    helplineText: 'સાયબર ફ્રોડ હેલ્પલાઇન: 1930 | cybercrime.gov.in',
    speechText:
      'રોકાણ પરિવાર સુરક્ષા ચેતવણી. શેરબજારમાં નિશ્ચિત નફાની લાલચ ગેરકાયદેસર છે. ખાનગી ખાતામાં નાણાં ન ટ્રાન્સફર કરો. મદદ માટે ૧૯૩૦ પર સંપર્ક કરો.',
  },
  en: {
    title: 'Family Investor Protection Warning Card (Nivesh Parivar Shield)',
    alertTag: '🔴 Caution: Potential Investment Solicitation Warning',
    rule1: 'SEBI regulations strictly prohibit anyone from guaranteeing fixed or assured returns on equity investments.',
    rule2: 'Never transfer funds for stock trading to an individual savings account or personal UPI ID.',
    rule3: 'Unsolicited WhatsApp / Telegram stock tipping groups are unmonitored and carry high financial fraud risk.',
    action: 'Discuss any investment decision with family members and verify advisors on sebi.gov.in before transferring funds.',
    helplineText: 'National Cyber Crime Financial Fraud Helpline: 1930 | cybercrime.gov.in',
    speechText:
      'Nivesh Parivar Investor Advisory. SEBI regulations strictly prohibit guaranteed returns on securities. Never transfer funds to personal UPI accounts. In case of suspicious activities, dial national helpline 1930 immediately.',
  },
}

export function NiveshParivarCard({ analysis, extractedText }: NiveshParivarCardProps) {
  const { i18n, t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const currentLang = i18n.language in REGIONAL_WARNING_TEMPLATES ? i18n.language : 'en'
  const template = REGIONAL_WARNING_TEMPLATES[currentLang]

  const isWarning =
    analysis?.overall_status === 'warning_signs_found' ||
    (extractedText && /(guarantee|profit|urgent|double|20%)/i.test(extractedText))

  const handleShareWhatsApp = () => {
    const summaryText = analysis?.summary || template.alertTag
    const textToShare = encodeURIComponent(
      `🛡️ *${template.title}*\n\n${template.alertTag}\n\n📌 *महत्वपूर्ण नियम / Key Guidelines:*\n1. ${template.rule1}\n2. ${template.rule2}\n3. ${template.rule3}\n\n⚠️ *जांच परिणाम / Findings:*\n${summaryText}\n\n🚨 *Emergency Helpline:* 1930\n🌐 Official Portal: cybercrime.gov.in\n\n_Generated via NiveshShield 2.0 (SEBI & NSDL Investor Protection)_`,
    )
    const url = `https://api.whatsapp.com/send?text=${textToShare}`
    window.open(url, '_blank')
  }

  const handleCopyCard = async () => {
    const summaryText = analysis?.summary || template.alertTag
    const fullText = `${template.title}\n${template.alertTag}\n\nGuidelines:\n1. ${template.rule1}\n2. ${template.rule2}\n3. ${template.rule3}\n\nDetails:\n${summaryText}\n\nHelpline: 1930 | cybercrime.gov.in`

    try {
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return

    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(template.speechText)

    // Attempt to pick a matching language voice
    const langCodes: Record<string, string> = {
      hi: 'hi-IN',
      mr: 'mr-IN',
      bn: 'bn-IN',
      ta: 'ta-IN',
      gu: 'gu-IN',
      en: 'en-IN',
    }
    utterance.lang = langCodes[currentLang] || 'en-IN'
    utterance.rate = 0.95

    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)

    setIsPlayingAudio(true)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">👨‍👩‍👧‍👦</span>
            <h3 className="text-base font-bold text-slate-900">
              {t('parivar.title', 'Nivesh Parivar: Family Warning Card & Vernacular Reader')}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-600 max-w-2xl">
            {t(
              'parivar.subtitle',
              'Share instant vernacular warning cards with family members on WhatsApp before any savings are transferred. Built for Bharat and regional-language investors.',
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSpeak}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 ${
              isPlayingAudio
                ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <span>{isPlayingAudio ? '⏹️' : '🔊'}</span>
            <span>{isPlayingAudio ? 'Stop Voice' : 'Listen in Vernacular'}</span>
          </button>
        </div>
      </div>

      {/* Visual Family Warning Card Container */}
      <div
        ref={cardRef}
        className={`mt-4 rounded-xl border p-4 sm:p-5 ${
          isWarning
            ? 'bg-gradient-to-br from-red-50 to-amber-50/50 border-red-200 text-slate-900'
            : 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <span className="text-xs font-bold text-slate-900">{template.title}</span>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
            {template.helplineText}
          </span>
        </div>

        <div className="my-3">
          <h4 className="text-sm font-extrabold text-red-900 flex items-center gap-2">
            {template.alertTag}
          </h4>
          {analysis?.summary && (
            <p className="mt-1 text-xs text-slate-700 font-medium leading-relaxed bg-white/70 p-2.5 rounded-lg border border-slate-200/50">
              "{analysis.summary}"
            </p>
          )}
        </div>

        <div className="space-y-2 text-xs text-slate-800 font-medium">
          <div className="flex items-start gap-2">
            <span className="font-bold text-red-700">1.</span>
            <span>{template.rule1}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-red-700">2.</span>
            <span>{template.rule2}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-red-700">3.</span>
            <span>{template.rule3}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <span>💡</span> {template.action}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">SEBI & NSDL SANGYAN 2026</span>
        </div>
      </div>

      {/* Action Buttons: WhatsApp & Copy */}
      <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
        <span className="text-xs text-slate-500 font-medium">
          Languages available: Hindi, Marathi, Bengali, Tamil, Gujarati, English.
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyCard}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {copied ? '✓ Copied Text' : 'Copy Card Text'}
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>💬</span>
            <span>Share on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  )
}
