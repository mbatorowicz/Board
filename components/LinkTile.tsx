import type { QuickLink } from "@/lib/types";
import { linkThumbUrl } from "@/lib/link-thumb-url";
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
      <span className={styles.linkTileMedia} aria-hidden="true">
        <img
          src={linkThumbUrl(link)}
          alt=""
          loading="lazy"
          decoding="async"
          className={styles.linkTileImage}
        />
        <span className={styles.linkTileOverlay} />
      </span>
      <span className={styles.linkTileBody}>
        <span className={styles.linkLabel}>
          {link.label}
          <span className={styles.linkArrow} aria-hidden="true">
            ↗
          </span>
        </span>
        {link.description ? (
          <span className={styles.linkDescription}>{link.description}</span>
        ) : null}
      </span>
    </a>
  );
}
