import { cookies } from "next/headers";
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
import { getCurrentUser } from "@/lib/user-session";
import { getUserPersonalLinks, getUsers } from "@/lib/users";
import ui from "@/styles/ui.module.css";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function readConfirmation(
  value: string | undefined,
): { name: string; at: string } | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as { name?: unknown; at?: unknown };
    if (typeof parsed.name === "string" && typeof parsed.at === "string") {
      return { name: parsed.name, at: parsed.at };
    }
  } catch {
    return null;
  }
  return null;
}

export default async function Home() {
  const currentUser = await getCurrentUser();

  const [
    allAdvisories,
    announcements,
    quickLinks,
    settings,
    logo,
    cookieStore,
    users,
    personalLinks,
  ] = await Promise.all([
    getAdvisories(),
    getAnnouncements(),
    getQuickLinks(),
    getSettings(),
    getOfficeLogo(),
    cookies(),
    getUsers(),
    currentUser ? getUserPersonalLinks(currentUser.id) : Promise.resolve([]),
  ]);

  const hidden = new Set(settings.hiddenCertCategories);
  const advisories = allAdvisories.filter(
    (advisory) => !hidden.has(advisory.category),
  );

  const ackCookie = readConfirmation(cookieStore.get(ACK_COOKIE)?.value);
  const confirmation =
    currentUser && ackCookie?.name === currentUser.name ? ackCookie : null;
  const flash = await readFlash();

  const selectableUsers =
    settings.userLoginMode === "select"
      ? users.map((user) => ({ id: user.id, name: user.name }))
      : [];

  return (
    <div id="page-content" className={styles.page}>
      <PageHeader
        logo={logo}
        title={settings.headerTitle}
        subtitle={settings.headerSubtitle}
        currentUser={currentUser}
        loginMode={settings.userLoginMode}
        selectableUsers={selectableUsers}
      />

      <QuickLinksSection
        globalLinks={quickLinks}
        personalLinks={personalLinks}
        isLoggedIn={Boolean(currentUser)}
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
        <AcknowledgeBox
          confirmation={confirmation}
          flash={flash}
          currentUser={currentUser}
        />
      </section>
    </div>
  );
}
