# UI/UX Audit Checklist

## 1. Screen Opening & Loading
- Verify each screen mounts without errors.
- Ensure loading indicators appear when async data is fetched.

## 2. Full‑Screen Display & Safe Areas
- Content respects device safe areas (notch, status bar).
- No content is clipped horizontally or vertically.

## 3. Scrolling
- Vertical & horizontal scrolling works smoothly.
- Scroll indicators appear when needed.
- No jitter or layout shift on scroll.

## 4. Visual Design & Layout
- Consistent spacing, alignment, and typography.
- Colors meet contrast requirements (≥4.5:1).
- Icons are crisp and appropriately sized.

## 5. Buttons & Interactions
- All pressable elements have a minimum touch target (44 dp).
- `hitSlop` is applied where the visual size is smaller.
- `accessibilityLabel` and `accessibilityRole` are provided.
- Visual feedback (opacity, ripple) occurs on press.

## 6. Navigation & Usability
- Navigation flows match the spec.
- Back gestures and hardware back button work.
- Tab bar / drawer items are reachable and labelled.

## 7. Typography & Content
- Font sizes are legible on all supported devices.
- Text truncation does not hide essential info.
- Dynamic content updates correctly.

## 8. Forms & Keyboard Behaviour
- Input fields focus correctly.
- Keyboard does not obscure fields.
- Validation messages appear and are announced.

## 9. Images, Icons & Media
- Images are sized appropriately and lazy‑loaded.
- No broken image links.
- Media playback controls are accessible.

## 10. Loading, Empty & Error States
- Each screen displays appropriate placeholders.
- Error messages are clear and have retry actions.

## 11. Responsiveness & Device Compatibility
- Layout adapts to portrait/landscape.
- Works on phones and tablets (different DPIs).

## 12. Accessibility
- All interactive elements have `accessibilityLabel`.
- Live region announcements for navigation/redirects.
- Focus order follows visual order.
- Supports screen readers (VoiceOver, TalkBack).

## 13. Performance & Stability
- No dropped frames (>30 fps) on scrolling.
- No crashes or unhandled exceptions.
- Memory usage stays within reasonable limits.

## 14. Data Persistence & Sync
- Local changes persist across app restarts.
- Partner data syncs correctly (e.g., shared photos, backups).

## 15. Animations & Transitions
- Animations are smooth and not jarring.
- Reduced‑motion preference is respected.

## 16. Couple‑Specific Scenarios
- Partner pairing flow works for both accounts.
- Daily question reveal respects rules.
- Shared photo updates propagate to both users.
- Backup behaviour (individual & couple) follows spec.

## 17. Reporting
- For each screen record:
  - Test performed
  - Result: Pass / Partial / Fail / Untestable
  - Screenshot (if applicable)
  - Steps to reproduce
  - Severity (Critical, High, Medium, Low)
  - Suggested fix

---

*Use this checklist during manual testing or automated UI test runs.*
