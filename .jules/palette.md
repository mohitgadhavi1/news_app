## 2026-04-21 - Accessible Flip Card Pattern

**Learning:** Interactive elements like "flipping cards" often create accessibility issues where hidden content (on the back side) remains focusable via keyboard, creating a confusing "ghost focus" experience for users.

**Action:** Always manage `tabIndex` for nested interactive elements in revealable/flippable components. Set `tabIndex={-1}` when the content is hidden and `tabIndex={0}` when revealed. Additionally, ensure the card container itself is keyboard-accessible by adding `role="button"`, `tabIndex={0}`, and appropriate `aria-pressed` and `aria-label` attributes.
