import { DataEmpty, DataError } from "@/components/data-state";
import { LunchBrowser } from "@/components/lunch-browser";
import { PageHeading } from "@/components/page-heading";
import { getLunchMonths } from "@/services/jotform/data.server";

export const metadata = { title: "Lunch Connections" };

export default async function Page() {
  const result = await getLunchMonths();
  return (
    <>
      <PageHeading title="Lunch Connections">
        Connect with your monthly group and choose a time that works for
        everyone.
      </PageHeading>
      {result.error ? (
        <DataError label="Lunch Connections" />
      ) : result.data.length ? (
        <LunchBrowser months={result.data} />
      ) : (
        <DataEmpty message="No Lunch Connections pairings are currently listed." />
      )}
    </>
  );
}
