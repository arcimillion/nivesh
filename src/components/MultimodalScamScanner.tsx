import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { InputModality, AnalyzeOptions } from '../api'

interface MultimodalScamScannerProps {
  onAnalyze: (options: AnalyzeOptions) => void
  loading: boolean
  initialText?: string
}

export const MultimodalScamScanner: React.FC<MultimodalScamScannerProps> = ({
  onAnalyze,
  loading,
  initialText = '',
}) => {
  const { t, i18n } = useTranslation()

  const [modality, setModality] = useState<InputModality>('text')
  const [textInput, setTextInput] = useState(initialText)
  const [urlInput, setUrlInput] = useState('')

  // Media state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [fileBase64, setFileBase64] = useState<string | null>(null)

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [micNotice, setMicNotice] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync initialText changes during render as recommended by React
  const [prevInitialText, setPrevInitialText] = useState(initialText)
  if (initialText !== prevInitialText) {
    setPrevInitialText(initialText)
    if (initialText) {
      setTextInput(initialText)
      setModality('text')
    }
  }

  // Clean up blob URLs
  useEffect(() => {
    return () => {
      if (filePreview && filePreview.startsWith('blob:')) {
        URL.revokeObjectURL(filePreview)
      }
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [filePreview])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setFilePreview(objectUrl)

    const reader = new FileReader()
    reader.onloadend = () => {
      setFileBase64(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleLoadSampleVoice = () => {
    try {
      setMicNotice(null)
      const sampleRate = 16000
      const duration = 2.5
      const numSamples = Math.floor(sampleRate * duration)
      const buffer = new ArrayBuffer(44 + numSamples * 2)
      const view = new DataView(buffer)

      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
      }
      writeString(0, 'RIFF')
      view.setUint32(4, 36 + numSamples * 2, true)
      writeString(8, 'WAVE')
      writeString(12, 'fmt ')
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, 1, true)
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, sampleRate * 2, true)
      view.setUint16(32, 2, true)
      view.setUint16(34, 16, true)
      writeString(36, 'data')
      view.setUint32(40, numSamples * 2, true)

      for (let i = 0; i < numSamples; i++) {
        const timeVal = i / sampleRate
        const freq = 260 + 60 * Math.sin(2 * Math.PI * 3 * timeVal)
        const envelope = Math.min(1, Math.min(timeVal * 6, (duration - timeVal) * 6))
        const sample = Math.sin(2 * Math.PI * freq * timeVal) * 0.35 * envelope
        view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      }

      const blob = new Blob([buffer], { type: 'audio/wav' })
      const sampleFile = new File([blob], 'sample_guaranteed_profit_voice.wav', { type: 'audio/wav' })
      const blobUrl = URL.createObjectURL(blob)

      let binary = ''
      const bytes = new Uint8Array(buffer)
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64 = 'data:audio/wav;base64,' + btoa(binary)

      setSelectedFile(sampleFile)
      setFilePreview(blobUrl)
      setFileBase64(base64)
      if (!textInput.trim()) {
        setTextInput('Bhai guaranteed 40% daily profit scheme hai, aaj hi registration fee bhej do.')
      }
    } catch (err) {
      console.error('Failed to create sample voice note:', err)
    }
  }

  const startRecording = async () => {
    setMicNotice(null)

    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      setMicNotice(
        'Direct microphone access is restricted in this preview sandbox. Tap "Use Demo Voice Note" below to test voice analysis.',
      )
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      let mimeType = 'audio/webm'
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus'
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, {
          type: audioBlob.type,
        })
        setSelectedFile(audioFile)

        const objectUrl = URL.createObjectURL(audioBlob)
        setFilePreview(objectUrl)

        const reader = new FileReader()
        reader.onloadend = () => {
          setFileBase64(reader.result as string)
        }
        reader.readAsDataURL(audioBlob)

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start(250)
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            stopRecording()
            return 60
          }
          return prev + 1
        })
      }, 1000)
    } catch {
      setMicNotice(
        'Microphone permission was not granted. Tap "Use Demo Voice Note" below to test voice analysis.',
      )
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (modality === 'text') {
      if (!textInput.trim()) return
      onAnalyze({
        message: textInput.trim(),
        modality: 'text',
        language: i18n.language,
      })
    } else if (modality === 'url') {
      if (!urlInput.trim()) return
      onAnalyze({
        url: urlInput.trim(),
        message: urlInput.trim(),
        modality: 'url',
        language: i18n.language,
      })
    } else if (modality === 'image') {
      if (!fileBase64 && !textInput.trim()) return
      onAnalyze({
        message: textInput.trim() || 'Analyze uploaded investment screenshot',
        file_data: fileBase64 || undefined,
        file_mime_type: selectedFile?.type || 'image/png',
        modality: 'image',
        language: i18n.language,
      })
    } else if (modality === 'voice') {
      if (!fileBase64 && !textInput.trim()) return
      onAnalyze({
        message: textInput.trim() || 'Analyze recorded voice note for investment fraud',
        file_data: fileBase64 || undefined,
        file_mime_type: selectedFile?.type || 'audio/webm',
        modality: 'voice',
        language: i18n.language,
      })
    }
  }

  const handleClear = () => {
    setTextInput('')
    setUrlInput('')
    setSelectedFile(null)
    setFilePreview(null)
    setFileBase64(null)
    setMicNotice(null)
    if (isRecording) stopRecording()
  }

  const isSubmitDisabled =
    loading ||
    (modality === 'text' && !textInput.trim()) ||
    (modality === 'url' && !urlInput.trim()) ||
    ((modality === 'image' || modality === 'voice') && !fileBase64 && !textInput.trim())

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Central Omnibox Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border-2 border-slate-300 bg-white p-4 sm:p-6 shadow-md transition-all focus-within:border-emerald-600 focus-within:shadow-xl"
      >
        {/* Modality View Switching */}
        {modality === 'text' && (
          <div className="relative">
            <label htmlFor="scanner-text" className="sr-only">
              {t('scanner.textLabel', 'Paste message to check')}
            </label>
            <textarea
              id="scanner-text"
              rows={4}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t('inputPlaceholder', 'Bhai guaranteed 400% daily profit scheme hai...')}
              className="w-full resize-none border-0 bg-transparent text-base sm:text-lg leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {textInput && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-0 right-0 text-xs font-semibold text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full px-2.5 py-1"
              >
                ✕ {t('clearButton', 'Clear')}
              </button>
            )}
          </div>
        )}

        {modality === 'image' && (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {filePreview ? (
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <img
                  src={filePreview}
                  alt="Uploaded screenshot"
                  className="max-h-48 rounded-xl object-contain shadow-xs border border-slate-200"
                />
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-800">
                    {selectedFile?.name || 'Screenshot'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null)
                      setFilePreview(null)
                      setFileBase64(null)
                    }}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Remove & Re-upload
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-500 transition-colors text-center"
              >
                <span className="text-4xl mb-2">📷</span>
                <span className="text-base font-bold text-slate-800">
                  {t('scanner.uploadTitle', 'Tap to Upload WhatsApp Screenshot or Photo')}
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  {t('scanner.uploadSubtitle', 'Supports PNG, JPG, WEBP. We extract text safely without saving.')}
                </span>
              </div>
            )}

            {/* Optional note */}
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t('scanner.optionalNote', 'Add optional note or context (optional)...')}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:bg-white focus:border-emerald-500"
            />
          </div>
        )}

        {modality === 'url' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="text-2xl text-slate-400">🔗</span>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://trade-fast-profit.com or http://bit.ly/..."
                className="w-full text-base sm:text-lg font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
              />
              {urlInput && (
                <button
                  type="button"
                  onClick={() => setUrlInput('')}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full px-2.5 py-1"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {t(
                'scanner.urlNotice',
                'Web links are checked through an isolated security sandbox protecting you from phishing and fake broker downloads.',
              )}
            </p>
          </div>
        )}

        {modality === 'voice' && (
          <div className="py-4 space-y-4 text-center">
            <div className="flex flex-col items-center justify-center">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-emerald-700 text-white shadow-lg hover:bg-emerald-800 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-200"
                  aria-label="Start recording voice note"
                >
                  <span className="text-3xl">🎙️</span>
                  <span className="text-[11px] font-bold mt-1">Tap to Speak</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-rose-600 text-white shadow-xl animate-pulse active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-rose-200"
                  aria-label="Stop recording voice note"
                >
                  <span className="text-3xl">⏹️</span>
                  <span className="text-[11px] font-bold mt-1">Stop ({recordingTime}s)</span>
                </button>
              )}
            </div>

            <p className="text-xs font-semibold text-slate-700">
              {isRecording
                ? 'Listening... Speak in Hindi, Tamil, Marathi, Bengali, Gujarati, or English'
                : t('scanner.voicePrompt', 'Speak your query or record a voice note in your mother tongue')}
            </p>

            {filePreview && (
              <div className="max-w-md mx-auto p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                  <span>🎙️</span> Voice Note Ready
                </div>
                <audio controls src={filePreview} className="h-8 max-w-[200px]" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null)
                    setFilePreview(null)
                    setFileBase64(null)
                  }}
                  className="text-xs text-emerald-800 hover:underline"
                >
                  ✕
                </button>
              </div>
            )}

            {micNotice && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 text-left space-y-2">
                <p>{micNotice}</p>
                <button
                  type="button"
                  onClick={handleLoadSampleVoice}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
                >
                  ⚡ Load Demo Voice Note
                </button>
              </div>
            )}

            {!filePreview && !micNotice && (
              <button
                type="button"
                onClick={handleLoadSampleVoice}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Or test with a sample voice note ➔
              </button>
            )}
          </div>
        )}

        {/* Four Large, Highly Recognizable Tactile Buttons */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setModality('text')}
              className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all border-2 ${
                modality === 'text'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-100'
              }`}
            >
              <span className="text-xl">📝</span>
              <span>{t('tabTextExcerpt', 'Text Excerpt')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModality('image')
                if (!filePreview) {
                  setTimeout(() => fileInputRef.current?.click(), 50)
                }
              }}
              className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all border-2 ${
                modality === 'image'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-100'
              }`}
            >
              <span className="text-xl">📷</span>
              <span>{t('tabImageUpload', 'Image Upload')}</span>
            </button>

            <button
              type="button"
              onClick={() => setModality('url')}
              className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all border-2 ${
                modality === 'url'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-100'
              }`}
            >
              <span className="text-xl">🔗</span>
              <span>{t('tabUrlDrop', 'URL Drop')}</span>
            </button>

            <button
              type="button"
              onClick={() => setModality('voice')}
              className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all border-2 ${
                modality === 'voice'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-4 ring-emerald-100'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500'
              }`}
              title="Speak in Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, or English"
            >
              <span className="text-xl">🎙️</span>
              <span>{t('tabMicrophone', 'Microphone')}</span>
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full lg:w-auto px-8 py-4 text-base sm:text-lg font-black text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2.5 min-h-[56px]"
          >
            <span className="text-xl">🔍</span>
            <span>{t('checkSafetyButton', 'Check Safety')}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
