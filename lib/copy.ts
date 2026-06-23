export const copy = {
  site: {
    pageTitle: (officeName: string) => `Strona startowa — ${officeName}`,
    metaDescription: "Wewnętrzna strona startowa dla pracowników urzędu",
    subtitle: "Informacje dla pracowników",
  },
  sections: {
    quickLinks: "Szybkie linki",
    cert: "Ostrzeżenia CERT Polska",
    announcements: "Ogłoszenia wewnętrzne",
    acknowledge: "Potwierdzenie zapoznania się",
  },
  empty: {
    cert: "Brak aktualnych ostrzeżeń.",
    announcements: "Brak ogłoszeń.",
    links: "Brak linków.",
    acknowledgments: "Brak potwierdzeń.",
    certCategories:
      "Brak kategorii do skonfigurowania — nie udało się pobrać ostrzeżeń lub nie mają one kategorii.",
  },
  badges: {
    pinned: "Przypięte",
    critical: "Krytyczne",
  },
  actions: {
    manage: "Zarządzaj",
    login: "Zaloguj",
    logout: "Wyloguj",
    save: "Zapisz",
    edit: "Zapisz zmiany",
    delete: "Usuń",
    addAnnouncement: "Dodaj ogłoszenie",
    addLink: "Dodaj link",
    saveLink: "Zapisz link",
    saveAllowlist: "Zapisz allowlistę",
    saveHeader: "Zapisz nagłówek",
    saveCertCategories: "Zapisz ustawienia kategorii",
    clearAcknowledgments: "Wyczyść rejestr",
    acknowledge: "Potwierdzam zapoznanie",
    uploadLogo: "Wgraj logo",
    removeLogo: "Usuń logo",
  },
  labels: {
    password: "Hasło",
    logoFile: "Plik logo (PNG, JPG lub WebP, max. 2 MB)",
    headerTitle: "Tytuł nagłówka",
    headerSubtitle: "Podtytuł nagłówka",
    title: "Tytuł",
    body: "Treść",
    pinned: "Przypięte",
    linkName: "Nazwa",
    linkUrl: "Adres URL",
    linkDescription: "Opis (opcjonalnie)",
    allowedIps: "Dozwolone adresy IP",
    fullName: "Imię i nazwisko",
  },
  admin: {
    title: "Panel administracyjny",
    loginHint: "Zaloguj się, aby zarządzać treścią strony.",
    notConfigured:
      "Panel nie jest skonfigurowany. Ustaw zmienną środowiskową ADMIN_PASSWORD.",
    wrongPassword: "Nieprawidłowe hasło. Spróbuj ponownie.",
    allowlistTitle: "Allowlista IP",
    allowlistHelp:
      "Jeden adres IPv4 lub zakres CIDR w wierszu (np. 192.168.1.10 lub 192.168.1.0/24). Puste pole — brak ograniczeń. Allowlista działa tylko przy TRUST_PROXY=true i reverse proxy ustawiającym X-Real-IP.",
    allowlistCurrentIp: (ip: string) => `Twój adres IP: ${ip}`,
    allowlistUnknownIp: "Twój adres IP: nieznany (localhost)",
    allowlistWarning:
      "Jeśli zapiszesz listę bez swojego adresu IP, możesz stracić dostęp do strony i panelu (poza środowiskiem lokalnym).",
    certCategoriesTitle: "Kategorie CERT na stronie głównej",
    certCategoriesHelp:
      "Odznacz kategorie, których ostrzeżenia mają być ukryte na stronie głównej.",
    addAnnouncement: "Nowe ogłoszenie",
    existingAnnouncements: "Ogłoszenia",
    addLink: "Nowy szybki link",
    quickLinks: "Szybkie linki",
    acknowledgments: "Rejestr potwierdzeń",
    headerTitle: "Nagłówek strony",
    headerPreview: "Podgląd nagłówka",
    headerTextForm: "Teksty nagłówka",
    logoForm: "Logo",
    logoHelp:
      "Wyświetlane obok tekstów w nagłówku. Zalecany format poziomy (PNG z przezroczystością lub JPG/WebP).",
    logoMissing: "Brak wgranego logo.",
    headerSaved: "Nagłówek został zapisany.",
    headerInvalid: "Tytuł nagłówka nie może być pusty.",
  },
  acknowledge: {
    intro:
      "Potwierdzam zapoznanie z ostrzeżeniami CERT oraz treścią strony głównej.",
    thanks: (name: string) => `Dziękujemy, ${name}.`,
    confirmedAt: (date: string) => `Potwierdzenie zapisane: ${date}.`,
  },
  access: {
    forbiddenTitle: "Dostęp ograniczony",
    forbiddenHeading: "Dostęp tylko z sieci urzędu",
    forbiddenBody:
      "Ta strona jest dostępna wyłącznie z komputerów w sieci urzędu. Jeśli widzisz ten komunikat na stanowisku służbowym, skontaktuj się z informatykiem.",
  },
  clock: {
    loading: "Ładowanie…",
    ariaLabel: "Aktualna data i godzina",
  },
  theme: {
    switchToLight: "Włącz tryb jasny",
    switchToDark: "Włącz tryb ciemny",
  },
  personalLinks: {
    title: "Twoje linki",
    add: "Dodaj własny link",
    remove: "Usuń link",
    badge: "Twój",
    emptyLabel: "Podaj nazwę linku.",
    invalidUrl: "Adres URL musi zaczynać się od https://",
    limitReached: (max: number) =>
      `Możesz dodać maksymalnie ${max} własnych linków.`,
  },
} as const;

export function withCount(label: string, count: number): string {
  return `${label} (${count})`;
}
