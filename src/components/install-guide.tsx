"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./install-guide.module.css";

const DISMISSED_KEY = "westview-install-guide-dismissed";
const REMIND_KEY = "westview-install-guide-remind-after";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    MSStream?: unknown;
  }

  interface Navigator {
    standalone?: boolean;
  }
}

export function InstallGuide() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<InstallPromptEvent | null>(null);

  const close = useCallback((preference: "dismissed" | "later" | "never") => {
    try {
      if (preference === "later") {
        localStorage.removeItem(DISMISSED_KEY);
        localStorage.setItem(REMIND_KEY, String(Date.now() + SEVEN_DAYS));
      } else {
        localStorage.setItem(DISMISSED_KEY, preference);
        localStorage.removeItem(REMIND_KEY);
      }
    } catch {
      // Storage can be unavailable in private browsing; closing still works.
    }
    dialogRef.current?.close();
    returnFocusRef.current?.focus();
  }, []);

  useEffect(() => {
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const platformTimeout = window.setTimeout(() => setIsIos(ios), 0);

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      navigator.standalone === true;
    let shouldShow = isMobile && !isStandalone;

    try {
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      const remindAfter = Number(localStorage.getItem(REMIND_KEY) || 0);
      shouldShow =
        shouldShow && !dismissed && (!remindAfter || Date.now() >= remindAfter);
    } catch {
      // Continue with the in-memory first-visit experience.
    }

    if (!shouldShow) {
      return () => window.clearTimeout(platformTimeout);
    }

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    let timeout = 0;
    const openWhenClear = () => {
      if (document.querySelector("dialog[open]")) {
        timeout = window.setTimeout(openWhenClear, 500);
        return;
      }
      dialogRef.current?.showModal();
      closeRef.current?.focus();
    };
    timeout = window.setTimeout(openWhenClear, 900);
    return () => {
      window.clearTimeout(platformTimeout);
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const installed = () => close("never");
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", installed);
    };
  }, [close]);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") close("never");
    setInstallPrompt(null);
  };

  const keepFocusInside = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const controls = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    );
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="install-guide-title"
      aria-describedby="install-guide-description"
      onCancel={(event) => {
        event.preventDefault();
        close("dismissed");
      }}
      onKeyDown={keepFocusInside}
    >
      <div className={styles.content}>
        <button
          ref={closeRef}
          className={styles.close}
          type="button"
          aria-label="Close Home Screen guide"
          onClick={() => close("dismissed")}
        >
          ×
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.icon}
          src="/icons/icon-192x192.png"
          alt=""
          width="64"
          height="64"
        />
        <h2 id="install-guide-title">Add West View to Your Home Screen</h2>
        <p id="install-guide-description" className={styles.intro}>
          Save the chapter hub like an app for quick access to events, members,
          announcements, and lunch connections.
        </p>

        <div className={styles.platform}>
          {isIos ? <ShareIcon /> : <MenuIcon />}
          <span>{isIos ? "On iPhone or iPad" : "On Android"}</span>
        </div>
        <ol className={styles.steps}>
          {isIos ? (
            <>
              <li>In Safari, tap the Share icon at the bottom.</li>
              <li>Scroll and tap “Add to Home Screen.”</li>
              <li>Tap “Add.”</li>
            </>
          ) : (
            <>
              <li>Tap the browser menu.</li>
              <li>Tap “Add to Home screen” or “Install app.”</li>
              <li>Confirm installation.</li>
            </>
          )}
        </ol>

        <div className={styles.actions}>
          {installPrompt && (
            <button className="button primary" type="button" onClick={install}>
              Install App
            </button>
          )}
          <button
            className="button primary"
            type="button"
            onClick={() => close("dismissed")}
          >
            Got it
          </button>
          <button
            className={styles.later}
            type="button"
            onClick={() => close("later")}
          >
            Show me later
          </button>
          <button
            className={styles.never}
            type="button"
            onClick={() => close("never")}
          >
            Don’t show again
          </button>
        </div>
      </div>
    </dialog>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 15V3m0 0L8 7m4-4 4 4" />
      <path d="M8 10H5v11h14V10h-3" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}
