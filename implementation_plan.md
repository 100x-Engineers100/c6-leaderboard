# UI Enhancement Plan (Retro-Tech & Visibility Upgrade)

The objective is to upgrade the UI by making text, colors, and elements significantly more visible while embracing an aesthetic, minimal, and abstract retro-tech vibe. We will achieve this without altering any element alignments or placeholder positions.

## User Review Required

> [!IMPORTANT]
> This plan changes core color opacities and brightness. Please review the proposed changes below. The emphasis is on increasing the visibility of currently dim text (`rgba` values with low opacity) and enhancing the glowing "retro-tech" accents. Are we good to proceed with these styling tweaks?

## Proposed Changes

We will modify [globals.css](file:///c:/Users/visha/Downloads/Leaderboard/app/globals.css) and several component files to replace low-contrast text and dim borders with brighter, more vibrant alternatives, ensuring a sleek, high-visibility digital art aesthetic.

---

### Global Styles & Theme

#### [MODIFY] globals.css
We will brighten the muted text variables and enhance the ambient glows to make the dark digital aesthetic pop cleanly.
- Change `--color-text-secondary` from `#A0A0A0` to `#C4C4C4`
- Change `--color-text-muted` from `#666666` to `#999999` (Significant visibility boost for table headers).
- Increase the intensity of `--glow-orange-sm`, `-md`, and `-lg` for a more pronounced neon effect without clutter.
- Adjust the `hero-grid-bg` opacity/color if needed to make the abstract floor grid slightly more vivid.

---

### Hero Section Components

#### [MODIFY] components/hero/HeroSection.tsx
- **Brand Label (`100xEngineers`)**: Increase opacity from `0.5` to `0.85` and add a subtle `textShadow` for a glowing neon effect.

#### [MODIFY] components/hero/PixelTV.tsx
- Ensure the student names and points displayed inside or under the TVs have high opacity (e.g., from `.50` to `.90`) and vibrant colors (`var(--color-primary)`).
- We will inspect and update any inline inline RGBA colors targeting text or abstract borders around the TV.

---

### Leaderboard Components

#### [MODIFY] components/leaderboard/LeaderboardSection.tsx
- **"Full Rankings" Header**: Change color from `rgba(249,104,70,0.50)` to `rgba(249,104,70,0.95)` and add a subtle blocky glitch/glow effect if possible or just `textShadow`.
- **"Cohort 7" Label**: Change color from `rgba(144,137,137,0.77)` to a brighter `rgba(200,200,200,0.95)`.

#### [MODIFY] components/leaderboard/RankTable.tsx
- **Search Bar**: Make the placeholder text brighter (from `0.75` opacity to `0.90`) and the default border `rgba(255,255,255,0.20)` instead of `0.08` to make the input clearly visible. Search icon opacity from `0.40` to `0.80`.
- **Column Headers**: Rely on the updated `--color-text-muted` in [globals.css](file:///c:/Users/visha/Downloads/Leaderboard/app/globals.css), but we will give it a brighter crisp white or light gray.

#### [MODIFY] components/leaderboard/RankRow.tsx
- **Unranked Default Text (`-`)**: Change opacity from `0.18` to `/0.35` so it is visible but still subtle.
- **Rank Numbers**: Change from `rgba(255,255,255,0.50)` to `0.85`.
- **Points/Stats**: Ensure `attendance_pts`, `ugc_post_pts`, etc. have their opacities uniformly increased (e.g., from `0.65` to `0.95`).
- **Row Borders**: Increase the subtle un-highlighted border from `rgba(255,255,255,0.04)` to `0.10` so the abstract tabular grid structure is clearly perceived on dark displays.
- **Accordion Details**: Brighten the "XP Breakdown" labels and values similarly.

## Verification Plan

### Automated Tests
- No automated frontend tests currently exist that cover visual CSS rendering accuracy. Verification will rely on manual visual checks.

### Manual Verification
1. I will use the `browser_subagent` to navigate to `http://localhost:3000` after applying the changes.
2. I will capture screenshots of the Hero section, examining the "100xEngineers" label and podium TV texts.
3. I will capture screenshots of the Leaderboard table, verifying that the column headers, search bar, and data rows are highly visible and legible.
4. I will verify that no structural alignment or layout has been broken (e.g., table columns still align, TVs are still centered).
5. I will display these before/after screenshots to the user in the final summary.
