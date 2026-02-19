# Video Assets

## Required File

Place your processing animation video here:

**Filename:** `thinking.mp4`

**Location:** `public/assets/videos/thinking.mp4`

**Requirements:**
- Format: MP4
- Recommended duration: 3-5 seconds
- Should be optimized for web (compressed)
- Suggested content: Loading animation, thinking animation, or processing visualization

**Usage:**
This video plays as a cinematic overlay on the `/report` page when the user first lands on it. The overlay covers the content below the progress indicator with a blurred black background. After the video ends, the overlay fades out smoothly to reveal the RiskDashboard.

**Behavior:**
- Plays once on first visit to `/report`
- Skipped on subsequent visits or page refreshes (tracked via sessionStorage)
- Auto-plays, muted, no loop
- Smooth 700ms fade-out transition after video ends
- Does not break scroll or shift layout
