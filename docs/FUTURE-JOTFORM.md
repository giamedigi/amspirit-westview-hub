# Future Jotform service layer

Phase one intentionally contains no Jotform connection, embed, key, or package.

Add future integration under `src/services/jotform/` with:

- `client.server.ts` for authenticated server-only requests and caching
- `schemas.ts` for defensive response validation
- `transformers.ts` for mapping submission fields to `Member`, `MemberEvent`, `Announcement`, and `LunchMonth`
- focused repository functions such as `getMembers()` and `getActiveAnnouncements()`

Only Server Components should import this service. Client Components should continue receiving the application’s internal typed objects as props. Keep `JOTFORM_API_KEY` in server-side environment variables, provide graceful fallback behavior, and never return raw submission records to the browser.
