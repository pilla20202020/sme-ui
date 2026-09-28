# L713 UW System

**L713 Medical Underwriting Portal** — Individual Enrollment Management  
A React + TypeScript front-end for underwriting agents to review, action, and track individual health enrollment cases.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 |
| Language | TypeScript 5 |
| Routing | React Router DOM 6 |
| Build Tool | Vite 5 |
| Styling | Inline styles with design token system |

---

## Prerequisites

- **Node.js** ≥ 18.x — [Download](https://nodejs.org/)
- **npm** ≥ 9.x (bundled with Node.js)

Verify your versions:

```bash
node --version
npm --version
```

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/CloudTechService/uw-ui.git
cd uw-ui
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server with hot-reload |
| `npm run build` | Type-check and compile production bundle to `dist/` |
| `npm run preview` | Serve the production build locally for testing |
| `npm run typecheck` | Run TypeScript type-checking without emitting files |

---

## Project Structure

```
src/
├── assets/             # Static assets (images, icons, fonts)
├── components/
│   ├── layout/         # Shell components: Sidebar, Topbar, ModalOverlay
│   ├── modals/         # All modal dialogs (Activate, Reject, EditPlan, etc.)
│   └── ui/             # Reusable primitives: ActionBtn, StatCard, StatusBadge, etc.
├── constants/          # App-wide constants: STATUS, L713_PLANS, NAV_ITEMS, seed data
├── context/            # React context providers (ThemeContext)
├── data/               # Enrollment data layer (seed generator)
├── features/
│   ├── dashboard/      # Dashboard page and its sub-components
│   └── enrollments/    # Enrollments page, drawer, and action bar
├── hooks/              # Custom React hooks (useDarkMode, useDrawer, useEnrollmentFilters)
├── routes/             # React Router config: ROUTES constants + AppRouter shell
├── theme/              # Design token system (light/dark tokens, global styles)
├── types/              # TypeScript type definitions (Enrollment, NavItem, etc.)
└── utils/              # Pure utility functions (formatDate, formatCurrency)
```

---

## Routing

Routes are defined in `src/routes/routeConfig.ts` and wired in `src/routes/AppRouter.tsx`.

| Path | Feature |
|------|---------|
| `/` | Dashboard |
| `/enrollments` | Enrollment case list |
| `*` | Redirects to `/` |

To add a new route:
1. Add the path constant to `src/routes/routeConfig.ts`
2. Add a `<Route>` entry in `src/routes/AppRouter.tsx`

---

## Naming Conventions (CTS Standard)

| Category | Convention | Example |
|----------|-----------|---------|
| Variables & Functions | camelCase | `getUserData`, `isActive` |
| Components & Classes | PascalCase | `UserProfile`, `DataService` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRY_ATTEMPTS` |
| Booleans | `is` / `has` / `should` / `can` prefix | `isLoading`, `hasPermission` |
| Event Handlers | `handle` / `on` prefix | `handleSubmit`, `onUserClick` |
| Async Functions | Verb + noun | `fetchUserById`, `createOrder` |
| Component files | PascalCase | `UserProfile.tsx` |
| Utility files | camelCase | `formatDate.ts` |
| Test files | Same name + `.test.ts` | `formatDate.test.ts` |

---

## Environment

SSO login requires these Vite environment variables:

```env
VITE_SSO_LOGIN_URL="https://sso.example.com/login"
VITE_SSO_LOGOUT_URL="https://sso.example.com/logout"
VITE_SSO_SITE_KEY="YOUR_SITE_KEY"
VITE_SSO_USER_INFO_URL="https://sso.example.com/api/v1/user-info"
```

Create a `.env` file in the project root (or copy `.env.example`) and set real values from your SSO provider.

Notes:
- `VITE_SSO_LOGIN_URL` is the redirect URL used when there is no valid token.
- `VITE_SSO_LOGOUT_URL` is optional; if provided, logout redirects there. If omitted, logout falls back to `VITE_SSO_LOGIN_URL`.
- `VITE_SSO_SITE_KEY` is sent as the `SiteKey` header and appended as `site_key` on login redirect.
- `VITE_SSO_USER_INFO_URL` is called with `Authorization: Bearer <token>` to validate and load the user profile.

---

## Contributing

1. Branch from `main`: `git checkout -b feature/your-feature-name`
2. Follow the CTS naming conventions above (see [CTS Quality Gate Standards](https://quality-gates.cloudtechservice.com/))
3. Run `npm run typecheck` before committing — zero TypeScript errors required
4. All code must satisfy the [CTS Quality Gates](https://quality-gates.cloudtechservice.com/) before merge
5. Open a Pull Request against `main`

---

## Quality Standards

This project adheres to the **CTS Quality Gate** standards.  
Full specification: **https://quality-gates.cloudtechservice.com/**

Key gates enforced:
- Zero TypeScript errors (`npm run typecheck`)
- CTS naming conventions (see table above)
- Feature-based folder structure
- No single-letter variable names outside of loop indices

---

## License

Private — CTS Internal Use Only
