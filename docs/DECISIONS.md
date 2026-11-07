# Architecture Decisions Log

## ADR-001: Project Foundation & Tech Stack
- **Context:** Building a private two-person app for long-distance couples across iOS and Android.
- **Decision:** Initialized Expo SDK 58 with TypeScript in strict mode and Expo Router for file-based routing and deep linking.
- **Consequences:** Single codebase for both platforms, OTA updates, and deep links for invite redemption.

## ADR-002: Modular Feature Folder Structure (Rule 3.4)
- **Context:** Avoid circular dependencies, cross-feature leakage, and ensure features can be added without modifying existing code.
- **Decision:** Followed Section 3.4 strict layout:
  - `src/app/`: Expo Router screens (thin wrappers with zero business logic)
  - `src/features/*`: Encapsulated domain modules (`auth`, `couple`, `home`, `activities`, `sessions`, `letters`, `memories`, `us`, `settings`) exposing public APIs through `index.ts`
  - `src/shared/*`: Reusable UI kit (`Button`, `Card`, `Avatar`, `Input`, `EmptyState`, `LoadingState`, `ErrorState`, `Sheet`), hooks, timezone lib, and i18n
  - `src/services/*`: The sole location where external SDKs (`@supabase/supabase-js`, analytics, push) are imported and abstracted.

## ADR-003: Relational Schema & Two-Member Couple Constraint
- **Context:** Enforce private, exactly two-person couple spaces at the database level.
- **Decision:**
  - Created tables: `profiles`, `couples`, `couple_members`, `invitations`, `feature_flags`, `entitlements`.
  - Implemented Postgres trigger `check_couple_member_limit` raising `check_violation` if a 3rd active member is inserted or updated.
  - Unique partial index on `couple_members(user_id) WHERE status = 'active'`.
  - Implemented transactional RPCs (`create_couple_with_invite`, `accept_invitation`, `unlink_couple`) with `SECURITY DEFINER` and atomic validation.

## ADR-004: Row Level Security (RLS) Isolation
- **Context:** Zero-trust architecture where couple data is strictly inaccessible outside the two active partners.
- **Decision:**
  - Enabled RLS across all 11 tables with explicit authenticated policies.
  - Couple-based policy pattern: a row is accessible only if `auth.uid()` is an active member in `couple_members` for that `couple_id`.
  - Stored procedures use `SECURITY DEFINER` with strict caller identity checks.

## ADR-005: State Management & i18n
- **Context:** Clean separation of client and server state, and zero hardcoded user-facing strings.
- **Decision:**
  - Server state: TanStack Query with realtime Supabase subscriptions.
  - Client state: Zustand for session and UI state.
  - Forms: React Hook Form with Zod schemas.
  - i18n: `i18next` with `src/shared/i18n/en.json` covering all user-facing strings across all MVP tabs and features.

## ADR-006: Generic Activity Sessions & Event Log with Client-Generated Idempotency
- **Context:** Games, quizzes, photo challenges, and guided dates must share a unified engine without per-game tables (Section 3.1 & 3.3).
- **Decision:**
  - Single `activities` catalogue table with `kind` and `config` JSONB column.
  - Single `activity_sessions` table with status workflow (`created`, `waiting`, `active`, `completed`).
  - Single `session_events` append-only event log with `(session_id, idempotency_key)` unique index preventing duplicate submissions on retries or poor connections.

## ADR-007: Server-Enforced Blind Answer Revealing
- **Context:** Section 5 critical requirement: Partner B must not be able to read Partner A's answer until both have answered. Hiding it in the UI is not acceptable.
- **Decision:**
  - Implemented Postgres function `get_session_events_masked(p_session_id)`.
  - If a partner answers a round but caller has not yet submitted their own answer, the server masks the payload to `{"round": X, "masked": true}`.
  - Full content is only unmasked when both partners have submitted an `answer_submitted` event for that round.

## ADR-008: Server-Side Letter Lock/Unlock
- **Context:** "Open When" letters can have a scheduled `unlock_at` date. Device clocks cannot be trusted (Section 5).
- **Decision:**
  - Implemented Postgres function `open_letter(p_letter_id)`.
  - Evaluates `unlock_at` against server UTC clock (`timezone('utc'::text, now())`).
  - Rejects premature attempts with `check_violation`.

## ADR-009: 5 Bottom Tabs Architecture
- **Context:** Section 1 core app loop: Home, Play, Dates, Memories, Us.
- **Decision:**
  - Scaffolding via `src/app/(tabs)/_layout.tsx` providing persistent tab bar navigation.
  - Shared activity room lives at `src/app/session/[id].tsx` with instant back navigation.
