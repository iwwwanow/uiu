# Тема nvim — плагин из репо uiu, а не файл в dotfiles

Тема nvim живёт в uiu и подключается к nvim как обычный плагин через lazy.nvim. Генератор не пишет `~/.config/nvim/colors/` в dotfiles: так тема версионируется вместе с палитрой, и dotfiles не трогаются при каждой правке цветов. `monochrome.nvim` отключаем, override `NonText = #FF00FF` из `lua/plugins/init.lua` переезжает в тему (роль `--marker-invisible`).

Чтобы lazy видел плагин, `colors/uiu.lua` и `lua/uiu/` лежат в корне репо: lazy.nvim не умеет брать плагин из подкаталога. Эти файлы генерирует `packages/theme-gen` из `theme/*.css`, и они коммитятся, чтобы плагин работал без bun. Подключение — `{ "iwwwanow/uiu", lazy = false, priority = 1000, config = function() vim.cmd.colorscheme("uiu") end }`. На своих машинах для разработки — `dir = "~/Projects/iwwwanow_uiu"`, чтобы правки видны были без пуша. Теги semantic-release (`vX.Y.Z`) позволяют закрепить версию через `version = "*"`.

Открытый вопрос: куда генератор пишет конфиги ghostty, waybar и zellij — тоже в uiu, с подключением из dotfiles (`config-file`, `@import`, `theme`), или прямо в dotfiles.

Связано: `docs/backlog/2026-11-17_theme-generator-package.md`, `docs/backlog/2026-10-30_terminal-themes-levels-oklch.md`.
