# Stacje robocze — strona przy starcie przeglądarki

Skrypty ustawiają stronę Board jako homepage profilu Firefox/Chrome na komputerach pracowników.

Adres strony (np. `http://192.168.1.50:3000`) ustaw w zmiennej lub argumencie — ten sam co `BOARD_PUBLIC_URL` w `.env` serwera.

## Linux

```bash
cd deploy/workstations/linux
chmod +x *.sh
./set-firefox-homepage.sh "http://192.168.1.50:3000"
./start-board.sh "http://192.168.1.50:3000" firefox
```

## Windows

```powershell
cd deploy\workstations\windows
powershell -ExecutionPolicy Bypass -File .\Set-FirefoxHomepage.ps1 -HomepageUrl "http://192.168.1.50:3000"
```

Autostart przy logowaniu do Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\Install-WindowsStartup.ps1 -HomepageUrl "http://192.168.1.50:3000" -Browser firefox
```

## Polityki Firefox (cały PC, admin)

Windows: `Install-FirefoxPolicy.ps1`  
Przykładowy plik: `firefox/policies.json.example` → katalog `distribution` Firefox.

## Identyfikacja komputera

Aplikacja automatycznie przypisuje `device_id` (ciasteczko) — każda stacja ma własne linki bez logowania PIN.

Po konfiguracji homepage **zamknij i uruchom ponownie** przeglądarkę.
