import type { Announcement } from "@/lib/types";
import { copy } from "@/lib/copy";
import { formatDateTime, formatIso } from "@/lib/format";
import ui from "@/styles/ui.module.css";
import styles from "./components.module.css";

export default function AnnouncementCard({
  announcement,
}: {
  announcement: Announcement;
}) {
  const formattedDate = formatIso(announcement.createdAt, formatDateTime);

  return (
    <article
      className={`${styles.itemCard} ${announcement.pinned ? styles.itemPinned : ""}`}
    >
      <div className={ui.meta}>
        {announcement.pinned ? (
          <span className={`${ui.badge} ${ui.badgePinned}`}>
            {copy.badges.pinned}
          </span>
        ) : null}
        {formattedDate ? (
          <time className={ui.cardDate} dateTime={announcement.createdAt}>
            {formattedDate}
          </time>
        ) : null}
      </div>
      <h3 className={ui.cardTitle}>{announcement.title}</h3>
      {announcement.body ? (
        <p className={ui.cardBody}>{announcement.body}</p>
      ) : null}
    </article>
  );
}
