# 2026-11-17 — единая тема терминала: палитра, шрифт, генератор, ghostty и waybar

Большая сессия по теме для терминала, TUI и nvim из токенов uiu (идея — `docs/backlog/2026-10-30_terminal-themes-levels-oklch.md`). Договорились об инструментах и именах, собрали шкалу и роли, превью экрана, воспроизводимую сборку шрифта, генератор конфигов. ghostty и waybar уже на теме uiu. Вся работа в ветке `feat/terminal-theme` (запушена, в master не влита).

## Ключевые решения

- **Без Figma.** Превью — HTML на CSS-переменных (`theme/scale.html`, `theme/terminal.html`). Правки — в Chrome DevTools с Workspaces (изменения в Styles внешних `.css` пишутся на диск), обсуждение — по `git diff`. Статику отдаёт сервис `preview` в `docker-compose.yml` (nginx, порт 8765, `Cache-Control: no-store` из `docker/preview.conf`).
- **Источник правды — CSS, без JSON.** `theme/palette.css` — примитивы, `theme/roles.css` — роли. Программы ссылаются только на роли. В `index.css` тема пока не подключена.
- **Имена примитивов: число = OKLCH L×100**, верхний регистр: `--GRAY-100 … --GRAY-0` (98, 96, 94, 91, 85, 72, 58, 44, 28). Ступени, равные токенам owo, записаны точным hex owo, новые — через `oklch()`. Из старой палитры owo добавлены `--GRAY-28` (#292929) и `--MAGENTA` (#f0f). У акцентов по три ступени: `-50` (текст, ANSI normal), база owo (ANSI bright), `-95` (подложки). `BLUE-DARK` уже на L 0.50, у него только `-95`. Унификация с токенами owo — `docs/backlog/2026-11-17_unify-gray-scale-owo-tokens.md`.
- **Роли:** уровни поверхностей −1 sunken / 0 base / 1 chrome / 2 overlay / 3 modal, рамки, текст, синтаксис, выделение и поиск, состояния (знак — тёмная ступень, подложка — светлая), маркеры, ANSI 16.
- **nvim — цвет по минимуму**, как в нынешнем monochrome.nvim: ключевые слова, типы и комментарии — GRAY-72 (комментарии курсивом), остальное — GRAY-28, жирного в коде нет. Цвет только у состояний: added — GREEN, changed — BLUE, removed и error — RED, warning — только ORANGE, hint — GRAY-72. MAGENTA — только маркер конца строки (`NonText`), точки отступа — GRAY-85. Подложки git-строк — только в diff, в обычном буфере — только знак.
- **Терминал — полная ANSI-палитра:** normal = тёмные ступени, bright = базовые цвета owo; yellow → ORANGE, cyan → BLUE, blue → BLUE-DARK. Монохромный вариант пробовали — пользователю не понравилось.
- **Рамки как в терминале:** рамка занимает клетку, линия идёт по её середине, заголовок лежит на линии (zellij, `winborder = "single"`). Рамка overlay пока GRAY-44, как на превью. Пользователю тёмная не нравилась, но решил сначала попробовать так. Альтернатива — GRAY-85 при фоне 96.
- **Шрифт** — `IosevkaTermSS14 Nerd Font`, пять начертаний: Regular, Bold, Italic, Bold Italic (их берёт ghostty через fontconfig — Italic, не Oblique) и Light Italic (h6 в owo). Полный набор иконок Nerd, woff2 в git (~7 МБ, без LFS), те же файлы для веба и для системы. В uiu шрифт стоит у `code` и `kbd`: это расхождение с owo в `scripts/owo-deviations.css`, закрывает баг «Roboto Mono не загружается».
- **Генератор** — `packages/theme-gen` (bun, без зависимостей), выходы коммитятся в `themes/`. Решения по пакету — `docs/backlog/2026-11-17_theme-generator-package.md`.
- **Тема nvim — плагин из этого репо** (lazy.nvim, `colors/uiu.lua` и `lua/uiu/` в корне, генерируются), `monochrome.nvim` отключаем — `docs/backlog/2026-11-17_nvim-theme-as-plugin.md`.
- **Установка:** dotfiles ссылаются на `~/.local/share/uiu/`, а не на клон. `scripts/install.sh [--link]` кладёт туда темы, шрифты — в `~/.local/share/fonts/uiu/`. Запускать будет шаг bootstrap в dotfiles — `docs/backlog/2026-11-17_theme-install-infrastructure.md`.

## Что сделано

- `theme/palette.css`, `theme/roles.css`. `theme/scale.html` — образцы с живыми подписями (значение, hex, L) и проверкой «= токен owo». `theme/terminal.html` — два фальшивых экрана: waybar + zellij + nvim (дерево, редактор, statusline, hover, completion, неактивная панель shell с ANSI) и Telescope из трёх окон под confirm-модалкой.
- `scripts/build-fonts.sh` — воспроизводимая сборка: Iosevka 32.5.0 (PkgTTF-IosevkaTermSS14) и Nerd Fonts FontPatcher 3.3.0 с закреплёнными sha256, патчинг `--complete` в `debian:bookworm-slim` (закреплён по digest), `SOURCE_DATE_EPOCH`. Две сборки подряд дали байт-в-байт одинаковые файлы. Набор символов (17 803) и ширины совпадают с прежним локальным `.ttc`. `scripts/install-fonts.sh` переводит woff2 в TTF и кладёт в `~/.local/share/fonts/uiu`.
- `sync-owo.sh` поднимает `@import` из `owo-deviations.css` в начало `owo.css`. В owo-заметке `docs/backlog/2026-10-24_roboto-mono-not-loaded.md` (репо owo) дописано, что в uiu решено через Iosevka. Правка в owo не закоммичена.
- `packages/theme-gen`: `src/color.ts` (OKLCH ↔ sRGB по матрицам CSS Color 4, контраст WCAG), `src/css.ts` (переменные и цепочки `var()`), `src/theme.ts`, выходы `themes/ghostty/uiu.conf` и `themes/waybar/colors.css`, CLI с `--check`. Скрипты в корневом `package.json`: `theme:build`, `theme:check`, `theme:test`.
- Тесты — 60, все проходят:
  - математика цвета, в том числе эталон hex из Chromium для всех 28 ступеней (`test/fixtures/chrome-hex.json`);
  - разбор `var()` и циклов;
  - палитра в гамме sRGB;
  - имя ступени = L×100;
  - ступени-зеркала равны `owo.css`;
  - в ролях нет литералов;
  - контраст: текст ≥ 7 на всех поверхностях, состояния ≥ 4.5 на base;
  - ΔL уровней;
  - снапшоты;
  - `ghostty +validate-config`;
  - разбор `colors.css` через Gtk.CssProvider (`test/gtk-validate.py`);
  - закоммиченные выходы не устарели.
- `scripts/install.sh --link` выполнен на этой машине. dotfiles (уже закоммичено git-sync):
  - ghostty: `theme="Adwaita"` → `config-file = ?~/.local/share/uiu/ghostty/uiu.conf` (`+show-config` показывает цвета uiu);
  - waybar: шрифт → SS14, `style.css` переписан на `@uiu_*` с `@import`, бар светлый, после SIGUSR2 проверен скриншотом.

## nvim (вторая часть сессии)

- Перечень групп сначала собрали целиком: разбор пяти разделов справки (`highlight-groups`, `group-name`, treesitter, LSP, diagnostic) и снимок 290 групп семи плагинов. Потом урезали: разбор справки хрупкий и не нужен, хватает снимка `nvim --clean` (`packages/theme-gen/data/nvim-builtin.json`, 384 группы со ссылками по умолчанию, `pnpm --filter theme-gen nvim:snapshot`). Почти все группы плагинов — ссылки на базовые; группы со своими hex или ссылкой на `NonText` записаны прямо в `test/nvim.test.ts` (`PLUGIN_GROUPS`). Снимок плагинов — изредка, руками: `scripts/nvim-hl-snapshot.lua` с `g:uiu_user`.
- Выход генератора `src/targets/nvim.ts`: `colors/uiu.lua`, `lua/uiu/init.lua` (роли → hex, ~120 групп, терминальные цвета, `load()`), `lua/lualine/themes/uiu.lua` (lualine с `theme = "auto"` берёт её по `g:colors_name`; все режимы одним акцентом `accent-interactive`). Задаём базовые группы и всё, что по умолчанию со своими цветами; остальное держится на встроенных ссылках.
- Решения по ходу: `NormalNC` — sunken; Telescope — уровень overlay (`NormalFloat`, `FloatBorder`, выбор как `PmenuSel`); staged-знаки gitsigns — серым (`state-hint`): gitsigns смешивает их из обычных знаков в цвета вне палитры, а светлых ступеней акцентов с нормальным контрастом нет; `LspInlayHint`, `LspCodeLens`, blame, счётчик Telescope, `ComplHint` по умолчанию ссылались на `NonText` — перекрыты, MAGENTA остался только у конца строки; `DiagnosticUnderline*` — undercurl; `MatchParen` — подчёркивание и `text-strong`; `DevIconDefault` — `accent-interactive`.
- todo-comments пересчитывает `TodoFg/Bg/Sign*` из `Diagnostic*`/`Identifier` по `ColorScheme`, тема их не задаёт. cmp ставит `CmpItem*Default` без `default = true` — перекрываем группы над ними.
- Тесты (70, все проходят): после ссылок каждая группа (встроенные + `PLUGIN_GROUPS`) заканчивается цветом темы; `marker-invisible` только у `NonText`; ссылки темы ведут на известные группы; нет жирного; снапшот; `colorscheme uiu` в `nvim --clean --headless` без ошибок и все hex — из ролей; `data/nvim-builtin.json` совпадает с установленным nvim (упадёт при обновлении nvim — перезапустить снимок и смотреть diff).
- Живая проверка с плагинами пользователя (без monochrome, тема через `dir`): чужой цвет один — `DevIconDefault = #0000ff` из override в dotfiles; Todo* и lualine_* в палитре.

## Подводные камни

- ghostty раскрывает `~/` в `config-file`, `$HOME` — нет. Проверено на 1.4.
- GTK: относительный `@import` из `style.css` разрешается от места ссылки stow (`~/.config/waybar/`). Отсутствующий импортированный файл роняет весь CSS. `/*` внутри комментария — ошибка, и весь файл отбрасывается.
- `white-space: pre` на всех элементах превращает переносы строк разметки в пустые строки. Во flex-строках пробелы между span пропадают. Строки терминала — block с `pre`, контейнеры — normal.
- Символы Nerd из Private Use Area при записи файлов теряются — в HTML писать их entity (`&#xf07c;`).
- `owo.css` переопределяет переменные в `@media` — для него `parseVars(..., { firstWins: true })`.
- Chrome кешировал старый `owo.css` без `@import` шрифта (nginx отдавал без `Cache-Control`) — иконки были квадратами. Лечится `no-store` в preview и Ctrl+Shift+R. Подтверждения от пользователя после правки ещё нет.
- Нельзя править bash-скрипт, пока он выполняется: bash читает его по ходу.
- `nerdfonts/patcher` в Docker Hub версионируется своими номерами (4.x), не как Nerd Fonts, поэтому берём официальный `FontPatcher.zip` и fontforge из debian.
- `pipx run` (скачивание fonttools) не прошёл проверку разрешений. Пользователь поставил `pipx install 'fonttools[woff]'`, интерпретатор — `~/.local/pipx/venvs/fonttools/bin/python`.
- Снимок групп плагинов через обычный `init.lua` + `colorscheme default` загрязнён: группы темы остаются пустыми (`{}`), и плагины с `default = true` их уже не заполняют. Скрипт снимка ставится вместо `init.lua` (`-u`) и собирает спеку lazy без темы. `lazy.setup` из `-c luafile` после `-u NONE` не работает (`Config.headless` nil) — только как init.
- Смена `'background'` при заданном `g:colors_name` перезагружает тему — в `load()` имя сбрасывается до смены фона.
- Сборка шрифта идёт ~9.5 минут: FontForge патчит в один поток, начертания по очереди. Можно распараллелить.

## Остаток

- **nvim.** Тема готова, но не подключена: в dotfiles заменить `monochrome.nvim` на `{ dir = "~/Projects/iwwwanow_uiu", name = "uiu", lazy = false, priority = 1000, config = function() vim.cmd.colorscheme("uiu") end }` (или `"iwwwanow/uiu"` после влития), убрать override `NonText` и, по желанию, `DevIconDefault = #0000FF`. Посмотреть вживую: рамку overlay, `NormalNC` sunken, серые staged-знаки.
- zellij (тема в `~/.local/share/uiu/zellij/`), base16-выход для lazygit, fzf, delta, bat, btop, `theme.tape` для vhs.
- Шаг bootstrap `NN_uiu.sh` в dotfiles. Защита waybar от отсутствующего `colors.css`.
- Открытый вопрос к пользователю: «в nvim по максимуму используем разные начертания» — сделано по его скриншоту (тон + курсив), ответа, хочет ли больше начертаний, нет.
- Решить по рамке overlay после пробы в настоящем nvim.
- Пользователь не подтвердил, что ghostty после Ctrl+Shift+R выглядит правильно и что иконки в превью после сброса кеша отрисовываются.
- Старый `~/.local/share/fonts/IosevkaTermSS 14 Nerd Font.ttc` (251 МБ, gitignored в dotfiles) дублирует установленные TTF. Удаление — на усмотрение пользователя.
- Ветка `feat/terminal-theme` не влита. Локальный master на 2 коммита впереди `origin/master` (`dea2098`, `dcc4bdf` — они же в ветке), master не трогали.
- Тёмная тема — инверсией шкалы, после утверждения светлой. `docs/planning.md` в репо нет.
