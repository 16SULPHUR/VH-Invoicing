## Running React on Replit

[React](https://reactjs.org/) is a popular JavaScript library for building user interfaces.

[Vite](https://vitejs.dev/) is a blazing fast frontend build tool that includes features like Hot Module Reloading (HMR), optimized builds, and TypeScript support out of the box.

Using the two in conjunction is one of the fastest ways to build a web app.

### Getting Started
- Hit run
- Edit [App.jsx](#src/App.jsx) and watch it live update!

By default, Replit runs the `dev` script, but you can configure it by changing the `run` field in the [configuration file](#.replit). Here are the vite docs for [serving production websites](https://vitejs.dev/guide/build.html)

### Typescript

Just rename any file from `.jsx` to `.tsx`. You can also try our [TypeScript Template](https://replit.com/@replit/React-TypeScript)

### Cashbook Feature

This app includes a Cashbook to track daily HOME/SHOP balances and deposits.

1) Database setup (Supabase):

Run this SQL in Supabase SQL Editor:

```
-- Enable extension if not already
create extension if not exists pgcrypto;

-- Tables and policies
-- Copy from src/api/accounting.js -> CASHBOOK_SQL constant
```

2) Optional Edge Function: cashbook-parser

Create a Supabase Edge Function named `cashbook-parser` that accepts `{ text }` and returns `{ transactions, snapshots }`. The client will fallback to a local parser if the function is not deployed.

3) Using Cashbook:

- Navigate to Cashbook tab in app.
- Quick Entry: add inflow/outflow/bank deposit with a note.
- Paste Chat to Import: paste your chat; click Preview then Import.