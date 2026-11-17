#!/usr/bin/env bash
# Ставит шрифт из assets/fonts/ в систему: woff2 → TTF (без потерь, fonttools)
# в ~/.local/share/fonts/uiu/, затем fc-cache. Те же файлы, что раздаются в веб.
#
# Зависимость: fonttools с поддержкой woff2 — pipx install 'fonttools[woff]'
#
# Usage: scripts/install-fonts.sh [target-dir]   (default: ~/.local/share/fonts/uiu)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$REPO_ROOT/assets/fonts"
DEST="${1:-${XDG_DATA_HOME:-$HOME/.local/share}/fonts/uiu}"

command -v fonttools >/dev/null || {
  echo "fonttools not found: pipx install 'fonttools[woff]'" >&2
  exit 1
}

mkdir -p "$DEST"
for f in "$SRC"/*.woff2; do
  out="$DEST/$(basename "${f%.woff2}").ttf"
  fonttools ttLib.woff2 decompress -o "$out" "$f"
  echo "installed: $out"
done
cp "$SRC"/LICENSE-* "$DEST"/

fc-cache -f "$DEST"
fc-list : family style | grep -i "IosevkaTermSS 14 Nerd Font" | sort
