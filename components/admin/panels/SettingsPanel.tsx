import type { SiteSettings } from "@/lib/types";
import type { OfficeLogo } from "@/lib/logo";
import { CsrfField } from "@/components/admin/CsrfField";
import { HeaderBrandPreview } from "@/components/PageHeader";
import { copy } from "@/lib/copy";
import {
  removeLogoAction,
  saveHeaderAction,
  uploadLogoAction,
} from "@/app/admin/actions";
import ui from "@/styles/ui.module.css";
import styles from "@/app/admin/admin.module.css";

export default function SettingsPanel({
  settings,
  logo,
}: {
  settings: SiteSettings;
  logo: OfficeLogo | null;
}) {
  return (
    <section className={`${ui.surface} ${styles.card}`}>
      <h2 className={ui.sectionTitle}>{copy.admin.settingsTitle}</h2>

      <h3 className={styles.subheading}>{copy.admin.headerPreview}</h3>
      <div className={styles.headerPreview}>
        <HeaderBrandPreview
          logo={logo}
          title={settings.headerTitle}
          subtitle={settings.headerSubtitle}
          className={styles.headerPreviewBrand}
          logoClassName={styles.headerPreviewLogo}
          titleClassName={styles.headerPreviewTitle}
          subtitleClassName={styles.headerPreviewSubtitle}
        />
      </div>

      <h3 className={styles.subheading}>{copy.admin.headerTextForm}</h3>
      <form action={saveHeaderAction} className={ui.form}>
        <CsrfField />
        <label className={ui.label}>
          {copy.labels.headerTitle}
          <input
            className={ui.input}
            type="text"
            name="headerTitle"
            defaultValue={settings.headerTitle}
            required
          />
        </label>
        <label className={ui.label}>
          {copy.labels.headerSubtitle}
          <input
            className={ui.input}
            type="text"
            name="headerSubtitle"
            defaultValue={settings.headerSubtitle}
          />
        </label>
        <button className={ui.button} type="submit">
          {copy.actions.saveHeader}
        </button>
      </form>

      <h3 className={styles.subheading}>{copy.admin.logoForm}</h3>
      <p className={ui.notice}>{copy.admin.logoHelp}</p>
      {!logo ? (
        <p className={ui.emptyPlain}>{copy.admin.logoMissing}</p>
      ) : null}
      <form action={uploadLogoAction} className={ui.form}>
        <CsrfField />
        <label className={ui.label}>
          {copy.labels.logoFile}
          <input
            className={styles.fileInput}
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
          />
        </label>
        <button className={ui.button} type="submit">
          {copy.actions.uploadLogo}
        </button>
      </form>
      {logo ? (
        <form action={removeLogoAction}>
          <CsrfField />
          <button
            className={`${ui.button} ${ui.buttonGhost}`}
            type="submit"
          >
            {copy.actions.removeLogo}
          </button>
        </form>
      ) : null}
    </section>
  );
}
