import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

// BCP 47 Language Tag Mapping for Indian Vernacular Speech Synthesis
export const BCP47_LANGUAGE_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
}

interface UseTextToSpeechReturn {
  isPlaying: boolean
  speak: (text: string) => void
  stop: () => void
  isSupported: boolean
}

/**
 * Custom React Hook for Elderly-Accessible Vernacular Text-to-Speech
 */
export function useTextToSpeech(): UseTextToSpeechReturn {
  const { i18n } = useTranslation()
  const [isPlaying, setIsPlaying] = useState(false)
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Clean up synthesis when component unmounts
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel()
      }
    }
  }, [isSupported])

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
    }
  }, [isSupported])

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text) return

      // Overlap Prevention: Cancel any currently playing speech immediately
      window.speechSynthesis.cancel()

      if (isPlaying) {
        setIsPlaying(false)
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)

      // BCP 47 Language Mapping based on current i18n language
      const currentLangCode = (i18n.language || 'hi').split('-')[0].toLowerCase()
      const targetBcp47Tag = BCP47_LANGUAGE_MAP[currentLangCode] || 'hi-IN'

      utterance.lang = targetBcp47Tag

      // Elderly Accessibility Adjustment: Slow down rate to 0.85 for senior users
      utterance.rate = 0.85
      utterance.pitch = 1.0

      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)

      setIsPlaying(true)
      window.speechSynthesis.speak(utterance)
    },
    [i18n.language, isPlaying, isSupported],
  )

  return { isPlaying, speak, stop, isSupported }
}
