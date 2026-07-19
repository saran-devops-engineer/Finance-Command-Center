# Backup Schema (Locked)

**Status:** Approved and locked for V1.1.

**Do not change this schema without explicit product owner approval.**

This file is the canonical reference for the Finance Command Center backup file format. AI agents, contributors, and future migrations must treat this document and `src/storage/backup/backup-format.ts` as the source of truth.

## Governance

- Do **not** rename, remove, or reorder top-level backup fields without approval.
- Do **not** change `BACKUP_SIGNATURE` or `BACKUP_VERSION` without approval.
- `FinanceDataSnapshot.schemaVersion` may be `1` or `2`. V2 is additive (`incomeProfile`, `commitments`); V1 fields remain required for compatibility.
- Do **not** change checksum scope or validation rules without approval.
- Bug fixes inside `backup-service.ts` (parsing, error messages, type guards) are allowed if they preserve on-disk compatibility.
- Future features (encryption, compression, cloud sync) must extend via `future` and new `backupVersion` values — not by silently changing V1.0 files.

If a change is needed, propose it to the product owner first. Only after approval should code, docs, and migration logic be updated together.

## File

- **Filename pattern:** `finance-command-center-backup-YYYY-MM-DD.json`
- **MIME type:** `application/json`
- **Encoding:** UTF-8, pretty-printed JSON (2-space indent on export)

## Top-Level Shape (`FinanceCommandCenterBackupV1`)

```json
{
  "signature": "FinanceCommandCenter",
  "backupVersion": "1.0",
  "appVersion": "0.1.0",
  "createdAt": "2026-07-06T18:00:00.000Z",
  "platform": "PWA",
  "encrypted": false,
  "checksum": "<sha-256 hex of JSON.stringify(data)>",
  "metadata": { },
  "data": { },
  "future": {
    "encryption": "none",
    "compression": "none",
    "migrationPath": "direct"
  }
}
```

### Field rules

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `signature` | `"FinanceCommandCenter"` | Yes | Must match exactly |
| `backupVersion` | `"1.0"` | Yes | Format version, not app version |
| `appVersion` | string | Yes | App build that created the file |
| `createdAt` | ISO 8601 string | Yes | Backup creation time |
| `platform` | `"PWA"` | Yes | Source platform |
| `encrypted` | `false` | Yes | V1.1 is plaintext JSON; `true` reserved for future |
| `checksum` | string | Yes | SHA-256 hex digest of `data` only |
| `metadata` | object | Yes | Summary counts for restore preview |
| `data` | object | Yes | Full financial snapshot |
| `future` | object | Yes | Extension points; do not repurpose |

## Metadata (`BackupMetadata`)

```json
{
  "loanCount": 0,
  "loanPaymentCount": 0,
  "upcomingDueCount": 0,
  "incomeSources": 0,
  "expenseCategories": 0,
  "hasProfile": false,
  "hasMoneyBreakdown": false
}
```

## Data (`FinanceDataSnapshot`)

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-07-06T18:00:00.000Z",
  "profile": null,
  "moneyBreakdown": null,
  "loans": [],
  "loanPayments": [],
  "upcomingDues": [],
  "chits": []
}
```

`schemaVersion` may be `1` or `2`.

- **V1** — `moneyBreakdown` is the cash-flow source of truth.
- **V2** — adds optional `incomeProfile` and `commitments` while **retaining** `moneyBreakdown` (never deleted).

```json
{
  "schemaVersion": 2,
  "exportedAt": "2026-07-19T10:00:00.000Z",
  "profile": null,
  "moneyBreakdown": null,
  "loans": [],
  "loanPayments": [],
  "upcomingDues": [],
  "chits": [],
  "incomeProfile": null,
  "commitments": []
}
```

Domain types for nested objects live in `src/shared/domain/`:

- `UserProfile`, `MoneyBreakdown`, `Loan`, `LoanPayment`, `UpcomingDue` (`finance.ts`)
- `IncomeProfile` (`income.ts`)
- `CommitmentRecord` (`commitment-record.ts`)

## Checksum

- Algorithm: SHA-256
- Input: `JSON.stringify(data)` where `data` is the `FinanceDataSnapshot` object
- Output: lowercase hex string
- The checksum field itself is **not** included in the hashed payload

## Restore validation (V1.1+)

Before overwrite, the app must:

1. Parse JSON
2. Verify `signature === "FinanceCommandCenter"`
3. Verify `backupVersion === "1.0"` (or run approved migration)
4. Verify `encrypted === false`
5. Verify `checksum` matches `data`
6. Validate `data.schemaVersion` is `1` or `2`
7. Show restore preview summary to the user
8. Require explicit confirmation before replacing IndexedDB
9. After replace: if schema is V1, run V1→V2 data migration (never delete V1 fields)

## Code references

- Format types: `src/storage/backup/backup-format.ts`
- Create / inspect / restore: `src/storage/backup/backup-service.ts`
- Snapshot model: `src/shared/domain/finance.ts` → `FinanceDataSnapshot`
- Schema migration: `src/storage/migration/migrate-v1-to-v2.ts`
- Export / replace: `src/repositories/indexeddb-finance-repository.ts`

## Future versions

When encryption, compression, or schema changes are approved:

1. Bump `backupVersion` (e.g. `"1.1"`, `"2.0"`)
2. Add migration in `backup-service.ts` / `src/storage/migration/`
3. Update this document
4. Keep restore support for older approved versions
