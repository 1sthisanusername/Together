# Together

A private two-person app for long-distance couples. Built with Expo SDK 58, React Native, TypeScript (strict), Expo Router, and Supabase.

## Tech Stack
- **App**: Expo SDK 58 (React Native) + TypeScript (strict)
- **Navigation**: Expo Router (file-based navigation with 5 bottom tabs)
- **Backend & Auth**: Supabase (Postgres, Auth, Realtime, Storage, Edge Functions)
- **Server State**: TanStack Query (with Supabase Realtime synchronization)
- **Client State**: Zustand (for session and lightweight UI state)
- **Forms & Validation**: React Hook Form + Zod
- **Drawing Game**: Interactive touch canvas with live event broadcasting
- **i18n**: i18next + react-i18next (all user-facing strings translated from day one)
- **Analytics & Push**: Provider abstraction layer (`src/services/`)

## Architecture & Directory Structure
```
src/
  app/                 # Expo Router screens only (thin wrappers)
    (auth)/            # Auth stack: login, signup, reset-password, pair
    (tabs)/            # 5 Core Bottom Tabs: home, play, dates, memories, us
    session/[id].tsx   # Shared Activity Room
    settings.tsx       # Profile & account settings
  features/
    auth/              # Login, Sign Up, Password Reset
    couple/            # Couple Creation, Partner Invite & Accept, Unlink
    home/              # Home dashboard: Anniversary counter, Timezone clocks, Quick actions
    activities/        # Activity catalogue, filter tabs, activity registry
    sessions/          # Live/async session engine, idempotency, game renderers
    letters/           # "Open When" letters, server-side unlocking, sealed envelopes
    memories/          # Photo journal & session highlights
    us/                # Shared bucket list, next reunion countdown, important dates
    settings/          # Profile updates, timezone selection, quiet hours, unlinking
  shared/
    ui/                # Shared UI kit (Button, Card, Avatar, Input, EmptyState, Sheet, etc.)
    hooks/             # Shared hooks
    lib/               # Timezone, date, and math utilities
    types/             # Generated database types & domain types
    i18n/              # Translation dictionaries & configuration
  services/            # Abstracted SDK interfaces (Supabase, Analytics, Push)
supabase/
  migrations/          # SQL migrations with RLS policies, triggers, and RPCs
  functions/           # Supabase Edge Functions
  seed/                # Seed catalogue with 20+ activities
  tests/               # Database policy tests (pgTAP)
docs/
  DECISIONS.md         # Architecture Decision Records (ADRs 001 through 009)
```

## MVP Scope & Features Implemented

### 1. Auth & Partner Linking
- Sign up, login, and password reset with Zod validation.
- Atomic couple creation with 6-character, 48-hour single-use invite codes.
- Two-member constraint strictly enforced in the database (`check_couple_member_limit`).
- Real-time partner link detection and seamless transition to Home.

### 2. Home Tab
- Couple profile header with anniversary & days together counter (`couples.start_date`).
- Partner's local time & daylight status badge (awake / likely sleeping indicator).
- Dual time-zone clocks with hour difference calculation.
- Live active session banner to jump directly into ongoing activities.
- Quick connect actions (Play, Date, Write Letter).

### 3. Play Tab & Activity Registry
- Plugin registry (`src/features/activities/registry.ts`) mapping activity kinds to renderers.
- Generic session and append-only event log with client-generated `idempotency_key`.
- 20+ seeded activities across games, quizzes, challenges, and dates.

### 4. 4 Games + Quizzes
- **Would You Rather**: Dilemma choices with server-enforced blind answer reveals.
- **Who Knows Whom Better**: Partner trivia and observation questions with reveal cards.
- **Guess My Answer**: Multiple-choice prediction and alignment check.
- **Drawing & Guessing**: Touch canvas capturing stroke events, live guess input, and instant evaluation.
- **Quizzes & Deep Talk**: Free-text and multi-choice discussions.
- **Save as Memory**: User choice to save completed activity sessions to their journal.

### 5. Dates Tab & Guided Experiences
- Step-by-step guided virtual dates: Candlelit Dinner, Synced Movie Night, Stargazing, Book Club.
- Synced step countdown timers and discussion prompts.
- "Open When" Letters gallery: write new letters, sealed envelope status, and server-side unlock date validation (`open_letter`).

### 6. Memories Tab
- Private couple photo journal.
- Filterable memory cards with favorites and dates.
- Manual memory creation with date selector and notes.

### 7. Us Tab
- Countdown timer to next reunion trip with days remaining.
- Shared interactive bucket list (add items, check off dreams).
- Important dates and milestones tracker.

### 8. Settings & Privacy
- Profile updates (display name, timezone).
- Quiet hours notification controls.
- Safe couple unlink flow.
- Zero analytics tracking of private message content or answers.

## Running Tests
```bash
npm test
```
All 28 unit and integration tests pass cleanly:
- `tests/auth-couple.test.ts` (14 tests)
- `tests/timezone.test.ts` (4 tests)
- `tests/activities-sessions.test.ts` (10 tests)

## Running Typecheck
```bash
npx tsc --noEmit
```
Compiles with 0 TypeScript errors under strict mode.

## Starting the App
```bash
npm start
```
