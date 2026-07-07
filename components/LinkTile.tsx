"use client";

import { useState } from "react";
import type { QuickLink } from "@/lib/types";
import { linkFaviconUrl, linkLabelInitial } from "@/lib/link-favicon-url";
import styles from "./components.module.css";

export default function LinkTile({
  link,
  className,
}: {
  link: QuickLink;
  className?: string;
}) {
  const [iconFailed, setIconFailed] = useState(false);
  const faviconSrc = linkFaviconUrl(link);
  const showFallback = iconFailed || !faviconSrc;

  return (
    <a
      className={[styles.linkTile, className].filter(Boolean).join(" ")}
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={styles.linkTileIcon} aria-hidden="true">
        {showFallback ? (
          <span className={styles.linkTileIconFallback}>
            {linkLabelInitial(link.label)}
          </span>
        ) : (
          <img
            src={faviconSrc}
            alt=""
            width={24}
            height={24}
            loading="lazy"
            decoding="async"
            className={styles.linkTileIconImage}
            onError={() => setIconFailed(true)}
          />
        )}
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
