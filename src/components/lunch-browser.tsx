"use client";

import { useState } from "react";
import type { LunchMonth } from "@/lib/types";

export function LunchBrowser({ months }: { months: LunchMonth[] }) {
  const [index, setIndex] = useState(months.length - 1);
  const current = months[index];
  const label = new Date(current.year, current.month - 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
  );
  return (
    <>
      <div className="month-controls">
        <button
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
          disabled={index === 0}
          aria-label="Previous month"
        >
          ←
        </button>
        <h2>{label}</h2>
        <button
          onClick={() =>
            setIndex((value) => Math.min(months.length - 1, value + 1))
          }
          disabled={index === months.length - 1}
          aria-label="Next month"
        >
          →
        </button>
      </div>
      <div className="lunch-grid">
        {current.groups.map((group, groupIndex) => (
          <article
            className={`lunch-card tone-${groupIndex % 4}`}
            key={group.id}
          >
            <span>Group {groupIndex + 1}</span>
            <ul>
              {group.members.map((name) => (
                <li key={name}>☕ {name}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </>
  );
}
