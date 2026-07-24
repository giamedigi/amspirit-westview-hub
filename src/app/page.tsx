import Link from "next/link";
import { AnnouncementCard } from "@/components/announcement-card";
import { DataError } from "@/components/data-state";
import { Icon } from "@/components/icons";
import { MeetingCard } from "@/components/meeting-card";
import { UrgentModal } from "@/components/urgent-modal";
import {
  getAnnouncements,
  getMemberEvents,
} from "@/services/jotform/data.server";

const actions = [
  ["Calendar", "/calendar", "calendar", "blue"],
  ["Members", "/members", "members", "red"],
  ["Lunch Connections", "/lunch-connections", "lunch", "orange"],
  ["Announcements", "/announcements", "alert", "purple"],
  ["Invite a Guest", "/invite-a-guest", "invite", "green"],
  ["Submit Event", "/submit-event", "submit", "teal"],
];

export default async function Home() {
  const [announcementResult, eventResult] = await Promise.all([
    getAnnouncements(),
    getMemberEvents(),
  ]);
  const active = announcementResult.data;
  const urgent = active.find((item) => item.importance === "urgent");
  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  const upcoming = eventResult.data
    .filter((event) => event.date >= todayKey)
    .slice(0, 3);

  return (
    <>
      <UrgentModal announcement={urgent?.showPopup ? urgent : undefined} />
      <header className="home-heading">
        <p className="eyebrow dark">Welcome to your chapter hub</p>
        <h1>Good to see you.</h1>
      </header>
      {urgent && (
        <section className="urgent-banner">
          <Icon name="alert" />
          <div>
            <span className="eyebrow">Important chapter update</span>
            <h2>{urgent.title}</h2>
            <p>
              {urgent.message.slice(0, 115)}
              {urgent.message.length > 115 ? "…" : ""}
            </p>
            <Link
              className="button light"
              href={`/announcements/${urgent.id}`}
            >
              Read Announcement
            </Link>
          </div>
        </section>
      )}
      <MeetingCard />
      <section>
        <div className="section-heading">
          <h2>Quick actions</h2>
        </div>
        <div className="action-grid">
          {actions.map(([label, href, icon, color]) => (
            <Link className={`action-tile ${color}`} href={href} key={href}>
              <Icon name={icon} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <div className="section-heading">
          <h2>Upcoming events</h2>
          <Link href="/calendar">View Full Calendar</Link>
        </div>
        {eventResult.error ? (
          <DataError label="Member events" />
        ) : (
          <div className="event-list">
            {upcoming.map((event) => (
              <Link
                className="event-preview"
                href={`/calendar?event=${event.id}`}
                key={event.id}
              >
                <time dateTime={event.date}>
                  <b>
                    {new Date(`${event.date}T12:00:00`).toLocaleDateString(
                      "en-US",
                      { month: "short" },
                    )}
                  </b>
                  <strong>
                    {new Date(`${event.date}T12:00:00`).getDate()}
                  </strong>
                </time>
                <span>
                  <b>{event.title}</b>
                  <small>
                    {event.startTime}
                    {event.location ? ` · ${event.location}` : ""}
                  </small>
                </span>
                <span aria-hidden="true">›</span>
              </Link>
            ))}
            {!upcoming.length && (
              <p className="empty-state">No upcoming member events are listed.</p>
            )}
          </div>
        )}
      </section>
      <section>
        <div className="section-heading">
          <h2>Recent announcements</h2>
          <Link href="/announcements">View All Announcements</Link>
        </div>
        {announcementResult.error ? (
          <DataError label="Announcements" />
        ) : (
          <div className="compact-announcements">
            {active.slice(0, 3).map((item) => (
              <AnnouncementCard key={item.id} item={item} compact />
            ))}
            {!active.length && (
              <p className="empty-state">No active announcements.</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
