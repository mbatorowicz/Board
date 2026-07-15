#!/usr/bin/env bash
# Instalacja / reinstalacja Board — jedna komenda, nadpisuje istniejący katalog.
#
#   ADMIN_PASSWORD='haslo' ./install.sh
#
#   ADMIN_PASSWORD='haslo' bash -c "$(curl -fsSL https://raw.githubusercontent.com/mbatorowicz/Board/master/install.sh)"

set -euo pipefail

REPO="${BOARD_REPO:-https://github.com/mbatorowicz/Board.git}"
DIR="${BOARD_DIR:-${HOME}/Board}"
BRANCH="${BOARD_BRANCH:-master}"

red() { printf '\033[31m%s\033[0m\n' "$*" >&2; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }

require_git() {
  if ! command -v git >/dev/null 2>&1; then
    red "Brak git. Zainstaluj: sudo apt install git"
    exit 1
  fi
}

preserve_and_remove() {
  DATA_BACKUP=""
  ENV_BACKUP=""

  if [[ -d "${DIR}/data" ]]; then
    DATA_BACKUP="$(mktemp -d)"
    cp -a "${DIR}/data/." "${DATA_BACKUP}/"
    yellow "Zachowano data/ (tymczasowo)"
  fi

  if [[ -f "${DIR}/.env" ]]; then
    ENV_BACKUP="$(mktemp)"
    cp "${DIR}/.env" "${ENV_BACKUP}"
    yellow "Zachowano .env (tymczasowo)"
  fi

  if [[ -e "$DIR" ]]; then
    yellow "Usuwam istniejący katalog: ${DIR}"
    rm -rf "$DIR"
  fi

  mkdir -p "$(dirname "$DIR")"
}

clone_repo() {
  yellow "Klonuję ${REPO} → ${DIR}"
  git clone --depth 1 -b "$BRANCH" "$REPO" "$DIR"
}

restore_backups() {
  if [[ -n "${DATA_BACKUP}" && -d "${DATA_BACKUP}" ]]; then
    mkdir -p "${DIR}/data"
    cp -a "${DATA_BACKUP}/." "${DIR}/data/"
    rm -rf "${DATA_BACKUP}"
    green "Przywrócono data/"
  fi

  if [[ -n "${ENV_BACKUP}" && -f "${ENV_BACKUP}" ]]; then
    cp "${ENV_BACKUP}" "${DIR}/.env"
    rm -f "${ENV_BACKUP}"
    green "Przywrócono .env"
  fi
}

main() {
  require_git
  preserve_and_remove
  clone_repo
  restore_backups
  cd "$DIR"
  chmod +x board

  if [[ -n "${ADMIN_PASSWORD:-}" ]]; then
    exec ./board up
  fi

  if [[ -f .env ]] && grep -q '^ADMIN_PASSWORD=.' .env 2>/dev/null; then
    exec ./board up
  fi

  if [[ -t 0 ]]; then
    exec ./board up
  fi

  red "Ustaw hasło: ADMIN_PASSWORD='twoje-haslo' bash -c \"\$(curl -fsSL .../install.sh)\""
  exit 1
}

main "$@"
