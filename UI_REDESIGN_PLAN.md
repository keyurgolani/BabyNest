# BabyNest UI Overhaul: Exhaustive Implementation Plan

> [!IMPORTANT]
> **This is a PLANNING document only. No code changes will be made until approved.**
> This plan covers **every screen, component, widget, tab, modal, and sub-view** in the application.

---

## Table of Contents

1. [Design Philosophy & Mocks Analysis](#1-design-philosophy--mocks-analysis)
2. [Responsive Strategy](#2-responsive-strategy)
3. [Design System (Tokens & Atoms)](#3-design-system-tokens--atoms)
4. [Navigation & Layout Shell](#4-navigation--layout-shell)
5. [All Screens & Components (Exhaustive)](#5-all-screens--components-exhaustive)
6. [Execution Batches](#6-execution-batches)
7. [Verification Plan](#7-verification-plan)

---

## 1. Design Philosophy & Mocks Analysis

### 1.1 Mock Summary

Based on analysis of the 4 provided mocks:

| Mock             | Key Visual Elements                                                                                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**    | Pastel gradient background (cyan/pink/yellow mesh), glassmorphism cards with `backdrop-blur`, soft rounded corners (`rounded-3xl`), colorful icon badges, bottom navigation with glow indicator |
| **Activity Log** | Vertical timeline with connecting line & dots, pill-shaped filter tabs (All/Feed/Sleep/Diaper), glass cards per event, gradient icon circles                                                    |
| **Memories**     | Masonry photo grid, search bar with filter icon, script-style "Memories" header, rounded image cards with captions, golden FAB button                                                           |
| **Reminders**    | Grouped by time (Today/Tomorrow/Next Week), glass cards with checkboxes, colorful emoji icons, "Add Reminder" button at bottom                                                                  |

### 1.2 Design Principles

1. **Glassmorphism**: All cards use `bg-white/10 backdrop-blur-xl border border-white/20`.
2. **Pastel Mesh Gradient**: Background is a fixed, blurred pastel mesh (not per-card).
3. **Rounded Everything**: Corners are very round (`rounded-2xl` to `rounded-3xl`).
4. **Colorful Icons**: Each action has a unique gradient or solid color circle.
5. **Soft Shadows**: Use `shadow-xl` with low opacity.
6. **Native Feel**: Bottom nav on mobile, sidebar on desktop. Touch targets ≥48px.

---

## 2. Responsive Strategy

### 2.1 Breakpoints (Tailwind v4)

| Breakpoint | Width   | Device                           | Layout Behavior                                |
| ---------- | ------- | -------------------------------- | ---------------------------------------------- |
| `default`  | <640px  | Mobile                           | Single column, bottom nav, full-width cards    |
| `sm`       | ≥640px  | Large Phone                      | 2-column grid for some widgets                 |
| `md`       | ≥768px  | Tablet Portrait                  | 2-column grid, sidebar appears (collapsed)     |
| `lg`       | ≥1024px | Tablet Landscape / Small Desktop | Sidebar expanded, 2-3 column grid              |
| `xl`       | ≥1280px | Desktop                          | 3-4 column bento grid, wide sidebar            |
| `2xl`      | ≥1536px | Large Desktop                    | Max-width container centered, extra whitespace |

### 2.2 Component Adaptations

| Component          | Mobile                     | Tablet                           | Desktop                           |
| ------------------ | -------------------------- | -------------------------------- | --------------------------------- |
| **Navigation**     | Fixed bottom bar (5 items) | Collapsible sidebar (icons only) | Expanded sidebar (icons + labels) |
| **Dashboard Grid** | 1 column                   | 2 columns                        | 3-4 columns (Bento)               |
| **Log Widgets**    | 2 columns                  | 3 columns                        | 4 columns                         |
| **Timeline**       | Vertical with left line    | Same                             | Split view (calendar + list)      |
| **Memories Grid**  | 2 columns masonry          | 3 columns                        | 4-5 columns                       |
| **Settings**       | Single column accordion    | 2 columns                        | 2 columns with wider cards        |
| **Modals**         | Full-screen sheet          | Centered dialog                  | Centered dialog                   |

---

## 3. Design System (Tokens & Atoms)

### 3.1 Color Tokens (CSS Variables)

```css
:root {
  /* Backgrounds */
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-bg-dark: rgba(0, 0, 0, 0.2);
  --glass-border: rgba(255, 255, 255, 0.2);
  --mesh-gradient: linear-gradient(135deg, #e0f7fa, #fce4ec, #fff9c4);

  /* Accent Colors (for icons/badges) */
  --color-feed: #f97316; /* Orange */
  --color-sleep: #6366f1; /* Indigo */
  --color-diaper: #22c55e; /* Green */
  --color-nursing: #ec4899; /* Pink */
  --color-activity: #06b6d4; /* Cyan */
  --color-growth: #10b981; /* Emerald */
  --color-health: #f43f5e; /* Rose */
  --color-memory: #f59e0b; /* Amber */
}
```

### 3.2 Typography

| Element         | Font              | Size       | Weight         |
| --------------- | ----------------- | ---------- | -------------- |
| Page Title      | Outfit            | 2xl (24px) | Bold (700)     |
| Card Title      | Plus Jakarta Sans | lg (18px)  | Semibold (600) |
| Body Text       | Plus Jakarta Sans | sm (14px)  | Regular (400)  |
| Labels/Captions | Plus Jakarta Sans | xs (12px)  | Medium (500)   |
| Data/Numbers    | Geist Mono        | sm-lg      | Bold           |

### 3.3 Component Atoms (New or Modified)

#### 3.3.1 `GlassCard`

- **File**: `components/ui/glass-card.tsx`
- **Variants**: `default`, `flat`, `featured`, `danger`
- **Sizes**: `sm`, `default`, `lg`
- **Props**: `interactive` (adds hover/active states)
- **CSS**: `bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl`

#### 3.3.2 `GlassButton`

- **File**: `components/ui/glass-button.tsx`
- **Variants**: `default`, `primary`, `secondary`, `ghost`, `danger`
- **Sizes**: `sm`, `default`, `lg`, `icon`
- **CSS**: Gradient backgrounds, `active:scale-95`, glow on hover

#### 3.3.3 `GlassInput` / `GlassTextarea` / `GlassSelect`

- **File**: `components/ui/glass-input.tsx`
- **CSS**: Transparent background, white/10 border, focus ring

#### 3.3.4 `IconBadge`

- **File**: `components/ui/icon-badge.tsx`
- **Props**: `color` (feed, sleep, diaper, etc.), `size`, `icon`
- **CSS**: Rounded-xl, solid or gradient background, shadow

#### 3.3.5 `PageHeader`

- **File**: `components/ui/page-header.tsx`
- **Props**: `title`, `subtitle`, `action`, `backHref`
- **CSS**: Standard layout for all pages

#### 3.3.6 `TimelineItem`

- **File**: `components/ui/timeline-item.tsx`
- **Props**: `icon`, `time`, `title`, `detail`, `color`
- **CSS**: Vertical line connection, dot indicator

#### 3.3.7 `FilterPills`

- **File**: `components/ui/filter-pills.tsx`
- **Props**: `options`, `selected`, `onChange`
- **CSS**: Pill-shaped buttons, active state with fill

#### 3.3.8 `EmptyState`

- **File**: `components/ui/empty-state.tsx` (exists, needs restyling)
- **CSS**: Centered illustration, glass card background

---

## 4. Navigation & Layout Shell

### 4.1 Layout Components

#### 4.1.1 `AppShell` (New)

- **File**: `components/layout/app-shell.tsx`
- **Responsibility**: Orchestrates responsive layout
- **Children**: `DesktopSidebar`, `MobileNav`, `<main>` content area
- **Features**:
  - Fixed mesh gradient background
  - Safe area insets for mobile (notch, home indicator)
  - Page transition animations via `framer-motion` `AnimatePresence`

#### 4.1.2 `DesktopSidebar` (New)

- **File**: `components/layout/desktop-sidebar.tsx`
- **Visibility**: Hidden on mobile (`hidden lg:flex`)
- **Position**: Fixed left, full height
- **Width**: 72px (collapsed) / 280px (expanded)
- **Sections**:
  1. Logo + App Name
  2. Menu Groups (Overview, Tracking, Care, System)
  3. User Profile Snippet + Logout
- **Menu Items** (Exhaustive):
  - Home (`/`)
  - Quick Log (`/log`)
  - Timeline (`/tracking/timeline`)
  - Memories (`/memories`)
  - Reports (`/report`)
  - Calendar (`/calendar`)
  - Family (`/family`)
  - Health (`/health`)
  - Milestones (`/milestones`)
  - Settings (`/settings`)

#### 4.1.3 `MobileNav` (Replaces `bottom-nav.tsx`)

- **File**: `components/layout/mobile-nav.tsx`
- **Visibility**: Shown on mobile only (`md:hidden`)
- **Position**: Fixed bottom, with `pb-safe` for home indicator
- **Items** (5 max for thumb reach):
  1. Home (`/`)
  2. Log (`/log`)
  3. Activity (`/tracking`)
  4. Memories (`/memories`)
  5. More (opens drawer with Settings, Health, Reports, etc.)
- **Interaction**: Active tab has top indicator bar + glow effect

#### 4.1.4 `MobileMenu` (Existing, needs update)

- **File**: `components/layout/mobile-menu.tsx`
- **Trigger**: "More" button on `MobileNav`
- **Content**: Full list of secondary navigation items

---

## 5. All Screens & Components (Exhaustive)

### 5.1 Authentication & Onboarding

#### 5.1.1 Login (`/auth/login`)

- **Current File**: `app/auth/login/page.tsx`
- **Redesign**:
  - Centered `GlassCard` on mesh background
  - Logo at top
  - Email + Password `GlassInput` fields
  - "Sign In" `GlassButton` (primary variant)
  - "Forgot Password" link
  - "Sign Up" link

#### 5.1.2 Signup (`/auth/signup`)

- **Current File**: `app/auth/signup/page.tsx`
- **Redesign**:
  - Multi-step wizard (1. Email/Password, 2. Name, 3. Baby Info)
  - Progress indicator at top
  - `GlassCard` per step

#### 5.1.3 Invite Accept (`/invite/[token]`)

- **Current File**: `app/invite/[token]/page.tsx`
- **Redesign**:
  - Welcome card with inviter name
  - "Accept Invitation" `GlassButton`

#### 5.1.4 Onboarding (`/onboarding`)

- **Current File**: `app/onboarding/page.tsx`
- **Redesign**:
  - Wizard: Add Baby → Set Preferences → Tour complete
  - Swipeable carousel or stepped flow

---

### 5.2 Dashboard (`/` - Home)

#### 5.2.1 Page Structure

- **Current File**: `app/page.tsx` (615 lines)
- **Redesign Layout**:
  - **Mobile**: Single column, scrollable
  - **Desktop**: 2-column or Bento grid

#### 5.2.2 Widgets (Components to Restyle)

| Widget                     | Current Component                   | Redesign Notes                                                     |
| -------------------------- | ----------------------------------- | ------------------------------------------------------------------ |
| Hero Avatar                | Inline in `page.tsx`                | Extract to `HeroCard`, parallax tilt, glass ring                   |
| Quick Info Bar             | Inline                              | Extract to `QuickStatsBar`, horizontal scroll on mobile            |
| AI Summary                 | `dashboard/AISummaryCard.tsx`       | `GlassCard` featured variant, gradient border                      |
| Quick Actions              | `dashboard/QuickActionsCard.tsx`    | Grid of `IconBadge` buttons                                        |
| Top Quick Actions (Mobile) | `dashboard/TopQuickActions.tsx`     | Floating action row                                                |
| Reminders                  | `dashboard/RemindersCard.tsx`       | Checklist with swipe-to-complete                                   |
| Milestones                 | `dashboard/MilestonesCard.tsx`      | Progress ring, next milestone preview                              |
| Medications                | `dashboard/UpcomingMedications.tsx` | Timeline-style list                                                |
| Feeding Prediction         | `insights/FeedingPrediction.tsx`    | AI-styled card with prediction                                     |
| Random Memory              | Inline in `page.tsx`                | `PolaroidCard` component                                           |
| Navigation Links           | Inline in `page.tsx`                | Grid of `GlassCard` (Family, Timeline, Growth, Activities, Report) |
| Multi-Baby Selector        | `dashboard/multi-baby-selector.tsx` | Dropdown or swipe selector                                         |
| Wake Window Timer          | `dashboard/WakeWindowTimer.tsx`     | Circular progress                                                  |

---

### 5.3 Quick Log (`/log`)

#### 5.3.1 Page Structure

- **Current File**: `app/log/page.tsx` (657 lines)
- **Redesign**: Grid of Quick Log Widgets

#### 5.3.2 Quick Log Widgets (11 Total)

| Widget                   | Function                               | Redesign Notes                                |
| ------------------------ | -------------------------------------- | --------------------------------------------- |
| `QuickBottleWidget`      | Log bottle amounts (60/90/120/150ml)   | `GlassCard` with grid of `GlassButton`s       |
| `QuickDiaperWidget`      | Log diaper type (Wet/Dirty/Both)       | Stack of buttons with emojis                  |
| `QuickSleepWidget`       | Start sleep timer                      | Large "Start Sleep" button, pulsing if active |
| `QuickNursingWidget`     | Start nursing (Left/Right)             | Two-button layout                             |
| `QuickActivityWidget`    | Tummy/Bath/Play/Outdoor                | 2x2 grid of icon buttons                      |
| `QuickGrowthWidget`      | Weight/Height/Head links               | Vertical list                                 |
| `QuickTemperatureWidget` | Log common temps (98.6/99.5/100.4/101) | 2x2 grid                                      |
| `QuickMedicineWidget`    | Log preset meds (Tylenol/Vit D)        | Vertical list                                 |
| `QuickPumpWidget`        | Log pump amounts (60/90/120ml)         | 1x3 grid                                      |
| `QuickSolidsWidget`      | Puree/Finger/Cereal                    | 1x3 grid with emojis                          |
| `QuickSymptomWidget`     | Cough/Runny/Rash/Fussy                 | 2x2 grid with emojis                          |

---

### 5.4 Log Input Forms (`/log/*`)

All log forms share a common wrapper with:

- `PageHeader` (title + back button)
- `GlassCard` form container
- Large, touch-friendly inputs
- "Log" `GlassButton` at bottom

| Route                       | Fields                                | Special Components                |
| --------------------------- | ------------------------------------- | --------------------------------- |
| `/log/activity`             | Activity type picker, duration, notes | `DurationPicker`                  |
| `/log/bottle`               | Amount slider, bottle type, notes     | `NumberStepper`                   |
| `/log/diaper`               | Type buttons, texture, color, notes   | `SegmentedControl`                |
| `/log/doctor-visit`         | Doctor name, clinic, notes            | `GlassInput`, `GlassTextarea`     |
| `/log/feed` (breastfeeding) | Side toggle, timer, notes             | `NursingTimer`                    |
| `/log/growth`               | Weight, Height, Head inputs           | `NumberStepper` with units        |
| `/log/medication`           | Med name, dosage, unit, frequency     | `GlassSelect`                     |
| `/log/pumping`              | Side, volume, duration                | `DurationPicker`, `NumberStepper` |
| `/log/sleep`                | Start/End time pickers, quality       | `TimeAgoPicker`, `QualityRating`  |
| `/log/solids`               | Food type, amount, reaction           | `ChipSelector`                    |
| `/log/symptom`              | Symptom type, severity, notes         | `SeveritySlider`                  |
| `/log/temperature`          | Degrees input, method                 | `TemperatureInput`                |
| `/log/vaccination`          | Vaccine name, batch, site             | `GlassInput`                      |

---

### 5.5 Tracking & Activity (`/tracking/*`)

#### 5.5.1 Tracking Overview (`/tracking`)

- **Current File**: `app/tracking/page.tsx` (670 lines)
- **Widgets**:
  - `MemoriesWidget`: Cycling photo preview
  - `MiniTimelineWidget`: Recent 8 events
  - `MilestonesWidget`: Achieved/Upcoming counts
  - `HealthWidget`: Symptoms/Meds/Vaccines counts
  - `GrowthWidget`: Latest measurements
  - `ActivityWidget`: Today's activity breakdown

#### 5.5.2 Timeline (`/tracking/timeline`)

- **Redesign**:
  - Vertical timeline with connected dots
  - Date grouping (Today, Yesterday, dates)
  - `FilterPills` at top (All, Feed, Sleep, Diaper, Activity)
  - Each event is a `TimelineItem` with icon, time, and glass card

#### 5.5.3 Activity Log (`/tracking/activity-log`)

- Dense table/list for data review
- Sortable columns (Type, Time, Details)
- Pagination

#### 5.5.4 Growth Charts (`/tracking/growth`)

- Interactive line charts (Weight, Height, Head)
- Percentile overlays
- Date range picker

#### 5.5.5 Health Summary (`/tracking/health`)

- Tabs: Symptoms | Medications | Vaccinations
- List views for each

#### 5.5.6 Activities (`/tracking/activities`)

- Filterable list of logged activities
- Category breakdown chart

---

### 5.6 Memories (`/memories`)

- **Redesign**:
  - Script-style "Memories" header
  - Search bar + filter icon
  - Masonry grid of `MemoryCard` components
  - FAB button to add new memory
  - Lightbox modal for full-screen view with:
    - Zoom/pan
    - Swipe navigation
    - Caption overlay

---

### 5.7 Calendar & Reminders

#### 5.7.1 Calendar (`/calendar`)

- Full interactive calendar (Day/Week/Month views)
- Events from reminders, medications, doctor visits
- Color-coded by type

#### 5.7.2 Reminders (`/reminders`)

- **Redesign** (per mock):
  - Grouped by time (Today, Tomorrow, Next Week)
  - `GlassCard` per reminder with checkbox
  - Emoji icons per type (stethoscope, medicine, teddy bear, syringe)
  - "Add Reminder" button at bottom

#### 5.7.3 Scheduled Reports (`/scheduled-reports`)

- Configure daily/weekly email digests
- PDF download settings

---

### 5.8 Insights & Reports

#### 5.8.1 AI Insights (`/insights`)

- `InsightCard` components for:
  - Anomalies
  - Patterns
  - Recommendations
  - Trends
  - Correlations
- Summary card at top

#### 5.8.2 Reports (`/report`)

- Date range picker
- Visual graphs (Sleep, Feeding, Diaper, Growth)
- PDF export button

---

### 5.9 Family (`/family`)

- List of caregivers/admins
- Role badges (Owner, Admin, Viewer)
- "Invite Caregiver" FAB
- Pending invitations banner

---

### 5.10 Health

#### 5.10.1 Health Hub (`/health`)

- Summary cards for Symptoms, Medications, Vaccinations
- Quick links to each sub-section

#### 5.10.2 Medications (`/health/medications`)

- Medicine tracker
- Schedule visualization
- "Add Medication" form

---

### 5.11 Milestones (`/milestones`)

- Categories: Motor, Cognitive, Social, Language
- Progress rings per category
- Achievable vs. Upcoming lists
- "Mark as Achieved" interaction

---

### 5.12 Settings (`/settings`)

#### 5.12.1 Settings Page Structure

- **Current**: 9 sections in 2-column grid
- **Redesign**: Same structure, but with `GlassCard` sections

#### 5.12.2 Settings Sections (9 Total)

| Section         | Content Component             | Modals                                                            |
| --------------- | ----------------------------- | ----------------------------------------------------------------- |
| Baby Profile    | `BabyProfileContent`          | `EditBabyProfileModal`, `DeleteBabyModal`                         |
| Your Account    | `UserAccountContent`          | `EditProfileModal`, `AccountSettingsModal`, `ChangePasswordModal` |
| Display         | `DisplaySettingsContent`      | `DisplaySettingsModal` (theme, font size)                         |
| Notifications   | `NotificationSettingsContent` | `NotificationSettingsModal`                                       |
| AI Providers    | `AiProviderSettingsContent`   | `AiProviderSettingsModal`                                         |
| AI Insights     | `AiInsightsSettingsContent`   | `AiInsightsSettingsModal`                                         |
| Data & Privacy  | `DataManagementContent`       | `DataManagementModal`                                             |
| Developer       | `ManageApiKeysContent`        | `ManageApiKeysModal`                                              |
| About & Support | `AboutSupportContent`         | `AboutSupportModal`                                               |

#### 5.12.3 Sub-Pages

- `/settings/profile`: Edit user profile
- `/settings/caregivers`: Manage caregiver permissions (`CaregiversManagementPage`)
- `/settings/password`: Change password

---

### 5.13 Modals (24 Identified)

All modals will be restyled with:

- `GlassCard` as the dialog panel
- Backdrop blur (`backdrop-blur-sm`)
- Slide-up animation on mobile (sheet style)
- Centered dialog on desktop

| Modal                          | Trigger                 |
| ------------------------------ | ----------------------- |
| `EditBabyProfileModal`         | Baby Profile section    |
| `DeleteBabyModal`              | Baby Profile section    |
| `EditProfileModal`             | User Account section    |
| `AccountSettingsModal`         | User Account section    |
| `ChangePasswordModal`          | User Account / Security |
| `DisplaySettingsModal`         | Display section         |
| `NotificationSettingsModal`    | Notifications section   |
| `AiProviderSettingsModal`      | AI Providers section    |
| `AiInsightsSettingsModal`      | AI Insights section     |
| `DataManagementModal`          | Data & Privacy section  |
| `ManageApiKeysModal`           | Developer section       |
| `AboutSupportModal`            | About section           |
| `InviteCaregiverModal`         | Family page             |
| `ManageCaregiversModal`        | Family page             |
| ... (and others as discovered) |

---

### 5.14 Shared Components (To Restyle)

| Component          | File                        | Redesign Notes                               |
| ------------------ | --------------------------- | -------------------------------------------- |
| `Card`             | `ui/card.tsx`               | Keep for legacy, new code uses `GlassCard`   |
| `Button`           | `ui/button.tsx`             | Keep for legacy, new code uses `GlassButton` |
| `Badge`            | `ui/badge.tsx`              | Glassmorphism variant                        |
| `Dialog`           | `ui/dialog.tsx`             | Glassmorphism overlay                        |
| `Select`           | `ui/select.tsx`             | Transparent glass style                      |
| `Input`            | `ui/input.tsx`              | Glass variant                                |
| `Skeleton`         | `ui/skeleton.tsx`           | Glass shimmer effect                         |
| `EmptyState`       | `ui/empty-state.tsx`        | Centered illustration                        |
| `TimerWidget`      | `ui/timer-widget.tsx`       | Circular progress with glass ring            |
| `ThemedDatePicker` | `ui/themed-date-picker.tsx` | Glass calendar popup                         |
| `TimeAgoPicker`    | `ui/time-ago-picker.tsx`    | Glass style                                  |
| `NumberStepper`    | `ui/number-stepper.tsx`     | Glass buttons                                |

---

### 5.15 Banners & Floating Components

| Component                  | File                           | Redesign Notes                |
| -------------------------- | ------------------------------ | ----------------------------- |
| `ActiveTimerBanner`        | `ActiveTimerBanner.tsx`        | Floating glass bar at top     |
| `NursingTimerBanner`       | `NursingTimerBanner.tsx`       | Same                          |
| `PendingInvitationsBanner` | `PendingInvitationsBanner.tsx` | Glass alert card              |
| `QuickLogFAB`              | `QuickLogFAB.tsx`              | Floating "+" button with glow |

---

## 6. Execution Batches

### Batch 1: Foundations

1. Create CSS variables in `globals.css`
2. Create `GlassCard`, `GlassButton`, `GlassInput`
3. Create `AppShell`, `DesktopSidebar`, `MobileNav`
4. Update `layout.tsx` to use `AppShell`

### Batch 2: Dashboard

1. Refactor `app/page.tsx` to use new components
2. Restyle all dashboard widgets (`AISummaryCard`, etc.)
3. Implement responsive Bento grid

### Batch 3: Quick Log

1. Refactor `app/log/page.tsx` widgets with `GlassCard`
2. Create shared `LogFormWrapper` for input pages
3. Apply to all `/log/*` pages

### Batch 4: Tracking & Activity

1. Restyle `/tracking/page.tsx` widgets
2. Implement new `TimelineItem` for `/tracking/timeline`
3. Update Growth charts with glass overlays

### Batch 5: Memories

1. Implement masonry grid with `GlassCard` image cards
2. Restyle Lightbox modal
3. Add search bar and filter

### Batch 6: Settings & Modals

1. Replace `Card` with `GlassCard` in all settings sections
2. Restyle all 24 modals with glass panels
3. Mobile sheet transition for modals

### Batch 7: Remaining Pages

1. Auth pages (Login, Signup)
2. Calendar, Reminders
3. Family, Health, Milestones, Insights, Reports

### Batch 8: Polish

1. Add page transition animations
2. Add loading skeletons with glass shimmer
3. Microinteractions (hover, active states)
4. Accessibility audit (contrast, focus rings)

---

## 7. Verification Plan

### 7.1 Automated Tests (Playwright)

- **Viewports**: iPhone 14, iPad Pro, Desktop 1920x1080, Ultra-wide 2560x1440
- **Flows**: Login → Dashboard → Log Feed → View Timeline → Settings → Logout

### 7.2 Manual Verification Checklist

#### Mobile

- [ ] Bottom nav visible and functional
- [ ] Cards take full width
- [ ] Touch targets ≥48px
- [ ] Safe area respected (notch, home indicator)
- [ ] Scrolling smooth, no overlap with nav

#### Tablet

- [ ] Sidebar appears (collapsed or expanded based on width)
- [ ] Grid adapts to 2-3 columns
- [ ] Modals centered, not full-screen

#### Desktop

- [ ] Sidebar expanded with labels
- [ ] Bento grid fills space elegantly
- [ ] No excessive whitespace

#### Aesthetics

- [ ] Backdrop blur renders correctly
- [ ] Gradient mesh is subtle and not distracting
- [ ] Text contrast passes WCAG AA
- [ ] Dark mode looks premium, not washed out

---

**End of Plan. Awaiting Approval to Begin Implementation.**
