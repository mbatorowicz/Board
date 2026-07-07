"use client";

import { useSyncExternalStore } from "react";
import { copy } from "@/lib/copy";
import { formatTime, formatWeekdayDate } from "@/lib/format";
import styles from "./components.module.css";

function subscribe(callback: () => void): () => void {
  const interval = setInterval(callback, 1000);
  return () => clearInterval(interval);
}

function getSnapshot(): number {
  return Math.floor(Date.now() / 1000);
}

// Zegar to wartość dostępna wyłącznie po stronie klienta — na serwerze
// zwracamy null, aby uniknąć niezgodności hydracji.
function getServerSnapshot(): number | null {
  return null;
}

export default function Clock() {
  const tick = useSyncExternalStore<number | null>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (tick === null) {
    return (
      <div className={styles.clock} aria-hidden="true">
        <span className={styles.clockTime}>--:--:--</span>
        <span className={styles.clockDate}>{copy.clock.loading}</span>
      </div>
    );
  }

  const now = new Date(tick * 1000);

  return (
    <div
      className={styles.clock}
      role="timer"
      aria-live="off"
      aria-label={copy.clock.ariaLabel}
    >
      <span className={styles.clockTime}>{formatTime.format(now)}</span>
      <span className={styles.clockDate}>{formatWeekdayDate.format(now)}</span>
    </div>
  );
}
