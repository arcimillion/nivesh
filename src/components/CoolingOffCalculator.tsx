import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

function formatRemaining(end: number | null): string {
  if (!end) return ''
  const remaining = end - Date.now()
  if (remaining <= 0) return 'Cooling-off period complete. Please review checklist carefully.'
  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
  return `${hours}h ${minutes}m ${seconds}s remaining`
}

export function CoolingOffCalculator() {
  const { t } = useTranslation()

  // Cooling-off timer state initialized from localStorage
  const [timerDurationHours, setTimerDurationHours] = useState<number>(24)
  const [timerEndTime, setTimerEndTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('nivesh_cooling_timer')
      if (saved) {
        const time = Number(saved)
        if (time > Date.now()) {
          return time
        } else {
          localStorage.removeItem('nivesh_cooling_timer')
        }
      }
    } catch {
      // ignore
    }
    return null
  })

  const [timeLeftStr, setTimeLeftStr] = useState<string>(() => formatRemaining(timerEndTime))

  // Checklist state
  const [checkedFamily, setCheckedFamily] = useState(false)
  const [checkedSebi, setCheckedSebi] = useState(false)
  const [checkedAccountType, setCheckedAccountType] = useState(false)
  const [checkedNoPressure, setCheckedNoPressure] = useState(false)

  // Math calculator state
  const [initialCapital, setInitialCapital] = useState<number>(10000)
  const [ratePercent, setRatePercent] = useState<number>(10)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly')

  // Timer countdown tick
  useEffect(() => {
    if (!timerEndTime) return

    const updateCountdown = () => {
      const remaining = timerEndTime - Date.now()
      if (remaining <= 0) {
        setTimeLeftStr('Cooling-off period complete. Please review checklist carefully.')
        setTimerEndTime(null)
        try {
          localStorage.removeItem('nivesh_cooling_timer')
        } catch {
          // ignore
        }
        return
      }

      setTimeLeftStr(formatRemaining(timerEndTime))
    }

    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [timerEndTime])

  const startCoolingPeriod = (hours: number) => {
    const end = Date.now() + hours * 60 * 60 * 1000
    setTimerEndTime(end)
    try {
      localStorage.setItem('nivesh_cooling_timer', String(end))
    } catch {
      // ignore
    }
  }

  const cancelCoolingPeriod = () => {
    setTimerEndTime(null)
    setTimeLeftStr('')
    try {
      localStorage.removeItem('nivesh_cooling_timer')
    } catch {
      // ignore
    }
  }

  // Calculate 1-year compounded projection
  const periodsInYear = frequency === 'daily' ? 250 : frequency === 'weekly' ? 52 : 12
  const r = ratePercent / 100
  const compoundedOneYear = initialCapital * Math.pow(1 + r, periodsInYear)

  const formatCurrency = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Crore`
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`
    }
    return `₹${Math.round(val).toLocaleString('en-IN')}`
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⏱️</span>
            <h3 className="text-base font-bold text-slate-900">
              {t('cooling.title', 'The 24-Hour Cooling-Off Shield & Reality-Check Math')}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-600 max-w-2xl">
            {t(
              'cooling.subtitle',
              'Scammers weaponize artificial urgency and mathematical illusions. Use mandatory cooling-off friction and compounding reality calculations to expose the fraud.',
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          <span>Behavioral Resilience Track</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Module 1: Behavioral Emergency Pause Timer */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <span>⏸️</span> 24-Hour Emergency Pause Shield
              </h4>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                Breaks Panic / FOMO
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Fraudsters always demand immediate action (e.g. <em>"Slots close in 30 mins"</em>). Activate a cooling-off timer before making any transaction.
            </p>

            {timerEndTime ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center my-3">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  Active Cooling-Off Pause
                </span>
                <p className="mt-1 text-xl sm:text-2xl font-mono font-extrabold text-amber-950 tracking-tight">
                  {timeLeftStr}
                </p>
                <p className="mt-2 text-xs text-amber-800 font-medium">
                  Do not transfer funds during this window. Use this time to verify credentials.
                </p>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={cancelCoolingPeriod}
                    className="text-xs text-slate-600 hover:text-slate-900 underline"
                  >
                    Reset Timer
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 my-3">
                <label className="text-xs font-semibold text-slate-700 block">
                  Select Cooling-Off Period:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[12, 24, 48].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setTimerDurationHours(h)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                        timerDurationHours === h
                          ? 'bg-emerald-700 text-white border-emerald-800'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {h} Hours
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => startCoolingPeriod(timerDurationHours)}
                  className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
                >
                  Start {timerDurationHours}-Hour Cooling-Off Shield
                </button>
              </div>
            )}

            {/* Sanity Checklist */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 block mb-2">
                Pre-Transfer Verification Checklist:
              </span>
              <div className="space-y-2 text-xs text-slate-700">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedFamily}
                    onChange={(e) => setCheckedFamily(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600"
                  />
                  <span>I discussed this opportunity with at least one family member or close friend.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedSebi}
                    onChange={(e) => setCheckedSebi(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600"
                  />
                  <span>I verified the advisor's SEBI registration number on sebi.gov.in.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedAccountType}
                    onChange={(e) => setCheckedAccountType(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600"
                  />
                  <span>The beneficiary is NOT a personal savings account or personal UPI handle.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedNoPressure}
                    onChange={(e) => setCheckedNoPressure(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600"
                  />
                  <span>No one threatened me with "loss of special slots" or "account suspension".</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Module 2: Compounding Reality-Check Math Engine */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <span>🧮</span> Compounding Reality-Check Engine
              </h4>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                Mathematical Proof
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Enter the return rate promised by the advisor or message. See what standard compound interest says about why this is mathematically impossible.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="capital-input" className="text-xs font-semibold text-slate-700 block mb-1">
                  Initial Capital
                </label>
                <input
                  id="capital-input"
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(Math.max(100, Number(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono font-bold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label htmlFor="rate-input" className="text-xs font-semibold text-slate-700 block mb-1">
                  Promised Return (%)
                </label>
                <input
                  id="rate-input"
                  type="number"
                  value={ratePercent}
                  onChange={(e) => setRatePercent(Math.max(1, Number(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono font-bold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label htmlFor="freq-select" className="text-xs font-semibold text-slate-700 block mb-1">
                  Frequency
                </label>
                <select
                  id="freq-select"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium text-slate-700 bg-white"
                >
                  <option value="daily">Per Day (250 Days)</option>
                  <option value="weekly">Per Week (52 Weeks)</option>
                  <option value="monthly">Per Month (12 Months)</option>
                </select>
              </div>
            </div>

            {/* Calculated Reality Card */}
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50/80 p-4">
              <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider block">
                Mathematical Result in Just 1 Year:
              </span>
              <p className="mt-1 text-2xl font-mono font-extrabold text-red-950">
                {formatCurrency(compoundedOneYear)}
              </p>
              <p className="mt-2 text-xs text-red-900 leading-relaxed font-medium">
                ₹{initialCapital.toLocaleString('en-IN')} compounding at {ratePercent}% {frequency} would grow into {formatCurrency(compoundedOneYear)} in 12 months.
              </p>

              <div className="mt-3 pt-3 border-t border-red-200/60 text-xs text-slate-800 space-y-1.5 font-medium">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Top Global Hedge Funds & Warren Buffett:</span>
                  <span className="font-bold text-slate-900">~15% - 20% PER YEAR</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">RBI Bank Fixed Deposit (FD):</span>
                  <span className="font-bold text-slate-900">~6.5% - 7.5% PER YEAR</span>
                </div>
              </div>
            </div>

            {/* Plain Reality Check Insight */}
            <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 font-medium leading-relaxed">
              💡 <strong>The Logical Reality:</strong> If this trading algorithm or secret group actually produced {ratePercent}% {frequency}, the creator would become richer than the entire Government of India within 2–3 years. They would never need to ask you for ₹{initialCapital.toLocaleString('en-IN')} on WhatsApp.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
