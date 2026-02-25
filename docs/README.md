# Habit Tracker App

## Overview

A simple, intuitive habit tracking application that helps users build and maintain good habits through daily check-ins. Users can create habits, mark them as complete each day, view their completion streaks, and track their progress over time.

**Target Users**: Individuals looking to establish consistent routines, track personal goals, and visualize their progress over time.

## Features

### F1: Habit Management
- Create new habits with custom names
- Delete habits they no longer want to track
- View all habits in a clean list
- **Acceptance Criteria**:
  - User can add a habit with a name (required, max 50 characters)
  - User can delete a habit with confirmation
  - Habits are displayed in a scrollable list
  - Empty state shown when no habits exist

### F2: Daily Completion Tracking
- Mark habits as complete/incomplete for the current day
- Visual indicator showing completion status
- Toggle completion with a single click
- **Acceptance Criteria**:
  - Clicking a habit toggles its completion status
  - Completed habits show visual checkmark and styling
  - Toggle updates immediately without page refresh
  - Current day is prominently displayed

### F3: Progress & Streaks
- View current streak for each habit (consecutive days completed)
- Visual progress indicator for the week
- **Acceptance Criteria**:
  - Streak count increases when completing habit consecutive days
  - Streak resets to 0 when a day is missed
  - Week view shows last 7 days of completion
  - Streak displayed with flame icon/emoji

### F4: Weekly Overview
- See completion history for the past week
- Quick visual of which days had activity
- **Acceptance Criteria**:
  - Each habit shows 7-day completion grid
  - Days with completion shown in accent color
  - Days without completion shown in muted color
  - Current day is visually distinct

## Data Model

### Entity: Habit
| Field | Type | Description |
|-------|------|-------------|
| name | text (required) | The habit name |
| color | text | Color theme for the habit (optional, defaults to blue) |
| created_at | date (auto) | When habit was created |
| updated_at | date (auto) | Last update timestamp |

### Entity: HabitCompletion
| Field | Type | Description |
|-------|------|-------------|
| habit_id | relation → Habit (required) | The habit this completion is for |
| completed_date | date (required) | Date of completion (normalized to midnight) |
| created_at | date (auto) | When completion was recorded |

**Relationships**:
- Habit → has many → HabitCompletion (one-to-many)
- HabitCompletion → belongs to → Habit (many-to-one)

**Notes**:
- One completion per habit per day
- Completions are stored as boolean per day
- Streaks calculated on-the-fly from completion history
- Deleting a habit cascades and deletes all completions

## Auth Strategy

**Simple Auth** — The app uses built-in authentication.

- Users sign up with email and password
- Each user sees only their own habits
- User authentication handled via Vibexe SDK
- No roles needed — single user type

**Getting Started**: Sign up with any email and password (8+ characters) to create your first account. There are no default credentials — every user registers through the app.

## Component Architecture

```
App (root)
├── AuthProvider (auth context wrapper)
│   ├── LoginPage (if not authenticated)
│   │   ├── SignUpForm
│   │   └── SignInForm
│   └── HabitTracker (main app)
│       ├── Header (app title, user menu, logout)
│       ├── AddHabitForm (input + button for new habits)
│       ├── HabitList
│       │   └── HabitItem (repeated)
│       │       ├── HabitHeader (name, streak, delete)
│       │       ├── DailyToggle (today's completion checkbox)
│       │       └── WeekGrid (7-day history visualization)
│       └── EmptyState (shown when no habits)
```

**Component Responsibilities**:
- **App**: Root component, handles auth routing
- **AuthProvider**: Manages auth state, provides user context
- **LoginPage**: Toggle between sign up/sign in
- **HabitTracker**: Main container, manages habit data
- **AddHabitForm**: Controlled input, validation
- **HabitList**: Renders list of HabitItem components
- **HabitItem**: Display single habit with all sub-components
- **DailyToggle**: Checkbox for today's completion
- **WeekGrid**: Visual 7-day completion history
- **EmptyState**: Friendly message when starting fresh

## File Map

| Order | File | Purpose | Dependencies |
|-------|------|---------|--------------|
| 1 | src/types/index.ts | TypeScript interfaces (Habit, HabitCompletion, etc.) | None |
| 2 | src/utils/date.ts | Date formatting, date utilities | None |
| 3 | src/utils/streaks.ts | Streak calculation logic | date.ts |
| 4 | src/hooks/useAuth.ts | Auth state management | @vibexe/sdk |
| 5 | src/hooks/useHabits.ts | CRUD operations for habits | @vibexe/sdk, types |
| 6 | src/hooks/useCompletions.ts | Completion tracking operations | @vibexe/sdk, types |
| 7 | src/components/HabitForm.tsx | Add new habit form | None |
| 8 | src/components/WeekGrid.tsx | 7-day completion visualization | date.ts |
| 9 | src/components/HabitItem.tsx | Single habit display | WeekGrid, DailyToggle |
| 10 | src/components/HabitList.tsx | List of habits | HabitItem |
| 11 | src/components/EmptyState.tsx | Empty state UI | None |
| 12 | src/components/LoginPage.tsx | Sign up / Sign in | useAuth |
| 13 | src/components/Header.tsx | App header with user menu | useAuth |
| 14 | src/App.tsx | Root component, routing | All above |

## UX Flows

### Onboarding Flow
1. User opens app → sees Sign Up form (default view)
2. User enters email + password → account created
3. App shows empty state: "Welcome! Create your first habit to get started"
4. User adds first habit → appears in list
5. User can immediately mark today's habit as complete

### Daily Usage Flow
1. User opens app → sees today's habits
2. User clicks checkbox → habit marked complete, streak updates
3. User views week grid → sees weekly progress pattern
4. User adds new habit → appears at top of list
5. User deletes old habit → confirmation shown, then removed

### Empty States
- **No habits yet**: "No habits yet. Create your first habit above to start building consistency!"
- **No completions this week**: Show empty week grid (all circles gray)
- **No user (auth)**: Show login/signup form

### Loading States
- **Loading habits**: Skeleton cards or spinner in list area
- **Toggling completion**: Immediate visual feedback, sync in background
- **Adding habit**: Button shows loading spinner, disabled during submit
- **Auth check**: Brief splash/loading while checking session

### Error States
- **Auth error**: Display error message below form, allow retry
- **Network error**: Toast notification, keep current state optimistic
- **Validation error**: Inline field error (e.g., "Habit name is required")
- **Delete confirmation**: Modal asking "Delete [habit name]? This cannot be undone."

## Technical Notes

### Date Handling
- All dates stored in UTC, midnight normalized
- Client-side display in user's local timezone
- Streak calculation considers calendar days, not 24-hour periods

### Real-time Updates
- Using Vibexe SDK subscriptions for multi-device sync
- Changes on one device reflect immediately on others

### Performance
- Optimistic UI updates for toggles
- Debounced habit creation input
- Virtual scrolling not needed (small list expected)

### Color Themes
Each habit can have one of the following colors:
- Blue (default) — `bg-blue-500`
- Green — `bg-green-500`
- Purple — `bg-purple-500`
- Orange — `bg-orange-500`
- Pink — `bg-pink-500`

---

## Getting Started

Sign up with any email and password (8+ characters) to create your first account. There are no default credentials — every user registers through the app.

After sign up:
1. Click in the input field at the top
2. Type a habit name (e.g., "Drink 8 glasses of water")
3. Click "Add Habit" or press Enter
4. Your new habit appears in the list
5. Click the circle next to today's date to mark it complete
6. Watch your streak grow as you check in daily!
