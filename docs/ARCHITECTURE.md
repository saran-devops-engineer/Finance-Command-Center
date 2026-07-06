# Architecture

Finance Command Center follows a clean, local-first architecture.

The UI should display derived financial views. It should not own financial decision logic.

## Current Structure

```txt
src/
  app/
  components/
  features/
  hooks/
  lib/
  repositories/
  services/
  shared/
  storage/
```

## Layers

### App Layer

`src/app`

Owns routing and page composition.

Pages should stay thin and delegate behavior to feature screens.

### Feature Layer

`src/features`

Owns screen-level UI and feature-specific presentation.

Feature components can call repositories through client-side flows, but business calculations should move into services.

### Component Layer

`src/components`

Reusable UI and layout primitives.

Examples:

- cards
- buttons
- mobile shell
- bottom navigation
- finance display components

### Domain Layer

`src/shared/domain`

Shared financial types and interfaces.

Do not duplicate core financial types inside screens.

### Services Layer

`src/services`

Business and financial logic.

Current services:

- financial snapshot
- recommendation engine
- loan projection
- loan payment

### Repository Layer

`src/repositories`

Data access interfaces and implementations.

UI should not directly know IndexedDB internals.

### Storage Layer

`src/storage`

IndexedDB schema and persistence setup.

IndexedDB is the V1 source of truth.

## Local-First Rule

All user data must remain local in V1.

Future sync should be added below the repository boundary.

Do not introduce backend calls, cloud persistence, or auth without explicit product approval.

## Decision Engines

Keep these modular:

- available money calculation
- financial health assessment
- recommendation generation
- loan prepayment simulation
- loan payment application

## PWA Direction

The app should remain installable and offline-ready.

Future work should add a service worker without changing domain or repository boundaries.
