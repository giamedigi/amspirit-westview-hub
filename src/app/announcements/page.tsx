import { AnnouncementCard } from "@/components/announcement-card";
import { DataEmpty, DataError } from "@/components/data-state";
import { PageHeading } from "@/components/page-heading";
import { getAnnouncements } from "@/services/jotform/data.server";

export const metadata = { title: "Announcements" };

export default async function Page() {
  const result = await getAnnouncements();
  return (
    <>
      <PageHeading title="Announcements">
        Active chapter updates, with urgent and important notices clearly
        labeled.
      </PageHeading>
      {result.error ? (
        <DataError label="Announcements" />
      ) : result.data.length ? (
        <div className="stack">
          {result.data.map((item) => (
            <AnnouncementCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <DataEmpty message="No active announcements." />
      )}
    </>
  );
}
