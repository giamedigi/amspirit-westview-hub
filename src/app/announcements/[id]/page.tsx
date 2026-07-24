import Link from "next/link";
import { notFound } from "next/navigation";
import { DataError } from "@/components/data-state";
import { getAnnouncements } from "@/services/jotform/data.server";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getAnnouncements();
  if (result.error) return <DataError label="This announcement" />;

  const announcement = result.data.find((item) => item.id === id);
  if (!announcement) notFound();

  return (
    <article
      className={`detail-card announcement-detail ${announcement.importance}`}
    >
      <Link className="back-link" href="/announcements">
        ← All announcements
      </Link>
      <span className="badge">{announcement.importance}</span>
      <h1>{announcement.title}</h1>
      <time dateTime={announcement.publishDate}>
        Published{" "}
        {new Date(`${announcement.publishDate}T12:00:00`).toLocaleDateString()}
      </time>
      <p>{announcement.message}</p>
      {announcement.buttonLink && announcement.buttonText && (
        <a
          className="button primary"
          href={announcement.buttonLink}
          target="_blank"
          rel="noreferrer"
        >
          {announcement.buttonText}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </article>
  );
}
