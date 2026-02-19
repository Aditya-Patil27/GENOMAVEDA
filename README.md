# PharmaGuard — Pharmacogenomic Risk Prediction System

> AI-powered pharmacogenomics analysis: preventing adverse drug reactions through precision medicine.

## 🔗 Links
- **Live Demo:** [https://pharmaguard.vercel.app](https://pharmaguard.vercel.app)
- **Demo Video:** [LinkedIn Post Link Here]
- **GitHub:** [https://github.com/yourusername/pharmaguard](https://github.com/yourusername/pharmaguard)

## 🏆 RIFT 2026 Hackathon — Pharmacogenomics / Explainable AI Track

## Problem Statement
Adverse drug reactions kill over 100,000 Americans annually. Many are preventable through pharmacogenomic testing. PharmaGuard makes this testing accessible, explainable, and actionable — all while keeping genomic data private through client-side processing.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Browser (Client)                    │
│  • VCF parsing (genomic data never leaves browser)  │
│  • CPIC diplotype → phenotype resolution            │
│  • Drug-gene risk assessment                        │
│  • Drag-drop upload + color-coded results           │
└──────────────┬──────────────────────────────────────┘
               │ POST /api/analyze (phenotype only)
               ▼
┌─────────────────────────────────────────────────────┐
│              Next.js API Route                       │
│  • Receives phenotype string ONLY (no genomic data) │
│  • Groq/Gemini LLM → clinical explanation           │
│  • Dual Zod validation (request + response)         │
│  • Demo mode fallback (zero network dependency)     │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│           Static CPIC Knowledge Base (JSON)          │
│  • Diplotype → Phenotype mappings (6 genes)         │
│  • Drug-Gene risk rules (6 drugs)                   │
│  • CPIC recommendation tiers                        │
└─────────────────────────────────────────────────────┘
```

**Privacy Boundary:** VCF parsing, variant extraction, and CPIC risk resolution all happen client-side. The backend receives only phenotype strings — never genomic data.

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS | App Router monorepo |
| File Upload | react-dropzone | Drag-drop VCF with validation |
| Schema Validation | Zod | Exact PS JSON schema enforcement |
| LLM (Primary) | Groq (llama-3.3-70b-versatile) | Clinical explanation — free tier |
| LLM (Fallback) | Google Gemini (gemini-2.0-flash) | Fallback — free tier |
| Animations | Framer Motion + CSS | Premium biotech UI |
| Icons | Lucide React | DNA, shield, flask iconography |
| Deployment | Vercel | One-click serverless |

## Supported Genes
CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD

## Supported Drugs
CODEINE, WARFARIN, CLOPIDOGREL, SIMVASTATIN, AZATHIOPRINE, FLUOROURACIL

## Installation

```bash
git clone https://github.com/yourusername/pharmaguard
cd pharmaguard
npm install
cp .env.example .env.local
# Add your API keys to .env.local (or keep DEMO_MODE=true)
npm run dev
```

## Environment Variables

```
LLM_PROVIDER=groq          # "groq" or "gemini"
GROQ_API_KEY=your_key       # https://console.groq.com — free
GEMINI_API_KEY=your_key     # https://aistudio.google.com/apikey — free
DEMO_MODE=false             # Set true for zero-risk demo
```

## API Documentation

### POST /api/analyze

**Request:** `application/json`
```json
{
  "patient_id": "PATIENT_ABC12345",
  "drug": "CODEINE",
  "primary_gene": "CYP2D6",
  "phenotype": "PM",
  "diplotype": "*4/*4",
  "confidence_score": 0.92,
  "severity": "moderate",
  "risk_label": "Ineffective"
}
```

**Response:** Full `AnalysisResult` JSON matching PharmaGuard schema with risk assessment, pharmacogenomic profile, clinical recommendation, LLM explanation, and quality metrics.

**Error Codes:**
- `400` — Invalid request (Zod validation failed, blocked genomic fields, wrong content type)
- `500` — Internal schema validation failure (should never happen)

## Usage Examples
1. Upload a VCF file using drag-and-drop
2. Select one or more drugs from the pill selector
3. Click "Analyze" to run pharmacogenomic assessment
4. View color-coded risk cards with expandable clinical details
5. Download the JSON result or copy to clipboard

## Sample VCF Files
Located in `/public/sample-vcf/`:
- `patient_001.vcf` — CYP2C19 Intermediate Metabolizer (clopidogrel risk)
- `patient_002.vcf` — TPMT Poor Metabolizer (azathioprine → Toxic)
- `patient_003.vcf` — CYP2D6 Poor Metabolizer (codeine → Ineffective)

## Team Members
- Team Antigravity — RIFT 2026

## Disclaimer
PharmaGuard is for educational and research purposes only. It does not constitute medical advice. All clinical decisions must be made by qualified healthcare providers.
