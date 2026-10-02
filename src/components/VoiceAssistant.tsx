import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnalysisResult } from '../api'

interface Props {
  analysis: AnalysisResult | null
}

const LANG_VOICE_CODES: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
}

export const VoiceAssistant: React.FC<Props> = ({ analysis }) => {
  const { i18n } = useTranslation()
  const [isPlaying, setIsPlaying] = useState(false)
  const [speechSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window)
  const [spokenText, setSpokenText] = useState('')

  const [prevAnalysis, setPrevAnalysis] = useState(analysis)
  if (analysis !== prevAnalysis) {
    setPrevAnalysis(analysis)
    if (isPlaying) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      setIsPlaying(false)
    }
  }

  const constructSpokenSummary = (): string => {
    if (!analysis) return ''

    let text = ''
    if (analysis.summary) {
      text += `${analysis.summary}. `
    } else {
      if (analysis.overall_status === 'warning_signs_found') {
        text += 'Warning signs were identified in the submitted content. '
      } else if (analysis.overall_status === 'no_obvious_warning_signs') {
        text += 'No obvious warning signs were identified, but this does not confirm safety. '
      } else {
        text += 'More information is required for a complete check. '
      }
    }

    if (analysis.findings && analysis.findings.length > 0) {
      text += `We identified ${analysis.findings.length} key warning indicators. `
      analysis.findings.slice(0, 2).forEach((f) => {
        text += `${f.explanation}. `
      })
    }

    if (analysis.next_steps && analysis.next_steps.length > 0) {
      text += `Recommended action: ${analysis.next_steps[0]}. `
    }

    return text.trim()
  }

  const handleToggleSpeak = () => {
    if (!speechSupported) {
      setSpokenText(constructSpokenSummary())
      return
    }

    const synth = window.speechSynthesis

    if (isPlaying) {
      synth.cancel()
      setIsPlaying(false)
      return
    }

    const textToRead = constructSpokenSummary()
    if (!textToRead) return

    setSpokenText(textToRead)
    const utterance = new SpeechSynthesisUtterance(textToRead)

    const targetLangCode = LANG_VOICE_CODES[i18n.language] || 'en-IN'
    utterance.lang = targetLangCode

    // Attempt to pick a matching regional voice if available
    const voices = synth.getVoices()
    const matchingVoice = voices.find(
      (v) => v.lang === targetLangCode || v.lang.startsWith(i18n.language),
    )
    if (matchingVoice) {
      utterance.voice = matchingVoice
    }

    utterance.onend = () => {
      setIsPlaying(false)
    }

    utterance.onerror = () => {
      setIsPlaying(false)
    }

    synth.cancel() // clear any pending speech
    synth.speak(utterance)
    setIsPlaying(true)
  }

  if (!analysis) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-2xs text-lg font-bold">
            🔊
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Multilingual Voice Explanation Readout
            </h5>
            <p className="text-[11px] text-slate-500">
              Listen to the summary read aloud in {i18n.language.toUpperCase()} ({LANG_VOICE_CODES[i18n.language] || 'en-IN'})
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleSpeak}
          className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition shadow-2xs focus:outline-none ${
            isPlaying
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'bg-emerald-700 text-white hover:bg-emerald-800'
          }`}
        >
          {isPlaying ? (
            <>
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              <span>Pause Speech</span>
            </>
          ) : (
            <>
              <span>🔊</span>
              <span>Read Findings Aloud</span>
            </>
          )}
        </button>
      </div>

      {/* Fallback Spoken Text Transcript Box */}
      {spokenText && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 leading-relaxed">
          <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-1">
            Readout Speech Transcript:
          </p>
          <p>"{spokenText}"</p>
        </div>
      )}

      {!speechSupported && (
        <p className="mt-2 text-[11px] text-amber-800 italic">
          Note: Browser text-to-speech engine unavailable. Full text transcript provided above.
        </p>
      )}
    </div>
  )
}
