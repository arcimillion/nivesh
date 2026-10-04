import { useTranslation } from 'react-i18next'
import type { AnalysisResult } from '../api'

interface NiveshParivarCardProps {
  analysis?: AnalysisResult | null
  extractedText?: string
}

export function NiveshParivarCard({ analysis, extractedText }: NiveshParivarCardProps) {
  const { i18n } = useTranslation()

  const currentLang = i18n.language || 'hi'

  const handleShareWhatsApp = () => {
    const isRed = analysis?.overall_status === 'warning_signs_found'
    const statusText = isRed
      ? '🚨 *खतरा! यह धोखाधड़ी (Scam) है — पैसे न भेजें!*'
      : '⚠️ *सावधान रहें! पैसे भेजने से पहले जाँच लें!*'

    const detailText = analysis?.summary || extractedText || ''

    const message = encodeURIComponent(
      `🛡️ *NiveshShield - सावधान!*\n\n${statusText}\n\n📌 *मैसेज / विवरण:*\n"${detailText.substring(0, 200)}..."\n\n🚨 *सरकारी नियम:* कोई भी कंपनी या व्यक्ति शेयर बाजार में पक्का (गारंटीड) मुनाफा देने का वादा नहीं कर सकता।\n\n📞 *साइबर हेल्पलाइन:* 1930`,
    )

    const url = `https://api.whatsapp.com/send?text=${message}`
    window.open(url, '_blank')
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleShareWhatsApp}
        className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-base sm:text-lg shadow-md transition flex items-center justify-center gap-3 cursor-pointer border-2 border-emerald-700"
      >
        <span className="text-2xl shrink-0">💬</span>
        <span>
          {currentLang === 'hi'
            ? 'परिवार को वॉट्सऐप पर चेतावनी भेजें'
            : currentLang === 'mr'
            ? 'कुटुंबाला व्हॉट्सअ‍ॅपवर सावधान करा'
            : currentLang === 'gu'
            ? 'પરિવારને વોટ્સએપ પર ચેતવણી મોકલો'
            : currentLang === 'bn'
            ? 'পরিবারকে হোয়াটসঅ্যাপে সতর্কবার্তা পাঠান'
            : currentLang === 'ta'
            ? 'குடும்பத்திற்கு வாட்ஸ்அப்பில் எச்சரிக்கை அனுப்பவும்'
            : 'Share Warning with Family on WhatsApp'}
        </span>
      </button>
    </div>
  )
}
