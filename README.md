# Banking Portal

Angular front-end banking portal built for the CIS technical task.

## Setup

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm start
```

Build:

```bash
npm run build
```

Run tests:

```bash
npm test -- --watch=false
```

## Current Features

- Layer One login screen with email/password validation.
- Angular routing for login, dashboard, and customer details.
- Route guards protect authenticated portal pages and redirect signed-in users away from login.
- HTTP interceptors attach a mock auth header and drive the global loader.
- Admin demo credentials: `admin@portal.com` / `Admin@123`.
- SweetAlert2 alert service for user-facing feedback.
- PrimeNG-backed inputs, password field, buttons, cards, table, and status tags.
- Layer Two transactions page per account.
- Transaction filters by date range, type, and category.
- Sortable/paginated transactions table.
- Reactive create-transaction form with custom validators and debit balance rule.
- Debit and credit transactions update account balance immediately in the UI.
- Layer Three mini statement with configurable last N transactions.
- CSV export for the currently displayed transactions.
- Monthly insights for total debit, total credit, and highest spending category.
- JSON loading error handling with empty-state fallback alerts.
- Static JSON mock data under `public/assets/mock`.
- Typed customer, account, and transaction models.
- Cached data-loading service using RxJS `shareReplay`.
- Signal-based selected customer/account state.
- Responsive customer list and customer detail/account views.

## Requirements Coverage

| Area | Status |
| --- | --- |
| Layer One | Login, dashboard customers, customer details, accounts, routing, services, models, and responsive layout are implemented. |
| Layer Two | Account transactions, filters, date/amount sorting, reactive create form, custom validation, cross-field debit balance rule, generated IDs, and immediate balance updates are implemented. |
| Layer Three | Mini statement, CSV export, monthly insights, cached JSON streams, selected account/customer state, pagination, loading indicators, and JSON error handling are implemented. |

## Architecture

```text
src/app
  core
    alerts            SweetAlert2 wrapper for app notifications
    auth              Front-end demo authentication state
    data-access       Shared API/static JSON services
    guards            Route protection and login redirect guards
    interceptors      HTTP auth and loader interceptors
    loader            Global loading state
    models            Shared domain interfaces and types
  features
    auth              Login and authentication-facing screens
    customers         Customer dashboard and profile/account screens
    transactions      Account transactions, filters, and transaction creation
  layout              App shell components for authenticated routes
  shared              Reusable UI, directives, pipes, and validators
```

```text
src/styles
  _tokens.scss        Design tokens and CSS variables
  _base.scss          Reset, typography, and shared utility text styles
  _forms.scss         Inputs, fields, and validation messages
  _buttons.scss       Button primitives
  _layout.scss        Page shell, sidebar, and responsive layout primitives
  _cards.scss         Panels, customer cards, and detail lists
  _tables.scss        Account/data table styles
```

## State Management

- RxJS is used for HTTP-backed data streams, route-driven view models, form value streams, caching, and error recovery.
- Angular Signals are used for small local app state such as authentication, selected customer/account, loader status, local transactions, and balance adjustments.
- NgRx can be introduced later if the app grows into shared cross-feature workflows with complex effects, server mutations, optimistic updates, or audit/debug requirements. For this task size, a service/facade with RxJS and Signals keeps the architecture easier to read while still meeting the reactive requirements.

## Assumptions

- Login is a front-end-only demo flow and redirects after valid form submission.
- Account `A2001` was added to the mock accounts because the provided transactions reference it.
- PrimeNG is used as the UI library with the Aura preset and app-level SCSS composition.
- New transactions and balance updates are held in memory for the current browser session.
