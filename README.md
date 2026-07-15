# Board — strona startowa urzędu

Wewnętrzna tablica informacyjna dla pracowników urzędu (Next.js). Działa w sieci LAN — **nie wystawiaj publicznie w internecie**.

## Co wyświetla

- Ostrzeżenia **CERT Polska** (RSS, cache)
- **Ogłoszenia** wewnętrzne (panel `/admin`)
- **Szybkie linki** — globalne + per komputer (bez logowania)
- **Potwierdzenie zapoznania się** z ostrzeżeniami

## Model pracy

| Gdzie | Co robisz |
|-------|-----------|
| **Windows** | Development — edycja kodu, `npm run dev`, commit, push |
| **Linux (serwer)** | Hosting — `./board up` (Docker, jedna komenda) |

## Szybki start

### Development (Windows)

```powershell
npm install
copy .env.example .env.local   # ustaw ADMIN_PASSWORD
npm run dev
```

→ http://localhost:3000

Szczegóły: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

### Produkcja (Linux) — jedna komenda

```bash
ADMIN_PASSWORD='silne-haslo' bash -c "$(curl -fsSL https://raw.githubusercontent.com/mbatorowicz/Board/master/install.sh)"
```

Instaluje do `~/Board`, nadpisuje starą kopię, uruchamia Docker.

→ http://\<IP-serwera\>:3000

Szczegóły: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Dokumentacja

| Dokument | Temat |
|----------|--------|
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Praca na Windows, npm, dev server |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Linux, Docker, `./board`, backup, update |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Zmienne środowiskowe |
| [docs/WORKSTATIONS.md](docs/WORKSTATIONS.md) | Homepage Firefox/Chrome na PC pracowników |

## Struktura repozytorium

```
app/              Strony i API (Next.js App Router)
components/       UI
lib/              Logika, bezpieczeństwo, persystencja JSON
data/             Dane produkcyjne (Docker volume, gitignore)
board             Skrypt uruchomienia produkcyjnego (Linux)
docker-compose.yml
Dockerfile
deploy/workstations/   Skrypty homepage dla PC (Linux + Windows)
docs/             Dokumentacja
```

## Bezpieczeństwo (skrót)

- Panel `/admin` — hasło `ADMIN_PASSWORD` + CSRF
- Dostęp LAN only, brak publicznego URL
- Rate limiting, CSP, walidacja URL, ochrona SSRF
- Backup folderu `data/` — regularnie

## QNAP

Bez SSH: `docker-compose.qnap.yml` + Container Station (komentarze w pliku).  
Z SSH: `./board up` jak na zwykłym Linuxie.
