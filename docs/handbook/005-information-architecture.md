# Finance Command Center

# Document 005 — Information Architecture

**Version:** 1.0

**Status:** Approved

**Priority:** Highest

**Depends On:**

- 001 Product Vision
- 002 Product Philosophy
- 003 Product Principles
- 004 Design Principles

---

# Purpose

Information Architecture defines **what information belongs where**.

It ensures every screen has a clear responsibility.

If a screen begins displaying unrelated information, it has violated this document.

This document takes precedence over UI implementation.

---

# Core Philosophy

Every screen exists to answer **ONE primary question**.

Everything displayed on that screen must help answer that question.

Everything else belongs somewhere else.

---

# Information Flow

Every piece of financial information should flow like this.

Raw Data

↓

Summary

↓

Decision

↓

Action

↓

Details

Never reverse this order.

Never show details before users understand the summary.

---

# Screen Hierarchy

Finance Command Center follows five levels.

Level 1

Overview

↓

Level 2

Summary

↓

Level 3

Decision

↓

Level 4

Details

↓

Level 5

Simulation

Users should naturally move deeper only when they need more information.

---

# Home

## Primary Question

> Am I financially okay today?

Home is NOT

❌ Dashboard

❌ Report

❌ Analytics

❌ Loan Manager

Home is a Financial Briefing.

Users should understand their current financial situation in less than 10 seconds.

---

## Home Shows

✓ Greeting

✓ Available Money

✓ One Priority Recommendation

✓ One Upcoming Due (if relevant)

✓ One Priority Loan

✓ Quick Actions

Nothing else.

---

## Home Never Shows

❌ Every loan

❌ Full payment history

❌ Charts

❌ Loan comparisons

❌ Simulation

❌ Detailed cash flow

❌ Multiple recommendation cards

❌ Large reports

If information requires scrolling to understand,

it probably belongs elsewhere.

---

# Loans

## Primary Question

> Which debt deserves my attention?

Loans screen manages debt.

It does NOT explain cash flow.

It does NOT explain investments.

It does NOT explain recommendations.

---

## Loans Show

✓ Loan Portfolio

✓ Loan Cards

✓ Loan Status

✓ Outstanding Balance

✓ Interest Rate

✓ EMI

✓ Due Date

✓ Loan Health

---

## Loan Details

Loan Details explain ONE loan.

Everything on this page should relate to that loan only.

---

## Loan Details Include

✓ Loan Overview

✓ Outstanding Balance

✓ EMI

✓ Remaining Tenure

✓ Payment Progress

✓ Interest Summary

✓ Payment History

✓ What-if Simulator

Nothing else.

---

# What-if Simulator

The simulator is an advanced feature.

It should never dominate Loan Details.

By default,

it should appear as one expandable card.

Only after expansion should users see:

Choose Strategy

↓

Inputs

↓

Simulation

↓

Recommendation

↓

Detailed Comparison

Simulation should never change actual loan data.

---

# Money

## Primary Question

> Where did my salary go?

Money screen explains monthly cash flow.

It is NOT another dashboard.

---

## Money Shows

✓ Income

✓ Fixed Expenses

✓ Variable Expenses

✓ Commitments

✓ Available Money

✓ Monthly Allocation

✓ Emergency Buffer

---

## Money Never Shows

❌ Loan Details

❌ Recommendation History

❌ Simulations

❌ Loan Comparisons

---

# Insights

## Primary Question

> What should I do next?

Insights should NEVER become analytics.

Insights should always end with an action.

Bad

Highest Interest Loan

Good

Gold Loan generates the highest monthly interest.

Prepaying ₹50,000 could reduce approximately ₹72,000 of future interest.

Review →

---

# Profile

## Primary Question

> How is my data managed?

Profile is not a settings dump.

Group information into:

Personal

Data

Backup

Security

Preferences

About

---

# Navigation Principles

Every navigation action should move:

Summary

↓

Details

↓

Decision

↓

Action

Never force users to navigate backwards to understand something.

---

# Progressive Disclosure

Every advanced feature remains hidden until requested.

Examples

What-if Simulator

↓

Expand

↓

Choose Strategy

↓

Run

Loan History

↓

Expand

↓

View History

Never overwhelm first-time users.

---

# Information Density

Each screen should contain only the amount of information users can reasonably understand within 10–15 seconds.

If users must scroll multiple screens before understanding where they stand,

too much information is being shown.

---

# Information Ownership

Each type of information belongs to one screen.

Available Money

→ Home (Summary)

→ Money (Breakdown)

Loan Balance

→ Loans

Simulation Results

→ Loan Details

Recommendation Reasoning

→ Insights

Never duplicate ownership.

---

# Repetition Rules

Repeated information is allowed only when the purpose changes.

Example

Home

Available Money

↓

Money

How Available Money was calculated

↓

Insights

Best way to use Available Money

The same number should never be repeated with the same purpose.

---

# Decision Hierarchy

Every screen should end with an action.

Examples

Home

Review Recommendation

Loans

View Loan

Money

Review Cash Flow

Insights

Take Action

Simulation

Compare Options

Information without action reduces product value.

---

# Scrolling Rules

Users should never scroll endlessly.

Guidelines

Home

Preferably fits within one mobile screen with minimal scrolling.

Loan Details

One natural scroll.

Long details should be collapsed.

Simulator

Collapsed by default.

Money

Summarized first.

Breakdowns expandable.

---

# Future Expansion

Future modules must integrate naturally.

Examples

Investments

Goals

Insurance

Retirement

Net Worth

Each future module must answer one clear question.

Never mix responsibilities.

---

# Screen Evaluation Checklist

Before approving any screen ask:

✓ Does this screen answer exactly one question?

✓ Is every section necessary?

✓ Can anything be removed?

✓ Is scrolling minimized?

✓ Is detailed information hidden until requested?

✓ Is the user guided toward an action?

✓ Does this screen overlap another screen?

If any answer is "No",

the Information Architecture should be revised.

---

# Final Rule

Finance Command Center is not a collection of screens.

It is one continuous conversation.

Each screen should naturally continue where the previous one ended.

Users should always know:

Where they are.

Why they are here.

What they should do next.

---

End of Document 005.
