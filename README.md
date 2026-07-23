# AM Spirit West View Chapter Hub

A public, mobile-first utility hub for the AM Spirit West View Chapter. It helps members find announcements, meetings, events, directory information, Lunch Connections, guest invitations, and event-submission links without accounts or an admin dashboard.

This is an independent chapter project. It is not an official nationally sponsored AM Spirit Business Connections website or application.

## Technology

- Next.js 16 App Router
- React 19 and TypeScript
- Server Components by default, focused Client Components for search, calendar, sharing, month controls, navigation, and the urgent-announcement dialog
- Plain responsive CSS and no UI framework or icon dependency

## Local development

Node.js 20.9 or newer is required.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

## Repository scope and current data

This repository is only for `amspirit-westview-hub`. Phase one uses typed mock data in `src/data/`:

- `members.ts` — eight directory members
- `events.ts` — five member/community events
- `announcements.ts` — normal, important, and urgent announcements
- `lunch.ts` — eight groups across three months

Meeting information and external destinations are centralized in `src/config/app.ts`. The approved meeting address and Google Maps search URL are configured there once; placeholder destinations are marked with `placeholder: true`.

## Phase 2 Jotform setup

The secure server-only service architecture is present, but all pages still use
the Phase 1 mock data. Live data must not be enabled until the four forms have
been inspected and their question IDs mapped explicitly.

Copy `.env.example` to a new `.env.local` file:

```bash
Copy-Item .env.example .env.local
```

Replace every placeholder in `.env.local`:

```dotenv
JOTFORM_API_KEY=your_private_jotform_api_key
JOTFORM_MEMBER_DIRECTORY_FORM_ID=your_member_directory_form_id
JOTFORM_MEMBER_EVENTS_FORM_ID=your_member_events_form_id
JOTFORM_ANNOUNCEMENTS_FORM_ID=your_announcements_form_id
JOTFORM_LUNCH_PAIRINGS_FORM_ID=your_lunch_pairings_form_id
JOTFORM_INSPECTION_TOKEN=a_unique_random_value_of_at_least_32_bytes
```

`.env.local` is covered by `.env*` in `.gitignore`; `.env.example` is the only
environment template allowed in Git. Never paste real credentials into source
files, documentation, issues, chat messages, or commits.

Run the safe field inspector for each form:

```bash
npm run jotform:inspect -- members
npm run jotform:inspect -- events
npm run jotform:inspect -- announcements
npm run jotform:inspect -- lunch
```

The inspector prints question IDs, field names, field types, labels, and
anonymized answer shapes. It does not print the API key, answer values,
submission IDs, or contact details. Share that sanitized JSON output when
requesting the mapping step; review it once more before sharing.

The implementation details and mapping workflow are documented in
`docs/FUTURE-JOTFORM.md`. Jotform remains a headless source: do not embed forms,
Tables, Reports, widgets, or raw submission views.

For deployed inspection, add `JOTFORM_INSPECTION_TOKEN` as a sensitive Vercel
environment variable, redeploy, and call the temporary
`/api/jotform-inspect/{kind}` endpoints with the token in the
`x-inspection-token` header. Never put this token in a URL. Exact PowerShell
commands and endpoint-removal instructions are in `docs/FUTURE-JOTFORM.md`.

## Logo replacement

The temporary `AM` mark is in `src/components/site-shell.tsx`. Add the approved, unmodified logo to `public/brand/` and replace the placeholder span with `next/image`. Preserve aspect ratio, do not recolor or animate it, and use alt text such as `AM Spirit Business Connections`.

## External link configuration

Update `src/config/app.ts` for:

- the official portal URL
- the centrally configured Google Maps directions URL
- the future Jotform member-event submission URL

Do not scatter external URLs through components.

## Deployment notes

The project is ready for a future standard Next.js Vercel deployment, but no Vercel project or deployment is created in phase one. Before deployment:

1. Confirm the approved logo and external links.
2. Re-run lint, type checking, and the production build.
3. Add the six Jotform variables from `.env.example` to the Vercel project
   settings only when live integration is approved. Never prefix them with
   `NEXT_PUBLIC_`.
4. Review the public mock/member information and contact-display permissions.
