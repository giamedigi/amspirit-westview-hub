import Link from "next/link";
import { notFound } from "next/navigation";
import { DataError } from "@/components/data-state";
import { eventMapsUrl, formatEventTime } from "@/lib/events";
import { getMemberEvents } from "@/services/jotform/data.server";
import styles from "./event-details.module.css";

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getMemberEvents();
  if (result.error) {
    return (
      <>
        <Link className="back-link" href="/calendar">
          ← Back to calendar
        </Link>
        <DataError label="Event details" />
      </>
    );
  }

  const event = result.data.find((item) => item.id === id);
  if (!event) notFound();

  const mapsUrl = eventMapsUrl(event);
  const date = new Date(`${event.date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article className={styles.page}>
      <Link className="back-link" href="/calendar">
        ← Back to calendar
      </Link>
      <header className={styles.header}>
        <span className="badge">{event.eventType || "Member event"}</span>
        <h1>{event.title}</h1>
        <p className={styles.date}>
          {date}
          <br />
          {formatEventTime(event.startTime, event.endTime)}
        </p>
      </header>

      <div className={styles.actions} aria-label="Event actions">
        {event.registrationLink && (
          <ExternalButton href={event.registrationLink}>Register</ExternalButton>
        )}
        {event.virtualLink && (
          <ExternalButton href={event.virtualLink}>
            Join Virtual Event
          </ExternalButton>
        )}
        {mapsUrl && (
          <ExternalButton href={mapsUrl}>Open Address in Maps</ExternalButton>
        )}
        {event.flyer && (
          <ExternalButton href={event.flyer}>View Full-Size Flyer</ExternalButton>
        )}
      </div>

      <section className="detail-card" aria-labelledby="event-information">
        <h2 id="event-information">Event information</h2>
        <dl className={styles.details}>
          <Detail label="Event type" value={event.eventType} />
          <Detail label="Format" value={event.eventFormat} />
          <Detail label="Venue" value={event.venue} />
          <Detail label="Address" value={event.address} />
          <Detail
            label="Registration required"
            value={event.registrationRequired}
          />
          <Detail label="Cost" value={event.cost} />
          <Detail
            label="Registration deadline"
            value={formatOptionalDate(event.registrationDeadline)}
          />
          <Detail label="Intended audience" value={event.targetAudience} />
          <Detail label="Open to the public" value={event.openToPublic} />
          <Detail label="Recurring event" value={event.recurring} />
          <Detail
            label="Recurrence details"
            value={event.recurrenceDetails}
          />
        </dl>
        {event.description && (
          <>
            <h2>Full description</h2>
            <p className={styles.description}>{event.description}</p>
          </>
        )}
      </section>

      {event.flyer && (
        <EventMedia
          id="event-flyer"
          title="Event flyer"
          url={event.flyer}
          alt={`${event.title} event flyer`}
        />
      )}
      {event.socialGraphic && (
        <EventMedia
          id="social-graphic"
          title="Social graphic"
          url={event.socialGraphic}
          alt={`${event.title} social media graphic`}
        />
      )}
    </article>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className={styles.detail}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ExternalButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className="button primary"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function EventMedia({
  id,
  title,
  url,
  alt,
}: {
  id: string;
  title: string;
  url: string;
  alt: string;
}) {
  return (
    <section className={styles.mediaSection} aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      <a
        className={styles.mediaLink}
        href={url}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open full-size ${title.toLowerCase()} in a new tab`}
      >
        {/* Upload dimensions and hostnames are not known until Jotform returns the file. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.mediaImage} src={url} alt={alt} />
      </a>
      <div className={styles.mediaActions}>
        <ExternalButton href={url}>
          View Full-Size {title === "Event flyer" ? "Flyer" : "Graphic"}
        </ExternalButton>
      </div>
    </section>
  );
}

function formatOptionalDate(value?: string): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
