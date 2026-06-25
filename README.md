# Strona startowa urzędu gminy

Wewnętrzna strona startowa dla pracowników urzędu, zbudowana w Next.js (App Router). Działa **lokalnie w sieci urzędu** (QNAP lub inny serwer z Dockerem). Wyświetla:

- **Ostrzeżenia CERT Polska** – pobierane i cache'owane z publicznego kanału RSS,
- **Ogłoszenia wewnętrzne** – redagowane przez urząd w panelu `/admin`,
- **Szybkie linki** – skróty do najczęściej używanych systemów,
- **Potwierdzenie zapoznania się** – przycisk, którym pracownik potwierdza zapoznanie się z ostrzeżeniami i stroną główną (imię, data i IP zapisywane i widoczne w panelu `/admin`).

Dostęp można dodatkowo ograniczyć allowlistą IP (`proxy.ts`).

## Wymagania

- **Produkcja (QNAP):** Container Station (Docker), ~512 MB–1 GB RAM dla kontenera
- **Development:** Node.js 20+

## Konfiguracja (zmienne środowiskowe)

Skopiuj `.env.example` do `.env` (Docker / QNAP) lub `.env.local` (development):

| Zmienna | Opis |
| --- | --- |
| `ADMIN_PASSWORD` | Hasło do panelu `/admin` (**wymagane** na produkcji). |
| `OFFICE_NAME` | Nazwa urzędu w nagłówku. |
| `ALLOWED_IPS` | Opcjonalna allowlista IP, kilka po przecinku. Obsługuje CIDR, np. `192.168.1.0/24`. Puste = brak ograniczeń w `proxy.ts`. Na QNAP w LAN często wystarczy puste pole — strona i tak jest dostępna tylko w sieci urzędu. |
| `CERT_FEED_URL` | Adres kanału RSS CERT (domyślnie kanał CERT Polska). |
| `FEED_REVALIDATE_SECONDS` | Co ile sekund odświeżać dane CERT (domyślnie 1200 = 20 min). |
| `TRUST_PROXY` | Ustaw `true` **tylko** za zaufanym reverse proxy (nginx), który **nadpisuje** `X-Real-IP` adresem klienta. Bez tego allowlista IP w panelu **nie blokuje** ruchu — ochrona opiera się wyłącznie na izolacji LAN. |
| `COOKIE_SECURE` | Ustaw `true` przy HTTPS (reverse proxy z TLS). Wymagane dla flagi `Secure` na ciasteczkach sesji. |

Wszystkie dane aplikacji (ogłoszenia, potwierdzenia, linki, ustawienia, allowlista) zapisują się w plikach JSON w katalogu `.data/`.

## Bezpieczeństwo

- Panel `/admin` nie jest linkowany ze strony głównej — wejście tylko bezpośrednim adresem.
- Sesja admina: losowy token (8 h), `httpOnly`, `sameSite=strict`.
- Logowanie i wylogowanie: token CSRF w formularzu + weryfikacja po stronie serwera.
- Rate limiting logowania (5 prób / 15 min) i miniaturek linków (30/min) oraz potwierdzeń zapoznania (per IP, gdy `TRUST_PROXY=true`).
- Linki i feed CERT: tylko `https://` (w dev także `http://`).
- Nagłówki CSP, `X-Frame-Options`, `nosniff` — w `next.config.ts`.
- Allowlista IP: wymaga `TRUST_PROXY=true` i reverse proxy ustawiającego `X-Real-IP` — **nie** ufaj nagłówkom wysłanym przez przeglądarkę. Panel admina ostrzega, gdy lista IP jest zapisana, ale ochrona wyłączona.
- Regularnie rób backup katalogu `data/` / `.data/`.

## Uruchomienie lokalne (development)

```bash
npm install
npm run dev
```

Strona: http://localhost:3000 — w trybie deweloperskim allowlista IP przepuszcza `localhost`.

## Wdrożenie na QNAP

Aplikacja działa jako kontener Docker. Dane trzymane są w folderze `data/` obok projektu (mapowany na `/app/.data` w kontenerze).

### 1. Przygotowanie

1. Skopiuj projekt na QNAP (Git, SMB lub rsync).
2. Skopiuj `.env.example` → `.env` i ustaw co najmniej `ADMIN_PASSWORD` oraz `OFFICE_NAME`.

### 2. Uruchomienie

#### Container Station (bez SSH) — zalecane na QNAP

Standardowy `docker-compose.yml` używa `env_file: .env` — **Container Station tego nie obsługuje** przy wklejaniu YAML (błąd: `env file /tmp/.env not found`).

Użyj pliku **`docker-compose.qnap.yml`**:

1. W **File Station** utwórz folder **`/Container/Board`**.
2. Skopiuj **zawartość** repozytorium **bezpośrednio** do tego folderu (nie do podfolderu typu `HomePage/`).
3. Struktura na NAS musi wyglądać tak:

```
/Container/Board/
├── Dockerfile              ← wymagany w tym katalogu
├── docker-compose.qnap.yml
├── package.json
├── package-lock.json
├── next.config.ts
├── app/
├── components/
├── lib/
├── public/
├── proxy.ts
└── data/                   ← dane aplikacji (zachowaj przy aktualizacji)
```

4. **Nie wgrywaj:** `node_modules/`, `.next/`, `.git/`.
5. W **Container Station → Create → Create Application**:
   - **Name:** `board` (nie „docker-compose”)
   - Wklej treść `docker-compose.qnap.yml` (ścieżki: `/Container/Board`)
   - W sekcji `environment` ustaw **`ADMIN_PASSWORD`** (silne hasło)
6. **Create** — pierwszy build może potrwać 10–20 min.

Alternatywa: w YAML usuń blok `environment` i dodaj zmienne w **Advanced Settings → Environment** w Container Station.

#### SSH / terminal

W katalogu projektu:

```bash
cp .env.example .env   # ustaw ADMIN_PASSWORD
docker compose up -d --build
```

Strona: `http://<adres-ip-qnap>:3000` z komputera w sieci urzędu.

### 3. Dostęp w LAN

- **Prosty sposób:** port `3000` na IP QNAP-a, np. `http://192.168.1.50:3000`.
- **Wygodniejszy:** reverse proxy w QNAP (np. własna subdomena w DNS urzędu, `http://start.urzad.local`) — przekierowanie na `localhost:3000`.
- **Bezpieczeństwo:** nie wystawiaj portu 3000 w publicznym internecie (bez port forwarding w routerze). Dostęp tylko z LAN lub VPN urzędu.

### 4. Backup

Regularnie kopiuj folder **`data/`** (ogłoszenia, potwierdzenia, linki, ustawienia, allowlista). Możesz użyć harmonogramu snapshotów QNAP lub HBS.

Przykład ręcznej kopii:

```bash
tar -czf backup-homepage-$(date +%Y%m%d).tar.gz data/
```

### 5. Aktualizacja

**Skopiowanie plików na NAS nie wystarczy** — kontener działa ze **zbuilowanego obrazu**. Po podmianie kodu w `/Container/Board/` (bez nadpisywania folderu `data/`) w Container Station:

1. **Applications** → aplikacja `board` → **Stop**
2. **Actions** → **Rebuild** (lub usuń aplikację i utwórz ponownie z tym samym YAML)
3. Poczekaj na koniec buildu (10–20 min)
4. W przeglądarce: twarde odświeżenie `Ctrl+Shift+R` (to nie cache serwera — stary obraz Dockera)

Na QNAP przy `http://` **nie ustawiaj** `COOKIE_SECURE=true` — logowanie do `/admin` wymaga zwykłych ciasteczek (bez flagi Secure).

```bash
git pull   # jeśli używasz repozytorium
docker compose up -d --build
```

Folder `data/` pozostaje nietknięty — treści i rejestr potwierdzeń się zachowują.

### 6. Wymagania sieciowe

Kontener musi mieć **wyjście do internetu** (HTTPS), żeby pobierać kanał RSS CERT Polska. Ruch przychodzący ograniczasz do sieci urzędu (LAN / reverse proxy).

## Produkcja lokalna bez Dockera

```bash
npm install
npm run build
npm start
```

Ustaw zmienne środowiskowe jak w `.env.example`. Dane zapisują się w `.data/` w katalogu projektu.

## Kontrola dostępu

- `proxy.ts` sprawdza adres IP klienta (`x-forwarded-for`) i porównuje z allowlistą. Lista może być zarządzana w panelu `/admin` (zapis w `.data/allowlist.json`); dopóki nie zostanie zapisana, używana jest zmienna `ALLOWED_IPS`.
- Panel `/admin` wymaga hasła (`ADMIN_PASSWORD`).
- Na QNAP w LAN główną barierą jest brak publicznego URL — allowlista IP jest dodatkową warstwą, nie jedyną.

## Struktura

- `app/page.tsx` – dashboard
- `app/admin/` – panel ogłoszeń i rejestr potwierdzeń (Server Actions)
- `app/acknowledge.ts` – publiczna akcja zapisu potwierdzenia zapoznania się
- `lib/cert.ts` – pobieranie i parsowanie RSS CERT
- `lib/data-file.ts` – zapis i odczyt plików JSON w `.data/`
- `lib/announcements.ts` – ogłoszenia
- `lib/acknowledgments.ts` – potwierdzenia
- `lib/links.ts` – szybkie linki
- `lib/settings.ts` – widoczność kategorii CERT
- `lib/allowlist.ts` – whitelista IP
- `lib/logo.ts` – logo urzędu (plik w `.data/`, upload w panelu admina)
- `proxy.ts` – egzekwowanie allowlisty IP
- `Dockerfile`, `docker-compose.yml` – wdrożenie na QNAP
- `components/` – komponenty UI
