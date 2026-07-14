"use client";

import { useEffect, useRef } from "react";
import { copy } from "@/lib/copy";
import { formatHeaderDate, formatTime, formatWeekdayDate } from "@/lib/format";
import styles from "./components.module.css";

function formatClockDate(now: Date, compact: boolean): string {
  return compact
    ? formatHeaderDate.format(now)
    : formatWeekdayDate.format(now);
}

export default function Clock({ compact = false }: { compact?: boolean }) {
  const timeRef = useRef<HTMLSpanElement>(null);
  const dateRef = useRef<HTMLSpanElement>(null);
  const initialNow = new Date();

  const clockClass = [
    styles.clock,
    compact ? styles.headerToolbarClock : "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    function tick(): void {
      const now = new Date();
      if (timeRef.current) {
        timeRef.current.textContent = formatTime.format(now);
      }
      if (dateRef.current) {
        dateRef.current.textContent = formatClockDate(now, compact);
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [compact]);

  return (
    <div
      className={clockClass}
      role="timer"
      aria-live="off"
      aria-label={copy.clock.ariaLabel}
    >
      <span
        ref={timeRef}
        className={styles.clockTime}
        suppressHydrationWarning
      >
        {formatTime.format(initialNow)}
      </span>
      {compact ? (
        <>
          <span className={styles.headerToolbarClockSep} aria-hidden="true">
            ·
          </span>
          <span
            ref={dateRef}
            className={styles.clockDate}
            suppressHydrationWarning
          >
            {formatHeaderDate.format(initialNow)}
          </span>
        </>
      ) : (
        <span
          ref={dateRef}
          className={styles.clockDate}
          suppressHydrationWarning
        >
          {formatWeekdayDate.format(initialNow)}
        </span>
      )}
    </div>
  );
}
