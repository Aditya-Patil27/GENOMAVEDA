⬡

**PHARMAGUARD**

**UI DESIGN IDEATION & IMPLEMENTATION PROMPT**

_For Antigravity · RIFT 2026 · Pharmacogenomics / XAI Track_

| THE CONCEPT:"A Genomic Situation Room."Not a dashboard. Not a report. An immersive, cinematic command centre where your genome meets clinical intelligence — built dark, built fast, built to terrify every other team's UI. |
| --- |
| 3ConceptsIdeas | 5PagesSpecified | 40+ComponentsDetailed | ∞ImpactPotential |
| --- | --- | --- | --- |
| SECTION 01THE BIG IDEAWhy this UI will make every other team look like they used a template |
| --- |

## The Problem With Every Other Team's UI

Every competing team is building the same thing: a white card, a coloured badge, some JSON below it. Clean. Functional. Forgettable. Judges have seen 40 of these. They stop reading at card three.

PharmaGuard is solving a life-and-death problem — 100,000 preventable deaths annually. The UI should feel like that weight. It should feel like a cockpit, not a form. Like a situation room, not a report. Like the screen a doctor stares at before making a call that saves someone's life.

## The Core Concept: Genomic Situation Room

The UI is built around one overriding metaphor: you are inside the command centre of a precision medicine intelligence system. Everything is dark, lit from within by data. Colours only appear when they mean something — a red glow means danger, a green pulse means clearance. The genome is not a file you upload. It is the intelligence that the entire system orbits.

| ⚡ | THE ONE THING JUDGES WILL REMEMBERDuring the demo, when the Toxic result card appears for CODEINE and a deep red ambient glow pulses outward from the card, filling the background — that is the moment. That single visual event communicates the stakes of pharmacogenomics better than any explanation ever could. |
| --- | --- |
| SECTION 02THREE CONCEPT DIRECTIONSChoose one and execute it with total commitment. No mixing. |
| --- |

Three distinct UI directions are presented. Each is fully buildable within your Next.js + Tailwind + Framer Motion stack. Pick one. The worst outcome is blending two — that produces mediocrity. The best outcome is extreme commitment to a single direction.

| CONCEPT ABIOPUNK TERMINAL — Recommended — Highest ImpactDark navy-black base. Electric cyan + deep violet as the only accent colours. Monospace typography everywhere data appears. Horizontal scanline texture on cards. Thin neon border glow on active elements. Every animation is a data readout — bars fill, numbers count, gene pills ping. The UI looks like it was built inside a sequencing lab by engineers who hate decoration but worship data. This is the concept described in full detail throughout this document. |
| --- |
| CONCEPT BOBSIDIAN MEDICAL — Alternative — Most ProfessionalPure black base (#000000). Single accent: electric violet #8B5CF6. Zero other colours except risk-specific Red/Amber/Green which appear ONLY on risk elements. Typography is surgical: large, confident, generous whitespace. Cards have no borders — they float in void. Risk moments are the only colour events. Feels like a $50,000 clinical decision support system. More conservative than Concept A but devastatingly professional. |
| --- |
| CONCEPT CHOLOGRAPHIC MEDICAL — Advanced — Highest Risk, Highest RewardTransparent glass-morphism cards that appear to float over a slow-moving particle field of DNA base pairs. Cards have rainbow-edge diffraction borders (CSS gradient borders). Content appears to sit inside glass. Ambient glow changes colour with risk status — the entire page background shifts from deep blue (Safe) to deep red (Toxic). This concept requires the most implementation effort but produces something that looks impossible to build in a hackathon. |
| --- |
| ★ | RECOMMENDATIONExecute Concept A (Biopunk Terminal). It has the best effort-to-impact ratio and is the most implementable in your remaining time. The full prompt in this document is written for Concept A. Concepts B and C are described for reference. |
| --- | --- |
| SECTION 03DESIGN TOKENSEvery colour, font, shadow, and animation value — exact |
| --- |

## Colour System

Two accent colours. Two states. Risk colours appear only on risk elements — nowhere else. This is the rule that makes the UI feel intentional.

| Token | Value / Rule | Usage |
| --- | --- | --- |
| --bg-void | #040810 | Page background |
| --bg-card | #080E1C | All card surfaces |
| --bg-card-elevated | #0C1528 | Modals, dropdowns, tooltips |
| --border-default | #1A2744 | All card borders |
| --border-glow | #00D4FF26 | Glowing border (10% cyan) |
| --cyan | #00D4FF | Primary accent — interactive |
| --violet | #7B2FFF | Secondary — AI / LLM sections |
| --risk-safe | #00FF88 | Safe ONLY |
| --risk-adjust | #FFB800 | Adjust Dosage ONLY |
| --risk-toxic | #FF2D55 | Toxic / Critical ONLY |
| --risk-ineffective | #FF6B2B | Ineffective ONLY |
| --risk-unknown | #475569 | Unknown ONLY |
| --text-primary | #F0F6FF | Headings, values |
| --text-secondary | #94A3B8 | Body, descriptions |
| --text-muted | #334155 | Labels, hints |
| --text-genomic | #A5B4FC | ALL genomic data (rsIDs, etc) |
| --text-code | #A8FF78 | Code, prompts, terminals |

## Typography

Two fonts only. Syne for display headings (sharp, geometric, futuristic). JetBrains Mono for all genomic data, code, and values. Never use Inter, Roboto, or system fonts — they will make the UI look generic immediately.

| Token | Value / Rule | Usage |
| --- | --- | --- |
| font-display | Syne (Google Fonts — Bold 700/800) | Page titles, drug names, risk labels |
| font-body | Syne (400/500 weight) | All body text and descriptions |
| font-genomic | JetBrains Mono (400/700) | ALL rsIDs, diplotypes, gene names in data context, code blocks |
| text-display | 56px / bold / tracking -0.02em | Hero H1 only |
| text-h1 | 36px / bold / tracking -0.01em | Page headings |
| text-h2 | 24px / semibold | Section headings |
| text-h3 | 11px / bold / uppercase / ls 0.15em | Category labels |
| text-body | 14px / regular / leading 1.7 | All paragraph text |
| text-mono | 13px / JetBrains Mono | All genomic values |
| text-label | 10px / bold / uppercase / ls 0.2em | All data field labels |

## Shadows & Glows

| Token | Value / Rule | Usage |
| --- | --- | --- |
| shadow-card | 0 0 0 1px rgba(255,255,255,0.04) | Default card boundary |
| shadow-card-hover | 0 0 40px rgba(0,212,255,0.07), 0 0 0 1px #1A2744 | Card hover state |
| shadow-toxic | 0 0 60px rgba(255,45,85,0.18), 0 0 0 1px #FF2D5540 | Toxic card glow |
| shadow-safe | 0 0 40px rgba(0,255,136,0.10), 0 0 0 1px #00FF8830 | Safe card glow |
| shadow-adjust | 0 0 40px rgba(255,184,0,0.10), 0 0 0 1px #FFB80030 | Adjust card glow |
| shadow-button | 0 0 30px rgba(0,212,255,0.25), 0 4px 16px rgba(0,0,0,0.4) | CTA button |
| shadow-badge | 0 0 16px currentColor at 30% | Risk badge inner glow |

## Animation Spec (Framer Motion)

| Token | Value / Rule | Usage |
| --- | --- | --- |
| anim-page | initial:{opacity:0,y:20} animate:{opacity:1,y:0} duration:0.4s ease:easeOut | Every page mount |
| anim-card | initial:{opacity:0,y:24,scale:0.97} stagger:0.06s | Card grids |
| anim-scanner | CSS: scan line top→bottom, 2s loop, rgba(0,212,255,0.06) | VCF parsing state |
| anim-pulse-toxic | scale 1→1.08→1, opacity 1→0, 2.5s infinite on outer ring | Toxic badge only |
| anim-count | 0 → value over 1.4s easeOut — useMotionValue + useSpring | All numeric values |
| anim-gene-ping | stagger 180ms left→right, opacity 0.15→1 + color swap | Gene detection |
| anim-ambient | background glow opacity 0→0.4, 800ms easeInOut | Risk result reveal |
| anim-accordion | height 0→auto, spring stiffness:300 damping:30 | All accordions |
| anim-flicker | opacity 1→0.85→1, 80ms, 3 times on load | Terminal text intro |
| SECTION 04PAGE-BY-PAGE PROMPTComplete implementation spec for every route and component |
| --- |
| /layout.tsx | GLOBAL SHELL . Persistent across all pages |
| --- | --- |

## Background — The Void

The page background is not a flat colour. It is a layered atmospheric environment:

*   Layer 1 (base): #040810 — absolute near-black navy
*   Layer 2: radial gradient, rgba(0,212,255,0.025) centred at 20% 80%, radius 60% — a barely-visible cyan atmospheric glow in the bottom-left corner
*   Layer 3: radial gradient, rgba(123,47,255,0.02) centred at 80% 20%, radius 50% — violet in top-right
*   Layer 4: CSS grid pattern — 1px lines every 48px, rgba(255,255,255,0.015), with mask-image gradient that fades to transparent at edges

Combined effect: the page feels like deep space with a faint grid structure — alive but not distracting.

## Header (height: 64px, fixed, z-50)

Background: rgba(4,8,16,0.85) backdrop-blur-xl border-b border-\[#1A2744\]

### Left: Logo + Wordmark

*   Custom hexagon SVG (6-sided, outline only, 28px, stroke #00D4FF, stroke-width 1.5)
*   Inside hexagon: small DNA double-helix path in cyan (SVG, 12px)
*   Right of hexagon: 'PharmaGuard' in Syne Bold, 18px, #F0F6FF
*   Below wordmark: 'Pharmacogenomic Intelligence' — 9px, uppercase, letter-spacing 0.2em, #334155

### Center: ProgressIndicator.tsx

*   3 nodes connected by thin lines
*   COMPLETED node: filled cyan circle, white check icon inside, label text-cyan-400
*   ACTIVE node: cyan ring (border-2 border-cyan-500), inner fill cyan-500/20, node number in white, label text-cyan-400 animate-pulse
*   INACTIVE node: border border-slate-700 bg-slate-900, label text-slate-600
*   Connector: completed→active: bg-gradient-to-r from-cyan-500 to-cyan-500/40; inactive: bg-slate-800

### Right: Privacy Shield (compact)

*   Single line: shield icon + 'VCF: Local Only' in 10px font-mono
*   bg-emerald-500/8 border border-emerald-500/15 rounded-full px-3 py-1
*   On hover: drops down a glass card showing full privacy status (4 rows)
*   If Toxic result active: changes to amber warning glow

## Custom Cursor

Replace the default cursor with a custom crosshair: a 20px circle, stroke #00D4FF at 40% opacity, with a 3px centre dot in solid cyan. On hover over interactive elements, the circle expands to 32px with a faster transition. This single detail signals premium quality immediately.

| // globals.css — custom cursor* { cursor: none; }// CustomCursor.tsx — mounted in layout// Track mouse position with useMotionValue// Render: outer ring (circle, 20px, stroke cyan/40)// inner dot (3px, fill cyan)// On interactive hover: scale outer ring to 1.6x// Lag factor: outer ring follows with spring delay// inner dot follows instantly |
| --- |
| / (home) | LANDING PAGE . Cinematic hero — judges' first impression |
| --- | --- |

## Hero Section (full viewport height)

This is not a standard hero section. It is a cinematic opening sequence. Everything animates in on load with military precision.

### Animated Background — The Genome Visualiser

Behind the hero text, render a subtle animated visualization: slowly moving vertical strings of genomic data — A, T, C, G characters in different opacities (0.03 to 0.08) scrolling upward at different speeds. Characters are in JetBrains Mono, 11px. The motion is slow — 60 seconds per full cycle. Combined with the grid overlay, this creates the impression that data is always flowing through the system.

| // GenomeBackground.tsx// 24 columns of ATCG strings// Each column: random start offset, random speed (40-80s)// Characters: text-cyan-500/5 to text-violet-500/5// CSS animation: translateY(0) → translateY(-100%)// position:absolute, pointer-events:none, z-index:0// Fade mask: mask-image: linear-gradient(to bottom,// transparent 0%, black 20%,// black 80%, transparent 100%) |
| --- |

### Hero Content (z-10, relative, centered)

*   Eyebrow: 'RIFT 2026 · PHARMACOGENOMICS / XAI · HEALTHTECH TRACK' — 10px, uppercase, letter-spacing 0.25em, #00D4FF, with pulsing cyan dot prefix
*   H1 Line 1: '100,000 preventable deaths.' — Syne Bold, 52px, #F0F6FF
*   H1 Line 2: 'Your genome knows the reason.' — Syne Bold, 52px, #00D4FF
*   Both lines animate: opacity 0→1, y 30→0, stagger 0.2s
*   Sub: 'PharmaGuard analyzes your VCF file against 6 genes and CPIC guidelines — entirely inside your browser. Your DNA never leaves this tab.' — 16px, #94A3B8, max-w-xl, mt-6

### CTA Row

*   Primary: 'Analyze Your Genome' — bg-cyan-500 hover:bg-cyan-400, rounded-xl, h-14, px-10, Syne bold 15px, with right arrow icon that slides on hover. Shadow: 0 0 40px rgba(0,212,255,0.3)
*   Secondary: 'Watch Demo ▷' — border border-slate-700 text-slate-300, same height, hover: border-slate-500

## Scrolling Stats Band

Below the hero, full-width horizontal band with 3 live-counting stats separated by vertical dividers. Numbers count up on scroll-into-view using Framer Motion's useInView.

*   '6 Target Genes' with gene names listed below in cyan mono text
*   '6 Drug Classes' with drug names in small chips
*   '100% Client-Side' with 'Zero PHI Transmitted' in emerald

## Feature Hexagon Grid

6 feature cards arranged in a honeycomb/hexagonal CSS grid pattern. Each card is a hexagonal shape (clip-path: polygon). On hover, the hex expands slightly and its border colour brightens. This layout is unlike any standard grid and will be remembered.

*   Card 1 (cyan): Privacy-First Genomics — ShieldCheck icon
*   Card 2 (violet): Dual LLM Engine — Brain icon
*   Card 3 (emerald): CPIC Guidelines — FlaskConical icon
*   Card 4 (amber): Explainable AI — Eye icon
*   Card 5 (teal): FHIR R4 Export — FileText icon
*   Card 6 (indigo): Differential Privacy — Lock icon

## Bottom: Gene × Drug Matrix

A 6×7 interactive grid (6 genes, 6 drugs + header). Each cell is coloured by the clinical risk tendency of that gene-drug pair. Hover over any cell: tooltip explains the pharmacogenomic relationship. This is the most technically impressive static element on the landing page.

| /upload | VCF UPLOAD . The genomic scanner experience |
| --- | --- |

## Layout

Two columns: 55% left (upload interface), 45% right (sticky context panel). Max-width 1200px, centred.

## Dropzone.tsx — The Genomic Scanner

The dropzone is not a rectangle with a dashed border. It is a scanner chamber.

### Default State

*   Container: w-full h-80 rounded-3xl overflow-hidden relative
*   Background: radial gradient from rgba(0,212,255,0.04) centre to transparent edge
*   Border: 1px dashed #1A2744 with a subtle box-shadow: 0 0 0 1px rgba(0,212,255,0.05) inset
*   Corner decorators: 4 small L-shaped brackets in the corners (pure CSS, 16px each, colour #00D4FF at 40% opacity) — like a camera viewfinder
*   Centre: large custom SVG — a simplified double helix rendered as two sine curves with connecting rungs, 80px tall, colour #1A2744, very subtle
*   Text: 'Drop your .vcf genome file here' — Syne 18px text-slate-300
*   Subtext row: 'VCF v4.2' + '5MB max' + 'Local processing only' — three chips, bg-slate-800/60, text-slate-500, font-mono text-xs, rounded-full

### Drag-Over State

*   Border becomes: border-cyan-500/60, glow: 0 0 40px rgba(0,212,255,0.12)
*   Corner brackets animate to cyan full-opacity
*   Centre helix SVG: colour changes to cyan-400, slow rotation animation
*   Scanline appears: horizontal cyan line, 1px, opacity 0.3, animates top-to-bottom 1s loop
*   Text: 'Release to begin genomic analysis' — text-cyan-400

### Parsing State — The Scanner

*   Full dropzone gets scanline animation: cyan line sweeps top to bottom repeatedly
*   Background: subtle pulsing radial glow from centre
*   Top-left: filename + filesize in font-mono text-cyan-300
*   Bottom: animated progress bar — track: bg-slate-800, fill: gradient cyan→violet, height: 2px (thin and precise)
*   Below bar: monospace text cycles through parsing stages with typewriter effect:

| → Decompressing VCF header...→ Identifying INFO fields: GENE, STAR, RS...→ Filtering target genes: CYP2D6, CYP2C19...→ Extracting diplotype candidates...→ Resolving via cpic-diplotypes.json...✓ Complete — 47 variants across 5 genes detected |
| --- |

### Error State

*   Border: border-red-500/40, glow: shadow-toxic
*   Corner brackets pulse red
*   Icon: AlertTriangle in red-400
*   Error message specific to the failure mode (wrong format / too large / missing INFO tags)

## Gene Detection Strip

6 gene pills in a horizontal row below the dropzone. They start dim and illuminate one-by-one as the parser detects each gene:

*   Undetected: bg-slate-900 border-slate-800 text-slate-600 font-mono
*   Detected (animate in): bg-cyan-500/10 border-cyan-500/30 text-cyan-400, scale 0.95→1, opacity 0→1, preceding genes already lit
*   Detection ping: small ripple ring expands outward from each pill as it lights up

## Right Panel — Context & Tools

### Parse Stats (3 mini cards)

*   'Variants Found' / 'Genes Detected' / 'Parse Time (ms)'
*   Values use count-up animation via Framer Motion useSpring
*   Each card: bg-\[#080E1C\] border border-\[#1A2744\] rounded-2xl

### SyntheticVcfGenerator.tsx — Redesigned

*   Title: 'Need Test Data?' with flask icon
*   Card style: subtle dashed border to indicate it is a utility/helper, not primary content
*   Gene + Phenotype dropdowns: styled dark selects with cyan focus ring
*   Generate button: outlined cyan, not filled — secondary priority
*   On generate: brief animation mimics the scanner, then immediate download

### Privacy Assurance Card

*   Border: border-emerald-500/20 bg-emerald-500/4
*   4 status rows with animated check icons that draw in on load
*   Auto-clear countdown if VCF loaded: 'Session clears in 14:47' — monospace, amber when under 5 minutes

| /select-drug | DRUG SELECTION . The targeting interface |
| --- | --- |

## Layout: 38% / 62% split

## Left Panel — Genomic Intelligence Card

This is the patient's genomic fingerprint, rendered as a premium card. It should feel like a medical record display from 2040.

*   Header: 'Genomic Profile Active' with a pulsing green dot
*   VCF filename and variant count in font-mono

### Gene Profile Table

*   For each of the 6 genes — one row:
*   Col 1: gene symbol in font-mono text-cyan-300 (e.g. CYP2D6)
*   Col 2: diplotype in font-mono text-indigo-200 (e.g. \*1/\*4) — or '—' if not detected
*   Col 3: phenotype badge — PM (red), IM (amber), NM (green), RM/URM (blue), Unknown (slate)
*   Undetected rows: full row in text-slate-700, diplotype shows '—'
*   Row border: 1px dashed #1A2744 between rows

## Right Panel — Drug Selector

### DrugSelector.tsx — Drug Cards (2×3 grid)

Each card is a tactical selection element. It shows the drug, the gene it targets, and a personalised phenotype match for THIS patient.

*   DEFAULT: bg-\[#080E1C\] border border-\[#1A2744\] rounded-2xl p-5 h-44
*   Hover: border-\[#1A2744\] → border-cyan-500/30, subtle cyan background bleed from bottom edge
*   Top row: drug name (Syne bold, 20px, white) + empty circle checkbox (top-right)
*   Middle: gene tag chip (font-mono, bg-indigo-500/10, text-indigo-300) + drug class chip
*   Bottom: PERSONALISED MATCH ROW (this is the key differentiator):
*   If gene detected: coloured dot + 'Your CYP2D6: \*1/\*4 → IM' in font-mono text-amber-400 text-xs
*   If gene not detected: 'Genotype not detected in VCF' in text-slate-600 text-xs
*   SELECTED STATE:
*   border-cyan-500/50 bg-cyan-500/5 ring-1 ring-cyan-500/20
*   Checkbox: filled cyan circle with white checkmark
*   Bottom-right corner: small cyan triangular fold (CSS clip-path) — like a page corner is turned

### Analyze Button

*   Full-width, h-14, mt-6, rounded-xl
*   ENABLED: bg-gradient-to-r from-cyan-600 to-violet-600, hover:from-cyan-500 hover:to-violet-500
*   Text: 'Analyze Pharmacogenomic Risk' with right arrow that slides 4px right on hover
*   Glow: shadow-button from design tokens
*   LOADING: spinner (cyan, 20px) + 'Running CPIC analysis...' + disabled pointer-events
*   DISABLED: bg-slate-800 text-slate-600 — flat, no glow

| /report | RESULTS REPORT . The Situation Room — the most important page |
| --- | --- |
| ★ | THIS PAGE IS YOUR DEMOJudges will spend 80% of their evaluation time on this page. Every pixel matters. Every animation must fire correctly. Rehearse the Toxic result card reveal minimum 5 times. |
| --- | --- |

## Ambient Risk Environment

The most cinematic feature of the entire UI. When results load, the page background transitions to reflect the highest severity result:

*   All Safe results: background adds a barely-visible emerald radial glow at bottom-left, radius 40%
*   Any Adjust result: background adds amber glow, slightly more visible
*   Any Toxic result: background adds a deep red radial glow at bottom-centre, opacity 0.35, radius 50% — this is dramatic and intentional
*   Transition: 800ms easeInOut — the entire page environment reacts to the clinical danger
*   The effect is subtle enough to feel atmospheric, strong enough to be noticed

## Report Header Bar

*   Left: 'Pharmacogenomic Risk Report' Syne bold 28px white
*   Below: Patient ID chip (font-mono, bg-slate-800, rounded-full) + timestamp in slate-500 text-xs
*   Right: 4 export buttons in a compact row — \[JSON\] \[Copy\] \[PDF\] \[FHIR R4\]
*   All buttons: h-9 text-xs rounded-lg border — respective accent colours

## Risk Summary Strip (full-width, scrollable horizontal)

One drug result pill per analyzed drug. Each pill is a compact summary:

*   Width: min-w-\[220px\], rounded-2xl, p-4
*   Background + border: risk colour at 8% and 25% opacity respectively
*   Toxic pills: outer pulse ring (border, risk color, scale 1→1.1→1, 2.5s infinite)
*   Content: drug name bold + risk badge + 'CYP2D6 · PM' in font-mono text-xs + 5 severity dots

## Main Layout: 63% / 37%

## LEFT — RiskDashboard.tsx — Drug Detail Cards

### Card Header

*   Drug name: Syne Bold, 22px, white
*   Risk badge: large pill, icon + text (see badge spec below)
*   Diplotype + Phenotype: font-mono text-slate-400 text-sm 'CYP2D6 · \*1/\*4 · Poor Metabolizer (PM)'
*   Right: ConfidenceGauge.tsx — semicircular SVG arc, 96px diameter
*   Arc track: stroke-\[#1A2744\]; Arc fill: stroke = risk colour; strokeDashoffset animation on mount
*   Centre: percentage in Syne Bold 20px; below: 'Confidence' in label style
*   Below gauge: 'DP Applied (ε=1.0)' in font-mono text-indigo-400 text-xs

### Risk Badge Spec

*   SAFE: bg-emerald-500/15 text-emerald-400 border-emerald-500/30 <CheckCircle/>
*   ADJUST: bg-amber-500/15 text-amber-400 border-amber-500/30 <AlertCircle/>
*   TOXIC: bg-rose-500/15 text-rose-400 border-rose-500/40 <AlertTriangle/> + pulse ring
*   INEFFECTIVE:bg-orange-500/15 text-orange-400 border-orange-500/30 <XCircle/>
*   UNKNOWN: bg-slate-700/50 text-slate-400 border-slate-700 <HelpCircle/>

### CPIC Recommendation Band

*   mt-4 p-4 rounded-xl bg-slate-800/30 border-l-4 (risk colour)
*   Pill icon + 'CPIC RECOMMENDATION' label (10px uppercase)
*   Recommendation text: 14px text-slate-200 leading-relaxed
*   Bottom chip row: 'Evidence: Strong' (emerald) + 'CPIC 2023' (cyan) + 'CPIC Tier 1A' (violet)

### Four Accordions

*   Divider: 1px dashed #1A2744 between each accordion
*   Trigger row: flex between label (bold, 13px) + chevron icon (rotates 90° when open)
*   Hover: background brightens rgba(255,255,255,0.02)
*   \[Genomic Profile\]: 3-col grid — Diplotype | Activity Score | Phenotype — all font-mono
*   \[Detected Variants\]: full table — rsID (cyan mono) | Star Allele (white mono) | Chr | Pos | gnomAD Frequency
*   Frequency badges: Rare <3% (red), Moderate 3-15% (amber), Common >15% (green)
*   Row hover: subtle row highlight
*   rsID hover: tooltip with variant name + star allele + population breakdown
*   \[LLM Clinical Explanation\]:
*   Disclaimer: amber banner 'AI-Generated · Educational Only · Not Clinical Diagnosis'
*   Model chip: 'Groq llama-3.3-70b' OR 'Gemini gemini-2.0-flash (fallback)' — violet chip
*   Explanation text with biological mechanism terms auto-bolded (scan for gene names / enzyme terms)
*   Source: CPIC citation in slate-500 italic
*   \[View AI Prompt\] — The Prompt Transparency Log:
*   Terminal-style block: bg-\[#030710\], border-t border-cyan-500/20 border-b border-cyan-500/20
*   Left border: 3px solid violet
*   Font-mono, text-xs, line-height 1.9
*   SYSTEM: label in slate-500, content in code green
*   USER: label in cyan-500, content in code green
*   Flicker animation on initial render (3 quick opacity pulses)
*   Below block: 'PHI EXCLUDED:' in red-400 uppercase + crossed-out list in slate-600 mono

## RIGHT — Sticky Side Panels

### ① ZeroLayerSentry.tsx

*   Header: AlertTriangle icon + 'Safety Alerts' + pulsing red dot if any critical
*   CRITICAL alerts: bg-rose-500/8 border-l-4 border-rose-500, icon AlertOctagon
*   WARNING: amber. POLYPHARMACY DDGI: special card with drug name chips
*   No alerts: 'All Clear' state in muted emerald

### ② GlassBoxPanel.tsx

*   Header: Eye icon + 'Explainable AI Audit Trail' — violet accent
*   Logic tree rendered as indented monospace text with connecting vertical lines
*   Each node has a coloured dot: cyan (parsed), indigo (variant), amber (diplotype), risk-colour (outcome)
*   CpicEvidenceExplorer.tsx: collapsible below the tree — shows CPIC guideline excerpt

### ③ DrugAlternativeSimulator.tsx

*   Only renders for Toxic / Adjust results
*   Header: Shuffle icon + 'Safer Alternatives for Your Genotype'
*   Ranked list: risk badge + drug name + one-line gene dependency reason
*   Footer note: 'Computed from cpic-diplotypes.json — not LLM output' in slate-600 italic mono

### ④ DrugHistoryTracker.tsx

*   Mini Recharts LineChart (h-\[90px\])
*   Axes: minimal, no grid lines — pure signal
*   Line: cyan, dots at each analysis, area fill cyan/10
*   Timeline items below: time + drug chip + risk badge

### ⑤ PrivacyShield.tsx — Expanded

*   Header: ShieldCheck icon + 'Privacy Audit' — emerald accent
*   5 status rows with animated checkmarks that draw in sequentially on mount
*   DP row: 'Confidence: DP Applied (ε=1.0, Laplace)' — font-mono text-indigo-400
*   Countdown timer: amber when under 5 minutes
*   'Clear All Data Now' — text-red-400 underline hover:text-red-300
*   On clear: all panels fade to cleared state with success message

## Full-Width Bottom — Interaction Fingerprint

*   Conditional: only renders when 2+ drugs analyzed
*   D3 force-directed graph on dark canvas
*   Drug nodes: larger (r=28), filled risk colour at 20%, stroke risk colour
*   Gene nodes: smaller (r=18), indigo/10 fill, indigo stroke, font-mono label
*   Edges: gray (standard), orange (elevated by patient phenotype), red (critical for patient)
*   Hover: highlight connected edges, dim others, show tooltip
*   Legend below: 3 edge colours explained

| /researcher | CLINICAL RESEARCHER MODE . The secret weapon — raw intelligence access |
| --- | --- |

This page exists in no other competing team's project. Frame it in the UI as an advanced mode — accessible but clearly marked as technical.

## Page Header

*   Badge: 'ADVANCED MODE' — bg-violet-500/15 text-violet-400 border-violet-500/30 rounded-full
*   Title: 'Clinical Researcher Dashboard' — Syne Bold
*   Body: 'Direct access to raw variant data, CPIC lookup tables, confidence computation, and AI prompt logs.'

## Horizontal Tab Bar

*   5 tabs: \[Raw VCF Data\] \[CPIC Lookup\] \[Confidence Breakdown\] \[Raw JSON\] \[Voice Log\]
*   Active tab: bottom border 2px cyan, text-cyan-400
*   Inactive: text-slate-500, hover text-slate-300
*   Tab bar: border-b border-\[#1A2744\]

## Tab 1 — Raw VCF Data

*   Full scrollable data table: all parsed variants from vcf-parser.ts
*   Columns: # | CHROM | POS | rsID | REF | ALT | GENE | STAR | Diplotype Candidate
*   All genomic values: font-mono text-indigo-300
*   Filter bar: input field to filter by gene name — live filter
*   'Export as CSV' button — outlined cyan, top-right of table

## Tab 2 — CPIC Lookup

*   Visual cpic-diplotypes.json browser
*   Gene selector tabs: \[CYP2D6\] \[CYP2C19\] \[CYP2C9\] \[SLCO1B1\] \[TPMT\] \[DPYD\]
*   Table: Diplotype → Activity Score → Phenotype → CPIC Recommendation
*   Patient's current diplotype row highlighted in cyan/10 with left border

## Tab 3 — Confidence Breakdown

*   Visual deconstruction of confidence-calculator.ts output
*   Horizontal bar chart per contributing factor
*   Shows: raw score vs privatized score with noise delta displayed
*   DP formula displayed in code block: 'score = Laplace(raw, b=sensitivity/ε)'

## Tab 4 — Raw JSON

*   Full Zod-validated JSON output — syntax highlighted
*   Key: text-cyan-300; String: text-emerald-300; Number: text-amber-300; Boolean: text-violet-300
*   Line numbers left gutter in slate-700
*   'Zod Schema Validated ✓' badge at top — emerald
*   Copy button top-right

## Tab 5 — Voice Symptom Log (VoiceSymptomLogger.tsx)

*   Large centered microphone button — pulsing red ring when recording
*   Live transcript area below: monospace, text appears as words are recognized
*   Parsed symptom chips appear below transcript
*   Sends to: /api/parse-symptom route

| SECTION 05UNIVERSAL COMPONENT RULESEvery component, every time, no exceptions |
| --- |

## Tooltips

All gene symbols, phenotype codes, rsIDs, diplotypes: hover shows a tooltip. Tooltip style: bg-\[#0D1525\] border border-\[#1A2744\] rounded-xl p-3 max-w-xs text-slate-300 text-xs, shadow-xl. 150ms hover delay, fade-in animation.

| // CYP2D6 tooltip content:CYP2D6 — Cytochrome P450 Family 2, Subfamily D, Member 6Metabolises: Codeine, Tramadol, Oxycodone, Tamoxifen~7% Europeans are Poor Metabolizers (*4/*4)// PM tooltip content:Poor Metabolizer (PM)Activity Score: 0Enzyme activity: absent or severely reducedClinical impact: drug accumulates / prodrug fails to activate |
| --- |

## Loading States

*   Skeleton screens: shimmer animation using gradient-animated pseudo-elements — NOT spinners
*   Exception: the analyze button loading state uses a small spinner (20px, cyan)
*   Skeleton gradient: bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800, background-size 200%, animation: shimmer 1.5s infinite

## Empty States

*   When no data: centered icon (dimmed, 40px) + short message + action button
*   Example: RiskDashboard with no results: DNA icon at slate-800 + 'No analysis yet — upload a VCF to begin'

## Error States

*   Always specific — never generic 'Something went wrong'
*   Always suggest the fix — never dead-ends
*   Style: red-tinted card, AlertTriangle icon, specific message, action button

## Responsive Behaviour

*   Desktop first (1280px+ target — judges use laptops)
*   /report: 2-column collapses to single column at <1024px, right column moves below
*   /upload and /select-drug: 2-column collapses at <768px
*   Mobile: functional but not primary concern for hackathon demo

| SECTION 06ABSOLUTE RULESNon-negotiable. Violating any of these makes the UI generic. |
| --- |
| ❌ | Do NOT use white, light gray, or off-white backgrounds anywhere |
| --- | --- |
| ❌ | Do NOT use Inter, Roboto, or system fonts — use Syne + JetBrains Mono only |
| ❌ | Do NOT show risk colours (red/green/amber) anywhere except risk-specific elements |
| ❌ | Do NOT use generic box-shadow (0 1px 3px gray) — use the glow shadows from design tokens |
| ❌ | Do NOT use emoji as UI icons — use Lucide React icons throughout |
| ❌ | Do NOT show phenotype as full words in data tables — 'PM' not 'Poor Metabolizer' |
| ❌ | Do NOT use WidthType.PERCENTAGE in table columns (breaks rendering) |
| ❌ | Do NOT add Tailwind classes not in the default CDN bundle without a config |
| ❌ | Do NOT mention blockchain, Web3, Algorand, ZKP anywhere in the live UI |
| ❌ | Do NOT show a white loading spinner — use the cyan shimmer skeleton system |
| ❌ | Do NOT use a full-screen modal for anything — prefer inline accordions and slide panels |
| ❌ | Do NOT use generic gradient (purple-to-white) — it is the most overused AI hackathon aesthetic |
| ✅ | DO use Syne font loaded from Google Fonts in layout.tsx <head> |
| ✅ | DO use JetBrains Mono for every genomic value — diplotypes, rsIDs, gene names in data context |
| ✅ | DO animate every major state transition with Framer Motion |
| ✅ | DO implement the custom cursor — it is the single detail judges will notice first |
| ✅ | DO implement the ambient background risk glow on /report — it is the show-stopping moment |
| ✅ | DO add corner bracket decorators to the dropzone — they are the UI's personality signature |
| ✅ | DO make the Toxic badge pulse visibly — the animation communicates the clinical stakes |
| ✅ | DO test the full demo flow (VCF upload → drug select → report) before submission |
| The goal is not to look like a hackathon project.The goal is to look like a $50 million precision medicine platformthat was demoed on a Sunday afternoon in a hackathon.PharmaGuard · RIFT 2026 · Antigravity |
| --- |