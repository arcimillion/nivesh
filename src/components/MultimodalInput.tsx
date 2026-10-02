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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<any>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialText) {
      setTextInput(initialText)
    }
  }, [initialText])

  // Clean up object URLs
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioFile = new File([audioBlob], 'voice_note.webm', { type: 'audio/webm' })
        setSelectedFile(audioFile)
        setFilePreview(URL.createObjectURL(audioBlob))

        const reader = new FileReader()
        reader.onloadend = () => {
          setFileBase64(reader.result as string)
        }
        reader.readAsDataURL(audioBlob)

        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      alert('Microphone access denied or unsupported by browser. Please upload an audio file instead.')
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
            Select an input type below: Text message, Screenshot, URL, or Voice note.
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
          <span className="hidden sm:inline">Text</span>
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
          <span className="hidden sm:inline">Screenshot</span>
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
          <span className="hidden sm:inline">URL Link</span>
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
          <span className="hidden sm:inline">Voice Note</span>
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
            <span>{textInput.length}/15,000 chars</span>
            <span>Untrusted data sandbox active</span>
          </div>
        </div>
      )}

      {/* 2. SCREENSHOT / IMAGE TAB */}
      {modality === 'image' && (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
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
                  Click to change image
                </p>
              </div>
            ) : (
              <div>
                <div className="text-3xl">📷</div>
                <p className="mt-2 text-sm font-bold text-slate-800">
                  Upload Screenshot or Trading Post Image
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Supports PNG, JPG, WEBP. Text will be extracted via multimodal OCR.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Optional Context or Additional Notes:
            </label>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Add optional notes or message context..."
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
              Suspicious Website URL / Web Link:
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔗</span>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://trade-fast-bonus.com or http://bit.ly/claim-returns"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 font-mono"
              />
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900 flex items-start gap-2">
            <span>🛡️</span>
            <span>
              <strong>SSRF Protected:</strong> Target web pages are fetched through a isolated security proxy that blocks local IP ranges, private subnets, and malicious executable downloads.
            </span>
          </div>
        </div>
      )}

      {/* 4. VOICE NOTE TAB */}
      {modality === 'voice' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <div className="flex justify-center gap-4 mb-4">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-red-700"
                >
                  <span className="h-3 w-3 rounded-full bg-white animate-pulse" />
                  <span>Start Recording Voice Note</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-slate-800"
                >
                  <span className="h-3 w-3 rounded bg-red-500" />
                  <span>Stop Recording ({recordingTime}s)</span>
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Or choose an audio file from your device:
            </p>

            <input
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="mt-2 text-xs text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-100 file:px-4 file:py-2 file:text-xs file:font-bold file:text-emerald-800 hover:file:bg-emerald-200"
            />

            {selectedFile && (
              <div className="mt-3 text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
                <span>🎙️ Ready: {selectedFile.name}</span>
              </div>
            )}
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
            <span>Analyzing content with evidence grounding...</span>
          </>
        ) : (
          <>
            <span>🔍</span>
            <span>Investigate & Verify Claims</span>
          </>
        )}
      </button>
    </div>
  )
}
