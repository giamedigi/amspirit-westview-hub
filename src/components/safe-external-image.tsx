"use client";

import { useState } from "react";

export function SafeExternalImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // Upload hostnames and dimensions are not known until Jotform returns them.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export function SafeLinkedExternalImage({
  src,
  alt,
  className,
  imageClassName,
  linkLabel,
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  linkLabel: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <a
      className={className}
      href={src}
      target="_blank"
      rel="noreferrer"
      aria-label={linkLabel}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={imageClassName}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </a>
  );
}

export function SafeBusinessCard({
  src,
  alt,
  linkLabel,
  imageClassName,
  linkClassName,
  actionClassName,
}: {
  src: string;
  alt: string;
  linkLabel: string;
  imageClassName?: string;
  linkClassName?: string;
  actionClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <section aria-labelledby="business-card-title">
      <h2 id="business-card-title">Business Card</h2>
      <a
        className={linkClassName}
        href={src}
        target="_blank"
        rel="noreferrer"
        aria-label={linkLabel}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={imageClassName}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      </a>
      <a
        className={actionClassName}
        href={src}
        target="_blank"
        rel="noreferrer"
      >
        View Full-Size Business Card
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </section>
  );
}
