import { acknowledgeAction } from "@/app/acknowledge";
import { copy } from "@/lib/copy";
import { formatDateTimeLong, formatIso } from "@/lib/format";
import type { FlashMessage } from "@/lib/flash";
import FlashBanner from "@/components/FlashBanner";
import ui from "@/styles/ui.module.css";
import styles from "./components.module.css";

export default function AcknowledgeBox({
  confirmation,
  flash,
}: {
  confirmation: { name: string; at: string } | null;
  flash: FlashMessage | null;
}) {
  if (confirmation) {
    return (
      <div className={styles.ackConfirmed}>
        <span className={styles.ackCheck} aria-hidden="true">
          ✓
        </span>
        <div>
          <p className={styles.ackConfirmedTitle}>
            {copy.acknowledge.thanks(confirmation.name)}
          </p>
          <p className={styles.ackConfirmedText}>
            {copy.acknowledge.confirmedAt(
              formatIso(confirmation.at, formatDateTimeLong),
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={acknowledgeAction} className={styles.ackForm}>
      <FlashBanner flash={flash} />
      <p className={styles.ackIntro}>{copy.acknowledge.intro}</p>
      <div className={styles.ackRow}>
        <button className={ui.button} type="submit">
          {copy.actions.acknowledge}
        </button>
      </div>
    </form>
  );
}
