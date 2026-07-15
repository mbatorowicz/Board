# Zmienne środowiskowe

Pliki:

| Plik | Kiedy |
|------|--------|
| `.env.local` | Development (Windows/Linux, `npm run dev`) |
| `.env` | Produkcja Docker (`./board up`) |

Szablon: `.env.example`

## Wymagane na produkcji

| Zmienna | Opis |
|---------|------|
| `ADMIN_PASSWORD` | Hasło panelu `/admin`. **Wymagane** — aplikacja nie startuje bez niego w `NODE_ENV=production`. |

## Podstawowe

| Zmienna | Domyślnie | Opis |
|---------|-----------|------|
| `OFFICE_NAME` | `Urząd Gminy` | Nazwa w nagłówku strony |
| `BOARD_PORT` | `3000` | Port mapowany na hoście (Docker) |
| `LINK_THUMBS` | `placeholder` | `placeholder` = bez pobierania miniatur (oszczędność CPU) |

## CERT i cache

| Zmienna | Domyślnie | Opis |
|---------|-----------|------|
| `CERT_FEED_URL` | kanał CERT Polska | Adres RSS |
| `FEED_REVALIDATE_SECONDS` | `1200` | Odświeżanie feedu (20 min) |

## Reverse proxy / HTTPS

| Zmienna | Opis |
|---------|------|
| `TRUST_PROXY` | `true` — ufaj `X-Forwarded-*` (tylko za zaufanym proxy) |
| `ALLOWED_HOSTS` | Lista dozwolonych hostów, np. `start.urzad.local,192.168.1.50:3000` |
| `COOKIE_SECURE` | `true` przy HTTPS — flaga Secure na ciasteczkach |
| `ENABLE_HSTS` | `true` — nagłówek Strict-Transport-Security |
| `BOARD_PUBLIC_URL` | Publiczny URL strony (skrypty stacji roboczych) |

## Gdzie zapisywane są dane

| Środowisko | Folder |
|------------|--------|
| Development | `.data/` |
| Docker (Linux) | `./data/` → `/app/.data` w kontenerze |

Backup: katalog `data/` (produkcja) lub `.data/` (dev).
