import { DataEmpty, DataError } from "@/components/data-state";
import { MemberDirectory } from "@/components/member-directory";
import { PageHeading } from "@/components/page-heading";
import { getMembers } from "@/services/jotform/data.server";

export const metadata = { title: "Member Directory" };

export default async function Page() {
  const result = await getMembers();
  return (
    <>
      <PageHeading title="Member Directory">
        Find a member by name, business, profession, or category.
      </PageHeading>
      {result.error ? (
        <DataError label="The member directory" />
      ) : result.data.length ? (
        <MemberDirectory members={result.data} />
      ) : (
        <DataEmpty message="No directory members are currently listed." />
      )}
    </>
  );
}
