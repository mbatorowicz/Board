import { copy } from "@/lib/copy";
import ui from "@/styles/ui.module.css";
import styles from "./page.module.css";

export default function Loading() {
  return (
    <div className={styles.page}>
      <p className={ui.notice}>{copy.site.metaDescription}</p>
    </div>
  );
}
