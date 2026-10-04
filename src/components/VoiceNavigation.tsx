import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { classifyIntentLocally, type VoiceIntent, type IntentResult } from '../utils/voiceIntentMatcher'

interface VoiceNavigationProps {
  onCheckSafety?: () => void
  onExplainCurrentContent?: () => void
  onOpenSafetyCapsules?: () => void
  onOpenHowItWorks?: () => void
  currentAnalysisPresent?: boolean
}

// Localized quick action examples for each of the 6 languages
const QUICK_EXAMPLES: Record<string, string[]> = {
  en: [
    'What is this?',
    'Is this safe?',
    'I already sent the money.',
    'Where do I complain?',
    'How do I add a nominee?',
    'What are my rights?',
    'OTP safety',
  ],
  hi: [
    'ये क्या है?',
    'क्या ये सुरक्षित है?',
    'मैंने पैसे भेज दिए।',
    'शिकायत कहाँ करूँ?',
    'नॉमिनी कैसे जोड़ूँ?',
    'मेरे अधिकार क्या हैं?',
    'ओटीपी की सुरक्षा बताएं',
  ],
  mr: [
    'हे काय आहे?',
    'हे सुरक्षित आहे का?',
    'मी पैसे पाठवले आहेत.',
    'तक्रार कुठे करायची?',
    'नॉमिनी कसा जोडायचा?',
    'माझे हक्क काय आहेत?',
    'ओटीपी सुरक्षा',
  ],
  gu: [
    'આ શું છે?',
    'શું આ સલામત છે?',
    'મેં પૈસા મોકલી દીધા.',
    'ફરિયાદ ક્યાં કરવી?',
    'નોમિની કેવી રીતે ઉમેરવો?',
    'મારા અધિકાર શું છે?',
    'ઓટીપી સુરક્ષા',
  ],
  bn: [
    'এটা কী?',
    'এটা কি নিরাপদ?',
    'আমি টাকা পাঠিয়ে দিয়েছি।',
    'অভিযোগ কোথায় করব?',
    'নমিনি কীভাবে যোগ করব?',
    'আমার অধিকার কী?',
    'ওটিপি সুরক্ষা',
  ],
  ta: [
    'இது என்ன?',
    'இது பாதுகாப்பானதா?',
    'நான் பணம் அனுப்பிவிட்டேன்.',
    'புகார் எங்கே கொடுக்க வேண்டும்?',
    'நாமினியை எப்படி சேர்ப்பது?',
    'என் உரிமைகள் என்ன?',
    'ஓடிபி பாதுகாப்பு',
  ],
}

export function VoiceNavigation({
  onCheckSafety,
  onExplainCurrentContent,
  onOpenSafetyCapsules,
  onOpenHowItWorks,
  currentAnalysisPresent,
}: VoiceNavigationProps) {
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [intentResult, setIntentResult] = useState<IntentResult | null>(null)
  const [recognitionError, setRecognitionError] = useState<string | null>(null)

  // Context panels displayed inline inside Voice Assistant for guidance queries
  const [guidanceTitle, setGuidanceTitle] = useState<string | null>(null)
  const [guidanceContent, setGuidanceContent] = useState<string[] | null>(null)
  const [guidanceTakeaway, setGuidanceTakeaway] = useState<string | null>(null)

  const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase()
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const recognitionRef = useRef<any>(null)
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const startSpeechRecognition = () => {
    setTranscript('')
    setInterimTranscript('')
    setIntentResult(null)
    setRecognitionError(null)
    setGuidanceTitle(null)
    setGuidanceContent(null)
    setGuidanceTakeaway(null)

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const win = window as any
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setRecognitionError(
        t(
          'voice.notSupported',
          'Your device/browser does not support direct voice recognition. Please use the Quick Buttons below.'
        )
      )
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.continuous = false
      recognition.interimResults = true

      // Map application language state directly to Speech API language locales
      const langMap: Record<string, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        mr: 'mr-IN',
        bn: 'bn-IN',
        ta: 'ta-IN',
        gu: 'gu-IN',
      }
      recognition.lang = langMap[currentLang] || 'en-IN'

      recognition.onstart = () => {
        setIsRecording(true)
      }

      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      recognition.onresult = (event: any) => {
        let interim = ''
        let final = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript
          } else {
            interim += event.results[i][0].transcript
          }
        }

        if (final) {
          setTranscript(final)
          handleIntentClassification(final)
        } else {
          setInterimTranscript(interim)
        }
      }

      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'no-speech') {
          setRecognitionError(t('voice.noSpeech', 'No speech detected. Please try again.'))
        } else if (event.error === 'not-allowed') {
          setRecognitionError(t('voice.notAllowed', 'Microphone access denied.'))
        } else {
          setRecognitionError(t('voice.errorOccurred', 'Could not process voice input.'))
        }
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognition.start()
    } catch (err) {
      console.error(err)
      setRecognitionError(t('voice.failedInit', 'Failed to initialize microphone.'))
      setIsRecording(false)
    }
  }

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
  }

  const handleIntentClassification = (textToClassify: string) => {
    const result = classifyIntentLocally(textToClassify, currentLang)
    setIntentResult(result)

    if (result.confidence >= 0.8) {
      executeIntentAction(result.intent)
    }
  }

  const executeIntentAction = (intent: VoiceIntent) => {
    // Stop any speech playing first
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    switch (intent) {
      case 'CHECK_SAFETY':
      case 'START_INVESTIGATION':
        if (onCheckSafety) {
          onCheckSafety()
          setIsOpen(false)
        }
        break

      case 'EXPLAIN_CURRENT_CONTENT':
        if (currentAnalysisPresent && onExplainCurrentContent) {
          onExplainCurrentContent()
          setIsOpen(false)
        } else {
          // Home screen explanation
          speakSimpleText(
            t(
              'voice.homeExplanation',
              'यह निवेश ढाल है। यहाँ आप कोई भी संदिग्ध मैसेज लिखकर या फोटो अपलोड करके उसकी सच्चाई की जाँच कर सकते हैं।'
            )
          )
        }
        break

      case 'REPEAT_EXPLANATION':
        if (currentAnalysisPresent && onExplainCurrentContent) {
          onExplainCurrentContent()
          setIsOpen(false)
        }
        break

      case 'SAFETY_LEARNING':
        if (onOpenSafetyCapsules) {
          onOpenSafetyCapsules()
          setIsOpen(false)
        }
        break

      case 'HELP':
        if (onOpenHowItWorks) {
          onOpenHowItWorks()
          setIsOpen(false)
        }
        break

      case 'ALREADY_PAID':
        // Display high-contrast emergency recovery tips inside voice modal directly
        setGuidanceTitle(t('voice.alreadyPaidTitle', '🚨 महत्वपूर्ण कदम: अगर आपने पैसे भेज दिए हैं!'))
        setGuidanceContent([
          t('voice.alreadyPaidStep1', '1. तुरंत अपने बैंक को कॉल करके पैसे ट्रांसफर रोकने (Block) के लिए कहें।'),
          t('voice.alreadyPaidStep2', '2. तुरंत राष्ट्रीय साइबर हेल्पलाइन नंबर 1930 पर फोन करें। यह सेवा पूरी तरह मुफ्त है।'),
          t('voice.alreadyPaidStep3', '3. अपने चैट स्क्रीनशॉट और बैंक रसीद को सुरक्षित सबूत के तौर पर रखें।'),
        ])
        setGuidanceTakeaway(t('voice.alreadyPaidTakeaway', 'नियम: समय बहुत कीमती है! पहले 2 घंटे के भीतर शिकायत करने पर पैसे वापस मिलने की संभावना सबसे ज्यादा होती है।'))
        speakSimpleText(
          t(
            'voice.alreadyPaidSpeak',
            'तुरंत अपने बैंक को कॉल करें और ट्रांसफर रोकने को कहें। और तुरंत 1 9 3 0 नंबर पर कॉल करके साइबर पुलिस को सूचित करें।'
          )
        )
        break

      case 'COMPLAINT_GUIDANCE':
        setGuidanceTitle(t('voice.complaintTitle', '🏛️ शिकायत कैसे दर्ज करें? (How to Complain)'))
        setGuidanceContent([
          t('voice.complaintStep1', '1. राष्ट्रीय हेल्पलाइन 1930 पर कॉल करें और पूरी बात बताएं।'),
          t('voice.complaintStep2', '2. सरकारी पोर्टल cybercrime.gov.in पर जाकर अपनी शिकायत दर्ज करें।'),
          t('voice.complaintStep3', '3. अनौपचारिक सलाहकारों के लिए sebi.gov.in या SCORES पोर्टल पर शिकायत दर्ज कराएं।'),
        ])
        setGuidanceTakeaway(t('voice.complaintTakeaway', 'याद रखें: सरकारी पुलिस शिकायत पूरी तरह मुफ्त और सुरक्षित होती है। किसी बिचौलिए को पैसे न दें।'))
        speakSimpleText(
          t(
            'voice.complaintSpeak',
            'आप अपनी शिकायत राष्ट्रीय साइबर हेल्पलाइन 1 9 3 0 या सीधे साइबरक्राइम डॉट जीओवी डॉट इन वेबसाइट पर दर्ज करा सकते हैं।'
          )
        )
        break

      case 'NOMINEE_GUIDANCE':
        setGuidanceTitle(t('voice.nomineeTitle', '👤 नॉमिनी कैसे जोड़ें? (How to Add Nominee)'))
        setGuidanceContent([
          t('voice.nomineeStep1', '1. अपने बैंक या म्यूचुअल फंड ऐप में जाएं और नॉमिनेशन (Nomination) विकल्प चुनें।'),
          t('voice.nomineeStep2', '2. अपने विश्वासपात्र नॉमिनी का नाम, जन्मतिथि और पैन कार्ड की जानकारी दर्ज करें।'),
          t('voice.nomineeStep3', '3. फॉर्म को सबमिट करें और पुष्टि संदेश की जांच करें।'),
        ])
        setGuidanceTakeaway(t('voice.nomineeTakeaway', 'नियम: नॉमिनी बनाना बेहद जरूरी है। इससे आपके बाद आपके परिवार को आपकी मेहनत की कमाई आसानी से मिल जाती है।'))
        speakSimpleText(
          t(
            'voice.nomineeSpeak',
            'नॉमिनी जोड़ने के लिए अपने बैंक या म्यूचुअल फंड खाते के नॉमिनेशन विकल्प में जाकर अपने परिवार के किसी सदस्य का नाम जोड़ें।'
          )
        )
        break

      case 'INVESTOR_RIGHTS':
        setGuidanceTitle(t('voice.rightsTitle', '🇮🇳 आपके कानूनी अधिकार क्या हैं? (Your Rights)'))
        setGuidanceContent([
          t('voice.rightsStep1', '1. आपको अपने निवेश की पूरी और सही जानकारी प्राप्त करने का अधिकार है।'),
          t('voice.rightsStep2', '2. किसी भी प्रकार की सेवा देरी या धोखाधड़ी के खिलाफ शिकायत करने का अधिकार है।'),
          t('voice.rightsStep3', '3. किसी भी समय सेबी-पंजीकृत कंपनी से अपना पैसा वापस निकालने का अधिकार है।'),
        ])
        setGuidanceTakeaway(t('voice.rightsTakeaway', 'नियम: कोई भी ब्रोकर या सलाहकार आपका पैसा जबरन रोक नहीं सकता। यह गैर-कानूनी है।'))
        speakSimpleText(
          t(
            'voice.rightsSpeak',
            'एक निवेशक के रूप में आपके पास अपनी शिकायत सेबी में दर्ज करने और धोखाधड़ी के खिलाफ पैसे वापस पाने का पूरा अधिकार है।'
          )
        )
        break

      case 'DOCUMENT_EXPLANATION':
        setGuidanceTitle(t('voice.docTitle', '📄 वित्तीय दस्तावेजों को कैसे समझें?'))
        setGuidanceContent([
          t('voice.docStep1', '1. हमेशा दस्तावेज़ के शीर्ष पर सरकारी सील, सेबी या आरबीआई लोगो की जांच करें।'),
          t('voice.docStep2', '2. किसी भी नियम और शुल्क को ध्यान से पढ़ें। किसी भी व्यक्तिगत खाते में जमा करने से बचें।'),
          t('voice.docStep3', '3. यदि संदेह हो, तो उसे जांचने के लिए निवेषशील्ड पर अपलोड करें।'),
        ])
        setGuidanceTakeaway(t('voice.docTakeaway', 'नियम: कभी भी बिना पढ़े या बिना समझे किसी भी कागज़ पर हस्ताक्षर न करें।'))
        speakSimpleText(
          t(
            'voice.docSpeak',
            'दस्तावेजों को ध्यान से पढ़ें। सेबी पंजीकृत आधिकारिक लोगो की जांच करें और किसी भी अनजान कागज पर हस्ताक्षर न करें।'
          )
        )
        break

      case 'VERIFY_PERSON_OR_ENTITY':
        setGuidanceTitle(t('voice.verifyTitle', '🏛️ असली और नकली सलाहकार की पहचान'))
        setGuidanceContent([
          t('voice.verifyStep1', '1. हमेशा उनका 12 अंकों का सेबी पंजीकरण नंबर (SEBI RA/IA) मांगें।'),
          t('voice.verifyStep2', '2. सेबी की आधिकारिक वेबसाइट sebi.gov.in पर जाकर उस नंबर को सत्यापित करें।'),
          t('voice.verifyStep3', '3. किसी भी व्हाट्सएप या टेलीग्राम ग्रुप के टिप्स को सच न मानें।'),
        ])
        setGuidanceTakeaway(t('voice.verifyTakeaway', 'नियम: वैध वित्तीय सलाहकार कभी भी व्यक्तिगत व्हाट्सएप नंबर से निवेश जमा करने की मांग नहीं करते।'))
        speakSimpleText(
          t(
            'voice.verifySpeak',
            'हमेशा सलाहकार का सेबी पंजीकरण नंबर मांगें और सेबी की आधिकारिक वेबसाइट पर उसकी पुष्टि करें।'
          )
        )
        break

      default:
        // Do not perform action silently if confidence is low or unknown
        break
    }
  }

  const speakSimpleText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const langMap: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      mr: 'mr-IN',
      bn: 'bn-IN',
      ta: 'ta-IN',
      gu: 'gu-IN',
    }
    const targetBcp47Tag = langMap[currentLang] || 'en-IN'
    utterance.lang = targetBcp47Tag
    utterance.rate = 0.85

    const availableVoices = window.speechSynthesis.getVoices()
    const nativeVoice = availableVoices.find((voice) => {
      const vLang = voice.lang.replace('_', '-').toLowerCase()
      const tLang = targetBcp47Tag.toLowerCase()
      return (
        vLang === tLang ||
        vLang.startsWith(currentLang) ||
        voice.lang.toLowerCase().startsWith(currentLang)
      )
    })

    if (nativeVoice) utterance.voice = nativeVoice

    activeUtteranceRef.current = utterance
    setTimeout(() => {
      window.speechSynthesis.speak(utterance)
    }, 50)
  }

  const handleQuickActionClick = (phrase: string) => {
    setTranscript(phrase)
    handleIntentClassification(phrase)
  }

  const handleClose = () => {
    setIsOpen(false)
    stopSpeechRecognition()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }

  const examples = QUICK_EXAMPLES[currentLang] || QUICK_EXAMPLES.en

  return (
    <>
      {/* Visual Floating Button for Ask NiveshShield (Visually recognizable and large enough to tap comfortably) */}
      <button
        type="button"
        id="onboarding-btn-ask"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 p-2 sm:px-4 sm:py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm shadow-lg transition active:scale-95 cursor-pointer ring-2 ring-slate-400/20 whitespace-nowrap"
      >
        <span className="text-base sm:text-lg animate-bounce">🎙️</span>
        <span className="hidden md:inline">{t('voice.askShield', 'बोलकर पूछें / Ask NiveshShield')}</span>
        <span className="inline md:hidden">{t('voice.askShieldShort', 'पूछें / Ask')}</span>
      </button>

      {isOpen && (
        <div
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[120] w-[calc(100%-2rem)] md:w-[400px] rounded-3xl bg-white shadow-2xl border-2 border-slate-200/80 overflow-hidden flex flex-col max-h-[85vh] md:max-h-[580px] animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg select-none">🎙️</span>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                {t('voice.assistantTitle', 'बोलकर पूछें (Voice Assistant)')}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-slate-400 hover:text-white font-bold text-base p-1 cursor-pointer transition"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[380px] bg-slate-50/50">
            {/* Bot Welcome Bubble */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                🛡️
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 leading-normal font-semibold max-w-[85%] shadow-3xs">
                {t('voice.tapPrompt', 'माइक बटन दबाएँ और अपनी भाषा में पूछें')}
              </div>
            </div>

            {/* Show interim/final transcripts as user chat bubble */}
            {(transcript || interimTranscript) && (
              <div className="flex items-start gap-2.5 justify-end animate-fade-in">
                <div className="p-3 rounded-2xl bg-emerald-700 text-white text-xs sm:text-sm leading-normal font-bold max-w-[85%] shadow-2xs">
                  <p className="text-[9px] text-emerald-200 font-extrabold uppercase mb-0.5 tracking-wider">🗣️ {t('voice.youSaid', 'आपने कहा:')}</p>
                  <p className="italic">"{transcript || interimTranscript}"</p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                  👤
                </div>
              </div>
            )}

            {recognitionError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-center text-xs font-bold text-rose-600">
                ⚠️ {recognitionError}
              </div>
            )}

            {/* Displaying Intent Action result & explanations as bot response bubble */}
            {intentResult && intentResult.intent !== 'UNKNOWN' && (
              <div className="flex items-start gap-2.5 animate-fade-in">
                <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                  🛡️
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-semibold max-w-[85%] shadow-3xs">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-black bg-emerald-700 text-white uppercase tracking-wider mb-1">
                    {t('voice.recognizedAction', 'Action Identified')}
                  </span>
                  <p className="font-black">
                    {intentResult.intent === 'CHECK_SAFETY' && t('voice.actionCheck', '🔍 Opening Message Scanner...')}
                    {intentResult.intent === 'SAFETY_LEARNING' && t('voice.actionLearning', '🎥 Opening Safety Videos library...')}
                    {intentResult.intent === 'HELP' && t('voice.actionHelp', '💡 Showing guide on how NiveshShield works...')}
                    {['ALREADY_PAID', 'COMPLAINT_GUIDANCE', 'NOMINEE_GUIDANCE', 'INVESTOR_RIGHTS', 'DOCUMENT_EXPLANATION', 'VERIFY_PERSON_OR_ENTITY'].includes(intentResult.intent) &&
                      t('voice.actionDisplaying', '📖 Displaying requested instructions below:')}
                  </p>
                </div>
              </div>
            )}

            {intentResult && intentResult.intent === 'UNKNOWN' && (
              <div className="flex items-start gap-2.5 animate-fade-in">
                <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                  🛡️
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-bold max-w-[85%] shadow-3xs">
                  ❓ {t('voice.unknownPrompt', 'मैं आपकी बात पूरी तरह समझ नहीं सका। क्या आप नीचे दिए गए किसी विषय पर पूछना चाहते हैं?')}
                </div>
              </div>
            )}

            {/* Displayed Guidance Panel as main response bubble */}
            {guidanceTitle && guidanceContent && (
              <div className="flex items-start gap-2.5 animate-fade-in">
                <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                  🛡️
                </div>
                <div className="p-3.5 bg-white rounded-2xl border-2 border-slate-200 text-left space-y-2.5 max-w-[85%] shadow-2xs">
                  <h4 className="font-black text-slate-900 text-xs border-b border-slate-100 pb-1 uppercase tracking-wider">
                    {guidanceTitle}
                  </h4>
                  <ul className="space-y-1.5 text-xs font-bold text-slate-700">
                    {guidanceContent.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ul>
                  {guidanceTakeaway && (
                    <p className="text-[10px] font-black text-rose-950 bg-rose-50 p-2 rounded-xl border border-rose-200 leading-normal">
                      🛡️ {guidanceTakeaway}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mic / Quick Action Controls Area (Footer of card) */}
          <div className="p-4 border-t border-slate-200 bg-white shrink-0 space-y-3">
            {/* Voice Trigger controls */}
            <div className="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-3xs">
              <span className="text-[11px] font-bold text-slate-600 pl-1.5 leading-tight">
                {isListening
                  ? t('voice.listening', 'सुन रहा हूँ... बोलिए')
                  : t('voice.tapPrompt', 'माइक बटन दबाएँ और अपनी भाषा में पूछें')}
              </span>

              {!isListening ? (
                <button
                  type="button"
                  onClick={startSpeechRecognition}
                  className="w-10 h-10 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center shadow-md transition active:scale-95 cursor-pointer text-base shrink-0"
                  title="Tap to speak"
                >
                  🎙️
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopSpeechRecognition}
                  className="w-10 h-10 rounded-full bg-rose-600 animate-pulse text-white flex items-center justify-center shadow-md transition active:scale-95 cursor-pointer text-base shrink-0"
                  title="Stop speaking"
                >
                  ⏹️
                </button>
              )}
            </div>

            {/* Quick Action Fallback Cards (Compact horiz scrollable layout for space-efficiency) */}
            <div className="space-y-1.5 text-left">
              <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-black flex items-center gap-1 select-none">
                <span>💡</span>
                <span>{t('voice.trySaying', 'ऐसा बोलें या यहाँ टैप करें (Try saying or tap below):')}</span>
              </h4>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none snap-x pr-1">
                {examples.map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickActionClick(phrase)}
                    className="snap-start shrink-0 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-600 hover:bg-emerald-50 text-slate-800 font-bold text-xs transition cursor-pointer active:scale-95 shadow-3xs"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
