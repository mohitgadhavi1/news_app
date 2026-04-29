## 2026-04-28 - [Accessible Flip Cards]
**Learning:** Using `role="button"` on a container with nested interactive elements (links, buttons) violates ARIA standards and breaks keyboard navigation because event handlers (like `onKeyDown` with `preventDefault`) on the container intercept events meant for children.
**Action:** Use dedicated trigger buttons for interactions like "Flip" or "Summary" and manage `tabIndex={isRevealed ? 0 : -1}` on internal elements to ensure they are only focusable when visible, while keeping the container as a non-interactive layout element for assistive technologies.

## 2026-04-28 - [Standard A11y: Skip Link]
**Learning:** Adding a "Skip to content" link as the first focusable element is a high-impact, low-effort micro-UX improvement that significantly benefits power users and those with motor impairments.
**Action:** Always check for and implement skip links in the root layout of web applications.
