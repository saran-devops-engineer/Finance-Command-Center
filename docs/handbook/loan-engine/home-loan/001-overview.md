# Home Loan Engine

# 001 — Overview

Version: 1.0

Status: Active

---

# Purpose

The Home Loan Engine is responsible for accurately modelling, calculating, simulating and analysing residential mortgage loans.

This engine provides the financial intelligence behind all Home Loan features within Finance Command Center.

It serves as the single source of truth for Home Loan behaviour.

---

# Scope

The Home Loan Engine is responsible for:

- EMI calculations
- Amortization schedules
- Outstanding balance calculations
- Principal tracking
- Interest tracking
- Payment processing
- Part-prepayments
- EMI reduction
- Tenure reduction
- Foreclosure calculations
- Floating interest scenarios
- Fixed interest scenarios
- Simulation scenarios
- Recommendation generation

---

# Out of Scope

The Home Loan Engine does not manage:

- UI rendering
- Charts
- Storage
- Cloud synchronization
- Notifications
- Authentication

Those responsibilities belong to other systems.

---

# Product Philosophy

The objective is not to calculate numbers.

The objective is to help users make better Home Loan decisions.

Every calculation should ultimately answer one or more questions such as:

- Can I close my loan earlier?
- Should I increase my EMI?
- Should I make a lump-sum prepayment?
- How much interest can I save?
- Which repayment strategy is best for me?

---

# Design Principles

The engine must be:

- Deterministic
- Explainable
- Extensible
- Testable
- Independent of the UI
- Banking-grade accurate

---

# Core Modules

The Home Loan Engine consists of:

- EMI Engine
- Interest Engine
- Amortization Engine
- Payment Engine
- Simulation Engine
- Recommendation Engine
- Validation Engine

Each module has a single responsibility.

---

# Dependencies

Depends on:

- Domain Model
- Data Model
- Financial Engine

Consumed by:

- Loan Details
- What-if Simulator
- Recommendation Engine
- Insights
- AI Advisor (Future)

---

# Guiding Rule

Every Home Loan calculation must be reproducible.

Given the same loan data and assumptions, the engine must always produce the same result.

---

# Next Documents

002 — Domain Model

003 — Banking Concepts

004 — Data Model

005 — Interest Calculations

006 — EMI Calculations

007 — Amortization Engine

008 — Payment Processing

009 — Part Prepayment

010 — Reduce Tenure

011 — Reduce EMI

012 — Foreclosure

013 — Floating Interest

014 — Fixed Interest

015 — Simulation Rules

016 — Validation Rules

017 — Edge Cases

018 — Test Cases

019 — UI Specification

020 — API Contract

021 — Future Enhancements

---

End of Document
