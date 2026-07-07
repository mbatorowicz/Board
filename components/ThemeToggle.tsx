"use client";

import { copy } from "@/lib/copy";
import { useTheme } from "@/components/ThemeProvider";
import styles from "./components.module.css";

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  const isLight = theme === "light";
  const label = isLight ? copy.theme.switchToDark : copy.theme.switchToLight;

  return (
    <button
      type="button"
      className={[styles.themeToggle, className].filter(Boolean).join(" ")}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <span className={styles.themeToggleIcon} aria-hidden="true">
        {isLight ? "☾" : "☀"}
      </span>
    </button>
  );
}
