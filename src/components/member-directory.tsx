"use client";

import Link from "next/link";
import { useState } from "react";
import type { Member } from "@/lib/types";
import styles from "./member-directory.module.css";

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
          <Link
            className={`member-card ${styles.cardLink}`}
            href={`/members/${member.id}`}
            aria-label={`View member profile for ${member.fullName}`}
            key={member.id}
          >
            <div className={`member-summary ${styles.summary}`}>
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
            <span className={styles.chevron} aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
