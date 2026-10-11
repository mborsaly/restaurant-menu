# BistroVite — Restaurant Menu Application

## Project purpose
This repository contains the customer-facing BistroVite restaurant menu and ordering application. Other applications, including restaurant-dashboard, are maintained separately. Shared backend services include Supabase and n8n.

## Technology stack
- React 19
- Vite 8
- React Router 7
- Supabase JavaScript client
- Stripe
- Framer Motion
- lucide-react
- ESLint

## Commands
- `npm run dev` — start the development server
- `npm run build` — build the production bundle
- `npm run lint` — run ESLint
- `npm run preview` — preview the production build

## Working rules
- Before non-trivial implementation work, read `docs/ARCHITECTURE.md` for an overview of the routing, session resolution, Supabase usage, i18n/RTL handling, and the active-vs-legacy code paths — then verify any claim it makes against the current source code before relying on it, since the guide can drift out of date.
- Treat the existing code as the source of truth. Verify assumptions against the implementation.
- Do not perform a wholesale rewrite or refactor unrelated code.
- Before non-trivial changes, explain the proposed plan and wait for my approval.
- Never expose, print, commit, or hardcode secrets. Do not reveal `.env` values.
- Do not modify the production database or external services unless I explicitly authorize it.
- Database changes must be proposed as SQL migration files for my review and manual execution.
- Never introduce or weaken Row Level Security policies without explicit approval and a clear security justification.
- The actual Postgres schema lives in the sibling repository `../bistrovite-database/` (`supabase_schema.sql` for tables/constraints/indexes/triggers/grants/RLS policies, `database.types.ts` for generated TypeScript types) — **not** in this repo. Before making any database-related change, or stating anything as fact about database security/RLS/schema, read those files directly rather than inferring from this repo's query code. If `../bistrovite-database/` isn't accessible in a session, say so explicitly and do not guess at schema or RLS behavior. Treat `supabase_schema.sql` as a point-in-time snapshot, not a guaranteed-current mirror of the deployed Supabase project — it may have drifted since it was generated.
- If a change affects database queries, order payloads, payment processing, or n8n integrations, identify the related dependencies and required follow-up work.
- Preserve existing multilingual behavior, responsive layouts, and RTL support. Verify their implementation before changing them.
- Do not add UI strings, dependencies, or architectural patterns without checking the existing conventions first.
- Keep changes focused and review the diff before finishing.
- Run the relevant tests, `npm run lint`, and `npm run build` when appropriate. Clearly report any checks that were not run or failed.

## Completion report
When implementing a task, summarize:
1. Files changed and why.
2. Tests and checks performed, including results.
3. Database migrations or manual SQL required.
4. External integrations or n8n workflows potentially affected.
5. Remaining risks and manual verification steps.
