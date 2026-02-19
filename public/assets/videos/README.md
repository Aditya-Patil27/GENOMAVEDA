# Video Assets

## Required File

Place your processing animation video here:

**Filename:** `thinking-animation.mp4`

**Location:** `public/assets/videos/thinking-animation.mp4`

**Requirements:**
- Format: MP4
- Recommended duration: 3-5 seconds
- Should be optimized for web (compressed)
- Suggested content: Loading animation, thinking animation, or processing visualization

**Usage:**
This video plays on the `/report` page while the genomic analysis results are being displayed for the first time. After the video ends, the RiskDashboard component is shown.

**Behavior:**
- Plays once on first visit to `/report`
- Skipped on subsequent visits or page refreshes (tracked via sessionStorage)
- Auto-plays, muted, no loop
