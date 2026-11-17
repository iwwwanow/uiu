#!/usr/bin/env bash
# Ставит тему uiu в постоянное место по XDG, на которое ссылаются dotfiles:
#   ~/.local/share/uiu/ghostty/uiu.conf    ← themes/ghostty/uiu.conf
#   ~/.local/share/uiu/waybar/colors.css   ← themes/waybar/colors.css
#   ~/.local/share/uiu/zellij/uiu.kdl      ← themes/zellij/uiu.kdl
#   ~/.local/share/uiu/base16/uiu.yaml     ← themes/base16/uiu.yaml (для tinty)
#   ~/.local/share/uiu/delta/uiu.gitconfig ← themes/delta/uiu.gitconfig ([include] в .gitconfig)
#   ~/.local/share/uiu/vhs/uiu.tape        ← themes/vhs/uiu.tape (Source в сценариях vhs)
#   ~/.local/share/uiu/tofi/uiu.conf       ← themes/tofi/uiu.conf (include в конфиге tofi)
#   ~/.local/share/uiu/dunst/uiu.conf      ← themes/dunst/uiu.conf (симлинк в dunstrc.d/)
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
  "base16/uiu.yaml"
  "delta/uiu.gitconfig"
  "vhs/uiu.tape"
  "tofi/uiu.conf"
  "dunst/uiu.conf"
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
