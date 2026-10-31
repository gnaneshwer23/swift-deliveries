# Studio Idea Submission (Screen 3) Overrides

> **PROJECT:** DeliverX Studio
> **Page Type:** Form / Dashboard

> Rules here override `design-system/deliverx-studio/MASTER.md`.

---

## Page-Specific Rules

### Layout

- Centered form card, max ~40rem
- Faint constellation SVG behind the card (decorative only)
- Optional recent cases below the fold

### Copy

- Heading: Describe your product idea
- Support: One or two lines is enough. Aria will ask only what matters.
- Primary CTA: Start investigation
- Helper: You can start with just the idea.
- Example idea is an explicit **Use example idea** action — never silent submit of placeholder

### Optional context

- Chips: Target users, Platform, Budget, Timeline, Constraints
- **+ Add more context** reveals assets / research / evidence / voice
- None required to submit

### Behaviour

- Empty / whitespace idea: accessible validation, focus textarea
- Pending: disable duplicate submit; announce loading via `aria-live`
- On success: navigate to `/command/supervised/$missionId` (scope review). Do not claim research has started until the plan is approved.

### Color / CTA

- Master accent `#059669` for primary CTA
- Indigo / cyan / violet for chips and constellation accents only
