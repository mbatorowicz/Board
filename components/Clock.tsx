"use client";

import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import { formatTime, formatWeekdayDate } from "@/lib/format";
import styles from "./components.module.css";

export default function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <div className={styles.clock} aria-hidden="true">
        <span className={styles.clockTime}>--:--:--</span>
        <span className={styles.clockDate}>{copy.clock.loading}</span>
      </div>
    );
  }

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
