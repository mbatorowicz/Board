#!/usr/bin/env bash
# Uruchamia stronę Board w domyślnej przeglądarce lub Firefox/Chrome.
# Użycie: ./start-board.sh "http://192.168.1.50:3000" [firefox|chrome|default]

set -euo pipefail

HOMEPAGE_URL="${1:-}"
BROWSER="${2:-default}"

if [[ -z "$HOMEPAGE_URL" || ! "$HOMEPAGE_URL" =~ ^https?:// ]]; then
  echo "Użycie: $0 <URL> [firefox|chrome|default]" >&2
  exit 1
fi

case "$BROWSER" in
  firefox)
    if command -v firefox-esr >/dev/null 2>&1; then
      exec firefox-esr "$HOMEPAGE_URL"
    elif command -v firefox >/dev/null 2>&1; then
      exec firefox "$HOMEPAGE_URL"
    else
      echo "Nie znaleziono firefox/firefox-esr" >&2
      exit 1
    fi
    ;;
  chrome|chromium)
    if command -v google-chrome >/dev/null 2>&1; then
      exec google-chrome "$HOMEPAGE_URL"
    elif command -v chromium >/dev/null 2>&1; then
      exec chromium "$HOMEPAGE_URL"
    else
      echo "Nie znaleziono chrome/chromium" >&2
      exit 1
    fi
    ;;
  default)
    if command -v xdg-open >/dev/null 2>&1; then
      exec xdg-open "$HOMEPAGE_URL"
    else
      echo "Nie znaleziono xdg-open" >&2
      exit 1
    fi
    ;;
  *)
    echo "Nieznana przeglądarka: $BROWSER" >&2
    exit 1
    ;;
esac
