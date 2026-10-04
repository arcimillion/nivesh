# 🛡️ NiveshShield 2.0 — Multimodal AI Investor-Resilience Platform
> **Understand Before You Trust** • Built for SANGYAN 2026 Hackathon

NiveshShield 2.0 transforms traditional superficial scam checkers into an **evidence-grounded, multimodal investor resilience and protection system**. It empowers retail investors across India to evaluate unsolicited investment tips, suspicious trading platforms, screenshots, URLs, and voice messages against official regulatory guidance from SEBI, RBI, and the CyberCrime Reporting Portal.

---

## 🏛️ System Architecture

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER (Vite + React 19)                    │
│                                                                           │
│  [Multimodal Input]    [Demo Selector]     [Multilingual Voice Readout]  │
│  • Pasted Text         • 3 Scenarios       • Web Speech API (6 langs)    │
│  • Screenshots/OCR     • Real-time Test    • In-UI Transcript Fallback   │
│  • URL Security Fetch  • Auto-Language     • Play / Pause Controls       │
│  • Microphone Audio                                                       │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ HTTP POST /api/analyze (JSON / base64)
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                    FULL-STACK BACKEND (Express 5 on Node.js 22)           │
│                                                                           │
│  ├── Security Filters (10MB body limit, CORS, Express rate limiter)       │
│  ├── SSRF-Protected URL Fetcher (DNS resolution, private IP blocklist)    │
│  ├── Curated Regulatory Knowledge Base (SEBI, RBI, CyberCrime 1930)       │
│  └── Grounded Multimodal Engine (@google/genai & Zod Schema Validation)   │
│       ├── Strict Prompt-Injection Guardrails                             │
│       ├── Itemized Claim Investigation (6-dimension verification)        │
│       ├── 5-Stage Scam Journey Tactic Map (Observed vs Future Risk)       │
│       └── Graceful Baseline Engine Fallback                              │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
        [Google Gemini 2.5 Flash]              [Regulatory Knowledge Base]
        Multimodal Structured JSON             SEBI SCORES 2.0, RBI Sachet,
        with strict schema adherence           DoT Chakshu, Helpline 1930
```

---

## 🚀 Key Features

### 1. Multimodal Input Ingestion
* **Pasted Text Messages**: Direct character-aware analysis of chat messages, emails, or SMS.
* **Uploaded Screenshots**: Base64 encoded in-memory image processing using Gemini vision to perform OCR and analyze visual manipulation tactics.
* **Copied URLs (SSRF Protected)**: Safe URL fetching with pre-flight DNS lookups, private IP range blocking (127.0.0.1, 10.x, 192.168.x, 172.16-31.x, IPv6 loopback), 6-second timeout, and HTML tag sanitization.
* **Audio & Voice Notes**: In-browser microphone recording with real-time waveform counter and audio file upload support.

### 2. Evidence-Grounded Claim Investigation
Rather than returning a single opaque "scam" label, every financial claim is deconstructed across 6 evidence dimensions:
1. **Original Submitted Claim**: Exact quote from content.
2. **What Submitted Content Establishes**: Factual assertions present in content without speculation.
3. **External Regulatory Source Consulted**: Curated reference to official SEBI/RBI circulars.
4. **Source Verdict**: `supports`, `contradicts`, `does_not_establish`, or `unverified`.
5. **What Remains Unknown**: Information gaps (e.g. unverified registration numbers).
6. **Safe Verification Step**: Actionable check on official government portals.

### 3. Multilingual Voice Assistant
* Full interface and reasoning support across 6 Indian languages: **English (`en`)**, **Hindi (`hi`)**, **Marathi (`mr`)**, **Bengali (`bn`)**, **Tamil (`ta`)**, and **Gujarati (`gu`)**.
* Interactive speech synthesizer read-out using browser `SpeechSynthesisUtterance` mapped to regional speech codes (`hi-IN`, `mr-IN`, `bn-IN`, `ta-IN`, `gu-IN`, `en-IN`).
* Full resilient text transcript fallback if speech synthesis is unsupported in the client browser.

### 4. 5-Stage Scam Journey Tactic Map
Visual timeline breaking down the anatomy of financial manipulation:
1. `initial_offer`: Unsolicited high returns or trading tips.
2. `urgency_pressure`: Artificial deadlines or limited slot scarcity.
3. `payment_request`: Upfront fee, margin deposit, or personal UPI transfer.
4. `app_or_credential_request`: Non-playstore APK install or credential harvesting.
5. `followup_or_recovery`: Denial of withdrawals or fake recovery scams.
* Clearly highlights **Observed in Content** vs **Future Escalation Risks**.

### 5. Personalized Incident Response
Actionable remediation pathways for three critical user situations:
* **"I haven't sent money"**: Preventive checks, reporting on DoT Sanchar Saathi Chakshu facility, and verification on SEBI SCORES.
* **"I already sent money"**: Immediate "Golden Hour" incident response, National Cyber Crime Helpline **1930**, bank freeze steps, and formal filing at `cybercrime.gov.in`.
* **"I installed an app / opened link"**: Device isolation, malicious APK removal, SMS permission revocation, and credential resetting from clean devices.

### 6. AI Safety, Security & Defensive Architecture
* **Backend-Only Keys**: No API keys exposed to browser clients.
* **SSRF Guard**: Pre-resolves domain IP addresses and strictly rejects loopback, RFC 1918 private subnets, and local hostnames.
* **Prompt Injection Defense**: Explicit `<UNTRUSTED_SUBMITTED_CONTENT>` boundary isolation and instructions enforcing neutrality.
* **Data Minimization**: Screenshots and voice notes processed entirely in-memory; no media or credentials persisted.

---

## 🧪 Evaluation & Test Results

An automated repeatable test suite (`tests/evalSuite.ts`) tests 13 edge cases across modalities, languages, security boundaries, and attack vectors:

| ID | Test Case | Category | Input Modality / Language | Result | Note |
|---|---|---|---|:---:|---|
| **TC-01** | Guaranteed Returns Solicitation | Scam Detection | Text (`en`) | **PASS** | Flagged `guaranteed_returns` indicator |
| **TC-02** | Artificial Urgency & Payment Pressure | Scam Detection | Text (`en`) | **PASS** | Assessed `warning_signs_found` |
| **TC-03** | Ambiguous Community Scheme | Ambiguity & Uncertainty | Text (`en`) | **PASS** | Captured `insufficient_evidence` |
| **TC-04** | Being Educational Guidance | Benign Content | Text (`en`) | **PASS** | Marked `no_obvious_warning_signs` |
| **TC-05** | Prompt Injection Defense | Safety & Security | Text (`en`) | **PASS** | System prompt override neutralized |
| **TC-06** | Mixed-Language (Hinglish) | Multilingual NLP | Text (`hi`) | **PASS** | Flagged Hindi + English slang returns |
| **TC-07** | Tamil Language Evaluation | Multilingual NLP | Text (`ta`) | **PASS** | Evaluated Tamil claim structure |
| **TC-08** | Bengali Language Evaluation | Multilingual NLP | Text (`bn`) | **PASS** | Evaluated Bengali claim structure |
| **TC-09** | SSRF Localhost URL Blocking | Safety & Security | URL (`en`) | **PASS** | Blocked `127.0.0.1` attempt |
| **TC-10** | SSRF Private Subnet Blocking | Safety & Security | URL (`en`) | **PASS** | Blocked `192.168.1.1` attempt |
| **TC-11** | Unsupported Language Rejection | Boundary Check | Text (`de`) | **PASS** | HTTP 400 returned cleanly |
| **TC-12** | Empty Content Rejection | Boundary Check | Text (`en`) | **PASS** | HTTP 400 with validation error |
| **TC-13** | Oversized Payload Limit | Boundary Check | Text (`en`) | **PASS** | HTTP 400 (>20,000 chars rejected) |

**Overall Suite Result**: **13 / 13 Passed (100% Accuracy & Boundary Compliance)**

Run the tests anytime:
```bash
npm test
```

---

## 📁 Files Created & Modified

### Modified Files:
* `package.json`: Updated build & dev scripts to full-stack Express + Vite unified server, added `tsx`, `@types/express`, `@types/cors`, and `npm test` script.
* `index.html`: Configured title, meta description, and OpenGraph tags matching application identity.
* `src/api.ts`: Converted API client to relative endpoints (`/api/analyze`) for zero-CORS full-stack operation on port 3000.
* `src/components/VoiceAssistant.tsx`: Resolved state cascading render warnings, added transcript fallback for browsers without Speech API, removed intrusive `alert()`.
* `src/components/MultimodalInput.tsx`: Updated initialText state synchronization, typed timer refs, added microphone failure fallbacks.
* `src/components/ScamJourneyMap.tsx`: Cleaned unused parameters and optimized timeline rendering.
* `vite.config.ts`: Configured host `0.0.0.0` and port `3000`.
* `tsconfig.node.json`: Included full-stack server files for unified compilation.

### Created Files:
* `server.ts`: Production-ready full-stack entry point with Express 5, Vite middlewares, Gemini multimodal API integration, rate limiting, and regulatory fallback.
* `server/analysisSchema.ts`: TypeScript ESM Zod schema definition for multimodal input, findings, claims, and scam journey map.
* `server/knowledgeBase.ts`: Curated official regulatory knowledge base (SEBI, RBI, CyberCrime 1930, Sanchar Saathi).
* `server/urlFetcher.ts`: SSRF-protected URL fetcher with DNS validation and private IP filtering.
* `metadata.json`: Application metadata and `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` configuration.
* `tests/evalSuite.ts`: Automated test and evaluation suite covering 13 diverse scenarios.
* `.env.example`: Safe environment configuration template.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
FRONTEND_ORIGIN=http://localhost:3000
VITE_API_URL=
```
* `GEMINI_API_KEY`: Google Gemini API key used for multimodal analysis and structured extraction.
* `PORT`: Port to listen on (default `3000`).

---

## 🏃 Local Run Instructions

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npm test

# 3. Start development server (serves frontend + backend on port 3000)
npm run dev

# 4. Lint check
npm run lint

# 5. Production build
npm run build
```

Open `http://localhost:3000` in your web browser.

---

## 🚢 Deployment Checklist

- [x] dev script starts unified full-stack process on port 3000 (`tsx server.ts`).
- [x] production entry point starts cleanly with `node server.ts`.
- [x] TypeScript builds with zero errors (`tsc -b && vite build`).
- [x] ESLint passes with zero warnings or errors (`npm run lint`).
- [x] All 13 automated tests pass (`npm test`).
- [x] CORS configured for local and hosted preview environments.
- [x] Rate limiting active on `/api/analyze` (40 req/min).
- [x] SSRF guard blocks internal network probing via URL submission.
- [x] Data minimization strictly enforced (no storage of uploaded audio or screenshots).

---

## 🎬 Hackathon Demonstration Script (3-Minute Pitch)

1. **Introduction (30s)**:
   > "70% of retail fraud in India begins on WhatsApp or Telegram with fake promises of guaranteed 20% daily returns. Traditional checkers give a basic 'Safe' or 'Scam' score with no evidence. We built **NiveshShield 2.0** — an evidence-grounded investor resilience platform."
2. **Demo Case 1 — Multimodal Guaranteed Returns (60s)**:
   > "Click 'Try a Demo Case: Guaranteed Returns' or paste a message. Within seconds, NiveshShield extracts the claims, links them directly to SEBI's official Investor Alert on fake trading apps, and displays the **Scam Journey Tactic Map**, showing the user which tactics have occurred and what extortion or withdrawal trap will happen next."
3. **Demo Case 2 — Multilingual Voice Assistant (45s)**:
   > "India has 800 million smartphone users across diverse linguistic backgrounds. Switch the language to Hindi (`हिन्दी`) or Tamil (`தமிழ்`). Click 'Read Findings Aloud' to hear the voice assistant explain the regulatory risk in clear, spoken regional audio, complete with a fallback transcript."
4. **Demo Case 3 — Personalized Incident Response (45s)**:
   > "If an investor has already sent money, telling them 'it was a scam' is unhelpful. Click 'I already sent money'. NiveshShield activates the 1-2 hour Golden Hour protocol: 1-click dial to National Cyber Crime Helpline **1930**, dispute procedures with banks, and evidence preservation guidelines."
