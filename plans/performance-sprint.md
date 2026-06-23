# Performance Sprint — Implementation Plan

## Goal
Eliminate wasteful re-renders, reduce CPU usage, and improve initial load time.

---

## 1. Zustand Selectors — Stop Full-Store Subscriptions

**Problem**: 13+ components call `useMission()` which subscribes to **every state change**.

**Strategy**: Replace each bare call with precise selectors.

### File-by-file changes:

| File | Current | Fix |
|------|---------|-----|
| [`AICoach.tsx:9`](../src/components/mission/AICoach.tsx) | `const m = useMission()` | `const days = useMission(s => s.days)`, `const dailyMission = useMission(s => s.dailyMission)`, etc. |
| [`Productivity.tsx:50`](../src/components/mission/Productivity.tsx) | `const m = useMission()` | Split into 4-5 precise selectors |
| [`Calendar.tsx:42`](../src/components/mission/Calendar.tsx) | `const { days, selectedDate } = useMission()` | `const days = useMission(s => s.days)`, `const selectedDate = useMission(s => s.selectedDate)` |
| [`Financial.tsx:118`](../src/components/mission/Financial.tsx) | `const m = useMission()` | Select only `days`, `currentRevenue`, `revenueTarget`, etc. as needed |
| [`PaceEngine.tsx:24`](../src/components/mission/PaceEngine.tsx) | `const m = useMission()` | Select `days` only |
| [`SalesChart.tsx:18`](../src/components/mission/SalesChart.tsx) | `const { days, upsertDay } = useMission()` | Select `days`, `upsertDay` separately |
| [`TaskHoursChart.tsx:50`](../src/components/mission/TaskHoursChart.tsx) | `const { days } = useMission()` | Select `days` only (ok but verify) |
| [`Pomodoro.tsx:20`](../src/components/mission/Pomodoro.tsx) | `const { selectedDate, days, ... } = useMission()` | Split into individual selectors |
| [`Kanban.tsx:18`](../src/components/mission/Kanban.tsx) | `const { selectedDate, days, ... } = useMission()` | Split |
| [`DailyExecution.tsx:27`](../src/components/mission/DailyExecution.tsx) | `const { selectedDate, days, ... } = useMission()` | Split |
| [`TaskList.tsx:42`](../src/components/mission/TaskList.tsx) | `const { days, addTask, ... } = useMission()` | Split |
| [`WarMode.tsx:20`](../src/components/mission/WarMode.tsx) | `const { dailyMission, ... } = useMission()` | Already relatively specific, but can improve |
| [`Heatmap.tsx:31`](../src/components/mission/Heatmap.tsx) | `const { days } = useMission()` | OK |
| [`Metrics.tsx:72`](../src/components/mission/Metrics.tsx) | `const m = useMission()` | Split |
| [`Timeline.tsx:10`](../src/components/mission/Timeline.tsx) | `const { milestones, ... } = useMission()` | Already using destructuring which is OK |

**⚠️ Critical Pattern**: Destructuring is fine, but calling `useMission()` without a selector subscribes to the **entire** store. Every component must use at least one selector.

---

## 2. Particle Animation Optimization

**File**: [`src/components/mission/Particles.tsx`](../src/components/mission/Particles.tsx)

**Changes**:
1. Add `visibilitychange` listener — pause animation when tab hidden
2. Lower particle count on mobile (40 vs 70)
3. Throttle to 30fps using frame-skip counter
4. Clean up all listeners on unmount

---

## 3. Pomodoro Timer Fix

**File**: [`src/components/mission/Pomodoro.tsx`](../src/components/mission/Pomodoro.tsx)

**Changes**:
1. Reduce interval from 250ms to 1000ms
2. Fix the `react-hooks/exhaustive-deps` suppression (line 66) by properly structuring the `finish` function with `useCallback` / `useRef`
3. Extract timer logic into a reusable `useTimer` hook

---

## 4. War Mode Timer Fix

**File**: [`src/components/mission/WarMode.tsx`](../src/components/mission/WarMode.tsx)

**Changes**:
1. Use `useRef` for interval ID to prevent stale closures
2. Ensure proper cleanup when `running` toggles
3. Fix timer drift by storing `startTimestamp` and computing elapsed, rather than decrementing

---

## 5. Code Splitting (Lazy Loading)

**File**: [`src/routes/index.tsx`](../src/routes/index.tsx)

**Changes**:
1. Wrap each major component section with `React.lazy()` + Suspense
2. Create simple skeleton fallbacks for each section
3. Group components into chunks: "above-fold" (Countdown, DailyExecution) stays eager, everything else lazy

---

## Implementation Order

| Step | Task | Effort | Files Affected |
|------|------|--------|----------------|
| 1 | Zustand selectors (all components) | 2-3 hours | 15+ component files |
| 2 | Particles optimization | 30 min | `Particles.tsx` |
| 3 | Pomodoro timer fix | 45 min | `Pomodoro.tsx` |
| 4 | War Mode timer fix | 20 min | `WarMode.tsx` |
| 5 | Code splitting | 1 hour | `index.tsx`, maybe a shared `SkeletonSection` component |