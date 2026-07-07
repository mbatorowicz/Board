"use client";

import { useEffect, useState } from "react";
import type { QuickLink } from "@/lib/types";
import { copy } from "@/lib/copy";
import {
  persistQuickLinksCollapsed,
  readQuickLinksCollapsed,
} from "@/lib/quick-links-panel";
import QuickLinksPanel from "@/components/QuickLinksPanel";
import ui from "@/styles/ui.module.css";
import pageStyles from "@/app/page.module.css";
import styles from "./components.module.css";

export default function QuickLinksSection({
  globalLinks,
  personalLinks,
  isLoggedIn,
}: {
  globalLinks: QuickLink[];
  personalLinks: QuickLink[];
  isLoggedIn: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(readQuickLinksCollapsed());
    setHydrated(true);
  }, []);

  function toggleCollapsed(): void {
    setCollapsed((current) => {
      const next = !current;
      persistQuickLinksCollapsed(next);
      return next;
    });
  }

  const linkCount = globalLinks.length + personalLinks.length;
  const expanded = hydrated ? !collapsed : true;

  return (
    <section
      className={[
        ui.panel,
        pageStyles.linksBar,
        collapsed && hydrated ? styles.linksPanelCollapsed : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby="links-heading"
    >
      <div
        className={[
          ui.panelHead,
          collapsed && hydrated ? styles.linksPanelHeadCollapsed : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <h2 id="links-heading" className={ui.panelTitle}>
          {copy.sections.quickLinks}
          {collapsed && hydrated && linkCount > 0 ? (
            <span className={styles.linksPanelCount}>{linkCount}</span>
          ) : null}
        </h2>
        <button
          type="button"
          className={styles.linksPanelToggle}
          onClick={toggleCollapsed}
          aria-expanded={expanded}
          aria-controls="links-panel-body"
          aria-label={
            expanded
              ? copy.quickLinksPanel.collapse
              : copy.quickLinksPanel.expand
          }
        >
          <span className={styles.linksPanelToggleIcon} aria-hidden="true">
            {expanded ? "▾" : "▸"}
          </span>
        </button>
      </div>
      {expanded ? (
        <div id="links-panel-body" className={styles.linksPanelBody}>
          <QuickLinksPanel
            globalLinks={globalLinks}
            personalLinks={personalLinks}
            isLoggedIn={isLoggedIn}
          />
        </div>
      ) : null}
    </section>
  );
}
