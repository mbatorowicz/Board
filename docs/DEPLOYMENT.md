# Wdrożenie na Linuxie

Hostowanie produkcyjne: **jedna komenda** + Docker.

## Wymagania serwera

- Linux (Debian, Ubuntu, Kali, QNAP z SSH itd.)
- Docker Engine + Docker Compose v2
- ~512 MB–1 GB RAM dla kontenera
- Wyjście do internetu (HTTPS) — feed CERT Polska
- Port **3000** dostępny w LAN (lub inny przez `BOARD_PORT`)

## Instalacja Dockera (jeśli brak)

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
# Wyloguj się i zaloguj ponownie
```

## Pierwsze uruchomienie — jedna komenda

**Instalacja z internetu** (usuwa stary `~/Board`, klonuje od nowa, zachowuje `data/` i `.env` jeśli były):

```bash
ADMIN_PASSWORD='silne-unikalne-haslo' bash -c "$(curl -fsSL https://raw.githubusercontent.com/mbatorowicz/Board/master/install.sh)"
```

**Jeśli repozytorium już masz lokalnie:**

```bash
cd Board
ADMIN_PASSWORD='silne-unikalne-haslo' ./install.sh
```

Skrypt `./install.sh`:

1. Usuwa istniejący katalog `~/Board` (domyślnie)
2. Klonuje repozytorium od zera
3. Przywraca `data/` i `.env` z poprzedniej instalacji (jeśli były)
4. Uruchamia `./board up` (Docker build + start)

Inny katalog instalacji: `BOARD_DIR=/opt/board ADMIN_PASSWORD='...' ./install.sh`

Po instalacji strona: `http://<IP-serwera>:3000`

## Komendy `./board`

| Komenda | Działanie |
|---------|-----------|
| `./board up` | Build + start (pierwsze uruchomienie / po zmianach kodu) |
| `./board down` | Zatrzymaj kontener |
| `./board restart` | Restart bez rebuildu |
| `./board logs` | Logi na żywo |
| `./board update` | `git pull` + rebuild |
| `./board backup` | Archiwum `data/` → `backup-board-YYYYMMDD.tar.gz` |
| `./board status` | Status i adres URL |

## Aktualizacja po push z Windows

Na serwerze:

```bash
cd Board
./board update
```

Folder **`data/`** nie jest nadpisywany — ogłoszenia, linki i potwierdzenia zostają.

## Backup

```bash
./board backup
# lub ręcznie:
tar -czf backup-board-$(date +%Y%m%d).tar.gz data/
```

## QNAP (Container Station, bez SSH)

QNAP nie obsługuje `env_file` w wklejanym YAML — użyj **`docker-compose.qnap.yml`** i ustaw `ADMIN_PASSWORD` w Advanced Settings → Environment. Szczegóły w komentarzach w tym pliku.

Przy SSH na QNAP możesz użyć normalnie `./board up`.

## Reverse proxy (opcjonalnie)

Przykład nginx → `localhost:3000`:

```nginx
server {
    listen 80;
    server_name start.urzad.local;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

W `.env` na serwerze:

```env
TRUST_PROXY=true
ALLOWED_HOSTS=start.urzad.local
COOKIE_SECURE=true   # tylko przy HTTPS
```

## Produkcja bez Dockera (niezalecane)

```bash
npm ci
npm run build
ADMIN_PASSWORD='...' npm start
```

Dane w `.data/` w katalogu projektu.

## Bezpieczeństwo sieci

- Nie wystawiaj portu 3000 w publicznym internecie
- Dostęp tylko z LAN urzędu lub VPN
- Silne `ADMIN_PASSWORD` — wymagane (aplikacja nie startuje bez niego w produkcji)
