"use client";

import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import { formatHeaderDate, formatTime, formatWeekdayDate } from "@/lib/format";
import styles from "./components.module.css";

export default function Clock({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const clockClass = [
    styles.clock,
    compact ? styles.headerToolbarClock : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (!now) {
    return (
      <div className={clockClass} aria-hidden="true">
        <span className={styles.clockTime}>--:--:--</span>
        {compact ? (
          <>
            <span className={styles.headerToolbarClockSep} aria-hidden="true">
              ·
            </span>
            <span className={styles.clockDate}>{copy.clock.loading}</span>
          </>
        ) : (
          <span className={styles.clockDate}>{copy.clock.loading}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={clockClass}
      role="timer"
      aria-live="off"
      aria-label={copy.clock.ariaLabel}
    >
      <span className={styles.clockTime}>{formatTime.format(now)}</span>
      {compact ? (
        <>
          <span className={styles.headerToolbarClockSep} aria-hidden="true">
            ·
          </span>
          <span className={styles.clockDate}>
            {formatHeaderDate.format(now)}
          </span>
        </>
      ) : (
        <span className={styles.clockDate}>
          {formatWeekdayDate.format(now)}
        </span>
      )}
    </div>
  );
}
