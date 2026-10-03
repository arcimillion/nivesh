import { useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnalysisResult } from '../api'
import {
  buildEvidenceGraphFromAnalysis,
  type EvidenceGraphNode,
} from '../types/evidenceGraph.ts'

interface EvidenceGraphProps {
  analysis: AnalysisResult | null
  submittedText?: string
  onOpenSafetyGate?: () => void
  onOpenCasebook?: () => void
}

export function EvidenceGraph({
  analysis,
  submittedText = '',
  onOpenSafetyGate,
  onOpenCasebook,
}: EvidenceGraphProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'graph' | 'list'>('graph')
  const [selectedNode, setSelectedNode] = useState<EvidenceGraphNode | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0 })

  const graphData = useMemo(() => {
    return buildEvidenceGraphFromAnalysis(analysis, submittedText)
  }, [analysis, submittedText])

  // Simple auto-layout calculation in concentric/hierarchical tiers
  const layout = useMemo(() => {
    const width = 880
    const height = 520
    const centerX = width / 2
    const centerY = height / 2

    const positionedNodes = graphData.nodes.map((node, idx) => {
      if (node.type === 'submitted_artifact') {
        return { ...node, x: centerX, y: centerY - 140 }
      }

      // Tier 1: Extracted Evidence
      if (node.type === 'extracted_evidence') {
        const evidenceNodes = graphData.nodes.filter((n) => n.type === 'extracted_evidence')
        const eIdx = evidenceNodes.findIndex((n) => n.id === node.id)
        const total = evidenceNodes.length
        const spacing = width / (total + 1)
        return {
          ...node,
          x: Math.max(90, Math.min(width - 90, spacing * (eIdx + 1))),
          y: centerY - 40,
        }
      }

      // Tier 2: Tactics & Risks
      if (node.type === 'suspicious_tactic' || node.type === 'financial_risk') {
        const midNodes = graphData.nodes.filter(
          (n) => n.type === 'suspicious_tactic' || n.type === 'financial_risk',
        )
        const mIdx = midNodes.findIndex((n) => n.id === node.id)
        const total = midNodes.length
        const spacing = width / (total + 1)
        return {
          ...node,
          x: Math.max(90, Math.min(width - 90, spacing * (mIdx + 1))),
          y: centerY + 70,
        }
      }

      // Tier 3: Regulatory Rules & Unknown Gaps
      const bottomNodes = graphData.nodes.filter(
        (n) => n.type === 'regulatory_reference' || n.type === 'unknown_gap',
      )
      const bIdx = bottomNodes.findIndex((n) => n.id === node.id)
      const total = bottomNodes.length || 1
      const spacing = width / (total + 1)
      return {
        ...node,
        x: Math.max(90, Math.min(width - 90, spacing * (bIdx + 1))),
        y: centerY + 175 + (idx % 2 === 0 ? 0 : 25),
      }
    })

    return { width, height, positionedNodes }
  }, [graphData])

  const getNodeColor = (type: EvidenceGraphNode['type']) => {
    switch (type) {
      case 'submitted_artifact':
        return { bg: 'fill-slate-900', border: 'stroke-slate-700', text: 'text-slate-100' }
      case 'extracted_evidence':
        return { bg: 'fill-amber-600', border: 'stroke-amber-700', text: 'text-white' }
      case 'suspicious_tactic':
        return { bg: 'fill-amber-500', border: 'stroke-amber-600', text: 'text-white' }
      case 'financial_risk':
        return { bg: 'fill-red-600', border: 'stroke-red-700', text: 'text-white' }
      case 'regulatory_reference':
        return { bg: 'fill-blue-600', border: 'stroke-blue-700', text: 'text-white' }
      case 'unknown_gap':
        return { bg: 'fill-slate-500', border: 'stroke-slate-400', text: 'text-white' }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true)
    panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    setPanOffset({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    })
  }

  const handleMouseUp = () => setIsPanning(false)

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(0.6, Math.min(2.0, prev + delta)))
  }

  const resetView = () => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header bar */}
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🕸️</span>
            <h3 className="text-base font-bold text-slate-900">
              {t('evidenceGraph.title', 'Interactive Scam Evidence Graph')}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-600 max-w-2xl">
            {t(
              'evidenceGraph.subtitle',
              'Visualizes why this content is suspicious by mapping submitted excerpts directly to observed tactics, legal risks, official SEBI/RBI rules, and unverified gaps.',
            )}
          </p>
        </div>

        {/* View toggles & Quick stats */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('graph')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'graph'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('evidenceGraph.graphView', 'Graph Canvas')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('evidenceGraph.listView', 'Accessible List View')}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
          <span className="text-[11px] text-slate-500 block">Observed Evidence</span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {graphData.observedCount} Facts
          </span>
        </div>
        <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50">
          <span className="text-[11px] text-amber-800 block">AI Inferences / Risks</span>
          <span className="font-mono font-bold text-amber-900 text-sm">
            {graphData.inferenceCount} Tactics
          </span>
        </div>
        <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50">
          <span className="text-[11px] text-blue-800 block">Official Citations</span>
          <span className="font-mono font-bold text-blue-900 text-sm">
            {graphData.regulatoryCount} Rules
          </span>
        </div>
        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
          <span className="text-[11px] text-slate-500 block">Unverified Gaps</span>
          <span className="font-mono font-bold text-slate-700 text-sm">
            {graphData.unknownCount} Unknowns
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'graph' ? (
        <div className="relative rounded-xl border border-slate-200 bg-slate-950 overflow-hidden">
          {/* Zoom & Canvas Controls */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800 shadow-md">
            <button
              type="button"
              onClick={() => handleZoom(0.15)}
              className="px-2 py-1 text-xs text-slate-200 hover:bg-slate-800 rounded font-bold"
              title="Zoom In"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => handleZoom(-0.15)}
              className="px-2 py-1 text-xs text-slate-200 hover:bg-slate-800 rounded font-bold"
              title="Zoom Out"
              aria-label="Zoom out"
            >
              -
            </button>
            <button
              type="button"
              onClick={resetView}
              className="px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800 rounded font-medium"
              title="Reset Zoom & Pan"
            >
              Reset
            </button>
          </div>

          {/* Interactive Legend Bar */}
          <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-3 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-300" /> Submitted Input
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Extracted Excerpt
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Escalation Risk
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Regulatory Rule
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-500" /> Unknown Info
            </span>
          </div>

          {/* SVG Canvas */}
          <svg
            className="w-full h-[460px] cursor-grab active:cursor-grabbing select-none"
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <g
              transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}
              transform-origin={`${layout.width / 2} ${layout.height / 2}`}
            >
              {/* Edges */}
              {graphData.edges.map((edge) => {
                const sourceNode = layout.positionedNodes.find((n) => n.id === edge.source)
                const targetNode = layout.positionedNodes.find((n) => n.id === edge.target)
                if (!sourceNode || !targetNode) return null

                const sx = sourceNode.x || 0
                const sy = sourceNode.y || 0
                const tx = targetNode.x || 0
                const ty = targetNode.y || 0

                return (
                  <g key={edge.id}>
                    <line
                      x1={sx}
                      y1={sy}
                      x2={tx}
                      y2={ty}
                      stroke={edge.isHypothesized ? '#64748b' : '#94a3b8'}
                      strokeWidth={edge.isHypothesized ? 1.5 : 2}
                      strokeDasharray={edge.isHypothesized ? '4 3' : undefined}
                      opacity={0.65}
                    />
                  </g>
                )
              })}

              {/* Nodes */}
              {layout.positionedNodes.map((node) => {
                const colors = getNodeColor(node.type)
                const isSelected = selectedNode?.id === node.id
                const nx = node.x || 0
                const ny = node.y || 0

                return (
                  <g
                    key={node.id}
                    transform={`translate(${nx}, ${ny})`}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    aria-label={`Evidence node: ${node.label}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedNode(node)
                      }
                    }}
                  >
                    {/* Pulsing ring if selected */}
                    {isSelected && (
                      <circle
                        r="32"
                        className="fill-none stroke-emerald-400 stroke-2 animate-ping opacity-75"
                      />
                    )}

                    <circle
                      r="24"
                      className={`${colors.bg} ${colors.border} stroke-2 transition-transform group-hover:scale-110 shadow-lg`}
                    />

                    {/* Small icon badge */}
                    <text
                      textAnchor="middle"
                      dy="5"
                      className="text-xs font-bold fill-white select-none pointer-events-none"
                    >
                      {node.type === 'submitted_artifact'
                        ? '📄'
                        : node.type === 'extracted_evidence'
                          ? '🔍'
                          : node.type === 'suspicious_tactic'
                            ? '⚡'
                            : node.type === 'financial_risk'
                              ? '🚨'
                              : node.type === 'regulatory_reference'
                                ? '⚖️'
                                : '❓'}
                    </text>

                    {/* Label below node */}
                    <text
                      textAnchor="middle"
                      dy="42"
                      className="text-[11px] font-medium fill-slate-200 pointer-events-none select-none"
                    >
                      {node.label.length > 24 ? `${node.label.slice(0, 22)}...` : node.label}
                    </text>
                  </g>
                )
              })}
            </g>
          </svg>
        </div>
      ) : (
        /* Accessible List & Table View */
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 max-h-[460px] overflow-y-auto">
          <p className="text-xs text-slate-600 font-medium">
            Accessible screen-reader list of all nodes, facts, and relationships in the current
            investigation:
          </p>
          <div className="divide-y divide-slate-200 bg-white rounded-lg border border-slate-200">
            {graphData.nodes.map((node) => (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`p-3 text-xs transition cursor-pointer hover:bg-slate-50 ${
                  selectedNode?.id === node.id ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : ''
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{node.label}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {node.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Source: {node.sourceType.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="mt-1 text-slate-600 leading-relaxed">{node.shortExplanation}</p>
                {node.excerpt && (
                  <p className="mt-1 text-[11px] font-mono text-slate-800 bg-slate-50 p-2 rounded border border-slate-200">
                    "{node.excerpt}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 animate-fade-in space-y-3">
          <div className="flex items-start justify-between flex-wrap gap-2 border-b border-slate-200 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900">{selectedNode.label}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  {selectedNode.type.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{selectedNode.shortExplanation}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="text-xs text-slate-400 hover:text-slate-700 font-bold"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-700 block mb-0.5">
                Source Provenance & Nature:
              </span>
              <p className="text-slate-600">
                {selectedNode.isObservedFact
                  ? 'Verified directly from the user-submitted content / official citation.'
                  : 'Derived through AI inference and fraud-pattern matching.'}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-700 block mb-0.5">
                Verification Status:
              </span>
              <p className="text-slate-600 capitalize">
                {selectedNode.verificationStatus.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          {selectedNode.excerpt && (
            <div>
              <span className="text-[11px] font-bold text-slate-700 block mb-1">
                Original Exact Excerpt:
              </span>
              <div className="bg-white p-2.5 rounded border border-slate-200 font-mono text-xs text-slate-900 leading-relaxed whitespace-pre-wrap">
                "{selectedNode.excerpt}"
              </div>
            </div>
          )}

          {/* Connected Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            {onOpenSafetyGate && (
              <button
                type="button"
                onClick={onOpenSafetyGate}
                className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                Evaluate in Safety Gate ➔
              </button>
            )}
            {onOpenCasebook && (
              <button
                type="button"
                onClick={onOpenCasebook}
                className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Log to Incident Casebook ➔
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
