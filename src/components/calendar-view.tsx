"use client";

import { useMemo, useState } from "react";
import { appConfig } from "@/config/app";
import type { MemberEvent } from "@/lib/types";

const key = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function CalendarView({ events }: { events: MemberEvent[] }) {
  const initialDate = events[0]?.date
    ? new Date(`${events[0].date}T12:00:00`)
    : new Date();
  const [start, setStart] = useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );
  const [selected, setSelected] = useState(() => key(initialDate));
  const cells = useMemo(() => {
    const first = new Date(start.getFullYear(), start.getMonth(), 1);
    const count = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      0,
    ).getDate();
    return [
      ...Array(first.getDay()).fill(null),
      ...Array.from(
        { length: count },
        (_, index) =>
          new Date(start.getFullYear(), start.getMonth(), index + 1),
      ),
    ];
  }, [start]);
  const selectedDate = new Date(`${selected}T12:00:00`);
  const selectedEvents = events.filter((event) => event.date === selected);
  const isMeeting = selectedDate.getDay() === 4;
  const change = (amount: number) =>
    setStart(new Date(start.getFullYear(), start.getMonth() + amount, 1));

  return (
    <>
      <div className="calendar-toolbar">
        <button onClick={() => change(-1)} aria-label="Previous month">
          ←
        </button>
        <h2>
          {start.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <button onClick={() => change(1)} aria-label="Next month">
          →
        </button>
        <button
          className="today-button"
          onClick={() => {
            const today = new Date();
            setStart(new Date(today.getFullYear(), today.getMonth(), 1));
            setSelected(key(today));
          }}
        >
          Today
        </button>
      </div>
      <div
        className="calendar-grid"
        role="grid"
        aria-label={`${start.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })} calendar`}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div className="weekday" role="columnheader" key={day}>
            {day}
          </div>
        ))}
        {cells.map((date, index) =>
          date ? (
            <button
              role="gridcell"
              aria-selected={key(date) === selected}
              className={key(date) === selected ? "selected" : ""}
              onClick={() => setSelected(key(date))}
              key={key(date)}
            >
              <span>{date.getDate()}</span>
              <span
                className="dots"
                aria-label={`${
                  (date.getDay() === 4 ? 1 : 0) +
                  events.filter((event) => event.date === key(date)).length
                } events`}
              >
                {date.getDay() === 4 && <i className="meeting-dot" />}
                {events.some((event) => event.date === key(date)) && (
                  <i className="event-dot" />
                )}
              </span>
            </button>
          ) : (
            <span className="empty" key={`empty-${index}`} />
          ),
        )}
      </div>
      <section className="selected-events" aria-live="polite">
        <h2>
          {selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h2>
        {isMeeting && (
          <article>
            <span className="badge meeting">Weekly meeting</span>
            <h3>AM Spirit West View Chapter Meeting</h3>
            <p>
              {appConfig.meeting.startTime} to {appConfig.meeting.endTime}
              <br />
              <strong>{appConfig.meeting.venue}</strong>
              <br />
              {appConfig.meeting.addressLine1}
              <br />
              {appConfig.meeting.addressLine2}
            </p>
            <a
              className="text-link"
              href={appConfig.directions.url}
              target="_blank"
              rel="noreferrer"
            >
              {appConfig.directions.label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </article>
        )}
        {selectedEvents.map((event) => (
          <details className="event-detail" key={event.id} open>
            <summary>{event.title}</summary>
            <p>
              <strong>
                {event.startTime} to {event.endTime}
              </strong>
              {event.location && (
                <>
                  <br />
                  {event.location}
                </>
              )}
            </p>
            {event.description && <p>{event.description}</p>}
            {event.registrationLink && (
              <a
                className="button primary"
                href={event.registrationLink}
                target="_blank"
                rel="noreferrer"
              >
                Registration link
              </a>
            )}
          </details>
        ))}
        {!isMeeting && !selectedEvents.length && (
          <p className="empty-state">No events on this date.</p>
        )}
      </section>
    </>
  );
}
