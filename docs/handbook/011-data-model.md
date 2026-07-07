# Finance Command Center

# Document 011 — Data Model

**Version:** 1.0

**Status:** Approved

**Priority:** Highest

**Depends On:**

010 Domain Model

---

# Purpose

This document defines how every entity within Finance Command Center relates to every other entity.

The Data Model is the single source of truth for relationships between entities.

No implementation should introduce relationships that contradict this specification.

---

# Philosophy

Every piece of information should exist only once.

Derived values should never be permanently stored.

Instead,

they should be calculated from authoritative data.

---

# Core Entity Relationships

```
User
│
├── Income
│
├── Expense
│
├── Commitment
│
├── Loan
│   ├── Payment
│   ├── Simulation
│   ├── Recommendation
│   └── Documents
│
├── Emergency Buffer
│
├── Goal (Future)
│
├── Investment (Future)
│
└── Asset (Future)
```

---

# User

A user owns

Income

Expenses

Loans

Commitments

Emergency Buffer

Settings

Backups

Future Investments

No financial record exists without a User.

---

# Loan

Loan owns

Loan Details

↓

Payment History

↓

Simulation History

↓

Documents

↓

Recommendations

Recommendations never own loans.

Loans own recommendations.

---

# Payment

Every Payment belongs to exactly one Loan.

Payment stores

Amount

Date

Principal Paid

Interest Paid

Payment Type

Reference

Payments are immutable.

Corrections create new records.

---

# Simulation

A Simulation belongs to one Loan.

Simulation is temporary.

It never changes Loan.

Simulation stores

Scenario

Inputs

Results

Created Date

Saved

True / False

---

# Recommendation

Recommendation belongs to

Loan

or

Cash Flow

or

Financial Health

Every Recommendation references the data used to generate it.

Recommendations never exist without a reason.

---

# Income

Income contains

Source

Amount

Frequency

Start Date

End Date

Status

Income contributes to Cash Flow.

---

# Expense

Expense contains

Category

Amount

Frequency

Mandatory

Recurring

Date

Expenses reduce Available Money.

---

# Commitment

Commitments represent unavoidable obligations.

Examples

EMI

Insurance

Rent

Internet

School Fees

Taxes

Commitments are always included before Available Money is calculated.

---

# Available Money

Available Money is NEVER stored.

It is always calculated.

Formula

Income

-

Commitments

-

Mandatory Expenses

-

Emergency Buffer

=

Available Money

Future versions may include configurable calculation rules.

---

# Financial Health

Financial Health is calculated.

Never stored.

Future inputs

Debt Ratio

Savings Rate

Cash Flow

Emergency Buffer

Net Worth

Payment Behaviour

---

# Recommendation Engine

Consumes

Loans

↓

Cash Flow

↓

Financial Health

↓

Simulation Results

Produces

Recommendations

Recommendations never modify data.

---

# Simulation Engine

Consumes

Loan

↓

Loan Rules

↓

Scenario Inputs

Produces

Simulation Result

Simulation Result is isolated.

No actual data changes.

---

# Home Screen

Consumes

Available Money

↓

Recommendation

↓

Upcoming Due

↓

Priority Loan

Never directly queries multiple sources.

Home receives summarized data.

---

# Money Screen

Consumes

Cash Flow

Produces

Breakdowns

Money screen never calculates debt.

---

# Loan Details

Consumes

Loan

↓

Payment History

↓

Simulation

↓

Recommendation

Everything displayed must relate to one Loan.

---

# Data Ownership

Only one owner exists.

Loan Balance

Loan

Available Money

Cash Flow Engine

Recommendation

Recommendation Engine

Simulation

Simulation Engine

Financial Health

Financial Health Engine

No duplicate ownership.

---

# Derived Values

Never store

Interest Saved

Months Saved

Loan Health

Debt Ratio

Cash Flow

Available Money

These values are always calculated.

---

# Synchronization

Future Cloud Sync

↓

Device

↓

Encrypted Local Storage

↓

UI

UI never directly modifies storage.

Everything passes through repositories.

---

# Validation Rules

Every relationship must remain valid.

Examples

Payment cannot exist without Loan.

Recommendation cannot exist without Reason.

Simulation cannot modify Loan.

Available Money cannot be manually edited.

---

# Future Extensions

Future entities

Goals

Investments

Assets

Insurance

Retirement

Tax

should extend this model,

not replace it.

---

# Final Rule

The Data Model defines relationships.

Business logic belongs elsewhere.

Never place calculations inside entity definitions.

---

End of Document 011.
