# Jotform service layer and field-mapping workflow

Phase 2 begins with a server-only integration boundary. The visible application
still imports typed mock data from `src/data/`; no page uses live Jotform data.

## Architecture

`src/services/jotform/` contains:

- `env.server.ts` — lazy validation of server environment variables
- `client.server.ts` — authenticated requests, timeouts, defensive parsing,
  pagination, errors, and five-minute Next.js revalidation
- `raw-types.ts` and `guards.ts` — the untrusted transport boundary
- `adapters/` — one adapter per app-data type

Every server module imports `server-only`. The API key is sent to Jotform in the
`APIKEY` request header and never appears in a URL, client bundle, or browser
request.

Submission fetching uses offset pagination with a configurable page size and a
25-page default safety limit. Requests time out after eight seconds. Next.js
fetch caching revalidates every five minutes and assigns per-form cache tags.

## Why the adapters are intentionally incomplete

Question IDs and answer structures vary by form. The adapters currently throw a
clear `JotformMappingNotConfiguredError` instead of guessing. After inspection,
explicit mappings can transform `RawJotformSubmission` into `Member`,
`MemberEvent`, `Announcement`, or `LunchMonth`.

Raw submissions must never be passed to components, returned from public route
handlers, logged, or rendered. Only validated internal app types may cross the
service boundary.

## Safe field inspection

Create `.env.local` from `.env.example`, then run:

```bash
npm run jotform:inspect -- members
npm run jotform:inspect -- events
npm run jotform:inspect -- announcements
npm run jotform:inspect -- lunch
```

The script prints form questions and an anonymized shape of one submission’s
answers. It omits answer values, submission IDs, contact information, and the
API key. Redirect output to an ignored local file if desired:

```bash
npm run jotform:inspect -- members > jotform-members-shape.log
```

Files ending in `.log` are ignored by Git.

## Temporary deployed inspection endpoints

The deployed inspection endpoints are intentionally absent from app navigation:

- `/api/jotform-inspect/members`
- `/api/jotform-inspect/events`
- `/api/jotform-inspect/announcements`
- `/api/jotform-inspect/lunch`

Every request must include the secret `JOTFORM_INSPECTION_TOKEN` in the
`x-inspection-token` header. Query-string tokens are not accepted. Missing or
incorrect tokens receive HTTP 401 before any Jotform request is made.

Add `JOTFORM_INSPECTION_TOKEN` in the Vercel project’s Settings → Environment
Variables. Use a unique random value of at least 32 bytes, mark it sensitive,
and scope it only to the environments where inspection is required. Ensure the
five existing Jotform variables are scoped to the same environment.

Environment changes apply only to new deployments. Redeploy the intended
deployment from the Vercel dashboard after adding the token, or use:

```bash
vercel redeploy YOUR_DEPLOYMENT_URL
```

### Safe PowerShell retrieval

This workflow prompts for the token without placing it in the URL or shell
history:

```powershell
$baseUrl = "https://YOUR_DEPLOYMENT_HOST"
$secureToken = Read-Host "Jotform inspection token" -AsSecureString
$inspectionToken = [Net.NetworkCredential]::new("", $secureToken).Password
$headers = @{ "x-inspection-token" = $inspectionToken }

Invoke-RestMethod "$baseUrl/api/jotform-inspect/members" -Headers $headers |
  ConvertTo-Json -Depth 20
Invoke-RestMethod "$baseUrl/api/jotform-inspect/events" -Headers $headers |
  ConvertTo-Json -Depth 20
Invoke-RestMethod "$baseUrl/api/jotform-inspect/announcements" -Headers $headers |
  ConvertTo-Json -Depth 20
Invoke-RestMethod "$baseUrl/api/jotform-inspect/lunch" -Headers $headers |
  ConvertTo-Json -Depth 20

Remove-Variable inspectionToken, secureToken, headers
```

The response includes question metadata, option labels, and answer types or
object keys only. It never includes answer values, submission IDs, or the API
key. Do not add debug logging around the upstream response.

### Removal after mapping

After all adapters are mapped and verified:

1. Delete `src/app/api/jotform-inspect/`.
2. Delete `inspection.server.ts` and `inspection-auth.server.ts`.
3. Remove `JOTFORM_INSPECTION_TOKEN` from `.env.example` and Vercel.
4. Redeploy and confirm all four temporary URLs return 404.
