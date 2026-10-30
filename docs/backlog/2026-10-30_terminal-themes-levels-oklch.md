# Единая тема для терминала, TUI и nvim из токенов uiu

**Статус: идея с выбранным направлением, ничего не сделано.**

Хочется привести nvim, zellij, waybar и ghostty к одной теме. Сейчас они не связаны: ghostty на встроенной `Adwaita`, zellij на `pencil-light`, waybar на пяти цветах owo, у nvim своя палитра из 16 серых. Главная поломка в nvim: `NormalFloat` → `Pmenu`, а у `Pmenu`, `CursorLine` и `StatusLine` один фон `bg_alt` (#f0f0f0). Float не отличается от статуслайна, cursorline внутри float пропадает. Вторая причина — мало серых там, где живут поверхности светлой темы: в палитре nvim после #f0f0f0 (OKLCH L≈0.955) сразу #a9a9a9 (L≈0.735), у owo между WHITE и LIGHT (#e0e0e0) ничего нет.

## Паттерн

Три слоя токенов в uiu (например, `packages/theme/`): примитивы (шкала серых + RED/GREEN/BLUE/ORANGE из owo) → семантические роли (`surface.*`, `border.*`, `text.*`, `state.*`, `accent.*`) → шаблоны под каждую тулзу. Тулзы ссылаются только на роли, не на hex. Свой небольшой генератор на bun пишет конфиги в `iwwwanow_dotfiles/.config/...`, дальше stow. base16/tinted-theming как основа не подходит — нет понятий overlay/modal, — но base16 yaml можно выдавать как дополнительный выход, чтобы бесплатно получить шаблоны для lazygit, fzf, bat, delta, btop.

## Уровни

В терминале нет теней, уровень — это фон, рамка или оба. Ниже базы — фоном, выше — рамкой плюс небольшой сдвиг фона.

| Уровень | Роль | nvim | zellij / waybar / ghostty |
|---|---|---|---|
| −1 sunken | неактивное, сайдбары | `NormalNC`, дерево файлов, `StatusLineNC` | неактивная панель |
| 0 base | рабочая область | `Normal` | bg терминала |
| 1 chrome | статусбары, табы | `StatusLine`, `TabLine`, `WinBar` | статусбар zellij, waybar |
| 2 overlay | плавающие окна | `NormalFloat`, `Pmenu`, Telescope, which-key, hover | плавающие панели zellij |
| 3 modal | поверх всего | confirm, cmdline-попап, уведомления | — |

Состояния — сдвиг относительно уровня: hover/cursorline +1 ступень, выделение +2–3 ступени или BLUE; рамка активная DARK, неактивная LIGHT, как в owo.

## Шкала серых в OKLCH

OKLCH — цветовое пространство, где L соответствует воспринимаемой светлоте. Ровный шаг в hex неровен для глаза (#f0→#e0 даёт ΔL 0.048, #20→#10 — 0.071), ровный шаг по L — ровный. У серых C = 0, так что вся шкала — одно число L; hex считает генератор.

```
L 1.00 #ffffff  modal / overlay
L 0.98 #f8f8f8  base (если overlay должен быть светлее базы)
L 0.96 #f2f2f2  chrome
L 0.94 #ebebeb  sunken / hover
L 0.92 #e4e4e4  selection-subtle
L 0.90 #dedede  border-subtle
L 0.87 #d4d4d4
L 0.80 #bebebe  border
L 0.60 #808080  text-faint
L 0.50 #636363  comments
L 0.30 #2e2e2e  fg
```

Подбирать в Huetone (шкалы в OKLCH с контрастом APCA), oklch.com, Leonardo, CLI `pastel`.

## nvim

Прослойка своих групп `UiuSurface0…3`, `UiuBorder`, `UiuBorderStrong`, `UiuSel`, на них через `link` все плагинные (Telescope\*, Snacks\*, WhichKey\*, Lazy\*, Noice\*). `winhighlight` во float-окнах (`Normal:NormalFloat,CursorLine:UiuSelFloat`), `vim.o.winborder = "single"` (0.11+), `NormalNC` для уровня −1. Отладка: `:Inspect`, `:so $VIMRUNTIME/syntax/hitest.vim`, `:filter /Float\|Pmenu/ hi`, lush.nvim (`:Lushify`) + shipwright.nvim, `mini.hipatterns`.

## Остальные тулзы

- ghostty: своя тема в `~/.config/ghostty/themes/`, превью `ghostty +list-themes`, `minimum-contrast` как страховка от ANSI white на белом фоне.
- waybar: `@import` сгенерированного `colors.css`, `"reload_style_on_change": true`, `GTK_DEBUG=interactive waybar` для GTK Inspector.
- zellij: в формате тем 0.42+ цвета по компонентам (`frame_selected`, `ribbon_selected`, `table_cell_selected`…), проверять в отдельной сессии `zellij -s theme-test`, не трогая `main`.

## terminal.html — выбранный способ дизайна

Страница в uiu, где из div-ов нарисован фальшивый экран: waybar, рамка zellij, nvim со сплитом (0 и −1), Telescope (2), confirm-модалка (3), statusline (1) — всё из тех же токенов. В настоящем nvim все уровни разом не увидишь, а тут меняешь переменную и видишь всю иерархию; можно добавить ползунки L на уровень. Рядом с элементами — цифры «различимо или нет»: `fg на overlay: 14.8:1`, `overlay vs base: ΔL 0.02`, `cursorline vs overlay: ΔL 0.00`. Уровни подбираются здесь, генератор раскладывает их по конфигам, настоящие тулзы — финальная проверка.

## vhs — попробовать для регресса

vhs (charmbracelet) проигрывает терминальную сессию по `.tape`-сценарию и делает скриншоты: открыть nvim, `:vsplit`, Telescope → `Screenshot`, hover → `Screenshot`. После правки токенов прогоняешь `vhs theme.tape` и сравниваешь png с прошлыми (глазами или `compare` из ImageMagick). Рисует во встроенном терминале, не в ghostty — проверяет цвета nvim и zellij, но не рендер ghostty. Запасной вариант попроще — команда `:ThemeTest` в nvim, открывающая все уровни разом.

## Порядок

1. Шкала в Huetone → `tokens.json` + `roles.json` в uiu.
2. `terminal.html`, настройка уровней.
3. Генератор: сначала ghostty и waybar.
4. nvim: `Uiu*`-группы, `winhighlight`, `winborder`, `NormalNC`.
5. zellij, затем base16-выход для lazygit, fzf, delta.
6. `theme.tape` для vhs.
