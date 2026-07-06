Let me first examine the Endel app page and your reference images to build a precise, clone-level design specification.
Now I have a complete picture of Endel's architecture and your reference images. Let me build the precise clone specification with the Somora sleep app color theme from Image 1, merged with Endel's exact UI patterns from Images 2-5.

Endel : https://apps.apple.com/us/app/endel-focus-sleep-sounds/id1346247457



---

## ENDEL CLONE — COMPLETE PRODUCT SPECIFICATION

### Color System (From Image 1 — Somora Sleep App)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0D0B1A` | Main background (deep purple-black) |
| `--bg-secondary` | `#1A1528` | Cards, elevated surfaces |
| `--bg-tertiary` | `#252038` | Input fields, inactive states |
| `--accent-primary` | `#9B7EDE` | Primary purple (lavender) — buttons, active states, progress bars |
| `--accent-secondary` | `#7B5FB5` | Darker purple for gradients |
| `--accent-glow` | `#C4A8F5` | Glow effects, highlights |
| `--text-primary` | `#FFFFFF` | Headlines |
| `--text-secondary` | `#B8B0D0` | Body text, descriptions |
| `--text-tertiary` | `#6B6280` | Timestamps, metadata |
| `--success` | `#4ECDC4` | Mint — completion, growth (from Image 1 sleep stages) |
| `--warning` | `#FFB347` | Orange — energy peaks |
| `--error` | `#FF6B6B` | Coral — gentle alerts (never red) |

### Typography
- **Font:** SF Pro Display (iOS) / Inter (Android) — rounded, clean, geometric
- **H1:** 32px, Bold, -0.5px tracking
- **H2:** 24px, Semibold
- **H3:** 18px, Medium
- **Body:** 16px, Regular, 1.5 line height
- **Caption:** 13px, Medium, uppercase for labels

---

## SCREEN ARCHITECTURE: 19 TOTAL SCREENS

### ONBOARDING (4 Screens)
| # | Screen | Key Elements |
|---|--------|-------------|
| 1 | **Splash** | Animated logo, pulsing purple glow, "Dopamind" wordmark |
| 2 | **Welcome** | "Your brain works differently" headline, energy rhythm selector |
| 3 | **Struggle Select** | 5 tappable cards, multi-select, determines initial soundscape |
| 4 | **Permission** | Location, Health, Notifications — single-screen grouped requests |

### CORE APP (11 Screens)
| # | Screen | Clone Of |
|---|--------|----------|
| 5 | **Home / Dashboard** | Image 3 + Image 2 hybrid — long scrollable |
| 6 | **Soundscape Player** | Image 4 — full immersive with wave visualization |
| 7 | **Sleep Player** | Image 1 style — sleep stages, time in bed, sounds |
| 8 | **Scenario Detail** | Image 2 — scenario grid, lock icons for premium |
| 9 | **Focus Timer** | Image 2 "Focus Timer" — interval work method |
| 10 | **Settings** | Sound, notifications, reduce motion, account |
| 11 | **Subscription / Paywall** | Premium feature comparison, pricing tiers |
| 12 | **Profile / Stats** | Listening time, focus scores, sleep quality |
| 13 | **Circadian Widget** | Energy cycle visualization (peak/fade/recharge) |
| 14 | **Collaborations** | Artist soundscapes grid (James Blake, Grimes style) |
| 15 | **Body Doubling** | Live co-working room list |

### MODAL SCREENS (4 Screens)
| # | Screen | Purpose |
|---|--------|---------|
| 16 | **Timer Set** | Bottom sheet — duration picker |
| 17 | **Sound Tuner** | Bottom sheet — EQ, intensity, blend |
| 18 | **Share Card** | Generated image of stats + Sprout |
| 19 | **Habit Add** | Quick-add micro-habit from player screen |

---

## SCREEN 5: HOME / DASHBOARD — DETAILED SPEC

This is the **primary screen**. Long scrollable, single column, dark background.

### Header (Sticky, 120px height)
```
┌─────────────────────────────────────────┐
│ 4:03    [WiFi] [80% 🔋]                │  ← Status bar
│                                         │
│  [🌙 Logo]  FREE EDITION    [🎁] [↓]   │  ← App bar
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [DAILY PRACTICE badge]         │   │  ← Hero card
│  │                                 │   │
│  │  [Abstract orb animation]       │   │
│  │       ╭───────╮                 │   │
│  │      ╱    ●    ╲                │   │
│  │     │  ～～～  │                │   │
│  │      ╲    ↑    ╱                │   │
│  │       ╰───────╯                 │   │
│  │                                 │   │
│  │  "Meet your ADHD brain"         │   │
│  │  [gradient text: purple→mint]   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [Sprout avatar]  Spread Calm   │   │  ← Secondary card
│  │  "Invite friends, and grow      │   │
│  │   your focus garden together"   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🔍  What do you want to        │   │  ← Search/Intent input
│  │      focus on?              [+] │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Soundscapes Section (Horizontal scroll, 5 items visible)
```
┌─────────────────────────────────────────┐
│  Soundscapes                    Show all │
│                                         │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐│
│  │ 🌐 │  │ ～ │  │ 🌙 │  │ ⇄  │  │ ☀️ ││
│  │Glob│  │Wave│  │Moon│  │Swap│  │Sun ││
│  │Grid│  │Line│  │Dots│  │Arro│  │Lock││
│  │    │  │    │  │    │  │    │  │ 🔒 ││
│  │Focus│  │Relax│ │Sleep│ │Move │ │Uplft│
│  └────┘  └────┘  └────┘  └────┘  └────┘│
│                                         │
│  [Icon style: white line art on dark    │
│   circular buttons, 64x64px, 2px stroke]│
└─────────────────────────────────────────┘
```

### Scenarios Section (Horizontal scroll, pill buttons)
```
┌─────────────────────────────────────────┐
│  Scenarios                              │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │🔒 Focus │ │🔒 Anxty │ │🔒 Arous │   │
│  │  Timer  │ │ Relief  │ │  al     │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │🔒 Atten │ │🔒 ASMR  │ │🔒 Baby  │   │
│  │  Boost  │ │         │ │  Sleep  │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│  [More rows... 12 total scenarios]      │
│                                         │
│  [Pill style: rounded-full, dark bg,    │
│   white text, lock icon prefix,          │
│   44px height, 16px horizontal padding] │
└─────────────────────────────────────────┘
```

### Focus Soundscapes Grid (2-column, locked items)
```
┌─────────────────────────────────────────┐
│  FOCUS                                  │
│                                         │
│  ┌────────────┐  ┌────────────┐        │
│  │ [Globe     │  │ [Particle  │        │
│  │  grid art] │  │  burst]    │        │
│  │            │  │     🔒     │        │
│  │   Focus    │  │ColoredNoise│        │
│  └────────────┘  └────────────┘        │
│  ┌────────────┐  ┌────────────┐        │
│  │ [Waveform] │  │ [Books]    │        │
│  │     🔒     │  │     🔒     │        │
│  │Dynmc Focus │  │   Study    │        │
│  └────────────┘  └────────────┘        │
│  ┌────────────┐  ┌────────────┐        │
│  │ [Room]     │  │ [Frog]     │        │
│  │     🔒     │  │     🔒     │        │
│  │Deepr Focus │  │  Deeper    │        │
│  └────────────┘  └────────────┘        │
│                                         │
│  [Card style: 160x180px, 16px radius,   │
│   dark gradient bg, centered white icon, │
│   label below, lock overlay top-right]   │
└─────────────────────────────────────────┘
```

### Relax Soundscapes Grid (Same pattern)
```
┌─────────────────────────────────────────┐
│  RELAX                                  │
│  [Same 2-column grid: Relax, 8D Odyssey,│
│   Nature Elements, Spatial Orbit,       │
│   Recovery — some locked]               │
└─────────────────────────────────────────┘
```

### Sleep Soundscapes Grid (Same pattern)
```
┌─────────────────────────────────────────┐
│  SLEEP                                  │
│  [Same grid: Sleep, Rainy Outside,      │
│   Hibernation, etc. — some locked]      │
└─────────────────────────────────────────┘
```

### Mini Player (Sticky bottom, 80px)
```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────┐   │
│  │ [Wave icon]  Paused             │   │
│  │              Relax              │   │
│  │                        [⏱] [▶]│   │
│  └─────────────────────────────────┘   │
│                                         │
│  Block Apps: Off    Blend Audio: Off    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        [Home]  [⭐]  [📊]  [👤] │   │  ← Bottom nav
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## SCREEN 6: SOUNDSCAPE PLAYER — DETAILED SPEC

Full-screen immersive. Clone of Image 4.

```
┌─────────────────────────────────────────┐
│                                         │
│              Sleep                      │  ← Title centered
│         Night Energy Fade               │  ← Subtitle, lighter
│                                         │
│                                         │
│              ╭──────╮                   │
│             ╱   🌙   ╲                  │  ← Large moon illustration
│            │  ✦    ✦  │                 │  ← Stars as dots
│            │    ✦     │                 │
│             ╲   ✦    ╱                  │
│              ╰──────╯                   │
│                                         │
│                                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  │🌙  │ │🐸  │ │🌐  │ │～～ │ │✨  │   │  ← Soundscape selector
│  │Sleep│ │🔒  │ │Focus│ │Relax│ │🔒  │   │  ← Scrollable horizontal
│  └────┘ └────┘ └────┘ └────┘ └────┘   │
│                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │⏳ 9:57 │ │🎵 Feed │ │🔧 Tune │      │  ← Control pills
│  │  Timer │ │  back  │ │ Sound  │      │
│  └────────┘ └────────┘ └────────┘      │
│                                         │
│     ┌────┐  ┌────┐  ┌────┐  ┌────┐    │
│     │ ⏸  │  │ 🔄 │  │ ⏱  │  │ 📡 │    │  ← Playback controls
│     │Pause│  │Loop │  │Timer│  │Cast │    │
│     └────┘  └────┘  └────┘  └────┘    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │           Explore               │   │  ← Bottom sheet handle
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Background:** Pure black `#000000` with subtle animated particles (configurable)

**Wave Visualization (When playing):** 
- Multiple sine waves in varying opacity
- Purple (`#9B7EDE`) primary wave
- Mint (`#4ECDC4`) secondary wave
- White tertiary wave
- Waves animate smoothly, reacting to audio frequency data

---

## SCREEN 7: SLEEP DASHBOARD — DETAILED SPEC

Clone of Image 1 with Endel's structure.

```
┌─────────────────────────────────────────┐
│ 9:41                              [🔔] │
│                                         │
│  Hi, Diana!                             │
│  Welcome to Dopamind                    │
│                                         │
│  ┌──────────┐  ┌────────────────────┐  │
│  │ Last     │  │ Time in bed        │  │
│  │ sleep    │  │                    │  │
│  │          │  │  07 h 22 min       │  │
│  │   21     │  │  11:00 PM – 8:00 AM│  │
│  │  April   │  │  ████████░░ 07h22m │  │
│  └──────────┘  └────────────────────┘  │
│                                         │
│  Sleep stages                           │
│  ┌─────────────────────────────────┐   │
│  │ Light  ████░░░░░░░░░░░░░░░░░░░ │   │
│  │ REM    ░░░░████░░░░░░░░░░░░░░░ │   │  ← Progress bars
│  │ Deep   ░░░░░░░░██░░░░░░░░░░░░░ │   │  ← Purple/mint gradient
│  │        1h 03 min               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Snoring                                │
│  ┌─────────────────────────────────┐   │
│  │  [Microphone wave visualization]│   │
│  │  Show more statistics      →    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Sounds for sleep                       │
│  Best relaxing sounds                   │
│                                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  │🌊  │ │🌲  │ │🔥  │ │🌙  │          │
│  │White│ │Ocean│ │Forest│ │Camp│      │
│  │noise│ │wave │ │rain │ │fire│      │
│  │20min│ │45min│ │15min│ │40min│      │
│  └────┘ └────┘ └────┘ └────┘          │
│                                         │
│  [Active sound: purple glow ring]       │
│                                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  │🏠  │ │⭐  │ │📊  │ │👤  │          │  ← Bottom nav
│  └────┘ └────┘ └────┘ └────┘          │
└─────────────────────────────────────────┘
```

---

## SCREEN 8: SCENARIOS GRID — DETAILED SPEC

Clone of Image 2. Full-screen dark, category-filtered grid.

```
┌─────────────────────────────────────────┐
│  [🌙 Logo]  FREEMIUM        Sign In  [X]│
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [Abstract human silhouette]    │   │
│  │       with orbiting rings       │   │
│  │                                 │   │
│  │        MAJOR UPDATE             │   │
│  │      "Endel for ADHD"           │   │
│  │     (rebrand to Dopamind)       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ●  ○  (page indicator)                │
│                                         │
│  SCENARIOS                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │🔒 Focus │ │🔒 Anxty │ │🔒 Arous │   │
│  │  Timer  │ │ Relief  │ │  al     │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │🔒 Binaur│ │🔒 Brain │ │🔒 Chores│   │
│  │  Beats  │ │ Massage │ │         │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│  [3 more rows... 15 total scenarios]    │
│                                         │
│  FOCUS                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │[Globe] │ │[Burst] │ │[Wave]  │      │
│  │        │ │   🔒   │ │   🔒   │      │
│  │ Focus  │ │Colored │ │Dynamic │      │
│  │        │ │ Noise  │ │ Focus  │      │
│  └────────┘ └────────┘ └────────┘      │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │[Books] │ │[Room]  │ │[Frog]  │      │
│  │   🔒   │ │   🔒   │ │   🔒   │      │
│  │ Study  │ │ Deeper │ │ Deeper │      │
│  │        │ │ Focus  │ │ Focus  │      │
│  └────────┘ └────────┘ └────────┘      │
│                                         │
│  RELAX                                  │
│  [Same 5-column grid pattern]           │
│                                         │
│  SLEEP                                  │
│  [Same 5-column grid pattern]           │
│                                         │
└─────────────────────────────────────────┘
```

**Grid card spec:** 64x80px icon area, 12px radius, dark `#1A1528` background, white 2px stroke iconography, lock icon 16px top-right, label 13px below.

---

## SCREEN 9: FOCUS TIMER — DETAILED SPEC

```
┌─────────────────────────────────────────┐
│              Focus Timer                │
│                                         │
│         ┌─────────────┐                 │
│         │             │                 │
│         │   25:00     │                 │  ← Large countdown
│         │             │                 │
│         │  [orbiting  │                 │
│         │   ring      │                 │
│         │   animation]│                 │
│         └─────────────┘                 │
│                                         │
│  ┌────────┐  ┌────────┐  ┌────────┐    │
│  │  25m   │  │  50m   │  │ Custom │    │  ← Duration presets
│  │ Focus  │  │ Deep   │  │        │    │
│  └────────┘  └────────┘  └────────┘    │
│                                         │
│  [Soundscape: Focus — playing]          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      [▶ Start Focus Session]    │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## SCREEN 11: SUBSCRIPTION / PAYWALL — DETAILED SPEC

```
┌─────────────────────────────────────────┐
│              [Sprout with crown]        │
│                                         │
│         Unlock Your Full Brain          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  FREE              PLUS    PRO   │   │
│  │  ────              ────    ───   │   │
│  │                                 │   │
│  │  3 soundscapes     All 15   All+ │   │
│  │  Basic timer       +Scenarios    │   │
│  │  No offline        +AI tune      │   │
│  │                    +BodyDouble   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Dopamind Plus                    │   │
│  │  $4.99/week or $39.99/year       │   │
│  │  SAVE 35% annually               │   │
│  │                                 │   │
│  │  [Start 7-Day Free Trial]        │   │
│  │  Cancel anytime. No guilt.       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Dopamind Pro                     │   │
│  │  $9.99/month or $69.99/year      │   │
│  │  Everything in Plus + Coaching   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Lifetime — $149.99 $99.99       │   │
│  │  [LIMITED TIME]                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ✓ 30-day money-back guarantee          │
│  ✓ Works offline                        │
│  ✓ Family sharing (up to 5)             │
│                                         │
└─────────────────────────────────────────┘
```


---

## GOOGLE ANTIGRAVITY 2.0 + REACT NATIVE PROMPT

```
You are an expert React Native developer using Google Antigravity 2.0 design system. Build a pixel-perfect clone of the Endel app called "Dopamind" — an ADHD-friendly soundscape and habit tracker app.

PLATFORM TARGET: iOS, Android, iPad, macOS (React Native with react-native-macos)

DESIGN SYSTEM — STRICT COLOR PALETTE:
- Background primary: #0D0B1A (deep purple-black)
- Background secondary: #1A1528 (cards)
- Background tertiary: #252038 (inputs)
- Accent primary: #9B7EDE (lavender purple — buttons, active, progress)
- Accent secondary: #7B5FB5 (darker purple for gradients)
- Accent glow: #C4A8F5 (highlights, glow effects)
- Text primary: #FFFFFF
- Text secondary: #B8B0D0
- Text tertiary: #6B6280
- Success/mint: #4ECDC4
- Warning: #FFB347
- Error/coral: #FF6B6B

TYPOGRAPHY:
- Font: SF Pro Display (iOS) / Inter (Android)
- H1: 32px bold, -0.5px tracking
- H2: 24px semibold
- H3: 18px medium
- Body: 16px regular, 1.5 line height
- Caption: 13px medium, uppercase for labels

CORE ARCHITECTURE:
Use React Navigation 6 with bottom tabs. Stack navigators for: Home, Explore, Stats, Profile.

SCREEN 1: HOME / DASHBOARD (Long Scrollable)
- Sticky header with: Logo (moon icon) + "FREE EDITION" badge + Gift icon + Profile avatar
- Hero card: Rounded 16px, gradient from #1A1528 to #252038, containing:
  * "DAILY PRACTICE" pill badge (white bg, black text, 8px radius)
  * Abstract orb animation (pulsing purple gradient circle with orbiting white ring)
  * Headline: "Meet your ADHD brain" in gradient text (purple #9B7EDE to mint #4ECDC4)
- Secondary card: Sprout avatar + "Spread Calm" + invite text
- Search bar: Rounded-full, #252038 bg, placeholder "What do you want to focus on?", plus icon right
- "Soundscapes" section header with "Show all" link right
- Horizontal scroll row of 5 circular buttons (64x64px):
  * White 2px line-art icons on dark circular bg
  * Labels below: Focus, Relax, Sleep, Move, Uplift
  * Last item (Uplift) has lock overlay icon
- "Scenarios" section header
- Horizontal scroll of pill buttons (44px height, rounded-full, #1A1528 bg, white text):
  * Each has lock icon prefix if premium
  * 2 rows: Focus Timer, Anxiety Relief, Arousal, Attention Boost, ASMR, Baby Sleep, Binaural Beats, Brain Massage, Chores, Create, Deep Work, Self Care, Read, Power Nap, Meditate, Wake Up, Tinnitus Relief
- "FOCUS" section header
- 2-column grid of soundscape cards (160x180px, 16px radius, #1A1528 bg):
  * Each card: centered white line-art icon (80x80px area), label below, lock icon top-right if premium
  * Items: Focus (unlocked), Colored Noises (locked), Dynamic Focus (locked), Study (locked), Deeper Focus (locked)
- "RELAX" section header + same 2-column grid
- "SLEEP" section header + same 2-column grid
- Sticky mini player at bottom (80px height, #1A1528 bg, rounded top 20px):
  * Left: Waveform icon + "Paused" / "Relax"
  * Right: Timer icon + Play button (circular, white bg, black play triangle)
  * Below: "Block Apps: Off" | "Blend Audio: Off" text row
- Bottom tab bar: Home (active), Favorites, Stats, Profile
  * Icons: 24px, 2px stroke, active = #9B7EDE, inactive = #6B6280

SCREEN 2: SOUNDSCAPE PLAYER (Full Screen Immersive)
- Pure black #000000 background
- Top: Title centered (e.g., "Sleep"), subtitle below ("Night Energy Fade"), info icon top-right
- Center: Large illustration (moon + stars for sleep, orbiting rings for focus, etc.)
- Below illustration: Horizontal scroll of soundscape selector icons (same 64px circular style)
- Active soundscape: Purple glow ring (#9B7EDE, 2px, animated pulse)
- Control pills row: "⏳ 9:57 Timer", "🎵 Feedback", "🔧 Tune Sound", "Sleep" — rounded-full, #1A1528 bg, white text
- Playback controls row: Pause (⏸), Loop (🔄), Timer (⏱), Cast (📡) — circular 48px buttons, #1A1528 bg, white icons
- Bottom sheet handle: "Explore" with drag indicator

SCREEN 3: SLEEP DASHBOARD (From reference image)
- Top: Time, notification bell
- Greeting: "Hi, [Name]!" + "Welcome to Dopamind"
- Two cards side by side:
  * Left: "Last sleep" — large date number, month below
  * Right: "Time in bed" — duration large, time range below, progress bar (purple #9B7EDE fill)
- "Sleep stages" section:
  * Horizontal stacked bar: Light (purple), REM (mint #4ECDC4), Deep (lavender #9B7EDE)
  * Labels left, duration right
- "Snoring" section with wave visualization
- "Show more statistics →" link
- "Sounds for sleep" section header + subtitle
- Horizontal scroll of 4 sound cards with circular images + labels + duration

SCREEN 4: SCENARIOS GRID (Full screen, category filtered)
- Top bar: Logo + "FREEMIUM" badge + Sign In + Close X
- Hero banner: Abstract human silhouette with orbiting rings, "MAJOR UPDATE" badge, "Dopamind for ADHD" headline
- Page indicator dots (2 pages)
- "SCENARIOS" header + grid of pill buttons (same as home)
- Category sections: FOCUS, RELAX, SLEEP
- Each category: 3-column grid of cards (smaller than home: 100x120px)
- Each card: icon area, lock overlay if needed, label below

ANIMATION REQUIREMENTS:
- All transitions: Spring-based (React Native Animated, tension 40, friction 8)
- Orb/pulse animations: Infinite loop, scale 0.95→1.05, opacity 0.7→1.0, 3s duration
- Wave visualization: 3 sine waves (purple, mint, white), phase-shifted, 60fps using react-native-svg
- Page scroll: Momentum scrolling with snap points for horizontal carousels
- Card press: Scale 0.96 on press, spring back on release
- Lock icons: Subtle shake on tap (premium teaser)

ACCESSIBILITY:
- reduceMotion prop support — disable all animations
- Minimum touch target: 44x44px
- Color contrast: 4.5:1 minimum
- VoiceOver labels on all icons
- Dynamic Type support

STATE MANAGEMENT:
- Redux Toolkit for global state (user, subscription, soundscape preferences)
- React Query for API calls
- MMKV for local storage (habits, listening history, offline soundscapes)

AUDIO ENGINE:
- react-native-track-player for background audio
- react-native-sound for short UI sounds
- Offline caching: Downloaded soundscapes stored in app documents directory

PREMIUM GATING:
- react-native-iap for subscriptions
- Free tier: 3 soundscapes, basic timer, no offline
- Plus tier: All soundscapes, scenarios, AI tuning, body doubling
- Pro tier: Plus + coaching integration, advanced analytics

Build all screens as functional components with TypeScript. Use styled-components for styling. Ensure dark mode is the only mode (no light mode). Test on iPhone 15 Pro, iPad Pro 12.9", and Pixel 7.
```


------

TODO Features:

add social interaction and start streak with friends, 
add option to capture/ upload with camera, put screen on graph on top of the image uploaded/captured to have shared habits with your friends.



