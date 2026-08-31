# AGENTS.md

## Project Guidelines: Companion Health PWA

This file defines the project-wide rules that MUST be followed when creating, modifying, refactoring, reviewing, or planning changes to the codebase.

Detailed architectural rules are documented separately under:

```text
docs/architecture/
├── APPLICATION-ARCHITETURE.md
└── COMPONENT-ARCHITETURE.md
```

These documents are part of the project's implementation contract.

---

## 1. Documentation Hierarchy

The following hierarchy MUST be respected:

```text
AGENTS.md
    │
    ├── Project rules
    ├── Engineering standards
    ├── Security & privacy
    ├── Testing
    ├── Naming conventions
    │
    └── Architecture
         │
         ├── APPLICATION-ARCHITETURE.md
         └── COMPONENT-ARCHITETURE.md
```

### Authority

`AGENTS.md` is the primary project-level guideline.

The architecture documents provide the detailed architectural rules for the application.

When a task involves architecture, the relevant architecture document MUST be read before planning or implementing the change.

---

## 2. Mandatory Architecture References

### Application Architecture

For changes involving application structure, features, data flow, persistence, Server/Client boundaries, Server Actions, state management, synchronization, or business logic, read:

```text
docs/architecture/APPLICATION-ARCHITETURE.md
```

### Component Architecture

For changes involving components, UI, widgets, hooks, composition, component state, or presentation/business-logic separation, read:

```text
docs/architecture/COMPONENT-ARCHITETURE.md
```

### Both Documents

When a task affects both application structure and component architecture, BOTH documents MUST be read.

---

## 3. Implementation Plans

Implementation plans MUST follow the same rules as direct code changes.

Before executing a plan, the agent MUST:

1. Read `AGENTS.md`.
2. Identify which architectural areas are affected.
3. Read the applicable architecture documents.
4. Validate the plan against the documented architecture.
5. Identify architectural conflicts.
6. Adjust the plan if necessary.
7. Only then implement the changes.

The agent MUST NOT execute an implementation plan blindly.

A plan is considered valid only when it is compatible with the project's documented architecture.

---

## 4. Architectural Conflicts

If the requested implementation conflicts with the documented architecture:

- Do NOT silently introduce a different pattern.
- Do NOT ignore the architecture documentation.
- Do NOT duplicate an existing architectural solution.
- Do NOT change architectural boundaries without justification.

Instead:

1. Identify the conflict.
2. Explain why it exists.
3. Determine whether the existing architecture can satisfy the requirement.
4. If a deviation is necessary, document the reason.
5. Keep the deviation as small as possible.
6. Update the appropriate architecture documentation when the architectural decision becomes permanent.

---

## 5. General Architecture Principles

The project follows a Feature Module architecture.

Prefer:

- feature-oriented organization;
- clear module boundaries;
- explicit responsibilities;
- low coupling;
- high cohesion;
- reusable shared components;
- predictable dependency direction;
- simple solutions over unnecessary abstractions.

Detailed rules are defined in:

```text
docs/architecture/APPLICATION-ARCHITETURE.md
docs/architecture/COMPONENT-ARCHITETURE.md
```

---

## 6. Server & Client

Use React Server Components by default.

Use Client Components only when required for:

- interactive state;
- browser APIs;
- client-side hooks;
- effects;
- IndexedDB;
- localStorage;
- notifications;
- geolocation;
- other browser-only functionality.

Do not introduce `"use client"` without a concrete reason.

Client-only modules MUST NOT be imported into Server Components.

Detailed Server/Client boundaries are defined in:

```text
docs/architecture/APPLICATION-ARCHITETURE.md
```

---

## 7. Code Quality

Use:

- TypeScript with strict mode;
- ESLint;
- Prettier;
- type-safe APIs;
- meaningful abstractions;
- explicit types.

Avoid `any` when a proper type can be used.

Use JSDoc for public APIs and complex functions.

Do not introduce abstractions without a concrete need.

---

## 8. Naming Conventions

All code identifiers MUST use English.

This includes:

- components;
- props;
- hooks;
- functions;
- variables;
- types;
- interfaces;
- enums;
- files.

### Component Files

Use kebab-case:

```text
glucose-record-form.tsx
dashboard-header.tsx
glucose-range-badge.tsx
```

Exported component names use PascalCase:

```tsx
export function GlucoseRecordForm() {}
```

Hooks use camelCase with the `use` prefix:

```text
useGlucoseStore
useTimeline
useAuth
```

Types and interfaces use PascalCase.

Enums use UPPER_SNAKE_CASE.

---

## 9. Testing

Testing is part of the implementation.

Use the appropriate testing strategy for each change.

### Unit

Use for:

- pure functions;
- utilities;
- hooks;
- business rules;
- data transformations.

### Integration

Use for:

- feature flows;
- persistence;
- synchronization;
- Server Actions;
- interactions between modules.

### E2E

Use Playwright for critical user journeys.

### Accessibility

Validate:

- keyboard navigation;
- focus states;
- accessible names;
- semantic HTML;
- form labels;
- appropriate ARIA;
- contrast;
- reduced motion.

Existing test coverage MUST be preserved during refactoring unless a change is explicitly required.

---

## 10. Accessibility

All interactive features MUST support:

- keyboard navigation;
- visible focus states;
- semantic HTML;
- accessible labels;
- appropriate ARIA;
- adequate contrast;
- screen readers.

Color MUST NOT be the only mechanism used to communicate state.

Respect:

```css
prefers-reduced-motion
```

for animations and transitions.

---

## 11. Mobile-First

The application follows a mobile-first approach.

Requirements:

- design for mobile first;
- responsive layouts;
- minimum 48px touch targets;
- no hover-only interactions;
- appropriate spacing;
- accessible forms and controls.

Feature-specific layout rules should follow the project design documentation and applicable architecture rules.

---

## 12. Local-First & Offline-First

The application follows local-first principles.

Structured client-side data SHOULD use IndexedDB.

Use `localStorage` only for simple key-value preferences.

Offline functionality, synchronization, conflict resolution, persistence, and Service Worker behavior MUST follow:

```text
docs/architecture/APPLICATION-ARCHITETURE.md
```

---

## 13. Security & Privacy

Health-related application data MUST be handled according to privacy-by-design principles.

The application MUST:

- avoid unnecessary data exposure;
- provide explicit user control over sharing;
- validate imported data;
- protect local data where technically feasible;
- provide data deletion mechanisms;
- avoid automatic data sharing.

User data MUST NOT be shared automatically or in the background without explicit user action.

---

## 14. Refactoring

Refactoring MUST preserve existing behavior unless behavior change is explicitly part of the task.

Before refactoring:

1. Understand the existing implementation.
2. Identify architectural responsibilities.
3. Read the applicable architecture documentation.
4. Identify dependencies.
5. Identify existing tests.
6. Define the smallest safe change.

Do NOT refactor solely to reduce file size or line count.

Prefer incremental, testable refactoring.

---

## 15. New Features

Before implementing a new feature:

1. Identify the business domain.
2. Identify the appropriate feature module.
3. Read the relevant architecture documentation.
4. Define responsibilities and boundaries.
5. Determine Server/Client requirements.
6. Determine persistence requirements.
7. Define loading, error, empty, and offline states where applicable.
8. Define testing requirements.
9. Implement according to the architecture.
10. Validate the final implementation against the architecture.

Do NOT introduce a new architectural pattern when an existing documented pattern already solves the problem.

---

## 16. Architectural Changes

New architectural patterns, layers, abstractions, or communication mechanisms MUST NOT be introduced without justification.

Before introducing one, document:

- the problem;
- why the current architecture is insufficient;
- alternatives considered;
- proposed solution;
- trade-offs;
- affected modules;
- testing impact.

Permanent architectural changes MUST be reflected in the appropriate architecture document.

---

## 17. Completion Checklist

Before considering a task complete:

### Architecture

- [ ] `AGENTS.md` was followed.
- [ ] Relevant architecture documents were reviewed.
- [ ] Feature boundaries are preserved.
- [ ] Component responsibilities are clear.
- [ ] Server/Client boundaries are correct.
- [ ] No unnecessary architectural pattern was introduced.

### Code

- [ ] TypeScript passes.
- [ ] ESLint passes.
- [ ] Naming conventions are respected.
- [ ] No unnecessary `any` types were introduced.
- [ ] Business logic is located appropriately.

### Testing

- [ ] Existing tests pass.
- [ ] New tests were added where necessary.
- [ ] Critical flows were validated.
- [ ] Accessibility was considered.

### UX

- [ ] Mobile-first behavior works.
- [ ] Responsive behavior works.
- [ ] Loading states are handled where necessary.
- [ ] Error states are handled where necessary.
- [ ] Empty states are handled where necessary.
- [ ] Offline behavior is handled where applicable.

---

## 18. Final Rule

Before modifying code, the agent MUST determine:

> Which rules from `AGENTS.md`, `APPLICATION-ARCHITETURE.md`, and `COMPONENT-ARCHITETURE.md` apply to this task?

The agent MUST read the applicable documentation before implementation.

The architecture documentation is not optional reference material.

It is part of the project's implementation contract.

When documentation and implementation disagree, the discrepancy MUST be identified and resolved explicitly.

Do not silently ignore architectural rules.
