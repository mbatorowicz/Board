import { cookies, headers } from "next/headers";
import PageHeader from "@/components/PageHeader";
import QuickLinksSection from "@/components/QuickLinksSection";
import AcknowledgeBox from "@/components/AcknowledgeBox";
import { HomeFeedSections } from "@/components/HomeFeedSections";
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

  const [quickLinks, settings, logo, cookieStore, deviceLinks, flash] =
    await Promise.all([
      getQuickLinks(),
      getSettings(),
      getOfficeLogo(),
      cookies(),
      deviceId ? getOrInitDeviceLinks(deviceId, { host }) : Promise.resolve([]),
      readFlash(),
    ]);

  const ackCookie = readConfirmation(
    cookieStore.get(ACK_COOKIE)?.value,
    deviceId,
  );

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

      <HomeFeedSections />

      <section
        className={`${ui.panel} ${styles.ackPanel}`}
        aria-labelledby="ack-heading"
      >
        <div className={ui.panelHead}>
          <h2 id="ack-heading" className={ui.panelTitle}>
            {copy.sections.acknowledge}
          </h2>
        </div>
        <AcknowledgeBox confirmation={ackCookie} flash={flash} />
      </section>
    </div>
  );
}
