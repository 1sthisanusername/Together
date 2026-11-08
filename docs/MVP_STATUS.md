# MVP Status Tracking

> **Rule:** Every item from Section 4 of the Master Build Prompt is tracked below. All statuses reflect real verification from the test suite and source inspection.

| ID | Item | Status | Evidence | Last verified |
| --- | --- | --- | --- | --- |
| **A1** | Project setup | `Done` | Expo + TS strict (0 errors on `tsc --noEmit`), 8 migrations in `supabase/migrations/`, Vitest test runner. | 2026-11-08 |
| **A2** | Authentication | `Done` | Google-only sign-in with `@react-native-google-signin/google-signin` and `supabase.auth.signInWithIdToken`, single-button welcome screen, removed legacy email/password screens, sign out clears session and cache. Verified in `tests/gate7-google-signin.test.ts`. | 2026-11-08 |
| **A3** | Profile and time zone | `Done` | Searchable IANA list with UTC offsets, auto-detect device zone, partner local time on Home, verified in `tests/timezone.test.ts`. | 2026-11-08 |
| **A4** | Couple creation and partner linking | `Done` | 48h invite code, max 2 active members database trigger, prevent join full couple, verified in `tests/auth-couple.test.ts` & `tests/security-audit.test.ts`. | 2026-11-08 |
| **A5** | Couple state routing and unlinking | `Done` | Atomic `unlink_couple` RPC, RLS disconnect, realtime partner redirect, cache clearing, verified in `tests/couple-routing-unlink.test.ts`. | 2026-11-08 |
| **A6** | Security baseline tests | `Done` | 14 security audit tests verify cross-couple isolation, partner secrecy, and zero secret leakage in `tests/security-audit.test.ts`. | 2026-11-08 |
| **B1** | Home ("Our World") | `Done` | Single vertical ScrollView with dynamic bottomPadding (`tabBarHeight + insets.bottom`), partner profile, local time, verified in `tests/gate4-tab-scrolling.test.ts`. | 2026-11-08 |
| **B2** | Together since and anniversary | `Done` | `couples.start_date` DATE column, client-side same-day calculation, milestone alerts, verified in `tests/anniversary-and-keyboard.test.ts`. | 2026-11-08 |
| **B3** | Us tab | `Done` | Clean native ScrollView with `keyboardShouldPersistTaps="handled"`, dynamic bottom padding, zero nested vertical scrollers, verified in `tests/gate4-tab-scrolling.test.ts`. | 2026-11-08 |
| **C1** | Activity catalogue | `Done` | 27 seeded activities across 7 categories in `supabase/seed/activities.sql`, client activity registry in `registry.ts`. | 2026-11-08 |
| **C2** | Sessions and Shared Activity Room | `Done` | `ActivityRoom` with touch-safe ScrollView (`keyboardShouldPersistTaps="handled"`, `scrollEnabled` toggled for canvas), verified in `tests/gate2-games-and-missions.test.ts`. | 2026-11-08 |
| **C3** | Server-authoritative rounds | `Done` | `advance_round` RPC with concurrency locking (`FOR UPDATE`), synchronized `<Name> moved to round N` banner, deterministic idempotency keys in `useSubmitEvent`. | 2026-11-08 |
| **C4** | Four two-player games | `Done` | Would You Rather (match/differ reveal), Who Knows Whom (target/guesser roles + score tally), Guess My Answer (instant selection + match reveal), Drawing and Guessing (uninterrupted canvas + live guess resolution). Verified in `tests/gate2-games-and-missions.test.ts`. | 2026-11-08 |
| **C5** | Quizzes | `Done` | Immediate option highlight on tap, deterministic single-save idempotency, synchronized next round progression, verified in `tests/gate2-games-and-missions.test.ts`. | 2026-11-08 |
| **C6** | Challenges and photo missions | `Done` | Camera/gallery pickers (`expo-image-picker`), 1600px resize/0.7 JPEG compression, server-side database masking in `20261108000008_mask_photo_mission_events.sql` until both respond, mutual polaroid reveal. | 2026-11-08 |
| **D1** | Messages and voice notes | `Done` | Modern DM unified pill layout, filled round camera button, flexible Message field up to ~4 lines, gallery/more/mic actions, in-pill recording mode, verified in `tests/gate3-chat-input-bar.test.ts`. | 2026-11-08 |
| **D2** | Open When letters | `Done` | Server-side unlock comparison against UTC `unlock_at`, locked/opened states, notification on insert, verified in `tests/push-notifications-and-performance.test.ts`. | 2026-11-08 |
| **D3** | Asynchronous questions | `Done` | Server-side RLS masks partner answers until current user submits, verified in `tests/security-audit.test.ts`. | 2026-11-08 |
| **D4** | Media | `Done` | Private couples-media bucket with explicit allowed MIME types, base64->ArrayBuffer pipeline, verified in `20261108000007_storage_allowed_mimes.sql`. | 2026-11-08 |
| **E1** | Guided virtual dates | `Done` | 7 guided date templates seeded, shared step progression and timer, FaceTime/WhatsApp/Meet deep links, "Save as memory" flow. | 2026-11-08 |
| **E2** | Memories | `Done` | Up to 5 photos per memory, 1600px resize/0.7 JPEG compression via `expo-image-manipulator`, thumbnails, uploader-only delete, verified in `tests/media-upload-and-voice-notes.test.ts`. | 2026-11-08 |
| **F1** | Notifications (In-App Inbox & Push) | `Done` | Standalone in-app notification inbox with bell icon + unread count badge in Home header, newest-first list, deep-linking, mark all as read, Supabase Realtime in-app floating banner, 9 event types covered, remote push kept behind feature flag. Verified in `tests/gate6-in-app-notifications.test.ts`. | 2026-11-08 |
| **F2** | Analytics and errors | `Done` | PostHog client behind `services/analytics.ts` scrubbed of private payload content, Sentry error integration. | 2026-11-08 |
| **F3** | Performance pass | `Done` | TanStack Query persisted cache, lazy loading, lightweight icons, database indexes on `couple_id` and `session_id`. | 2026-11-08 |
| **F4** | Security audit | `Done` | Zero secret keys leaked in client code, strict RLS on all 16 tables, 72 automated test assertions passing. | 2026-11-08 |
| **F5** | Account deletion and data export | `Done` | Cascade delete of user profiles, couple data, and storage files via `delete_user_account` RPC in `20261107000002_account_deletion_and_storage.sql`. | 2026-11-08 |
| **G1** | Global: Keyboard handling | `Done` | `<KeyboardScreen>` wrapping all forms with `react-native-keyboard-controller`, verified in `tests/anniversary-and-keyboard.test.ts`. | 2026-11-08 |
| **G2** | Global: Screen states | `Done` | LoadingState, EmptyState, ErrorBoundary, and OfflineBar present on all core screens. | 2026-11-08 |
| **G3** | Global: Opening experience & Splash | `Done` | Plain background `#FFF4E3` (Paper) with app logo only (`app.json` splash & `android.splash`, `src/app/index.tsx`), zero animated loop/circle/line decorative artifacts. Verified in `tests/gate5-splash-and-decorations.test.ts`. | 2026-11-08 |
| **G4** | Global: Responsive layout, identity & motion | `Done` | *STRING & STICKERS* playful design system (Paper #FFF4E3, Ink #2B2118, Tomato #FF5A3C, Sunshine #FFC93C, Pool #2EC4B6, Bubblegum #FF8FB1), Google Fonts (Bricolage Grotesque, Figtree, Caveat), chunky outlines & hard offset ink shadows (no blur/no gradients), Reanimated spring physics with tactile sink-into-shadow button mechanics, partner string (slack when away, tight with wiggle when online). Verified in `tests/string-and-stickers.test.ts`. | 2026-11-08 |


