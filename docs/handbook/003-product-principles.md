# Finance Command Center

# Document 003 — Product Principles

**Version:** 1.0

**Status:** Approved

**Priority:** Highest

**Depends On:**
- 001 - Product Vision
- 002 - Product Philosophy

---

# Purpose

This document defines the non-negotiable product rules.

These principles exist to ensure that every feature, screen, calculation, workflow, and future enhancement feels like it belongs to the same product.

If any implementation conflicts with these principles, these principles take precedence.

---

# Principle 1
## One Screen = One Decision

Every screen should help the user answer one primary question.

Examples

Home

> Am I financially okay?

Loans

> Which loan deserves my attention?

Money

> Where did my salary go?

Insights

> What should I do next?

Simulation

> What happens if I make this financial decision?

Profile

> How is my data managed?

Never allow a screen to answer multiple unrelated questions.

---

# Principle 2
## Every Number Must Have Meaning

Never display financial numbers without context.

Bad

Outstanding

₹22,00,000

Good

Outstanding

₹22,00,000

Remaining principal after all payments made.

Bad

Interest Saved

₹4,20,000

Good

Making this prepayment could reduce your total interest by approximately ₹4,20,000 over the remaining tenure.

Numbers should explain themselves.

---

# Principle 3
## Information Must Become Action

Information alone has little value.

Every important piece of information should naturally lead to an action.

Examples

Upcoming Due

↓

Pay before 10 July

Highest Interest Loan

↓

Review Prepayment

Available Money

↓

Allocate Surplus

No dead-end information.

---

# Principle 4
## Never Ask Twice

If the application already knows something,

never ask the user to enter it again.

Examples

Loan already contains:

• Interest Rate

• EMI

• Remaining Balance

• Tenure

Simulation should reuse these values automatically.

Duplicate data entry is considered poor user experience.

---

# Principle 5
## One Source of Truth

Every important value should have exactly one owner.

Examples

Outstanding Balance

↓

Loan Repository

Available Money

↓

Cash Flow Engine

Interest Saved

↓

Simulation Engine

Never duplicate calculations.

Never store derived values unnecessarily.

Always calculate from trusted sources.

---

# Principle 6
## Accuracy Before Features

A smaller product with accurate calculations is better than a larger product with unreliable advice.

Never release financial features that have not been mathematically validated.

---

# Principle 7
## Explain Recommendations

Recommendations must never feel random.

Every recommendation should explain:

Why

Expected benefit

Possible trade-offs

Users should understand the reasoning.

---

# Principle 8
## Progressive Disclosure

Only show what is necessary.

Advanced functionality should remain hidden until requested.

Example

Loan Details

↓

What-if Simulator

↓

Expand

↓

Choose Strategy

↓

Run Simulation

Avoid overwhelming first-time users.

---

# Principle 9
## Mobile First

Every feature must be designed for mobile before desktop.

Primary target widths

390 px

393 px

430 px

Desktop is an adaptation,

not the primary experience.

---

# Principle 10
## Home Is A Summary

Home is not a dashboard.

Home summarizes.

Users should understand their financial position within ten seconds.

Do not display every loan,

every reminder,

every graph,

or every statistic.

---

# Principle 11
## Details Stay Inside Modules

Home should summarize.

Modules should explain.

Examples

Home

↓

Upcoming Due

Loans

↓

Complete repayment schedule

Money

↓

Detailed cash flow

Insights

↓

Reasoning

Avoid repeating the same information across screens.

---

# Principle 12
## Every Screen Must Earn Its Space

Ask:

"If this section disappeared,

would the user lose an important decision?"

If the answer is No,

remove it.

---

# Principle 13
## No Duplicate Information

The same information should not appear on multiple screens unless it serves a different purpose.

Example

Home

↓

Available Money

Money

↓

Breakdown of Available Money

Insights

↓

How to use Available Money

Each screen should add value.

---

# Principle 14
## Trust Is Everything

Users trust us with sensitive financial information.

Never exaggerate savings.

Never make assumptions without stating them.

Never provide misleading recommendations.

Trust is our biggest feature.

---

# Principle 15
## Financial Decisions Should Feel Calm

The application should reduce stress,

not increase it.

Avoid unnecessary alerts,

animations,

or warnings.

Use emphasis only when something genuinely needs attention.

---

# Principle 16
## Simulations Never Change Reality

Running a simulation must never modify the user's actual financial data.

Simulations create temporary scenarios.

Users choose whether to act on those scenarios outside the application.

---

# Principle 17
## Calculations Must Be Deterministic

Given the same inputs,

the application must always produce the same outputs.

Avoid hidden assumptions.

Document every financial formula.

---

# Principle 18
## Build Platforms, Not Features

Avoid isolated implementations.

Example

Simulation Engine

↓

Recommendation Engine

↓

AI Advisor

↓

Investment Planner

should reuse the same financial foundation.

Think in systems,

not individual screens.

---

# Principle 19
## Remove Before Adding

Before adding a new section,

first ask:

"What existing section can be simplified or removed?"

The application should become smarter,

not larger.

---

# Principle 20
## Design For Five Years

Every architecture decision should support future growth.

Examples

Adding new loan types

Adding investments

Adding retirement planning

Adding AI recommendations

Adding cloud backup

Avoid solutions that require rewriting major parts of the application later.

---

# Engineering Principles

These principles are mandatory.

• Single Responsibility Principle

• Separation of UI and Business Logic

• Reusable Components

• Modular Architecture

• Strong Typing

• Offline First

• Privacy First

• Local First

• Secure By Default

---

# Product Checklist

Before implementing any feature, ask:

✓ Does this help users make a better decision?

✓ Does it reduce uncertainty?

✓ Does it increase trust?

✓ Does it avoid duplicate data?

✓ Is it mobile friendly?

✓ Can a first-time user understand it?

✓ Is the recommendation explainable?

✓ Is the calculation mathematically correct?

✓ Does it respect user privacy?

✓ Does it align with our philosophy?

If any answer is "No",

reconsider the implementation.

---

# Final Rule

Whenever there is uncertainty,

choose the option that is:

Simpler.

More trustworthy.

More maintainable.

More transparent.

More helpful to the user.

These values always outweigh adding another feature.

---

End of Document 003.
