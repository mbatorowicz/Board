import { cookies, headers } from "next/headers";
import PageHeader from "@/components/PageHeader";
import CertCard from "@/components/CertCard";
import AnnouncementCard from "@/components/AnnouncementCard";
import QuickLinksSection from "@/components/QuickLinksSection";
import AcknowledgeBox from "@/components/AcknowledgeBox";
import { getAdvisories } from "@/lib/cert";
import { getAnnouncements } from "@/lib/announcements";
import { ACK_COOKIE } from "@/lib/acknowledgments";
import { getQuickLinks } from "@/lib/links";
import { getSettings } from "@/lib/settings";
import { getOfficeLogo } from "@/lib/logo";
import { readFlash } from "@/lib/flash";
import { copy } from "@/lib/copy";
import { getDeviceId } from "@/lib/device-id";
import { getOrInitDeviceLinks } from "@/lib/device-links";
import ui from "@/styles/ui.module.css";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function readConfirmation(
  value: string | undefined,
  deviceId: string | null,
): { name: string; at: string } | null {
  if (!value || !deviceId) {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as {
      deviceId?: unknown;
      name?: unknown;
      at?: unknown;
    };
    if (
      parsed.deviceId === deviceId &&
      typeof parsed.at === "string" &&
      typeof parsed.name === "string"
    ) {
      return { name: parsed.name, at: parsed.at };
    }
  } catch {
    return null;
  }
  return null;
}

export default async function Home() {
  const deviceId = await getDeviceId();
  const headerStore = await headers();
  const host = headerStore.get("host") ?? undefined;

  const [
    allAdvisories,
    announcements,
    quickLinks,
    settings,
    logo,
    cookieStore,
    deviceLinks,
  ] = await Promise.all([
    getAdvisories(),
    getAnnouncements(),
    getQuickLinks(),
    getSettings(),
    getOfficeLogo(),
    cookies(),
    deviceId ? getOrInitDeviceLinks(deviceId, { host }) : Promise.resolve([]),
  ]);

  const hidden = new Set(settings.hiddenCertCategories);
  const advisories = allAdvisories.filter(
    (advisory) => !hidden.has(advisory.category),
  );

  const ackCookie = readConfirmation(
    cookieStore.get(ACK_COOKIE)?.value,
    deviceId,
  );
  const confirmation = ackCookie;
  const flash = await readFlash();

  return (
    <div id="page-content" className={styles.page}>
      <PageHeader
        logo={logo}
        title={settings.headerTitle}
        subtitle={settings.headerSubtitle}
      />

      <QuickLinksSection
        globalLinks={quickLinks}
        editableLinks={deviceLinks}
        mode="device"
      />

      <main className={styles.main}>
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
      </main>

      <section
        className={`${ui.panel} ${styles.ackPanel}`}
        aria-labelledby="ack-heading"
      >
        <div className={ui.panelHead}>
          <h2 id="ack-heading" className={ui.panelTitle}>
            {copy.sections.acknowledge}
          </h2>
        </div>
        <AcknowledgeBox confirmation={confirmation} flash={flash} />
      </section>
    </div>
  );
}
