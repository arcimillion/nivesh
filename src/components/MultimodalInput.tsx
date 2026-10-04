import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { InputModality, AnalyzeOptions } from '../api'

interface Props {
  onAnalyze: (options: AnalyzeOptions) => void
  loading: boolean
  onClear: () => void
  initialText?: string
}

export const MultimodalInput: React.FC<Props> = ({
  onAnalyze,
  loading,
  onClear,
  initialText = '',
}) => {
  const { t, i18n } = useTranslation()

  const [modality, setModality] = useState<InputModality>('text')
  const [textInput, setTextInput] = useState(initialText)
  const [urlInput, setUrlInput] = useState('')

  // Media file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [fileBase64, setFileBase64] = useState<string | null>(null)

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [micError, setMicError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [prevInitialText, setPrevInitialText] = useState(initialText)
  if (initialText !== prevInitialText) {
    setPrevInitialText(initialText)
    if (initialText) {
      setTextInput(initialText)
    }
  }

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (filePreview && filePreview.startsWith('blob:')) {
        URL.revokeObjectURL(filePreview)
      }
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [filePreview])

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) {
          setModality('image')
          setSelectedFile(file)
          const objectUrl = URL.createObjectURL(file)
          setFilePreview(objectUrl)
          const reader = new FileReader()
          reader.onloadend = () => {
            setFileBase64(reader.result as string)
          }
          reader.readAsDataURL(file)
          e.preventDefault()
          break
        }
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer?.files
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      const file = files[0]
      setModality('image')
      setSelectedFile(file)
      const objectUrl = URL.createObjectURL(file)
      setFilePreview(objectUrl)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFileBase64(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setMicError(null)
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
      setMicError(null)
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
        const t = i / sampleRate
        const freq = 260 + 60 * Math.sin(2 * Math.PI * 3 * t)
        const envelope = Math.min(1, Math.min(t * 6, (duration - t) * 6))
        const sample = Math.sin(2 * Math.PI * freq * t) * 0.35 * envelope
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
    setMicError(null)

    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      setMicError(
        'Audio recording is not supported in this browser environment. You can upload an audio file or click "Load Sample Voice Note" below.',
      )
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Determine best supported MIME type
      let mimeType = 'audio/webm'
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus'
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg'
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const finalType = recorder.mimeType || mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: finalType })
        const ext = finalType.includes('mp4') ? 'mp4' : 'webm'
        const audioFile = new File([audioBlob], `voice_recording_${Date.now()}.${ext}`, { type: finalType })
        setSelectedFile(audioFile)
        setFilePreview(URL.createObjectURL(audioBlob))

        const reader = new FileReader()
        reader.onloadend = () => {
          setFileBase64(reader.result as string)
        }
        reader.readAsDataURL(audioBlob)

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start(250) // 250ms timeslice to ensure continuous data delivery
      setIsRecording(true)
      setRecordingTime(0)
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err: unknown) {
      console.warn('Microphone start error:', err)
      if (
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.name === 'SecurityError')
      ) {
        setMicError(
          'Microphone permission is blocked by your browser or iframe security settings. Allow microphone access in your browser address bar, choose an audio file from your device, or click "Load Sample Voice Note".',
        )
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setMicError('No microphone detected on your device. Please plug in a microphone or upload an audio file.')
      } else {
        const msg = err instanceof Error ? err.message : 'Unknown audio error'
        setMicError(`Unable to access microphone (${msg}). You can upload an audio file directly below.`)
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const handleClearAll = () => {
    setTextInput('')
    setUrlInput('')
    setSelectedFile(null)
    setFilePreview(null)
    setFileBase64(null)
    setIsRecording(false)
    setMicError(null)
    if (timerRef.current) clearInterval(timerRef.current)
    onClear()
  }

  const handleSubmit = () => {
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
        modality: 'url',
        language: i18n.language,
      })
    } else if (modality === 'image') {
      if (!fileBase64 && !textInput.trim()) return
      onAnalyze({
        message: textInput.trim(),
        file_data: fileBase64 || undefined,
        file_mime_type: selectedFile?.type || 'image/png',
        modality: 'image',
        language: i18n.language,
      })
    } else if (modality === 'voice') {
      if (!fileBase64 && !textInput.trim()) return
      onAnalyze({
        message: textInput.trim(),
        file_data: fileBase64 || undefined,
        file_mime_type: selectedFile?.type || 'audio/webm',
        modality: 'voice',
        language: i18n.language,
      })
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {t('checker.title', 'Investigate Suspicious Investment Content')}
          </h3>
          <p className="text-xs text-slate-500">
            {t(
              'checker.subtitle',
              'Select an input type below: Text message, Screenshot, URL, or Voice note.',
            )}
          </p>
        </div>

        {(textInput || urlInput || selectedFile) && (
          <button
            type="button"
            onClick={handleClearAll}
            className="self-start text-xs font-semibold text-slate-500 hover:text-slate-800 underline focus:outline-none"
          >
            {t('checker.clearButton', 'Clear all')}
          </button>
        )}
      </div>

      {/* Modality Selector Tabs */}
      <div className="mb-5 grid grid-cols-4 gap-1.5 rounded-xl bg-slate-100 p-1.5 text-xs font-bold">
        <button
          type="button"
          onClick={() => setModality('text')}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 transition ${
            modality === 'text'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📝</span>
          <span className="hidden sm:inline">{t('checker.tabText', 'Text')}</span>
        </button>

        <button
          type="button"
          onClick={() => setModality('image')}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 transition ${
            modality === 'image'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📷</span>
          <span className="hidden sm:inline">{t('checker.tabImage', 'Screenshot')}</span>
        </button>

        <button
          type="button"
          onClick={() => setModality('url')}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 transition ${
            modality === 'url'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🔗</span>
          <span className="hidden sm:inline">{t('checker.tabUrl', 'URL Link')}</span>
        </button>

        <button
          type="button"
          onClick={() => setModality('voice')}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 transition ${
            modality === 'voice'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🎙️</span>
          <span className="hidden sm:inline">{t('checker.tabVoice', 'Voice Note')}</span>
        </button>
      </div>

      {/* 1. TEXT INPUT TAB */}
      {modality === 'text' && (
        <div>
          <textarea
            ref={textareaRef}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={t(
              'checker.placeholder',
              'Paste suspicious WhatsApp message, SMS, Telegram post, or email body here...',
            )}
            rows={7}
            maxLength={15000}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>
              {t('checker.characters', {
                count: textInput.length,
                defaultValue: `${textInput.length}/15,000 chars`,
              })}
            </span>
            <span>{t('checker.sandboxActive', 'Untrusted data sandbox active')}</span>
          </div>
        </div>
      )}

      {/* 2. SCREENSHOT / IMAGE TAB */}
      {modality === 'image' && (
        <div className="space-y-4" onPaste={handlePaste}>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-emerald-500 hover:bg-emerald-50/30 transition"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {filePreview ? (
              <div className="flex flex-col items-center">
                <img
                  src={filePreview}
                  alt="Uploaded screenshot"
                  className="max-h-48 rounded-lg object-contain border border-slate-200 shadow-2xs"
                />
                <p className="mt-2 text-xs font-bold text-slate-700">
                  {selectedFile?.name} ({(selectedFile?.size || 0) / 1024 > 1024 ? `${((selectedFile?.size || 0) / 1048576).toFixed(1)} MB` : `${((selectedFile?.size || 0) / 1024).toFixed(0)} KB`})
                </p>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  {t('checker.clickToChange', 'Click to change image')}
                </p>
              </div>
            ) : (
              <div>
                <div className="text-3xl">📷</div>
                <p className="mt-2 text-sm font-bold text-slate-800">
                  {t('checker.uploadTitle', 'Upload Screenshot or Trading Post Image')}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {t(
                    'checker.uploadSubtitle',
                    'Supports PNG, JPG, WEBP. Text will be extracted via multimodal OCR.',
                  )}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('checker.optionalContext', 'Optional Context or Additional Notes:')}
            </label>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t(
                'checker.optionalContextPlaceholder',
                'Add optional notes or message context...',
              )}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </div>
      )}

      {/* 3. URL LINK TAB */}
      {modality === 'url' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('checker.urlLabel', 'Suspicious Website URL / Web Link:')}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔗</span>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={t(
                  'checker.urlPlaceholder',
                  'https://trade-fast-bonus.com or http://bit.ly/claim-returns',
                )}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 font-mono"
              />
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900 flex items-start gap-2">
            <span>🛡️</span>
            <span>
              <strong>{t('checker.ssrfProtectedTitle', 'SSRF Protected:')}</strong>{' '}
              {t(
                'checker.ssrfProtectedText',
                'Target web pages are fetched through an isolated security proxy that blocks local IP ranges, private subnets, and malicious executable downloads.',
              )}
            </span>
          </div>
        </div>
      )}

      {/* 4. VOICE NOTE TAB */}
      {modality === 'voice' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            {/* Record Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-red-700 active:scale-95"
                >
                  <span className="h-3 w-3 rounded-full bg-white animate-pulse" />
                  <span>{t('checker.voiceStart', 'Start Recording Voice Note')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-2.5 rounded-full bg-slate-950 px-6 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-slate-900 animate-bounce active:scale-95"
                >
                  <span className="h-3 w-3 rounded-xs bg-red-500 animate-ping" />
                  <span>
                    {t('checker.voiceStop', {
                      time: recordingTime,
                      defaultValue: `Stop Recording (${recordingTime}s)`,
                    })}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleLoadSampleVoice}
                className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <span>🎧</span>
                <span>{t('checker.voiceLoadSample', 'Load Sample Voice Note')}</span>
              </button>
            </div>

            {/* Error Banner when Microphone is Blocked */}
            {micError && (
              <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-left text-xs text-amber-950">
                <div className="flex items-start gap-2.5">
                  <span className="text-base">⚠️</span>
                  <div className="space-y-2 flex-1">
                    <p className="font-bold text-amber-900">
                      {t('checker.micNoticeTitle', 'Microphone Access Notice')}
                    </p>
                    <p className="leading-relaxed text-amber-900">{micError}</p>
                    <p className="text-[11px] text-amber-800">
                      💡 <strong>Why this happens:</strong>{' '}
                      {t(
                        'checker.micNoticeReason',
                        'The AI Studio preview is running inside a secure iframe, where browsers block direct hardware microphone access for safety.',
                      )}
                    </p>
                    <div className="pt-1 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleLoadSampleVoice}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-800 transition"
                      >
                        <span>{t('checker.micNoticeDemoBtn', '⚡ Load Demo Voice Note')}</span>
                      </button>
                      <a
                        href={typeof window !== 'undefined' ? window.location.href : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-bold text-amber-950 shadow-2xs hover:bg-amber-100 transition"
                      >
                        <span>{t('checker.micNoticeTabBtn', '↗️ Open in New Tab for Real Microphone')}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Audio Player Preview */}
            {filePreview && (
              <div className="my-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                    <span className="text-base">🎙️</span>
                    <span>
                      {t('checker.voiceReady', 'Ready for Analysis:')} {selectedFile?.name || 'Voice Note'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null)
                      setFilePreview(null)
                      setFileBase64(null)
                    }}
                    className="text-[11px] font-semibold text-emerald-800 hover:underline"
                  >
                    {t('checker.voiceRemoveRecord', '✕ Remove & Record Again')}
                  </button>
                </div>
                <div className="mt-3 flex justify-center">
                  <audio controls src={filePreview} className="w-full max-w-md h-10" />
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500">
              {t(
                'checker.voiceDevicePrompt',
                'Or choose an audio recording from your device (.mp3, .wav, .m4a, .webm, .ogg):',
              )}
            </p>

            <input
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.aac"
              onChange={handleFileSelect}
              className="mt-2 text-xs text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-100 file:px-4 file:py-2 file:text-xs file:font-bold file:text-emerald-800 hover:file:bg-emerald-200"
            />
          </div>

          {/* Optional Transcript / Context box */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              {t('checker.voiceContextLabel', 'Optional Context / Voice Transcript Review:')}
            </label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t(
                'checker.voiceContextPlaceholder',
                'If you already have a transcript or notes about the voice message, enter it here...',
              )}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={
          loading ||
          (modality === 'text' && !textInput.trim()) ||
          (modality === 'url' && !urlInput.trim()) ||
          ((modality === 'image' || modality === 'voice') && !fileBase64 && !textInput.trim())
        }
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>{t('checker.analyzing', 'Analyzing content with evidence grounding...')}</span>
          </>
        ) : (
          <>
            <span>🔍</span>
            <span>{t('checker.button', 'Investigate & Verify Claims')}</span>
          </>
        )}
      </button>
    </div>
  )
}
