# PharmaGuard: Precision Medicine Algorithm 🧬💊

**RIFT 2026 HACKATHON — Pharmacogenomics / Explainable AI Track**
> An AI-powered pharmacogenomic risk prediction system that parses raw genomic data (VCF) to prevent adverse drug reactions.

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Built%20With-Next.js-black)](https://nextjs.org)
[![Privacy](https://img.shields.io/badge/Privacy-Differential%20Privacy%20%CE%B5%3D1.0-blue)](https://privacy.com)

---

## 🚀 Live Demo & Video
- **Live Application**: [INSERT_DEPLOYED_URL_HERE]
- **Demo Video (LinkedIn)**: [INSERT_LINKEDIN_VIDEO_LINK_HERE]

---

## 📖 Problem Overview
Adverse drug reactions (ADRs) kill over 100,000 Americans annually. PharmaGuard solves this by bridging the gap between raw genetic data and clinical decision-making.

**Core Features:**
1.  **VCF Parsing**: Extracts variants for 6 critical genes (CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD) locally in the browser.
2.  **Risk Prediction**: "Honest Confidence" scoring system combining VCF quality (GQ/DP), diplotype certainty, and CPIC guideline alignment.
3.  **Explainable AI**: LLM-generated clinical explanations with strict PHI exclusion (Privacy Layer 2).
4.  **Offline Core**: "Bulletproof" fallback engine ensures functionality even without external APIs.

---

## 🏗️ Architecture
PharmaGuard employs a **Privacy-First Hybrid Architecture**:

1.  **Client-Side Processing (Layer 1)**: VCF parsing happens entirely in the browser. Raw genomic data **NEVER** leaves the user's device.
2.  **Privacy Gateway (Layer 2-3)**:
    -   **Pseudonymization**: Patient IDs are hashed (`SESSION-XXX`) using SHA-256 (Web Crypto API).
    -   **Prompt Sanitization**: Only phenotype labels (e.g., "CYP2D6 *4/*4") are sent to the LLM. No RSIDs or raw variants.
3.  **Risk Engine (Layer 4)**:
    -   **Offline Dictionary**: Hardcoded, validated rules for 6 core drugs (Codeine, Warfarin, etc.).
    -   **CPIC API**: Dynamic fallback for updated guidelines.
4.  **Confidence Scorer**: A weighted mathematical model calculating "Honest Confidence" based on read depth and evidence quality.

---

## 🛠️ Tech Stack
-   **Frontend**: Next.js 14 (App Router), React, TailwindCSS, Lucide Icons.
-   **Visualization**: D3.js (Force-Directed Graph), Framer Motion.
-   **AI/LLM**: Groq (Llama-3 70B) / Gemini Flash 2.0.
-   **Genomics**: Custom VCF Parser (TypeScript), CPIC API Integration.
-   **Security**: Web Crypto API (SHA-256), Differential Privacy logic.

---

## ⚡ Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/pharmaguard.git
    cd pharmaguard
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```
    *Note: If you encounter downstream dependency errors with `npm`, try using `npm install --legacy-peer-deps` or `yarn`.*

3.  **Configure Environment**:
    Copy `.env.example` to `.env.local` and add your API keys:
    ```bash
    cp .env.example .env.local
    ```
    *Required keys: `GROQ_API_KEY` or `GEMINI_API_KEY`.*

4.  **Run Development Server**:
    ```bash
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
  "clinical_recommendation": {
    "primary_recommendation": "Initiate with lower dose...",
    "dose_adjustment": "Decrease dose by 50%",
    "recommendation_strength": "strong"
  },
  "llm_generated_explanation": {
    "summary": "Patient is a Poor Metabolizer...",
    "disclaimer": "AI suggestion only."
  },
  "quality_metrics": {
    "vcf_parsing_success": true,
    "variants_detected": 12,
    "annotation_completeness": 1.0
  }
}
```

---

## 🧪 Usage Examples
### 1. Analyzing a Patient
1.  Navigate to the **Dashboard**.
2.  Upload a VCF file (Sample files provided in `/public/data`).
3.  Select a drug (e.g., **Codeine**) from the dropdown.
4.  View the **Risk Assessment** card and **Interaction Graph**.

### 2. Exporting Reports
-   Click the **JSON** button to download the machine-readable report.
-   Click **PDF Report** for a clinician-friendly summary.

---

## 👥 Team
-   **[Your Name/Team Name]** - Lead Developer & Architect

---

*Verified for RIFT 2026 Submission Compliance.* ✅
