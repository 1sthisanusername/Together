# UI/UX Audit & Testing Template for Together App

---

## Introduction & Scope

This document defines a **complete manual audit checklist** and **reporting template** for the *Together* mobile application. It is intended to be run **before any code changes** are made. The audit covers every screen, interaction, and couple‑specific flow, ensuring privacy rules, visual consistency, accessibility, performance, and data‑synchronisation are verified.

---

## 1. Full UI/UX Checklist (per screen)

For each screen listed in **Section 2 – Screen List**, perform the following checks.  Record the result in the reporting tables (Section 4).

| # | Check | Description |
|---|-------|-------------|
| 1 | Screen opening & loading | Verify the screen appears within an acceptable time (< 2 s on a mid‑range device). Check loading spinners, fallback UI, and error handling. |
| 2 | Safe‑area & full‑screen display | Ensure content respects device safe‑areas (notch, rounded corners) on both Android and iOS. |
| 3 | Scrolling (vertical / horizontal) | Test scrolling behaviour, momentum, and that content is not clipped or hidden. |
| 4 | Visual design & layout | Validate alignment, spacing, typography, colour contrast (WCAG AA minimum 4.5:1), and consistency with the design system. |
| 5 | Buttons & interactive elements | Tap each button, link, icon, and gesture. Verify hit‑targets ≥ 48 dp, visual feedback, and disabled states. |
| 6 | Navigation & usability | Confirm navigation flow (back, forward, tab bar, drawer) works without dead‑ends or unexpected resets. |
| 7 | Typography & content | Check text truncation, localisation placeholders, and that dynamic content (usernames, dates) renders correctly. |
| 8 | Forms & keyboard behaviour | Test input fields, validation messages, keyboard dismissal, and auto‑scroll into view. |
| 9 | Images, icons & media | Verify that images load, are sized correctly, and do not cause layout shifts. Test SVG / WebP support. |
|10| Loading / empty / error states | Simulate network failures or empty data; ensure appropriate placeholders, retry buttons, and error messages are shown. |
|11| Responsiveness & device compatibility | Run on at least two Android screen sizes (e.g., Pixel 5, Tablet) and on iOS (if applicable). |
|12| Accessibility | Use a screen‑reader (TalkBack / VoiceOver) to verify labels, focus order, and that all actionable items are reachable. |
|13| Performance & stability | Monitor FPS, memory usage, and crash logs while interacting with the screen for 30 seconds. |
|14| Data persistence & sync | Confirm that data entered is persisted locally and synced to Supabase without duplication or loss. |
|15| Animations & transitions | Check that animations are smooth, do not block UI, and respect the "reduce motion" setting. |

---

## 2. Screen List (placeholders for reporting tables)

| Screen | Description |
|--------|-------------|
| Welcome / Onboarding | First‑time flow, account creation, permissions request |
| Pairing | Couple creation, invitation acceptance, nickname entry |
| Home | Dashboard showing daily question, recent memories, navigation tabs |
| Daily Question | Question display, answer input, reveal logic |
| Camera / Capture | Photo capture, preview, retake, save |
| Dates / Activities | List of scheduled dates, add/edit flow |
| Memories | Grid view of saved photos, sharing, delete |
| Play (Games) | Mini‑games UI, scoring, partner interaction |
| Chat / Messaging | Text/chat UI, media attachments, read receipts |
| Settings | Account settings, privacy toggles, logout |
| Profile | User profile edit, avatar change |
| ... (add any other screens present in the app) |

---

## 3. Couple‑Specific Checklist

| # | Flow | Key Privacy / Sync Checks |
|---|------|----------------------------|
| 1 | Partner pairing | Only the invited partner can accept; no other user can view the invitation link or couple ID. |
| 2 | Nickname handling | Nicknames are stored per‑user and never exposed to non‑partners. |
| 3 | Daily question privacy | A user **cannot** read the partner’s answer before submitting their own. After both answer, both can view each other's answer. |
| 4 | Shared photos | Photos uploaded by one partner are visible to the other **only after** both have a valid couple relationship. |
| 5 | Home photo updates | Verify that the home‑screen photo carousel updates in real‑time for both partners. |
| 6 | Individual backups | Each user can export their own data; the export does **not** contain the partner’s private data. |
| 7 | Shared couple backups | Backup of shared data includes only records where `couple_id` matches the authenticated couple. |
| 8 | Weekly backup behaviour | Confirm that weekly backup runs for each couple and does not overwrite the other partner’s separate data. |
| 9 | Data synchronization | Real‑time sync via Supabase should resolve conflicts correctly (last‑write‑wins on non‑protected fields). |
|10| Privacy & access restrictions | Ensure RLS policies prevent any unauthorised read/write (tested in Section 5). |

---

## 4. Testing Procedure

1. **Prepare two test accounts** (A & B) that belong to the same couple and one outsider account (C).
2. Install the app on two physical devices or emulators.
3. Log in with each account on a separate device.
4. Follow the **Screen List** order, performing the checks from Section 1 on **both devices** where applicable.
5. Capture **screenshots** for any failed or partially‑passed test (store as `screenshots/<screen>_<issue>.png`).
6. Record results in the **Reporting Template** (Section 5) using the markdown tables below.
7. After completing all screens, run the **Couple‑Specific Checklist** using the two‑account setup.
8. At the end of the session, **ROLL BACK** any data created (use a developer back‑door or test database) to keep the production environment clean.

---

## 5. Reporting Template

### 5.1 Overall Quality Score

```
Overall Score: __ / 100
```

### 5.2 Per‑Screen Scores & Results

| Screen | Score (0‑10) | Passed | Failed | Partial | Untested | Critical Issues | High Issues | Medium Issues | Low Issues |
|--------|--------------|--------|--------|---------|----------|----------------|------------|---------------|-----------|
| Welcome / Onboarding | | | | | | | | | |
| Pairing | | | | | | | | | |
| Home | | | | | | | | | |
| Daily Question | | | | | | | | | |
| Camera / Capture | | | | | | | | | |
| Dates / Activities | | | | | | | | | |
| Memories | | | | | | | | | |
| Play (Games) | | | | | | | | | |
| Chat / Messaging | | | | | | | | | |
| Settings | | | | | | | | | |
| Profile | | | | | | | | | |
| … (add rows as needed) |

### 5.3 Detailed Issue Log (per screen)

```
#### <Screen Name>
| Severity | Description | Steps to Reproduce | Screenshot | Suggested Fix |
|----------|-------------|--------------------|------------|--------------|
| Critical | ... | ... | ![img](screenshots/...png) | ... |
| High | ... | ... | ... | ... |
| Medium | ... | ... | ... | ... |
| Low | ... | ... | ... | ... |
```

### 5.4 Severity Definitions

| Severity | Impact |
|----------|--------|
| Critical | Data loss, privacy breach, crash, or app unusable. |
| High | Major functional defect; blocks core user flow. |
| Medium | Important UI/UX flaw; work‑around exists. |
| Low | Minor visual inconsistency or cosmetic issue. |

### 5.5 Prioritisation Guidelines

1. Fix **Critical** issues before any release.
2. **High** issues must be resolved for the next public build.
3. **Medium** issues are scheduled for the following sprint.
4. **Low** issues are optional; address if time permits.

---

## 6. References & Resources

- Supabase RLS policies for `daily_question_answers` (see migration files).
- Design system repository: `src/design/`
- Accessibility checklist: https://www.w3.org/WAI/test-evaluate/
- Device test matrix: Pixel 5 (Android 13), Samsung Galaxy Tab, iPhone 13 (iOS 16) – if iOS build exists.

---

*This template is ready for use. Populate the tables during the manual audit and keep the file committed to the repository for future reference.*

