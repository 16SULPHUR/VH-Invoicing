# VH Invoicing

Billing, inventory, customer-credit and cashbook PWA for Variety Heaven. React +
Vite + Tailwind on the front, Supabase for data and auth, IndexedDB (Dexie) for
offline invoicing.

## Getting started

```bash
npm install
cp .env.example .env   # already filled in with public values
npm run dev
```

| Script              | What it does                        |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Vite dev server on `0.0.0.0`        |
| `npm run build`     | Production build into `dist/`       |
| `npm run preview`   | Serve the production build          |
| `npm run lint`      | ESLint over `src/`                  |
| `npm run format`    | Prettier write                      |

## Configuration

All runtime configuration is read from `VITE_*` variables via `src/config/env.js`.
Vite inlines these into the client bundle, so **only public values belong in
`.env`** — the Supabase anon key is public by design and protected by Row Level
Security. A `service_role` key must never go there.

`src/config/business.js` holds business identity (name, UPI details, financial
year rules) and `src/config/navigation.js` is the single source of truth for the
primary nav.

## Layout

```
src/
  app/           Shell: providers, router, layout, error boundary
  config/        Environment, business rules, navigation
  lib/           Supabase client, React Query client, offline (Dexie + sync queue)
  services/      Every Supabase call lives here; components never import supabase
  hooks/         Cross-feature hooks (auth, online status, media queries)
  utils/         Formatting, dates, invoice maths, CSV
  components/
    ui/          shadcn/ui primitives
    common/      Shared app components
  features/
    invoicing/   The till: draft invoice, printing, recent invoices, sales panel
    inventory/   Products, suppliers, stickers, batch edit, images
    customers/   Customer CRUD and the credit report
    cashbook/    Daily HOME/SHOP balances, deposits, chat import
    reports/     Transactions, ledger, trial balance, GST
    scanner/     Barcode camera and the shared scan list
    auth/        Login
```

Each feature owns its `components/` and `hooks/`. Adding a screen means adding a
route in `src/app/router.jsx` and, if it belongs in the nav, an entry in
`src/config/navigation.js`. Routes are lazy-loaded, so a new feature does not
grow the initial bundle.

### Adding a Supabase-backed feature

1. Add a service in `src/services/` that wraps the queries and throws on error.
2. Add query keys to `src/lib/queryClient.js`.
3. Write a feature hook that wraps `useQuery`/`useMutation` around the service.
4. Keep components presentational — they receive data and callbacks.

## Offline invoicing

`src/lib/offline/` holds the offline stack:

- `db.js` — Dexie schema (invoices, product/customer cache, sync queue)
- `network.js` — connectivity checks and the `withOfflineFallback` helper
- `syncManager.js` — drains the write queue when connectivity returns
- `cacheManager.js` — keeps products and customers readable offline

Invoices created offline get a temporary `OFFLINE-…` id and a real numeric id on
sync. `syncManager.registerHandler(table, handlers)` extends the queue to another
table.

## Database

`docs/schema/cashbook.sql` creates the cashbook tables and policies. Run it in
the Supabase SQL editor.

The optional `cashbook-parser` Edge Function accepts `{ text }` and returns
`{ transactions, snapshots }`; the client falls back to the bundled parser in
`src/utils/cashbookParser.js` when it is not deployed.
