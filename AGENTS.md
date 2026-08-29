<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Guidelines: Companion Health PWA

This document supplements the Next.js agent rules with project-specific best practices, conventions, and rules derived from the DESIGN.md and INTERFACE.md specifications.

## 1. Architecture & Project Structure

### Feature-Module Organization
- Organize code by feature module, not by file type
- Each feature module contains: `components/`, `hooks/`, `utils/`, `types.ts`, and optional `actions.ts`
- Module folders reside under `src/features/` or `src/app/(feature)/`
- Shared components go to `src/components/ui/` (shadcn/ui base) and `src/components/shared/`

```text
src/
├── app/              # Next.js app router routes
├── features/         # Feature modules (grouped by business domain)
│   ├── auth/         # Authentication flow
│   ├── dashboard/    # Dashboard and quick actions
│   ├── records/      # Glucose, meal, activity records
│   ├── timeline/     # Timeline/chronological view
│   ├── statistics/   # Charts and insights
│   ├── settings/     # Preferences and privacy
│   └── ...           # Other features
├── components/       # Shared/UI components
│   ├── ui/           # shadcn/ui primitives
│   └── shared/       # Cross-feature components
├── lib/              # Utility functions and helpers
├── hooks/            # Custom React hooks
├── hooks/server/     # Server-only hooks
└── styles/           # Global styles and CSS modules
```

### Server Components by Default
- Use React Server Components (RSC) by default
- Only opt into Client Components (`'use client'`) when necessary for interactivity, state, or browser APIs
- Keep data-fetching and business logic in Server Components or Server Actions

### Page → Widget → UI Architecture (Feature-based)
Route pages follow a Feature-based Widget/UI architecture. The route page is only an entry point; behavior lives in widgets and pure presentation lives in UI components.

```text
Page     app/(app)/<route>/page.tsx            → thin entry point, composes the widget
Widget   components/features/<feature>/widget/ → hooks, data-fetching, state, composition
UI       components/features/<feature>/ui/     → pure presentational components (props-only)
```

Conventions:
- **`*.widget.tsx`** — owns behavior: hooks, `useEffect`, data fetching, state, error/loading/empty handling, and composition of UI components. Example: `dashboard.widget.tsx`.
- **`*.ui.tsx`** — purely presentational: no business rules, no feature state, no hooks/effects/API calls; receives everything it renders via props. Examples: `dashboard-header.ui.tsx`, `glucose-page-header.ui.tsx`, `meal-page-header.ui.tsx`.
- UI components must not import from `widget/` at runtime; shared feature types live in `components/features/<feature>/types.ts` and pure helpers in `components/features/<feature>/utils/`.
- Feature-specific hooks live in `components/features/<feature>/hooks/` (e.g. `use-today-range.ts`).
- Pure data derivation lives in `widget/<feature>.data.ts`.

#### When to apply the pattern (and when not to)
The `Page → Widget → UI` split is **only** applied when a page has a real architectural need — multiple independent responsibilities, significant state/CRUD orchestration, filters, loading/error/empty handling, or UI that needs isolated testing or reuse. **Do not** split a page just to reduce line count or for standardization.

Apply when:
- CRUD list/manager pages (glucose, meals, activity, notes, timeline) — auth + filters + data hooks + dialog/delete state + toasts + list/empty/loading/error composition.
- The page integrates many independent concerns or mixes business rules with JSX.

Keep simple / single-responsibility pages as-is:
- Landing (`app/page.tsx`), auth forms (`login`, `signup`), and static/mock pages (`medications`, `reports`, `statistics`, `settings`) remain thin, cohesive pages.
- A `page.tsx` that is a small composition or a single cohesive form should not be refactored.

#### Feature responsibilities map
| Page | Widget | UI |
| --- | --- | --- |
| `app/(app)/dashboard/page.tsx` | `dashboard.widget.tsx` (auth + 4 health hooks orchestration, today-range, loading/error) | `dashboard-header.ui.tsx`, `last-reading-card.ui.tsx`, `quick-actions.ui.tsx`, `day-summary-list.ui.tsx`, `summary-card.ui.tsx` |
| `app/(app)/glucose/page.tsx` | `glucose.widget.tsx` (filter state, dialog/delete state, CRUD, toasts) | `glucose-page-header.ui.tsx` (title + context pills + period filter) |
| `app/(app)/meals/page.tsx` | `meal.widget.tsx` | `meal-page-header.ui.tsx` |
| `app/(app)/activity/page.tsx` | `activity.widget.tsx` | `activity-page-header.ui.tsx` |
| `app/(app)/notes/page.tsx` | `notes.widget.tsx` | `notes-page-header.ui.tsx` (title + period filter + note composer) |
| `app/(app)/timeline/page.tsx` | `timeline.widget.tsx` (type + period filters, timeline hook) | `timeline-page-header.ui.tsx` (title + type pills + period filter) |

The feature list components (`*-list.tsx`) and form dialogs (`*-form-dialog.tsx`) live alongside their feature as cooperative components consumed by the widget; only fully presentational blocks specific to the page shell are extracted behind `*.ui.tsx`.

#### Page Components Audit Log
Objective: audit every `app/**/page.tsx` and refactor only pages with genuinely excessive responsibility (mixing UI, state, business rules, data access, and behavior). Pages are **not** refactored merely for line count; simplicity is preserved where adequate.

Criteria used to identify complex pages: multiple independent responsibilities, several `useState`/hooks, extensive event handlers, CRUD orchestration, filters, loading/error/empty states, business rules mixed into JSX, limited isolated testability, high coupling.

Páginas analisadas (13 total):
- Mantidas (KEEP, without change): `app/page.tsx` (landing composition), `app/(app)/dashboard/page.tsx` (already thin entry point), `app/(app)/medications`, `app/(app)/reports`, `app/(app)/statistics`, `app/(app)/settings` (static/mock single-responsibility pages), `app/(public)/login`, `app/(public)/signup` (cohesive single-purpose forms).
- Refatoradas (REFACTOR): `app/(app)/glucose`, `app/(app)/meals`, `app/(app)/activity`, `app/(app)/notes`, `app/(app)/timeline` — each previously mixed auth, filter state, data hook, dialog/delete state, submit/delete logic, toasts, empty state and JSX composition on a single page.

Estrutura adotada and decisions:
- Each refactored route page became a `"use client"` thin entry point that renders its `<Feature>Widget`. All behavior/state/data moved into `widget/<feature>.widget.tsx`; the page-shell presentational block (title header + filter pills + period filter, or composer) was extracted into `ui/<feature>-page-header.ui.tsx`.
- Reused existing feature components (`*-list.tsx`, `*-form-dialog.tsx`, `note-composer.tsx`) and shared components (`empty-state`, `list-skeleton`, `error-state`, `confirm-delete-dialog`, `option-pills`, `period-filter`, `page-header`) instead of duplicating.
- Server/Client care: no new `"use client"` beyond what the pages already required for state/hooks; no server data-fetching was moved to the client; existing hook/service boundary unchanged.
- No new business logic, API contracts, or UX behavior were introduced — refactor was purely structural.

Testing strategy: preserved all existing `lib/**/*.test.ts` coverage (all paths through services/hooks remain unchanged); the extracted UI components are stateless and receive props, remaining trivially testable in isolation. Validation performed: `tsc --noEmit`, `eslint`, `vitest run`, `next build` — all green after the refactor.

## 2. Server Actions & Client Components

## 3. Mobile-First & Responsive Design

## 4. Local First & Offline-First

## 5. Component Guidelines

### File Naming
- Component files use kebab-case file names (e.g., `glucose-record-form.tsx`), regardless of the PascalCase component name they export. See "Component File Names" under English Component Naming.

## 6. Form & Record Handling

## 7. Testing

## 8. Accessibility (WCAG per INTERFACE.md #29)

## 9. Microinteractions (INTERFACE.md #30)

## 10. Offline & Sync Strategy (INTERFACE.md #20, #21, #34)

## 11. PWA & Installation (INTERFACE.md #24)

## 12. Security & Privacy (INTERFACE.md #22)

## 13. English Component Naming

## 14. Linting & Formatting

### Code Quality
- Use TypeScript with strict mode
- ESLint with Next.js recommended config
- Prettier for code formatting
- No `any` types where interfaces or types can be used
- JSDoc for public APIs and complex functions

### Commit Messages
- Conventional commits format
- Reference relevant issues
- Keep messages concise but descriptive

---
*This AGENTS.md file is a living document. Update it as the project evolves and new best practices emerge. Review against DESIGN.md and INTERFACE.md specifications periodically.*


All component files, hooks, utilities, and identifiers MUST use English names, consistent with the project's internationalization and codebase standards:

### Component File Names
- Component files must use kebab-case (lowercase, hyphen-separated) file names, e.g. `glucose-record-form.tsx` — never PascalCase file names like `GlucoseRecordForm.tsx`
- The exported component identifier stays PascalCase (e.g. a file `glucose-record-form.tsx` exports `export function GlucoseRecordForm`)
- Applies to feature components (`components/features/**`), shared components (`components/shared/**`) and UI primitives (`components/ui/**`)
- Test files follow the same convention: `glucose-record-form.test.ts`

### Examples
- ✅ File `glucose-record-form.tsx` exporting `GlucoseRecordForm` (not `FormDeRegistroDeGlicemia`)
- ✅ `useAuthStore` (not `useLojaDeAutenticacao`)
- ✅ File `glucose-range-badge.tsx` exporting `GlucoseRangeBadge` (not `BadgeDaFaixaDeGlicemia`)
- ✅ `saveGlucoseReading()` (not `salvarLeituraDeGlicemia()`)
- ✅ `GlucoseReading` type (not `LeituraDeGlicemia`)
- ✅ File `dashboard-header.tsx` exporting `DashboardHeader` (not `CabecalhoDoDashboard`)

### Rationale
- English is the universal language for code maintenance
- Easier onboarding for contributors
- Consistent with React/Next.js ecosystem
- Aligns with shadcn/ui and library conventions (kebab-case file names, e.g. `button.tsx`, `date-time-input.tsx`)


### Data Protection
- Local storage preference with user consent
- Data encryption at rest when technically feasible
- Session timeout and automatic logout
- Lock application after inactivity
- PIN or biometric lock option (when available)
- Clear option to delete all data with confirmation

### Privacy Screen
- "Privacidade e segurança" screen per INTERFACE.md #22
- Show storage status and data count
- Export data option
- Delete all data with confirmation
- Block application feature

### Never Share Automatically
- User must explicitly initiate any sharing (INTERFACE.md #18)
- Web Share API with proper fallback
- Copy to clipboard as fallback when Web Share unavailable
- Never share data in background without user action


### Manifest & Icons
- `manifest.webmanifest` with appropriate icons
- Icons for various sizes (192px, 512px minimum)
- Theme color matching DESIGN.md primary palette
- Shortcuts for quick actions (glucose record, timeline, settings)

### Service Worker Registration
- Register at app startup
- Strategic caching: app shell + critical assets
- Update strategy: background sync on new SW installation
- Show "Instalar aplicativo" component when PWA criteria met (INTERFACE.md #24)

### Installation Prompt
- Detect browser capabilities for PWA installation
- Show install prompt only when it makes sense (not on every visit)
- Mobile: after meaningful usage, desktop: on first visit or via settings


### Data Persistence Flow
1. User submits record → Server Action saves to IndexedDB locally
2. Show immediate local feedback: "Registro salvo neste dispositivo"
3. When online, attempt sync with backend
4. On success: "Dados sincronizados." (INTERFACE.md #34)
5. On failure: Show error and keep local copy in queue

### Conflict Resolution
- Version stamps on records
- Last-write-wins for simple records
- Manual conflict resolution for complex scenarios
- User notification: "Houve um conflito de sincronização. Dados locais mantidos."

### Backup & Export
- Export functionality: JSON, CSV, PDF formats (INTERFACE.md #19)
- "Fazer backup dos meus dados" option in Settings
- Import with validation before committing
- Show quantity of records and potential conflicts before import


### When to Include
- Only when they improve the experience (not decorative/enhance understanding or feedback
- Keep them discrete and functional

### Approved Microinteractions
- **Save feedback**: Small scale reduction (98%) on button press (DESIGN.md)
- **Toast appearance**: Pill format sliding in from top
- **Chart transitions**: Smooth updates when data changes
- **Offline/online indicator**: Subtle state change
- **Button hover**: Subtle color tone shift (not on disabled)
- **Card hover**: Gentle lift effect (Level 2 shadow)

### Animation Guidelines
- Use `prefers-reduced-motion` media query
- Duration: 150-300ms for most transitions
- Easing: ease-out for natural feeling
- No auto-playing animations without user interaction
- Respect user preferences for motion


### Required Implementations
- Keyboard navigation on all interactive elements
- Visible focus states (not removed or customized to invisible)
- Proper `<label>` elements associated with form inputs
- ARIA labels where text labels aren't possible
- Contrato adequado (verify against color palette from DESIGN.md)
- Respect `prefers-reduced-motion` - reduce animations for affected users
- Skip navigation links for screen readers
- Landmark regions for main content, navigation, and footer

### Specific Requirements from DESIGN.md
- Never use color as the only mechanism to communicate state
- Combine color with text, icons, or other visual indicators
- Body text line-height: 1.5x for readability
- Headline-lg with tighter letter-spacing for numeric emphasis
- Focus ring: 2px teal border on input fields

### Reduced Motion
- Respect `prefers-reduced-motion` media query
- Reduce or eliminate automatic animations
- Provide static alternatives for interactive animations


### Testing Strategy
- Unit tests for utility functions and hooks
- Integration tests for critical user flows (registration, sync)
- E2E tests for complete registration flows
- Accessibility tests (WCAG compliance)

### Test Files
- `__tests__/` directories alongside feature modules
- Naming convention: `component-name.test.ts` or `component-name.spec.ts` (kebab-case, matching the file under test)
- Use Jest + React Testing Library for unit/integration
- Use Playwright for E2E tests

### Key Test Flows
1. Glucose record flow: open form → input value → save → verify toast → check dashboard update
2. Offline flow: disable network → record data → enable network → verify sync
3. Responsive flow: resize browser → verify layout adapts breakpoints
4. Accessibility: keyboard navigation, screen reader labels, contrast ratios


### Quick Action Registration
- Mobile: Bottom navigation with quick actions
- Principal actions: Glucose, Meal, Activity, Medication, Note
- FAB or fixed action area for primary recording
- Minimum interactions: open → fill minimum → save → return to dashboard

### Form Best Practices
- Pre-fill last used values where appropriate
- Auto-fill date/hora automatically
- Appropriate keyboard type for each field (`type="number"` for glucose, `type="date"` for dates, etc.)
- Instant validation with clear error messages
- Edit capability after initial save
- Show feedback after action: "Glicemia registrada com sucesso." (INTERFACE.md #34)

### Validation
- Client-side validation with clear messages
- Server-side validation in Server Actions
- Never lose user input on validation failure


### Naming Conventions
- **All component names, props, and identifiers in English** (per project requirement)
- Component file names: kebab-case, lowercase and hyphen-separated (e.g., `glucose-record-form.tsx`; see "Component File Names")
- Component export identifiers: PascalCase (e.g., `export function GlucoseRecordForm`)
- Hook names: camelCase with `use` prefix (e.g., `useGlucoseStore`)
- Type/interface names: PascalCase
- Enum names: UPPER_SNAKE_CASE

### Core UI Components (shadcn/ui based)
Following DESIGN.md component specifications:

**Button Component**
- Primary: filled with `primary_color`, white text, `rounded-lg`
- Secondary: Ghost style with teal outline or light teal tint
- Touch feedback: scale to 98% on press
- Variants: `default`, `destructive`, `outline`, `secondary`, `link`

**Input Component**
- Minimum height: 48px
- Light gray background
- Teal border (2px) only on focus
- Labels always visible above the field
- Support for `type`, `placeholder`, `disabled` states

**Card Component**
- 16px internal padding
- 20px border-radius (per DESIGN.md)
- Ambient shadows per DESIGN.md:
  - Level 1: Blur 15px, Y: 4px, 5% black opacity
  - Level 2: Blur 20px, Y: 8px, 8% primary color opacity
- Used for grouping related data (e.g., "Morning Record", "Active Insulin")

**Badge/Chip Component**
- Soft style: lightly colored background, dark text using same color tone
- Status colors per DESIGN.md:
  - In Range: Success (Emerald)
  - High: Warning
  - Critical: Alert
- Used for glucose range indicators

**Toast Component**
- Position: top of screen
- "Pill" format
- Lucide icons for visual reinforcement
- Messages: "Registro salvo com sucesso.", etc.
- Auto-dismiss after appropriate duration

**EmptyState Component**
- Message like "Ainda não há registros hoje."
- CTA: "Registrar primeira glicemia"
- Visual icon state

**LoadingState / Skeleton Component**
- For data loading states
- Respects `prefers-reduced-motion`

### OfflineIndicator Component
- Shows when user is offline
- Message: "Você está offline. Seus dados continuam disponíveis neste dispositivo."
- Reconnects automatically when network restores

### SyncStatus Component
- Indicates sync status with backend
- Shows syncing state when connection restores
- "Conexão restaurada. Sincronizando dados..." (INTERFACE.md #20)


### IndexedDB Storage
- Use IndexedDB as the primary data store (per INTERFACE.md #21)
- Create a persistence layer abstraction to allow future backend migration
- Entity structure per INTERFACE.md #21:
  - User/Profile
  - GlucoseReading
  - Meal
  - PhysicalActivity
  - Medication
  - Note
  - TimelineEvent
  - Settings

### Service Worker & Cache Strategy
- Register Service Worker for PWA support (INTERFACE.md #24)
- Implement Cache API strategies:
  - Cache-first for static assets (CSS, JS, images)
  - Stale-while-revalidate for API data
  - Network-first for critical data with offline fallback
- Store offline-capable versions of pages in cache

### Offline Experience
- Display offline indicator when connectivity is lost (INTERFACE.md #20)
- Queue new records for local storage when offline
- Auto-sync when connection is restored (INTERFACE.md #20)
- Show toast: "Você está offline. Seus dados continuam disponíveis neste dispositivo." (INTERFACE.md #20, #34)

### Local Storage vs IndexedDB
- Use IndexedDB for structured data (records, settings)
- Use `localStorage` only for simple key-value preferences, never for structured records


### Mobile-First Breakpoints
Following the DESIGN.md specification, use these CSS breakpoints:

```css
/* Mobile first - no media query needed for base styles */
@media (min-width: 640px) { /* sm */ }
/* Tablet */
@media (min-width: 768px) { /* md */ }
/* Desktop - dashboard layout */
@media (min-width: 1024px) { /* lg */ }
/* Large desktop - dashboard */
@media (min-width: 1140px) { /* xl for dashboards */ }
```

### Layout Guidelines
- **Mobile**: Single column layout with 20px side margins (per DESIGN.md)
- **Tablet/Desktop**: Max-width containers - 768px for reading/record screens, 1140px for dashboards
- **Spacing rhythm**: 8px scale base (`BASE: 4px`, `SM: 8px`, `MD: 16px`, `LG: 24px`, `XL: 32px`)
- **Gutter**: 16px between grid items
- **Container margin**: 20px on sides

### Touch Targets
- Minimum 48px height for input fields and tap targets (DESIGN.md)
- Adequate spacing between interactive elements
- No reliance on hover-only states


### When to use Server Actions
- Form submissions (record glucose, meals, activities, medications)
- Data mutations (create, update, delete readings)
- Authentication flows
- Data export/import operations
- Sync operations with IndexedDB

### When to use `'use client'`
- State that changes interactivity (form state, toggles, modals)
- Browser API access (localStorage, IndexedDB, geolocation, notification permission)
- Client-only data fetching (use SWR or React Query for hydration)
- Components that use `useState`, `useEffect`, or other hooks

### Import Rules
- Never import Client-only utilities in Server Components
- Server Actions must be defined in `actions.ts` files or route handlers
- Export Server Actions from a central index if used across multiple files
- Use `import action from './actions'` pattern for type-safe Server Actions


