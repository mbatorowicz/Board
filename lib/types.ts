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

export interface SiteSettings {
  hiddenCertCategories: string[];
}

export interface Acknowledgment {
  id: string;
  name: string;
  createdAt: string;
  ip?: string;
}

export interface AcknowledgmentInput {
  name: string;
  ip?: string;
}
