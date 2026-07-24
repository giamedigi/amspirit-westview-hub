# Jotform live-data architecture

The member directory, member events, leadership announcements, and Lunch
Connections use Jotform as a server-only headless data source. Recurring
Thursday chapter meetings remain local application configuration.

## Architecture

`src/services/jotform/` contains:

- `env.server.ts` — lazy validation of server environment variables
- `client.server.ts` — authenticated requests, timeouts, defensive parsing,
  pagination, errors, and five-minute Next.js revalidation
- `raw-types.ts` and `guards.ts` — the untrusted transport boundary
- `adapters/` — explicit question-ID mapping into the application types
- `data.server.ts` — source selection, active-date filtering, safe errors, and
  mock fallback when environment variables are absent

Every service module imports `server-only`. The API key is sent to Jotform in
the `APIKEY` request header and never appears in a URL, browser request, client
bundle, or rendered response. Raw submissions and submission IDs do not cross
the service boundary.

## Runtime behavior

Each form is fetched independently. If `JOTFORM_API_KEY` or that form's ID is
absent, the corresponding typed mock file in `src/data/` is used for local
development. If live configuration exists but Jotform fails, the application
shows a friendly unavailable state and does not mix in mock records.

Requests use offset pagination, an eight-second timeout, and a five-minute
revalidation interval. Logs contain only the data area and safe error category,
never raw submissions, field values, form IDs, submission IDs, or credentials.

Announcements are filtered inclusively from publish date through expiration
date. Lunch pairings retain only the newest valid submission for each month and
year. Empty lunch groups and malformed records lacking their required display
fields are ignored.

## Safe maintenance inspection

The local inspection script remains available for future form maintenance:

```bash
npm run jotform:inspect -- members
npm run jotform:inspect -- events
npm run jotform:inspect -- announcements
npm run jotform:inspect -- lunch
```

It prints question metadata and anonymized answer shapes, not answer values,
submission IDs, contact details, or the API key. The temporary deployed
inspection API routes and `JOTFORM_INSPECTION_TOKEN` application usage were
removed after mapping.

## Updating mappings later

When a form changes:

1. Run the local safe inspector with `.env.local`.
2. Review only the sanitized output.
3. Update the explicit IDs in the matching adapter.
4. Test missing and malformed optional answers.
5. Run lint, type checking, the production build, and data-mapping checks.

Never embed Jotform forms, Tables, Reports, widgets, or raw submission views.
