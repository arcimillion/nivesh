import type { AnalysisResult } from '../api'

export type EvidenceNodeType =
  | 'submitted_artifact'
  | 'extracted_evidence'
  | 'suspicious_tactic'
  | 'financial_risk'
  | 'regulatory_reference'
  | 'unknown_gap'

export type EvidenceSourceType =
  | 'user_content'
  | 'ai_inference'
  | 'community_report'
  | 'official_regulatory'

export type EvidenceVerificationStatus =
  | 'verified'
  | 'unverified'
  | 'contradicted'
  | 'unknown'

export interface EvidenceGraphNode {
  id: string
  type: EvidenceNodeType
  label: string
  shortExplanation: string
  excerpt?: string
  sourceType: EvidenceSourceType
  verificationStatus: EvidenceVerificationStatus
  category?: string
  timestamp?: string
  unknownDetails?: string
  isObservedFact: boolean
  x?: number
  y?: number
}

export interface EvidenceGraphEdge {
  id: string
  source: string
  target: string
  relationshipLabel: string
  isHypothesized?: boolean
}

export interface EvidenceGraphData {
  nodes: EvidenceGraphNode[]
  edges: EvidenceGraphEdge[]
  summary: string
  observedCount: number
  inferenceCount: number
  unknownCount: number
  regulatoryCount: number
}

/**
 * Builds an explainable evidence graph from any AnalysisResult (Gemini or offline fallback)
 * without making secondary network calls.
 */
export function buildEvidenceGraphFromAnalysis(
  analysis: AnalysisResult | null,
  submittedText = '',
): EvidenceGraphData {
  if (!analysis) {
    const rootId = 'node_root_empty'
    return {
      nodes: [
        {
          id: rootId,
          type: 'submitted_artifact',
          label: 'Submitted Artifact',
          shortExplanation: 'No content analyzed yet. Submit a message, image, URL, or voice note.',
          sourceType: 'user_content',
          verificationStatus: 'unknown',
          isObservedFact: true,
        },
      ],
      edges: [],
      summary: 'No analysis evidence available.',
      observedCount: 0,
      inferenceCount: 0,
      unknownCount: 0,
      regulatoryCount: 0,
    }
  }

  const nodes: EvidenceGraphNode[] = []
  const edges: EvidenceGraphEdge[] = []

  let observedCount = 0
  let inferenceCount = 0
  let unknownCount = 0
  let regulatoryCount = 0

  // 1. Root Node: Submitted Artifact
  const rootId = 'node_root'
  const rawExcerpt = analysis.extracted_text || submittedText || ''
  nodes.push({
    id: rootId,
    type: 'submitted_artifact',
    label: `Input (${analysis.input_modality.toUpperCase()})`,
    shortExplanation: `Submitted for analysis in ${analysis.input_language.toUpperCase()}. ${
      analysis.extraction_uncertainty.has_uncertainty
        ? `Extraction uncertainty noted: ${analysis.extraction_uncertainty.notes}`
        : 'Text extracted with high confidence.'
    }`,
    excerpt: rawExcerpt.slice(0, 240) + (rawExcerpt.length > 240 ? '...' : ''),
    sourceType: 'user_content',
    verificationStatus: 'unverified',
    isObservedFact: true,
  })
  observedCount++

  // 2. Extracted Evidence Nodes (Findings)
  const findingNodeIds: string[] = []
  if (analysis.findings && analysis.findings.length > 0) {
    analysis.findings.forEach((finding, idx) => {
      const findingId = `node_finding_${idx}`
      findingNodeIds.push(findingId)
      nodes.push({
        id: findingId,
        type: 'extracted_evidence',
        label: finding.indicator.replace(/_/g, ' '),
        shortExplanation: finding.explanation,
        excerpt: finding.original_excerpt,
        sourceType: 'user_content',
        verificationStatus:
          finding.verification_status === 'verified'
            ? 'verified'
            : finding.verification_status === 'not_independently_verified'
              ? 'unverified'
              : 'unknown',
        category: finding.indicator,
        isObservedFact: Boolean(finding.original_excerpt && finding.original_excerpt.trim()),
      })
      observedCount++

      // Edge from Root to Finding
      edges.push({
        id: `edge_root_${findingId}`,
        source: rootId,
        target: findingId,
        relationshipLabel: 'contains indicator',
      })
    })
  }

  // 3. Extracted Entities (Phones, URLs, Payment Requests)
  if (analysis.extracted_entities) {
    const { phone_numbers, urls, payment_requests, promised_returns } =
      analysis.extracted_entities

    if (phone_numbers && phone_numbers.length > 0) {
      phone_numbers.forEach((phone, pIdx) => {
        const phoneId = `node_entity_phone_${pIdx}`
        nodes.push({
          id: phoneId,
          type: 'extracted_evidence',
          label: `Contact: ${phone}`,
          shortExplanation:
            'Contact identifier extracted from message. Personal mobile headers require independent TRAI/DLT validation.',
          excerpt: phone,
          sourceType: 'user_content',
          verificationStatus: 'unverified',
          category: 'phone_number',
          isObservedFact: true,
        })
        observedCount++
        edges.push({
          id: `edge_root_${phoneId}`,
          source: rootId,
          target: phoneId,
          relationshipLabel: 'communicates via',
        })
      })
    }

    if (urls && urls.length > 0) {
      urls.forEach((urlItem, uIdx) => {
        const urlId = `node_entity_url_${uIdx}`
        nodes.push({
          id: urlId,
          type: 'extracted_evidence',
          label: `URL: ${urlItem}`,
          shortExplanation: 'Web address extracted from message. Subject to SSRF security proxy checks.',
          excerpt: urlItem,
          sourceType: 'user_content',
          verificationStatus: 'unverified',
          category: 'url',
          isObservedFact: true,
        })
        observedCount++
        edges.push({
          id: `edge_root_${urlId}`,
          source: rootId,
          target: urlId,
          relationshipLabel: 'links to',
        })
      })
    }

    if (payment_requests && payment_requests.length > 0) {
      payment_requests.forEach((payReq, prIdx) => {
        const payId = `node_entity_pay_${prIdx}`
        nodes.push({
          id: payId,
          type: 'extracted_evidence',
          label: `Payment Solicitation: ${payReq}`,
          shortExplanation: 'Request for capital deposit, registration fee, or trading transfer.',
          excerpt: payReq,
          sourceType: 'user_content',
          verificationStatus: 'unverified',
          category: 'payment_solicitation',
          isObservedFact: true,
        })
        observedCount++
        edges.push({
          id: `edge_root_${payId}`,
          source: rootId,
          target: payId,
          relationshipLabel: 'solicits payment',
        })
      })
    }

    if (promised_returns && promised_returns.length > 0) {
      promised_returns.forEach((ret, rIdx) => {
        const retId = `node_entity_ret_${rIdx}`
        nodes.push({
          id: retId,
          type: 'extracted_evidence',
          label: `Return Claim: ${ret}`,
          shortExplanation: 'Promised profit or yield rate detected in communication.',
          excerpt: ret,
          sourceType: 'user_content',
          verificationStatus: 'contradicted',
          category: 'promised_return',
          isObservedFact: true,
        })
        observedCount++
        edges.push({
          id: `edge_root_${retId}`,
          source: rootId,
          target: retId,
          relationshipLabel: 'promises return',
        })
      })
    }
  }

  // 4. Scam Journey Tactics (Observed vs Future Risks)
  const tacticNodeIds: string[] = []
  if (analysis.scam_journey_map && analysis.scam_journey_map.length > 0) {
    analysis.scam_journey_map.forEach((stage, sIdx) => {
      const tacticId = `node_tactic_${sIdx}`
      tacticNodeIds.push(tacticId)
      const isObserved = Boolean(stage.observed)

      nodes.push({
        id: tacticId,
        type: isObserved ? 'suspicious_tactic' : 'financial_risk',
        label: `${isObserved ? 'Observed Tactic' : 'Potential Risk'}: ${stage.title}`,
        shortExplanation: stage.explanation,
        excerpt: stage.evidence || undefined,
        sourceType: isObserved ? 'user_content' : 'ai_inference',
        verificationStatus: isObserved ? 'verified' : 'unverified',
        category: stage.stage,
        isObservedFact: isObserved,
      })

      if (isObserved) {
        observedCount++
      } else {
        inferenceCount++
      }

      // Connect to root or matching finding
      const matchingFinding = findingNodeIds.find((fId) =>
        fId.toLowerCase().includes(stage.stage.split('_')[0]),
      )
      if (matchingFinding) {
        edges.push({
          id: `edge_${matchingFinding}_${tacticId}`,
          source: matchingFinding,
          target: tacticId,
          relationshipLabel: isObserved ? 'exhibits behavior' : 'escalates into',
          isHypothesized: !isObserved,
        })
      } else {
        edges.push({
          id: `edge_root_${tacticId}`,
          source: rootId,
          target: tacticId,
          relationshipLabel: isObserved ? 'applies tactic' : 'future risk profile',
          isHypothesized: !isObserved,
        })
      }
    })
  }

  // 5. Regulatory Reference Nodes (Claims Investigation)
  if (analysis.claims && analysis.claims.length > 0) {
    analysis.claims.forEach((claim, cIdx) => {
      const claimId = `node_claim_${cIdx}`
      nodes.push({
        id: claimId,
        type: 'regulatory_reference',
        label: claim.external_source_consulted
          ? `SEBI/RBI Rule: ${claim.external_source_consulted.title.slice(0, 32)}...`
          : 'Official Regulatory Guidance',
        shortExplanation: claim.what_content_establishes,
        excerpt: claim.external_source_consulted?.relevant_excerpt || claim.original_claim,
        sourceType: 'official_regulatory',
        verificationStatus:
          claim.source_verdict === 'contradicts'
            ? 'contradicted'
            : claim.source_verdict === 'supports'
              ? 'verified'
              : 'unverified',
        category: 'regulatory_rule',
        isObservedFact: true,
      })
      regulatoryCount++

      // Edge from matching tactic or root
      const parentTactic = tacticNodeIds[cIdx] || rootId
      edges.push({
        id: `edge_${parentTactic}_${claimId}`,
        source: parentTactic,
        target: claimId,
        relationshipLabel:
          claim.source_verdict === 'contradicts'
            ? 'violates regulation'
            : 'evaluated against',
      })
    })
  }

  // 6. Unknown / Unverified Information Gaps
  if (analysis.unknowns && analysis.unknowns.length > 0) {
    analysis.unknowns.forEach((unk, uIdx) => {
      const unkId = `node_unknown_${uIdx}`
      nodes.push({
        id: unkId,
        type: 'unknown_gap',
        label: `Unverified: ${unk.slice(0, 32)}${unk.length > 32 ? '...' : ''}`,
        shortExplanation: unk,
        sourceType: 'ai_inference',
        verificationStatus: 'unknown',
        unknownDetails: unk,
        category: 'evidence_gap',
        isObservedFact: false,
      })
      unknownCount++

      edges.push({
        id: `edge_root_${unkId}`,
        source: rootId,
        target: unkId,
        relationshipLabel: 'remains unknown',
        isHypothesized: true,
      })
    })
  }

  return {
    nodes,
    edges,
    summary:
      analysis.summary ||
      `Evidence graph compiled with ${nodes.length} nodes and ${edges.length} evidenced relationships.`,
    observedCount,
    inferenceCount,
    unknownCount,
    regulatoryCount,
  }
}
