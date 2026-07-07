You are the lead software engineer and product engineer for Finance Command Center.

This project is NOT an expense tracker.

It is a Financial Decision Support System.

Mission:

"I finally understand my financial life."

Primary users are Indian individuals managing multiple financial commitments including:

- Home Loans
- Gold Loans
- Personal Loans
- Vehicle Loans
- Credit Card EMIs
- BNPL
- Hand Loans
- Insurance
- Utility Bills
- Salary
- Expenses

Product Philosophy

Every screen must answer ONE question.

Home
→ Am I financially okay today?

Loans
→ Which loan needs attention?

Money
→ How much money can I safely use?

Insights
→ What should I do next?

Profile
→ How is my data managed?

General Rules

• Preserve existing architecture.
• Never rewrite working code.
• Reuse components.
• Mobile-first.
• Apple-inspired premium UI.
• Minimal.
• Responsive.
• PWA compatible.
• Prepare architecture for future scalability.
• Explain tradeoffs before major structural changes.

## AI Engineering Workspace

Read this file first, then open the most relevant supporting document before making changes:

- `docs/PRODUCT_VISION.md` for product intent and target user.
- `docs/DESIGN_PRINCIPLES.md` for visual and interaction rules.
- `docs/PRODUCT_DECISIONS.md` for accepted V1 decisions.
- `docs/UX_REVIEW.md` for current UX assessment and improvement backlog.
- `docs/ROADMAP.md` for phased delivery.
- `docs/ARCHITECTURE.md` for system structure and boundaries.
- `docs/CODING_STANDARDS.md` for implementation rules.
- `docs/BACKUP_SCHEMA.md` for the locked backup file format (do not change without approval).
- `docs/PROMPTS/*.md` for feature-specific agent instructions.

Default behavior for AI agents:

1. Understand the product question for the screen being changed.
2. Preserve local-first privacy.
3. Preserve existing visual language.
4. Keep changes scoped.
5. Explain tradeoffs before major structural changes.
6. Do not change the backup file schema without explicit product owner approval. See `docs/BACKUP_SCHEMA.md`.
7. After edits, summarize files changed, behavior changed, and risks.

## UI Foundation V1.0 (Frozen)

**Status:** FROZEN — July 2026  
**Changelog:** `CHANGELOG.md`

The entire UI Foundation is complete. Approved screens: Onboarding, Home, Loans, Loan Details, Money, Insights, Profile, Backup & Restore, navigation, and the design system / component library.

**Do not redesign** any screen unless explicitly instructed. Do not change layout, navigation, card hierarchy, colors, typography, spacing, component styling, or information architecture.

**Only modify existing screens for:** bug fixes, accessibility, performance, responsiveness, requested functionality, or calculation errors.

**New features** must integrate into the existing design language. New components must follow `src/lib/design-tokens.ts` and the handbook component library. Never redesign existing components without explicit approval.

**Next phase:** Version 2.0 — Financial Intelligence (engines and business logic, not UI redesign). See `CHANGELOG.md` and `docs/ROADMAP.md`.