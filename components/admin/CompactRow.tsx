import type { ReactNode } from "react";
import styles from "@/app/admin/admin.module.css";

export default function CompactRow({
  label,
  meta,
  actions,
}: {
  label: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.compactRow}>
      <span className={styles.compactRowLabel}>{label}</span>
      {meta ? <span className={styles.compactRowMeta}>{meta}</span> : <span />}
      {actions ? (
        <span className={styles.compactRowActions}>{actions}</span>
      ) : (
        <span />
      )}
    </div>
  );
}
