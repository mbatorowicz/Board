import { Suspense } from "react";
import CertCard from "@/components/CertCard";
import AnnouncementCard from "@/components/AnnouncementCard";
import { getAdvisories } from "@/lib/cert";
import { getAnnouncements } from "@/lib/announcements";
import { getSettings } from "@/lib/settings";
import { copy } from "@/lib/copy";
import ui from "@/styles/ui.module.css";
import styles from "@/app/page.module.css";

function FeedFallback({ label }: { label: string }) {
  return <p className={ui.empty}>{label}</p>;
}

async function CertFeedSection() {
  const [allAdvisories, settings] = await Promise.all([
    getAdvisories(),
    getSettings(),
  ]);
  const hidden = new Set(settings.hiddenCertCategories);
  const advisories = allAdvisories.filter(
    (advisory) => !hidden.has(advisory.category),
  );

  return (
    <section className={ui.panel} aria-labelledby="cert-heading">
      <div className={ui.panelHead}>
        <h2 id="cert-heading" className={ui.panelTitle}>
          {copy.sections.cert}
        </h2>
        <span className={ui.count}>{advisories.length}</span>
      </div>
      <div className={ui.panelBody}>
        {advisories.length === 0 ? (
          <p className={ui.empty}>{copy.empty.cert}</p>
        ) : (
          advisories.map((advisory) => (
            <CertCard key={advisory.id} advisory={advisory} />
          ))
        )}
      </div>
    </section>
  );
}

async function AnnouncementsSection() {
  const announcements = await getAnnouncements();

  return (
    <section className={ui.panel} aria-labelledby="ann-heading">
      <div className={ui.panelHead}>
        <h2 id="ann-heading" className={ui.panelTitle}>
          {copy.sections.announcements}
        </h2>
      </div>
      <div className={ui.panelBody}>
        {announcements.length === 0 ? (
          <p className={ui.empty}>{copy.empty.announcements}</p>
        ) : (
          announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
            />
          ))
        )}
      </div>
    </section>
  );
}

export function HomeFeedSections() {
  return (
    <main className={styles.main}>
      <Suspense fallback={<FeedFallback label={copy.empty.cert} />}>
        <CertFeedSection />
      </Suspense>
      <Suspense fallback={<FeedFallback label={copy.empty.announcements} />}>
        <AnnouncementsSection />
      </Suspense>
    </main>
  );
}
