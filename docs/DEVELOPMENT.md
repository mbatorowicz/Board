# Development (Windows)

Projekt rozwijasz na **Windows**. Produkcja działa na **Linuxie** przez Docker — patrz [DEPLOYMENT.md](./DEPLOYMENT.md).

## Wymagania

- Node.js **20+**
- Git

## Pierwsze uruchomienie

```powershell
git clone https://github.com/mbatorowicz/Board.git
cd Board
npm install
copy .env.example .env.local
# Ustaw ADMIN_PASSWORD w .env.local
npm run dev
```

Strona: http://localhost:3000  
Panel admina: http://localhost:3000/admin

## Codzienna praca

```powershell
npm run dev      # serwer deweloperski (Webpack, port 3000)
npm run lint     # ESLint
npm run test     # Vitest
npm run build    # build produkcyjny (test przed wdrożeniem)
```

## Zmienne środowiskowe (dev)

Użyj pliku **`.env.local`** (nie commituj go). Szablon: `.env.example` — pełna lista w [ENVIRONMENT.md](./ENVIRONMENT.md).

Minimum:

```env
ADMIN_PASSWORD=twoje-haslo-dev
OFFICE_NAME=Urząd Gminy
```

## Dane lokalne

W development dane zapisują się w **`.data/`** (gitignore). To odpowiednik folderu **`data/`** na serwerze Linux.

## OneDrive / Windows

Jeśli projekt leży w OneDrive i dev server się dziwnie zachowuje, przenieś repozytorium poza OneDrive (np. `C:\Dev\Board`) albo używaj `npm run build && npm start` zamiast `dev`.

## Wdrożenie zmian

```powershell
git add .
git commit -m "Opis zmian"
git push
```

Na serwerze Linux: `./board update` — patrz [DEPLOYMENT.md](./DEPLOYMENT.md).
