import type { Announcement } from "@/lib/types";
import { copy } from "@/lib/copy";
import { formatDateTime, formatIso } from "@/lib/format";
import { sanitizeAnnouncementHtml } from "@/lib/sanitize-html";
import { announcementFileUrl } from "@/lib/announcement-url";
import ui from "@/styles/ui.module.css";
import styles from "./components.module.css";

export default function AnnouncementCard({
  announcement,
}: {
  announcement: Announcement;
}) {
  const formattedDate = formatIso(announcement.createdAt, formatDateTime);
  const bodyHtml =
    announcement.bodyFormat === "html"
      ? sanitizeAnnouncementHtml(announcement.body)
      : null;

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
      {bodyHtml ? (
        <div
          className={`${ui.cardBody} ${styles.announcementBody}`}
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      ) : announcement.body ? (
        <p className={ui.cardBody}>{announcement.body}</p>
      ) : null}
      {announcement.attachments && announcement.attachments.length > 0 ? (
        <ul className={styles.announcementAttachments}>
          {announcement.attachments.map((attachment) => (
            <li key={attachment.id}>
              <a
                href={announcementFileUrl(attachment.id)}
                download={attachment.filename}
              >
                {attachment.filename}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
