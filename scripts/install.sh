#!/usr/bin/env bash
# Ставит тему uiu в постоянное место по XDG, на которое ссылаются dotfiles:
#   ~/.local/share/uiu/ghostty/uiu.conf    ← themes/ghostty/uiu.conf
#   ~/.local/share/uiu/waybar/colors.css   ← themes/waybar/colors.css
#   ~/.local/share/uiu/zellij/uiu.kdl      ← themes/zellij/uiu.kdl
#   ~/.local/share/fonts/uiu/              ← assets/fonts (scripts/install-fonts.sh)
# Место — вне каталогов stow: файлы, записанные в ~/.config/<tool>/, попали бы
# в репо dotfiles и в git-sync.
#
# Usage: scripts/install.sh [--link] [--no-fonts]
#   --link      symlink на файлы этого клона: пересобранная тема видна сразу
#               (для своих машин). Без флага — копии, не зависящие от клона.
#   --no-fonts  не ставить шрифты
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${XDG_DATA_HOME:-$HOME/.local/share}/uiu"
LINK=0
FONTS=1
for arg in "$@"; do
  case "$arg" in
    --link) LINK=1 ;;
    --no-fonts) FONTS=0 ;;
    *) echo "unknown argument: $arg" >&2; exit 2 ;;
  esac
done

# путь в themes/ : путь в $DEST
FILES=(
  "ghostty/uiu.conf"
  "waybar/colors.css"
  "zellij/uiu.kdl"
)

for rel in "${FILES[@]}"; do
  src="$REPO_ROOT/themes/$rel"
  dst="$DEST/$rel"
  [ -f "$src" ] || { echo "missing $src — run: pnpm theme:build" >&2; exit 1; }
  mkdir -p "$(dirname "$dst")"
  rm -f "$dst"
  if [ "$LINK" = 1 ]; then
    ln -s "$src" "$dst"
    echo "linked: $dst → $src"
  else
    cp "$src" "$dst"
    echo "copied: $dst"
  fi
done

if [ "$FONTS" = 1 ]; then
  "$REPO_ROOT/scripts/install-fonts.sh"
fi
