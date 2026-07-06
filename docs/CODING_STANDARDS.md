# Coding Standards

## General

- Use strict TypeScript.
- Avoid `any`.
- Prefer meaningful names.
- Keep functions small and focused.
- Do not duplicate business logic in UI components.
- Preserve existing architecture.
- Reuse components before creating new ones.

## React / Next.js

- Use App Router patterns.
- Keep route files thin.
- Use feature components for screen behavior.
- Use client components only when browser APIs, state, effects, or IndexedDB are needed.
- Keep mobile-first responsiveness in mind.

## Styling

- Use Tailwind CSS.
- Preserve the premium Apple-inspired design language.
- Prefer existing card/button patterns.
- Keep whitespace generous.
- Avoid dense tables for user-facing financial summaries.

## Financial Logic

- Put calculations in `src/services`.
- Label projections as estimates.
- Use conservative assumptions.
- Do not imply bank-grade financial accuracy unless formulas are verified.

## Local Data

- Use repository methods for data access.
- Do not directly access IndexedDB from UI unless creating a repository/storage implementation.
- Return `null` instead of `undefined` from repository methods where interfaces expect missing data.
- Version IndexedDB schema changes carefully.

## Backup Format

- The JSON backup schema is **locked**. Read `docs/BACKUP_SCHEMA.md` before touching backup code.
- Do not change `BACKUP_SIGNATURE`, `BACKUP_VERSION`, top-level fields, checksum rules, or `FinanceDataSnapshot` without explicit product owner approval.
- Allowed without approval: bug fixes, validation hardening, and UI copy — as long as on-disk V1.0 compatibility is preserved.
- Future encryption/compression must use new `backupVersion` values and documented migrations.

## CI Expectations

The GitHub Actions pipeline runs:

- lint
- typecheck
- build

Code should pass all three before merging.

## Documentation

When making product-impacting changes, update relevant docs:

- product decisions
- architecture
- prompt files
- roadmap

## Response Standard For AI Agents

After implementation, summarize:

- files changed
- components changed
- behavior changed
- design decisions
- risks or follow-ups
