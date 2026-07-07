# Finance Command Center

# Document 006 — Design Tokens

**Version:** 1.0

**Status:** Approved

**Priority:** Highest

**Depends On:**

001 Product Vision

002 Product Philosophy

003 Product Principles

004 Design Principles

005 Information Architecture

---

# Purpose

Design Tokens are the fundamental building blocks of the UI.

Every component in the application must use these tokens.

Never hardcode values inside components.

Changing a token should automatically update the entire application.

---

# Design Philosophy

Our interface should feel

• Calm

• Professional

• Modern

• Premium

• Lightweight

• Mobile First

Everything should look intentional.

Nothing should feel oversized.

Nothing should feel crowded.

---

# Target Device

Primary

iPhone

390 px

393 px

430 px

Secondary

Android

360–430 px

Desktop

Centered Mobile Layout

Never optimize desktop before mobile.

---

# Border Radius

Extra Small

8

Small

12

Medium

16

Large

20

Extra Large

24

Primary Cards

28

Floating Buttons

999

These values are fixed.

Do not invent new border radius values.

---

# Spacing Scale

Use only these spacing values.

4

8

12

16

20

24

32

40

48

64

Never use arbitrary spacing such as

13

19

27

31

37

Spacing should always come from the design scale.

---

# Touch Targets

Minimum

48 px

Preferred

52 px

Large Buttons

56 px

Never create touch targets below 48 px.

---

# Card Heights

Metric Card

110 px

Compact Card

130 px

Recommendation Card

160 px

Loan Card

Auto Height

Expandable Card

Collapsed

72 px

Expanded

Auto

Avoid unnecessary tall cards.

---

# Maximum Content Width

430 px

Desktop should center content.

Do not stretch layouts.

---

# Icon Sizes

Small

16

Default

20

Medium

24

Large

32

Hero

40

Use consistent icon sizes.

---

# Section Spacing

Between Sections

32 px

Between Cards

16 px

Inside Cards

20 px

Between Label and Value

8 px

These values should remain consistent throughout the application.

---

# Card Padding

Primary Card

24 px

Secondary Card

20 px

Metric Card

18 px

Compact Card

16 px

Do not increase padding simply because there is more screen space.

---

# Elevation

Level 0

No Shadow

Level 1

Subtle Shadow

Primary Cards

Level 2

Recommendation Card

Level 2

Floating Action Button

Level 3

Avoid heavy shadows.

Premium interfaces use subtle elevation.

---

# Corner Philosophy

Soft corners communicate friendliness.

Finance Command Center should never use sharp corners.

Rounded components create a calmer interface.

---

# Grid

Always use an 8-point grid.

Every measurement should align with the spacing scale.

---

# Typography Alignment

Labels

Left

Values

Left

Actions

Full Width

Never center large blocks of financial information.

Numbers should remain left-aligned for readability.

---

# Scroll Behavior

Home

Minimal scrolling

Loan Details

One natural scroll

Simulator

Collapsed

Money

Progressive Disclosure

Insights

Summary First

---

# White Space

Whitespace improves readability.

Whitespace should never become empty decoration.

Ask:

Does this space improve understanding?

If not,

reduce it.

---

# Density

Our application should feel

Comfortably Dense.

Not Empty.

Not Crowded.

Information should fit naturally on a mobile screen.

---

# Responsive Rules

Desktop

Center mobile layout.

Tablet

Slightly increase spacing.

Mobile

Default experience.

Never redesign layouts for desktop.

---

# Future Rule

Every future component must use these tokens.

No component may define its own spacing,

padding,

radius,

or dimensions.

Everything comes from Design Tokens.

---

End of Document 006
