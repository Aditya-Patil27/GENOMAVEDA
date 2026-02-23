# GENOMAVEDA: Precision Medicine Algorithm 🧬💊

**RIFT 2026 HACKATHON — Pharmacogenomics / Explainable AI Track**

> An AI-powered pharmacogenomic risk prediction system that parses raw genomic data (VCF) to prevent adverse drug reactions.

---

## 🚀 Live Demo & Video

- **Live Application**: [https://genomaveda.vercel.app/](https://genomaveda.vercel.app/)
- **Demo Video (LinkedIn)**: [INSERT_LINKEDIN_VIDEO_LINK_HERE]

> **Note:** Video includes hashtags **#RIFT2026 #PharmaGuard #Pharmacogenomics #AIinHealthcare** as per requirements.

---

## 📖 Problem Overview

Adverse drug reactions (ADRs) kill over 100,000 Americans annually. Many of these deaths are preventable through pharmacogenomic testing—analyzing how genetic variants affect drug metabolism. PharmaGuard solves this by bridging the gap between raw genetic data and clinical decision-making through local, privacy-preserving processing.

### Core Features:

1. **VCF Parsing**: Extracts variants for 6 critical genes (CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD) locally in the browser.
2. **Risk Prediction**: "Honest Confidence" scoring system combining VCF quality (GQ/DP), diplotype certainty, and CPIC guideline alignment.
3. **Explainable AI**: LLM-generated clinical explanations with strict PHI exclusion (Privacy Layer 2).
4. **Offline Core**: "Bulletproof" fallback engine ensures functionality even without external APIs.

---

## 🏗️ Architecture

PharmaGuard employs a **Privacy-First Hybrid Architecture**:

1. **Client-Side Processing (Layer 1)**: VCF parsing happens entirely in the browser; raw genomic data **NEVER** leaves the user's device.
2. **Privacy Gateway (Layer 2-3)**:
   - **Pseudonymization**: Patient IDs are hashed (`SESSION-XXX`) using SHA-256 (Web Crypto API).
   - **Prompt Sanitization**: Only phenotype labels (e.g., "CYP2D6 \*4/\*4") are sent to the LLM. No RSIDs or raw variants are transmitted.
3. **Risk Engine (Layer 4)**:
   - **Offline Dictionary**: Hardcoded, validated rules for core drugs like Codeine and Warfarin.
   - **CPIC API**: Dynamic fallback for updated guidelines.
   - **Confidence Scorer**: A weighted mathematical model applying Differential Privacy (Laplace mechanism, ε=1.0) to confidence scores.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS, Lucide Icons.
- **Visualization**: D3.js (Interaction Fingerprint Graph), Framer Motion.
- **AI/LLM**: Groq (Llama-3 70B) / Gemini Flash 2.0.
- **Genomics**: Custom TypeScript VCF Parser, gnomAD Population Frequency Integration.
- **Security**: Web Crypto API (SHA-256), Differential Privacy logic.

---

## ⚡ Installation & Setup

### Prerequisites

- Node.js 18.x or higher
- API Keys for Groq or Google Gemini

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Aditya-Patil27/pharmaguard.git
   cd pharmaguard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   > *Note: Use `npm install --legacy-peer-deps` if you encounter version conflicts.*

3. **Configure Environment**:
   Create a `.env.local` file and add your keys:
   ```bash
   cp .env.example .env.local
   ```
   > *Required keys: `GROQ_API_KEY` or `GEMINI_API_KEY`.*

4. **Run Development Server**:
   ```bash
   cd frontend
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## 📚 API Documentation (Output Schema)

PharmaGuard generates JSON exports strictly adhering to the **RIFT 2026 Schema**.

### Sample Output (`output.json`)

```json
{
  "patient_id": "SESSION-A1B2C3D4",
  "drug": "WARFARIN",
  "timestamp": "2026-02-20T12:00:00Z",
  "risk_assessment": {
    "risk_label": "Adjust Dosage",
    "confidence_score": 0.98,
    "severity": "high"
  },
  "pharmacogenomic_profile": {
    "primary_gene": "CYP2C9",
    "diplotype": "*3/*3",
    "phenotype": "PM",
    "detected_variants": [
      {
        "rsid": "rs1057910",
        "gene": "CYP2C9",
        "clinical_significance": "Pathogenic"
      }
    ]
  },
  "quality_metrics": {
    "vcf_parsing_success": true,
    "privacy_audit": {
      "raw_vcf_retained_on_server": false,
      "variants_processed_locally": true,
      "differential_privacy_applied": true
    }
  }
}
```

---

## 🧪 Submission Highlights & Innovation

- **Zero-Persistence Mode**: Real-time Privacy Shield UI that tracks data location and auto-clears browser memory.
- **Drug Alternative Simulator**: Interactive clinical support that ranks safer drug alternatives in real-time.
- **gnomAD Context**: Contextualizes variants with population frequency data for deeper clinical insight.
- **Interaction Fingerprint**: A D3-powered network graph showing metabolic pathway sharing specific to the patient's genotype.

---

## 👥 Team: THE INTERCEPTORS

- **ADITYA PATIL** — Backend Lead & Team Leader
- **SURAJ SAHARE** — Solution Architect
- **NISHIDA DATKAR** — Frontend Lead
- **SWARA PHIRKE** — Frontend Lead
