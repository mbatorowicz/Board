#!/usr/bin/env bash
# Ustawia stronę startową we wszystkich profilach Firefox bieżącego użytkownika.
# Użycie: ./set-firefox-homepage.sh "http://192.168.1.50:3000"

set -euo pipefail

HOMEPAGE_URL="${1:-}"
if [[ -z "$HOMEPAGE_URL" || ! "$HOMEPAGE_URL" =~ ^https?:// ]]; then
  echo "Użycie: $0 <URL>, np. http://192.168.1.50:3000" >&2
  exit 1
fi

PROFILES_ROOT="${HOME}/.mozilla/firefox"
if [[ ! -d "$PROFILES_ROOT" ]]; then
  echo "Nie znaleziono profili Firefox w: $PROFILES_ROOT" >&2
  exit 1
fi

MARKER="// Strona startowa urzędu"
write_user_js() {
  local user_js="$1"
  local tmp="${user_js}.tmp.$$"
  local existing=""

  if [[ -f "$user_js" ]] && grep -qF "$MARKER" "$user_js"; then
    existing=$(awk -v marker="$MARKER" '$0 ~ marker { exit } { print }' "$user_js")
  elif [[ -f "$user_js" ]]; then
    existing=$(cat "$user_js")
  fi

  {
    [[ -n "$existing" ]] && printf '%s\n\n' "$existing"
    cat <<EOF
${MARKER} — wygenerowane przez Board/deploy/workstations/linux/set-firefox-homepage.sh
user_pref("browser.startup.page", 1);
user_pref("browser.startup.homepage", "${HOMEPAGE_URL}");
user_pref("browser.startup.homepage_override_once", false);
user_pref("browser.newtabpage.enabled", false);
user_pref("browser.newtab.preload", false);
EOF
  } > "$tmp"
  mv "$tmp" "$user_js"
}

count=0
for profile_dir in "$PROFILES_ROOT"/*; do
  [[ -d "$profile_dir" ]] || continue
  write_user_js "${profile_dir}/user.js"
  echo "  OK: ${profile_dir}/user.js"
  count=$((count + 1))
done

if [[ "$count" -eq 0 ]]; then
  echo "Nie znaleziono profili Firefox." >&2
  exit 1
fi

echo ""
echo "Gotowe. Zamknij Firefox i uruchom ponownie profil."
echo "URL: $HOMEPAGE_URL"
