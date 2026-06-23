import type { QuickLink } from "@/lib/types";
import styles from "./components.module.css";

export default function LinkTile({
  link,
  className,
}: {
  link: QuickLink;
  className?: string;
}) {
  return (
    <a
      className={[styles.linkTile, className].filter(Boolean).join(" ")}
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={styles.linkLabel}>
        {link.label}
        <span className={styles.linkArrow} aria-hidden="true">
          ↗
        </span>
      </span>
      {link.description ? (
        <span className={styles.linkDescription}>{link.description}</span>
      ) : null}
    </a>
  );
}
