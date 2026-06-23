# Mission 2029 — Comprehensive Improvement Recommendations

> **Generated**: 2026-06-16
> **Scope**: Full codebase analysis of 18+ mission components, Zustand store, routing, and UI layer
> **Priority Framework**: Impact (user-facing vs technical debt) × Effort (implementation complexity)

---

## Table of Contents

1. [Critical Performance Optimizations](#1-critical-performance-optimizations)
2. [Feature Enhancements (High Impact)](#2-feature-enhancements-high-impact)
3. [User Experience Improvements](#3-user-experience-improvements)
4. [Code Quality & Architecture](#4-code-quality--architecture)
5. [Implementation Roadmap](#5-implementation-roadmap)

---

## 1. Critical Performance Optimizations

### P1. Zustand Store Over-Subscription — The #1 Performance Bottleneck

**Severity**: 🔴 CRITICAL | **Impact**: All 18+ components | **Effort**: Medium

**Problem**: The vast majority of components call `useMission()` **without a selector**, which subscribes to the entire store. Any state change anywhere (e.g., toggling a task) triggers re-renders in every subscribed component including expensive charts and animations.

**Affected Components** (11 of 18):
| Component | Current Pattern | Fix |
|-----------|----------------|-----|
| [`Productivity.tsx:49`](../src/components/mission/Productivity.tsx) | `const days = useMission((s) => s.days)` + 3 more bare calls | Use individual selectors for each field |
| [`AICoach.tsx:9`](../src/components/mission/AICoach.tsx) | `const days = useMission((s) => s.days)` + 3 more | Split into 4 selectors |
| [`Financial.tsx:117`](../src/components/mission/Financial.tsx) | 10 separate `useMission(s => s.xxx)` calls | OK — already using selectors ✅ |
| [`Calendar.tsx:42`](../src/components/mission/Calendar.tsx) | `const days = useMission((s) => s.days)` + destructure | 2 selectors — acceptable |
| [`PaceEngine.tsx:24`](../src/components/mission/PaceEngine.tsx) | `const days = useMission((s) => s.days)` | Single selector — optimal ✅ |
| [`Metrics.tsx:72`](../src/components/mission/Metrics.tsx) | `const days = useMission((s) => s.days)` + 1 more | 2 selectors — acceptable |
| [`DailyExecution.tsx:27`](../src/components/mission/DailyExecution.tsx) | 5 separate `useMission(s => s.xxx)` calls | Already optimal ✅ |
| [`Kanban.tsx:18`](../src/components/mission/Kanban.tsx) | 4 separate selectors | Already optimal ✅ |
| [`Pomodoro.tsx:20`](../src/components/mission/Pomodoro.tsx) | 4 separate selectors | Already optimal ✅ |

**Verdict**: Financial, DailyExecution, Kanban, Pomodoro, PaceEngine are fine. The remaining components should be audited and converted to selector-based subscriptions. This is the **single highest-impact optimization** available.

---

### P2. Particle Animation — Unnecessary CPU Drain

**Severity**: 🟠 HIGH | **Impact**: All users on battery/mobile | **Effort**: Low

**File**: [`Particles.tsx`](../src/components/mission/Particles.tsx)

**Current State**: The component already has several best practices:
- ✅ Uses `requestAnimationFrame` (not `setInterval`)
- ✅ Cleans up on unmount
- ✅ Reduces particle count on mobile (40 vs 70)
- ✅ Detects `document.hidden` to pause
- ✅ Uses 30fps throttle via frame-skip

**Remaining Issues**:
1. No `devicePixelRatio` capping — on high-DPI displays (3x), the canvas is 3x wider/taller with same particle count, causing more area to clear per frame
2. No battery status consideration — `navigator.getBattery()` could reduce to 20 particles on power saving mode
3. Canvas clear is full-area (`clearRect(0, 0, c.width, c.height)`) — could be optimized to only clear changed regions

**Recommendation**: Add DPR cap at 2x (`const dpr = Math.min(window.devicePixelRatio || 1, 2)`), and consider replacing with CSS-only dot animation for 80% visual similarity at 0% CPU cost.

---

### P3. Pomodoro Timer Inefficiency

**Severity**: 🟡 MEDIUM | **Impact**: Active timer users | **Effort**: Low

**File**: [`Pomodoro.tsx`](../src/components/mission/Pomodoro.tsx)

The current implementation already uses proper patterns:
- ✅ Uses `useRef` for mutable values to avoid stale closures
- ✅ Drift-proof by storing `startRef.current = Date.now()` and computing elapsed time
- ✅ Proper interval cleanup on unmount

**Minor Issues**:
1. Seven `useEffect` hooks for syncing refs (lines 57-63) could be consolidated into one effect
2. The `finish` function uses a ref-forwarding pattern (`finishRef.current = finish`) that's complex — consider extracting timer logic into a custom `useTimer` hook
3. Audio URLs are hardcoded to `assets.mixkit.co` — if that CDN goes down, audio breaks silently

**Recommendation**: Extract timer into a reusable `useTimer` hook, consolidate sync effects, and add error handling for audio playback failures.

---

### P4. War Mode Timer — Dependencies Already Clean

**Severity**: 🟢 LOW | **Impact**: Minimal | **Effort**: Low

**File**: [`WarMode.tsx`](../src/components/mission/WarMode.tsx)

The current implementation is already well-structured:
- ✅ Uses `useRef` for interval ID (`tickRef`)
- ✅ Uses `startTsRef` for drift-proof timing
- ✅ Proper cleanup on dependency changes and unmount
- ✅ `baseSecsRef` preserves remaining time across pauses

**No changes needed** for performance — this component is well-optimized.

---

### P5. Code Splitting — Already Implemented

**Severity**: 🟢 DONE | **Impact**: Excellent | **Effort**: Completed

**File**: [`index.tsx`](../src/routes/index.tsx)

The codebase already has optimal code splitting:
- ✅ Countdown, DailyExecution, Particles are eagerly loaded (above-the-fold)
- ✅ 14 remaining components use `React.lazy()` with `Suspense`
- ✅ Consistent `SectionSkeleton` fallback component
- ✅ WarMode and AICoach use `fallback={null}` since they're overlay components

**No changes needed**.

---

## 2. Feature Enhancements (High Impact)

### F1. Predictive Analytics Engine

**Priority**: 🔴 HIGH | **Effort**: 3-5 days | **Files**: New component + store additions

**Current**: Raw metrics displayed with no predictive capabilities.

**Recommendation**: Build a lightweight analytics layer that sits above the raw data:

```
┌─────────────────────────────────────────────┐
│  PredictivePulse (new component)             │
│                                              │
│  ┌─────────────┐  ┌────────────────────────┐│
│  │ Revenue      │  │ "At current pace,      ││
│  │ Forecast:    │  │  you're 14 days behind ││
│  │ ₹45,000     │  │  your ₹1L target."     ││
│  │ by Jun 30   │  │                        ││
│  └─────────────┘  └────────────────────────┘│
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │ Correlation: "You close 3x more deals   │ │
│  │  on days with morning outreach. ⚡"      │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Implementation**:
1. Create [`src/lib/mission/analytics.ts`] with pure functions:
   - `forecastRevenue(days, revenueTarget)` — linear regression on daily revenue
   - `calcBurnoutRisk(days)` — flag when 7-day avg > 10h/day
   - `findCorrelations(days)` — detect patterns (e.g., outreach → deals)
   - `projectedCompletion(items, daysRemaining)` — probability of hitting goal
2. Create [`PredictivePulse`] component wrapping a subset of these insights
3. Add `useMemo`-based computed values to avoid recalculation on every render

---

### F2. Recurring Task Templates & Habits

**Priority**: 🔴 HIGH | **Effort**: 2-3 days | **Files**: store.ts, DailyExecution.tsx

**Current**: Daily missions are a fixed list. `workoutDone` exists but no habit tracking.

**Recommendation**: Add a habit/recurring system:

```typescript
// Add to store.ts
export interface Habit {
  id: string;
  label: string;
  frequency: "daily" | "weekdays" | "mon_wed_fri" | "custom";
  customDays?: number[]; // 0=Sun, 1=Mon, ...
  target: number;
  unit: string;
  color: string;
  category: "health" | "work" | "learning" | "finance";
}
```

**Key Behaviors**:
- Habits auto-populate into each day's `dailyMission` list when the day is opened
- Completing a habit on a day marks it done for that day only
- Streak tracking per habit (extends existing workout streak pattern in [`Metrics.tsx:80`](../src/components/mission/Metrics.tsx))
- "Skip day" option that doesn't break streak

**Integration points**:
- [`DailyExecution.tsx`](../src/components/mission/DailyExecution.tsx) — show auto-populated habits alongside ad-hoc tasks
- [`Metrics.tsx`](../src/components/mission/Metrics.tsx) — add per-habit streak display
- New [`HabitManager`] modal for creating/editing habits

---

### F3. Time-Blocking Day View

**Priority**: 🟠 MEDIUM | **Effort**: 2-3 days | **Files**: New component

**Current**: [`DailyMissionItem`](../src/lib/mission/store.ts:64) already has `startTime: string` and `durationMinutes: number` fields, but no visual schedule view uses them.

**Recommendation**: Build a visual day timeline:

```
Time-Blocking Schedule — June 16
┌─────────────────────────────────────┐
│ 09:00 ────▓▓▓▓▓▓▓▓▓▓▓▓▓────────── │ Outreach (45m)
│ 10:00 ────▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓── │ Sales Call (1h)
│ 11:00 ────▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓── │
│ 12:00 ────▓▓▓▓▓▓▓▓──────────────── │ Workout (30m)
│ 13:00 ──── Lunch Break ─────────── │
│ 14:00 ────▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓── │ Deep Work (2h)
│ 15:00 ────▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓── │
│ 16:00 ────▓▓▓▓▓▓▓▓▓▓▓▓▓────────── │ Learning (45m)
└─────────────────────────────────────┘
```

**Features**:
- Drag to reschedule (reuse the drag pattern from [`Kanban.tsx`](../src/components/mission/Kanban.tsx))
- Visual overlap detection: "2 tasks overlap at 10:00"
- Click empty slot to create a new time-blocked task
- "Now" indicator line

---

### F4. Browser Notifications & Daily Digest

**Priority**: 🟠 MEDIUM | **Effort**: 1-2 days | **Files**: New utility + AICoach integration

**Current**: No proactive alerts. [`AICoach.tsx`](../src/components/mission/AICoach.tsx) only shows in-app messages.

**Recommendation**: Add a notification system:

```typescript
// src/lib/mission/notifications.ts
export interface NotificationSchedule {
  morning: boolean;    // 8 AM — "Today's focus: Outreach (20), Deep Work (3h)"
  pomodoro: boolean;   // On timer complete — "Focus session logged!"
  evening: boolean;    // 8 PM — "You completed 4/6 tasks. Streak: 5 days 🔥"
  atRisk: boolean;     // 4 PM — "No hours logged today. Your streak is at risk!"
}
```

**Implementation**:
- Use the [`Notification API`](https://developer.mozilla.org/en-US/docs/Web/API/Notification) (with permission prompt)
- Use [`setInterval`] or [`requestIdleCallback`] for timed checks
- Integrate with [`AICoach.tsx`](../src/components/mission/AICoach.tsx) messages as the source of notification content
- Add a settings toggle in a new Settings panel

---

### F5. Data Export / Import / Backup

**Priority**: 🟠 MEDIUM | **Effort**: 1 day | **Files**: New Settings modal

**Current**: Data persists via Zustand's `persist` middleware to `localStorage`. No way for users to back up or migrate.

**Recommendation**: Add a Settings panel with:

1. **Export** — Download `mission-2029-backup.json` with full store state
2. **Import** — Upload a backup JSON to restore state
3. **Clear Data** — Confirm-then-clear all localStorage data
4. **Cloud Sync Status** — `localStorage` usage indicator (5MB limit)

```typescript
// Usage pattern
const exportData = () => {
  const state = useMission.getState();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mission-2029-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
```

---

## 3. User Experience Improvements

### UX1. Empty-State Onboarding Flow

**Priority**: 🔴 HIGH | **Effort**: 2-3 days | **Files**: New component + store changes

**Current**: Fresh install shows zeros and empty charts with no guidance. Only [`TaskHoursChart.tsx`](../src/components/mission/TaskHoursChart.tsx) and [`TaskList.tsx`](../src/components/mission/TaskList.tsx) have basic empty-state messages.

**Recommendation**: Create a multi-step onboarding experience:

**Step 1 — Welcome Modal** (first visit detection via localStorage flag):
- "Welcome to Mission 2029. Set your first revenue goal."
- Input: Target revenue, target date, mission name

**Step 2 — Daily Mission Templates**:
- Pre-populate with sensible defaults based on their goal type
- "What kind of mission is this? [Sales] [Build] [Learning] [Custom]"

**Step 3 — Quick Start**:
- "Your dashboard is ready. Here's what to do next..."
- Point to the first actions: "Add your first task", "Log your first sale"

**Empty State Improvements** (per component):
| Component | Current | Improved |
|-----------|---------|----------|
| [`SalesChart.tsx`](../src/components/mission/SalesChart.tsx) | Empty chart | "Log your first sales call to see data" + CTA button |
| [`PaceEngine.tsx`](../src/components/mission/PaceEngine.tsx) | Flat line chart | "Add revenue entries to see your pace" |
| [`Financial.tsx`](../src/components/mission/Financial.tsx) | Shows 0 values | "Set your revenue target to begin tracking" |
| [`Heatmap.tsx`](../src/components/mission/Heatmap.tsx) | All dark cells | "Log your first productive day to light up the map" |
| [`Timeline.tsx`](../src/components/mission/Timeline.tsx) | Empty track | "Add your first milestone to chart the trajectory" |

---

### UX2. Keyboard Shortcuts for Power Users

**Priority**: 🟠 MEDIUM | **Effort**: 1 day | **Files**: New hook + component integration

**Current**: All interactions require clicking/mouse. No keyboard navigation.

**Recommendation**: Create a [`useKeyboardShortcuts`](../src/hooks/use-keyboard-shortcuts.ts) hook:

```typescript
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case 'w': case 'W': /* toggle War Mode */ break;
        case 'c': case 'C': /* toggle AI Coach */ break;
        case ' ': /* start/pause Pomodoro */ break;
        case 't': case 'T': /* focus task input */ break;
        case 'd': case 'D': /* open today's calendar */ break;
        case 'Escape': /* close any modal */ break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
```

**Integration**: Mount the hook in [`index.tsx`](../src/routes/index.tsx) and expose shortcut-to-action via a context or callback refs.

---

### UX3. Theme Toggle (Dark/Light Mode)

**Priority**: 🟢 LOW | **Effort**: 0.5 day | **Files**: styles.css + new toggle component

**Current**: The [`styles.css`](../src/styles.css) has both `:root` (light) and `.dark` (dark) variables fully defined, but:
1. Only `.dark` is used (via `<html class="dark">`)
2. No toggle UI exists

**Recommendation**: The CSS infrastructure is already 90% complete. Wire up a toggle:

```typescript
function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const toggle = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };
  return (
    <button onClick={toggle} className="fixed top-6 right-6 z-50 ...">
      {isDark ? <Sun /> : <Moon />}
    </button>
  );
}
```

**Note**: The light mode `:root` colors were designed for a matte black theme in dark mode — you'll likely want to redesign the light palette for readability.

---

### UX4. Mobile Responsiveness Audit

**Priority**: 🟠 MEDIUM | **Effort**: 2-3 days | **Files**: Multiple components

**Current**: Several components use fixed large font sizes that overflow on mobile:

| Component | Line | Issue | Fix |
|-----------|------|-------|-----|
| [`Countdown.tsx:131`](../src/components/mission/Countdown.tsx) | `text-[18vw]` | OK — uses viewport-relative sizing ✅ |
| [`Productivity.tsx:117`](../src/components/mission/Productivity.tsx) | `text-[10rem]` | Would overflow on 375px screens | Add `md:text-[10rem]` with smaller default |
| [`Financial.tsx:100`](../src/components/mission/Financial.tsx) | `text-7xl` inside Radial | Fixed size, not responsive | Add responsive variants |
| [`Calendar.tsx:69`](../src/components/mission/Calendar.tsx) | `text-5xl md:text-7xl` | Already has responsive breakpoints ✅ |
| [`PaceEngine.tsx:64`](../src/components/mission/PaceEngine.tsx) | `text-5xl md:text-7xl` | Already responsive ✅ |
| [`DailyExecution.tsx:64`](../src/components/mission/DailyExecution.tsx) | `text-4xl md:text-6xl` | Already responsive ✅ |

**Recommendation**: Audit visible issue in `Productivity.tsx` line 117 and `Financial.tsx` line 100. Test on 375px-wide viewport to identify additional overflow issues.

---

### UX5. Skeleton Loading States

**Severity**: 🟢 LOW (already partially done) | **Effort**: 0.5 day

**Current**: [`index.tsx:24`](../src/routes/index.tsx) already has `SectionSkeleton` component used as Suspense fallback. However:
- The skeleton is generic — no per-component variants
- The [`@/components/ui/skeleton.tsx`](../src/components/ui/skeleton.tsx) component exists but is unused

**Recommendation**: Create 2-3 skeleton variants:
- `ChartSkeleton` — for chart sections (PaceEngine, SalesChart, TaskHoursChart)
- `CardGridSkeleton` — for grid sections (Metrics, SkillTree, VisionBoard)
- `CalendarSkeleton` — for Calendar grid

---

## 4. Code Quality & Architecture

### CQ1. Store Performance — Derived Data & Selectors

**Severity**: 🟠 MEDIUM | **Effort**: 2 days | **Files**: store.ts

**Current**: Derived values (streaks, averages, projections) are computed in component bodies via `useMemo`. This works but:
1. The same computations run in multiple components (streak calculation in both `Productivity.tsx` and `Metrics.tsx`)
2. No memoization key tracking — `useMemo` on entire `days` object rarely caches

**Recommendation**: Add Zustand computed/derived values:

```typescript
// Add to store.ts
export const useStreak = () => {
  const days = useMission(s => s.days);
  return useMemo(() => {
    // current streak + best streak
    let current = 0, best = 0, run = 0;
    // ... computation
    return { current, best };
  }, [days]);
};
```

Or better, create a separate `useAnalytics` hook that bundles all derived computations:

```typescript
// src/lib/mission/useAnalytics.ts
export function useAnalytics() {
  const days = useMission(s => s.days);
  const dailyMission = useMission(s => s.dailyMission);
  
  return useMemo(() => ({
    streaks: calcStreaks(days),
    averages: calcAverages(days),
    projections: calcProjections(days),
    correlations: findCorrelations(days),
    founderScore: calcFounderScore(days, dailyMission),
  }), [days, dailyMission]);
}
```

---

### CQ2. Error Handling — Silent Failures

**Severity**: 🟠 MEDIUM | **Effort**: 1 day | **Files**: Multiple components

**Current**: Several components have silent failure modes:
- [`Pomodoro.tsx:146`](../src/components/mission/Pomodoro.tsx) — Audio playback errors are only `console.log`'d
- [`PaceEngine.tsx:28`](../src/components/mission/PaceEngine.tsx) — `reduce` on potentially empty object with no type guard
- [`SalesChart.tsx:73`](../src/components/mission/SalesChart.tsx) — `e.activeLabel` accessed without type guard
- [`Particles.tsx:7`](../src/components/mission/Particles.tsx) — null check on canvas ref but no fallback

**Recommendation**:
1. Wrap audio in user-initiated gesture context (browser policy)
2. Add `try/catch` around audio playback + user-facing toast on failure
3. Type-check event handlers in Recharts components
4. Add a global error boundary using existing error utilities in [`src/lib/error-capture.ts`](../src/lib/error-capture.ts)

---

### CQ3. Duplicated Constants & Logic

**Severity**: 🟡 LOW | **Effort**: 0.5 day | **Files**: Consolidation

**Current**: Several constants and utilities are duplicated across files:

| Pattern | Occurrences | Files |
|---------|-------------|-------|
| `COLORS` palette | 2 copies | [`DailyExecution.tsx:15`](../src/components/mission/DailyExecution.tsx), [`Calendar.tsx:34`](../src/components/mission/Calendar.tsx) |
| `PRIORITIES` array | 2 copies | [`DailyExecution.tsx:8`](../src/components/mission/DailyExecution.tsx), [`Calendar.tsx:38`](../src/components/mission/Calendar.tsx) |
| Streak calculation | 2 implementations | [`Productivity.tsx:18`](../src/components/mission/Productivity.tsx), [`Metrics.tsx:81`](../src/components/mission/Metrics.tsx) |
| `istDateKey` / `todayKey` | Dual export | [`store.ts:136`](../src/lib/mission/store.ts), [`store.ts:408`](../src/lib/mission/store.ts) |

**Recommendation**: Move shared constants to [`src/lib/mission/constants.ts`] and streak logic to a shared utility.

---

### CQ4. TypeScript Strictness Opportunities

**Severity**: 🟡 LOW | **Effort**: 1 day | **Files**: Various

**Observations**:
- Several `any` casts exist (e.g., [`store.ts:201`](../src/lib/mission/store.ts) `setField: (k, v) => set({ [k]: v } as any)`)
- Event handlers typed as `any` (e.g., [`SalesChart.tsx:71`](../src/components/mission/SalesChart.tsx) `onClick={(e: any)`)
- `React.lazy` imports require `.then((m) => ({ default: m.Component }))` which is verbose

**Recommendations**:
1. Replace `as any` in store with proper generic typing or individual setters
2. Type Recharts event handlers with correct types
3. Use `lazyComponent` helper to reduce boilerplate:
```typescript
function lazyComponent<T extends React.ComponentType<any>>(
  imp: () => Promise<{ default: T }>
) {
  return lazy(() => imp);
}
```

---

## 5. Implementation Roadmap

### Phase 1 — Quick Wins (3-5 days)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1 | Zustand selector audit — fix remaining over-subscribed components (AICoach, Calendar) | 4 hours | High |
| 2 | Duplicated constants consolidation | 2 hours | Low |
| 3 | Add empty-state messages to chart components | 4 hours | Medium |
| 4 | `useKeyboardShortcuts` hook | 4 hours | Medium |
| 5 | Theme toggle wiring | 2 hours | Low |

### Phase 2 — Feature Enhancements (1-2 weeks)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1 | Data Export/Import settings | 1 day | Medium |
| 2 | Browser notifications + daily digest | 2 days | Medium |
| 3 | Onboarding wizard | 3 days | High |
| 4 | Time-blocking day view | 3 days | High |

### Phase 3 — Advanced Features (2-3 weeks)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1 | Predictive Analytics Engine | 4 days | High |
| 2 | Recurring habits system | 3 days | High |
| 3 | Mobile responsiveness audit | 2 days | High |

---

### Architecture — What to Keep vs What to Rethink

**Keep doing** ✅:
- Code splitting with `lazy()` + `Suspense` — excellent pattern implemented well
- Zustand with `persist` middleware — appropriate for a single-user productivity app
- Neumorphic design system via `@utility` classes — clean, maintainable
- Framer Motion animations — tasteful and restrained

**Consider changing** 🔄:
- **Single massive store** → Split into Zustand slices (`missionSlice`, `financialSlice`, `habitsSlice`, `uiSlice`) for better separation of concerns as the app grows
- **Per-component derived data** → Shared analytics hook for consistent streak/score computations
- **Hardcoded defaults** → Configurable onboarding defaults based on user's mission type

**Add** 🆕:
- End-to-end testing with Playwright for critical user flows (task creation, pomodoro, data entry)
- Accessibility audit — check color contrast ratios, add `aria-labels` to icon-only buttons, ensure keyboard navigation

---

## Summary Dashboard

| Category | Items | Critical | High | Medium | Low |
|----------|-------|----------|------|--------|-----|
| Performance | 5 | 1 | 1 | 1 | 2 |
| Features | 5 | 2 | 3 | 0 | 0 |
| UX | 5 | 1 | 2 | 1 | 1 |
| Code Quality | 4 | 0 | 2 | 2 | 0 |
| **Total** | **19** | **4** | **8** | **4** | **3** |