import { OFFICE_NAME } from "@/lib/config";
import { officeLogoUrl, type OfficeLogo } from "@/lib/logo";
import Clock from "@/components/Clock";
import ThemeToggle from "@/components/ThemeToggle";
import UserSessionBar from "@/components/UserSessionBar";
import type { User, UserLoginMode } from "@/lib/types";
import componentStyles from "./components.module.css";
import styles from "@/app/page.module.css";

export default function PageHeader({
  logo,
  title,
  subtitle,
  currentUser,
  loginMode,
  selectableUsers,
}: {
  logo: OfficeLogo | null;
  title: string;
  subtitle: string;
  currentUser: User | null;
  loginMode: UserLoginMode;
  selectableUsers: Pick<User, "id" | "name">[];
}) {
  return (
    <header className={styles.header}>
      <div className={styles.headerBrand}>
        {logo ? (
          <img
            className={styles.logo}
            src={officeLogoUrl(logo.updatedAt)}
            alt={`Logo ${title}`}
            width={200}
            height={44}
          />
        ) : null}
        <div className={styles.headerText}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>
      <div className={styles.headerActions}>
        <UserSessionBar
          currentUser={currentUser}
          loginMode={loginMode}
          selectableUsers={selectableUsers}
          toolbar
        />
        <ThemeToggle className={componentStyles.headerToolbarTheme} />
        <Clock compact />
      </div>
    </header>
  );
}

export function HeaderBrandPreview({
  logo,
  title,
  subtitle,
  className,
  logoClassName,
  titleClassName,
  subtitleClassName,
}: {
  logo: OfficeLogo | null;
  title: string;
  subtitle: string;
  className?: string;
  logoClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}) {
  return (
    <div className={className}>
      {logo ? (
        <img
          className={logoClassName}
          src={officeLogoUrl(logo.updatedAt)}
          alt={`Logo ${title}`}
        />
      ) : null}
      <div>
        <p className={titleClassName}>{title || OFFICE_NAME}</p>
        <p className={subtitleClassName}>{subtitle}</p>
      </div>
    </div>
  );
}
