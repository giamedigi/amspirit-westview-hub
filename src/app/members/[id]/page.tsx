import Link from "next/link";
import { notFound } from "next/navigation";
import { DataError } from "@/components/data-state";
import {
  SafeExternalImage,
  SafeLinkedExternalImage,
} from "@/components/safe-external-image";
import { MemberShareTools } from "@/components/share-tools";
import { getMembers } from "@/services/jotform/data.server";
import styles from "./member-details.module.css";

export default async function MemberDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getMembers();
  if (result.error) {
    return (
      <>
        <Link className="back-link" href="/members">
          ← Back to members
        </Link>
        <DataError label="Member details" />
      </>
    );
  }
  const member = result.data.find((item) => item.id === id);
  if (!member) notFound();

  return (
    <article className={styles.page}>
      <Link className="back-link" href="/members">
        ← Back to members
      </Link>
      <header className={styles.header}>
        <div className={styles.portrait}>
          <span className={styles.initials} aria-hidden="true">
            {initials(member.fullName)}
          </span>
          {member.headshot && (
            <SafeExternalImage
              className={styles.headshot}
              src={member.headshot}
              alt={`Headshot of ${member.fullName}`}
            />
          )}
        </div>
        <div>
          <h1>{member.fullName}</h1>
          {member.businessName && (
            <p>
              <strong>{member.businessName}</strong>
            </p>
          )}
          {(member.profession || member.category) && (
            <p>{member.profession || member.category}</p>
          )}
        </div>
      </header>

      <div className={styles.actions} aria-label="Member actions">
        <MemberShareTools member={member} />
        <a
          className="button secondary"
          href={`/members/${member.id}/contact.vcf`}
          download
        >
          Save to Contacts
        </a>
        {member.permissions.phone && member.phone && (
          <a className="button secondary" href={`tel:${member.phone}`}>
            Call
          </a>
        )}
        {member.permissions.email && member.email && (
          <a className="button secondary" href={`mailto:${member.email}`}>
            Email
          </a>
        )}
        {member.website && (
          <a
            className="button secondary"
            href={member.website}
            target="_blank"
            rel="noreferrer"
          >
            Visit Website
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </div>

      {(member.description || member.idealReferral) && (
        <div className={`detail-card ${styles.information}`}>
          {member.description && (
            <section aria-labelledby="business-description">
              <h2 id="business-description">About the business</h2>
              <p>{member.description}</p>
            </section>
          )}
          {member.idealReferral && (
            <section aria-labelledby="ideal-referral">
              <h2 id="ideal-referral">Ideal referral</h2>
              <p>{member.idealReferral}</p>
            </section>
          )}
        </div>
      )}

      {member.businessCardImage && (
        <section aria-labelledby="business-card-title">
          <h2 id="business-card-title">Business card</h2>
          <SafeLinkedExternalImage
            className={styles.businessCard}
            src={member.businessCardImage}
            alt={`${member.fullName}'s business card`}
            linkLabel={`Open ${member.fullName}'s business card full size`}
          />
        </section>
      )}
    </article>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3);
}
