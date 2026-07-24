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
        onError={() => setFailed(true)}
      />
    </a>
  );
}
