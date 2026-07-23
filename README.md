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

## Future Jotform integration

Do not expose a Jotform API key to Client Components. Add the future service layer under `src/services/jotform/` and keep it server-only:

1. Read `JOTFORM_API_KEY` from a server environment variable.
2. Fetch submissions in server-only modules.
3. Validate and transform responses into the internal types in `src/lib/types.ts`.
4. Return safe fallback data for malformed or missing fields.
5. Cache responses with an appropriate revalidation period.
6. Replace imports from `src/data/` at the page/server-component boundary—not inside presentational components.

Jotform remains a headless data source. Do not embed forms, Tables, Reports, widgets, or raw submission views.

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
3. Add server-only environment variables only when the Jotform service layer is implemented.
4. Review the public mock/member information and contact-display permissions.
