import { CalendarView } from "@/components/calendar-view";
import { DataError } from "@/components/data-state";
import { PageHeading } from "@/components/page-heading";
import { getMemberEvents } from "@/services/jotform/data.server";

export const metadata = { title: "Calendar" };

export default async function Page() {
  const result = await getMemberEvents();
  return (
    <>
      <PageHeading title="Chapter Calendar">
        Select a date to see chapter meetings and member events.
      </PageHeading>
      {result.error && <DataError label="Member events" />}
      <CalendarView events={result.data} />
    </>
  );
}
