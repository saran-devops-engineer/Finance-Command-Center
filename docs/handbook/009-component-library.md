# Finance Command Center

# Document 009 — Component Library

**Version:** 1.0

**Status:** Approved

**Priority:** Highest

**Depends On:**

001 Product Vision

002 Product Philosophy

003 Product Principles

004 Design Principles

005 Information Architecture

006 Design Tokens

007 Typography

008 Spacing & Layout System

---

# Purpose

This document defines every reusable UI component used throughout Finance Command Center.

No screen should invent new UI patterns when an existing component solves the same problem.

Consistency is more important than creativity.

Every component must have one clear responsibility.

---

# Component Philosophy

Components should feel

• Predictable

• Consistent

• Calm

• Reusable

• Accessible

Users should instantly recognize how every component behaves.

---

# Component Hierarchy

Application

↓

Screen

↓

Section

↓

Component

↓

Element

↓

Token

Never skip hierarchy.

---

# Component Rules

Every component must define

Purpose

Business Rules

UX Rules

Engineering Rules

Variants

Accessibility

Responsive Behaviour

Examples

---

# 1. Page Header

Purpose

Identify the current screen.

Contains

• Screen Title

• Optional Subtitle

• Optional Action Button

Rules

Only one primary action.

Never overload the header.

---

# 2. Section Header

Purpose

Separate logical groups.

Contains

Title

Optional Description

Optional "View All"

Never place buttons inside section headers.

---

# 3. Metric Card

Purpose

Display one important financial metric.

Examples

Available Money

EMI

Debt

Savings

Business Rules

Only one metric.

UX Rules

Never show charts.

Never show lists.

Engineering Rules

Fixed height.

Consistent spacing.

Large value.

Small label.

Variants

Default

Positive

Warning

Negative

Never exceed two lines of supporting text.

---

# 4. Recommendation Card

Purpose

Recommend one financial action.

Structure

Recommendation

↓

Reason

↓

Expected Benefit

↓

Action Button

Business Rules

Only one recommendation.

Never display multiple competing recommendations.

UX Rules

Users should understand the recommendation within five seconds.

Engineering Rules

Expandable.

Responsive.

Variants

Primary

Warning

Success

---

# 5. Loan Card

Purpose

Summarize one loan.

Contains

Loan Name

Outstanding Balance

Interest Rate

EMI

Progress

Status

View Details

Business Rules

Never include payment history.

Never include simulations.

Those belong in Loan Details.

---

# 6. Expandable Card

Purpose

Hide advanced functionality.

Examples

What-if Simulator

Payment Breakdown

History

Behavior

Collapsed by default.

Smooth expansion.

Animation 250–300 ms.

Never auto-expand.

---

# 7. Insight Card

Purpose

Provide contextual information.

Examples

Upcoming Due

Renewal Reminder

Interest Alert

Difference from Recommendation

Insight Cards do not tell users what to do.

Recommendation Cards do.

---

# 8. Quick Action

Purpose

Provide access to frequent actions.

Examples

Add Loan

Add Expense

Add Income

Rules

Maximum four actions.

Large touch targets.

---

# 9. Progress Component

Purpose

Show completion.

Examples

Loan Progress

Savings Goal

Emergency Fund

Never use circular progress without meaning.

---

# 10. Timeline

Purpose

Show chronological events.

Examples

Payments

Loan History

Upcoming Dues

Newest first.

---

# 11. Payment Row

Purpose

Represent one payment.

Contains

Date

Amount

Type

Status

Trailing Icon

Never place recommendations inside rows.

---

# 12. Empty State

Purpose

Help users understand why nothing appears.

Good

"No payments due this month."

Bad

"No Data."

Always encourage users.

---

# 13. Bottom Navigation

Exactly five items.

Home

Loans

Money

Insights

Profile

Never exceed five.

Never scroll.

---

# 14. Floating Action Button

Purpose

Fast data entry.

Only one floating action button per screen.

Never multiple FABs.

---

# 15. Input Field

Purpose

Collect one piece of information.

Rules

Always display labels.

Never rely only on placeholders.

Support validation.

Support accessibility.

---

# 16. Simulation Panel

Purpose

Run What-if simulations.

Always collapsed initially.

Contains

Strategy

↓

Input

↓

Simulation

↓

Comparison

↓

Recommendation

Never modify actual loan data.

---

# 17. Comparison Card

Purpose

Compare two financial outcomes.

Example

Current

↓

Simulated

↓

Difference

↓

Recommendation

Always highlight the recommended option.

---

# Component Reuse Rules

Every screen should be built from existing components.

Do not create new components unless a genuine new interaction exists.

When adding a component ask

Can an existing component solve this?

If yes,

reuse it.

---

# Accessibility

Every component must support

Screen Readers

Keyboard Navigation

Dynamic Font Sizes

Minimum Touch Target

Color Contrast

Reduced Motion

---

# Responsive Rules

Mobile First.

Desktop centers content.

Component behavior should remain identical across devices.

Only spacing may change.

---

# Naming Rules

Component names must describe purpose.

Good

LoanCard

RecommendationCard

MetricCard

ExpandableCard

Bad

Card1

CustomBox

ContainerA

---

# Final Rule

A screen should never feel handcrafted.

It should feel assembled from a consistent design language.

Users should recognize components instinctively.

Consistency builds trust.

---

End of Document 009
