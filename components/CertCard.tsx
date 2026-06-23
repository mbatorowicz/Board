import type { CertAdvisory } from "@/lib/types";
import { copy } from "@/lib/copy";
import { formatDate, formatIso } from "@/lib/format";
import ui from "@/styles/ui.module.css";
import styles from "./components.module.css";

export default function CertCard({ advisory }: { advisory: CertAdvisory }) {
  const formattedDate = formatIso(advisory.pubDate, formatDate);

  return (
    <article
      className={`${styles.itemCard} ${advisory.critical ? styles.itemCritical : ""}`}
    >
      <div className={ui.meta}>
        {advisory.category ? (
          <span className={ui.badge}>{advisory.category}</span>
        ) : null}
        {advisory.critical ? (
          <span className={`${ui.badge} ${ui.badgeDanger}`}>
            {copy.badges.critical}
          </span>
        ) : null}
        {formattedDate ? (
          <time className={ui.cardDate} dateTime={advisory.pubDate}>
            {formattedDate}
          </time>
        ) : null}
      </div>
      <h3 className={ui.cardTitle}>
        {advisory.link ? (
          <a href={advisory.link} target="_blank" rel="noopener noreferrer">
            {advisory.title}
          </a>
        ) : (
          advisory.title
        )}
      </h3>
      {advisory.description ? (
        <p className={ui.cardBody}>{advisory.description}</p>
      ) : null}
    </article>
  );
}
