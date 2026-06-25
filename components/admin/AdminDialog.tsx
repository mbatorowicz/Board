"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "@/styles/dialog.module.css";

export default function AdminDialog({
  open,
  title,
  titleId,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  titleId: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleClose(): void {
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${wide ? styles.dialogWide : ""}`}
      aria-labelledby={titleId}
      onClose={handleClose}
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
    >
      <div className={styles.dialogInner}>
        <div className={styles.dialogHead}>
          <h3 id={titleId} className={styles.dialogTitle}>
            {title}
          </h3>
          <button
            type="button"
            className={styles.dialogClose}
            onClick={handleClose}
            aria-label="Zamknij"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
