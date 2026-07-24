"use client";

import { useState } from "react";
import type { Member } from "@/lib/types";

export function MemberDirectory({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const filtered = members.filter((member) =>
    `${member.fullName} ${member.businessName} ${member.profession} ${member.category}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <label className="search-box">
        <span className="sr-only">Search members</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, business, profession, or category"
        />
        <span aria-hidden="true">⌕</span>
      </label>
      <p className="results-status" role="status">
        {filtered.length} {filtered.length === 1 ? "member" : "members"} found
      </p>
      <div className="member-grid">
        {filtered.map((member) => (
          <article className="member-card" key={member.id}>
            <div className="member-summary">
              <span className="avatar" aria-hidden="true">
                {member.fullName
                  .split(" ")
                  .map((name) => name[0])
                  .join("")
                  .slice(0, 3)}
              </span>
              <div>
                <h2>{member.fullName}</h2>
                <p>
                  <strong>{member.businessName}</strong>
                  <br />
                  {member.profession}
                </p>
              </div>
            </div>
            <details>
              <summary>View details</summary>
              <div className="member-details">
                {member.description && <p>{member.description}</p>}
                {member.idealReferral && (
                  <p>
                    <strong>Ideal referral</strong>
                    <br />
                    {member.idealReferral}
                  </p>
                )}
                <div className="contact-list">
                  {member.permissions.phone && member.phone && (
                    <a href={`tel:${member.phone}`}>Call {member.phone}</a>
                  )}
                  {member.permissions.email && member.email && (
                    <a href={`mailto:${member.email}`}>
                      Email {member.fullName.split(" ")[0]}
                    </a>
                  )}
                  {member.website && (
                    <a
                      href={member.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Visit website
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                  )}
                </div>
              </div>
            </details>
          </article>
        ))}
      </div>
    </>
  );
}
