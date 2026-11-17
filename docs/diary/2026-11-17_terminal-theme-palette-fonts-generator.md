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
- Подключено в dotfiles обычной спекой `"iwwwanow/uiu"` с GitHub (вариант с `dir` на локальный клон пользователь отверг; для разработки при нужде — `dev` в lazy), правки палитры видны после пуша и `:Lazy update`; `monochrome.nvim` и override `NonText` убраны, ветка влита в master. Иконки — `accent-interactive` (#009bff): devicons сам ставит `DevIconDefault = #6d8086` при setup и на каждый `ColorScheme`, тема его не перебивает, поэтому в dotfiles после setup — `set_default_icon(d.icon, require("uiu").colors.accent_interactive, …)`; override `#0000FF` убран.
- Живая проверка с плагинами пользователя (без monochrome, тема через `dir`): чужой цвет один — `DevIconDefault = #0000ff` из override в dotfiles; Todo* и lualine_* в палитре.

## zellij (третья часть)

- Формат тем 0.42+ взят из встроенной `pencil-light` (исходник KDL лежит строкой в бинарнике zellij 0.46): компоненты `text_*`, `ribbon_*`, `table_*`, `list_*`, `frame_*`, `exit_code_*` с base/background/emphasis_0…3, `multiplayer_user_colors`, `terminal_colors`. Выход `src/targets/zellij.ts` → `themes/zellij/uiu.kdl`, `install.sh` ставит в `~/.local/share/uiu/zellij/`.
- Разметка как на превью: бары chrome, активная вкладка и режим — `accent-interactive`, остальные плашки (вкладки, клавиши режимов) — `text-on-accent` на `text-muted`, рамка фокуса `border-strong`. Проверено скриншотами отдельной сессии `uiu-preview` (копия конфига, свой `--config-dir`; `main` не трогали). Правки по снимкам: рамка неактивной панели `border-subtle` → `text-disabled` (zellij красит линию и заголовок одним base, на GRAY-91 заголовок не читался); `emphasis_3` — клавиши (`Ctrl g`, `<ENTER>`), было ORANGE-50 → `text-strong`. По снимкам: `emphasis_0` — модификатор «Alt +», `emphasis_2` — счётчики Inbox.
- Тесты (75): снапшот, набор компонентов = встроенным темам (zellij опечатки в ключах молча пропускает), все цвета — тройки «r g b», `zellij setup --check` (ловит только синтаксис KDL в `theme_dir`, не неизвестную тему).
- Вкладки переделаны в светлые, как на превью (пользователь: тёмные плашки — не то): `ribbon_selected` — `text-strong` на `surface-base`, `ribbon_unselected` — `text-muted` на chrome, `ribbon_hover` — `text` на GRAY-91. Оказалось, tab-bar красит каждую вторую вкладку через `ribbon_hover` (без стрелок в `simplified_ui` соседние плашки иначе сливаются). Активный режим в status-bar теперь тоже белая плашка, не синяя.
- Белая полоса над баром — отступ ghostty (2pt, на экране 1.2 ≈ 2.4px), не zellij. В dotfiles `window-padding-color = extend-always`: обычный `extend` не красит по вертикали, если в крайней строке есть ячейки с фоном по умолчанию, а виджет `[ > 1 working ]` в баре zellij рисуется на нём. Над самим виджетом полоса белая — у его ячеек белый фон.
- waybar: критический заряд — `text-on-accent` на `state-error` (белым по RED-50), было красным по RED-95 и не бросалось в глаза. GTK-валидатор `style.css` принимает; вживую не видели — ноутбук заряжался.
- Подключено в dotfiles (с подтверждения пользователя): симлинк `.config/zellij/themes` → `/home/operator/.local/share/uiu/zellij`, `theme "uiu"`; проверено в отдельной сессии с настоящим конфигом. `main` подхватит после `zellij kill-session main && zellij delete-session main` — перезапуск за пользователем. Почему так: `theme_dir` не раскрывает `~` и `$HOME`; на несуществующий `theme_dir` zellij не стартует вовсе («Command Failed»). Висячий симлинк вместо стандартного каталога тем (`~/.config/zellij/themes`) и неизвестное имя темы — zellij стартует со встроенной темой, поэтому без uiu (или с другим пользователем) — встроенная тема, а не поломка.

## base16 и второстепенные программы (четвёртая часть)

- Начал было свои темы для lazygit, fzf, btop, bat — пользователь остановил: base16 охватывает больше программ, свои темы — лишнее. Итог — уровни: (1) ANSI-палитра ghostty уже покрывает терминальный софт (lazygit, fzf по умолчанию; в dotfiles `BAT_THEME=ansi`, btop `color_theme = "TTY"`); (2) `themes/base16/uiu.yaml` (tinted-theming 0.11) — мост для остального через tinty (не установлен); (3) свои темы только у nvim, zellij, ghostty, waybar. delta и vhs не установлены — не делали.
- base16: base00–07 — серая шкала от фона к тексту (base06 = base07 = GRAY-0), base08–0F — тёмные ступени акцентов, как ANSI normal. Тесты: разбор `Bun.YAML`, 16 слотов, шкала темнеет монотонно.
- Проверено по пути: lazygit и fzf падают, если файла из `LG_CONFIG_FILE` / `FZF_DEFAULT_OPTS_FILE` нет — если когда-нибудь подключать их файлами, только с проверкой в `.zshrc`.
- Вопрос пользователя «почему lazygit тёмный»: все 16 цветов ghostty заданы; TUI почти всегда рисуют ANSI normal (0–7), а это тёмные ступени (L 0.50) — базовые цвета owo на белом не читаются (GREEN ~1.3:1, ORANGE ~2:1, BLUE ~3:1). Заодно замечено: ANSI 4 и 12 — оба BLUE-DARK.

## delta и vhs (пятая часть)

- Пользователь поставил `git-delta` 0.20.1 и `vhs` 0.12.1. delta: выход `themes/delta/uiu.gitconfig` — подложки строк `state-*-bg`, изменённые слова — `state-*` на той же подложке (как `GitSigns*Inline` в nvim), синтаксис — ANSI (`syntax-theme = ansi`); в dotfiles `.gitconfig`: `[include] path = ~/.local/share/uiu/delta/uiu.gitconfig` (без файла git include молча пропускает), `core.pager = delta`, `interactive.diffFilter = delta --color-only`, `delta.paging = never` (раньше было `pager = cat` — без пейджера и осталось). Проверено скриншотом настоящего диффа. Значения с `#` в gitconfig — только в кавычках. `git config --global --get` include не читает (нужен `--includes`), обычный `git config` — читает.
- vhs: выход `themes/vhs/uiu.tape` — `Set Theme {…}` (xterm.js) и `Set FontFamily '"IosevkaTermSS 14 Nerd Font"'`. Грабли: `Source` не раскрывает `~` — только абсолютный путь в кавычках; имя шрифта для Chromium — по fontconfig (с пробелом, не `IosevkaTermSS14`), vhs вставляет его в JS в одинарных кавычках, а в CSS имя с «14» без кавычек недопустимо — поэтому внутри двойные. xterm.js рисует жирный яркими цветами (в ghostty `bold-is-bright` выключен) — ветки в `git log` выходят базовыми owo, на белом плохо. Тест — `vhs validate`. Пробная запись прошла (Chromium vhs скачивает сам).

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

- **nvim.** Подключено; посмотреть вживую: рамку overlay, `NormalNC` sunken, серые staged-знаки. `:Lazy clean` уберёт monochrome.
- base16 через tinty — когда понадобится программа вне терминала. Сценарии vhs для визуального регресса (nvim, zellij, lazygit) — по желанию.
- ~~Шаг bootstrap и защита waybar~~ — сделано: `scripts/bootstrap/12_uiu.sh` и `.config/waybar/scripts/launch.sh` + `style-fallback.css` в dotfiles, шаг прогнан на этой машине (см. `docs/backlog/2026-11-17_theme-install-infrastructure.md`). Обёртка waybar вступит в силу при следующем старте sway.
- Открытый вопрос к пользователю: «в nvim по максимуму используем разные начертания» — сделано по его скриншоту (тон + курсив), ответа, хочет ли больше начертаний, нет.
- Решить по рамке overlay после пробы в настоящем nvim.
- Пользователь не подтвердил, что ghostty после Ctrl+Shift+R выглядит правильно и что иконки в превью после сброса кеша отрисовываются.
- Старый `~/.local/share/fonts/IosevkaTermSS 14 Nerd Font.ttc` (251 МБ, gitignored в dotfiles) дублирует установленные TTF. Удаление — на усмотрение пользователя.
- Ветка `feat/terminal-theme` не влита. Локальный master на 2 коммита впереди `origin/master` (`dea2098`, `dcc4bdf` — они же в ветке), master не трогали.
- Тёмная тема — инверсией шкалы, после утверждения светлой. `docs/planning.md` в репо нет.
