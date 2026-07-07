# Finance Command Center

# Document 008 — Spacing & Layout System

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

---

# Purpose

This document defines the spatial structure of the application.

Every screen, section, card, button, list and component must follow these layout rules.

No screen should invent its own spacing.

Spacing should create rhythm.

Users should unconsciously feel consistency.

---

# Mobile First

Finance Command Center is designed for mobile devices first.

Primary Design Widths

390 px

393 px

430 px

Desktop is simply a centered mobile experience.

Never stretch content simply because more space exists.

---

# Maximum Content Width

430 px

Desktop

Center the content.

Never allow layouts to become excessively wide.

---

# Screen Padding

Horizontal

20 px

Vertical

24 px

These values remain consistent across the application.

Never reduce screen padding to fit more content.

---

# Vertical Rhythm

Every screen follows the same rhythm.

Page Header

↓

32 px

↓

Primary Card

↓

24 px

↓

Section

↓

16 px

↓

Cards

↓

32 px

↓

Next Section

Every screen should feel familiar.

---

# Section Spacing

Large Sections

32 px

Normal Sections

24 px

Small Groups

16 px

Never invent intermediate spacing.

---

# Card Spacing

Between Primary Cards

20 px

Between Secondary Cards

16 px

Between Metrics

12 px

Between Inline Items

8 px

---

# Card Padding

Primary Cards

24 px

Loan Cards

20 px

Metric Cards

18 px

Compact Cards

16 px

Recommendation Cards

24 px

Padding should never depend on screen size.

---

# Card Heights

Metric Card

110 px

Compact Card

130 px

Recommendation Card

160 px

Expandable Card

Collapsed

72 px

Expanded

Auto Height

Loan Card

Auto Height

Never artificially increase card heights.

Cards should grow only when content requires it.

---

# Card Alignment

Every card follows the same structure.

Label

↓

8 px

↓

Value

↓

12 px

↓

Supporting Text

↓

Action

Values should always begin at the same vertical position across cards.

---

# Grid System

Finance Command Center uses a 12-column responsive grid internally.

However,

mobile layouts should visually behave as:

Single Column

or

Two Equal Columns

Avoid three-column layouts on mobile.

---

# Metric Cards

Metric cards should appear in pairs.

Example

Income      Expenses

Debt        Savings

EMI         Interest

Avoid three small cards squeezed into one row.

Two-column layouts improve readability.

---

# Lists

Every list item follows

Icon

↓

Title

↓

Subtitle

↓

Trailing Value

↓

Chevron

Spacing must remain identical.

---

# Buttons

Primary Button

Full Width

Height

52 px

Secondary Button

Full Width

Height

48 px

Floating Button

56 px

Never create small tap targets.

---

# Forms

Each input

↓

16 px

↓

Next input

Section

↓

24 px

↓

Buttons

Do not stack inputs without breathing space.

---

# Expandable Sections

Collapsed Height

72 px

Expanded

Content Driven

Animation

250–300 ms

Ease In Out

Expandable cards should never jump open.

---

# Bottom Navigation

Always fixed.

Respect device safe areas.

Height

64 px

Icon

20 px

Label

12 px

Equal spacing between items.

---

# Scroll Behaviour

Home

Minimal scrolling.

Loan Details

One natural scroll.

Money

Summary first.

Details later.

Simulation

Collapsed until requested.

Never create endless scrolling.

---

# Safe Areas

Always respect

iPhone notch

Dynamic Island

Home Indicator

Android gesture navigation

No content should touch device edges.

---

# Empty Space

Whitespace is intentional.

However,

Whitespace must improve understanding.

Never increase spacing simply because space exists.

---

# Responsive Behaviour

Mobile

Default

Tablet

Increase horizontal spacing only.

Desktop

Center mobile layout.

Do not redesign layouts.

---

# Thumb Reach

Frequently used actions should remain in the lower half of the screen whenever possible.

Avoid placing important actions in the top-right corner of long pages.

---

# Layout Rules

Every screen follows

Header

↓

Primary Information

↓

Recommendation

↓

Supporting Information

↓

Actions

↓

Details

↓

Advanced Features

Users should never see advanced information before understanding the summary.

---

# Home Layout

Greeting

↓

Available Money

↓

Recommendation

↓

Upcoming Due

↓

Priority Loan

↓

Quick Actions

Nothing else.

---

# Loan Details Layout

Loan Overview

↓

Progress

↓

Payment Summary

↓

History

↓

What-if Simulator (Collapsed)

Never display simulations before users understand the loan.

---

# Money Layout

Income

↓

Expenses

↓

Available Money

↓

Allocation

↓

Breakdowns

↓

History

---

# Insights Layout

Most Important Recommendation

↓

Reason

↓

Expected Benefit

↓

Action

Avoid multiple competing recommendations.

---

# Layout Checklist

Before approving any screen ask

✓ Can users understand the screen within ten seconds?

✓ Is scrolling minimized?

✓ Does every section justify its space?

✓ Is information ordered correctly?

✓ Is the page balanced?

✓ Is the page comfortable to use with one hand?

✓ Does spacing follow the design system?

✓ Is there unnecessary whitespace?

✓ Is there unnecessary clutter?

If any answer is "No",

revise the layout.

---

# Final Rule

Spacing is not decoration.

Spacing communicates importance.

If everything has equal spacing,

nothing is important.

Use spacing to guide attention.

---

End of Document 008.
