#!/bin/sh
set -e

# Wolumen ./data montowany z hosta często należy do root (sudo docker).
# Kontener musi móc zapisywać JSON w /app/.data.
if [ -d /app/.data ]; then
  chown -R nextjs:nodejs /app/.data 2>/dev/null || true
fi

exec su-exec nextjs "$@"
