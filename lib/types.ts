export interface CertAdvisory {
  id: string;
  title: string;
  link: string;
  description: string;
  category: string;
  pubDate: string;
  critical: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  pinned: boolean;
}

export interface AnnouncementInput {
  title: string;
  body: string;
  pinned: boolean;
}

export interface QuickLink {
  id: string;
  label: string;
  url: string;
  description?: string;
}

export interface QuickLinkInput {
  label: string;
  url: string;
  description?: string;
}

export type UserRole = "reader" | "editor" | "admin";

export type UserLoginMode = "select" | "type";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pinHash: string;
  personalLinks: QuickLink[];
  createdAt: string;
  lastSeenAt?: string;
  lastIp?: string;
  lastHost?: string;
}

/** Użytkownik bez wrażliwych pól — bezpieczny do serializacji w UI. */
export type UserPublic = Omit<User, "pinHash">;

export interface SiteSettings {
  hiddenCertCategories: string[];
  headerTitle: string;
  headerSubtitle: string;
  userLoginMode: UserLoginMode;
}

export interface Acknowledgment {
  id: string;
  name: string;
  createdAt: string;
  deviceId?: string;
  ip?: string;
}

export interface AcknowledgmentInput {
  name: string;
  deviceId?: string;
  ip?: string;
}

export interface PageView {
  id: string;
  path: string;
  host: string;
  createdAt: string;
  ip?: string;
  userId?: string;
  userName?: string;
}

export interface PageViewInput {
  path: string;
  host: string;
  ip?: string;
  userId?: string;
  userName?: string;
}

export interface HomePageViewStats {
  visitsLast7Days: number;
  uniqueHostsLast7Days: number;
  lastVisit: PageView | null;
}
