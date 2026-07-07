<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Next.js 16 (App Router) app for an internal municipal-office homepage. No database — all runtime data persists to JSON files under `.data/` (gitignored). No automated test suite exists.

- Dev/lint/build/start commands live in `package.json` (`npm run dev`/`lint`/`build`/`start`); the dev server runs on port 3000.
- `npm run lint` currently reports pre-existing errors (`react-hooks/set-state-in-effect` in `components/ThemeProvider.tsx` and `components/QuickLinksPanel.tsx`) and warnings on clean `master`. These are not caused by your changes.
- To exercise the `/admin` panel locally, set `ADMIN_PASSWORD` in `.env.local` (see `.env.example`). Without it, admin login cannot be tested. `/admin` is intentionally not linked from the homepage — navigate to it directly.
- The CERT warnings block fetches a live external RSS feed; if egress is blocked that section may be empty, but the rest of the app (announcements, links, admin) works offline.
