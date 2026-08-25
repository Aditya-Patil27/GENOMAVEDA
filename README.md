# GenomaVeda 🧬

**Pharmacogenomics Clinical Decision-Support Platform**

GenomaVeda analyzes a patient's genomic profile against **CPIC (Clinical Pharmacogenetics Implementation Consortium) guideline data** to flag adverse drug-reaction risks *before* a drug is prescribed — turning raw genotype data into clear, evidence-backed dosing guidance.

## How It Works

```
Genomic data ──► Rule Engine ──► Risk Report
 (upload)         │                │
                  │                ├─ Interactive D3/Recharts visualizations
   CPIC drug–gene knowledge base   ├─ Confidence gauge + evidence explorer
   (diplotypes, allele freqs,      ├─ AI-generated plain-language explanation
    drug–gene rules, therapeutic   ├─ FHIR bundle export (EHR-ready)
    classes)                       └─ PDF report
```

1. **Upload** — patient genomic data via drag-and-drop
2. **Select drug** — choose the medication under consideration
3. **Analyze** — a deterministic rule engine matches the patient's diplotypes against CPIC drug–gene interaction rules and allele-frequency data
4. **Report** — interactive risk report with confidence scoring, CPIC evidence drill-down, population heatmaps, and safer-alternative simulation

## Key Features

- 🧪 **CPIC rule engine** — diplotype → phenotype → drug-risk mapping backed by curated guideline data (`cpic-diplotypes`, `allele-frequencies`, `drug-gene-rules`, `therapeutic-classes`)
- 📊 **Interactive reports** — D3.js + Recharts: confidence gauges, interaction fingerprints, population allele-frequency heatmaps
- 🔄 **Drug Alternative Simulator** — compare risk profiles of therapeutic alternatives side by side
- 🏥 **FHIR export** — generates HL7 FHIR bundles for EHR interoperability, plus JSON and PDF export
- 🤖 **AI explanations** — Gemini/Groq-powered plain-language summaries of genomic findings, with a built-in chatbot
- 💊 **Medicine scanner** — identify pills via camera (react-webcam + vision model)
- 🗣️ **Voice interface & multilingual UI** — voice-driven symptom intake and language switching
- 🔒 **Privacy-first** — client-side processing where possible; sensitive fields are explicitly blocked from LLM prompts

## Engineering Highlights

- **Zod schema validation** at every API boundary (requests *and* LLM responses)
- **Hardened API routes** — per-IP rate limiting, 8KB request-size caps, strict content-type checks, explicit CORS policy
- **Jest test suite** with coverage reporting
- **CI pipeline** (GitHub Actions) — dependency security audit (`npm audit --audit-level=high`), ESLint, and strict TypeScript type-checking on every push
- **Dockerized** for reproducible deployment

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js (App Router), React 18, TypeScript, Framer Motion |
| Visualization | D3.js, Recharts |
| Validation | Zod |
| AI | Google Gemini, Groq |
| Data | CPIC guideline datasets (diplotypes, allele frequencies, drug–gene rules) |
| Interop | HL7 FHIR |
| Quality | Jest, ESLint, GitHub Actions CI, Docker |

## Quick Start

```bash
cd frontend
npm install
cp .env.example .env   # add your GEMINI / GROQ API keys
npm run dev            # http://localhost:3000
```

Run tests and checks:

```bash
npm test               # Jest suite
npm run type-check     # strict TypeScript
npm run lint           # ESLint
```

Or with Docker:

```bash
docker build -t genomaveda .
docker run -p 3000:3000 genomaveda
```

## Disclaimer

GenomaVeda is a research/educational project. It is **not** a certified medical device and must not be used as a substitute for professional clinical judgment.

---

Built by [Aditya Patil](https://github.com/Aditya-Patil27)
