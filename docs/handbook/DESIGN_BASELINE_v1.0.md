# Design Baseline v1.0

**Status:** Frozen  
**Effective:** July 2026  
**Authority:** Product Owner approval required for changes

This document marks the UI stabilization baseline for Finance Command Center.

## Frozen scope

The following must not change without explicit approval:

- Spacing scale and section rhythm
- Card sizes, padding, and border radius
- Typography hierarchy
- Component layouts (`MetricCard`, `Card`, `Button`, `ExpandableCard`)
- Button sizes and touch targets
- Visual hierarchy across screens

## Implementation source

Runtime tokens live in `src/lib/design-tokens.ts`.

Handbook references:

- `006-design-tokens.md`
- `008-spacing-layout-system.md`
- `009-component-library.md`

## Rule for future work

New features must reuse existing components and tokens.

Do not redesign existing screens while adding new functionality.

---

End of Design Baseline v1.0
