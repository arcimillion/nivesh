/**
 * React Hook & Middleware for Stage 1 Zero-Trust Guardrail Bouncer
 * Intercepts user text or uploaded images before network requests are dispatched.
 */

import { useState, useCallback } from 'react'
import type { AnalyzeOptions, AnalysisResult } from './api.ts'
import {
  runZeroTrustPreScreen,
  runDeterministicPreScreen,
  type PreScreenResult,
} from './zeroTrustPreScreener.ts'
import { executeNiveshShieldPipeline } from './pipeline.ts'

export { runDeterministicPreScreen, executeNiveshShieldPipeline }

export interface UseZeroTrustPreScreenerReturn {
  isPreScreening: boolean
  lastPreScreenResult: PreScreenResult | null
  interceptAndAnalyze: (
    options: AnalyzeOptions,
    onPassThroughToStage2: (options: AnalyzeOptions) => Promise<AnalysisResult>,
  ) => Promise<AnalysisResult>
  quickCheckText: (text: string) => boolean
}

export function useZeroTrustPreScreener(): UseZeroTrustPreScreenerReturn {
  const [isPreScreening, setIsPreScreening] = useState(false)
  const [lastPreScreenResult, setLastPreScreenResult] = useState<PreScreenResult | null>(null)

  const interceptAndAnalyze = useCallback(
    async (
      options: AnalyzeOptions,
      onPassThroughToStage2: (options: AnalyzeOptions) => Promise<AnalysisResult>,
    ): Promise<AnalysisResult> => {
      setIsPreScreening(true)
      try {
        // Run Stage 1 Guardrail Bouncer (0ms deterministic check)
        const preScreenResult = await runZeroTrustPreScreen(options)
        setLastPreScreenResult(preScreenResult)

        // 🔴 THE HARD RED BLOCK: Halt immediately if fatal red line is detected
        if (preScreenResult.intercepted && preScreenResult.syntheticAnalysis) {
          console.warn(
            `[Zero-Trust Bouncer] 🛑 Hard RED Block triggered in ${preScreenResult.executionLatencyMs}ms. Fatal match: "${preScreenResult.fatalMatch?.category}". Halted Stage 2 AI call to protect credentials & preserve quota.`,
          )
          return preScreenResult.syntheticAnalysis
        }

        // 🟢 Clean Pass-Through: Hand over to Stage 2 (Deep Multimodal AI)
        return await onPassThroughToStage2(options)
      } finally {
        setIsPreScreening(false)
      }
    },
    [],
  )

  const quickCheckText = useCallback((text: string): boolean => {
    return runDeterministicPreScreen(text)
  }, [])

  return {
    isPreScreening,
    lastPreScreenResult,
    interceptAndAnalyze,
    quickCheckText,
  }
}
