"use client";

import { useState } from "react";
import type { Member, MemberEvent } from "@/lib/types";
import {
  buildEventShareMessage,
  buildMemberShareMessage,
} from "@/lib/sharing";

export function MemberShareTools({ member }: { member: Member }) {
  const [status, setStatus] = useState("");
  const message = buildMemberShareMessage(member);

  return (
    <>
      <button
        className="button primary"
        type="button"
        onClick={() =>
          shareOrCopy(
            member.businessName || member.fullName,
            message,
            "Business information copied",
            setStatus,
          )
        }
      >
        Share Business
      </button>
      <button
        className="button secondary"
        type="button"
        onClick={() =>
          copyWithStatus(message, "Business information copied", setStatus)
        }
      >
        Copy Business Info
      </button>
      <ShareStatus message={status} />
    </>
  );
}

export function EventShareTools({
  event,
  publicPath,
}: {
  event: MemberEvent;
  publicPath: string;
}) {
  const [status, setStatus] = useState("");
  const eventMessage = () =>
    buildEventShareMessage(event, `${window.location.origin}${publicPath}`);

  return (
    <>
      <button
        className="button primary"
        type="button"
        onClick={() =>
          shareOrCopy(
            event.title,
            eventMessage(),
            "Event information copied",
            setStatus,
          )
        }
      >
        Share Event
      </button>
      <button
        className="button secondary"
        type="button"
        onClick={() =>
          copyWithStatus(
            eventMessage(),
            "Event information copied",
            setStatus,
          )
        }
      >
        Copy Event Info
      </button>
      <ShareStatus message={status} />
    </>
  );
}

async function shareOrCopy(
  title: string,
  text: string,
  copiedMessage: string,
  setStatus: (message: string) => void,
) {
  setStatus("");
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text });
      setStatus("Shared successfully");
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }
  await copyWithStatus(text, copiedMessage, setStatus);
}

async function copyWithStatus(
  text: string,
  successMessage: string,
  setStatus: (message: string) => void,
) {
  setStatus("");
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const input = document.createElement("textarea");
      input.value = text;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      let copied = false;
      try {
        input.select();
        copied = document.execCommand("copy");
      } finally {
        input.remove();
      }
      if (!copied) throw new Error("Clipboard unavailable");
    }
    setStatus(successMessage);
  } catch {
    setStatus("Unable to copy. Please try again.");
  }
}

function ShareStatus({ message }: { message: string }) {
  return (
    <span className="status" role="status" aria-live="polite">
      {message}
    </span>
  );
}
