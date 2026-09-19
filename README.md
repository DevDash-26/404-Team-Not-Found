# OneUni

DevDash'26 Hackathon Project by 404 Team Not Found.

OneUni is a unified campus platform for Universal College Lanka. It gives students one place to find announcements, events, academic support, facilities, services, FAQs, notifications, bookings and an AI assistant. Staff members receive role-based tools for managing the content and operational requests they own.

## Project Layout

The web application lives in [`ucl-hub`](ucl-hub):

```text
ucl-hub/
  src/
    app/             Next.js App Router pages, layouts and API routes
    components/      Shared layout, provider and UI components
    config/          Application settings and navigation definitions
    data/demo/       Demo users and in-memory seed data
    features/        Domain modules: announcements, FAQs, jobs, AI, etc.
    hooks/           Reusable React hooks
    lib/             Permissions, validation, backend adapters and server helpers
    services/        Service-layer CRUD and notification operations
    types/           Shared domain models and request types
    utils/           Dates, text, errors, images and other utilities
  public/            Browser assets such as the background video and logos
  tests/rules/       Firebase Firestore and Storage security-rule tests
```

## Webpage Architecture

OneUni uses Next.js App Router with React and TypeScript.

### Root and public entry flow

- `src/app/layout.tsx` is the root layout. It loads global metadata, theme initialization, global CSS and `AppProviders`.
- `src/app/page.tsx` is the public landing page. It displays the OneUni wordmark over the supplied video background and provides the main sign-in action.
- `src/app/(auth)/layout.tsx` wraps authentication pages with the UCL logo, theme toggle and glass-style panel.
- `src/app/(auth)/login/page.tsx` contains the sign-in form and demo account picker.
- `src/app/(auth)/register/page.tsx` and `forgot-password/page.tsx` provide account creation and password recovery.

### Authenticated page flow

Authenticated pages are grouped by audience:

- `src/app/(student)/layout.tsx` uses `AuthGate` and `AppShell` for student and staff-facing campus pages.
- `src/app/admin/layout.tsx` uses `AuthGate require="staff"` and the staff workspace shell.
- `AppShell` provides the sidebar, responsive dock, header actions, notifications, theme toggle, user menu and glowing AI shortcut.
- `config/navigation.ts` defines the student and admin navigation menus. Admin entries are filtered using capability checks.

The root page redirects signed-in users through `homeFor`, which selects the correct dashboard for their role. Signed-out users remain on the public landing page until they choose sign in.

### Shared providers

`AppProviders` composes the application-wide runtime services:

1. `ThemeProvider` controls light/dark/accent themes.
2. `ToastProvider` displays transient feedback.
3. `ServicesProvider` initializes the selected backend and exposes domain services.
4. `AuthProvider` manages the current user, session and access claims.

This keeps route components focused on presentation and user interactions instead of directly initializing Firebase or manipulating storage.

## Backend and Data Flow

The frontend talks to domain services through `useServices()`:

```text
Page or feature component
	|
	v
ServicesProvider -> services/registry.ts
	|
	v
Backend adapter (memory or Firebase)
	|
	v
DataStore, AuthPort, FileStore and server gateways
```

The backend is selected with `NEXT_PUBLIC_BACKEND`:

- `memory`: self-contained demo mode. Data is generated from `src/data/demo` and persisted in browser `localStorage`.
- `firebase`: production-style mode using Firebase Authentication, Firestore and Storage. Admin-only operations use server API routes and Firebase Admin SDK.

The service registry wires domain services such as announcements, events, FAQs, notifications, facilities, jobs, societies, users and AI knowledge. Pages do not construct backend adapters directly.

## Authentication and Permissions

Access is represented by a user role and, for staff, a staff role. Capabilities are defined in `src/lib/permissions.ts` and applied to admin navigation and protected workflows.

Examples:

- Finance staff can manage finance-related announcements, FAQs, services and notifications.
- Facilities staff can manage facility issues, rooms, bookings and related content.
- Academic staff can manage academic content and support workflows.
- Administrators have platform-wide management access.

Students can read official content and manage their own submissions, while staff permissions determine which operational records they can create or modify.

## Visual System

Global visual rules are in `ucl-hub/src/app/globals.css`:

- Tailwind CSS v4 utilities and project color tokens.
- Light/dark theme variables.
- Liquid-glass surfaces for authentication and application navigation.
- Responsive sidebar and compact icon dock.
- Shared animations for the landing wordmark, sign-in CTA and AI shortcut.

The landing video is served from `ucl-hub/public/campus-background.mp4`. Public assets are referenced with root-relative URLs such as `/campus-background.mp4` and `/ucl-logo.png`.

## Local Development

Requirements: Node.js 20.9 or newer.

From the project directory:

```powershell
cd ucl-hub
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For the no-credentials demo setup, create `ucl-hub/.env.local`:

```env
NEXT_PUBLIC_BACKEND=memory
NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true
AI_PROVIDER=mock
```

Demo accounts use the password `Demo@1234`. The complete environment reference is in [`ucl-hub/.env.example`](ucl-hub/.env.example) and [`ucl-hub/docs/ENVIRONMENT.md`](ucl-hub/docs/ENVIRONMENT.md) when available in the checkout.

## Commands

Run these from `ucl-hub`:

```powershell
npm run dev          # Start the Next.js development server
npm run build        # Create a production build
npm run start        # Start the production server
npm run typecheck    # Run TypeScript without emitting files
npm run lint         # Run ESLint
npm run test         # Run unit tests
npm run test:rules   # Run Firebase security-rule tests with emulators
npm run test:all     # Run typecheck, lint, unit and rules tests
```

## Testing Strategy

- Unit tests cover domain logic, pagination, permissions, text utilities, backend adapters and feature services.
- Security-rule tests run against Firebase emulators and verify read/write permissions for each role.
- `npm run typecheck` catches contract errors across routes, services and shared types.
- `npm run build` verifies that the complete Next.js route tree compiles and prerenders correctly.

## Firebase Mode

Use Firebase mode when connecting to a real project or local emulators:

```env
NEXT_PUBLIC_BACKEND=firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

For local emulators, set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` and run the emulator scripts documented in the project configuration. Server-only Firebase Admin and AI credentials must never be placed in `NEXT_PUBLIC_*` variables.
